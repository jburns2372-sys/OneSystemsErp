import { verifySession } from '@/lib/dal/auth';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserPermissions } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { chunkText, generateEmbedding } from '@/lib/ai-indexer';
import * as fs from 'fs';
import * as path from 'path';

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const __session = await verifySession();
  const userId = __session?.id || '';
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const permissions = await getUserPermissions(userId);

    // Enforce Super Admin access
    if (!permissions.IS_ADMIN) {
      return NextResponse.json({ error: "Forbidden: Super Admin access required for full system indexing." }, { status: 403 });
    }

    const { action } = await req.json();

    if (action === 'schema') {
      const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
      const schemaContent = fs.readFileSync(schemaPath, 'utf8');
      
      const doc = await prisma.aiKnowledgeSource.create({
        data: {
          title: "System Database Schema",
          sourceType: "database_schema",
          uploadedById: userId,
          allowedRoles: '["SUPER_ADMIN"]', // Only accessible to admins
          status: "INDEXED",
        }
      });

      const chunks = chunkText(schemaContent, 500);
      let chunksProcessed = 0;

      for (const chunk of chunks) {
        if (!chunk.trim()) continue;
        const embedding = await generateEmbedding(`[DATABASE SCHEMA COMPONENT]:\n${chunk}`);
        await prisma.aiKnowledgeChunk.create({
          data: {
            sourceId: doc.id,
            chunkIndex: chunksProcessed,
            chunkText: `[DATABASE SCHEMA COMPONENT]:\n${chunk}`,
            allowedRoles: '["SUPER_ADMIN"]',
            vectorEmbedding: JSON.stringify(embedding),
          }
        });
        chunksProcessed++;
      }

      return NextResponse.json({ 
        success: true, 
        message: `Database Schema Successfully Indexed. Created ${chunksProcessed} vector chunks.`,
        actionType: 'Database Schema'
      });
    }

    if (action === 'routes') {
      const appPath = path.join(process.cwd(), 'src', 'app');
      
      const walkSync = (dir: string, filelist: string[] = []) => {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const filepath = path.join(dir, file);
          if (fs.statSync(filepath).isDirectory()) {
            filelist.push(`Module Route: /${path.relative(appPath, filepath).replace(/\\/g, '/')}`);
            filelist = walkSync(filepath, filelist);
          }
        }
        return filelist;
      };

      const routes = walkSync(appPath);
      const routesContent = routes.join('\n');

      const doc = await prisma.aiKnowledgeSource.create({
        data: {
          title: "Application Routes & File Structure",
          sourceType: "module_policy",
          uploadedById: userId,
          allowedRoles: '["SUPER_ADMIN"]',
          status: "INDEXED",
        }
      });

      const chunks = chunkText(routesContent, 500);
      let chunksProcessed = 0;

      for (const chunk of chunks) {
        if (!chunk.trim()) continue;
        const embedding = await generateEmbedding(`[APPLICATION ROUTE STRUCTURE]:\n${chunk}`);
        await prisma.aiKnowledgeChunk.create({
          data: {
            sourceId: doc.id,
            chunkIndex: chunksProcessed,
            chunkText: `[APPLICATION ROUTE STRUCTURE]:\n${chunk}`,
            allowedRoles: '["SUPER_ADMIN"]',
            vectorEmbedding: JSON.stringify(embedding),
          }
        });
        chunksProcessed++;
      }

      return NextResponse.json({ 
        success: true, 
        message: `Application Routes Successfully Indexed. Created ${chunksProcessed} vector chunks.`,
        actionType: 'Application Routes'
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("System Indexing error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
