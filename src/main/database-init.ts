import { app } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

export function getProductionDatabasePath(): string {
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

  console.log('[DB INIT] Environment check:');
  console.log('[DB INIT]   - NODE_ENV:', process.env.NODE_ENV);
  console.log('[DB INIT]   - app.isPackaged:', app.isPackaged);
  console.log('[DB INIT]   - isDev:', isDev);
  console.log('[DB INIT]   - process.resourcesPath:', process.resourcesPath);

  if (isDev) {
    const devPath = path.join(process.cwd(), 'prisma', 'dev.db');
    console.log('[DB INIT] Using dev database at:', devPath);
    return devPath;
  }

  // In production, use userData directory
  const dbPath = path.join(app.getPath('userData'), 'database.db');
  console.log('[DB INIT] Production database will be at:', dbPath);
  const dbDir = path.dirname(dbPath);

  // Ensure directory exists
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // Check if database needs initialization (doesn't exist or is empty/invalid)
  let needsInit = !fs.existsSync(dbPath);

  if (fs.existsSync(dbPath)) {
    const stats = fs.statSync(dbPath);
    if (stats.size === 0) {
      console.log('[DB INIT] Existing database is empty, will reinitialize');
      needsInit = true;
      fs.unlinkSync(dbPath);
    } else if (stats.size < 1000) {
      // Very small database file is likely corrupted or empty
      console.log('[DB INIT] Existing database is too small (likely corrupt), will reinitialize');
      needsInit = true;
      fs.unlinkSync(dbPath);
    }
  }

  // Copy initial database if it doesn't exist or needs reinitialization
  if (needsInit) {
    // Try to find the database in resources
    // extraResource in forge.config.ts puts files directly in the resources directory
    const possiblePaths = [
      path.join(process.resourcesPath, 'dev.db'), // CORRECT path for extraResource
      path.join(process.resourcesPath, 'prisma', 'dev.db'),
      path.join(process.resourcesPath, 'extraResources', 'prisma', 'dev.db'),
      path.join(process.resourcesPath, 'app', 'prisma', 'dev.db'),
      path.join(process.resourcesPath, 'app.asar.unpacked', 'prisma', 'dev.db'),
    ];

    let sourceDb: string | null = null;
    console.log('[DB INIT] Searching for source database in:');
    for (const p of possiblePaths) {
      console.log(`[DB INIT]   - Checking: ${p} - ${fs.existsSync(p) ? 'EXISTS' : 'NOT FOUND'}`);
      if (fs.existsSync(p)) {
        sourceDb = p;
        break;
      }
    }

    if (sourceDb) {
      const sourceStats = fs.statSync(sourceDb);
      console.log(`[DB INIT] Found source database: ${sourceDb} (${(sourceStats.size / 1024 / 1024).toFixed(2)} MB)`);
      console.log(`[DB INIT] Copying to: ${dbPath}`);
      try {
        fs.copyFileSync(sourceDb, dbPath);
        const destStats = fs.statSync(dbPath);
        console.log(`[DB INIT] Database copied successfully (${(destStats.size / 1024 / 1024).toFixed(2)} MB)`);
        if (destStats.size !== sourceStats.size) {
          console.error('[DB INIT] WARNING: Copied database size mismatch!');
          console.error(`[DB INIT]   Source: ${sourceStats.size} bytes`);
          console.error(`[DB INIT]   Dest:   ${destStats.size} bytes`);
        }
      } catch (error) {
        console.error('[DB INIT] Failed to copy database:', error);
        throw error;
      }
    } else {
      console.error('[DB INIT] No source database found in any of the expected locations');
      console.log('[DB INIT] Creating new empty database at:', dbPath);
      // Create an empty database file
      try {
        fs.writeFileSync(dbPath, '');
        console.log('[DB INIT] Empty database file created');
        console.log('[DB INIT] NOTE: You will need to run database migrations to create the schema');
      } catch (error) {
        console.error('[DB INIT] Failed to create database file:', error);
        throw error;
      }
    }
  } else {
    console.log(`[DB INIT] Database already exists at: ${dbPath}`);
  }

  return dbPath;
}

export function initializePrismaClient(): PrismaClient {
  if (prisma) {
    return prisma;
  }

  try {
    const dbPath = getProductionDatabasePath();
    console.log(`[DB INIT] Using database at: ${dbPath}`);

    // Check if database file exists
    if (fs.existsSync(dbPath)) {
      console.log('[DB INIT] Database file exists');
    } else {
      console.warn('[DB INIT] WARNING: Database file does not exist at:', dbPath);
    }

    // Set the DATABASE_URL environment variable for Prisma
    process.env.DATABASE_URL = `file:${dbPath}`;
    console.log('[DB INIT] DATABASE_URL set to:', process.env.DATABASE_URL);

    prisma = new PrismaClient({
      log: ['error', 'warn'],
      datasources: {
        db: {
          url: `file:${dbPath}`
        }
      }
    });

    console.log('[DB INIT] PrismaClient created successfully');
    return prisma;
  } catch (error) {
    console.error('[DB INIT] Failed to initialize Prisma client:', error);
    throw error;
  }
}

export function getMainDatabase(): PrismaClient {
  if (!prisma) {
    return initializePrismaClient();
  }
  return prisma;
}

export async function closeMainDatabase(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
  }
}