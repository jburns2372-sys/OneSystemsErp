import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  BlobNotFoundError,
  del,
  get,
  head,
  list,
  put,
} from '@vercel/blob';
import type { PrismaClient } from '@prisma/client';

export type UboqVaultBackendType = 'VERCEL_BLOB_PRIVATE' | 'LOCAL_DURABLE_TEST';

export interface VaultStoredObjectReceipt {
  readonly storageUri: string;
  readonly backend: UboqVaultBackendType;
  readonly sha256Hash: string;
  readonly verifiedReadBackSha256: string;
  readonly byteSize: number;
  readonly newlyCreated: boolean;
}

export interface UboqVaultStorageProvider {
  readonly backendName: UboqVaultBackendType;
  buildCanonicalStorageUri(projectId: string, sha256Hash: string): string;
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

const ENVELOPE_MAGIC = Buffer.from('UBOQBV1\0', 'ascii'); // 8-byte header
const IV_BYTES = 12;
const AUTH_TAG_BYTES = 16;
const MIN_ENVELOPE_BYTES = ENVELOPE_MAGIC.length + IV_BYTES + AUTH_TAG_BYTES;

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

async function readableStreamToBuffer(stream: ReadableStream<Uint8Array> | null): Promise<Buffer> {
  if (!stream) return Buffer.alloc(0);
  const chunks: Buffer[] = [];
  const reader = stream.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(Buffer.from(value));
  }
  return Buffer.concat(chunks);
}

function parseStoreIdFromRwToken(rwToken: string): string | null {
  const m = /^vercel_blob_rw_([a-zA-Z0-9]+)_/.exec(rwToken);
  if (!m) return null;
  return `store_${m[1].toLowerCase()}`;
}

function normalizeStoreId(rawStoreId: string): string {
  const trimmed = rawStoreId.trim();
  if (!/^store_[a-zA-Z0-9]+$/i.test(trimmed)) {
    throw new Error(`UBOQ_VAULT_INVALID_STORE_ID: Invalid Vercel Blob store identifier "${trimmed}"`);
  }
  return `store_${trimmed.slice(6).toLowerCase()}`;
}

export class VercelBlobPrivateVaultProvider implements UboqVaultStorageProvider {
  public readonly backendName = 'VERCEL_BLOB_PRIVATE' as const;
  private readonly token: string | undefined;
  private readonly oidcToken: string | undefined;
  private readonly storeId: string;
  private readonly rawStoreIdForOidc: string | undefined;
  private readonly envNamespace: string;
  private readonly derivedAesKey: Buffer;

  constructor() {
    const rwToken = (
      process.env.UBOQ_VAULT_BLOB_READ_WRITE_TOKEN ||
      process.env.BLOB_READ_WRITE_TOKEN ||
      ''
    ).trim();
    const oidc = (process.env.VERCEL_OIDC_TOKEN || '').trim();
    const rawStoreEnv = (
      process.env.UBOQ_VAULT_BLOB_STORE_ID ||
      process.env.BLOB_STORE_ID ||
      ''
    ).trim();

    const parsedTokenStoreId = rwToken ? parseStoreIdFromRwToken(rwToken) : null;
    if (rwToken && !parsedTokenStoreId) {
      throw new Error(
        'UBOQ_PRIVATE_BLOB_INVALID_TOKEN_FORMAT: BLOB_READ_WRITE_TOKEN is not a valid Vercel Blob read-write token'
      );
    }

    const normalizedEnvStoreId = rawStoreEnv ? normalizeStoreId(rawStoreEnv) : null;
    if (parsedTokenStoreId && normalizedEnvStoreId && parsedTokenStoreId !== normalizedEnvStoreId) {
      throw new Error(
        'UBOQ_VAULT_STORE_ID_MISMATCH: Configured BLOB_STORE_ID does not match BLOB_READ_WRITE_TOKEN store'
      );
    }

    const effectiveStoreId = parsedTokenStoreId || normalizedEnvStoreId;
    if (!effectiveStoreId || (!rwToken && !oidc)) {
      throw new Error(
        'UBOQ_PRIVATE_BLOB_STORAGE_REQUIRED: Dedicated Vercel Blob Private Storage credentials (BLOB_READ_WRITE_TOKEN or VERCEL_OIDC_TOKEN + BLOB_STORE_ID) are required for UBOQ immutable document vault'
      );
    }

    const keyHex = (process.env.UBOQ_VAULT_ENCRYPTION_KEY || '').trim();
    if (!/^[0-9a-fA-F]{64}$/.test(keyHex)) {
      throw new Error(
        'UBOQ_VAULT_ENCRYPTION_KEY_REQUIRED: A 256-bit (64-hex) UBOQ_VAULT_ENCRYPTION_KEY is required for authenticated vault encryption'
      );
    }

    const rawNamespace = (
      process.env.UBOQ_VAULT_ENV_NAMESPACE ||
      process.env.VERCEL_ENV ||
      'preview'
    )
      .trim()
      .toLowerCase();
    this.envNamespace = sanitizeSegment(rawNamespace, 'ENV_NAMESPACE');
    this.storeId = effectiveStoreId;
    this.rawStoreIdForOidc = rawStoreEnv || undefined;
    this.token = rwToken || undefined;
    this.oidcToken = !rwToken && oidc ? oidc : undefined;

    this.derivedAesKey = Buffer.from(
      crypto.hkdfSync(
        'sha256',
        Buffer.from(keyHex, 'hex'),
        Buffer.from(this.storeId, 'utf8'),
        Buffer.from(`UBOQ_BLOB_VAULT_KEY_V1|${this.envNamespace}`, 'utf8'),
        32
      )
    );
  }

