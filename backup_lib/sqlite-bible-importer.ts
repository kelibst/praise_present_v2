import fs from 'fs';
import path from 'path';
import { getDatabase } from './database';

interface BibleMeta {
  name: string;
  shortname: string;
  module: string;
  year?: string;
  publisher?: string;
}

interface VersionInfo {
  name: string;
  fullName: string;
  filename: string;
  description?: string;
  year?: number;
  publisher?: string;
}

// Available Bible versions with their metadata
const AVAILABLE_VERSIONS: VersionInfo[] = [
  { name: 'KJV', fullName: 'King James Version', filename: 'kjv.sqlite', description: 'The King James Version of the Bible', year: 1611, publisher: 'Various' },
  { name: 'ASV', fullName: 'American Standard Version', filename: 'asv.sqlite', description: 'The American Standard Version of the Bible', year: 1901, publisher: 'American Standard Version Committee' },
  { name: 'ASVS', fullName: 'American Standard Version with Strong\'s Numbers', filename: 'asvs.sqlite', description: 'ASV with Strong\'s concordance numbers', year: 1901, publisher: 'American Standard Version Committee' },
  { name: 'WEB', fullName: 'World English Bible', filename: 'web.sqlite', description: 'The World English Bible', year: 2000, publisher: 'Rainbow Missions' },
  { name: 'NET', fullName: 'New English Translation', filename: 'net.sqlite', description: 'The NET Bible', year: 2005, publisher: 'Biblical Studies Press' },
  { name: 'Geneva', fullName: 'Geneva Bible', filename: 'geneva.sqlite', description: 'The Geneva Bible (1599)', year: 1599, publisher: 'Various' },
  { name: 'Bishops', fullName: 'Bishops\' Bible', filename: 'bishops.sqlite', description: 'The Bishops\' Bible (1568)', year: 1568, publisher: 'Church of England' },
  { name: 'Coverdale', fullName: 'Coverdale Bible', filename: 'coverdale.sqlite', description: 'The Coverdale Bible (1535)', year: 1535, publisher: 'Miles Coverdale' },
  { name: 'Tyndale', fullName: 'Tyndale Bible', filename: 'tyndale.sqlite', description: 'The Tyndale Bible', year: 1526, publisher: 'William Tyndale' },
  { name: 'KJV_Strongs', fullName: 'King James Version with Strong\'s Numbers', filename: 'kjv_strongs.sqlite', description: 'KJV with Strong\'s concordance numbers', year: 1611, publisher: 'Various' },
];

export class SQLiteBibleImporter {
  private db = getDatabase();
  private databasePath: string;

  constructor() {
    this.databasePath = path.join(process.cwd(), 'src', 'database');
  }

  /**
   * Import all available Bible versions using SQLite direct connection
   */
  async importAllVersions(): Promise<void> {
    console.log('Starting SQLite Bible import process...');
    
    // Ensure English translation exists
    const englishTranslation = await this.ensureEnglishTranslation();
    
    for (const version of AVAILABLE_VERSIONS) {
      try {
        await this.importVersionFromSQLite(version, englishTranslation.id);
        console.log(`✓ Successfully imported ${version.fullName}`);
      } catch (error) {
        console.error(`✗ Failed to import ${version.fullName}:`, error);
      }
    }
    
    console.log('SQLite Bible import process completed.');
  }

  /**
   * Ensure English translation exists and return it
   */
  private async ensureEnglishTranslation() {
    let englishTranslation = await this.db.translation.findUnique({
      where: { code: 'en' }
    });

    if (!englishTranslation) {
      englishTranslation = await this.db.translation.create({
        data: {
          name: 'English',
          code: 'en',
          description: 'English language',
          isDefault: true,
        },
      });
    }

    return englishTranslation;
  }

  /**
   * Import a specific Bible version from SQLite file
   */
  async importVersionFromSQLite(versionInfo: VersionInfo, translationId: string): Promise<void> {
    const sqlitePath = path.join(this.databasePath, 'sqlite', versionInfo.filename);
    
    // Check if file exists
    if (!fs.existsSync(sqlitePath)) {
      throw new Error(`SQLite Bible file not found: ${sqlitePath}`);
    }

    // Read metadata from the SQLite file
    const metaData = await this.readSQLiteMetadata(sqlitePath);
    
    // Check if version already exists
    let version = await this.db.version.findFirst({
      where: { 
        name: versionInfo.name,
        translationId: translationId
      }
    });

    if (version) {
      // Check if verses already exist for this version
      const verseCount = await this.db.verse.count({
        where: { versionId: version.id }
      });
      
      if (verseCount > 0) {
        console.log(`Version ${versionInfo.name} already exists with ${verseCount} verses, skipping...`);
        return;
      } else {
        console.log(`Version ${versionInfo.name} exists but has no verses, importing verses...`);
      }
    } else {
      // Create version record with metadata from SQLite file
      version = await this.db.version.create({
        data: {
          name: versionInfo.name,
          fullName: metaData.name || versionInfo.fullName,
          translationId: translationId,
          description: versionInfo.description,
          isDefault: versionInfo.name === 'KJV',
          year: metaData.year ? parseInt(metaData.year.split('/')[0]) : versionInfo.year,
          publisher: metaData.publisher || versionInfo.publisher,
        },
      });
    }

    console.log(`Importing verses for ${versionInfo.fullName} from SQLite...`);
    
    // Import verses directly from SQLite using efficient batch operations
    await this.importVersesFromSQLite(sqlitePath, version.id);
  }

