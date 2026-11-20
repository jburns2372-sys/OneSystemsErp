import fs from 'node:fs';
import path from 'node:path';
import { Worker } from 'node:worker_threads';
import sharp from 'sharp';

export interface OcrRecognizedCell {
  readonly text: string;
  readonly confidence: number; // 0..1
  readonly bbox: { readonly x0: number; readonly y0: number; readonly x1: number; readonly y1: number };
}

export interface OcrRecognizedPageGrid {
  readonly pageNumber: number;
  readonly width: number;
  readonly height: number;
  readonly overallConfidence: number; // 0..1
  readonly rows: ReadonlyArray<{
    readonly rowNumber: number;
    readonly rowConfidence: number; // 0..1
    readonly cells: ReadonlyArray<OcrRecognizedCell>;
  }>;
}

function firstExistingFile(candidates: string[]): string | null {
  for (const p of candidates) {
    try {
      if (fs.existsSync(p) && fs.statSync(p).isFile()) return p;
    } catch {
      /* continue */
    }
  }
  return null;
}

/**
 * Candidate node_modules roots. Vercel lays a function out relative to its project/repo root, so the OCR assets can
 * live under `<root>/node_modules` or `<root>/apps/aws-backend/node_modules` depending on how includeFiles was
 * applied. Walk the ancestors of both cwd and this module's directory so any layout resolves, never a fixed depth.
 */
