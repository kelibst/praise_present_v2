import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

// Global variable to store the Prisma client instance
let prisma: PrismaClient;

// Initialize Prisma client with proper configuration for Electron
export function initializeDatabase(): PrismaClient {
  if (prisma) {
    return prisma;
  }

  // For now, use the default Prisma configuration
  // In production, we'll want to customize the database location
  prisma = new PrismaClient();

  return prisma;
}

// Get the Prisma client instance
export function getDatabase(): PrismaClient {
  if (!prisma) {
    return initializeDatabase();
  }
  return prisma;
}

// Close the database connection
export async function closeDatabase(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
  }
}

// Database migration and seeding functions
export async function migrateDatabase(): Promise<void> {
  const db = getDatabase();
  
  try {
    // Run migrations programmatically
    // Note: In production, you might want to use Prisma CLI for migrations
    await db.$executeRaw`PRAGMA foreign_keys = ON;`;
    console.log('Database migrations completed successfully');
  } catch (error) {
    console.error('Database migration failed:', error);
    throw error;
  }
}

// Seed the database with initial data
export async function seedDatabase(): Promise<void> {
  const db = getDatabase();

  try {
    // Check if we already have data
    const translationCount = await db.translation.count();
    if (translationCount > 0) {
      console.log('Database already seeded');
      return;
    }

    // Create default language translation (English)
    const englishTranslation = await db.translation.create({
      data: {
        name: 'English',
        code: 'en',
        description: 'English language',
        isDefault: true,
      },
    });

    // Create default Bible version (KJV)
    const kjvVersion = await db.version.create({
      data: {
        name: 'KJV',
        fullName: 'King James Version',
        translationId: englishTranslation.id,
        description: 'The King James Version of the Bible',
        isDefault: true,
        year: 1611,
        publisher: 'Various',
      },
    });

    // Create Bible books
    const books = await createBibleBooks(db);

    // Create default settings
    await createDefaultSettings(db);

    // Create default user
    await db.user.create({
      data: {
        username: 'admin',
        fullName: 'Administrator',
        role: 'admin',
        preferences: JSON.stringify({
          theme: 'dark',
          defaultVersion: kjvVersion.id,
        }),
      },
    });

    // Create sample presentations and slides
    await createSamplePresentations(db);

    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Database seeding failed:', error);
    throw error;
  }
}

