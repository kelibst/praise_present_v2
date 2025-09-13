"use strict";
const electron = require("electron");
const path$1 = require("node:path");
const started = require("electron-squirrel-startup");
const client = require("@prisma/client");
const fs = require("fs");
const path = require("path");
const child_process = require("child_process");
const os = require("os");
let prisma;
function initializeDatabase() {
  if (prisma) {
    return prisma;
  }
  prisma = new client.PrismaClient();
  return prisma;
}
function getDatabase() {
  if (!prisma) {
    return initializeDatabase();
  }
  return prisma;
}
async function seedDatabase() {
  const db2 = getDatabase();
  try {
    const translationCount = await db2.translation.count();
    if (translationCount > 0) {
      console.log("Database already seeded");
      return;
    }
    const englishTranslation = await db2.translation.create({
      data: {
        name: "English",
        code: "en",
        description: "English language",
        isDefault: true
      }
    });
    const kjvVersion = await db2.version.create({
      data: {
        name: "KJV",
        fullName: "King James Version",
        translationId: englishTranslation.id,
        description: "The King James Version of the Bible",
        isDefault: true,
        year: 1611,
        publisher: "Various"
      }
    });
    const books = await createBibleBooks(db2);
    await createDefaultSettings(db2);
    await db2.user.create({
      data: {
        username: "admin",
        fullName: "Administrator",
        role: "admin",
        preferences: JSON.stringify({
          theme: "dark",
          defaultVersion: kjvVersion.id
        })
      }
    });
    await createSamplePresentations(db2);
    console.log("Database seeded successfully");
  } catch (error) {
    console.error("Database seeding failed:", error);
    throw error;
  }
}
async function createBibleBooks(db2) {
  const bibleBooks = [
    // Old Testament
    { id: 1, name: "Genesis", shortName: "Gen", testament: "OT", category: "Law", chapters: 50, order: 1 },
    { id: 2, name: "Exodus", shortName: "Exo", testament: "OT", category: "Law", chapters: 40, order: 2 },
    { id: 3, name: "Leviticus", shortName: "Lev", testament: "OT", category: "Law", chapters: 27, order: 3 },
    { id: 4, name: "Numbers", shortName: "Num", testament: "OT", category: "Law", chapters: 36, order: 4 },
    { id: 5, name: "Deuteronomy", shortName: "Deu", testament: "OT", category: "Law", chapters: 34, order: 5 },
    { id: 6, name: "Joshua", shortName: "Jos", testament: "OT", category: "History", chapters: 24, order: 6 },
    { id: 7, name: "Judges", shortName: "Jdg", testament: "OT", category: "History", chapters: 21, order: 7 },
    { id: 8, name: "Ruth", shortName: "Rut", testament: "OT", category: "History", chapters: 4, order: 8 },
    { id: 9, name: "1 Samuel", shortName: "1Sa", testament: "OT", category: "History", chapters: 31, order: 9 },
    { id: 10, name: "2 Samuel", shortName: "2Sa", testament: "OT", category: "History", chapters: 24, order: 10 },
    { id: 11, name: "1 Kings", shortName: "1Ki", testament: "OT", category: "History", chapters: 22, order: 11 },
    { id: 12, name: "2 Kings", shortName: "2Ki", testament: "OT", category: "History", chapters: 25, order: 12 },
    { id: 13, name: "1 Chronicles", shortName: "1Ch", testament: "OT", category: "History", chapters: 29, order: 13 },
    { id: 14, name: "2 Chronicles", shortName: "2Ch", testament: "OT", category: "History", chapters: 36, order: 14 },
    { id: 15, name: "Ezra", shortName: "Ezr", testament: "OT", category: "History", chapters: 10, order: 15 },
    { id: 16, name: "Nehemiah", shortName: "Neh", testament: "OT", category: "History", chapters: 13, order: 16 },
    { id: 17, name: "Esther", shortName: "Est", testament: "OT", category: "History", chapters: 10, order: 17 },
    { id: 18, name: "Job", shortName: "Job", testament: "OT", category: "Poetry", chapters: 42, order: 18 },
    { id: 19, name: "Psalms", shortName: "Psa", testament: "OT", category: "Poetry", chapters: 150, order: 19 },
    { id: 20, name: "Proverbs", shortName: "Pro", testament: "OT", category: "Poetry", chapters: 31, order: 20 },
    { id: 21, name: "Ecclesiastes", shortName: "Ecc", testament: "OT", category: "Poetry", chapters: 12, order: 21 },
    { id: 22, name: "Song of Solomon", shortName: "SoS", testament: "OT", category: "Poetry", chapters: 8, order: 22 },
    { id: 23, name: "Isaiah", shortName: "Isa", testament: "OT", category: "Prophecy", chapters: 66, order: 23 },
    { id: 24, name: "Jeremiah", shortName: "Jer", testament: "OT", category: "Prophecy", chapters: 52, order: 24 },
    { id: 25, name: "Lamentations", shortName: "Lam", testament: "OT", category: "Prophecy", chapters: 5, order: 25 },
    { id: 26, name: "Ezekiel", shortName: "Eze", testament: "OT", category: "Prophecy", chapters: 48, order: 26 },
    { id: 27, name: "Daniel", shortName: "Dan", testament: "OT", category: "Prophecy", chapters: 12, order: 27 },
    { id: 28, name: "Hosea", shortName: "Hos", testament: "OT", category: "Prophecy", chapters: 14, order: 28 },
    { id: 29, name: "Joel", shortName: "Joe", testament: "OT", category: "Prophecy", chapters: 3, order: 29 },
    { id: 30, name: "Amos", shortName: "Amo", testament: "OT", category: "Prophecy", chapters: 9, order: 30 },
    { id: 31, name: "Obadiah", shortName: "Oba", testament: "OT", category: "Prophecy", chapters: 1, order: 31 },
    { id: 32, name: "Jonah", shortName: "Jon", testament: "OT", category: "Prophecy", chapters: 4, order: 32 },
    { id: 33, name: "Micah", shortName: "Mic", testament: "OT", category: "Prophecy", chapters: 7, order: 33 },
    { id: 34, name: "Nahum", shortName: "Nah", testament: "OT", category: "Prophecy", chapters: 3, order: 34 },
    { id: 35, name: "Habakkuk", shortName: "Hab", testament: "OT", category: "Prophecy", chapters: 3, order: 35 },
    { id: 36, name: "Zephaniah", shortName: "Zep", testament: "OT", category: "Prophecy", chapters: 3, order: 36 },
    { id: 37, name: "Haggai", shortName: "Hag", testament: "OT", category: "Prophecy", chapters: 2, order: 37 },
    { id: 38, name: "Zechariah", shortName: "Zec", testament: "OT", category: "Prophecy", chapters: 14, order: 38 },
    { id: 39, name: "Malachi", shortName: "Mal", testament: "OT", category: "Prophecy", chapters: 4, order: 39 },
    // New Testament
    { id: 40, name: "Matthew", shortName: "Mat", testament: "NT", category: "Gospel", chapters: 28, order: 40 },
    { id: 41, name: "Mark", shortName: "Mar", testament: "NT", category: "Gospel", chapters: 16, order: 41 },
    { id: 42, name: "Luke", shortName: "Luk", testament: "NT", category: "Gospel", chapters: 24, order: 42 },
    { id: 43, name: "John", shortName: "Joh", testament: "NT", category: "Gospel", chapters: 21, order: 43 },
    { id: 44, name: "Acts", shortName: "Act", testament: "NT", category: "History", chapters: 28, order: 44 },
    { id: 45, name: "Romans", shortName: "Rom", testament: "NT", category: "Epistle", chapters: 16, order: 45 },
    { id: 46, name: "1 Corinthians", shortName: "1Co", testament: "NT", category: "Epistle", chapters: 16, order: 46 },
    { id: 47, name: "2 Corinthians", shortName: "2Co", testament: "NT", category: "Epistle", chapters: 13, order: 47 },
    { id: 48, name: "Galatians", shortName: "Gal", testament: "NT", category: "Epistle", chapters: 6, order: 48 },
    { id: 49, name: "Ephesians", shortName: "Eph", testament: "NT", category: "Epistle", chapters: 6, order: 49 },
    { id: 50, name: "Philippians", shortName: "Phi", testament: "NT", category: "Epistle", chapters: 4, order: 50 },
    { id: 51, name: "Colossians", shortName: "Col", testament: "NT", category: "Epistle", chapters: 4, order: 51 },
    { id: 52, name: "1 Thessalonians", shortName: "1Th", testament: "NT", category: "Epistle", chapters: 5, order: 52 },
    { id: 53, name: "2 Thessalonians", shortName: "2Th", testament: "NT", category: "Epistle", chapters: 3, order: 53 },
    { id: 54, name: "1 Timothy", shortName: "1Ti", testament: "NT", category: "Epistle", chapters: 6, order: 54 },
    { id: 55, name: "2 Timothy", shortName: "2Ti", testament: "NT", category: "Epistle", chapters: 4, order: 55 },
    { id: 56, name: "Titus", shortName: "Tit", testament: "NT", category: "Epistle", chapters: 3, order: 56 },
    { id: 57, name: "Philemon", shortName: "Phm", testament: "NT", category: "Epistle", chapters: 1, order: 57 },
    { id: 58, name: "Hebrews", shortName: "Heb", testament: "NT", category: "Epistle", chapters: 13, order: 58 },
    { id: 59, name: "James", shortName: "Jam", testament: "NT", category: "Epistle", chapters: 5, order: 59 },
    { id: 60, name: "1 Peter", shortName: "1Pe", testament: "NT", category: "Epistle", chapters: 5, order: 60 },
    { id: 61, name: "2 Peter", shortName: "2Pe", testament: "NT", category: "Epistle", chapters: 3, order: 61 },
    { id: 62, name: "1 John", shortName: "1Jo", testament: "NT", category: "Epistle", chapters: 5, order: 62 },
    { id: 63, name: "2 John", shortName: "2Jo", testament: "NT", category: "Epistle", chapters: 1, order: 63 },
    { id: 64, name: "3 John", shortName: "3Jo", testament: "NT", category: "Epistle", chapters: 1, order: 64 },
    { id: 65, name: "Jude", shortName: "Jud", testament: "NT", category: "Epistle", chapters: 1, order: 65 },
    { id: 66, name: "Revelation", shortName: "Rev", testament: "NT", category: "Apocalyptic", chapters: 22, order: 66 }
  ];
  try {
    await db2.book.createMany({
      data: bibleBooks
    });
  } catch (error) {
    console.log("Books already exist in database");
  }
  return bibleBooks;
}
async function createDefaultSettings(db2) {
  const defaultSettings = [
    { key: "app.theme", value: "dark", type: "string", category: "general", description: "Application theme" },
    { key: "display.resolution", value: "1920x1080", type: "string", category: "display", description: "Display resolution" },
    { key: "display.primaryMonitor", value: "0", type: "number", category: "display", description: "Primary monitor index" },
    { key: "display.secondaryMonitor", value: "1", type: "number", category: "display", description: "Secondary monitor index" },
    { key: "backup.autoBackup", value: "true", type: "boolean", category: "backup", description: "Enable automatic backups" },
    { key: "backup.frequency", value: "daily", type: "string", category: "backup", description: "Backup frequency" },
    { key: "backup.location", value: "", type: "string", category: "backup", description: "Backup location path" },
    { key: "scripture.defaultTranslation", value: "KJV", type: "string", category: "general", description: "Default Bible translation" },
    { key: "presentation.defaultTransition", value: "fade", type: "string", category: "general", description: "Default slide transition" },
    { key: "presentation.transitionDuration", value: "500", type: "number", category: "general", description: "Transition duration in ms" }
  ];
  try {
    await db2.setting.createMany({
      data: defaultSettings
    });
  } catch (error) {
    console.log("Settings already exist in database");
  }
}
async function createSamplePresentations(db2) {
  console.log("Creating sample presentations...");
  const titleTemplate = await db2.template.create({
    data: {
      name: "Title Slide",
      description: "Simple title slide with centered text",
      category: "basic",
      isDefault: true,
      settings: JSON.stringify({
        textAlign: "center",
        fontSize: "x-large",
        fontWeight: "bold",
        textColor: "#ffffff",
        backgroundColor: "#1f2937",
        padding: { top: "20%", bottom: "20%", left: "10%", right: "10%" }
      })
    }
  });
  const contentTemplate = await db2.template.create({
    data: {
      name: "Content Slide",
      description: "Standard content slide with title and body",
      category: "basic",
      isDefault: true,
      settings: JSON.stringify({
        titleAlign: "center",
        contentAlign: "left",
        titleSize: "large",
        contentSize: "medium",
        titleColor: "#ffffff",
        contentColor: "#e5e7eb",
        backgroundColor: "#374151"
      })
    }
  });
  const darkBackground = await db2.background.create({
    data: {
      name: "Dark Blue",
      type: "gradient",
      category: "solid",
      isDefault: true,
      settings: JSON.stringify({
        type: "linear",
        direction: "45deg",
        stops: [
          { color: "#1e3a8a", position: 0 },
          { color: "#1e40af", position: 100 }
        ]
      })
    }
  });
  await db2.background.create({
    data: {
      name: "Light Gray",
      type: "color",
      category: "solid",
      isDefault: false,
      settings: JSON.stringify({
        color: "#f3f4f6"
      })
    }
  });
  const presentations = [
    {
      title: "Sunday Morning Service",
      description: "Welcome slides and announcements for Sunday morning worship",
      templateId: titleTemplate.id,
      slides: [
        {
          title: "Welcome",
          content: JSON.stringify({
            type: "title",
            title: "Welcome to Grace Community Church",
            subtitle: "Sunday Morning Worship",
            textAlign: "center",
            fontSize: "x-large",
            fontWeight: "bold",
            textColor: "#ffffff"
          }),
          backgroundId: darkBackground.id,
          templateId: titleTemplate.id,
          order: 0
        },
        {
          title: "Announcements",
          content: JSON.stringify({
            type: "bullet",
            title: "Church Announcements",
            bullets: [
              "Bible Study - Wednesday 7:00 PM",
              "Youth Group - Friday 6:00 PM",
              "Church Picnic - Saturday 12:00 PM",
              "Prayer Meeting - Sunday 6:00 PM"
            ],
            textAlign: "left",
            fontSize: "medium",
            fontWeight: "normal",
            textColor: "#ffffff"
          }),
          backgroundId: darkBackground.id,
          templateId: contentTemplate.id,
          order: 1
        },
        {
          title: "Offering",
          content: JSON.stringify({
            type: "title",
            title: "Giving & Offerings",
            subtitle: '"Each of you should give what you have decided in your heart to give." - 2 Corinthians 9:7',
            textAlign: "center",
            fontSize: "large",
            fontWeight: "normal",
            textColor: "#ffffff"
          }),
          backgroundId: darkBackground.id,
          templateId: titleTemplate.id,
          order: 2
        }
      ]
    },
    {
      title: "The Gospel Message",
      description: "Salvation presentation slides",
      templateId: contentTemplate.id,
      slides: [
        {
          title: "God Loves You",
          content: JSON.stringify({
            type: "text",
            title: "God Loves You",
            body: "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.\n\nJohn 3:16",
            textAlign: "center",
            fontSize: "large",
            fontWeight: "normal",
            textColor: "#ffffff"
          }),
          backgroundId: darkBackground.id,
          templateId: contentTemplate.id,
          order: 0
        },
        {
          title: "We Are Sinners",
          content: JSON.stringify({
            type: "text",
            title: "We Are All Sinners",
            body: "All have sinned and fall short of the glory of God.\n\nRomans 3:23\n\nFor the wages of sin is death, but the gift of God is eternal life in Christ Jesus our Lord.\n\nRomans 6:23",
            textAlign: "center",
            fontSize: "medium",
            fontWeight: "normal",
            textColor: "#ffffff"
          }),
          backgroundId: darkBackground.id,
          templateId: contentTemplate.id,
          order: 1
        },
        {
          title: "Jesus Died For Us",
          content: JSON.stringify({
            type: "text",
            title: "Jesus Died For Our Sins",
            body: "But God demonstrates his own love for us in this: While we were still sinners, Christ died for us.\n\nRomans 5:8",
            textAlign: "center",
            fontSize: "large",
            fontWeight: "normal",
            textColor: "#ffffff"
          }),
          backgroundId: darkBackground.id,
          templateId: contentTemplate.id,
          order: 2
        },
        {
          title: "Believe and Be Saved",
          content: JSON.stringify({
            type: "text",
            title: "Believe and Be Saved",
            body: 'If you declare with your mouth, "Jesus is Lord," and believe in your heart that God raised him from the dead, you will be saved.\n\nRomans 10:9',
            textAlign: "center",
            fontSize: "large",
            fontWeight: "normal",
            textColor: "#ffffff"
          }),
          backgroundId: darkBackground.id,
          templateId: contentTemplate.id,
          order: 3
        }
      ]
    },
    {
      title: "Christmas Service 2024",
      description: "Special Christmas worship service slides",
      templateId: titleTemplate.id,
      slides: [
        {
          title: "Christmas Welcome",
          content: JSON.stringify({
            type: "title",
            title: "Merry Christmas!",
            subtitle: "Celebrating the Birth of Our Savior",
            textAlign: "center",
            fontSize: "x-large",
            fontWeight: "bold",
            textColor: "#ffffff"
          }),
          backgroundId: darkBackground.id,
          templateId: titleTemplate.id,
          order: 0
        },
        {
          title: "The Christmas Story",
          content: JSON.stringify({
            type: "text",
            title: "The Birth of Jesus",
            body: "And she gave birth to her firstborn, a son. She wrapped him in cloths and placed him in a manger, because there was no guest room available for them.\n\nLuke 2:7",
            textAlign: "center",
            fontSize: "large",
            fontWeight: "normal",
            textColor: "#ffffff"
          }),
          backgroundId: darkBackground.id,
          templateId: contentTemplate.id,
          order: 1
        }
      ]
    }
  ];
  for (const presentationData of presentations) {
    const { slides, ...presentation } = presentationData;
    const createdPresentation = await db2.presentation.create({
      data: {
        ...presentation,
        lastUsed: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1e3).toISOString()
        // Random date within last 30 days
      }
    });
    for (const slideData of slides) {
      await db2.slide.create({
        data: {
          ...slideData,
          presentationId: createdPresentation.id
        }
      });
    }
  }
  console.log("Sample presentations created successfully");
}
const AVAILABLE_VERSIONS$1 = [
  { name: "KJV", fullName: "King James Version", filename: "kjv.json", description: "The King James Version of the Bible", year: 1611, publisher: "Various" },
  { name: "ASV", fullName: "American Standard Version", filename: "asv.json", description: "The American Standard Version of the Bible", year: 1901, publisher: "American Standard Version Committee" },
  { name: "ASVS", fullName: "American Standard Version with Strong's Numbers", filename: "asvs.json", description: "ASV with Strong's concordance numbers", year: 1901, publisher: "American Standard Version Committee" },
  { name: "WEB", fullName: "World English Bible", filename: "web.json", description: "The World English Bible", year: 2e3, publisher: "Rainbow Missions" },
  { name: "NET", fullName: "New English Translation", filename: "net.json", description: "The NET Bible", year: 2005, publisher: "Biblical Studies Press" },
  { name: "Geneva", fullName: "Geneva Bible", filename: "geneva.json", description: "The Geneva Bible (1599)", year: 1599, publisher: "Various" },
  { name: "Bishops", fullName: "Bishops' Bible", filename: "bishops.json", description: "The Bishops' Bible (1568)", year: 1568, publisher: "Church of England" },
  { name: "Coverdale", fullName: "Coverdale Bible", filename: "coverdale.json", description: "The Coverdale Bible (1535)", year: 1535, publisher: "Miles Coverdale" },
  { name: "Tyndale", fullName: "Tyndale Bible", filename: "tyndale.json", description: "The Tyndale Bible", year: 1526, publisher: "William Tyndale" },
  { name: "KJV_Strongs", fullName: "King James Version with Strong's Numbers", filename: "kjv_strongs.json", description: "KJV with Strong's concordance numbers", year: 1611, publisher: "Various" }
];
class BibleImporter {
  constructor() {
    this.db = getDatabase();
    this.databasePath = path.join(process.cwd(), "src", "database");
  }
  /**
   * Import all available Bible versions
   */
  async importAllVersions() {
    console.log("Starting Bible import process...");
    const englishTranslation = await this.ensureEnglishTranslation();
    for (const version of AVAILABLE_VERSIONS$1) {
      try {
        await this.importVersion(version, englishTranslation.id);
        console.log(`✓ Successfully imported ${version.fullName}`);
      } catch (error) {
        console.error(`✗ Failed to import ${version.fullName}:`, error);
      }
    }
    console.log("Bible import process completed.");
  }
  /**
   * Ensure English translation exists and return it
   */
  async ensureEnglishTranslation() {
    let englishTranslation = await this.db.translation.findUnique({
      where: { code: "en" }
    });
    if (!englishTranslation) {
      englishTranslation = await this.db.translation.create({
        data: {
          name: "English",
          code: "en",
          description: "English language",
          isDefault: true
        }
      });
    }
    return englishTranslation;
  }
  /**
   * Import a specific Bible version
   */
  async importVersion(versionInfo, translationId) {
    const jsonPath = path.join(this.databasePath, "json", versionInfo.filename);
    if (!fs.existsSync(jsonPath)) {
      throw new Error(`Bible file not found: ${jsonPath}`);
    }
    let version = await this.db.version.findFirst({
      where: {
        name: versionInfo.name,
        translationId
      }
    });
    if (version) {
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
      version = await this.db.version.create({
        data: {
          name: versionInfo.name,
          fullName: versionInfo.fullName,
          translationId,
          description: versionInfo.description,
          isDefault: versionInfo.name === "KJV",
          year: versionInfo.year,
          publisher: versionInfo.publisher
        }
      });
    }
    console.log(`Reading ${versionInfo.filename}...`);
    const jsonData = fs.readFileSync(jsonPath, "utf8");
    const verses = JSON.parse(jsonData);
    console.log(`Importing ${verses.length} verses for ${versionInfo.fullName}...`);
    const batchSize = 1e3;
    for (let i = 0; i < verses.length; i += batchSize) {
      const batch = verses.slice(i, i + batchSize);
      const verseData = batch.map((verse) => ({
        bookId: verse.book,
        chapter: verse.chapter,
        verse: verse.verse,
        text: verse.text,
        versionId: version.id
      }));
      try {
        await this.db.verse.createMany({
          data: verseData
        });
      } catch (error) {
        console.log(`  Some verses in batch ${i / batchSize + 1} already exist, continuing...`);
      }
      const progress = Math.min(i + batchSize, verses.length);
      const percentage = (progress / verses.length * 100).toFixed(1);
      console.log(`  Progress: ${progress}/${verses.length} (${percentage}%)`);
    }
  }
  /**
   * Import a single version by name
   */
  async importSingleVersion(versionName) {
    const version = AVAILABLE_VERSIONS$1.find((v) => v.name === versionName);
    if (!version) {
      throw new Error(`Version not found: ${versionName}`);
    }
    const englishTranslation = await this.ensureEnglishTranslation();
    await this.importVersion(version, englishTranslation.id);
  }
  /**
   * Get list of available versions
   */
  getAvailableVersions() {
    return AVAILABLE_VERSIONS$1;
  }
  /**
   * Check which versions are already imported
   */
  async getImportedVersions() {
    const versions = await this.db.version.findMany({
      select: { name: true }
    });
    return versions.map((v) => v.name);
  }
  /**
   * Get import statistics
   */
  async getImportStats() {
    const stats = {};
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
  async verifyImport(versionName) {
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
    const missingBooks = books.filter((book) => book._count.verses === 0);
    if (missingBooks.length > 0) {
      console.warn(`Missing verses for books: ${missingBooks.map((b) => b.name).join(", ")}`);
      return false;
    }
    console.log(`✓ ${versionName} import verification passed`);
    return true;
  }
  /**
   * Create basic topics for scripture search
   */
  async createBasicTopics() {
    const basicTopics = [
      { name: "Love", description: "Verses about love and loving others" },
      { name: "Faith", description: "Verses about faith and believing" },
      { name: "Hope", description: "Verses about hope and trust" },
      { name: "Peace", description: "Verses about peace and tranquility" },
      { name: "Joy", description: "Verses about joy and happiness" },
      { name: "Forgiveness", description: "Verses about forgiveness and mercy" },
      { name: "Salvation", description: "Verses about salvation and redemption" },
      { name: "Prayer", description: "Verses about prayer and communication with God" },
      { name: "Wisdom", description: "Verses about wisdom and understanding" },
      { name: "Strength", description: "Verses about strength and courage" },
      { name: "Comfort", description: "Verses about comfort in times of trouble" },
      { name: "Guidance", description: "Verses about divine guidance and direction" },
      { name: "Thanksgiving", description: "Verses about gratitude and thanksgiving" },
      { name: "Worship", description: "Verses about worship and praise" },
      { name: "Service", description: "Verses about serving others and ministry" }
    ];
    for (const topicData of basicTopics) {
      await this.db.topic.upsert({
        where: { name: topicData.name },
        update: {},
        create: topicData
      });
    }
    console.log("✓ Basic topics created");
  }
  // Legacy method names for backward compatibility
  async importAllTranslations() {
    return this.importAllVersions();
  }
  async importSingleTranslation(translationName) {
    return this.importSingleVersion(translationName);
  }
  getAvailableTranslations() {
    return this.getAvailableVersions();
  }
  async getImportedTranslations() {
    return this.getImportedVersions();
  }
}
const bibleImporter = new BibleImporter();
const AVAILABLE_VERSIONS = [
  { name: "KJV", fullName: "King James Version", filename: "kjv.sqlite", description: "The King James Version of the Bible", year: 1611, publisher: "Various" },
  { name: "ASV", fullName: "American Standard Version", filename: "asv.sqlite", description: "The American Standard Version of the Bible", year: 1901, publisher: "American Standard Version Committee" },
  { name: "ASVS", fullName: "American Standard Version with Strong's Numbers", filename: "asvs.sqlite", description: "ASV with Strong's concordance numbers", year: 1901, publisher: "American Standard Version Committee" },
  { name: "WEB", fullName: "World English Bible", filename: "web.sqlite", description: "The World English Bible", year: 2e3, publisher: "Rainbow Missions" },
  { name: "NET", fullName: "New English Translation", filename: "net.sqlite", description: "The NET Bible", year: 2005, publisher: "Biblical Studies Press" },
  { name: "Geneva", fullName: "Geneva Bible", filename: "geneva.sqlite", description: "The Geneva Bible (1599)", year: 1599, publisher: "Various" },
  { name: "Bishops", fullName: "Bishops' Bible", filename: "bishops.sqlite", description: "The Bishops' Bible (1568)", year: 1568, publisher: "Church of England" },
  { name: "Coverdale", fullName: "Coverdale Bible", filename: "coverdale.sqlite", description: "The Coverdale Bible (1535)", year: 1535, publisher: "Miles Coverdale" },
  { name: "Tyndale", fullName: "Tyndale Bible", filename: "tyndale.sqlite", description: "The Tyndale Bible", year: 1526, publisher: "William Tyndale" },
  { name: "KJV_Strongs", fullName: "King James Version with Strong's Numbers", filename: "kjv_strongs.sqlite", description: "KJV with Strong's concordance numbers", year: 1611, publisher: "Various" }
];
class SQLiteBibleImporter {
  constructor() {
    this.db = getDatabase();
    this.databasePath = path.join(process.cwd(), "src", "database");
  }
  /**
   * Import all available Bible versions using SQLite direct connection
   */
  async importAllVersions() {
    console.log("Starting SQLite Bible import process...");
    const englishTranslation = await this.ensureEnglishTranslation();
    for (const version of AVAILABLE_VERSIONS) {
      try {
        await this.importVersionFromSQLite(version, englishTranslation.id);
        console.log(`✓ Successfully imported ${version.fullName}`);
      } catch (error) {
        console.error(`✗ Failed to import ${version.fullName}:`, error);
      }
    }
    console.log("SQLite Bible import process completed.");
  }
  /**
   * Ensure English translation exists and return it
   */
  async ensureEnglishTranslation() {
    let englishTranslation = await this.db.translation.findUnique({
      where: { code: "en" }
    });
    if (!englishTranslation) {
      englishTranslation = await this.db.translation.create({
        data: {
          name: "English",
          code: "en",
          description: "English language",
          isDefault: true
        }
      });
    }
    return englishTranslation;
  }
  /**
   * Import a specific Bible version from SQLite file
   */
  async importVersionFromSQLite(versionInfo, translationId) {
    const sqlitePath = path.join(this.databasePath, "sqlite", versionInfo.filename);
    if (!fs.existsSync(sqlitePath)) {
      throw new Error(`SQLite Bible file not found: ${sqlitePath}`);
    }
    const metaData = await this.readSQLiteMetadata(sqlitePath);
    let version = await this.db.version.findFirst({
      where: {
        name: versionInfo.name,
        translationId
      }
    });
    if (version) {
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
      version = await this.db.version.create({
        data: {
          name: versionInfo.name,
          fullName: metaData.name || versionInfo.fullName,
          translationId,
          description: versionInfo.description,
          isDefault: versionInfo.name === "KJV",
          year: metaData.year ? parseInt(metaData.year.split("/")[0]) : versionInfo.year,
          publisher: metaData.publisher || versionInfo.publisher
        }
      });
    }
    console.log(`Importing verses for ${versionInfo.fullName} from SQLite...`);
    await this.importVersesFromSQLite(sqlitePath, version.id);
  }
  /**
   * Read metadata from SQLite file
   */
  async readSQLiteMetadata(sqlitePath) {
    return new Promise((resolve, reject) => {
      const sqlite3 = require("sqlite3").verbose();
      const db2 = new sqlite3.Database(sqlitePath, sqlite3.OPEN_READONLY, (err) => {
        if (err) {
          reject(err);
          return;
        }
      });
      const meta = {};
      db2.all("SELECT field, value FROM meta", (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        rows.forEach((row) => {
          switch (row.field) {
            case "name":
              meta.name = row.value;
              break;
            case "shortname":
              meta.shortname = row.value;
              break;
            case "module":
              meta.module = row.value;
              break;
            case "year":
              meta.year = row.value;
              break;
            case "publisher":
              meta.publisher = row.value;
              break;
          }
        });
        db2.close((err2) => {
          if (err2) {
            reject(err2);
          } else {
            resolve(meta);
          }
        });
      });
    });
  }
  /**
   * Import verses from SQLite file using efficient bulk operations
   */
  async importVersesFromSQLite(sqlitePath, versionId) {
    return new Promise((resolve, reject) => {
      const sqlite3 = require("sqlite3").verbose();
      const sourceDb = new sqlite3.Database(sqlitePath, sqlite3.OPEN_READONLY, (err) => {
        if (err) {
          reject(err);
          return;
        }
      });
      sourceDb.get("SELECT COUNT(*) as count FROM verses", async (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        const totalVerses = row.count;
        console.log(`  Found ${totalVerses} verses to import`);
        let importedCount = 0;
        const batchSize = 5e3;
        sourceDb.all("SELECT book, chapter, verse, text FROM verses ORDER BY book, chapter, verse", async (err2, rows) => {
          if (err2) {
            reject(err2);
            return;
          }
          for (let i = 0; i < rows.length; i += batchSize) {
            const batch = rows.slice(i, i + batchSize);
            const verseData = batch.map((verse) => ({
              bookId: verse.book,
              chapter: verse.chapter,
              verse: verse.verse,
              text: verse.text,
              versionId
            }));
            try {
              await this.db.verse.createMany({
                data: verseData
              });
              importedCount += batch.length;
              const percentage = (importedCount / totalVerses * 100).toFixed(1);
              console.log(`  Progress: ${importedCount}/${totalVerses} (${percentage}%)`);
            } catch (error) {
              console.error(`  Error importing batch ${i / batchSize + 1}:`, error);
            }
          }
          sourceDb.close((err3) => {
            if (err3) {
              console.error("Error closing source database:", err3);
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
  async importSingleVersionFromSQLite(versionName) {
    const version = AVAILABLE_VERSIONS.find((v) => v.name === versionName);
    if (!version) {
      throw new Error(`Version not found: ${versionName}`);
    }
    const englishTranslation = await this.ensureEnglishTranslation();
    await this.importVersionFromSQLite(version, englishTranslation.id);
  }
  /**
   * Get list of available versions
   */
  getAvailableVersions() {
    return AVAILABLE_VERSIONS;
  }
  /**
   * Check which versions are already imported
   */
  async getImportedVersions() {
    const versions = await this.db.version.findMany({
      select: { name: true }
    });
    return versions.map((v) => v.name);
  }
  /**
   * Get import statistics
   */
  async getImportStats() {
    const stats = {};
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
  async verifyImport(versionName) {
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
    const expectedCounts = {
      "KJV": 31102,
      "ASV": 31086,
      "WEB": 31086,
      "NET": 31086
    };
    const expectedCount = expectedCounts[versionName];
    if (expectedCount && Math.abs(verseCount - expectedCount) > 100) {
      console.warn(`Warning: ${versionName} has ${verseCount} verses, expected around ${expectedCount}`);
    }
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
    const missingBooks = books.filter((book) => book._count.verses === 0);
    if (missingBooks.length > 0) {
      console.warn(`Missing verses for books: ${missingBooks.map((b) => b.name).join(", ")}`);
      return false;
    }
    console.log(`✓ ${versionName} import verification passed`);
    return true;
  }
  /**
   * Create basic topics for scripture search
   */
  async createBasicTopics() {
    const basicTopics = [
      { name: "Love", description: "Verses about love and loving others" },
      { name: "Faith", description: "Verses about faith and believing" },
      { name: "Hope", description: "Verses about hope and trust" },
      { name: "Peace", description: "Verses about peace and tranquility" },
      { name: "Joy", description: "Verses about joy and happiness" },
      { name: "Forgiveness", description: "Verses about forgiveness and mercy" },
      { name: "Salvation", description: "Verses about salvation and redemption" },
      { name: "Prayer", description: "Verses about prayer and communication with God" },
      { name: "Wisdom", description: "Verses about wisdom and understanding" },
      { name: "Strength", description: "Verses about strength and courage" },
      { name: "Comfort", description: "Verses about comfort in times of trouble" },
      { name: "Guidance", description: "Verses about divine guidance and direction" },
      { name: "Thanksgiving", description: "Verses about gratitude and thanksgiving" },
      { name: "Worship", description: "Verses about worship and praise" },
      { name: "Service", description: "Verses about serving others and ministry" }
    ];
    for (const topicData of basicTopics) {
      await this.db.topic.upsert({
        where: { name: topicData.name },
        update: {},
        create: topicData
      });
    }
    console.log("✓ Basic topics created");
  }
  /**
   * Alternative method using SQLite ATTACH for ultra-fast imports
   * This method directly attaches the source SQLite file and copies data
   */
  async importVersionUsingSQLiteAttach(versionInfo, translationId) {
    const sqlitePath = path.join(this.databasePath, "sqlite", versionInfo.filename);
    if (!fs.existsSync(sqlitePath)) {
      throw new Error(`SQLite Bible file not found: ${sqlitePath}`);
    }
    const metaData = await this.readSQLiteMetadata(sqlitePath);
    let version = await this.db.version.findFirst({
      where: {
        name: versionInfo.name,
        translationId
      }
    });
    if (!version) {
      version = await this.db.version.create({
        data: {
          name: versionInfo.name,
          fullName: metaData.name || versionInfo.fullName,
          translationId,
          description: versionInfo.description,
          isDefault: versionInfo.name === "KJV",
          year: metaData.year ? parseInt(metaData.year.split("/")[0]) : versionInfo.year,
          publisher: metaData.publisher || versionInfo.publisher
        }
      });
    }
    console.log(`Using SQLite ATTACH method for ${versionInfo.fullName}...`);
    try {
      await this.db.$executeRawUnsafe(`ATTACH DATABASE '${sqlitePath}' AS bible_source`);
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
      const verseCount = await this.db.verse.count({
        where: { versionId: version.id }
      });
      console.log(`✓ Imported ${verseCount} verses using SQLite ATTACH method`);
    } catch (error) {
      console.error("SQLite ATTACH method failed, falling back to batch import:", error);
      await this.importVersesFromSQLite(sqlitePath, version.id);
    }
  }
}
const sqliteBibleImporter = new SQLiteBibleImporter();
let db = null;
function parseSongStructure(lyrics) {
  if (!lyrics) {
    return { slides: [], order: [] };
  }
  const lines = lyrics.split("\n");
  const slides = [];
  const order = [];
  let currentSlide = null;
  let slideCounter = 1;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const sectionMatch = line.match(/^(Verse|Chorus|Bridge|Intro|Outro|Tag)(\s+(\d+))?:?\s*$/i);
    if (sectionMatch) {
      if (currentSlide) {
        slides.push(currentSlide);
        order.push(currentSlide.id);
      }
      const type = sectionMatch[1].toLowerCase();
      const number = sectionMatch[3] ? parseInt(sectionMatch[3]) : void 0;
      const slideId = `${type}${number || ""}`;
      const title = number ? `${sectionMatch[1]} ${number}` : sectionMatch[1];
      currentSlide = {
        id: slideId,
        type,
        number,
        title,
        content: "",
        chords: void 0
      };
    } else if (line.length > 0 && currentSlide) {
      currentSlide.content += (currentSlide.content ? "\n" : "") + line;
    } else if (line.length > 0 && !currentSlide) {
      currentSlide = {
        id: `slide${slideCounter}`,
        type: "verse",
        number: slideCounter,
        title: `Slide ${slideCounter}`,
        content: line,
        chords: void 0
      };
      slideCounter++;
    }
  }
  if (currentSlide) {
    slides.push(currentSlide);
    order.push(currentSlide.id);
  }
  return { slides, order };
}
async function initializeDatabaseMain() {
  try {
    db = initializeDatabase();
    console.log("Database initialized in main process");
    setupDatabaseIPC();
    return db;
  } catch (error) {
    console.error("Failed to initialize database in main process:", error);
    throw error;
  }
}
function setupDatabaseIPC() {
  electron.ipcMain.handle("db:loadTranslations", async () => {
    try {
      const translations = await db.translation.findMany({
        orderBy: { name: "asc" }
      });
      return translations.map((translation) => ({
        ...translation,
        createdAt: translation.createdAt?.toISOString(),
        updatedAt: translation.updatedAt?.toISOString()
      }));
    } catch (error) {
      console.error("Error loading translations:", error);
      throw error;
    }
  });
  electron.ipcMain.handle("db:loadVersions", async (event, translationId) => {
    try {
      const whereClause = translationId ? { translationId } : {};
      const versions = await db.version.findMany({
        where: whereClause,
        include: {
          translation: true
        },
        orderBy: { name: "asc" }
      });
      return versions.map((version) => ({
        ...version,
        createdAt: version.createdAt?.toISOString(),
        updatedAt: version.updatedAt?.toISOString(),
        translation: version.translation ? {
          ...version.translation,
          createdAt: version.translation.createdAt?.toISOString(),
          updatedAt: version.translation.updatedAt?.toISOString()
        } : null
      }));
    } catch (error) {
      console.error("Error loading versions:", error);
      throw error;
    }
  });
  electron.ipcMain.handle("db:loadBooks", async () => {
    try {
      const books = await db.book.findMany({
        orderBy: { order: "asc" }
      });
      return books;
    } catch (error) {
      console.error("Error loading books:", error);
      throw error;
    }
  });
  electron.ipcMain.handle(
    "db:loadVerses",
    async (event, {
      versionId,
      bookId,
      chapter
    }) => {
      try {
        const verses = await db.verse.findMany({
          where: {
            versionId,
            bookId,
            chapter
          },
          include: {
            book: true,
            version: {
              include: {
                translation: true
              }
            }
          },
          orderBy: { verse: "asc" }
        });
        return verses.map((verse) => ({
          ...verse,
          createdAt: verse.createdAt?.toISOString(),
          updatedAt: verse.updatedAt?.toISOString(),
          book: verse.book ? {
            ...verse.book,
            createdAt: verse.book.createdAt?.toISOString(),
            updatedAt: verse.book.updatedAt?.toISOString()
          } : null,
          version: verse.version ? {
            ...verse.version,
            createdAt: verse.version.createdAt?.toISOString(),
            updatedAt: verse.version.updatedAt?.toISOString(),
            translation: verse.version.translation ? {
              ...verse.version.translation,
              createdAt: verse.version.translation.createdAt?.toISOString(),
              updatedAt: verse.version.translation.updatedAt?.toISOString()
            } : null
          } : null
        }));
      } catch (error) {
        console.error("Error loading verses:", error);
        throw error;
      }
    }
  );
  electron.ipcMain.handle(
    "db:searchVerses",
    async (event, { query, versionId }) => {
      try {
        const whereClause = {
          text: {
            contains: query
          }
        };
        if (versionId) {
          whereClause.versionId = versionId;
        }
        const verses = await db.verse.findMany({
          where: whereClause,
          include: {
            book: true,
            version: {
              include: {
                translation: true
              }
            }
          },
          take: 50,
          // Limit results
          orderBy: [
            { book: { order: "asc" } },
            { chapter: "asc" },
            { verse: "asc" }
          ]
        });
        return verses.map((verse) => ({
          ...verse,
          createdAt: verse.createdAt?.toISOString(),
          updatedAt: verse.updatedAt?.toISOString(),
          book: verse.book ? {
            ...verse.book,
            createdAt: verse.book.createdAt?.toISOString(),
            updatedAt: verse.book.updatedAt?.toISOString()
          } : null,
          version: verse.version ? {
            ...verse.version,
            createdAt: verse.version.createdAt?.toISOString(),
            updatedAt: verse.version.updatedAt?.toISOString(),
            translation: verse.version.translation ? {
              ...verse.version.translation,
              createdAt: verse.version.translation.createdAt?.toISOString(),
              updatedAt: verse.version.translation.updatedAt?.toISOString()
            } : null
          } : null
        }));
      } catch (error) {
        console.error("Error searching verses:", error);
        throw error;
      }
    }
  );
  electron.ipcMain.handle("db:seed", async () => {
    try {
      await seedDatabase();
      await bibleImporter.createBasicTopics();
      return { success: true };
    } catch (error) {
      console.error("Error seeding database:", error);
      throw error;
    }
  });
  electron.ipcMain.handle("db:importBibles", async () => {
    try {
      await bibleImporter.importAllVersions();
      return { success: true };
    } catch (error) {
      console.error("Error importing Bibles:", error);
      throw error;
    }
  });
  electron.ipcMain.handle("db:importBiblesSQLite", async () => {
    try {
      await sqliteBibleImporter.importAllVersions();
      return { success: true };
    } catch (error) {
      console.error("Error importing Bibles from SQLite:", error);
      throw error;
    }
  });
  electron.ipcMain.handle(
    "db:importSingleBibleSQLite",
    async (event, versionName) => {
      try {
        await sqliteBibleImporter.importSingleVersionFromSQLite(versionName);
        return { success: true };
      } catch (error) {
        console.error("Error importing single Bible from SQLite:", error);
        throw error;
      }
    }
  );
  electron.ipcMain.handle("db:getImportStats", async () => {
    try {
      const stats = await sqliteBibleImporter.getImportStats();
      return stats;
    } catch (error) {
      console.error("Error getting import stats:", error);
      throw error;
    }
  });
  electron.ipcMain.handle(
    "db:loadSongs",
    async (event, params = {}) => {
      try {
        const { query, filters = {}, limit = 50, offset = 0 } = params;
        const whereConditions = [];
        if (query) {
          whereConditions.push({
            OR: [
              { title: { contains: query } },
              { artist: { contains: query } },
              { author: { contains: query } },
              { lyrics: { contains: query } },
              { category: { contains: query } }
            ]
          });
        }
        if (filters.category) {
          whereConditions.push({ category: filters.category });
        }
        if (filters.key) {
          whereConditions.push({ key: filters.key });
        }
        if (filters.tempo) {
          whereConditions.push({ tempo: filters.tempo });
        }
        if (filters.artist) {
          whereConditions.push({
            artist: { contains: filters.artist }
          });
        }
        if (filters.ccliNumber) {
          whereConditions.push({ ccliNumber: filters.ccliNumber });
        }
        if (filters.tags && filters.tags.length > 0) {
          whereConditions.push({
            OR: filters.tags.map((tag) => ({
              tags: { contains: tag }
            }))
          });
        }
        const where = whereConditions.length > 0 ? { AND: whereConditions } : {};
        let orderBy = [];
        if (filters.usage === "recent") {
          orderBy = [{ lastUsed: "desc" }, { updatedAt: "desc" }];
        } else if (filters.usage === "frequent") {
          orderBy = [{ usageCount: "desc" }, { lastUsed: "desc" }];
        } else {
          orderBy = [{ title: "asc" }];
        }
        const songs = await db.song.findMany({
          where,
          orderBy,
          take: limit,
          skip: offset
        });
        return songs.map((song) => ({
          ...song,
          tags: song.tags ? JSON.parse(song.tags) : [],
          createdAt: song.createdAt?.toISOString(),
          updatedAt: song.updatedAt?.toISOString(),
          lastUsed: song.lastUsed?.toISOString()
        }));
      } catch (error) {
        console.error("Error loading songs:", error);
        throw error;
      }
    }
  );
  electron.ipcMain.handle(
    "db:searchSongs",
    async (event, searchParams) => {
      try {
        return await electron.ipcMain.emit("db:loadSongs", event, searchParams);
      } catch (error) {
        console.error("Error searching songs:", error);
        throw error;
      }
    }
  );
  electron.ipcMain.handle("db:getSong", async (event, songId) => {
    try {
      const song = await db.song.findUnique({
        where: { id: songId }
      });
      if (!song) {
        throw new Error(`Song with ID ${songId} not found`);
      }
      const songData = {
        ...song,
        tags: song.tags ? JSON.parse(song.tags) : [],
        structure: song.lyrics ? parseSongStructure(song.lyrics) : { slides: [], order: [] },
        createdAt: song.createdAt?.toISOString(),
        updatedAt: song.updatedAt?.toISOString(),
        lastUsed: song.lastUsed?.toISOString()
      };
      return songData;
    } catch (error) {
      console.error("Error getting song:", error);
      throw error;
    }
  });
  electron.ipcMain.handle("db:createSong", async (event, songData) => {
    try {
      const newSong = await db.song.create({
        data: {
          ...songData,
          tags: songData.tags ? JSON.stringify(songData.tags) : null,
          usageCount: 0
        }
      });
      return {
        ...newSong,
        tags: newSong.tags ? JSON.parse(newSong.tags) : [],
        structure: newSong.lyrics ? parseSongStructure(newSong.lyrics) : { slides: [], order: [] },
        createdAt: newSong.createdAt?.toISOString(),
        updatedAt: newSong.updatedAt?.toISOString(),
        lastUsed: newSong.lastUsed?.toISOString()
      };
    } catch (error) {
      console.error("Error creating song:", error);
      throw error;
    }
  });
  electron.ipcMain.handle("db:updateSong", async (event, song) => {
    try {
      const {
        structure,
        // Remove computed field
        createdAt,
        // Remove readonly field
        ...songData
      } = song;
      const updatedSong = await db.song.update({
        where: { id: song.id },
        data: {
          ...songData,
          tags: song.tags ? JSON.stringify(song.tags) : null,
          updatedAt: /* @__PURE__ */ new Date()
        }
      });
      return {
        ...updatedSong,
        tags: updatedSong.tags ? JSON.parse(updatedSong.tags) : [],
        structure: updatedSong.lyrics ? parseSongStructure(updatedSong.lyrics) : { slides: [], order: [] },
        createdAt: updatedSong.createdAt?.toISOString(),
        updatedAt: updatedSong.updatedAt?.toISOString(),
        lastUsed: updatedSong.lastUsed?.toISOString()
      };
    } catch (error) {
      console.error("Error updating song:", error);
      throw error;
    }
  });
  electron.ipcMain.handle("db:deleteSong", async (event, songId) => {
    try {
      const serviceItems = await db.serviceItem.findMany({
        where: { songId }
      });
      if (serviceItems.length > 0) {
        throw new Error(`Cannot delete song: it is used in ${serviceItems.length} service(s)`);
      }
      await db.song.delete({
        where: { id: songId }
      });
      return { success: true };
    } catch (error) {
      console.error("Error deleting song:", error);
      throw error;
    }
  });
  electron.ipcMain.handle("db:updateSongUsage", async (event, songId) => {
    try {
      const updatedSong = await db.song.update({
        where: { id: songId },
        data: {
          lastUsed: /* @__PURE__ */ new Date(),
          usageCount: {
            increment: 1
          }
        }
      });
      return {
        ...updatedSong,
        tags: updatedSong.tags ? JSON.parse(updatedSong.tags) : [],
        structure: updatedSong.lyrics ? parseSongStructure(updatedSong.lyrics) : { slides: [], order: [] },
        createdAt: updatedSong.createdAt?.toISOString(),
        updatedAt: updatedSong.updatedAt?.toISOString(),
        lastUsed: updatedSong.lastUsed?.toISOString()
      };
    } catch (error) {
      console.error("Error updating song usage:", error);
      throw error;
    }
  });
  electron.ipcMain.handle("db:getRecentSongs", async (event, { limit = 10 } = {}) => {
    try {
      const songs = await db.song.findMany({
        where: {
          lastUsed: { not: null }
        },
        orderBy: { lastUsed: "desc" },
        take: limit
      });
      return songs.map((song) => ({
        ...song,
        tags: song.tags ? JSON.parse(song.tags) : [],
        structure: song.lyrics ? parseSongStructure(song.lyrics) : { slides: [], order: [] },
        createdAt: song.createdAt?.toISOString(),
        updatedAt: song.updatedAt?.toISOString(),
        lastUsed: song.lastUsed?.toISOString()
      }));
    } catch (error) {
      console.error("Error getting recent songs:", error);
      throw error;
    }
  });
  electron.ipcMain.handle("db:getFavoriteSongs", async (event, { limit = 20 } = {}) => {
    try {
      const songs = await db.song.findMany({
        orderBy: { usageCount: "desc" },
        take: limit
      });
      return songs.map((song) => ({
        ...song,
        tags: song.tags ? JSON.parse(song.tags) : [],
        structure: song.lyrics ? parseSongStructure(song.lyrics) : { slides: [], order: [] },
        createdAt: song.createdAt?.toISOString(),
        updatedAt: song.updatedAt?.toISOString(),
        lastUsed: song.lastUsed?.toISOString()
      }));
    } catch (error) {
      console.error("Error getting favorite songs:", error);
      throw error;
    }
  });
  electron.ipcMain.handle("db:getSongCategories", async () => {
    try {
      const categories = await db.song.findMany({
        select: { category: true },
        where: { category: { not: null } },
        distinct: ["category"]
      });
      return categories.map((c) => c.category).filter(Boolean);
    } catch (error) {
      console.error("Error getting song categories:", error);
      throw error;
    }
  });
  electron.ipcMain.handle("db:importSongs", async (event, importData) => {
    try {
      const { songs, format } = importData;
      const importedSongs = [];
      for (const songData of songs) {
        try {
          const newSong = await db.song.create({
            data: {
              ...songData,
              tags: songData.tags ? JSON.stringify(songData.tags) : null,
              usageCount: 0
            }
          });
          importedSongs.push({
            ...newSong,
            tags: newSong.tags ? JSON.parse(newSong.tags) : [],
            structure: newSong.lyrics ? parseSongStructure(newSong.lyrics) : { slides: [], order: [] },
            createdAt: newSong.createdAt?.toISOString(),
            updatedAt: newSong.updatedAt?.toISOString(),
            lastUsed: newSong.lastUsed?.toISOString()
          });
        } catch (error) {
          console.error(`Error importing song "${songData.title}":`, error);
        }
      }
      return {
        success: true,
        imported: importedSongs.length,
        total: songs.length,
        songs: importedSongs
      };
    } catch (error) {
      console.error("Error importing songs:", error);
      throw error;
    }
  });
  electron.ipcMain.handle(
    "db:loadPresentations",
    async (event, params = {}) => {
      try {
        const { query, filters = {}, limit = 50, offset = 0 } = params;
        const whereConditions = [];
        if (query) {
          whereConditions.push({
            OR: [
              { title: { contains: query } },
              { description: { contains: query } }
            ]
          });
        }
        if (filters.category) {
          whereConditions.push({
            template: {
              category: filters.category
            }
          });
        }
        if (filters.dateRange) {
          whereConditions.push({
            createdAt: {
              gte: new Date(filters.dateRange.start),
              lte: new Date(filters.dateRange.end)
            }
          });
        }
        const where = whereConditions.length > 0 ? { AND: whereConditions } : {};
        let orderBy = [];
        if (filters.usage === "recent") {
          orderBy = [{ lastUsed: "desc" }, { updatedAt: "desc" }];
        } else if (filters.usage === "frequent") {
          orderBy = [{ lastUsed: "desc" }];
        } else {
          orderBy = [{ title: "asc" }];
        }
        const presentations = await db.presentation.findMany({
          where,
          include: {
            slides: {
              orderBy: { order: "asc" }
            },
            template: true
          },
          orderBy,
          take: limit,
          skip: offset
        });
        return presentations.map((presentation) => ({
          ...presentation,
          tags: [],
          // Default empty tags since field doesn't exist
          usageCount: 0,
          // Default usage count since field doesn't exist
          category: presentation.template?.category || null,
          // Get category from template
          slides: presentation.slides.map((slide) => ({
            ...slide,
            createdAt: slide.createdAt?.toISOString(),
            updatedAt: slide.updatedAt?.toISOString()
          })),
          createdAt: presentation.createdAt?.toISOString(),
          updatedAt: presentation.updatedAt?.toISOString(),
          lastUsed: presentation.lastUsed?.toISOString(),
          totalSlides: presentation.slides.length
        }));
      } catch (error) {
        console.error("Error loading presentations:", error);
        throw error;
      }
    }
  );
  electron.ipcMain.handle(
    "db:searchPresentations",
    async (event, searchParams) => {
      try {
        return await electron.ipcMain.emit("db:loadPresentations", event, searchParams);
      } catch (error) {
        console.error("Error searching presentations:", error);
        throw error;
      }
    }
  );
  electron.ipcMain.handle("db:getPresentation", async (event, presentationId) => {
    try {
      const presentation = await db.presentation.findUnique({
        where: { id: presentationId },
        include: {
          slides: {
            orderBy: { order: "asc" }
          },
          template: true
        }
      });
      if (!presentation) {
        throw new Error(`Presentation with ID ${presentationId} not found`);
      }
      return {
        ...presentation,
        tags: [],
        // Default empty tags since field doesn't exist
        usageCount: 0,
        // Default usage count since field doesn't exist
        category: presentation.template?.category || null,
        // Get category from template
        slides: presentation.slides.map((slide) => ({
          ...slide,
          createdAt: slide.createdAt?.toISOString(),
          updatedAt: slide.updatedAt?.toISOString()
        })),
        createdAt: presentation.createdAt?.toISOString(),
        updatedAt: presentation.updatedAt?.toISOString(),
        lastUsed: presentation.lastUsed?.toISOString(),
        totalSlides: presentation.slides.length
      };
    } catch (error) {
      console.error("Error getting presentation:", error);
      throw error;
    }
  });
  electron.ipcMain.handle("db:createPresentation", async (event, presentationData) => {
    try {
      const newPresentation = await db.presentation.create({
        data: {
          title: presentationData.title,
          description: presentationData.description,
          templateId: presentationData.templateId
        },
        include: {
          slides: {
            orderBy: { order: "asc" }
          },
          template: true
        }
      });
      return {
        ...newPresentation,
        tags: [],
        // Default empty tags since field doesn't exist
        usageCount: 0,
        // Default usage count since field doesn't exist
        category: newPresentation.template?.category || null,
        // Get category from template
        slides: newPresentation.slides.map((slide) => ({
          ...slide,
          createdAt: slide.createdAt?.toISOString(),
          updatedAt: slide.updatedAt?.toISOString()
        })),
        createdAt: newPresentation.createdAt?.toISOString(),
        updatedAt: newPresentation.updatedAt?.toISOString(),
        lastUsed: newPresentation.lastUsed?.toISOString(),
        totalSlides: newPresentation.slides.length
      };
    } catch (error) {
      console.error("Error creating presentation:", error);
      throw error;
    }
  });
  electron.ipcMain.handle("db:updatePresentation", async (event, presentation) => {
    try {
      const {
        slides,
        // Remove computed field
        totalSlides,
        // Remove computed field
        template,
        // Remove computed field
        createdAt,
        // Remove readonly field
        ...presentationData
      } = presentation;
      const updatedPresentation = await db.presentation.update({
        where: { id: presentation.id },
        data: {
          title: presentation.title,
          description: presentation.description,
          templateId: presentation.templateId,
          lastUsed: presentation.lastUsed ? new Date(presentation.lastUsed) : void 0
        },
        include: {
          slides: {
            orderBy: { order: "asc" }
          },
          template: true
        }
      });
      return {
        ...updatedPresentation,
        tags: updatedPresentation.tags ? JSON.parse(updatedPresentation.tags) : [],
        slides: updatedPresentation.slides.map((slide) => ({
          ...slide,
          createdAt: slide.createdAt?.toISOString(),
          updatedAt: slide.updatedAt?.toISOString()
        })),
        createdAt: updatedPresentation.createdAt?.toISOString(),
        updatedAt: updatedPresentation.updatedAt?.toISOString(),
        lastUsed: updatedPresentation.lastUsed?.toISOString(),
        totalSlides: updatedPresentation.slides.length
      };
    } catch (error) {
      console.error("Error updating presentation:", error);
      throw error;
    }
  });
  electron.ipcMain.handle("db:deletePresentation", async (event, presentationId) => {
    try {
      await db.slide.deleteMany({
        where: { presentationId }
      });
      await db.presentation.delete({
        where: { id: presentationId }
      });
      return { success: true };
    } catch (error) {
      console.error("Error deleting presentation:", error);
      throw error;
    }
  });
  electron.ipcMain.handle("db:createSlide", async (event, slideData) => {
    try {
      const newSlide = await db.slide.create({
        data: {
          ...slideData,
          content: typeof slideData.content === "string" ? slideData.content : JSON.stringify(slideData.content)
        }
      });
      return {
        ...newSlide,
        createdAt: newSlide.createdAt?.toISOString(),
        updatedAt: newSlide.updatedAt?.toISOString()
      };
    } catch (error) {
      console.error("Error creating slide:", error);
      throw error;
    }
  });
  electron.ipcMain.handle("db:updateSlide", async (event, slide) => {
    try {
      const {
        createdAt,
        // Remove readonly field
        ...slideData
      } = slide;
      const updatedSlide = await db.slide.update({
        where: { id: slide.id },
        data: {
          ...slideData,
          content: typeof slide.content === "string" ? slide.content : JSON.stringify(slide.content),
          updatedAt: /* @__PURE__ */ new Date()
        }
      });
      return {
        ...updatedSlide,
        createdAt: updatedSlide.createdAt?.toISOString(),
        updatedAt: updatedSlide.updatedAt?.toISOString()
      };
    } catch (error) {
      console.error("Error updating slide:", error);
      throw error;
    }
  });
  electron.ipcMain.handle("db:deleteSlide", async (event, slideId) => {
    try {
      await db.slide.delete({
        where: { id: slideId }
      });
      return { success: true };
    } catch (error) {
      console.error("Error deleting slide:", error);
      throw error;
    }
  });
  electron.ipcMain.handle("db:reorderSlides", async (event, params) => {
    try {
      const { presentationId, slideOrders } = params;
      const updatePromises = slideOrders.map(
        ({ id, order }) => db.slide.update({
          where: { id },
          data: { order }
        })
      );
      await Promise.all(updatePromises);
      const updatedSlides = await db.slide.findMany({
        where: { presentationId },
        orderBy: { order: "asc" }
      });
      return updatedSlides.map((slide) => ({
        ...slide,
        createdAt: slide.createdAt?.toISOString(),
        updatedAt: slide.updatedAt?.toISOString()
      }));
    } catch (error) {
      console.error("Error reordering slides:", error);
      throw error;
    }
  });
  electron.ipcMain.handle("db:updatePresentationUsage", async (event, presentationId) => {
    try {
      const updatedPresentation = await db.presentation.update({
        where: { id: presentationId },
        data: {
          lastUsed: /* @__PURE__ */ new Date()
        },
        include: {
          slides: {
            orderBy: { order: "asc" }
          },
          template: true
        }
      });
      return {
        ...updatedPresentation,
        tags: updatedPresentation.tags ? JSON.parse(updatedPresentation.tags) : [],
        slides: updatedPresentation.slides.map((slide) => ({
          ...slide,
          createdAt: slide.createdAt?.toISOString(),
          updatedAt: slide.updatedAt?.toISOString()
        })),
        createdAt: updatedPresentation.createdAt?.toISOString(),
        updatedAt: updatedPresentation.updatedAt?.toISOString(),
        lastUsed: updatedPresentation.lastUsed?.toISOString(),
        totalSlides: updatedPresentation.slides.length
      };
    } catch (error) {
      console.error("Error updating presentation usage:", error);
      throw error;
    }
  });
  electron.ipcMain.handle("db:getRecentPresentations", async (event, { limit = 10 } = {}) => {
    try {
      const presentations = await db.presentation.findMany({
        where: {
          lastUsed: { not: null }
        },
        include: {
          slides: {
            orderBy: { order: "asc" }
          },
          template: true
        },
        orderBy: { lastUsed: "desc" },
        take: limit
      });
      return presentations.map((presentation) => ({
        ...presentation,
        tags: presentation.tags ? JSON.parse(presentation.tags) : [],
        slides: presentation.slides.map((slide) => ({
          ...slide,
          createdAt: slide.createdAt?.toISOString(),
          updatedAt: slide.updatedAt?.toISOString()
        })),
        createdAt: presentation.createdAt?.toISOString(),
        updatedAt: presentation.updatedAt?.toISOString(),
        lastUsed: presentation.lastUsed?.toISOString(),
        totalSlides: presentation.slides.length
      }));
    } catch (error) {
      console.error("Error getting recent presentations:", error);
      throw error;
    }
  });
  electron.ipcMain.handle("db:getTemplates", async () => {
    try {
      const templates = await db.template.findMany({
        orderBy: [
          { isDefault: "desc" },
          { name: "asc" }
        ]
      });
      return templates.map((template) => ({
        ...template,
        createdAt: template.createdAt?.toISOString(),
        updatedAt: template.updatedAt?.toISOString()
      }));
    } catch (error) {
      console.error("Error getting templates:", error);
      throw error;
    }
  });
  electron.ipcMain.handle("db:getBackgrounds", async () => {
    try {
      const backgrounds = await db.background.findMany({
        orderBy: [
          { isDefault: "desc" },
          { name: "asc" }
        ],
        include: {
          mediaItem: true
        }
      });
      return backgrounds.map((background) => ({
        ...background,
        createdAt: background.createdAt?.toISOString(),
        updatedAt: background.updatedAt?.toISOString()
      }));
    } catch (error) {
      console.error("Error getting backgrounds:", error);
      throw error;
    }
  });
  electron.ipcMain.handle("db:getPresentationCategories", async () => {
    try {
      const templates = await db.template.findMany({
        select: { category: true },
        where: { category: { not: null } },
        distinct: ["category"]
      });
      const categories = templates.map((t) => t.category).filter(Boolean);
      if (categories.length === 0) {
        return ["Sermon", "Teaching", "Worship", "Announcement"];
      }
      return categories;
    } catch (error) {
      console.error("Error getting presentation categories:", error);
      return ["Sermon", "Teaching", "Worship", "Announcement"];
    }
  });
  electron.ipcMain.handle("db:loadServices", async (event, limit = 20) => {
    try {
      const services = await db.service.findMany({
        include: {
          items: {
            orderBy: { order: "asc" }
          }
        },
        orderBy: { date: "desc" },
        take: limit
      });
      return services;
    } catch (error) {
      console.error("Error loading services:", error);
      throw error;
    }
  });
  electron.ipcMain.handle("db:getSetting", async (event, key) => {
    try {
      const setting = await db.setting.findUnique({
        where: { key }
      });
      return setting?.value || null;
    } catch (error) {
      console.error("Error getting setting:", error);
      throw error;
    }
  });
  electron.ipcMain.handle(
    "db:setSetting",
    async (event, {
      key,
      value,
      type = "string",
      category
    }) => {
      try {
        const setting = await db.setting.upsert({
          where: { key },
          update: { value, type, category },
          create: { key, value, type, category }
        });
        return setting;
      } catch (error) {
        console.error("Error setting setting:", error);
        throw error;
      }
    }
  );
}
class DisplayManager {
  // Cache native display info
  constructor() {
    this.displays = [];
    this.primaryDisplay = null;
    this.secondaryDisplay = null;
    this.changeListener = null;
    this.isInitialized = false;
    this.nativeDisplays = /* @__PURE__ */ new Map();
  }
  static getInstance() {
    if (!DisplayManager.instance) {
      DisplayManager.instance = new DisplayManager();
    }
    return DisplayManager.instance;
  }
  /**
   * Initialize the display manager after app is ready
   */
  initialize() {
    if (this.isInitialized) {
      return;
    }
    console.log("Initializing DisplayManager...");
    this.loadNativeDisplayInfo();
    this.refreshDisplays();
    this.setupEventListeners();
    this.isInitialized = true;
    console.log("DisplayManager initialized successfully");
  }
  /**
   * Load native display information using platform-specific methods
   */
  loadNativeDisplayInfo() {
    try {
      console.log("Loading native display information...");
      console.log("Platform detected:", os.platform());
      console.log("Process platform:", process.platform);
      const isWSL = this.isWSLEnvironment();
      console.log("WSL environment detected:", isWSL);
      if (os.platform() === "win32" || isWSL) {
        this.loadWindowsDisplayInfo();
      } else if (os.platform() === "darwin") {
        this.loadMacDisplayInfo();
      } else {
        this.loadLinuxDisplayInfo();
      }
      console.log(
        "Native display info loaded:",
        Array.from(this.nativeDisplays.entries())
      );
    } catch (error) {
      console.warn("Failed to load native display info:", error);
    }
  }
  /**
   * Detect if running in WSL environment
   */
  isWSLEnvironment() {
    try {
      const fs2 = require("fs");
      if (fs2.existsSync("/proc/version")) {
        const version = fs2.readFileSync("/proc/version", "utf8");
        return version.toLowerCase().includes("microsoft") || version.toLowerCase().includes("wsl");
      }
      return !!(process.env.WSL_DISTRO_NAME || process.env.WSLENV || process.platform === "linux" && process.env.PATH?.includes("/mnt/c"));
    } catch (error) {
      return false;
    }
  }
  /**
   * Load Windows display information using WMI
   */
  loadWindowsDisplayInfo() {
    try {
      console.log("Attempting to get Windows display info via PowerShell...");
      const powershellCommand = `Get-WmiObject -Class Win32_DesktopMonitor | Select-Object Name, MonitorManufacturer, MonitorType | ConvertTo-Json`;
      let command = "";
      if (this.isWSLEnvironment()) {
        command = `powershell.exe -Command "${powershellCommand}"`;
      } else {
        command = `powershell -Command "${powershellCommand}"`;
      }
      console.log("Executing command:", command);
      const result = child_process.execSync(command, {
        encoding: "utf8",
        timeout: 15e3
      });
      console.log("PowerShell result:", result);
      if (result.trim()) {
        const monitors = JSON.parse(result);
        const monitorArray = Array.isArray(monitors) ? monitors : [monitors];
        monitorArray.forEach((monitor, index) => {
          console.log(`Processing monitor ${index}:`, monitor);
          if (monitor) {
            const key = `monitor_${index}`;
            this.nativeDisplays.set(key, {
              manufacturer: monitor.MonitorManufacturer || "Unknown",
              model: monitor.MonitorType || monitor.Name || "Unknown",
              name: monitor.Name || `Monitor ${index + 1}`
            });
          }
        });
      }
      this.loadWindowsPnPDevices();
    } catch (error) {
      console.warn("Failed to get Windows display info via PowerShell:", error);
      this.loadWindowsDisplayInfoFallback();
    }
  }
  /**
   * Get PnP device information for displays
   */
  loadWindowsPnPDevices() {
    try {
      console.log("Getting PnP device information...");
      const pnpCommand = `Get-PnpDevice -Class Monitor | Select-Object FriendlyName, Manufacturer, Status | ConvertTo-Json`;
      let command = "";
      if (this.isWSLEnvironment()) {
        command = `powershell.exe -Command "${pnpCommand}"`;
      } else {
        command = `powershell -Command "${pnpCommand}"`;
      }
      const result = child_process.execSync(command, {
        encoding: "utf8",
        timeout: 1e4
      });
      console.log("PnP result:", result);
      if (result.trim()) {
        const devices = JSON.parse(result);
        const deviceArray = Array.isArray(devices) ? devices : [devices];
        deviceArray.forEach((device, index) => {
          if (device && device.Status === "OK") {
            const key = `pnp_monitor_${index}`;
            this.nativeDisplays.set(key, {
              manufacturer: device.Manufacturer || "Unknown",
              model: device.FriendlyName || "Unknown",
              name: device.FriendlyName
            });
          }
        });
      }
    } catch (error) {
      console.warn("Failed to get PnP device info:", error);
    }
  }
  /**
   * Fallback Windows display detection using WMIC
   */
  loadWindowsDisplayInfoFallback() {
    try {
      console.log("Attempting WMIC fallback...");
      let command = "";
      if (this.isWSLEnvironment()) {
        command = "wmic.exe desktopmonitor get name,monitormanufacturer,monitortype /format:csv";
      } else {
        command = "wmic desktopmonitor get name,monitormanufacturer,monitortype /format:csv";
      }
      const wmicResult = child_process.execSync(command, {
        encoding: "utf8",
        timeout: 5e3
      });
      console.log("WMIC result:", wmicResult);
      const lines = wmicResult.split("\n").filter((line) => line.trim() && !line.startsWith("Node"));
      lines.forEach((line, index) => {
        const parts = line.split(",").map((p) => p.trim());
        if (parts.length >= 3) {
          const key = `wmic_monitor_${index}`;
          this.nativeDisplays.set(key, {
            manufacturer: parts[1] || "Unknown",
            model: parts[2] || parts[3] || "Unknown",
            name: parts[3] || `Monitor ${index + 1}`
          });
        }
      });
    } catch (error) {
      console.warn("WMIC fallback also failed:", error);
    }
  }
  /**
   * Load macOS display information
   */
  loadMacDisplayInfo() {
    try {
      const result = child_process.execSync("system_profiler SPDisplaysDataType -json", {
        encoding: "utf8",
        timeout: 1e4
      });
      const data = JSON.parse(result);
      const displays = data.SPDisplaysDataType || [];
      displays.forEach((display, index) => {
        const key = `mac_display_${index}`;
        this.nativeDisplays.set(key, {
          manufacturer: display._name?.split(" ")[0] || "Unknown",
          model: display._name || "Unknown",
          name: display._name,
          deviceString: display.spdisplays_display_vendor || display.spdisplays_vendor
        });
      });
    } catch (error) {
      console.warn("Failed to get macOS display info:", error);
    }
  }
  /**
   * Load Linux display information
   */
  loadLinuxDisplayInfo() {
    try {
      const xrandrResult = child_process.execSync("xrandr --verbose", {
        encoding: "utf8",
        timeout: 5e3
      });
      const lines = xrandrResult.split("\n");
      let currentDisplay = {};
      let displayIndex = 0;
      lines.forEach((line) => {
        if (line.match(/^\w+.*connected/)) {
          if (currentDisplay.name) {
            const key = `linux_display_${displayIndex++}`;
            this.nativeDisplays.set(key, currentDisplay);
          }
          currentDisplay = { name: line.split(" ")[0] };
        } else if (line.includes("Brightness:")) {
          currentDisplay.brightness = line.split(":")[1].trim();
        } else if (line.includes("EDID:")) {
        }
      });
      if (currentDisplay.name) {
        const key = `linux_display_${displayIndex}`;
        this.nativeDisplays.set(key, currentDisplay);
      }
    } catch (error) {
      console.warn("Failed to get Linux display info via xrandr:", error);
      try {
        const lsResult = child_process.execSync(
          "ls /sys/class/drm/card*/edid 2>/dev/null || true",
          {
            encoding: "utf8",
            timeout: 3e3
          }
        );
        console.log("Available EDID files:", lsResult);
      } catch (err) {
        console.warn("No EDID files found");
      }
    }
  }
  /**
   * Match native display info with Electron display
   */
  matchNativeDisplay(electronDisplay, index) {
    `${electronDisplay.bounds.width}x${electronDisplay.bounds.height}`;
    const byIndex = this.nativeDisplays.get(`pnp_monitor_${index}`) || // PnP devices (most reliable)
    this.nativeDisplays.get(`monitor_${index}`) || // WMI Win32_DesktopMonitor
    this.nativeDisplays.get(`mac_display_${index}`) || this.nativeDisplays.get(`linux_display_${index}`) || this.nativeDisplays.get(`wmic_monitor_${index}`);
    if (byIndex && byIndex.manufacturer !== "Unknown") {
      console.log(
        `Matched display ${electronDisplay.id} (index ${index}) with native info:`,
        byIndex
      );
      return byIndex;
    }
    const nativeDisplaysArray = Array.from(this.nativeDisplays.values());
    if (nativeDisplaysArray.length > 0 && index < nativeDisplaysArray.length) {
      const validDisplays = nativeDisplaysArray.filter(
        (d) => d.manufacturer && d.manufacturer !== "Unknown"
      );
      if (validDisplays.length > index) {
        console.log(
          `Matched display ${electronDisplay.id} with valid native info at index ${index}:`,
          validDisplays[index]
        );
        return validDisplays[index];
      }
      console.log(
        `Fallback match for display ${electronDisplay.id} at index ${index}:`,
        nativeDisplaysArray[index]
      );
      return nativeDisplaysArray[index];
    }
    console.log(
      `No native display info found for display ${electronDisplay.id} (index ${index})`
    );
    return null;
  }
  /**
   * Get all available displays
   */
  getDisplays() {
    this.refreshDisplays();
    return [...this.displays];
  }
  /**
   * Get the primary display
   */
  getPrimaryDisplay() {
    this.refreshDisplays();
    return this.primaryDisplay;
  }
  /**
   * Get the secondary display (first non-primary display found)
   */
  getSecondaryDisplay() {
    this.refreshDisplays();
    return this.secondaryDisplay;
  }
  /**
   * Get display by ID
   */
  getDisplayById(id) {
    return this.displays.find((display) => display.id === id) || null;
  }
  /**
   * Check if multiple displays are available
   */
  hasMultipleDisplays() {
    return this.displays.length > 1;
  }
  /**
   * Get display count
   */
  getDisplayCount() {
    return this.displays.length;
  }
  /**
   * Capture screenshot of a specific display
   */
  async captureDisplay(displayId) {
    try {
      const sources = await electron.desktopCapturer.getSources({
        types: ["screen"],
        thumbnailSize: { width: 320, height: 180 }
      });
      const display = this.getDisplayById(displayId);
      if (!display) {
        throw new Error(`Display ${displayId} not found`);
      }
      const source = sources.find((source2) => source2.display_id === displayId.toString()) || sources[0];
      if (source && source.thumbnail) {
        return source.thumbnail.toDataURL();
      }
      return null;
    } catch (error) {
      console.error("Failed to capture display:", error);
      return null;
    }
  }
  /**
   * Set up event listeners for display changes
   */
  setupEventListeners() {
    if (!this.isInitialized) {
      console.warn(
        "DisplayManager not initialized, skipping event listeners setup"
      );
      return;
    }
    electron.screen.on("display-added", () => {
      console.log("Display added");
      this.refreshDisplays();
      this.notifyDisplayChange();
    });
    electron.screen.on("display-removed", () => {
      console.log("Display removed");
      this.refreshDisplays();
      this.notifyDisplayChange();
    });
    electron.screen.on("display-metrics-changed", () => {
      console.log("Display metrics changed");
      this.refreshDisplays();
      this.notifyDisplayChange();
    });
  }
  /**
   * Extract manufacturer and model from display label with native info enhancement
   */
  parseDisplayInfo(label, nativeInfo) {
    if (nativeInfo?.manufacturer && nativeInfo?.manufacturer !== "Unknown") {
      const manufacturer = nativeInfo.manufacturer;
      const model = nativeInfo.model && nativeInfo.model !== "Unknown" ? nativeInfo.model : nativeInfo.name || "";
      if (model) {
        return {
          manufacturer,
          model,
          friendlyName: `${manufacturer} ${model}`.trim()
        };
      } else {
        return {
          manufacturer,
          friendlyName: `${manufacturer} Monitor`
        };
      }
    }
    const patterns = [
      // "Samsung S24E650" or "Samsung 24E650"
      /^(Samsung|LG|Dell|HP|Acer|ASUS|AOC|BenQ|ViewSonic|Philips|Sony|Lenovo|MSI)\s*(.+)$/i,
      // "SAMSUNG S24E650"
      /^([A-Z]+)\s+(.+)$/,
      // Generic patterns
      /^(.+?)\s+(\d+[\w\d]*.*?)$/
    ];
    for (const pattern of patterns) {
      const match = label.match(pattern);
      if (match) {
        const [, manufacturer, model] = match;
        return {
          manufacturer: manufacturer.trim(),
          model: model.trim(),
          friendlyName: `${manufacturer.trim()} ${model.trim()}`
        };
      }
    }
    if (label.toLowerCase().includes("display")) {
      const displayNumber = label.match(/\d+/)?.[0];
      return {
        friendlyName: displayNumber ? `Monitor ${displayNumber}` : "External Monitor"
      };
    }
    return { friendlyName: label || "Unknown Display" };
  }
  /**
   * Generate a friendly display name with position info
   */
  generateDisplayName(display, index) {
    const { manufacturer, model, friendlyName } = this.parseDisplayInfo(
      display.label,
      display.nativeInfo
    );
    if (manufacturer && model) {
      return display.isPrimary ? `${friendlyName} (Primary)` : `${friendlyName} (Secondary)`;
    }
    const resolution = `${display.bounds.width}×${display.bounds.height}`;
    const position = display.isPrimary ? "Primary" : "Secondary";
    if (display.nativeInfo?.manufacturer && display.nativeInfo.manufacturer !== "Unknown") {
      const manufacturerName = display.nativeInfo.manufacturer;
      return `${manufacturerName} ${position} Monitor (${resolution})`;
    }
    if (display.bounds.width >= 2560) {
      return `${position} Monitor (4K ${resolution})`;
    } else if (display.bounds.width >= 1920) {
      return `${position} Monitor (Full HD ${resolution})`;
    } else {
      return `${position} Monitor (${resolution})`;
    }
  }
  /**
   * Refresh the displays list
   */
  refreshDisplays() {
    if (!this.isInitialized) {
      console.warn("DisplayManager not initialized, cannot refresh displays");
      return;
    }
    try {
      const electronDisplays = electron.screen.getAllDisplays();
      const primaryElectronDisplay = electron.screen.getPrimaryDisplay();
      this.displays = electronDisplays.map((display, index) => {
        const nativeInfo = this.matchNativeDisplay(display, index);
        const displayInfo = this.convertElectronDisplay(display, nativeInfo);
        displayInfo.friendlyName = this.generateDisplayName(displayInfo, index);
        return displayInfo;
      });
      const primaryNativeInfo = this.matchNativeDisplay(
        primaryElectronDisplay,
        0
      );
      this.primaryDisplay = this.convertElectronDisplay(
        primaryElectronDisplay,
        primaryNativeInfo
      );
      if (this.primaryDisplay) {
        this.primaryDisplay.friendlyName = this.generateDisplayName(
          this.primaryDisplay,
          0
        );
      }
      this.secondaryDisplay = this.displays.find((display) => !display.isPrimary) || null;
      console.log(
        `Found ${this.displays.length} display(s):`,
        this.displays.map((d) => ({
          id: d.id,
          label: d.label,
          friendlyName: d.friendlyName,
          manufacturer: d.manufacturer,
          model: d.model,
          bounds: d.bounds,
          isPrimary: d.isPrimary,
          nativeInfo: d.nativeInfo
        }))
      );
    } catch (error) {
      console.error("Error refreshing displays:", error);
      this.displays = [];
      this.primaryDisplay = null;
      this.secondaryDisplay = null;
    }
  }
  /**
   * Convert Electron Display to DisplayInfo with native info integration
   */
  convertElectronDisplay(display, nativeInfo) {
    const { manufacturer, model, friendlyName } = this.parseDisplayInfo(
      display.label,
      nativeInfo || void 0
    );
    return {
      id: display.id,
      label: display.label || `Display ${display.id}`,
      manufacturer: manufacturer || nativeInfo?.manufacturer,
      model: model || nativeInfo?.model,
      friendlyName,
      bounds: {
        x: display.bounds.x,
        y: display.bounds.y,
        width: display.bounds.width,
        height: display.bounds.height
      },
      workArea: {
        x: display.workArea.x,
        y: display.workArea.y,
        width: display.workArea.width,
        height: display.workArea.height
      },
      scaleFactor: display.scaleFactor,
      rotation: display.rotation,
      touchSupport: display.touchSupport,
      isPrimary: display.id === electron.screen.getPrimaryDisplay().id,
      colorSpace: display.colorSpace,
      colorDepth: display.colorDepth,
      accelerometerSupport: display.accelerometerSupport,
      nativeInfo: nativeInfo || void 0
      // Include native info for debugging
    };
  }
  /**
   * Set change listener callback
   */
  setChangeListener(callback) {
    this.changeListener = callback;
  }
  /**
   * Remove change listener
   */
  removeChangeListener() {
    this.changeListener = null;
  }
  /**
   * Notify about display changes
   */
  notifyDisplayChange() {
    if (this.changeListener) {
      this.changeListener();
    }
  }
  /**
   * Get display configuration for debugging
   */
  getDisplayConfiguration() {
    return {
      displayCount: this.displays.length,
      hasMultipleDisplays: this.hasMultipleDisplays(),
      primaryDisplay: this.primaryDisplay,
      secondaryDisplay: this.secondaryDisplay,
      allDisplays: this.displays,
      isInitialized: this.isInitialized
    };
  }
}
const displayManager = DisplayManager.getInstance();
class LiveDisplayWindow {
  constructor() {
    this.liveWindow = null;
    this.currentDisplayId = null;
    this.isInitialized = false;
  }
  static getInstance() {
    if (!LiveDisplayWindow.instance) {
      LiveDisplayWindow.instance = new LiveDisplayWindow();
    }
    return LiveDisplayWindow.instance;
  }
  /**
   * Initialize the live display window manager
   */
  initialize() {
    if (this.isInitialized) {
      return;
    }
    console.log("Initializing LiveDisplayWindow manager...");
    this.isInitialized = true;
    console.log("LiveDisplayWindow manager initialized successfully");
  }
  /**
   * Create live window on specified display
   */
  async createLiveWindow(config) {
    try {
      if (this.liveWindow && !this.liveWindow.isDestroyed()) {
        this.liveWindow.close();
      }
      const display = displayManager.getDisplayById(config.displayId);
      if (!display) {
        throw new Error(`Display with ID ${config.displayId} not found`);
      }
      console.log(
        `Creating live window on display ${config.displayId}: ${display.friendlyName || display.label}`
      );
      console.log("Display bounds:", display.bounds);
      const electronDisplays = electron.screen.getAllDisplays();
      const electronDisplay = electronDisplays.find(
        (d) => d.id === config.displayId
      );
      if (!electronDisplay) {
        throw new Error(
          `Electron display with ID ${config.displayId} not found`
        );
      }
      console.log("Electron display bounds:", electronDisplay.bounds);
      const windowConfig = {
        x: electronDisplay.bounds.x,
        y: electronDisplay.bounds.y,
        width: electronDisplay.bounds.width,
        height: electronDisplay.bounds.height,
        fullscreen: config.fullscreen ?? true,
        frame: config.frame ?? false,
        alwaysOnTop: config.alwaysOnTop ?? true,
        show: false,
        // Don't show immediately
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          webSecurity: false,
          preload: require("path").join(__dirname, "preload.js")
        },
        // Additional configuration for better positioning
        skipTaskbar: true,
        minimizable: false,
        maximizable: false,
        resizable: false
      };
      console.log("Creating BrowserWindow with config:", windowConfig);
      this.liveWindow = new electron.BrowserWindow(windowConfig);
      this.liveWindow.setBounds({
        x: electronDisplay.bounds.x,
        y: electronDisplay.bounds.y,
        width: electronDisplay.bounds.width,
        height: electronDisplay.bounds.height
      });
      if (config.fullscreen ?? true) {
        this.liveWindow.setFullScreen(true);
      }
      if ("http://localhost:5174") {
        await this.liveWindow.loadURL(
          `${"http://localhost:5174"}?mode=live-display`
        );
      }
      if ("http://localhost:5174") {
        this.liveWindow.webContents.openDevTools();
      }
      this.setupWindowEvents();
      this.currentDisplayId = config.displayId;
      console.log("Live window created successfully");
      console.log("Window bounds after creation:", this.liveWindow.getBounds());
      return true;
    } catch (error) {
      console.error("Failed to create live window:", error);
      return false;
    }
  }
  /**
   * Show the live window
   */
  showLiveWindow() {
    if (this.liveWindow && !this.liveWindow.isDestroyed()) {
      if (this.currentDisplayId) {
        const electronDisplays = electron.screen.getAllDisplays();
        const targetDisplay = electronDisplays.find(
          (d) => d.id === this.currentDisplayId
        );
        if (targetDisplay) {
          this.liveWindow.setBounds({
            x: targetDisplay.bounds.x,
            y: targetDisplay.bounds.y,
            width: targetDisplay.bounds.width,
            height: targetDisplay.bounds.height
          });
        }
      }
      this.liveWindow.show();
      this.liveWindow.focus();
      console.log("Live window shown on display:", this.currentDisplayId);
    }
  }
  /**
   * Hide the live window
   */
  hideLiveWindow() {
    if (this.liveWindow && !this.liveWindow.isDestroyed()) {
      this.liveWindow.hide();
      console.log("Live window hidden");
    }
  }
  /**
   * Close the live window
   */
  closeLiveWindow() {
    if (this.liveWindow && !this.liveWindow.isDestroyed()) {
      this.liveWindow.close();
      this.liveWindow = null;
      this.currentDisplayId = null;
      console.log("Live window closed");
    }
  }
  /**
   * Check if live window exists and is visible
   */
  isLiveWindowActive() {
    return !!(this.liveWindow && !this.liveWindow.isDestroyed() && this.liveWindow.isVisible());
  }
  /**
   * Get current live window
   */
  getLiveWindow() {
    return this.liveWindow && !this.liveWindow.isDestroyed() ? this.liveWindow : null;
  }
  /**
   * Get current display ID
   */
  getCurrentDisplayId() {
    return this.currentDisplayId;
  }
  /**
   * Move live window to different display
   */
  async moveToDisplay(displayId) {
    if (!this.liveWindow || this.liveWindow.isDestroyed()) {
      return this.createLiveWindow({ displayId });
    }
    const electronDisplays = electron.screen.getAllDisplays();
    const targetDisplay = electronDisplays.find((d) => d.id === displayId);
    if (!targetDisplay) {
      console.error(`Display with ID ${displayId} not found`);
      return false;
    }
    try {
      console.log(
        `Moving live window to display ${displayId}:`,
        targetDisplay.bounds
      );
      if (this.liveWindow.isFullScreen()) {
        this.liveWindow.setFullScreen(false);
      }
      this.liveWindow.setBounds({
        x: targetDisplay.bounds.x,
        y: targetDisplay.bounds.y,
        width: targetDisplay.bounds.width,
        height: targetDisplay.bounds.height
      });
      this.liveWindow.setFullScreen(true);
      this.currentDisplayId = displayId;
      console.log(`Live window moved to display ${displayId}`);
      return true;
    } catch (error) {
      console.error("Failed to move live window:", error);
      return false;
    }
  }
  /**
   * Send content to live window
   */
  sendContentToLive(content) {
    if (this.liveWindow && !this.liveWindow.isDestroyed()) {
      this.liveWindow.webContents.send("live-content-update", content);
    } else {
      console.warn("No active live window to send content to");
    }
  }
  /**
   * Clear content from live window
   */
  clearLiveContent() {
    if (this.liveWindow && !this.liveWindow.isDestroyed()) {
      this.liveWindow.webContents.send("live-content-clear");
      console.log("Live content cleared");
    }
  }
  /**
   * Show black screen
   */
  showBlackScreen() {
    if (this.liveWindow && !this.liveWindow.isDestroyed()) {
      this.liveWindow.webContents.send("live-show-black");
      console.log("Black screen displayed");
    }
  }
  /**
   * Show logo screen
   */
  showLogoScreen() {
    if (this.liveWindow && !this.liveWindow.isDestroyed()) {
      this.liveWindow.webContents.send("live-show-logo");
      console.log("Logo screen displayed");
    }
  }
  /**
   * Set up window event handlers
   */
  setupWindowEvents() {
    if (!this.liveWindow) return;
    this.liveWindow.on("closed", () => {
      console.log("Live window was closed");
      this.liveWindow = null;
      this.currentDisplayId = null;
    });
    this.liveWindow.on("ready-to-show", () => {
      console.log("Live window ready to show");
      if (this.currentDisplayId) {
        const electronDisplays = electron.screen.getAllDisplays();
        const targetDisplay = electronDisplays.find(
          (d) => d.id === this.currentDisplayId
        );
        if (targetDisplay && this.liveWindow) {
          this.liveWindow.setBounds({
            x: targetDisplay.bounds.x,
            y: targetDisplay.bounds.y,
            width: targetDisplay.bounds.width,
            height: targetDisplay.bounds.height
          });
        }
      }
    });
    this.liveWindow.on("focus", () => {
      console.log("Live window focused");
    });
    this.liveWindow.on("blur", () => {
      console.log("Live window lost focus");
    });
    electron.screen.on("display-removed", () => {
      if (this.currentDisplayId) {
        const electronDisplays = electron.screen.getAllDisplays();
        const stillExists = electronDisplays.find(
          (d) => d.id === this.currentDisplayId
        );
        if (!stillExists) {
          console.warn("Current display was removed, closing live window");
          this.closeLiveWindow();
        }
      }
    });
  }
  /**
   * Get live window status
   */
  getStatus() {
    return {
      hasWindow: !!this.liveWindow && !this.liveWindow.isDestroyed(),
      isVisible: this.liveWindow && !this.liveWindow.isDestroyed() ? this.liveWindow.isVisible() : false,
      currentDisplayId: this.currentDisplayId,
      bounds: this.liveWindow && !this.liveWindow.isDestroyed() ? this.liveWindow.getBounds() : null,
      isInitialized: this.isInitialized,
      isFullscreen: this.liveWindow && !this.liveWindow.isDestroyed() ? this.liveWindow.isFullScreen() : false
    };
  }
}
const liveDisplayWindow = LiveDisplayWindow.getInstance();
let displaySettings = {
  selectedLiveDisplayId: null,
  isLiveDisplayActive: false,
  liveDisplayFullscreen: true,
  liveDisplayAlwaysOnTop: true,
  testMode: false,
  savedTheme: null
};
function initializeDisplayMain() {
  console.log("Initializing display IPC handlers...");
  displayManager.initialize();
  liveDisplayWindow.initialize();
  electron.ipcMain.handle("display:getDisplays", async () => {
    try {
      console.log("IPC: Getting displays...");
      const displays = displayManager.getDisplays();
      const primaryDisplay = displayManager.getPrimaryDisplay();
      const secondaryDisplay = displayManager.getSecondaryDisplay();
      console.log("IPC: Returning display data:", {
        displays: displays.length,
        primaryDisplay: primaryDisplay?.id,
        secondaryDisplay: secondaryDisplay?.id
      });
      return {
        displays,
        primaryDisplay,
        secondaryDisplay
      };
    } catch (error) {
      console.error("Error getting displays:", error);
      throw error;
    }
  });
  electron.ipcMain.handle("display:captureDisplay", async (event, displayId) => {
    try {
      console.log("IPC: Capturing display:", displayId);
      const displays = electron.screen.getAllDisplays();
      const targetDisplay = displays.find((d) => d.id === displayId);
      if (!targetDisplay) {
        throw new Error(`Display with ID ${displayId} not found`);
      }
      console.log("Target display bounds:", targetDisplay.bounds);
      const sources = await electron.desktopCapturer.getSources({
        types: ["screen"],
        thumbnailSize: {
          width: Math.floor(targetDisplay.bounds.width / 4),
          height: Math.floor(targetDisplay.bounds.height / 4)
        }
      });
      console.log(
        "Available sources:",
        sources.map((s) => ({
          id: s.id,
          name: s.name,
          display_id: s.display_id
        }))
      );
      let source = null;
      source = sources.find((s) => s.display_id === displayId.toString());
      if (source) {
        console.log("Found source by display_id string match:", source.id);
      }
      if (!source) {
        source = sources.find((s) => parseInt(s.display_id) === displayId);
        if (source) {
          console.log("Found source by display_id number match:", source.id);
        }
      }
      if (!source && sources.length > 1) {
        const primaryDisplay = electron.screen.getPrimaryDisplay();
        if (displayId !== primaryDisplay.id) {
          source = sources[1] || sources[0];
          console.log(
            "Using secondary source for non-primary display:",
            source?.id
          );
        } else {
          source = sources[0];
          console.log("Using primary source for primary display:", source?.id);
        }
      }
      if (!source && sources.length > 0) {
        source = sources[0];
        console.warn(
          `No specific match for display ${displayId}, using first source:`,
          source.id
        );
      }
      if (!source || !source.thumbnail) {
        throw new Error("Failed to capture display - no valid source found");
      }
      const screenshot = source.thumbnail.toDataURL();
      console.log(
        `IPC: Display ${displayId} captured successfully using source:`,
        source.id
      );
      return screenshot;
    } catch (error) {
      console.error("Error capturing display:", error);
      throw error;
    }
  });
  electron.ipcMain.handle("display:testDisplay", async (event, displayId) => {
    try {
      console.log("IPC: Testing display:", displayId);
      const displays = electron.screen.getAllDisplays();
      const targetDisplay = displays.find((d) => d.id === displayId);
      if (!targetDisplay) {
        throw new Error(`Display with ID ${displayId} not found`);
      }
      const testWindow = new electron.BrowserWindow({
        x: targetDisplay.bounds.x,
        y: targetDisplay.bounds.y,
        width: targetDisplay.bounds.width,
        height: targetDisplay.bounds.height,
        fullscreen: true,
        frame: false,
        alwaysOnTop: true,
        backgroundColor: "#FF0000",
        show: false,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true
        }
      });
      const testHTML = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body {
                margin: 0;
                padding: 0;
                background: linear-gradient(45deg, #FF0000, #00FF00, #0000FF, #FFFF00);
                background-size: 400% 400%;
                animation: gradientShift 3s ease infinite;
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: Arial, sans-serif;
                color: white;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
              }
              @keyframes gradientShift {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
              }
              .test-content {
                text-align: center;
                font-size: 4rem;
                font-weight: bold;
              }
              .display-info {
                font-size: 2rem;
                margin-top: 2rem;
              }
            </style>
          </head>
          <body>
            <div class="test-content">
              <div>Display Test</div>
              <div class="display-info">Display ID: ${displayId}</div>
              <div class="display-info">${targetDisplay.bounds.width} × ${targetDisplay.bounds.height}</div>
            </div>
          </body>
        </html>
      `;
      await testWindow.loadURL(
        `data:text/html;charset=utf-8,${encodeURIComponent(testHTML)}`
      );
      testWindow.show();
      setTimeout(() => {
        if (!testWindow.isDestroyed()) {
          testWindow.close();
        }
      }, 3e3);
      console.log("IPC: Display test completed");
      return { success: true, message: "Test pattern shown for 3 seconds" };
    } catch (error) {
      console.error("Error testing display:", error);
      throw error;
    }
  });
  electron.ipcMain.handle("display:saveSettings", async (event, settings) => {
    try {
      console.log("IPC: Saving display settings:", settings);
      if (settings.selectedLiveDisplayId !== void 0) {
        displaySettings.selectedLiveDisplayId = settings.selectedLiveDisplayId;
      }
      console.log("IPC: Display settings saved successfully");
      return settings;
    } catch (error) {
      console.error("Error saving display settings:", error);
      throw error;
    }
  });
  electron.ipcMain.handle(
    "live-display:create",
    async (event, { displayId }) => {
      try {
        console.log("IPC: Creating live display on display:", displayId);
        let targetDisplayId = displayId;
        if (!targetDisplayId) {
          if (displaySettings.selectedLiveDisplayId) {
            targetDisplayId = displaySettings.selectedLiveDisplayId;
          } else {
            const secondaryDisplay = displayManager.getSecondaryDisplay();
            if (secondaryDisplay) {
              targetDisplayId = secondaryDisplay.id;
            } else {
              const primaryDisplay = displayManager.getPrimaryDisplay();
              if (primaryDisplay) {
                targetDisplayId = primaryDisplay.id;
              }
            }
          }
        }
        if (!targetDisplayId) {
          throw new Error("No suitable display found for live output");
        }
        const success = await liveDisplayWindow.createLiveWindow({
          displayId: targetDisplayId,
          fullscreen: displaySettings.liveDisplayFullscreen,
          alwaysOnTop: displaySettings.liveDisplayAlwaysOnTop,
          frame: false
        });
        if (success) {
          displaySettings.isLiveDisplayActive = true;
          displaySettings.selectedLiveDisplayId = targetDisplayId;
        }
        console.log("IPC: Live display creation result:", {
          success,
          displayId: targetDisplayId
        });
        return { success, displayId: targetDisplayId };
      } catch (error) {
        console.error("Error creating live display:", error);
        throw error;
      }
    }
  );
  electron.ipcMain.handle("live-display:show", async () => {
    try {
      console.log("IPC: Showing live display");
      liveDisplayWindow.showLiveWindow();
      return { success: true };
    } catch (error) {
      console.error("Error showing live display:", error);
      throw error;
    }
  });
  electron.ipcMain.handle("live-display:hide", async () => {
    try {
      console.log("IPC: Hiding live display");
      liveDisplayWindow.hideLiveWindow();
      return { success: true };
    } catch (error) {
      console.error("Error hiding live display:", error);
      throw error;
    }
  });
  electron.ipcMain.handle("live-display:close", async () => {
    try {
      console.log("IPC: Closing live display");
      liveDisplayWindow.closeLiveWindow();
      displaySettings.isLiveDisplayActive = false;
      return { success: true };
    } catch (error) {
      console.error("Error closing live display:", error);
      throw error;
    }
  });
  electron.ipcMain.handle("live-display:getStatus", async () => {
    try {
      const status = liveDisplayWindow.getStatus();
      console.log("IPC: Live display status:", status);
      return status;
    } catch (error) {
      console.error("Error getting live display status:", error);
      throw error;
    }
  });
  electron.ipcMain.handle("live-display:sendContent", async (event, content) => {
    try {
      liveDisplayWindow.sendContentToLive(content);
      return { success: true };
    } catch (error) {
      console.error("Error sending content to live display:", error);
      throw error;
    }
  });
  electron.ipcMain.handle("live-display:clearContent", async () => {
    try {
      console.log("IPC: Clearing live display content");
      liveDisplayWindow.clearLiveContent();
      return { success: true };
    } catch (error) {
      console.error("Error clearing live display content:", error);
      throw error;
    }
  });
  electron.ipcMain.handle("live-display:showBlack", async () => {
    try {
      console.log("IPC: Showing black screen");
      liveDisplayWindow.showBlackScreen();
      return { success: true };
    } catch (error) {
      console.error("Error showing black screen:", error);
      throw error;
    }
  });
  electron.ipcMain.handle("live-display:showLogo", async () => {
    try {
      console.log("IPC: Showing logo screen");
      liveDisplayWindow.showLogoScreen();
      return { success: true };
    } catch (error) {
      console.error("Error showing logo screen:", error);
      throw error;
    }
  });
  electron.ipcMain.handle("live-display:updateTheme", async (event, theme) => {
    try {
      console.log("IPC: Updating live display theme:", theme);
      const liveWindow = liveDisplayWindow.getLiveWindow();
      if (liveWindow && !liveWindow.isDestroyed()) {
        liveWindow.webContents.send("live-theme-update", theme);
      }
      return { success: true };
    } catch (error) {
      console.error("Error updating live display theme:", error);
      throw error;
    }
  });
  electron.ipcMain.handle("live-display:saveTheme", async (event, theme) => {
    try {
      console.log("IPC: Saving live display theme:", theme);
      displaySettings.savedTheme = theme;
      return { success: true };
    } catch (error) {
      console.error("Error saving live display theme:", error);
      throw error;
    }
  });
  electron.ipcMain.handle("live-display:getTheme", async () => {
    try {
      console.log("IPC: Getting saved live display theme");
      return displaySettings.savedTheme || null;
    } catch (error) {
      console.error("Error getting live display theme:", error);
      throw error;
    }
  });
  electron.ipcMain.handle("live-display:startPreview", async (event, theme) => {
    try {
      console.log("IPC: Starting live display preview with theme:", theme);
      const status = liveDisplayWindow.getStatus();
      if (!status.hasWindow) {
        let targetDisplayId = displaySettings.selectedLiveDisplayId;
        if (!targetDisplayId) {
          const secondaryDisplay = displayManager.getSecondaryDisplay();
          if (secondaryDisplay) {
            targetDisplayId = secondaryDisplay.id;
          } else {
            const primaryDisplay = displayManager.getPrimaryDisplay();
            if (primaryDisplay) {
              targetDisplayId = primaryDisplay.id;
            }
          }
        }
        if (targetDisplayId) {
          const created = await liveDisplayWindow.createLiveWindow({
            displayId: targetDisplayId,
            fullscreen: displaySettings.liveDisplayFullscreen,
            alwaysOnTop: displaySettings.liveDisplayAlwaysOnTop,
            frame: false
          });
          if (!created) {
            throw new Error("Failed to create live display for preview");
          }
        }
      }
      liveDisplayWindow.showLiveWindow();
      const previewContent = {
        type: "placeholder",
        title: "Theme Preview",
        content: {
          mainText: "Theme Preview Mode",
          subText: "Customizing live display appearance",
          timestamp: (/* @__PURE__ */ new Date()).toLocaleTimeString()
        }
      };
      liveDisplayWindow.sendContentToLive(previewContent);
      const liveWindow = liveDisplayWindow.getLiveWindow();
      if (liveWindow && !liveWindow.isDestroyed()) {
        liveWindow.webContents.send("live-theme-update", theme);
      }
      return { success: true };
    } catch (error) {
      console.error("Error starting live display preview:", error);
      throw error;
    }
  });
  electron.ipcMain.handle("live-display:endPreview", async () => {
    try {
      console.log("IPC: Ending live display preview");
      return { success: true };
    } catch (error) {
      console.error("Error ending live display preview:", error);
      throw error;
    }
  });
  console.log("Display IPC handlers initialized successfully");
}
function initializeWindowMain() {
  electron.ipcMain.handle("window:minimize", (event) => {
    const win = electron.BrowserWindow.fromWebContents(event.sender);
    if (win) {
      win.minimize();
    }
  });
  electron.ipcMain.handle("window:maximize", (event) => {
    const win = electron.BrowserWindow.fromWebContents(event.sender);
    if (win) {
      win.maximize();
    }
  });
  electron.ipcMain.handle("window:unmaximize", (event) => {
    const win = electron.BrowserWindow.fromWebContents(event.sender);
    if (win) {
      win.unmaximize();
    }
  });
  electron.ipcMain.handle("window:close", (event) => {
    const win = electron.BrowserWindow.fromWebContents(event.sender);
    if (win) {
      win.close();
    }
  });
  electron.ipcMain.handle("window:isMaximized", (event) => {
    const win = electron.BrowserWindow.fromWebContents(event.sender);
    return win ? win.isMaximized() : false;
  });
  electron.ipcMain.handle("window:isFullScreen", (event) => {
    const win = electron.BrowserWindow.fromWebContents(event.sender);
    return win ? win.isFullScreen() : false;
  });
  electron.ipcMain.handle("window:setFullScreen", (event, flag) => {
    const win = electron.BrowserWindow.fromWebContents(event.sender);
    if (win) {
      win.setFullScreen(flag);
      win.webContents.executeJavaScript(`
        document.body.style.margin = '0';
        document.body.style.padding = '0';
        document.documentElement.style.margin = '0';
        document.documentElement.style.padding = '0';
        
        // Force a repaint to fix any layout issues
        document.body.offsetHeight;
      `);
      return win.isFullScreen();
    }
    return false;
  });
  electron.ipcMain.handle("window:toggleFullScreen", (event) => {
    const win = electron.BrowserWindow.fromWebContents(event.sender);
    if (win) {
      const currentState = win.isFullScreen();
      win.setFullScreen(!currentState);
      win.webContents.executeJavaScript(`
        document.body.style.margin = '0';
        document.body.style.padding = '0';
        document.documentElement.style.margin = '0';
        document.documentElement.style.padding = '0';
        
        // Force a repaint
        document.body.offsetHeight;
      `);
      return win.isFullScreen();
    }
    return false;
  });
  electron.ipcMain.handle("window:isAlwaysOnTop", (event) => {
    const win = electron.BrowserWindow.fromWebContents(event.sender);
    return win ? win.isAlwaysOnTop() : false;
  });
  electron.ipcMain.handle("window:setAlwaysOnTop", (event, flag) => {
    const win = electron.BrowserWindow.fromWebContents(event.sender);
    if (win) {
      win.setAlwaysOnTop(flag);
      return win.isAlwaysOnTop();
    }
    return false;
  });
  electron.ipcMain.handle("window:on", (event, eventName, callback) => {
    const win = electron.BrowserWindow.fromWebContents(event.sender);
    if (win) {
      win.on(eventName, () => {
        event.sender.send(`window:${eventName}`);
      });
    }
  });
  electron.ipcMain.handle("window:removeListener", (event, eventName, callback) => {
    const win = electron.BrowserWindow.fromWebContents(event.sender);
    if (win) {
      win.removeAllListeners(eventName);
    }
  });
  electron.ipcMain.handle("window:getBounds", (event) => {
    const win = electron.BrowserWindow.fromWebContents(event.sender);
    return win ? win.getBounds() : null;
  });
  electron.ipcMain.handle("window:setBounds", (event, bounds) => {
    const win = electron.BrowserWindow.fromWebContents(event.sender);
    if (win) {
      win.setBounds(bounds);
      return win.getBounds();
    }
    return null;
  });
  electron.ipcMain.handle("window:toggleVisibility", (event) => {
    const win = electron.BrowserWindow.fromWebContents(event.sender);
    if (win) {
      if (win.isVisible()) {
        win.hide();
      } else {
        win.show();
        win.focus();
      }
      return win.isVisible();
    }
    return false;
  });
  electron.ipcMain.handle("window:center", (event) => {
    const win = electron.BrowserWindow.fromWebContents(event.sender);
    if (win) {
      win.center();
      return win.getBounds();
    }
    return null;
  });
  electron.ipcMain.handle("window:reset", (event) => {
    const win = electron.BrowserWindow.fromWebContents(event.sender);
    if (win) {
      win.setSize(1280, 720);
      win.center();
      win.setFullScreen(false);
      win.webContents.executeJavaScript(`
        document.body.style.margin = '0';
        document.body.style.padding = '0';
        document.documentElement.style.margin = '0';
        document.documentElement.style.padding = '0';
        document.body.offsetHeight;
      `);
      return win.getBounds();
    }
    return null;
  });
  console.log("Window control IPC handlers initialized");
}
if (started) {
  electron.app.quit();
}
const createWindow = () => {
  const mainWindow = new electron.BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 800,
    minHeight: 600,
    frame: true,
    // titleBarStyle: 'hidden',
    trafficLightPosition: { x: -100, y: -100 },
    // Hide macOS traffic lights
    transparent: false,
    hasShadow: true,
    roundedCorners: true,
    vibrancy: "window",
    // macOS only
    backgroundColor: "#ffffff",
    show: false,
    // Don't show until ready
    webPreferences: {
      preload: path$1.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true
    }
  });
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    mainWindow.webContents.executeJavaScript(`
      // Remove any default margins and padding
      document.documentElement.style.margin = '0';
      document.documentElement.style.padding = '0';
      document.documentElement.style.overflow = 'hidden';
      document.body.style.margin = '0';
      document.body.style.padding = '0';
      document.body.style.overflow = 'hidden';
      
      // Ensure the root element fills the entire window
      const root = document.getElementById('root');
      if (root) {
        root.style.margin = '0';
        root.style.padding = '0';
        root.style.width = '100vw';
        root.style.height = '100vh';
        root.style.overflow = 'hidden';
      }
      
      // Add rounded corners to the main application container
      const appWindow = document.querySelector('.app-window');
      if (appWindow) {
        appWindow.style.borderRadius = '8px';
        appWindow.style.overflow = 'hidden';
      }
    `).catch(console.error);
  });
  {
    mainWindow.loadURL("http://localhost:5174");
  }
};
electron.app.on("ready", async () => {
  try {
    await initializeDatabaseMain();
    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Failed to initialize database:", error);
  }
  try {
    initializeDisplayMain();
    console.log("Display management initialized successfully");
  } catch (error) {
    console.error("Failed to initialize display management:", error);
  }
  try {
    initializeWindowMain();
    console.log("Window controls initialized successfully");
  } catch (error) {
    console.error("Failed to initialize window controls:", error);
  }
  createWindow();
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
electron.app.on("activate", () => {
  if (electron.BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
