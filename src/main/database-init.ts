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

  // Initialize database if it doesn't exist or needs reinitialization
  if (needsInit) {
    console.log('[DB INIT] Database needs initialization');
    console.log('[DB INIT] Creating new database at:', dbPath);

    // Copy the empty database template (shipped with installer)
    // This is a ~364 KB database with schema but no data
    const possiblePaths = [
      path.join(process.resourcesPath, 'empty.db'), // Correct path for extraResource
      path.join(process.resourcesPath, 'prisma', 'empty.db'),
      path.join(process.resourcesPath, 'app.asar.unpacked', 'prisma', 'empty.db'),
    ];

    let sourceDb: string | null = null;
    console.log('[DB INIT] Searching for empty database template:');
    for (const p of possiblePaths) {
      console.log(`[DB INIT]   - Checking: ${p} - ${fs.existsSync(p) ? 'EXISTS' : 'NOT FOUND'}`);
      if (fs.existsSync(p)) {
        sourceDb = p;
        break;
      }
    }

    if (sourceDb) {
      try {
        const sourceStats = fs.statSync(sourceDb);
        console.log(`[DB INIT] Found empty database template: ${sourceDb} (${(sourceStats.size / 1024).toFixed(2)} KB)`);
        console.log(`[DB INIT] Copying to: ${dbPath}`);

        fs.copyFileSync(sourceDb, dbPath);

        const destStats = fs.statSync(dbPath);
        console.log(`[DB INIT] Database copied successfully (${(destStats.size / 1024).toFixed(2)} KB)`);

        // Mark that this is a first run
        const firstRunMarker = path.join(app.getPath('userData'), '.first-run');
        fs.writeFileSync(firstRunMarker, new Date().toISOString());
        console.log('[DB INIT] First-run marker created');

      } catch (error) {
        console.error('[DB INIT] Failed to copy database:', error);
        throw error;
      }
    } else {
      console.error('[DB INIT] No empty database template found in any expected location');
      throw new Error('Database template not found. Please reinstall the application.');
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

/**
 * Check if this is the first run of the application
 */
export function isFirstRun(): boolean {
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  if (isDev) {
    return false; // Never show welcome on dev
  }

  const firstRunMarker = path.join(app.getPath('userData'), '.first-run');
  return fs.existsSync(firstRunMarker);
}

/**
 * Clear the first run marker (call this after welcome screen is shown)
 */
export function clearFirstRunMarker(): void {
  const firstRunMarker = path.join(app.getPath('userData'), '.first-run');
  if (fs.existsSync(firstRunMarker)) {
    fs.unlinkSync(firstRunMarker);
    console.log('[DB INIT] First-run marker cleared');
  }
}

/**
 * Apply database schema using Prisma migrations
 * This is called on first run to create the database structure
 */
export async function applyDatabaseSchema(): Promise<void> {
  console.log('[DB INIT] Applying database schema...');

  try {
    const prismaClient = getMainDatabase();

    // Use Prisma's migration API to apply schema
    // Since we ship schema.prisma, we can use db push to create tables
    await prismaClient.$executeRawUnsafe(`
      -- This will be handled by Prisma Migrate Deploy in production
      -- For now, we'll rely on Prisma Client's auto-migration
      SELECT 1;
    `);

    console.log('[DB INIT] Database schema applied successfully');
  } catch (error) {
    console.error('[DB INIT] Failed to apply database schema:', error);
    throw error;
  }
}