export function nodeModulesRoots(starts: string[] = [process.cwd(), __dirname]): string[] {
  const roots: string[] = [];
  const add = (p: string) => {
    if (!roots.includes(p)) roots.push(p);
  };
  for (const start of starts) {
    let dir = path.resolve(start);
    for (let depth = 0; depth < 10; depth++) {
      add(path.join(dir, 'node_modules'));
      add(path.join(dir, 'apps', 'aws-backend', 'node_modules'));
      const parent = path.dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
  }
  return roots;
}

/** Server-side-only layout diagnostic summary (NEVER returned in HTTP error responses). */
export function describeOcrAssetEnvironment(roots: string[] = nodeModulesRoots()): string {
  const safeList = (dir: string) => {
    try {
      return fs.readdirSync(dir).slice(0, 25);
    } catch {
      return [];
    }
  };
  const present = roots
    .filter((r) => fs.existsSync(r))
    .slice(0, 6)
    .map((r) => ({
      root: r,
      tesseractJs: fs.existsSync(path.join(r, 'tesseract.js')),
      tesseractData: fs.existsSync(path.join(r, '@tesseract.js-data')),
    }));
  return JSON.stringify({
    cwd: process.cwd(),
    moduleDir: __dirname,
    triedRoots: roots.length,
    existingRoots: present,
    cwdEntries: safeList(process.cwd()),
  });
}

export function resolveOfflineTesseractLangPath(roots: string[] = nodeModulesRoots()): string {
  // Pure filesystem lookup across ancestor node_modules roots (zero require/require.resolve calls in this
  // shared module so Next.js Turbopack never attempts to statically parse binary .gz or deep subpaths).
  // Serverless bundling is handled separately by next.config.ts outputFileTracingIncludes (Next.js)
  // and apps/aws-backend/src/lib/uboq/ocrAssetTracing.ts + vercel.json includeFiles (Express).
  for (const root of roots) {
    for (const variant of ['4.0.0_best_int', '4.0.0']) {
      const dir = path.join(root, '@tesseract.js-data', 'eng', variant);
      if (fs.existsSync(path.join(dir, 'eng.traineddata.gz'))) return dir;
    }
  }
  console.error('[UBOQ_OCR_TRAINEDDATA_MISSING]', describeOcrAssetEnvironment(roots));
  throw new Error('UBOQ_OCR_TRAINEDDATA_MISSING: Offline @tesseract.js-data/eng traineddata not found');
}

/**
 * P9-DEF-OCR-01: resolve the tesseract.js node worker script via filesystem lookup across ancestor roots
 * (zero static require.resolve calls in this shared module; Express tracing lives in ocrAssetTracing.ts).
 */
export function resolveTesseractWorkerScript(roots: string[] = nodeModulesRoots()): string {
  const found = firstExistingFile(
    roots.map((root) => path.join(root, 'tesseract.js', 'src', 'worker-script', 'node', 'index.js'))
  );
  if (!found) {
    console.error('[UBOQ_OCR_WORKER_SCRIPT_MISSING]', describeOcrAssetEnvironment(roots));
    throw new Error('UBOQ_OCR_WORKER_SCRIPT_MISSING: tesseract.js node worker script not found in deployed bundle');
  }
  return found;
}

export const UBOQ_OCR_INIT_TIMEOUT_MS = 15_000;
export const UBOQ_OCR_RECOGNIZE_TIMEOUT_MS = 25_000;
export const UBOQ_OCR_TOTAL_BUDGET_MS = 40_000;
export const UBOQ_OCR_CLEANUP_TIMEOUT_MS = 3_000;

export type OcrTraceStage =
  | 'request_received'
  | 'image_preprocessing_completed'
  | 'traineddata_verified'
  | 'worker_script_verified'
  | 'create_worker_started'
  | 'create_worker_completed'
  | 'create_worker_failed'
  | 'recognize_started'
  | 'recognize_completed'
  | 'recognize_failed'
  | 'worker_cleanup_completed';

export interface OcrStageTraceEvent {
  readonly stage: OcrTraceStage;
  readonly pageNumber: number;
  readonly elapsedMs: number;
  readonly stageMs: number;
  readonly ok: boolean;
  readonly errorCode?: string;
}

/**
 * Emits safe structured server-side OCR stage timings (NEVER credentials, paths, listings, or raw OCR evidence).
 */
export function emitOcrStageTrace(event: OcrStageTraceEvent): void {
  const payload = JSON.stringify({
    stage: event.stage,
    pageNumber: event.pageNumber,
    elapsedMs: event.elapsedMs,
    stageMs: event.stageMs,
    ok: event.ok,
    ...(event.errorCode ? { errorCode: event.errorCode } : {}),
  });
  if (event.ok) {
    console.info('[UBOQ_OCR_TRACE]', payload);
  } else {
    console.error('[UBOQ_OCR_TRACE]', payload);
  }
}

class OcrTimeoutError extends Error {
  constructor(stage: string, ms: number) {
    super(`UBOQ_OCR_TIMEOUT: OCR stage=${stage} exceeded ${ms}ms and the worker was terminated`);
    this.name = 'OcrTimeoutError';
  }
}

class OcrWorkerExecutionError extends Error {
  constructor(stage: string) {
    super(`UBOQ_OCR_WORKER_FAILED: OCR stage=${stage} failed`);
    this.name = 'OcrWorkerExecutionError';
  }
}

/**
 * Bounded execution that does NOT rely on Promise.race alone: on timeout the supplied onTimeout hook
 * terminates the underlying worker thread so it cannot keep running after the request has failed.
 */
export function runWithBoundedTimeout<T>(
  work: Promise<T>,
  stage: string,
  ms: number,
  onTimeout: () => void
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      try {
        onTimeout();
      } catch {
        /* termination best-effort */
      }
      reject(new OcrTimeoutError(stage, ms));
    }, ms);
    work.then(
      (v) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(e);
      }
    );
  });
}

interface TesseractWordLike {
  text?: string;
  confidence?: number;
  bbox?: { x0: number; y0: number; x1: number; y1: number };
}

interface TesseractLineLike {
  text?: string;
  confidence?: number;
  bbox?: { x0: number; y0: number; x1: number; y1: number };
  words?: TesseractWordLike[];
}

