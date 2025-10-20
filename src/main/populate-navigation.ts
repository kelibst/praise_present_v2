/**
 * Database migration script to populate navigation fields for Bible verses
 * This enables seamless navigation between verses, chapters, and books
 */

import { PrismaClient } from '@prisma/client';

async function populateNavigationFields(db: PrismaClient) {
  console.log('🚀 Starting navigation field population...');

  try {
    // Get all versions
    const versions = await db.version.findMany();
    console.log(`Found ${versions.length} Bible versions to process`);

    for (const version of versions) {
      console.log(`\n📖 Processing version: ${version.name} (${version.id})`);

      // Get all verses for this version, ordered by book, chapter, and verse
      const verses = await db.verse.findMany({
        where: { versionId: version.id },
        orderBy: [
          { bookId: 'asc' },
          { chapter: 'asc' },
          { verse: 'asc' }
        ],
        include: {
          book: true
        }
      });

      console.log(`  Found ${verses.length} verses`);

      if (verses.length === 0) continue;

      // Process each verse and set navigation fields
      for (let i = 0; i < verses.length; i++) {
        const currentVerse = verses[i];
        const previousVerse = i > 0 ? verses[i - 1] : null;
        const nextVerse = i < verses.length - 1 ? verses[i + 1] : null;

        // Find first and last verse of current chapter
        const chapterVerses = verses.filter(v =>
          v.bookId === currentVerse.bookId &&
          v.chapter === currentVerse.chapter
        );
        const chapterFirstVerse = chapterVerses[0];
        const chapterLastVerse = chapterVerses[chapterVerses.length - 1];

        // Find first and last verse of current book
        const bookVerses = verses.filter(v => v.bookId === currentVerse.bookId);
        const bookFirstVerse = bookVerses[0];
        const bookLastVerse = bookVerses[bookVerses.length - 1];

        // Update the verse with navigation metadata
        await db.verse.update({
          where: { id: currentVerse.id },
          data: {
            globalIndex: i + 1, // 1-based index
            previousId: previousVerse?.id || null,
            nextId: nextVerse?.id || null,
            chapterFirstVerseId: chapterFirstVerse?.id || null,
            chapterLastVerseId: chapterLastVerse?.id || null,
            bookFirstVerseId: bookFirstVerse?.id || null,
            bookLastVerseId: bookLastVerse?.id || null
          }
        });

        // Progress indicator
        if ((i + 1) % 1000 === 0) {
          console.log(`  Processed ${i + 1}/${verses.length} verses...`);
        }
      }

      console.log(`✅ Completed navigation for ${version.name}: ${verses.length} verses updated`);
    }

    console.log('\n🎉 Navigation field population completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Error populating navigation fields:', error);
    throw error;
  }
}

// Export for use in other modules
export { populateNavigationFields };

// If run directly (for testing)
if (require.main === module) {
  const prisma = new PrismaClient();

  populateNavigationFields(prisma)
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}