import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import type { PrismaClient } from '@prisma/client';

export interface VaultStoredObjectReceipt {
  readonly storageUri: string;
  readonly backend: 'S3_PRIVATE' | 'LOCAL_DURABLE_TEST';
  readonly sha256Hash: string;
  readonly verifiedReadBackSha256: string;
  readonly byteSize: number;
  readonly newlyCreated: boolean;
}

export interface UboqVaultStorageProvider {
  readonly backendName: 'S3_PRIVATE' | 'LOCAL_DURABLE_TEST';
  putImmutableAndVerify(params: {
    projectId: string;
    sha256Hash: string;
    fileName: string;
    mimeType: string;
    buffer: Buffer;
  }): Promise<VaultStoredObjectReceipt>;
  getAndVerify(params: {
    storageUri: string;
    expectedProjectId: string;
    expectedSha256Hash: string;
  }): Promise<{ buffer: Buffer; verifiedSha256: string }>;
  deleteOrphanIfCreated(storageUri: string): Promise<void>;
  listProjectObjectHashes(projectId: string): Promise<string[]>;
}

function sanitizeSegment(seg: string, label: string): string {
  const clean = String(seg ?? '').trim();
  if (!clean || !/^[a-zA-Z0-9._-]+$/.test(clean) || clean.includes('..')) {
    throw new Error(`UBOQ_VAULT_INVALID_${label}: Unsafe storage identifier "${clean}"`);
  }
  return clean;
}

function computeSha256Hex(buf: Buffer): string {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

async function streamToBuffer(body: unknown): Promise<Buffer> {
  if (!body) return Buffer.alloc(0);
  if (Buffer.isBuffer(body)) return body;
  if (body instanceof Uint8Array) return Buffer.from(body);
  if (typeof (body as { transformToByteArray?: () => Promise<Uint8Array> }).transformToByteArray === 'function') {
    const arr = await (body as { transformToByteArray: () => Promise<Uint8Array> }).transformToByteArray();
    return Buffer.from(arr);
  }
  const chunks: Buffer[] = [];
  for await (const chunk of body as AsyncIterable<Uint8Array>) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

class S3PrivateVaultProvider implements UboqVaultStorageProvider {
  public readonly backendName = 'S3_PRIVATE' as const;
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor() {
    const bucket = (process.env.UBOQ_VAULT_S3_BUCKET || process.env.S3_BUCKET_NAME || '').trim();
    const accessKeyId = (process.env.AWS_ACCESS_KEY_ID || '').trim();
    const secretAccessKey = (process.env.AWS_SECRET_ACCESS_KEY || '').trim();
    if (!bucket || !accessKeyId || !secretAccessKey) {
      throw new Error(
        'UBOQ_PROD_PRIVATE_OBJECT_STORAGE_REQUIRED: Verified private S3 bucket and credentials are required for UBOQ immutable document vault'
      );
    }
    this.bucket = bucket;
    this.client = new S3Client({
      region: process.env.AWS_REGION || 'ap-southeast-1',
      endpoint: process.env.UBOQ_VAULT_S3_ENDPOINT || undefined,
      forcePathStyle: process.env.UBOQ_VAULT_S3_FORCE_PATH_STYLE === 'true',
      credentials: { accessKeyId, secretAccessKey },
    });
  }

  private buildKey(projectId: string, sha256Hash: string): string {
    const p = sanitizeSegment(projectId, 'PROJECT_ID');
    const h = sanitizeSegment(sha256Hash.toLowerCase(), 'SHA256');
    return `uboq-private-vault/${p}/${h}.bin`;
  }

  async putImmutableAndVerify(params: {
    projectId: string;
    sha256Hash: string;
    fileName: string;
    mimeType: string;
    buffer: Buffer;
  }): Promise<VaultStoredObjectReceipt> {
    const computed = computeSha256Hex(params.buffer);
    if (computed !== params.sha256Hash.toLowerCase()) {
      throw new Error(`UBOQ_VAULT_INPUT_HASH_MISMATCH: Computed ${computed} !== declared ${params.sha256Hash}`);
    }
    const key = this.buildKey(params.projectId, computed);
    const storageUri = `uboq-s3://${this.bucket}/${key}`;

    let newlyCreated = false;
    try {
      await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
    } catch {
      newlyCreated = true;
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: params.buffer,
          ContentType: params.mimeType || 'application/octet-stream',
          ServerSideEncryption: 'AES256',
          IfNoneMatch: '*',
          Metadata: {
            projectid: params.projectId,
            sha256: computed,
            originalname: encodeURIComponent(params.fileName),
          },
        })
      );
    }

    const readBack = await this.getAndVerify({
      storageUri,
      expectedProjectId: params.projectId,
      expectedSha256Hash: computed,
    });

    return {
      storageUri,
      backend: 'S3_PRIVATE',
      sha256Hash: computed,
      verifiedReadBackSha256: readBack.verifiedSha256,
      byteSize: readBack.buffer.length,
      newlyCreated,
    };
  }

  async getAndVerify(params: {
    storageUri: string;
    expectedProjectId: string;
    expectedSha256Hash: string;
  }): Promise<{ buffer: Buffer; verifiedSha256: string }> {
    const expectedKey = this.buildKey(params.expectedProjectId, params.expectedSha256Hash);
    const expectedUri = `uboq-s3://${this.bucket}/${expectedKey}`;
    if (params.storageUri !== expectedUri) {
      throw new Error('UBOQ_VAULT_CROSS_PROJECT_URI_DENIED: Storage URI does not match authorized project/hash');
    }

    const resp = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: expectedKey }));
    const buf = await streamToBuffer(resp.Body);
    const actualSha = computeSha256Hex(buf);
    if (actualSha !== params.expectedSha256Hash.toLowerCase()) {
      throw new Error(`UBOQ_VAULT_INTEGRITY_CORRUPTION: Stored object SHA-256 (${actualSha}) !== expected (${params.expectedSha256Hash})`);
    }
    return { buffer: buf, verifiedSha256: actualSha };
  }

  async deleteOrphanIfCreated(storageUri: string): Promise<void> {
    const prefix = `uboq-s3://${this.bucket}/`;
    if (!storageUri.startsWith(prefix)) return;
    const key = storageUri.slice(prefix.length);
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  async listProjectObjectHashes(projectId: string): Promise<string[]> {
    const p = sanitizeSegment(projectId, 'PROJECT_ID');
    const prefix = `uboq-private-vault/${p}/`;
    const resp = await this.client.send(new ListObjectsV2Command({ Bucket: this.bucket, Prefix: prefix }));
    return (resp.Contents ?? [])
      .map((obj) => path.basename(obj.Key || '', '.bin'))
      .filter((h) => /^[a-f0-9]{64}$/.test(h));
  }
}

