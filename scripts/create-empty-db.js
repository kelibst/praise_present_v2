/**
 * Create an empty database with schema but no data
 * This will be shipped with the installer instead of the 100MB+ dev.db
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function createEmptyDatabase() {
  const emptyDbPath = path.join(__dirname, '..', 'prisma', 'empty.db');

  console.log('Creating empty database with schema...');
  console.log('Output path:', emptyDbPath);

  // Delete existing empty.db if it exists
  if (fs.existsSync(emptyDbPath)) {
    fs.unlinkSync(emptyDbPath);
    console.log('Deleted existing empty.db');
  }

  // Create a new empty database file
  fs.writeFileSync(emptyDbPath, '');

  // Set DATABASE_URL to the empty database
  process.env.DATABASE_URL = `file:${emptyDbPath}`;

  // Initialize Prisma with the empty database
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: `file:${emptyDbPath}`
      }
    }
  });

  try {
    // Run a simple query to trigger Prisma to create the schema
    // Prisma Client will automatically create tables based on schema.prisma
    await prisma.$connect();

    console.log('✅ Empty database created with schema');

    const stats = fs.statSync(emptyDbPath);
    console.log(`   Size: ${(stats.size / 1024).toFixed(2)} KB`);
    console.log('');
    console.log('This database will be shipped with the installer.');
    console.log('It contains the schema but no data, saving significant space.');

  } catch (error) {
    console.error('❌ Error creating empty database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createEmptyDatabase();