// Helper function to create Bible books
async function createBibleBooks(db: PrismaClient) {
  const bibleBooks = [
    // Old Testament
    { id: 1, name: 'Genesis', shortName: 'Gen', testament: 'OT', category: 'Law', chapters: 50, order: 1 },
    { id: 2, name: 'Exodus', shortName: 'Exo', testament: 'OT', category: 'Law', chapters: 40, order: 2 },
    { id: 3, name: 'Leviticus', shortName: 'Lev', testament: 'OT', category: 'Law', chapters: 27, order: 3 },
    { id: 4, name: 'Numbers', shortName: 'Num', testament: 'OT', category: 'Law', chapters: 36, order: 4 },
    { id: 5, name: 'Deuteronomy', shortName: 'Deu', testament: 'OT', category: 'Law', chapters: 34, order: 5 },
    { id: 6, name: 'Joshua', shortName: 'Jos', testament: 'OT', category: 'History', chapters: 24, order: 6 },
    { id: 7, name: 'Judges', shortName: 'Jdg', testament: 'OT', category: 'History', chapters: 21, order: 7 },
    { id: 8, name: 'Ruth', shortName: 'Rut', testament: 'OT', category: 'History', chapters: 4, order: 8 },
    { id: 9, name: '1 Samuel', shortName: '1Sa', testament: 'OT', category: 'History', chapters: 31, order: 9 },
    { id: 10, name: '2 Samuel', shortName: '2Sa', testament: 'OT', category: 'History', chapters: 24, order: 10 },
    { id: 11, name: '1 Kings', shortName: '1Ki', testament: 'OT', category: 'History', chapters: 22, order: 11 },
    { id: 12, name: '2 Kings', shortName: '2Ki', testament: 'OT', category: 'History', chapters: 25, order: 12 },
    { id: 13, name: '1 Chronicles', shortName: '1Ch', testament: 'OT', category: 'History', chapters: 29, order: 13 },
    { id: 14, name: '2 Chronicles', shortName: '2Ch', testament: 'OT', category: 'History', chapters: 36, order: 14 },
    { id: 15, name: 'Ezra', shortName: 'Ezr', testament: 'OT', category: 'History', chapters: 10, order: 15 },
    { id: 16, name: 'Nehemiah', shortName: 'Neh', testament: 'OT', category: 'History', chapters: 13, order: 16 },
    { id: 17, name: 'Esther', shortName: 'Est', testament: 'OT', category: 'History', chapters: 10, order: 17 },
    { id: 18, name: 'Job', shortName: 'Job', testament: 'OT', category: 'Poetry', chapters: 42, order: 18 },
    { id: 19, name: 'Psalms', shortName: 'Psa', testament: 'OT', category: 'Poetry', chapters: 150, order: 19 },
    { id: 20, name: 'Proverbs', shortName: 'Pro', testament: 'OT', category: 'Poetry', chapters: 31, order: 20 },
    { id: 21, name: 'Ecclesiastes', shortName: 'Ecc', testament: 'OT', category: 'Poetry', chapters: 12, order: 21 },
    { id: 22, name: 'Song of Solomon', shortName: 'SoS', testament: 'OT', category: 'Poetry', chapters: 8, order: 22 },
    { id: 23, name: 'Isaiah', shortName: 'Isa', testament: 'OT', category: 'Prophecy', chapters: 66, order: 23 },
    { id: 24, name: 'Jeremiah', shortName: 'Jer', testament: 'OT', category: 'Prophecy', chapters: 52, order: 24 },
    { id: 25, name: 'Lamentations', shortName: 'Lam', testament: 'OT', category: 'Prophecy', chapters: 5, order: 25 },
    { id: 26, name: 'Ezekiel', shortName: 'Eze', testament: 'OT', category: 'Prophecy', chapters: 48, order: 26 },
    { id: 27, name: 'Daniel', shortName: 'Dan', testament: 'OT', category: 'Prophecy', chapters: 12, order: 27 },
    { id: 28, name: 'Hosea', shortName: 'Hos', testament: 'OT', category: 'Prophecy', chapters: 14, order: 28 },
    { id: 29, name: 'Joel', shortName: 'Joe', testament: 'OT', category: 'Prophecy', chapters: 3, order: 29 },
    { id: 30, name: 'Amos', shortName: 'Amo', testament: 'OT', category: 'Prophecy', chapters: 9, order: 30 },
    { id: 31, name: 'Obadiah', shortName: 'Oba', testament: 'OT', category: 'Prophecy', chapters: 1, order: 31 },
    { id: 32, name: 'Jonah', shortName: 'Jon', testament: 'OT', category: 'Prophecy', chapters: 4, order: 32 },
    { id: 33, name: 'Micah', shortName: 'Mic', testament: 'OT', category: 'Prophecy', chapters: 7, order: 33 },
    { id: 34, name: 'Nahum', shortName: 'Nah', testament: 'OT', category: 'Prophecy', chapters: 3, order: 34 },
    { id: 35, name: 'Habakkuk', shortName: 'Hab', testament: 'OT', category: 'Prophecy', chapters: 3, order: 35 },
    { id: 36, name: 'Zephaniah', shortName: 'Zep', testament: 'OT', category: 'Prophecy', chapters: 3, order: 36 },
    { id: 37, name: 'Haggai', shortName: 'Hag', testament: 'OT', category: 'Prophecy', chapters: 2, order: 37 },
    { id: 38, name: 'Zechariah', shortName: 'Zec', testament: 'OT', category: 'Prophecy', chapters: 14, order: 38 },
    { id: 39, name: 'Malachi', shortName: 'Mal', testament: 'OT', category: 'Prophecy', chapters: 4, order: 39 },
    
    // New Testament
    { id: 40, name: 'Matthew', shortName: 'Mat', testament: 'NT', category: 'Gospel', chapters: 28, order: 40 },
    { id: 41, name: 'Mark', shortName: 'Mar', testament: 'NT', category: 'Gospel', chapters: 16, order: 41 },
    { id: 42, name: 'Luke', shortName: 'Luk', testament: 'NT', category: 'Gospel', chapters: 24, order: 42 },
    { id: 43, name: 'John', shortName: 'Joh', testament: 'NT', category: 'Gospel', chapters: 21, order: 43 },
    { id: 44, name: 'Acts', shortName: 'Act', testament: 'NT', category: 'History', chapters: 28, order: 44 },
    { id: 45, name: 'Romans', shortName: 'Rom', testament: 'NT', category: 'Epistle', chapters: 16, order: 45 },
    { id: 46, name: '1 Corinthians', shortName: '1Co', testament: 'NT', category: 'Epistle', chapters: 16, order: 46 },
    { id: 47, name: '2 Corinthians', shortName: '2Co', testament: 'NT', category: 'Epistle', chapters: 13, order: 47 },
    { id: 48, name: 'Galatians', shortName: 'Gal', testament: 'NT', category: 'Epistle', chapters: 6, order: 48 },
    { id: 49, name: 'Ephesians', shortName: 'Eph', testament: 'NT', category: 'Epistle', chapters: 6, order: 49 },
    { id: 50, name: 'Philippians', shortName: 'Phi', testament: 'NT', category: 'Epistle', chapters: 4, order: 50 },
    { id: 51, name: 'Colossians', shortName: 'Col', testament: 'NT', category: 'Epistle', chapters: 4, order: 51 },
    { id: 52, name: '1 Thessalonians', shortName: '1Th', testament: 'NT', category: 'Epistle', chapters: 5, order: 52 },
    { id: 53, name: '2 Thessalonians', shortName: '2Th', testament: 'NT', category: 'Epistle', chapters: 3, order: 53 },
    { id: 54, name: '1 Timothy', shortName: '1Ti', testament: 'NT', category: 'Epistle', chapters: 6, order: 54 },
    { id: 55, name: '2 Timothy', shortName: '2Ti', testament: 'NT', category: 'Epistle', chapters: 4, order: 55 },
    { id: 56, name: 'Titus', shortName: 'Tit', testament: 'NT', category: 'Epistle', chapters: 3, order: 56 },
    { id: 57, name: 'Philemon', shortName: 'Phm', testament: 'NT', category: 'Epistle', chapters: 1, order: 57 },
    { id: 58, name: 'Hebrews', shortName: 'Heb', testament: 'NT', category: 'Epistle', chapters: 13, order: 58 },
    { id: 59, name: 'James', shortName: 'Jam', testament: 'NT', category: 'Epistle', chapters: 5, order: 59 },
    { id: 60, name: '1 Peter', shortName: '1Pe', testament: 'NT', category: 'Epistle', chapters: 5, order: 60 },
    { id: 61, name: '2 Peter', shortName: '2Pe', testament: 'NT', category: 'Epistle', chapters: 3, order: 61 },
    { id: 62, name: '1 John', shortName: '1Jo', testament: 'NT', category: 'Epistle', chapters: 5, order: 62 },
    { id: 63, name: '2 John', shortName: '2Jo', testament: 'NT', category: 'Epistle', chapters: 1, order: 63 },
    { id: 64, name: '3 John', shortName: '3Jo', testament: 'NT', category: 'Epistle', chapters: 1, order: 64 },
    { id: 65, name: 'Jude', shortName: 'Jud', testament: 'NT', category: 'Epistle', chapters: 1, order: 65 },
    { id: 66, name: 'Revelation', shortName: 'Rev', testament: 'NT', category: 'Apocalyptic', chapters: 22, order: 66 },
  ];

  // Create books in batch
  try {
    await db.book.createMany({
      data: bibleBooks,
    });
  } catch (error) {
    // Books might already exist, which is fine
    console.log('Books already exist in database');
  }

  return bibleBooks;
}

