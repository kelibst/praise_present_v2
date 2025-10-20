import { app } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

export function getProductionDatabasePath(): string {
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

  if (isDev) {
    return path.join(process.cwd(), 'prisma', 'dev.db');
  }

  // In production, use userData directory
  const dbPath = path.join(app.getPath('userData'), 'database.db');
  const dbDir = path.dirname(dbPath);

  // Ensure directory exists
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // Copy initial database if it doesn't exist
  if (!fs.existsSync(dbPath)) {
    // Try to find the database in resources
    const possiblePaths = [
      path.join(process.resourcesPath, 'prisma', 'dev.db'),
      path.join(process.resourcesPath, 'extraResources', 'prisma', 'dev.db'),
      path.join(process.resourcesPath, 'app', 'prisma', 'dev.db'),
      path.join(process.resourcesPath, 'app.asar.unpacked', 'prisma', 'dev.db'),
    ];

    let sourceDb: string | null = null;
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        sourceDb = p;
        break;
      }
    }

    if (sourceDb) {
      console.log(`Copying database from ${sourceDb} to ${dbPath}`);
      fs.copyFileSync(sourceDb, dbPath);
    } else {
      console.log('No source database found, will create new database');
    }
  }

  return dbPath;
}

export function initializePrismaClient(): PrismaClient {
  if (prisma) {
    return prisma;
  }

  const dbPath = getProductionDatabasePath();
  console.log(`Using database at: ${dbPath}`);

  // Set the DATABASE_URL environment variable for Prisma
  process.env.DATABASE_URL = `file:${dbPath}`;

  prisma = new PrismaClient({
    log: ['error', 'warn'],
    datasources: {
      db: {
        url: `file:${dbPath}`
      }
    }
  });

  return prisma;
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