import { getUserPermissions } from '@/lib/permissions';
import { cookies } from 'next/headers';
import { runBulkSchemaScanner } from '@/lib/ai-bulk-scanner';

export const maxDuration = 60; // Allow 60 seconds for multiple OpenAI calls

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session')?.value || '';
    const permissions = await getUserPermissions(sessionId);

    if (!permissions.IS_ADMIN) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { totalScanned, totalKeywordsGenerated } = await runBulkSchemaScanner();

    return Response.json({
      success: true,
      message: `Bulk scanner completed. Scanned ${totalScanned} core models. Auto-generated ${totalKeywordsGenerated} semantic keywords.`
    });

  } catch (error) {
    console.error("Bulk Scan Error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
