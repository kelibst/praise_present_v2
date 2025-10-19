/**
 * Scripture Navigation Metadata Population Script
 *
 * This script populates the prospective navigation metadata for all Bible verses.
 * It assigns sequential globalIndex values and pre-computes all navigation relationships.
 *
 * This is a ONE-TIME operation that needs to run after schema migration.
 * Once completed, all scripture navigation will use O(1) direct ID lookups.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface NavigationMetadata {
  verseId: string;
  globalIndex: number;
  previousId: string | null;
  nextId: string | null;
  chapterFirstVerseId: string | null;
  chapterLastVerseId: string | null;
  bookFirstVerseId: string | null;
  bookLastVerseId: string | null;
}

async function populateVerseNavigation() {
  console.log('🚀 Starting verse navigation metadata population...\n');

  try {
    // Get all versions to process each separately
    const versions = await prisma.version.findMany({
      include: {
        translation: true
      }
    });

    console.log(`📚 Found ${versions.length} Bible version(s) to process\n`);

    for (const version of versions) {
      console.log(`\n📖 Processing: ${version.fullName} (${version.name})`);
      console.log(`   Translation: ${version.translation.name}`);

      await processVersion(version.id);
    }

    console.log('\n✅ Navigation metadata population completed successfully!');
    console.log('🎯 All verses now have instant O(1) navigation lookups.');

  } catch (error) {
    console.error('❌ Error populating navigation metadata:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function processVersion(versionId: string) {
  // Get all books in order
  const books = await prisma.book.findMany({
    orderBy: { order: 'asc' }
  });

  let globalIndex = 1;
  const navigationMetadata: NavigationMetadata[] = [];

  // Track verse IDs for linking
  let previousVerseId: string | null = null;

  // Track chapter and book boundaries
  const chapterFirstVerseMap = new Map<string, string>(); // "bookId-chapter" -> firstVerseId
  const chapterLastVerseMap = new Map<string, string>(); // "bookId-chapter" -> lastVerseId
  const bookFirstVerseMap = new Map<number, string>(); // bookId -> firstVerseId
  const bookLastVerseMap = new Map<number, string>(); // bookId -> lastVerseId

  console.log(`   Processing ${books.length} books...`);

  // First pass: Collect all verses and determine boundaries
  for (const book of books) {
    const bookKey = book.id;
    let bookFirstVerseId: string | null = null;
    let bookLastVerseId: string | null = null;

    // Get all chapters for this book
    const maxChapter = book.chapters;

    for (let chapter = 1; chapter <= maxChapter; chapter++) {
      const chapterKey = `${bookKey}-${chapter}`;

      // Get all verses for this chapter, ordered by verse number
      const verses = await prisma.verse.findMany({
        where: {
          versionId: versionId,
          bookId: bookKey,
          chapter: chapter
        },
        orderBy: { verse: 'asc' }
      });

      if (verses.length === 0) continue;

      // Track chapter boundaries
      const chapterFirstVerseId = verses[0].id;
      const chapterLastVerseId = verses[verses.length - 1].id;

      chapterFirstVerseMap.set(chapterKey, chapterFirstVerseId);
      chapterLastVerseMap.set(chapterKey, chapterLastVerseId);

      // Track book boundaries
      if (bookFirstVerseId === null) {
        bookFirstVerseId = chapterFirstVerseId;
      }
      bookLastVerseId = chapterLastVerseId;

      // Process each verse
      for (const verse of verses) {
        navigationMetadata.push({
          verseId: verse.id,
          globalIndex: globalIndex,
          previousId: previousVerseId,
          nextId: null, // Will be set in next iteration
          chapterFirstVerseId: chapterFirstVerseId,
          chapterLastVerseId: chapterLastVerseId,
          bookFirstVerseId: null, // Will be set after we know book boundaries
          bookLastVerseId: null
        });

        // Update previous verse's nextId
        if (previousVerseId !== null) {
          const prevMetadata = navigationMetadata.find(m => m.verseId === previousVerseId);
          if (prevMetadata) {
            prevMetadata.nextId = verse.id;
          }
        }

        previousVerseId = verse.id;
        globalIndex++;
      }
    }

    // Store book boundaries
    if (bookFirstVerseId && bookLastVerseId) {
      bookFirstVerseMap.set(bookKey, bookFirstVerseId);
      bookLastVerseMap.set(bookKey, bookLastVerseId);
    }
  }

  console.log(`   ✓ Collected ${navigationMetadata.length} verses`);

  // Second pass: Update book-level navigation for all verses
  console.log(`   ✓ Computing book-level navigation...`);

  for (const metadata of navigationMetadata) {
    const verse = await prisma.verse.findUnique({
      where: { id: metadata.verseId }
    });

    if (verse) {
      metadata.bookFirstVerseId = bookFirstVerseMap.get(verse.bookId) || null;
      metadata.bookLastVerseId = bookLastVerseMap.get(verse.bookId) || null;
    }
  }

  // Third pass: Batch update all verses with navigation metadata
  console.log(`   ✓ Writing navigation metadata to database...`);

  const BATCH_SIZE = 1000;
  let updated = 0;

  for (let i = 0; i < navigationMetadata.length; i += BATCH_SIZE) {
    const batch = navigationMetadata.slice(i, i + BATCH_SIZE);

    await prisma.$transaction(
      batch.map(metadata =>
        prisma.verse.update({
          where: { id: metadata.verseId },
          data: {
            globalIndex: metadata.globalIndex,
            previousId: metadata.previousId,
            nextId: metadata.nextId,
            chapterFirstVerseId: metadata.chapterFirstVerseId,
            chapterLastVerseId: metadata.chapterLastVerseId,
            bookFirstVerseId: metadata.bookFirstVerseId,
            bookLastVerseId: metadata.bookLastVerseId
          }
        })
      )
    );

    updated += batch.length;
    const progress = ((updated / navigationMetadata.length) * 100).toFixed(1);
    process.stdout.write(`\r   ✓ Progress: ${updated}/${navigationMetadata.length} verses (${progress}%)`);
  }

  console.log(`\n   ✅ Completed: ${navigationMetadata.length} verses processed`);
}

// Run the migration
populateVerseNavigation()
  .then(() => {
    console.log('\n🎉 Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration failed:', error);
    process.exit(1);
  });
