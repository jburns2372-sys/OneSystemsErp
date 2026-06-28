import { PrismaClient } from '@prisma/client';
import { neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

const globalForPrisma2 = globalThis as unknown as {
  prisma2: PrismaClient | undefined;
};

let prisma: PrismaClient;

if (globalForPrisma2.prisma2) {
  prisma = globalForPrisma2.prisma2;
} else {
  // The NEON_BRANCH_URL is set dynamically during PR environments,
  // falling back to standard DATABASE_URL for prod and local dev.
  const connectionString = process.env.NEON_BRANCH_URL || process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('Please define the DATABASE_URL environment variable inside .env');
  }

  // Use the Prisma 6 adapter pattern: PrismaNeon creates and manages the Pool internally
  // from the configuration object, avoiding proxy cloning corruption issues.
  const adapter = new PrismaNeon({ connectionString });
  prisma = new PrismaClient({ adapter });
}

export { prisma };

if (process.env.NODE_ENV !== 'production') globalForPrisma2.prisma2 = prisma;
