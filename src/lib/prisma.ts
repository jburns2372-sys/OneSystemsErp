import { PrismaClient } from '@prisma/client';
import { neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

const globalForPrisma2 = globalThis as unknown as {
  prisma2: PrismaClient | undefined;
};

let prisma: PrismaClient;

  const connectionString = process.env.NEON_BRANCH_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('Please define the DATABASE_URL environment variable inside .env');
  }
  const adapter = new PrismaNeon({ connectionString });
  prisma = new PrismaClient({ adapter });

export { prisma };

if (process.env.NODE_ENV !== 'production') globalForPrisma2.prisma2 = prisma;
