const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function setupDatabaseSQLite() {
  console.log('🚀 Setting up PraisePresent database with SQLite import...\n');

  try {
    // Step 1: Install Prisma if not already installed
    console.log('📦 Installing Prisma dependencies...');
    try {
      execSync('npm install prisma @prisma/client sqlite3 --legacy-peer-deps', { stdio: 'inherit' });
      console.log('✅ Prisma dependencies installed\n');
    } catch (error) {
      console.log('⚠️  Prisma dependencies may already be installed\n');
    }

    // Step 2: Generate Prisma client
    console.log('🔧 Generating Prisma client...');
    try {
      execSync('npx prisma generate', { stdio: 'inherit' });
      console.log('✅ Prisma client generated\n');
    } catch (error) {
      console.error('❌ Failed to generate Prisma client:', error.message);
      return;
    }

    // Step 3: Create database and run migrations
    console.log('🗄️  Creating database and running migrations...');
    try {
      execSync('npx prisma db push', { stdio: 'inherit' });
      console.log('✅ Database created and migrations applied\n');
    } catch (error) {
      console.error('❌ Failed to create database:', error.message);
      return;
    }

    // Step 4: Seed the database with initial data using SQLite import
    console.log('🌱 Seeding database with initial data and SQLite Bible import...');
    try {
      const seedPath = path.join(__dirname, 'sqlite-seed.js');
      execSync(`node ${seedPath}`, { stdio: 'inherit' });
      console.log('✅ Database seeded successfully with SQLite import\n');
    } catch (error) {
      console.error('❌ Failed to seed database:', error.message);
      return;
    }

    console.log('🎉 SQLite database setup completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Run "npm start" to launch the application');
    console.log('2. All Bible translations have been imported automatically');
    console.log('3. Add songs and media content through the application\n');

    console.log('📊 Database Setup Summary:');
    console.log('- ✅ Basic data (translations, versions, books, settings)');
    console.log('- ✅ All available Bible translations imported from SQLite');
    console.log('- ✅ Scripture search topics created');
    console.log('- ✅ Default user account created\n');

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

// Run the setup if this script is executed directly
if (require.main === module) {
  setupDatabaseSQLite();
}

module.exports = { setupDatabaseSQLite }; 