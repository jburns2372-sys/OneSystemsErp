import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

let prismaUrl = process.env.DATABASE_URL;

if (process.env.VERCEL || process.env.VERCEL_ENV) {
  const tmpDbPath = '/tmp/dev.db';
  
  if (!fs.existsSync(tmpDbPath)) {
    try {
      const rootDbPath = path.join(process.cwd(), 'dev.db');
      const prismaDbPath = path.join(process.cwd(), 'prisma', 'dev.db');
      
      if (fs.existsSync(rootDbPath)) {
        fs.copyFileSync(rootDbPath, tmpDbPath);
      } else if (fs.existsSync(prismaDbPath)) {
        fs.copyFileSync(prismaDbPath, tmpDbPath);
      }
    } catch (e) {
      console.error('Failed to copy database to /tmp', e);
    }
  }
  
  prismaUrl = `file:${tmpDbPath}`;
}

const globalForPrisma2 = globalThis as unknown as {
  prisma2: PrismaClient | undefined;
};

export const prisma = globalForPrisma2.prisma2 ?? new PrismaClient({
  datasources: {
    db: {
      url: prismaUrl,
    },
  },
});

if (process.env.NODE_ENV !== 'production') globalForPrisma2.prisma2 = prisma;
