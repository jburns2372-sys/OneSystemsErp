/* Real (non-mocked) extraction harness: runs production parsers.ts against synthetic PDF and PNG BOQs. */
import sharp from 'sharp';
import { extractUniversalDocumentPackage } from '../../src/lib/uboq/intake/parsers';
import { runWithBoundedTimeout } from '../../src/lib/uboq/intake/ocr-engine';

function buildSamplePdf(): Buffer {
  const cells: Array<[number, number, string]> = [
    [40, 740, 'Item No'], [110, 740, 'Description'], [300, 740, 'Unit'], [360, 740, 'Qty'], [420, 740, 'Unit Rate'], [500, 740, 'Amount'],
    [40, 715, '900(1)'], [110, 715, 'Structural Concrete Class A'], [300, 715, 'cu.m.'], [360, 715, '50'], [420, 715, '6500'], [500, 715, '325000'],
    [40, 690, '902(1)'], [110, 690, 'Reinforcing Steel Grade 60'], [300, 690, 'kg'], [360, 690, '1000'], [420, 690, '75'], [500, 690, '75000'],
  ];
  const stream = 'BT /F1 10 Tf ' + cells.map(([x, y, t]) => `1 0 0 1 ${x} ${y} Tm (${t}) Tj`).join(' ') + ' ET';
  const objs = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj\n',
    `4 0 obj << /Length ${Buffer.byteLength(stream)} >> stream\n${stream}\nendstream endobj\n`,
    '5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n',
  ];
  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];
  for (const o of objs) {
    offsets.push(Buffer.byteLength(pdf));
    pdf += o;
  }
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objs.length; i++) pdf += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
  pdf += `trailer << /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf, 'utf8');
}

async function buildSamplePng(): Promise<Buffer> {
  const rows: Array<[number, string[]]> = [
    [60, ['Item No', 'Description', 'Unit', 'Qty', 'Unit Rate', 'Amount']],
    [130, ['900-1', 'Structural Concrete Class A', 'm3', '50', '6500', '325000']],
    [200, ['902-1', 'Reinforcing Steel Grade 60', 'kg', '1000', '75', '75000']],
  ];
  const xs = [30, 160, 580, 700, 840, 1020];
  const texts = rows
    .map(([y, cols], r) => cols.map((t, i) => `<text x="${xs[i]}" y="${y}"${r === 0 ? ' font-weight="bold"' : ''}>${t}</text>`).join(''))
    .join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="260"><rect width="1200" height="260" fill="#fff"/><g font-family="Arial, Helvetica, sans-serif" font-size="26" fill="#000">${texts}</g></svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function main() {
  const out: Record<string, unknown> = {};

  const t0 = Date.now();
  const pdf = await extractUniversalDocumentPackage('synthetic-boq.pdf', buildSamplePdf());
  out.pdf = {
    ms: Date.now() - t0,
    blockingErrors: pdf.blockingErrors,
    candidateCount: pdf.candidates.length,
    methods: [...new Set(pdf.candidates.map((c) => c.extractionMethod))],
    sample: pdf.candidates.slice(0, 3).map((c) => ({ row: c.sourceRowNumber, ref: c.sourceCellRef, conf: c.confidenceScore, review: c.requiresHumanReview, fields: c.mappedFields })),
  };

  const t1 = Date.now();
  const png = await extractUniversalDocumentPackage('synthetic-boq.png', await buildSamplePng());
  out.png = {
    ms: Date.now() - t1,
    blockingErrors: png.blockingErrors,
    candidateCount: png.candidates.length,
    methods: [...new Set(png.candidates.map((c) => c.extractionMethod))],
    sample: png.candidates.slice(0, 3).map((c) => ({ row: c.sourceRowNumber, conf: c.confidenceScore, review: c.requiresHumanReview, fields: c.mappedFields, coords: c.cellCoordinates })),
  };

  // Bounded timeout must reject AND invoke the worker-termination hook (not Promise.race alone).
  let terminated = false;
  const tStart = Date.now();
  let timeoutError = '';
  try {
    await runWithBoundedTimeout(new Promise<never>(() => undefined), 'recognition', 300, () => { terminated = true; });
  } catch (e) {
    timeoutError = e instanceof Error ? e.message : String(e);
  }
  out.timeout = { terminated, elapsedMs: Date.now() - tStart, timeoutError };

  console.log('HARNESS_RESULT=' + JSON.stringify(out));
  process.exit(0);
}

main().catch((e) => {
  console.error('HARNESS_ERROR=' + (e instanceof Error ? e.stack || e.message : String(e)));
  process.exit(1);
});
