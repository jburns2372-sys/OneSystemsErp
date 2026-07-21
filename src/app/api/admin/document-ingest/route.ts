import { verifySession } from '@/lib/dal/auth';
import { prisma } from '@/lib/prisma';
import { getUserPermissions } from '@/lib/permissions';
import { cookies } from 'next/headers';
import { generateEmbedding } from '@/lib/ai-indexer';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const __session = await verifySession();
  const sessionId = __session?.id || '';
    const permissions = await getUserPermissions(sessionId);

    if (!permissions.IS_ADMIN) {
      return new Response("Unauthorized", { status: 401 });
    }

    // In a real app we would use formidable to parse form-data with the actual File blob.
    // For MVP, we'll accept raw text content sent from the frontend to simulate ingestion.
    const { filename, content, sourceType, confidentiality } = await req.json();

    if (!content) {
      return Response.json({ success: false, message: "No content provided." }, { status: 400 });
    }

    // Very simple text chunking by paragraph or double newline
    const chunks = content.split(/\n\s*\n/).filter((c: string) => c.trim().length > 20);

    let ingestedCount = 0;

    for (const chunk of chunks) {
      try {
        const vector = await generateEmbedding(chunk);
        
        await prisma.aiRagEmbedding.create({
          data: {
            sourceTitle: filename,
            sourceType: sourceType || 'DOCUMENT',
            sourceTextChunk: chunk,
            embeddingVector: JSON.stringify(vector),
            confidentialityLevel: confidentiality || 'PUBLIC',
          }
        });
        
        ingestedCount++;
      } catch (e) {
        console.error("Chunking error on part of document:", e);
      }
    }

    return Response.json({
      success: true,
      message: `Document ingested successfully. Created ${ingestedCount} vector embeddings.`
    });

  } catch (error) {
    console.error("Ingest Error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
