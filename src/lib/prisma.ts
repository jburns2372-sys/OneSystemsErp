import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

let prismaUrl = process.env.DATABASE_URL;



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
