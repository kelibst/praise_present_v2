import fs from 'fs';
import path from 'path';
import { getDatabase } from './database';

interface BibleVerse {
  book_name: string;
  book: number;
  chapter: number;
  verse: number;
  text: string;
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
  { name: 'KJV', fullName: 'King James Version', filename: 'kjv.json', description: 'The King James Version of the Bible', year: 1611, publisher: 'Various' },
  { name: 'ASV', fullName: 'American Standard Version', filename: 'asv.json', description: 'The American Standard Version of the Bible', year: 1901, publisher: 'American Standard Version Committee' },
  { name: 'ASVS', fullName: 'American Standard Version with Strong\'s Numbers', filename: 'asvs.json', description: 'ASV with Strong\'s concordance numbers', year: 1901, publisher: 'American Standard Version Committee' },
  { name: 'WEB', fullName: 'World English Bible', filename: 'web.json', description: 'The World English Bible', year: 2000, publisher: 'Rainbow Missions' },
  { name: 'NET', fullName: 'New English Translation', filename: 'net.json', description: 'The NET Bible', year: 2005, publisher: 'Biblical Studies Press' },
  { name: 'Geneva', fullName: 'Geneva Bible', filename: 'geneva.json', description: 'The Geneva Bible (1599)', year: 1599, publisher: 'Various' },
  { name: 'Bishops', fullName: 'Bishops\' Bible', filename: 'bishops.json', description: 'The Bishops\' Bible (1568)', year: 1568, publisher: 'Church of England' },
  { name: 'Coverdale', fullName: 'Coverdale Bible', filename: 'coverdale.json', description: 'The Coverdale Bible (1535)', year: 1535, publisher: 'Miles Coverdale' },
  { name: 'Tyndale', fullName: 'Tyndale Bible', filename: 'tyndale.json', description: 'The Tyndale Bible', year: 1526, publisher: 'William Tyndale' },
  { name: 'KJV_Strongs', fullName: 'King James Version with Strong\'s Numbers', filename: 'kjv_strongs.json', description: 'KJV with Strong\'s concordance numbers', year: 1611, publisher: 'Various' },
];

export class BibleImporter {
  private db = getDatabase();
  private databasePath: string;

  constructor() {
    this.databasePath = path.join(process.cwd(), 'src', 'database');
  }

  /**
   * Import all available Bible versions
   */
  async importAllVersions(): Promise<void> {
    console.log('Starting Bible import process...');
    
    // Ensure English translation exists
    const englishTranslation = await this.ensureEnglishTranslation();
    
    for (const version of AVAILABLE_VERSIONS) {
      try {
        await this.importVersion(version, englishTranslation.id);
        console.log(`✓ Successfully imported ${version.fullName}`);
      } catch (error) {
        console.error(`✗ Failed to import ${version.fullName}:`, error);
      }
    }
    
    console.log('Bible import process completed.');
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
   * Import a specific Bible version
   */
  async importVersion(versionInfo: VersionInfo, translationId: string): Promise<void> {
    const jsonPath = path.join(this.databasePath, 'json', versionInfo.filename);
    
    // Check if file exists
    if (!fs.existsSync(jsonPath)) {
      throw new Error(`Bible file not found: ${jsonPath}`);
    }

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
      // Create version record
      version = await this.db.version.create({
        data: {
          name: versionInfo.name,
          fullName: versionInfo.fullName,
          translationId: translationId,
          description: versionInfo.description,
          isDefault: versionInfo.name === 'KJV',
          year: versionInfo.year,
          publisher: versionInfo.publisher,
        },
      });
    }

    // Read and parse JSON file
    console.log(`Reading ${versionInfo.filename}...`);
    const jsonData = fs.readFileSync(jsonPath, 'utf8');
    const verses: BibleVerse[] = JSON.parse(jsonData);

    console.log(`Importing ${verses.length} verses for ${versionInfo.fullName}...`);

    // Import verses in batches for better performance
    const batchSize = 1000;
    for (let i = 0; i < verses.length; i += batchSize) {
      const batch = verses.slice(i, i + batchSize);
      
      const verseData = batch.map(verse => ({
        bookId: verse.book,
        chapter: verse.chapter,
        verse: verse.verse,
        text: verse.text,
        versionId: version.id,
      }));

      try {
        await this.db.verse.createMany({
          data: verseData,
        });
      } catch (error) {
        // Some verses might already exist, which is fine
        console.log(`  Some verses in batch ${i / batchSize + 1} already exist, continuing...`);
      }

      // Show progress
      const progress = Math.min(i + batchSize, verses.length);
      const percentage = ((progress / verses.length) * 100).toFixed(1);
      console.log(`  Progress: ${progress}/${verses.length} (${percentage}%)`);
    }
  }

  /**
   * Import a single version by name
   */
  async importSingleVersion(versionName: string): Promise<void> {
    const version = AVAILABLE_VERSIONS.find(v => v.name === versionName);
    if (!version) {
      throw new Error(`Version not found: ${versionName}`);
    }

    const englishTranslation = await this.ensureEnglishTranslation();
    await this.importVersion(version, englishTranslation.id);
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

  // Legacy method names for backward compatibility
  async importAllTranslations(): Promise<void> {
    return this.importAllVersions();
  }

  async importSingleTranslation(translationName: string): Promise<void> {
    return this.importSingleVersion(translationName);
  }

  getAvailableTranslations(): VersionInfo[] {
    return this.getAvailableVersions();
  }

  async getImportedTranslations(): Promise<string[]> {
    return this.getImportedVersions();
  }
}

// Export a singleton instance
export const bibleImporter = new BibleImporter(); 