  private authOptions(): { token?: string; oidcToken?: string; storeId?: string } {
    if (this.token) {
      return { token: this.token };
    }
    return { oidcToken: this.oidcToken, storeId: this.rawStoreIdForOidc };
  }

  private buildPathname(projectId: string, sha256Hash: string): string {
    const p = sanitizeSegment(projectId, 'PROJECT_ID');
    const h = sanitizeSegment(sha256Hash.toLowerCase(), 'SHA256');
    return `uboq-private-vault/${this.envNamespace}/${p}/${h}.bin`;
  }

  public buildCanonicalStorageUri(projectId: string, sha256Hash: string): string {
    const pathname = this.buildPathname(projectId, sha256Hash);
    return `uboq-vercel-blob://${this.storeId}/${pathname}`;
  }

  private buildAad(projectId: string, sha256Hash: string): Buffer {
    return Buffer.from(
      `UBOQ_BLOB_VAULT_AAD_V1|${this.storeId}|${this.envNamespace}|${projectId}|${sha256Hash.toLowerCase()}`,
      'utf8'
    );
  }

  private encryptPayload(plaintext: Buffer, projectId: string, sha256Hash: string): Buffer {
    const iv = crypto.randomBytes(IV_BYTES);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.derivedAesKey, iv, {
      authTagLength: AUTH_TAG_BYTES,
    });
    cipher.setAAD(this.buildAad(projectId, sha256Hash));
    const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return Buffer.concat([ENVELOPE_MAGIC, iv, authTag, encrypted]);
  }

  private decryptPayload(envelope: Buffer, projectId: string, sha256Hash: string): Buffer {
    if (
      envelope.length < MIN_ENVELOPE_BYTES ||
      !envelope.subarray(0, ENVELOPE_MAGIC.length).equals(ENVELOPE_MAGIC)
    ) {
      throw new Error('UBOQ_VAULT_ENVELOPE_INVALID: Stored object is missing valid UBOQBV1 header');
    }
    const ivStart = ENVELOPE_MAGIC.length;
    const tagStart = ivStart + IV_BYTES;
    const dataStart = tagStart + AUTH_TAG_BYTES;
    const iv = envelope.subarray(ivStart, tagStart);
    const authTag = envelope.subarray(tagStart, dataStart);
    const ciphertext = envelope.subarray(dataStart);

    try {
      const decipher = crypto.createDecipheriv('aes-256-gcm', this.derivedAesKey, iv, {
        authTagLength: AUTH_TAG_BYTES,
      });
      decipher.setAAD(this.buildAad(projectId, sha256Hash));
      decipher.setAuthTag(authTag);
      return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    } catch {
      throw new Error(
        'UBOQ_VAULT_ENCRYPTION_AUTH_FAILED: Authenticated AES-256-GCM decryption failed (key, environment, project, or ciphertext mismatch)'
      );
    }
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
      throw new Error(
        `UBOQ_VAULT_INPUT_HASH_MISMATCH: Computed ${computed} !== declared ${params.sha256Hash}`
      );
    }

    const pathname = this.buildPathname(params.projectId, computed);
    const storageUri = this.buildCanonicalStorageUri(params.projectId, computed);

    let newlyCreated = false;
    let alreadyExists = false;
    try {
      await head(pathname, this.authOptions());
      alreadyExists = true;
    } catch (err: unknown) {
      if (!(err instanceof BlobNotFoundError)) {
        throw err;
      }
    }

    if (!alreadyExists) {
      const encryptedEnvelope = this.encryptPayload(params.buffer, params.projectId, computed);
      try {
        await put(pathname, encryptedEnvelope, {
          access: 'private',
          addRandomSuffix: false,
          allowOverwrite: false,
          contentType: 'application/octet-stream',
          ...this.authOptions(),
        });
        newlyCreated = true;
      } catch (writeError) {
        // A competing writer can win after head() reported absence. Reuse only
        // an authenticated, project-bound, hash-verified object; never overwrite.
        try {
          await this.getAndVerify({ storageUri, expectedProjectId: params.projectId,
            expectedSha256Hash: computed });
        } catch {
          throw writeError;
        }
      }
    }

    const readBack = await this.getAndVerify({
      storageUri,
      expectedProjectId: params.projectId,
      expectedSha256Hash: computed,
    });

    return {
      storageUri,
      backend: 'VERCEL_BLOB_PRIVATE',
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
    const normalizedHash = params.expectedSha256Hash.toLowerCase();
    const expectedPathname = this.buildPathname(params.expectedProjectId, normalizedHash);
    const expectedUri = this.buildCanonicalStorageUri(params.expectedProjectId, normalizedHash);

    if (params.storageUri !== expectedUri) {
      throw new Error(
        'UBOQ_VAULT_CROSS_PROJECT_URI_DENIED: Storage URI does not match authorized store/environment/project/hash'
      );
    }

    const res = await get(expectedPathname, {
      access: 'private',
      useCache: false,
      ...this.authOptions(),
    });
    if (!res || res.statusCode !== 200 || !res.stream) {
      throw new Error(
        `UBOQ_VAULT_OBJECT_MISSING: Private blob object not found in vault for ${normalizedHash}`
      );
    }
    if (res.blob.pathname !== expectedPathname) {
      throw new Error('UBOQ_VAULT_PATHNAME_MISMATCH: Returned blob pathname mismatch');
    }

    const encryptedEnvelope = await readableStreamToBuffer(res.stream);
    const plaintext = this.decryptPayload(encryptedEnvelope, params.expectedProjectId, normalizedHash);
    const actualSha = computeSha256Hex(plaintext);
    if (actualSha !== normalizedHash) {
      throw new Error(
        `UBOQ_VAULT_INTEGRITY_CORRUPTION: Decrypted object SHA-256 (${actualSha}) !== expected (${normalizedHash})`
      );
    }

    return { buffer: plaintext, verifiedSha256: actualSha };
  }

  async deleteOrphanIfCreated(storageUri: string): Promise<void> {
    const prefix = `uboq-vercel-blob://${this.storeId}/uboq-private-vault/${this.envNamespace}/`;
    if (!storageUri.startsWith(prefix)) return;
    const pathname = storageUri.slice(`uboq-vercel-blob://${this.storeId}/`.length);
    if (pathname.includes('..')) return;
    await del(pathname, this.authOptions());
  }

  async listProjectObjectHashes(projectId: string): Promise<string[]> {
    const p = sanitizeSegment(projectId, 'PROJECT_ID');
    const prefix = `uboq-private-vault/${this.envNamespace}/${p}/`;
    const hashes: string[] = [];
    let cursor: string | undefined;
    do {
      const page = await list({
        prefix,
        cursor,
        ...this.authOptions(),
      });
      for (const b of page.blobs) {
        const base = path.posix.basename(b.pathname || '', '.bin');
        if (/^[a-f0-9]{64}$/.test(base)) {
          hashes.push(base);
        }
      }
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);
    return hashes;
  }
}