function extractLinesFromTesseractResult(data: Record<string, unknown>): TesseractLineLike[] {
  const directLines = (data as { lines?: TesseractLineLike[] }).lines;
  if (Array.isArray(directLines) && directLines.length > 0) {
    return directLines;
  }
  const out: TesseractLineLike[] = [];
  const blocks = (data as { blocks?: Array<{ paragraphs?: Array<{ lines?: TesseractLineLike[] }> }> }).blocks;
  if (Array.isArray(blocks)) {
    for (const blk of blocks) {
      for (const para of blk.paragraphs ?? []) {
        for (const ln of para.lines ?? []) {
          out.push(ln);
        }
      }
    }
  }
  return out;
}

function splitWordsIntoCells(words: TesseractWordLike[], fallbackLineText: string, lineBbox: { x0: number; y0: number; x1: number; y1: number }, lineConf: number): OcrRecognizedCell[] {
  const cleanWords = words.filter((w) => String(w.text ?? '').trim() !== '');
  if (cleanWords.length === 0) {
    return fallbackLineText
      .split(/\||\t|\s{3,}/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => ({
        text: s,
        confidence: lineConf,
        bbox: lineBbox,
      }));
  }

  // Group words into table cells using explicit pipe '|' delimiters OR horizontal X-coordinate column gaps (> 32px)
  const cells: OcrRecognizedCell[] = [];
  let bucket: TesseractWordLike[] = [];

  const flushBucket = () => {
    if (bucket.length === 0) return;
    const text = bucket
      .map((w) => String(w.text ?? '').trim())
      .filter((t) => t !== '|')
      .join(' ')
      .trim();
    if (text) {
      const confs = bucket.map((w) => Math.max(0, Math.min(1, Number(w.confidence ?? lineConf * 100) / 100)));
      const avgConf = confs.reduce((a, b) => a + b, 0) / confs.length;
      const minConf = Math.min(...confs);
      const cellConf = Number(((avgConf * 0.6 + minConf * 0.4)).toFixed(4));
      cells.push({
        text,
        confidence: cellConf,
        bbox: {
          x0: Math.min(...bucket.map((w) => w.bbox?.x0 ?? lineBbox.x0)),
          y0: Math.min(...bucket.map((w) => w.bbox?.y0 ?? lineBbox.y0)),
          x1: Math.max(...bucket.map((w) => w.bbox?.x1 ?? lineBbox.x1)),
          y1: Math.max(...bucket.map((w) => w.bbox?.y1 ?? lineBbox.y1)),
        },
      });
    }
    bucket = [];
  };

  for (let i = 0; i < cleanWords.length; i++) {
    const w = cleanWords[i];
    const token = String(w.text ?? '').trim();
    if (token === '|' || token === '¦') {
      flushBucket();
      continue;
    }
    if (token.includes('|')) {
      const parts = token.split('|');
      parts.forEach((part, idx) => {
        if (part.trim()) {
          bucket.push({ ...w, text: part.trim() });
        }
        if (idx < parts.length - 1) {
          flushBucket();
        }
      });
      continue;
    }

    if (bucket.length > 0) {
      const prev = bucket[bucket.length - 1];
      const prevRight = prev.bbox?.x1 ?? 0;
      const currLeft = w.bbox?.x0 ?? prevRight;
      const wordHeight = Math.max(12, (w.bbox?.y1 ?? 20) - (w.bbox?.y0 ?? 0));
      const gapThreshold = Math.max(34, wordHeight * 1.65);
      if (currLeft - prevRight >= gapThreshold) {
        flushBucket();
      }
    }
    bucket.push(w);
  }
  flushBucket();

  return cells;
}

interface TesseractWorkerPacket {
  workerId?: string;
  jobId?: string;
  status?: 'resolve' | 'reject' | 'progress';
  action?: string;
  data?: unknown;
}

/**
 * Spawns tesseract.js's node worker script directly on node:worker_threads so we always hold the live
 * Worker handle for true OS/V8 thread termination (even during init), attach real EventEmitter 'error'/'exit'
 * listeners (avoiding tesseract.js's browser-only worker.onerror no-op and swallowed .catch(() => {})),
 * and enforce a strict end-to-end budget below the serverless function maxDuration.
 */