// Helper function to create default settings
async function createDefaultSettings(db: PrismaClient) {
  const defaultSettings = [
    { key: 'app.theme', value: 'dark', type: 'string', category: 'general', description: 'Application theme' },
    { key: 'display.resolution', value: '1920x1080', type: 'string', category: 'display', description: 'Display resolution' },
    { key: 'display.primaryMonitor', value: '0', type: 'number', category: 'display', description: 'Primary monitor index' },
    { key: 'display.secondaryMonitor', value: '1', type: 'number', category: 'display', description: 'Secondary monitor index' },
    { key: 'backup.autoBackup', value: 'true', type: 'boolean', category: 'backup', description: 'Enable automatic backups' },
    { key: 'backup.frequency', value: 'daily', type: 'string', category: 'backup', description: 'Backup frequency' },
    { key: 'backup.location', value: '', type: 'string', category: 'backup', description: 'Backup location path' },
    { key: 'scripture.defaultTranslation', value: 'KJV', type: 'string', category: 'general', description: 'Default Bible translation' },
    { key: 'presentation.defaultTransition', value: 'fade', type: 'string', category: 'general', description: 'Default slide transition' },
    { key: 'presentation.transitionDuration', value: '500', type: 'number', category: 'general', description: 'Transition duration in ms' },
  ];

  try {
    await db.setting.createMany({
      data: defaultSettings,
    });
  } catch (error) {
    // Settings might already exist, which is fine
    console.log('Settings already exist in database');
  }
}

