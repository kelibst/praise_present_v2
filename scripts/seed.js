const path = require('path');

// Add the src directory to the module path so we can require TypeScript files
require('ts-node').register({
  project: path.join(__dirname, 'tsconfig.json')
});

async function runSeed() {
  try {
    console.log('Loading database modules...');
    const { initializeDatabase, seedDatabase } = require('../src/lib/database');
    const { bibleImporter } = require('../src/lib/bible-importer');
    
    console.log('Initializing database...');
    initializeDatabase();
    
    console.log('Seeding basic data...');
    await seedDatabase();
    
    console.log('Creating basic topics...');
    await bibleImporter.createBasicTopics();
    
    console.log('Importing all Bible versions...');
    await bibleImporter.importAllVersions();
    
    console.log('✅ Database seeded successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

runSeed(); 