export async function executeBoundedTesseractWorker(params: {
  workerPath: string;
  langPath: string;
  normalizedPng: Buffer;
  pageNumber: number;
  startedAt: number;
  initTimeoutMs?: number;
  recognizeTimeoutMs?: number;
  totalBudgetMs?: number;
}): Promise<Record<string, unknown>> {
  const {
    workerPath,
    langPath,
    normalizedPng,
    pageNumber,
    startedAt,
    initTimeoutMs = UBOQ_OCR_INIT_TIMEOUT_MS,
    recognizeTimeoutMs = UBOQ_OCR_RECOGNIZE_TIMEOUT_MS,
    totalBudgetMs = UBOQ_OCR_TOTAL_BUDGET_MS,
  } = params;

  const remainingBudget = (stage: string): number => {
    const rem = totalBudgetMs - (Date.now() - startedAt);
    if (rem <= 0) {
      throw new OcrTimeoutError(stage, totalBudgetMs);
    }
    return rem;
  };

  let rawWorker: Worker | null = null;
  let terminated = false;
  let workerFailure: Error | null = null;
  const pendingJobs = new Map<string, { resolve: (data: unknown) => void; reject: (err: Error) => void }>();

  const rejectAllPending = (err: Error) => {
    if (!workerFailure) workerFailure = err;
    for (const [, p] of pendingJobs) {
      p.reject(err);
    }
    pendingJobs.clear();
  };

  const terminateWorker = async (): Promise<void> => {
    if (terminated) return;
    terminated = true;
    const cleanupStart = Date.now();
    const w = rawWorker;
    rawWorker = null;
    if (w) {
      try {
        await Promise.race([
          w.terminate().then(() => undefined),
          new Promise<void>((resolve) => setTimeout(resolve, UBOQ_OCR_CLEANUP_TIMEOUT_MS)),
        ]);
      } catch {
        /* best-effort worker termination */
      }
    }
    emitOcrStageTrace({
      stage: 'worker_cleanup_completed',
      pageNumber,
      elapsedMs: Date.now() - startedAt,
      stageMs: Date.now() - cleanupStart,
      ok: true,
    });
  };

  let jobSeq = 0;
  const workerId = `ubOqOcrWorker-${pageNumber}`;

  const dispatchWorkerJob = (action: string, payload: Record<string, unknown>, stageName: string, stageCapMs: number): Promise<unknown> => {
    if (workerFailure) return Promise.reject(workerFailure);
    if (!rawWorker) return Promise.reject(new OcrWorkerExecutionError(stageName));
    const budgetMs = Math.max(1, Math.min(stageCapMs, remainingBudget(stageName)));
    const jobId = `job-${++jobSeq}`;
    const promiseKey = `${action}-${jobId}`;

    const jobPromise = new Promise<unknown>((resolve, reject) => {
      pendingJobs.set(promiseKey, { resolve, reject });
      try {
        rawWorker!.postMessage({ workerId, jobId, action, payload });
      } catch (err) {
        pendingJobs.delete(promiseKey);
        console.error('[UBOQ_OCR_WORKER_POST_ERROR]', stageName, err instanceof Error ? err.message : String(err));
        reject(new OcrWorkerExecutionError(stageName));
      }
    });

    return runWithBoundedTimeout(jobPromise, stageName, budgetMs, () => {
      pendingJobs.delete(promiseKey);
      void terminateWorker();
    });
  };

  const createStart = Date.now();
  emitOcrStageTrace({
    stage: 'create_worker_started',
    pageNumber,
    elapsedMs: createStart - startedAt,
    stageMs: 0,
    ok: true,
  });

  try {
    rawWorker = new Worker(workerPath);
    rawWorker.on('message', (packet: TesseractWorkerPacket) => {
      if (!packet || typeof packet !== 'object') return;
      const key = `${packet.action ?? ''}-${packet.jobId ?? ''}`;
      const entry = pendingJobs.get(key);
      if (packet.status === 'resolve' && entry) {
        pendingJobs.delete(key);
        entry.resolve(packet.data);
      } else if (packet.status === 'reject' && entry) {
        pendingJobs.delete(key);
        console.error('[UBOQ_OCR_WORKER_JOB_REJECTED]', packet.action ?? 'unknown', String(packet.data ?? ''));
        entry.reject(new OcrWorkerExecutionError(String(packet.action ?? 'worker_job')));
      }
    });
    rawWorker.on('error', (err) => {
      console.error('[UBOQ_OCR_WORKER_THREAD_ERROR]', err instanceof Error ? err.message : String(err));
      rejectAllPending(new OcrWorkerExecutionError('worker_thread_error'));
    });
    rawWorker.on('exit', (code) => {
      if (!terminated && code !== 0) {
        console.error('[UBOQ_OCR_WORKER_THREAD_EXIT]', `exitCode=${code}`);
        rejectAllPending(new OcrWorkerExecutionError('worker_thread_exit'));
      }
    });

    const initDeadline = createStart + initTimeoutMs;
    const initRemaining = (subStage: string) => Math.max(1, Math.min(initDeadline - Date.now(), remainingBudget(subStage)));

    await dispatchWorkerJob(
      'load',
      { options: { lstmOnly: true, corePath: undefined, logging: false } },
      'create_worker_load',
      initRemaining('create_worker_load')
    );
    await dispatchWorkerJob(
      'loadLanguage',
      {
        langs: 'eng',
        options: {
          langPath,
          dataPath: undefined,
          cachePath: undefined,
          cacheMethod: 'none',
          gzip: true,
          lstmOnly: true,
        },
      },
      'create_worker_load_language',
      initRemaining('create_worker_load_language')
    );
    await dispatchWorkerJob(
      'initialize',
      { langs: 'eng', oem: 1, config: {} },
      'create_worker_initialize',
      initRemaining('create_worker_initialize')
    );

    emitOcrStageTrace({
      stage: 'create_worker_completed',
      pageNumber,
      elapsedMs: Date.now() - startedAt,
      stageMs: Date.now() - createStart,
      ok: true,
    });
  } catch (err) {
    emitOcrStageTrace({
      stage: 'create_worker_failed',
      pageNumber,
      elapsedMs: Date.now() - startedAt,
      stageMs: Date.now() - createStart,
      ok: false,
      errorCode: err instanceof Error ? err.name : 'Error',
    });
    await terminateWorker();
    throw err;
  }

  const recognizeStart = Date.now();
  emitOcrStageTrace({
    stage: 'recognize_started',
    pageNumber,
    elapsedMs: recognizeStart - startedAt,
    stageMs: 0,
    ok: true,
  });

  try {
    const data = await dispatchWorkerJob(
      'recognize',
      {
        image: new Uint8Array(normalizedPng),
        options: {},
        output: { blocks: true, text: true },
      },
      'recognize',
      recognizeTimeoutMs
    );
    emitOcrStageTrace({
      stage: 'recognize_completed',
      pageNumber,
      elapsedMs: Date.now() - startedAt,
      stageMs: Date.now() - recognizeStart,
      ok: true,
    });
    return (data && typeof data === 'object' ? data : {}) as Record<string, unknown>;
  } catch (err) {
    emitOcrStageTrace({
      stage: 'recognize_failed',
      pageNumber,
      elapsedMs: Date.now() - startedAt,
      stageMs: Date.now() - recognizeStart,
      ok: false,
      errorCode: err instanceof Error ? err.name : 'Error',
    });
    throw err;
  } finally {
    await terminateWorker();
  }
}

