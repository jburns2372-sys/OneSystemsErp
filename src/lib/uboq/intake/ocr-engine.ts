import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import Tesseract from 'tesseract.js';

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

function resolveOfflineTesseractLangPath(): string {
  const candidates = [
    path.join(process.cwd(), 'node_modules', '@tesseract.js-data', 'eng', '4.0.0_best_int'),
    path.join(process.cwd(), 'node_modules', '@tesseract.js-data', 'eng', '4.0.0'),
    path.resolve(__dirname, '..', '..', '..', '..', 'node_modules', '@tesseract.js-data', 'eng', '4.0.0_best_int'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(path.join(p, 'eng.traineddata.gz'))) {
      return p;
    }
  }
  throw new Error('UBOQ_OCR_TRAINEDDATA_MISSING: Offline @tesseract.js-data/eng traineddata not found');
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

/**
 * Executes genuine pixel-level Tesseract OCR on PNG/JPEG/raw RGBA page bitmaps using offline traineddata.
 * Preserves page dimensions, word/cell bounding boxes, and true OCR confidence scores.
 */
export async function runRasterImageOcr(
  imageBufferOrRaw: Buffer | { rawRgba: Uint8Array; width: number; height: number },
  pageNumber = 1
): Promise<OcrRecognizedPageGrid> {
  let normalizedPng: Buffer;
  let width = 0;
  let height = 0;

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

  const langPath = resolveOfflineTesseractLangPath();
  const worker = await Tesseract.createWorker('eng', 1, {
    langPath,
    gzip: true,
    cacheMethod: 'none',
  });

  try {
    const res = await worker.recognize(normalizedPng, {}, { blocks: true, text: true });
    const data = res.data as unknown as Record<string, unknown>;
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
  } finally {
    await worker.terminate();
  }
}
