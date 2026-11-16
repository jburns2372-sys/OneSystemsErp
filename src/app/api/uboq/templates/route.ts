import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { verifyOperationalSession } from '@/lib/dal/auth';
import { withUboqRlsContext } from '@/lib/uboq/project-ownership';
import {
  hasSensitiveProjectedColumns,
  hasSensitiveRequestedFields,
  recordSensitiveTemplateExportAudit,
} from '@/lib/uboq/templates/canonical-source-adapters';
import {
  buildInitialTemplate,
  listInitialTemplateSources,
  parseInitialTemplateRequest,
  renderWorkingTemplateToXlsxBuffer,
  TemplateRequestError,
} from '@/lib/uboq/templates/t0-t1';
import { exportProjectionToCsvString } from '@/lib/uboq/template-builder';

export const runtime = 'nodejs';
const noCache = {'Cache-Control':'private, no-store'};
function failure(error: unknown) {
  if (error instanceof TemplateRequestError) return NextResponse.json({error:error.code},{status:error.status,headers:noCache});
  const msg = error instanceof Error ? error.message : '';
  const forbidden = /UBOQ_(?:PBAC|RBAC|UNAUTHORIZED|PROJECT_NOT_FOUND)|42501/.test(msg);
  return NextResponse.json({error:forbidden?'TEMPLATE_ACCESS_DENIED':'TEMPLATE_REQUEST_FAILED'},{status:forbidden?403:500,headers:noCache});
}
async function readProject<T>(actor:{userId:string;sessionVersion:number},projectId:string,read:(tx:Prisma.TransactionClient)=>Promise<T>) {
  return withUboqRlsContext({userId:actor.userId,sessionVersion:actor.sessionVersion,projectId},()=>
    prisma.$transaction(async tx=>{
      await tx.$executeRaw`SET TRANSACTION READ ONLY`;
      // Query-only Prisma extension retains the same delegates at runtime.
      return read(tx as unknown as Prisma.TransactionClient);
    },
      {isolationLevel:Prisma.TransactionIsolationLevel.RepeatableRead,maxWait:5000,timeout:15000}));
}
async function writeSensitiveAudit(
  actor: { userId: string; sessionVersion: number },
  projectId: string,
  write: (tx: Prisma.TransactionClient) => Promise<void>
) {
  return withUboqRlsContext(
    { userId: actor.userId, sessionVersion: actor.sessionVersion, projectId },
    () =>
      prisma.$transaction(
        async (tx) => write(tx as unknown as Prisma.TransactionClient),
        {
          isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
          maxWait: 5000,
          timeout: 10000,
        }
      )
  );
}
export async function GET(req:NextRequest) {
  try {
    const actor=await verifyOperationalSession();
    if (!actor) return NextResponse.json({error:'Unauthorized'},{status:401,headers:noCache});
    const projectId=req.nextUrl.searchParams.get('projectId') || '';
    return NextResponse.json(await readProject(actor,projectId,tx=>listInitialTemplateSources(tx,actor.userId,projectId)),{headers:noCache});
  } catch(error) {return failure(error);}
}
export async function POST(req:NextRequest) {
  try {
    const actor=await verifyOperationalSession();
    if (!actor) return NextResponse.json({error:'Unauthorized'},{status:401,headers:noCache});
    // Bounded layouts only. Client-supplied canonical rows, role and formulas are rejected.
    const text=await req.text();
    if (Buffer.byteLength(text,'utf8')>16384) throw new TemplateRequestError('TEMPLATE_REQUEST_TOO_LARGE',413);
    let body:unknown;try {body=JSON.parse(text);} catch {throw new TemplateRequestError('TEMPLATE_INVALID_JSON');}
    const input=parseInitialTemplateRequest(body);
    const sourceIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null;
    let result: Awaited<ReturnType<typeof buildInitialTemplate>>;
    try {
      result=await readProject(actor,input.projectId,tx=>buildInitialTemplate(tx,actor.userId,input));
    } catch (err) {
      if (
        err instanceof TemplateRequestError &&
        err.code === 'TEMPLATE_FIELD_FORBIDDEN' &&
        hasSensitiveRequestedFields(input.selectedFields)
      ) {
        try {
          await writeSensitiveAudit(actor, input.projectId, (tx) =>
            recordSensitiveTemplateExportAudit(tx, {
              userId: actor.userId,
              projectId: input.projectId,
              templateCode: input.templateCode,
              format: input.format,
              sourceId: input.sourceId,
              recordCount: 0,
              sourceIp,
              approved: false,
              blocked: true,
              reason: 'BLOCKED_SENSITIVE_FIELD_REQUEST_TEMPLATE_FIELD_FORBIDDEN',
            })
          );
        } catch {
          // Preserve original 403 response if caller also lacks project RLS scope
        }
      }
      throw err;
    }
    const name=`${input.templateCode}_${input.sourceId}`;
    let deliveredBytes: Buffer;
    let contentType: string;
    let contentDisposition: string | null = null;
    if (input.format==='json') {
      deliveredBytes = Buffer.from(JSON.stringify(result), 'utf8');
      contentType = 'application/json';
    } else if (input.format==='csv') {
      deliveredBytes = Buffer.from(exportProjectionToCsvString(result.projection), 'utf8');
      contentType = 'text/csv; charset=utf-8';
      contentDisposition = `attachment; filename="${name}.csv"`;
    } else {
      deliveredBytes = await renderWorkingTemplateToXlsxBuffer(result.projection,input.templateCode);
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      contentDisposition = `attachment; filename="${name}.xlsx"`;
    }
    if (hasSensitiveProjectedColumns(result.projection.visibleColumns)) {
      const outputSha256 = crypto.createHash('sha256').update(deliveredBytes).digest('hex');
      await writeSensitiveAudit(actor, input.projectId, (tx) =>
        recordSensitiveTemplateExportAudit(tx, {
          userId: actor.userId,
          projectId: input.projectId,
          templateCode: input.templateCode,
          format: input.format,
          sourceId: input.sourceId,
          recordCount: result.rowCount,
          sourceIp,
          approved: true,
          blocked: false,
          reason: `AUTHORIZED_SENSITIVE_TEMPLATE_${input.format.toUpperCase()}`,
          outputSha256,
        })
      );
    }
    const headers: Record<string, string> = { ...noCache, 'Content-Type': contentType };
    if (contentDisposition) headers['Content-Disposition'] = contentDisposition;
    return new NextResponse(new Uint8Array(deliveredBytes), { headers });
  } catch(error) {return failure(error);}
}