/**
 * Executes genuine pixel-level Tesseract OCR on PNG/JPEG/raw RGBA page bitmaps using offline traineddata.
 * Preserves page dimensions, word/cell bounding boxes, and true OCR confidence scores.
 */
export async function runRasterImageOcr(
  imageBufferOrRaw: Buffer | { rawRgba: Uint8Array; width: number; height: number },
  pageNumber = 1
): Promise<OcrRecognizedPageGrid> {
  const startedAt = Date.now();
  emitOcrStageTrace({
    stage: 'request_received',
    pageNumber,
    elapsedMs: 0,
    stageMs: 0,
    ok: true,
  });

  let normalizedPng: Buffer;
  let width = 0;
  let height = 0;
  const preprocessStart = Date.now();

  if (Buffer.isBuffer(imageBufferOrRaw)) {
    const meta = await sharp(imageBufferOrRaw).metadata();
    width = meta.width ?? 0;
    height = meta.height ?? 0;
    normalizedPng = await sharp(imageBufferOrRaw)
      .grayscale()
      .png()
      .toBuffer();
  } else {
    width = imageBufferOrRaw.width;
    height = imageBufferOrRaw.height;
    normalizedPng = await sharp(Buffer.from(imageBufferOrRaw.rawRgba), {
      raw: { width, height, channels: 4 },
    })
      .grayscale()
      .png()
      .toBuffer();
  }

  emitOcrStageTrace({
    stage: 'image_preprocessing_completed',
    pageNumber,
    elapsedMs: Date.now() - startedAt,
    stageMs: Date.now() - preprocessStart,
    ok: true,
  });

  const langStart = Date.now();
  const langPath = resolveOfflineTesseractLangPath();
  emitOcrStageTrace({
    stage: 'traineddata_verified',
    pageNumber,
    elapsedMs: Date.now() - startedAt,
    stageMs: Date.now() - langStart,
    ok: true,
  });

  const workerScriptStart = Date.now();
  const workerPath = resolveTesseractWorkerScript();
  emitOcrStageTrace({
    stage: 'worker_script_verified',
    pageNumber,
    elapsedMs: Date.now() - startedAt,
    stageMs: Date.now() - workerScriptStart,
    ok: true,
  });

  const data = await executeBoundedTesseractWorker({
    workerPath,
    langPath,
    normalizedPng,
    pageNumber,
    startedAt,
  });

  const overallConfidence = Number(
    Math.max(0, Math.min(1, Number((data as { confidence?: number }).confidence ?? 0) / 100)).toFixed(4)
  );

  const rawLines = extractLinesFromTesseractResult(data);
  const rows: Array<{
    readonly rowNumber: number;
    readonly rowConfidence: number;
    readonly cells: ReadonlyArray<OcrRecognizedCell>;
  }> = [];

  if (rawLines.length > 0) {
    rawLines.forEach((ln) => {
      const lineText = String(ln.text ?? '').trim();
      if (!lineText) return;
      const lineConf = Number(Math.max(0, Math.min(1, Number(ln.confidence ?? overallConfidence * 100) / 100)).toFixed(4));
      const lineBbox = ln.bbox ?? { x0: 0, y0: 0, x1: width, y1: height };
      const cells = splitWordsIntoCells(ln.words ?? [], lineText, lineBbox, lineConf);
      if (cells.length === 0) return;
      const minCellConf = Math.min(...cells.map((c) => c.confidence));
      const rowConf = Number(Math.min(lineConf, minCellConf).toFixed(4));
      rows.push({
        rowNumber: rows.length + 1,
        rowConfidence: rowConf,
        cells,
      });
    });
  } else {
    const plainText = String((data as { text?: string }).text ?? '');
    plainText
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((lineText) => {
        const cells = splitWordsIntoCells([], lineText, { x0: 0, y0: 0, x1: width, y1: height }, overallConfidence);
        if (cells.length > 0) {
          rows.push({
            rowNumber: rows.length + 1,
            rowConfidence: overallConfidence,
            cells,
          });
        }
      });
  }

  return {
    pageNumber,
    width,
    height,
    overallConfidence,
    rows,
  };
}
