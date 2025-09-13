const path = require('path');

// Add the src directory to the module path so we can require TypeScript files
require('ts-node').register({
  project: path.join(__dirname, 'tsconfig.json')
});

async function testSQLiteImport() {
  try {
    console.log('🧪 Testing SQLite Bible import...\n');
    
    const { initializeDatabase } = require('../src/lib/database');
    const { sqliteBibleImporter } = require('../src/lib/sqlite-bible-importer');
    
    console.log('Initializing database...');
    initializeDatabase();
    
    console.log('Testing single version import (KJV)...');
    await sqliteBibleImporter.importSingleVersionFromSQLite('KJV');
    
    console.log('Getting import statistics...');
    const stats = await sqliteBibleImporter.getImportStats();
    console.log('Import statistics:');
    console.table(stats);
    
    console.log('Verifying KJV import...');
    const isValid = await sqliteBibleImporter.verifyImport('KJV');
    
    if (isValid) {
      console.log('✅ SQLite import test passed successfully!');
    } else {
      console.log('❌ SQLite import test failed validation!');
    }
    
  } catch (error) {
    console.error('❌ SQLite import test failed:', error);
    process.exit(1);
  }
}

testSQLiteImport(); 