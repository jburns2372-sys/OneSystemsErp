import { PrismaClient } from '@prisma/client';

const globalForPrisma2 = globalThis as unknown as {
  prisma2: PrismaClient | undefined;
};

export const prisma = globalForPrisma2.prisma2 ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma2.prisma2 = prisma;
