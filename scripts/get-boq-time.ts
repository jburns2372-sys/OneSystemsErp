import { PrismaClient } from '@prisma/client';

process.env.DATABASE_URL = "postgresql://neondb_owner:npg_brmzcXfH81MG@ep-holy-darkness-apqs7kn7-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
process.env.DIRECT_URL = "postgresql://neondb_owner:npg_brmzcXfH81MG@ep-holy-darkness-apqs7kn7.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const prisma = new PrismaClient();

async function main() {
    const v = await prisma.projectBOQVersion.findFirst({ where: { projectId: 'cmrirhhw30000ic0406v47smb' } });
    console.log('ProjectBOQVersion createdAt (UTC):', v?.createdAt?.toISOString());
    const a = await prisma.awardedBOQItem.findFirst({ where: { projectId: 'cmrirhhw30000ic0406v47smb' }, orderBy: { createdAt: 'asc' } });
    console.log('Earliest AwardedBOQItem (UTC):', a?.createdAt?.toISOString());
}
main().finally(() => prisma.$disconnect());
