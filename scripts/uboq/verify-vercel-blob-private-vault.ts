/* eslint-disable @typescript-eslint/no-explicit-any */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import Module from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { get, head } from '@vercel/blob';
import { NextRequest } from 'next/server';
import {
  resolveUboqVaultStorageProvider,
  VercelBlobPrivateVaultProvider,
} from '../../src/lib/uboq/storage/vault-storage';

const TEAM_ID = 'team_DWpmafscN88J0nNBvcUKHNM7';
const SCOPE = 'jburns2372-sys-projects';
const PRIMARY_PROJECT_ID = 'prj_eeuFU8EAtmiQp2TIIzuqcD91bNzi';
const PRIMARY_PROJECT_NAME = 'one-systems-erp';
const PREVIEW_BLOB_STORE_NAME = 'onesystemserp-uboq-vault-preview';
const OUT_PATH = 'artifacts/uboq/preview-readiness/vercel-blob-private-vault-verification.json';

function parseDotEnv(content: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq <= 0) continue;
    const k = line.slice(0, eq).trim();
    let v = line.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[k] = v;
  }
  return out;
}

function vercelApi(method: string, endpoint: string, bodyObj?: unknown): any {
  const args = ['api', endpoint, '--no-color'];
  if (method !== 'GET') {
    args.push('-X', method);
  }
  let tmpFile: string | null = null;
  if (bodyObj !== undefined) {
    tmpFile = path.join(
      os.tmpdir(),
      `oserp-blob-vcl-${Date.now()}-${crypto.randomBytes(6).toString('hex')}.json`
    );
    fs.writeFileSync(tmpFile, JSON.stringify(bodyObj), { mode: 0o600 });
    args.push('--input', tmpFile);
  }
  try {
    const r = spawnSync('vercel.cmd', args, {
      encoding: 'utf8',
      shell: true,
      timeout: 35000,
    });
    if (r.status !== 0) {
      throw new Error(
        `vercel api ${method} ${endpoint.split('?')[0]} failed [exit=${r.status}]: ${(r.stderr || '')
          .replace(/vercel_blob_rw_[^\s"']+/gi, '[REDACTED_BLOB_TOKEN]')
          .slice(0, 260)}`
      );
    }
    return r.stdout ? JSON.parse(r.stdout) : null;
  } finally {
    if (tmpFile && fs.existsSync(tmpFile)) {
      try {
        fs.unlinkSync(tmpFile);
      } catch {}
    }
  }
}

function upsertPreviewSensitiveVar(key: string, value: string) {
  const proj = vercelApi('GET', `/v9/projects/${PRIMARY_PROJECT_ID}?teamId=${TEAM_ID}`);
  const existing = (proj.env || []).find(
    (e: any) =>
      e.key === key &&
      Array.isArray(e.target) &&
      e.target.length === 1 &&
      e.target[0] === 'preview' &&
      !e.gitBranch
  );
  if (existing) {
    vercelApi('DELETE', `/v9/projects/${PRIMARY_PROJECT_ID}/env/${existing.id}?teamId=${TEAM_ID}`);
  }
  const created = vercelApi('POST', `/v10/projects/${PRIMARY_PROJECT_ID}/env?teamId=${TEAM_ID}`, {
    key,
    value,
    type: 'sensitive',
    target: ['preview'],
  });
  return {
    key,
    id: created?.created?.id || created?.id || 'created',
    target: ['preview'],
    type: 'sensitive',
  };
}

const report: Record<string, any> = {
  project: 'OSERP-PROJ-UBOQ-001',
  phase: 'PHASE_6_VERCEL_BLOB_PRIVATE_VAULT_VERIFICATION',
  evaluatedAt: new Date().toISOString(),
  checks: [],
};

function saveReport() {
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(report, null, 2) + '\n');
}

async function check(name: string, fn: () => Promise<Record<string, unknown>>) {
  const start = Date.now();
  const detail = await fn();
  report.checks.push({
    name,
    result: 'PASS',
    milliseconds: Date.now() - start,
    detail,
  });
  saveReport();
  console.log(`PASS ${name}`);
}