class LocalDurableVaultProvider implements UboqVaultStorageProvider {
  public readonly backendName = 'LOCAL_DURABLE_TEST' as const;
  private readonly rootDir: string;

  constructor(rootDir: string) {
    this.rootDir = path.resolve(rootDir);
  }

  private resolveObjectPath(
    projectId: string,
    sha256Hash: string
  ): { filePath: string; storageUri: string } {
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

  public buildCanonicalStorageUri(projectId: string, sha256Hash: string): string {
    return this.resolveObjectPath(projectId, sha256Hash).storageUri;
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
      throw new Error(
        `UBOQ_VAULT_INPUT_HASH_MISMATCH: Computed ${computed} !== declared ${params.sha256Hash}`
      );
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
      throw new Error(
        'UBOQ_VAULT_CROSS_PROJECT_URI_DENIED: Storage URI does not match authorized project/hash'
      );
    }

    let buf: Buffer;
    try {
      buf = await fs.readFile(filePath);
    } catch {
      throw new Error(
        `UBOQ_VAULT_OBJECT_MISSING: Original binary not found in vault for ${params.expectedSha256Hash}`
      );
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
  const isProd = process.env.NODE_ENV === 'production';

  // R1-M01: Unconditional production fail-closed guard — NO environment variable override can enable local_durable in production!
  if (
    isProd &&
    (mode === 'local_durable' || Boolean((process.env.UBOQ_ALLOW_LOCAL_TEST_VAULT || '').trim()))
  ) {
    throw new Error(
      'UBOQ_PROD_EPHEMERAL_STORAGE_FORBIDDEN: local_durable vault adapter and test vault overrides are strictly prohibited in production; bind Vercel Blob Private Storage'
    );
  }

  if (mode === 'local_durable') {
    const vaultDir = (process.env.UBOQ_LOCAL_VAULT_DIR || '').trim();
    if (!vaultDir) {
      throw new Error(
        'UBOQ_LOCAL_VAULT_DIR_REQUIRED: UBOQ_LOCAL_VAULT_DIR must be explicitly configured for local_durable vault mode'
      );
    }
    return new LocalDurableVaultProvider(vaultDir);
  }

  if (mode && mode !== 'vercel_blob_private') {
    throw new Error(
      `UBOQ_VAULT_UNSUPPORTED_BACKEND: Unsupported UBOQ_VAULT_BACKEND "${mode}"; expected "vercel_blob_private"`
    );
  }

  return new VercelBlobPrivateVaultProvider();
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
      const uri = provider.buildCanonicalStorageUri(projectId, h);
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
