import { getDatabase } from '../src/lib/database';
import { sampleScriptureVerses } from '../data/sample-scripture';
import { sampleSongs } from '../data/sample-songs';

async function seedSampleData() {
  const db = getDatabase();

  try {
    console.log('🌱 Seeding sample data...');

    // Get the KJV version ID
    const kjvVersion = await db.version.findFirst({
      where: { name: 'KJV' }
    });

    if (!kjvVersion) {
      console.error('KJV version not found. Please run the main seed script first.');
      return;
    }

    // Seed scripture verses
    console.log('📖 Adding sample scripture verses...');
    for (const verseData of sampleScriptureVerses) {
      const book = await db.book.findFirst({
        where: { name: verseData.book }
      });

      if (book) {
        try {
          await db.verse.create({
            data: {
              bookId: book.id,
              chapter: verseData.chapter,
              verse: verseData.verse,
              text: verseData.text,
              versionId: kjvVersion.id
            }
          });
        } catch (error) {
          // Verse might already exist, skip
        }
      }
    }

    // Seed songs
    console.log('🎵 Adding sample songs...');
    for (const songData of sampleSongs) {
      try {
        await db.song.create({
          data: {
            ...songData,
            lastUsed: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
            usageCount: Math.floor(Math.random() * 20)
          }
        });
      } catch (error) {
        // Song might already exist, skip
      }
    }

    // Create sample services
    console.log('⛪ Adding sample services...');
    const services = [
      {
        name: 'Sunday Morning Worship',
        date: new Date('2024-01-07T10:00:00'),
        type: 'Sunday Morning',
        description: 'Regular Sunday morning worship service',
        duration: 90
      },
      {
        name: 'Sunday Evening Service',
        date: new Date('2024-01-07T18:00:00'),
        type: 'Sunday Evening',
        description: 'Sunday evening worship and fellowship',
        duration: 60
      },
      {
        name: 'Wednesday Bible Study',
        date: new Date('2024-01-10T19:00:00'),
        type: 'Bible Study',
        description: 'Midweek Bible study and prayer',
        duration: 75
      }
    ];

    for (const serviceData of services) {
      try {
        const service = await db.service.create({
          data: serviceData
        });

        // Add sample service items
        const amazingGrace = await db.song.findFirst({
          where: { title: 'Amazing Grace' }
        });

        if (amazingGrace) {
          await db.serviceItem.create({
            data: {
              serviceId: service.id,
              type: 'song',
              title: 'Amazing Grace',
              order: 1,
              duration: 4,
              songId: amazingGrace.id
            }
          });
        }

        // Add scripture service item
        await db.serviceItem.create({
          data: {
            serviceId: service.id,
            type: 'scripture',
            title: 'John 3:16',
            order: 2,
            duration: 3,
            settings: JSON.stringify({
              book: 'John',
              chapter: 3,
              verse: 16
            })
          }
        });
      } catch (error) {
        // Service might already exist, skip
      }
    }

    console.log('✅ Sample data seeded successfully!');
  } catch (error) {
    console.error('❌ Failed to seed sample data:', error);
    throw error;
  }
}

export { seedSampleData };

if (require.main === module) {
  seedSampleData().catch(console.error);
}