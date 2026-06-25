import { detectIntents, expandKeywords } from '@/lib/rag-intelligence';
import { getUserPermissions } from '@/lib/permissions';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session')?.value || '';
    const permissions = await getUserPermissions(sessionId);

    if (!permissions.IS_ADMIN) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { question } = await req.json();

    const intents = await detectIntents(question);
    const expansion = await expandKeywords(question);

    return Response.json({
      intents,
      expansion: {
        originalMessage: expansion.originalMessage,
        matchedKeywords: expansion.matchedKeywords,
        modulesToSearch: Array.from(expansion.modulesToSearch),
        tablesToSearch: Array.from(expansion.tablesToSearch)
      }
    });

  } catch (error) {
    console.error("RAG Test Error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
