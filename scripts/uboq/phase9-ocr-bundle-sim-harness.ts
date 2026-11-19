/* Runs REAL raster OCR with cwd set to a simulated Vercel function bundle (only includeFiles assets present). */
import sharp from 'sharp';
import { runRasterImageOcr } from '../../src/lib/uboq/intake/ocr-engine';

async function main() {
  const rows: Array<[number, string[]]> = [
    [70, ['Item No', 'Work Description', 'Unit', 'Qty', 'Unit Rate', 'Amount']],
    [150, ['900-1', 'Structural Concrete Class A', 'm3', '50', '6500', '325000']],
    [230, ['902-1', 'Reinforcing Steel Grade 60', 'kg', '1000', '75', '75000']],
  ];
  const xs = [35, 190, 680, 810, 960, 1170];
  const texts = rows.map(([y, cols]) => cols.map((t, i) => `<text x="${xs[i]}" y="${y}">${t}</text>`).join('')).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="300"><rect width="1400" height="300" fill="#fff"/><g font-family="Arial, Helvetica, sans-serif" font-size="28" fill="#000">${texts}</g></svg>`;
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  const t = Date.now();
  const r = await runRasterImageOcr(png, 1);
  console.log('SIM_RESULT=' + JSON.stringify({
    cwd: process.cwd(),
    ms: Date.now() - t,
    overallConfidence: r.overallConfidence,
    rows: r.rows.map((row) => ({ conf: row.rowConfidence, cells: row.cells.map((c) => c.text), hasBbox: row.cells.every((c) => c.bbox && c.bbox.x1 > c.bbox.x0) })),
  }));
  process.exit(0);
}
main().catch((e) => { console.error('SIM_ERROR=' + (e instanceof Error ? e.message : String(e))); process.exit(1); });