class LocalDurableVaultProvider implements UboqVaultStorageProvider {
  public readonly backendName = 'LOCAL_DURABLE_TEST' as const;
  private readonly rootDir: string;

  constructor(rootDir: string) {
    this.rootDir = path.resolve(rootDir);
  }

  private resolveObjectPath(projectId: string, sha256Hash: string): { filePath: string; storageUri: string } {
    const p = sanitizeSegment(projectId, 'PROJECT_ID');
    const h = sanitizeSegment(sha256Hash.toLowerCase(), 'SHA256');
    const filePath = path.resolve(this.rootDir, p, `${h}.bin`);
    if (!filePath.startsWith(this.rootDir + path.sep)) {
      throw new Error('UBOQ_VAULT_PATH_TRAVERSAL_BLOCKED');
    }
    return {
      filePath,
      storageUri: `uboq-local-vault://${p}/${h}.bin`,
    };
  }

  async putImmutableAndVerify(params: {
    projectId: string;
    sha256Hash: string;
    fileName: string;
    mimeType: string;
    buffer: Buffer;
  }): Promise<VaultStoredObjectReceipt> {
    const computed = computeSha256Hex(params.buffer);
    if (computed !== params.sha256Hash.toLowerCase()) {
      throw new Error(`UBOQ_VAULT_INPUT_HASH_MISMATCH: Computed ${computed} !== declared ${params.sha256Hash}`);
    }
    const { filePath, storageUri } = this.resolveObjectPath(params.projectId, computed);
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    let newlyCreated = false;
    try {
      // Write-once exclusive creation ('wx'): never overwrites an existing immutable object!
      await fs.writeFile(filePath, params.buffer, { flag: 'wx', mode: 0o444 });
      newlyCreated = true;
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException)?.code !== 'EEXIST') {
        throw err;
      }
    }

    const readBack = await this.getAndVerify({
      storageUri,
      expectedProjectId: params.projectId,
      expectedSha256Hash: computed,
    });

    return {
      storageUri,
      backend: 'LOCAL_DURABLE_TEST',
      sha256Hash: computed,
      verifiedReadBackSha256: readBack.verifiedSha256,
      byteSize: readBack.buffer.length,
      newlyCreated,
    };
  }

  async getAndVerify(params: {
    storageUri: string;
    expectedProjectId: string;
    expectedSha256Hash: string;
  }): Promise<{ buffer: Buffer; verifiedSha256: string }> {
    const { filePath, storageUri: expectedUri } = this.resolveObjectPath(
      params.expectedProjectId,
      params.expectedSha256Hash
    );
    if (params.storageUri !== expectedUri) {
      throw new Error('UBOQ_VAULT_CROSS_PROJECT_URI_DENIED: Storage URI does not match authorized project/hash');
    }

    let buf: Buffer;
    try {
      buf = await fs.readFile(filePath);
    } catch {
      throw new Error(`UBOQ_VAULT_OBJECT_MISSING: Original binary not found in vault for ${params.expectedSha256Hash}`);
    }

    const actualSha = computeSha256Hex(buf);
    if (actualSha !== params.expectedSha256Hash.toLowerCase()) {
      throw new Error(
        `UBOQ_VAULT_INTEGRITY_CORRUPTION: Stored file SHA-256 (${actualSha}) !== expected (${params.expectedSha256Hash})`
      );
    }
    return { buffer: buf, verifiedSha256: actualSha };
  }

  async deleteOrphanIfCreated(storageUri: string): Promise<void> {
    const m = /^uboq-local-vault:\/\/([^/]+)\/([a-f0-9]{64})\.bin$/.exec(storageUri);
    if (!m) return;
    const { filePath } = this.resolveObjectPath(m[1], m[2]);
    try {
      await fs.chmod(filePath, 0o666).catch(() => undefined);
      await fs.unlink(filePath);
    } catch {
      // Ignore if already absent
    }
  }

  async listProjectObjectHashes(projectId: string): Promise<string[]> {
    const p = sanitizeSegment(projectId, 'PROJECT_ID');
    const dir = path.resolve(this.rootDir, p);
    try {
      const entries = await fs.readdir(dir);
      return entries
        .filter((f) => f.endsWith('.bin'))
        .map((f) => f.slice(0, -4))
        .filter((h) => /^[a-f0-9]{64}$/.test(h));
    } catch {
      return [];
    }
  }
}