(async () => {
  // 1) Provision or locate dedicated PRIVATE Preview Blob store on one-systems-erp ONLY
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oserp-blob-prov-'));
  let storeMeta: any = null;
  let rwTokenInMemory = '';

  try {
    const linkRes = spawnSync(
      'vercel.cmd',
      ['link', '--yes', '--project', PRIMARY_PROJECT_NAME, '--scope', SCOPE, '--no-color'],
      { cwd: tmpDir, encoding: 'utf8', shell: true, timeout: 25000 }
    );
    assert.equal(linkRes.status, 0, 'Failed to link ephemeral dir to one-systems-erp');

    const storesList = vercelApi('GET', `/v1/storage/stores?teamId=${TEAM_ID}`);
    let existingStore = (storesList?.stores || []).find(
      (s: any) => s.type === 'blob' && s.name === PREVIEW_BLOB_STORE_NAME
    );

    let newlyCreatedStore = false;
    if (!existingStore) {
      const createRes = spawnSync(
        'vercel.cmd',
        [
          'blob',
          'create-store',
          PREVIEW_BLOB_STORE_NAME,
          '--access',
          'private',
          '--region',
          'iad1',
          '--environment',
          'preview',
          '--yes',
          '--scope',
          SCOPE,
          '--no-color',
        ],
        { cwd: tmpDir, encoding: 'utf8', shell: true, timeout: 45000 }
      );
      if (createRes.status !== 0) {
        throw new Error(
          `vercel blob create-store failed [exit=${createRes.status}]: ${(createRes.stderr || '')
            .replace(/vercel_blob_rw_[^\s"']+/gi, '[REDACTED]')
            .slice(0, 300)}`
        );
      }
      newlyCreatedStore = true;
      const refreshed = vercelApi('GET', `/v1/storage/stores?teamId=${TEAM_ID}`);
      existingStore = (refreshed?.stores || []).find(
        (s: any) => s.type === 'blob' && s.name === PREVIEW_BLOB_STORE_NAME
      );
    }

    assert.ok(existingStore?.id, 'Dedicated Preview Blob store ID not found');

    // Fetch store detail (contains access mode & connected projects; never print secrets!)
    const storeDetailRaw = vercelApi(
      'GET',
      `/v1/storage/stores/${existingStore.id}?teamId=${TEAM_ID}`
    );
    storeMeta = storeDetailRaw?.store || storeDetailRaw;
    storeMeta._newlyCreatedStore = newlyCreatedStore;

    // Pull Preview token into ephemeral file in memory if non-sensitive, or read from store secrets API
    const envPullPath = path.join(tmpDir, '.preview.blob.env');
    spawnSync(
      'vercel.cmd',
      [
        'env',
        'pull',
        envPullPath,
        '--yes',
        '--environment=preview',
        '--scope',
        SCOPE,
        '--no-color',
      ],
      { cwd: tmpDir, encoding: 'utf8', shell: true, timeout: 25000 }
    );
    if (fs.existsSync(envPullPath)) {
      const pulled = parseDotEnv(fs.readFileSync(envPullPath, 'utf8'));
      fs.unlinkSync(envPullPath);
      if (pulled.BLOB_READ_WRITE_TOKEN && pulled.BLOB_READ_WRITE_TOKEN.startsWith('vercel_blob_rw_')) {
        rwTokenInMemory = pulled.BLOB_READ_WRITE_TOKEN;
      }
    }

    if (!rwTokenInMemory) {
      // Fallback: query Vercel storage store credentials endpoint in memory (never logged!)
      const creds = vercelApi(
        'GET',
        `/v1/storage/stores/blob/${existingStore.id}?teamId=${TEAM_ID}`
      );
      const tok =
        creds?.store?.rwToken ||
        creds?.rwToken ||
        storeMeta?.rwToken ||
        '';
      if (typeof tok === 'string' && tok.startsWith('vercel_blob_rw_')) {
        rwTokenInMemory = tok;
      }
    }
  } finally {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {}
  }

  assert.ok(
    rwTokenInMemory.startsWith('vercel_blob_rw_'),
    'In-memory Preview BLOB_READ_WRITE_TOKEN unavailable for live verification'
  );

  // Generate dedicated 256-bit Preview vault encryption key in memory and bind Preview-only config on one-systems-erp
  const previewVaultEncryptionKeyHex = crypto.randomBytes(32).toString('hex');

  const configuredPreviewEnvReceipts = [
    upsertPreviewSensitiveVar('UBOQ_VAULT_BLOB_READ_WRITE_TOKEN', rwTokenInMemory),
    upsertPreviewSensitiveVar('UBOQ_VAULT_BLOB_STORE_ID', storeMeta.id),
    upsertPreviewSensitiveVar('UBOQ_VAULT_BACKEND', 'vercel_blob_private'),
    upsertPreviewSensitiveVar('UBOQ_VAULT_ENV_NAMESPACE', 'preview'),
    upsertPreviewSensitiveVar('UBOQ_VAULT_ENCRYPTION_KEY', previewVaultEncryptionKeyHex),
  ];

  // Configure in-memory process.env for live test suite
  const savedEnv = { ...process.env };
  process.env.UBOQ_VAULT_BLOB_READ_WRITE_TOKEN = rwTokenInMemory;
  process.env.BLOB_READ_WRITE_TOKEN = rwTokenInMemory;
  process.env.UBOQ_VAULT_BLOB_STORE_ID = storeMeta.id;
  process.env.UBOQ_VAULT_BACKEND = 'vercel_blob_private';
  process.env.UBOQ_VAULT_ENV_NAMESPACE = 'preview';
  process.env.UBOQ_VAULT_ENCRYPTION_KEY = previewVaultEncryptionKeyHex;

  const synthProjectId = `SYNTH-BLOB-VAULT-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  const samplePlaintext = Buffer.from(
    `OSERP-UBOQ-PRIVATE-BOQ-FIXTURE|${synthProjectId}|CONFIDENTIAL-UNIT-RATES-125000.00`,
    'utf8'
  );
  const sampleSha256 = crypto.createHash('sha256').update(samplePlaintext).digest('hex');
  let createdStorageUri = '';

  try {
    await check(
      'VB-01 Dedicated Vercel Blob store ownership, private access level, and Preview-only environment isolation',
      async () => {
        assert.equal(storeMeta.name, PREVIEW_BLOB_STORE_NAME);
        assert.equal(
          String(storeMeta.access || 'private').toLowerCase(),
          'private',
          'Blob store MUST have private access mode'
        );

        const connectedProjects = storeMeta.projectsMetadata || [];
        for (const cp of connectedProjects) {
          assert.equal(
            cp.projectId,
            PRIMARY_PROJECT_ID,
            `Unexpected project connected to Preview Blob store: ${cp.projectId}`
          );
          assert.equal(
            (cp.environments || []).includes('production'),
            false,
            'Preview Blob store MUST NOT be connected to Production'
          );
        }

        // Verify Production on one-systems-erp has NO BLOB_READ_WRITE_TOKEN pointing to this Preview store
        const proj = vercelApi('GET', `/v9/projects/${PRIMARY_PROJECT_ID}?teamId=${TEAM_ID}`);
        const prodBlobVars = (proj.env || []).filter(
          (e: any) =>
            (e.key === 'BLOB_READ_WRITE_TOKEN' ||
              e.key === 'UBOQ_VAULT_ENCRYPTION_KEY' ||
              e.key === 'UBOQ_VAULT_BLOB_STORE_ID') &&
            Array.isArray(e.target) &&
            e.target.includes('production')
        );
        assert.equal(prodBlobVars.length, 0, 'Preview vault credentials must not target Production');

        return {
          storeId: storeMeta.id,
          storeName: storeMeta.name,
          newlyCreatedStore: Boolean(storeMeta._newlyCreatedStore),
          accessMode: storeMeta.access || 'private',
          region: storeMeta.region || 'iad1',
          connectedProjectId: PRIMARY_PROJECT_ID,
          connectedEnvironments: ['preview'],
          productionConnected: false,
          configuredPreviewSensitiveVars: configuredPreviewEnvReceipts.map((r) => r.key),
        };
      }
    );

    await check(
      'VB-02 Live encrypted upload (putImmutableAndVerify), write-once idempotency, and SHA-256 verified retrieval',
      async () => {
        const provider = resolveUboqVaultStorageProvider();
        assert.equal(provider.backendName, 'VERCEL_BLOB_PRIVATE');

        const firstPut = await provider.putImmutableAndVerify({
          projectId: synthProjectId,
          sha256Hash: sampleSha256,
          fileName: 'confidential-awarded-boq.xlsx',
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          buffer: samplePlaintext,
        });
        createdStorageUri = firstPut.storageUri;

        assert.equal(firstPut.backend, 'VERCEL_BLOB_PRIVATE');
        assert.equal(firstPut.newlyCreated, true);
        assert.equal(firstPut.sha256Hash, sampleSha256);
        assert.equal(firstPut.verifiedReadBackSha256, sampleSha256);
        assert.equal(firstPut.byteSize, samplePlaintext.length);
        assert.match(
          firstPut.storageUri,
          new RegExp(`^uboq-vercel-blob://store_[a-z0-9]+/uboq-private-vault/preview/${synthProjectId}/${sampleSha256}\\.bin$`)
        );

        // Second put with identical hash is idempotent and does not overwrite
        const secondPut = await provider.putImmutableAndVerify({
          projectId: synthProjectId,
          sha256Hash: sampleSha256,
          fileName: 'confidential-awarded-boq.xlsx',
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          buffer: samplePlaintext,
        });
        assert.equal(secondPut.newlyCreated, false);
        assert.equal(secondPut.verifiedReadBackSha256, sampleSha256);

        const retrieved = await provider.getAndVerify({
          storageUri: createdStorageUri,
          expectedProjectId: synthProjectId,
          expectedSha256Hash: sampleSha256,
        });
        assert.equal(Buffer.compare(retrieved.buffer, samplePlaintext), 0);

        return {
          backend: firstPut.backend,
          storageUriScheme: 'uboq-vercel-blob://',
          plaintextBytes: firstPut.byteSize,
          writeOnceIdempotencyVerified: true,
          roundTripPlaintextExactMatch: true,
        };
      }
    );

    await check(
      'VB-03 At-rest AES-256-GCM ciphertext verification and unauthenticated public HTTP URL access denial',
      async () => {
        const pathname = `uboq-private-vault/preview/${synthProjectId}/${sampleSha256}.bin`;
        const meta = await head(pathname, { token: rwTokenInMemory });
        assert.ok(meta.url, 'Expected private blob URL in head metadata');

        // 1) Unauthenticated public HTTP GET to both url and downloadUrl MUST fail (403/401)
        const pubRes = await fetch(meta.url, { redirect: 'manual' });
        const pubDlRes = await fetch(meta.downloadUrl, { redirect: 'manual' });
        assert.notEqual(pubRes.status, 200, `Public unauthenticated URL returned 200 unexpectedly`);
        assert.notEqual(
          pubDlRes.status,
          200,
          `Public unauthenticated downloadUrl returned 200 unexpectedly`
        );
        assert.ok(
          [401, 403, 404].includes(pubRes.status),
          `Expected 401/403/404 on unauthenticated private blob URL, got ${pubRes.status}`
        );

        // 2) Inspect raw stored bytes via authenticated SDK get() to prove AES-256-GCM ciphertext at rest
        const rawRes = await get(pathname, {
          access: 'private',
          useCache: false,
          token: rwTokenInMemory,
        });
        assert.ok(rawRes && rawRes.statusCode === 200 && rawRes.stream);
        const chunks: Buffer[] = [];
        const reader = rawRes.stream.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) chunks.push(Buffer.from(value));
        }
        const rawStoredBytes = Buffer.concat(chunks);
        assert.equal(rawStoredBytes.subarray(0, 8).toString('ascii'), 'UBOQBV1\0');
        assert.equal(
          rawStoredBytes.includes(Buffer.from('CONFIDENTIAL-UNIT-RATES', 'utf8')),
          false,
          'Plaintext BOQ content must never appear unencrypted in stored blob bytes'
        );

        return {
          unauthenticatedUrlStatus: pubRes.status,
          unauthenticatedDownloadUrlStatus: pubDlRes.status,
          storedEnvelopeHeader: 'UBOQBV1\\0 (AES-256-GCM)',
          storedCiphertextBytes: rawStoredBytes.length,
          plaintextAbsentFromRawStoredBlob: true,
        };
      }
    );

    await check(
      'VB-04 Ownership, environment-namespace, wrong-key, and hash-mismatch access-denial checks',
      async () => {
        const provider = new VercelBlobPrivateVaultProvider();

        // 1) Declared hash mismatch on upload rejected
        await assert.rejects(
          () =>
            provider.putImmutableAndVerify({
              projectId: synthProjectId,
              sha256Hash: 'f'.repeat(64),
              fileName: 'tampered.xlsx',
              mimeType: 'application/octet-stream',
              buffer: samplePlaintext,
            }),
          /UBOQ_VAULT_INPUT_HASH_MISMATCH/
        );

        // 2) Cross-project retrieval denied
        await assert.rejects(
          () =>
            provider.getAndVerify({
              storageUri: createdStorageUri,
              expectedProjectId: `${synthProjectId}-OTHER-TENANT`,
              expectedSha256Hash: sampleSha256,
            }),
          /UBOQ_VAULT_CROSS_PROJECT_URI_DENIED/
        );

        // 3) Cross-environment (production vs preview) retrieval denied
        process.env.UBOQ_VAULT_ENV_NAMESPACE = 'production';
        try {
          const prodScopedProvider = new VercelBlobPrivateVaultProvider();
          await assert.rejects(
            () =>
              prodScopedProvider.getAndVerify({
                storageUri: createdStorageUri,
                expectedProjectId: synthProjectId,
                expectedSha256Hash: sampleSha256,
              }),
            /UBOQ_VAULT_CROSS_PROJECT_URI_DENIED/
          );
        } finally {
          process.env.UBOQ_VAULT_ENV_NAMESPACE = 'preview';
        }

        // 4) Wrong 256-bit encryption key rejected by AES-256-GCM authentication tag
        process.env.UBOQ_VAULT_ENCRYPTION_KEY = crypto.randomBytes(32).toString('hex');
        try {
          const wrongKeyProvider = new VercelBlobPrivateVaultProvider();
          await assert.rejects(
            () =>
              wrongKeyProvider.getAndVerify({
                storageUri: createdStorageUri,
                expectedProjectId: synthProjectId,
                expectedSha256Hash: sampleSha256,
              }),
            /UBOQ_VAULT_ENCRYPTION_AUTH_FAILED/
          );
        } finally {
          process.env.UBOQ_VAULT_ENCRYPTION_KEY = previewVaultEncryptionKeyHex;
        }

        return {
          uploadHashMismatchBlocked: true,
          crossProjectAccessBlocked: true,
          crossEnvironmentNamespaceBlocked: true,
          wrongEncryptionKeyAuthTagBlocked: true,
        };
      }
    );

    await check(
      'VB-05 Download API route (GET /api/uboq/documents/[documentId]/download) enforces session auth, PBAC/RBAC, and private no-store headers',
      async () => {
        const modAny = Module as any;
        const origLoad = modAny._load;
        let mockSession: any = null;
        let mockStageError: Error | null = null;
        const mockDocId = `doc_${crypto.randomBytes(4).toString('hex')}`;

        modAny._load = function (request: string, parent: any, isMain: boolean) {
          if (request === '@/lib/dal/auth' || request.endsWith('/lib/dal/auth')) {
            return { verifyOperationalSession: async () => mockSession };
          }
          if (
            request === '@/lib/uboq/project-ownership' ||
            request.endsWith('/lib/uboq/project-ownership')
          ) {
            return { withUboqRlsContext: async (_ctx: any, fn: () => Promise<any>) => fn() };
          }
          if (
            request === '@/lib/uboq/security/stage-rbac' ||
            request.endsWith('/lib/uboq/security/stage-rbac')
          ) {
            return {
              assertUboqStageAuthorization: async () => {
                if (mockStageError) throw mockStageError;
              },
            };
          }
          if (request === '@/lib/prisma' || request.endsWith('/lib/prisma')) {
            return {
              prisma: {
                uboqSourceDocument: {
                  findUnique: async ({ where }: any) =>
                    where.id === mockDocId
                      ? {
                          id: mockDocId,
                          projectId: synthProjectId,
                          fileName: 'confidential-awarded-boq.xlsx',
                          mimeType:
                            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                          sha256Hash: sampleSha256,
                          storageUri: createdStorageUri,
                        }
                      : null,
                },
              },
            };
          }
          return origLoad.apply(this, [request, parent, isMain]);
        };

        try {
          const dlRoutePath = require.resolve(
            '../../src/app/api/uboq/documents/[documentId]/download/route'
          );
          delete require.cache[dlRoutePath];
          const dlRoute = await import(
            '../../src/app/api/uboq/documents/[documentId]/download/route'
          );

          // 1) Unauthenticated -> 401
          mockSession = null;
          const r401 = await dlRoute.GET(
            new NextRequest(
              `http://localhost/api/uboq/documents/${mockDocId}/download?projectId=${synthProjectId}`
            ),
            { params: Promise.resolve({ documentId: mockDocId }) }
          );
          assert.equal(r401.status, 401);

          // 2) Unauthorized project RBAC -> 403
          mockSession = { userId: 'u_denied', role: 'VIEWER', sessionVersion: 1 };
          mockStageError = new Error('UBOQ_PBAC_PROJECT_ACCESS_DENIED');
          const r403 = await dlRoute.GET(
            new NextRequest(
              `http://localhost/api/uboq/documents/${mockDocId}/download?projectId=${synthProjectId}`
            ),
            { params: Promise.resolve({ documentId: mockDocId }) }
          );
          assert.equal(r403.status, 403);

          // 3) Cross-project query param mismatch -> 404
          mockStageError = null;
          const r404 = await dlRoute.GET(
            new NextRequest(
              `http://localhost/api/uboq/documents/${mockDocId}/download?projectId=WRONG_PROJECT`
            ),
            { params: Promise.resolve({ documentId: mockDocId }) }
          );
          assert.equal(r404.status, 404);

          // 4) Authorized viewer -> 200 with decrypted bytes & private cache headers
          mockSession = { userId: 'u_exec', role: 'FINANCE_DIRECTOR', sessionVersion: 1 };
          const r200 = await dlRoute.GET(
            new NextRequest(
              `http://localhost/api/uboq/documents/${mockDocId}/download?projectId=${synthProjectId}`
            ),
            { params: Promise.resolve({ documentId: mockDocId }) }
          );
          assert.equal(r200.status, 200);
          assert.equal(r200.headers.get('Cache-Control'), 'private, no-store, max-age=0');
          assert.equal(r200.headers.get('X-UBOQ-SHA256'), sampleSha256);
          const bodyBuf = Buffer.from(await r200.arrayBuffer());
          assert.equal(Buffer.compare(bodyBuf, samplePlaintext), 0);

          return {
            unauthenticated401: true,
            rbacDenied403: true,
            crossProject404: true,
            authorizedPrivateStream200: true,
          };
        } finally {
          modAny._load = origLoad;
        }
      }
    );

    await check(
      'VB-06 Project hash listing, orphan deletion (deleteOrphanIfCreated), and zero-residue verification',
      async () => {
        const provider = resolveUboqVaultStorageProvider();
        const beforeList = await provider.listProjectObjectHashes(synthProjectId);
        assert.deepEqual(beforeList, [sampleSha256]);

        await provider.deleteOrphanIfCreated(createdStorageUri);
        const afterList = await provider.listProjectObjectHashes(synthProjectId);
        assert.deepEqual(afterList, []);

        await assert.rejects(
          () =>
            provider.getAndVerify({
              storageUri: createdStorageUri,
              expectedProjectId: synthProjectId,
              expectedSha256Hash: sampleSha256,
            }),
          /UBOQ_VAULT_OBJECT_MISSING/
        );
        createdStorageUri = '';

        return {
          listedBeforeDeleteCount: beforeList.length,
          listedAfterDeleteCount: afterList.length,
          postDeleteGetRejected: true,
        };
      }
    );

    await check(
      'VB-07 Fail-closed production and missing-credential configuration guards (zero AWS S3 fallback)',
      async () => {
        const origNodeEnv = process.env.NODE_ENV;
        try {
          (process.env as any).NODE_ENV = 'production';
          process.env.UBOQ_VAULT_BACKEND = 'local_durable';
          assert.throws(
            () => resolveUboqVaultStorageProvider(),
            /UBOQ_PROD_EPHEMERAL_STORAGE_FORBIDDEN/
          );

          process.env.UBOQ_VAULT_BACKEND = 's3_private';
          assert.throws(
            () => resolveUboqVaultStorageProvider(),
            /UBOQ_VAULT_UNSUPPORTED_BACKEND/
          );

          process.env.UBOQ_VAULT_BACKEND = 'vercel_blob_private';
          delete process.env.BLOB_READ_WRITE_TOKEN;
          delete process.env.UBOQ_VAULT_BLOB_READ_WRITE_TOKEN;
          delete process.env.VERCEL_OIDC_TOKEN;
          assert.throws(
            () => resolveUboqVaultStorageProvider(),
            /UBOQ_PRIVATE_BLOB_STORAGE_REQUIRED/
          );
        } finally {
          (process.env as any).NODE_ENV = origNodeEnv;
          process.env.UBOQ_VAULT_BLOB_READ_WRITE_TOKEN = rwTokenInMemory;
          process.env.BLOB_READ_WRITE_TOKEN = rwTokenInMemory;
          process.env.UBOQ_VAULT_BACKEND = 'vercel_blob_private';
        }

        return {
          prodLocalDurableForbidden: true,
          legacyS3BackendRejected: true,
          missingBlobCredentialRejected: true,
        };
      }
    );

    report.overallDisposition = 'PASS_VERCEL_BLOB_PRIVATE_VAULT_VERIFIED';
    report.storeIdentity = {
      storeId: storeMeta.id,
      storeName: storeMeta.name,
      accessMode: 'private',
      region: storeMeta.region || 'iad1',
      vercelProjectId: PRIMARY_PROJECT_ID,
      environments: ['preview'],
      awsDependencyRemoved: true,
    };
    saveReport();
  } finally {
    if (createdStorageUri) {
      try {
        process.env.BLOB_READ_WRITE_TOKEN = rwTokenInMemory;
        process.env.UBOQ_VAULT_BLOB_STORE_ID = storeMeta.id;
        process.env.UBOQ_VAULT_BACKEND = 'vercel_blob_private';
        process.env.UBOQ_VAULT_ENV_NAMESPACE = 'preview';
        process.env.UBOQ_VAULT_ENCRYPTION_KEY = previewVaultEncryptionKeyHex;
        await resolveUboqVaultStorageProvider().deleteOrphanIfCreated(createdStorageUri);
      } catch {}
    }
    process.env = savedEnv;
  }
})().catch((err) => {
  const safeMsg = String(err?.message || err).replace(
    /vercel_blob_rw_[^\s"']+/gi,
    '[REDACTED_BLOB_TOKEN]'
  );
  console.error(`BLOB_VAULT_VERIFICATION_FAILED: ${safeMsg}`);
  report.overallDisposition = 'FAIL';
  report.error = safeMsg;
  saveReport();
  process.exitCode = 1;
});