  /**
   * Read metadata from SQLite file
   */
  private async readSQLiteMetadata(sqlitePath: string): Promise<BibleMeta> {
    return new Promise((resolve, reject) => {
      const sqlite3 = require('sqlite3').verbose();
      const db = new sqlite3.Database(sqlitePath, sqlite3.OPEN_READONLY, (err: any) => {
        if (err) {
          reject(err);
          return;
        }
      });

      const meta: Partial<BibleMeta> = {};
      
      db.all('SELECT field, value FROM meta', (err: any, rows: any[]) => {
        if (err) {
          reject(err);
          return;
        }

        rows.forEach(row => {
          switch (row.field) {
            case 'name':
              meta.name = row.value;
              break;
            case 'shortname':
              meta.shortname = row.value;
              break;
            case 'module':
              meta.module = row.value;
              break;
            case 'year':
              meta.year = row.value;
              break;
            case 'publisher':
              meta.publisher = row.value;
              break;
          }
        });

        db.close((err: any) => {
          if (err) {
            reject(err);
          } else {
            resolve(meta as BibleMeta);
          }
        });
      });
    });
  }

  /**
   * Import verses from SQLite file using efficient bulk operations
   */
  private async importVersesFromSQLite(sqlitePath: string, versionId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const sqlite3 = require('sqlite3').verbose();
      const sourceDb = new sqlite3.Database(sqlitePath, sqlite3.OPEN_READONLY, (err: any) => {
        if (err) {
          reject(err);
          return;
        }
      });

      // Get count first for progress tracking
      sourceDb.get('SELECT COUNT(*) as count FROM verses', async (err: any, row: any) => {
        if (err) {
          reject(err);
          return;
        }

        const totalVerses = row.count;
        console.log(`  Found ${totalVerses} verses to import`);

        let importedCount = 0;
        const batchSize = 5000;
        const batches: any[] = [];

        // Read all verses in batches
        sourceDb.all('SELECT book, chapter, verse, text FROM verses ORDER BY book, chapter, verse', async (err: any, rows: any[]) => {
          if (err) {
            reject(err);
            return;
          }

          // Process in batches
          for (let i = 0; i < rows.length; i += batchSize) {
            const batch = rows.slice(i, i + batchSize);
            
            const verseData = batch.map(verse => ({
              bookId: verse.book,
              chapter: verse.chapter,
              verse: verse.verse,
              text: verse.text,
              versionId: versionId,
            }));

            try {
              await this.db.verse.createMany({
                data: verseData,
              });

              importedCount += batch.length;
              const percentage = ((importedCount / totalVerses) * 100).toFixed(1);
              console.log(`  Progress: ${importedCount}/${totalVerses} (${percentage}%)`);
            } catch (error) {
              console.error(`  Error importing batch ${i / batchSize + 1}:`, error);
              // Continue with next batch instead of failing entirely
            }
          }

          sourceDb.close((err: any) => {
            if (err) {
              console.error('Error closing source database:', err);
            }
            resolve();
          });
        });
      });
    });
  }

  /**
   * Import a single version by name from SQLite
   */
  async importSingleVersionFromSQLite(versionName: string): Promise<void> {
    const version = AVAILABLE_VERSIONS.find(v => v.name === versionName);
    if (!version) {
      throw new Error(`Version not found: ${versionName}`);
    }

    const englishTranslation = await this.ensureEnglishTranslation();
    await this.importVersionFromSQLite(version, englishTranslation.id);
  }

  /**
   * Get list of available versions
   */
  getAvailableVersions(): VersionInfo[] {
    return AVAILABLE_VERSIONS;
  }

  /**
   * Check which versions are already imported
   */
  async getImportedVersions(): Promise<string[]> {
    const versions = await this.db.version.findMany({
      select: { name: true }
    });
    return versions.map((v: { name: string }) => v.name);
  }

  /**
   * Get import statistics
   */
  async getImportStats(): Promise<{ [key: string]: number }> {
    const stats: { [key: string]: number } = {};
    
    const versions = await this.db.version.findMany({
      include: {
        _count: {
          select: { verses: true }
        }
      }
    });

    for (const version of versions) {
      stats[version.name] = version._count.verses;
    }

    return stats;
  }

  /**
   * Verify data integrity after import
   */
  async verifyImport(versionName: string): Promise<boolean> {
    const version = await this.db.version.findFirst({
      where: { name: versionName },
      include: {
        _count: {
          select: { verses: true }
        }
      }
    });

    if (!version) {
      console.error(`Version ${versionName} not found`);
      return false;
    }

    const verseCount = version._count.verses;
    console.log(`${versionName} has ${verseCount} verses`);

    // Expected verse counts for validation
    const expectedCounts: { [key: string]: number } = {
      'KJV': 31102,
      'ASV': 31086,
      'WEB': 31086,
      'NET': 31086,
    };

    const expectedCount = expectedCounts[versionName];
    if (expectedCount && Math.abs(verseCount - expectedCount) > 100) {
      console.warn(`Warning: ${versionName} has ${verseCount} verses, expected around ${expectedCount}`);
    }

    // Check for missing books
    const books = await this.db.book.findMany({
      include: {
        _count: {
          select: {
            verses: {
              where: { versionId: version.id }
            }
          }
        }
      }
    });

    const missingBooks = books.filter((book: any) => book._count.verses === 0);
    if (missingBooks.length > 0) {
      console.warn(`Missing verses for books: ${missingBooks.map((b: any) => b.name).join(', ')}`);
      return false;
    }

    console.log(`✓ ${versionName} import verification passed`);
    return true;
  }

  /**
   * Create basic topics for scripture search
   */
  async createBasicTopics(): Promise<void> {
    const basicTopics = [
      { name: 'Love', description: 'Verses about love and loving others' },
      { name: 'Faith', description: 'Verses about faith and believing' },
      { name: 'Hope', description: 'Verses about hope and trust' },
      { name: 'Peace', description: 'Verses about peace and tranquility' },
      { name: 'Joy', description: 'Verses about joy and happiness' },
      { name: 'Forgiveness', description: 'Verses about forgiveness and mercy' },
      { name: 'Salvation', description: 'Verses about salvation and redemption' },
      { name: 'Prayer', description: 'Verses about prayer and communication with God' },
      { name: 'Wisdom', description: 'Verses about wisdom and understanding' },
      { name: 'Strength', description: 'Verses about strength and courage' },
      { name: 'Comfort', description: 'Verses about comfort in times of trouble' },
      { name: 'Guidance', description: 'Verses about divine guidance and direction' },
      { name: 'Thanksgiving', description: 'Verses about gratitude and thanksgiving' },
      { name: 'Worship', description: 'Verses about worship and praise' },
      { name: 'Service', description: 'Verses about serving others and ministry' },
    ];

    for (const topicData of basicTopics) {
      await this.db.topic.upsert({
        where: { name: topicData.name },
        update: {},
        create: topicData,
      });
    }

    console.log('✓ Basic topics created');
  }

  /**
   * Alternative method using SQLite ATTACH for ultra-fast imports
   * This method directly attaches the source SQLite file and copies data
   */
  async importVersionUsingSQLiteAttach(versionInfo: VersionInfo, translationId: string): Promise<void> {
    const sqlitePath = path.join(this.databasePath, 'sqlite', versionInfo.filename);
    
    if (!fs.existsSync(sqlitePath)) {
      throw new Error(`SQLite Bible file not found: ${sqlitePath}`);
    }

    // Read metadata first
    const metaData = await this.readSQLiteMetadata(sqlitePath);
    
    // Check if version already exists
    let version = await this.db.version.findFirst({
      where: { 
        name: versionInfo.name,
        translationId: translationId
      }
    });

    if (!version) {
      version = await this.db.version.create({
        data: {
          name: versionInfo.name,
          fullName: metaData.name || versionInfo.fullName,
          translationId: translationId,
          description: versionInfo.description,
          isDefault: versionInfo.name === 'KJV',
          year: metaData.year ? parseInt(metaData.year.split('/')[0]) : versionInfo.year,
          publisher: metaData.publisher || versionInfo.publisher,
        },
      });
    }

    console.log(`Using SQLite ATTACH method for ${versionInfo.fullName}...`);
    
    // Use raw SQL with ATTACH for ultra-fast copying
    try {
      await this.db.$executeRawUnsafe(`ATTACH DATABASE '${sqlitePath}' AS bible_source`);
      
      // Copy verses using a single SQL statement
      await this.db.$executeRawUnsafe(`
        INSERT OR IGNORE INTO verses (id, bookId, chapter, verse, text, versionId)
        SELECT 
          lower(hex(randomblob(16))), 
          book, 
          chapter, 
          verse, 
          text, 
          '${version.id}'
        FROM bible_source.verses
      `);
      
      await this.db.$executeRawUnsafe(`DETACH DATABASE bible_source`);
      
      // Get count for verification
      const verseCount = await this.db.verse.count({
        where: { versionId: version.id }
      });
      
      console.log(`✓ Imported ${verseCount} verses using SQLite ATTACH method`);
      
    } catch (error) {
      console.error('SQLite ATTACH method failed, falling back to batch import:', error);
      // Fallback to the standard batch import method
      await this.importVersesFromSQLite(sqlitePath, version.id);
    }
  }
}

// Export a singleton instance
export const sqliteBibleImporter = new SQLiteBibleImporter(); 