export function resolveUboqVaultStorageProvider(): UboqVaultStorageProvider {
  const mode = (process.env.UBOQ_VAULT_BACKEND || '').trim().toLowerCase();
  const isProd = process.env.NODE_ENV === 'production' && process.env.UBOQ_ALLOW_LOCAL_TEST_VAULT !== 'true';

  if (mode === 'local_durable') {
    if (isProd) {
      throw new Error(
        'UBOQ_PROD_EPHEMERAL_STORAGE_FORBIDDEN: local_durable vault adapter is prohibited in production; bind private S3 storage'
      );
    }
    const vaultDir = (process.env.UBOQ_LOCAL_VAULT_DIR || '').trim();
    if (!vaultDir) {
      throw new Error('UBOQ_LOCAL_VAULT_DIR_REQUIRED: UBOQ_LOCAL_VAULT_DIR must be explicitly configured for local_durable vault mode');
    }
    return new LocalDurableVaultProvider(vaultDir);
  }

  return new S3PrivateVaultProvider();
}

/**
 * Reconciles storage objects for a project against persisted UboqSourceDocument metadata,
 * purging any unreferenced orphan blobs and verifying that every DB record has intact vault bytes.
 */
export async function reconcileProjectVaultOrphans(
  prisma: PrismaClient,
  projectId: string,
  purgeOrphans = true
): Promise<{
  verifiedDocumentCount: number;
  orphanHashesFound: string[];
  orphanHashesPurged: string[];
  missingVaultDocumentIds: string[];
}> {
  const provider = resolveUboqVaultStorageProvider();
  const docs = await prisma.uboqSourceDocument.findMany({
    where: { projectId },
    select: { id: true, sha256Hash: true, storageUri: true },
  });

  const dbHashSet = new Set(docs.map((d) => d.sha256Hash.toLowerCase()));
  const storedHashes = await provider.listProjectObjectHashes(projectId);
  const orphanHashesFound = storedHashes.filter((h) => !dbHashSet.has(h));
  const orphanHashesPurged: string[] = [];

  if (purgeOrphans) {
    for (const h of orphanHashesFound) {
      const uri =
        provider.backendName === 'LOCAL_DURABLE_TEST'
          ? `uboq-local-vault://${projectId}/${h}.bin`
          : `uboq-s3://${process.env.UBOQ_VAULT_S3_BUCKET || process.env.S3_BUCKET_NAME}/uboq-private-vault/${projectId}/${h}.bin`;
      await provider.deleteOrphanIfCreated(uri);
      orphanHashesPurged.push(h);
    }
  }

  const missingVaultDocumentIds: string[] = [];
  for (const doc of docs) {
    try {
      await provider.getAndVerify({
        storageUri: doc.storageUri,
        expectedProjectId: projectId,
        expectedSha256Hash: doc.sha256Hash,
      });
    } catch {
      missingVaultDocumentIds.push(doc.id);
    }
  }

  return {
    verifiedDocumentCount: docs.length - missingVaultDocumentIds.length,
    orphanHashesFound,
    orphanHashesPurged,
    missingVaultDocumentIds,
  };
}