// Helper function to create sample presentations with slides
async function createSamplePresentations(db: PrismaClient) {
  console.log('Creating sample presentations...');
  
  // Create default templates first
  const titleTemplate = await db.template.create({
    data: {
      name: 'Title Slide',
      description: 'Simple title slide with centered text',
      category: 'basic',
      isDefault: true,
      settings: JSON.stringify({
        textAlign: 'center',
        fontSize: 'x-large',
        fontWeight: 'bold',
        textColor: '#ffffff',
        backgroundColor: '#1f2937',
        padding: { top: '20%', bottom: '20%', left: '10%', right: '10%' }
      })
    }
  });

  const contentTemplate = await db.template.create({
    data: {
      name: 'Content Slide',
      description: 'Standard content slide with title and body',
      category: 'basic',
      isDefault: true,
      settings: JSON.stringify({
        titleAlign: 'center',
        contentAlign: 'left',
        titleSize: 'large',
        contentSize: 'medium',
        titleColor: '#ffffff',
        contentColor: '#e5e7eb',
        backgroundColor: '#374151'
      })
    }
  });

  // Create default backgrounds
  const darkBackground = await db.background.create({
    data: {
      name: 'Dark Blue',
      type: 'gradient',
      category: 'solid',
      isDefault: true,
      settings: JSON.stringify({
        type: 'linear',
        direction: '45deg',
        stops: [
          { color: '#1e3a8a', position: 0 },
          { color: '#1e40af', position: 100 }
        ]
      })
    }
  });

  const lightBackground = await db.background.create({
    data: {
      name: 'Light Gray',
      type: 'color',
      category: 'solid',
      isDefault: false,
      settings: JSON.stringify({
        color: '#f3f4f6'
      })
    }
  });

  // Sample presentations
  const presentations = [
    {
      title: 'Sunday Morning Service',
      description: 'Welcome slides and announcements for Sunday morning worship',
      templateId: titleTemplate.id,
      slides: [
        {
          title: 'Welcome',
          content: JSON.stringify({
            type: 'title',
            title: 'Welcome to Grace Community Church',
            subtitle: 'Sunday Morning Worship',
            textAlign: 'center',
            fontSize: 'x-large',
            fontWeight: 'bold',
            textColor: '#ffffff'
          }),
          backgroundId: darkBackground.id,
          templateId: titleTemplate.id,
          order: 0
        },
        {
          title: 'Announcements',
          content: JSON.stringify({
            type: 'bullet',
            title: 'Church Announcements',
            bullets: [
              'Bible Study - Wednesday 7:00 PM',
              'Youth Group - Friday 6:00 PM',
              'Church Picnic - Saturday 12:00 PM',
              'Prayer Meeting - Sunday 6:00 PM'
            ],
            textAlign: 'left',
            fontSize: 'medium',
            fontWeight: 'normal',
            textColor: '#ffffff'
          }),
          backgroundId: darkBackground.id,
          templateId: contentTemplate.id,
          order: 1
        },
        {
          title: 'Offering',
          content: JSON.stringify({
            type: 'title',
            title: 'Giving & Offerings',
            subtitle: '"Each of you should give what you have decided in your heart to give." - 2 Corinthians 9:7',
            textAlign: 'center',
            fontSize: 'large',
            fontWeight: 'normal',
            textColor: '#ffffff'
          }),
          backgroundId: darkBackground.id,
          templateId: titleTemplate.id,
          order: 2
        }
      ]
    },
    {
      title: 'The Gospel Message',
      description: 'Salvation presentation slides',
      templateId: contentTemplate.id,
      slides: [
        {
          title: 'God Loves You',
          content: JSON.stringify({
            type: 'text',
            title: 'God Loves You',
            body: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.\n\nJohn 3:16',
            textAlign: 'center',
            fontSize: 'large',
            fontWeight: 'normal',
            textColor: '#ffffff'
          }),
          backgroundId: darkBackground.id,
          templateId: contentTemplate.id,
          order: 0
        },
        {
          title: 'We Are Sinners',
          content: JSON.stringify({
            type: 'text',
            title: 'We Are All Sinners',
            body: 'All have sinned and fall short of the glory of God.\n\nRomans 3:23\n\nFor the wages of sin is death, but the gift of God is eternal life in Christ Jesus our Lord.\n\nRomans 6:23',
            textAlign: 'center',
            fontSize: 'medium',
            fontWeight: 'normal',
            textColor: '#ffffff'
          }),
          backgroundId: darkBackground.id,
          templateId: contentTemplate.id,
          order: 1
        },
        {
          title: 'Jesus Died For Us',
          content: JSON.stringify({
            type: 'text',
            title: 'Jesus Died For Our Sins',
            body: 'But God demonstrates his own love for us in this: While we were still sinners, Christ died for us.\n\nRomans 5:8',
            textAlign: 'center',
            fontSize: 'large',
            fontWeight: 'normal',
            textColor: '#ffffff'
          }),
          backgroundId: darkBackground.id,
          templateId: contentTemplate.id,
          order: 2
        },
        {
          title: 'Believe and Be Saved',
          content: JSON.stringify({
            type: 'text',
            title: 'Believe and Be Saved',
            body: 'If you declare with your mouth, "Jesus is Lord," and believe in your heart that God raised him from the dead, you will be saved.\n\nRomans 10:9',
            textAlign: 'center',
            fontSize: 'large',
            fontWeight: 'normal',
            textColor: '#ffffff'
          }),
          backgroundId: darkBackground.id,
          templateId: contentTemplate.id,
          order: 3
        }
      ]
    },
    {
      title: 'Christmas Service 2024',
      description: 'Special Christmas worship service slides',
      templateId: titleTemplate.id,
      slides: [
        {
          title: 'Christmas Welcome',
          content: JSON.stringify({
            type: 'title',
            title: 'Merry Christmas!',
            subtitle: 'Celebrating the Birth of Our Savior',
            textAlign: 'center',
            fontSize: 'x-large',
            fontWeight: 'bold',
            textColor: '#ffffff'
          }),
          backgroundId: darkBackground.id,
          templateId: titleTemplate.id,
          order: 0
        },
        {
          title: 'The Christmas Story',
          content: JSON.stringify({
            type: 'text',
            title: 'The Birth of Jesus',
            body: 'And she gave birth to her firstborn, a son. She wrapped him in cloths and placed him in a manger, because there was no guest room available for them.\n\nLuke 2:7',
            textAlign: 'center',
            fontSize: 'large',
            fontWeight: 'normal',
            textColor: '#ffffff'
          }),
          backgroundId: darkBackground.id,
          templateId: contentTemplate.id,
          order: 1
        }
      ]
    }
  ];

  // Create presentations and slides
  for (const presentationData of presentations) {
    const { slides, ...presentation } = presentationData;
    
    const createdPresentation = await db.presentation.create({
      data: {
        ...presentation,
        lastUsed: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() // Random date within last 30 days
      }
    });

    // Create slides for this presentation
    for (const slideData of slides) {
      await db.slide.create({
        data: {
          ...slideData,
          presentationId: createdPresentation.id
        }
      });
    }
  }

  console.log('Sample presentations created successfully');
}

// Export the Prisma client type for use in other files
export type Database = PrismaClient; 