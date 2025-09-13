const path = require('path');

// Add the src directory to the module path so we can require TypeScript files
require('ts-node').register({
  project: path.join(__dirname, 'tsconfig.json')
});

async function runSQLiteSeed() {
  try {
    console.log('Loading database modules...');
    const { initializeDatabase, seedDatabase } = require('../src/lib/database');
    const { sqliteBibleImporter } = require('../src/lib/sqlite-bible-importer');
    
    console.log('Initializing database...');
    initializeDatabase();
    
    console.log('Seeding basic data...');
    await seedDatabase();
    
    console.log('Creating basic topics...');
    await sqliteBibleImporter.createBasicTopics();
    
    console.log('Importing all Bible versions from SQLite files...');
    await sqliteBibleImporter.importAllVersions();
    
    console.log('Getting import statistics...');
    const stats = await sqliteBibleImporter.getImportStats();
    console.log('Import completed with the following statistics:');
    console.table(stats);
    
    console.log('✅ SQLite database seeding completed successfully!');
  } catch (error) {
    console.error('❌ SQLite seeding failed:', error);
    process.exit(1);
  }
}

runSQLiteSeed(); 