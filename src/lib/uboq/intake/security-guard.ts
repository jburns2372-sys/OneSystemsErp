import crypto from 'node:crypto';
import path from 'node:path';
import * as XLSX from 'xlsx';

export interface FileSecurityScanResult {
  readonly safe: boolean;
  readonly sha256Hash: string;
  readonly magicSignature: string;
  readonly detectedFormat: 'XLSX' | 'XLS' | 'CSV' | 'DOCX' | 'PDF' | 'XML_HTML' | 'IMAGE' | 'JSON';
  readonly canonicalMimeType: string;
  readonly findings: string[];
}

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25 MB ceiling
const MAX_ZIP_UNCOMPRESSED_BYTES = 80 * 1024 * 1024; // 80 MB ceiling
const MAX_ZIP_COMPRESSION_RATIO = 100;

const DANGEROUS_FORMULA_PATTERNS = [
  /^\s*[=+\-@]\s*(cmd|powershell|bash|sh|wscript|cscript|mshta|rundll32)\b/i,
  /^\s*=\s*(webservice|importxml|importhtml|importdata|importfeed|call|register\.id)\s*\(/i,
  /\|\s*'[^']*'\s*!/i, // DDE invocation syntax e.g. =CMD|'/C calc'!A0
];

const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|system)\s+instructions/i,
  /override\s+(uboq\s+)?(validation|approval|security|rbac|pbac)/i,
  /auto[\s-]?approve\s+(this\s+)?(snapshot|prr|boq|po|mrf)/i,
  /system\s*prompt\s*:/i,
  /set\s+status\s*=\s*['"]?approved['"]?/i,
];

function inspectZipCentralDirectory(buf: Buffer): {
  totalUncompressed: number;
  maxRatio: number;
  hasNestedArchive: boolean;
  entryNames: string[];
} {
  let totalUncompressed = 0;
  let maxRatio = 1;
  let hasNestedArchive = false;
  const entryNames: string[] = [];

  let offset = 0;
  while (offset + 30 <= buf.length) {
    const idx = buf.indexOf(Buffer.from([0x50, 0x4b, 0x03, 0x04]), offset);
    if (idx === -1 || idx + 30 > buf.length) break;

    const compSize = buf.readUInt32LE(idx + 18);
    const uncompSize = buf.readUInt32LE(idx + 22);
    const nameLen = buf.readUInt16LE(idx + 26);
    const extraLen = buf.readUInt16LE(idx + 28);

    if (idx + 30 + nameLen <= buf.length) {
      const entryName = buf.subarray(idx + 30, idx + 30 + nameLen).toString('utf8');
      entryNames.push(entryName);
      if (/\.(zip|rar|7z|tar|gz|bz2|xz|cab|iso)$/i.test(entryName)) {
        hasNestedArchive = true;
      }
    }

    totalUncompressed += uncompSize;
    if (compSize > 0) {
      const ratio = uncompSize / compSize;
      if (ratio > maxRatio) maxRatio = ratio;
    } else if (uncompSize > 1024 * 1024) {
      maxRatio = 999;
    }

    offset = idx + 30 + nameLen + extraLen + Math.max(compSize, 0);
    if (offset <= idx) offset = idx + 4;
  }

  return { totalUncompressed, maxRatio, hasNestedArchive, entryNames };
}

function inspectOle2CompoundContainer(buf: Buffer): {
  hasWorkbookStream: boolean;
  hasVbaMacros: boolean;
  hasEmbeddedPackage: boolean;
} {
  const cfbLib = (XLSX as unknown as { CFB?: { read: (b: Buffer, o: { type: string }) => { FullPaths?: string[] } } }).CFB;
  if (cfbLib && typeof cfbLib.read === 'function') {
    let container: { FullPaths?: string[] };
    try {
      container = cfbLib.read(buf, { type: 'buffer' });
    } catch (err: unknown) {
      throw new Error(
        `UBOQ_SEC_INVALID_XLS_CONTAINER: Corrupted or truncated OLE2 container (${(err as Error)?.message || 'parse failed'})`
      );
    }
    const paths = (container.FullPaths ?? []).map((p) => String(p));
    const hasWorkbookStream = paths.some((p) => /(^|\/)(Workbook|Book)$/i.test(p));
    const hasVbaMacros = paths.some((p) => /(_VBA_PROJECT_CUR|\/VBA\/|Macros)/i.test(p));
    const hasEmbeddedPackage = paths.some((p) => /(\/Package$|\.exe$|\.bat$|\.ps1$)/i.test(p));
    return { hasWorkbookStream, hasVbaMacros, hasEmbeddedPackage };
  }
  const ascii = buf.toString('latin1');
  return {
    hasWorkbookStream: /Workbook|Book/.test(ascii),
    hasVbaMacros: /_VBA_PROJECT_CUR/.test(ascii),
    hasEmbeddedPackage: false,
  };
}

export function scanUploadedDocumentSecurity(
  fileName: string,
  buffer: Buffer,
  declaredMimeType?: string
): FileSecurityScanResult {
  const findings: string[] = [];

  if (!buffer || buffer.length === 0) {
    throw new Error('UBOQ_SEC_EMPTY_FILE: Uploaded document is empty');
  }
  if (buffer.length > MAX_UPLOAD_BYTES) {
    throw new Error(`UBOQ_SEC_SIZE_EXCEEDED: File size ${buffer.length} exceeds ${MAX_UPLOAD_BYTES} bytes`);
  }

  const sha256Hash = crypto.createHash('sha256').update(buffer).digest('hex');
  const ext = path.extname(fileName || '').toLowerCase();
  const magicHex = buffer.subarray(0, Math.min(8, buffer.length)).toString('hex').toLowerCase();

  let detectedFormat: FileSecurityScanResult['detectedFormat'];
  let canonicalMimeType = 'application/octet-stream';

  if (magicHex.startsWith('504b0304')) {
    const zipStats = inspectZipCentralDirectory(buffer);
    if (zipStats.hasNestedArchive) {
      throw new Error('UBOQ_SEC_NESTED_ARCHIVE_BLOCKED: Nested archive inside Office container is prohibited (SEC-01)');
    }
    if (zipStats.totalUncompressed > MAX_ZIP_UNCOMPRESSED_BYTES || zipStats.maxRatio > MAX_ZIP_COMPRESSION_RATIO) {
      throw new Error(
        `UBOQ_SEC_ZIP_BOMB_BLOCKED: Uncompressed size (${zipStats.totalUncompressed}) or ratio (${zipStats.maxRatio.toFixed(1)}) exceeds safety ceiling`
      );
    }
    if (zipStats.entryNames.some((n) => /vbaproject\.bin/i.test(n))) {
      throw new Error('UBOQ_SEC_MACRO_BLOCKED: VBA macro-enabled Office packages are rejected');
    }

    if (ext === '.xlsx' || zipStats.entryNames.some((n) => n.startsWith('xl/'))) {
      if (ext && ext !== '.xlsx') {
        throw new Error(`UBOQ_SEC_MAGIC_EXTENSION_MISMATCH: File "${fileName}" has XLSX container bytes for extension "${ext}"`);
      }
      detectedFormat = 'XLSX';
      canonicalMimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    } else if (ext === '.docx' || zipStats.entryNames.some((n) => n.startsWith('word/'))) {
      if (ext && ext !== '.docx') {
        throw new Error(`UBOQ_SEC_MAGIC_EXTENSION_MISMATCH: File "${fileName}" has DOCX container bytes for extension "${ext}"`);
      }
      detectedFormat = 'DOCX';
      canonicalMimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    } else {
      throw new Error(`UBOQ_SEC_UNSUPPORTED_ZIP_CONTAINER: Raw ZIP archives are not permitted ("${fileName}")`);
    }
  } else if (magicHex === 'd0cf11e0a1b11ae1') {
    if (ext && ext !== '.xls') {
      throw new Error(`UBOQ_SEC_MAGIC_EXTENSION_MISMATCH: OLE2 BIFF container does not match extension "${ext}"`);
    }
    const oleStats = inspectOle2CompoundContainer(buffer);
    if (oleStats.hasVbaMacros) {
      throw new Error('UBOQ_SEC_MACRO_BLOCKED: VBA macro-enabled legacy XLS workbooks are rejected');
    }
    if (oleStats.hasEmbeddedPackage) {
      throw new Error('UBOQ_SEC_EMBEDDED_OBJECT_BLOCKED: Embedded OLE package inside XLS is prohibited');
    }
    if (!oleStats.hasWorkbookStream) {
      throw new Error('UBOQ_SEC_INVALID_XLS_CONTAINER: OLE2 container does not contain a valid BIFF Workbook stream');
    }
    detectedFormat = 'XLS';
    canonicalMimeType = 'application/vnd.ms-excel';
  } else if (magicHex.startsWith('25504446')) {
    if (ext && ext !== '.pdf') {
      throw new Error(`UBOQ_SEC_MAGIC_EXTENSION_MISMATCH: PDF magic bytes do not match extension "${ext}"`);
    }
    detectedFormat = 'PDF';
    canonicalMimeType = 'application/pdf';
  } else if (magicHex.startsWith('89504e47')) {
    if (ext && ext !== '.png') {
      throw new Error(`UBOQ_SEC_MAGIC_EXTENSION_MISMATCH: PNG magic bytes do not match extension "${ext}"`);
    }
    detectedFormat = 'IMAGE';
    canonicalMimeType = 'image/png';
  } else if (magicHex.startsWith('ffd8ff')) {
    if (ext && !['.jpg', '.jpeg'].includes(ext)) {
      throw new Error(`UBOQ_SEC_MAGIC_EXTENSION_MISMATCH: JPEG magic bytes do not match extension "${ext}"`);
    }
    detectedFormat = 'IMAGE';
    canonicalMimeType = 'image/jpeg';
  } else if (magicHex.startsWith('4d5a') || magicHex.startsWith('7f454c46')) {
    throw new Error(`UBOQ_SEC_EXECUTABLE_BLOCKED: Executable binary disguised as "${fileName}" rejected`);
  } else {
    if (['.xlsx', '.xls', '.docx', '.pdf', '.png', '.jpg', '.jpeg'].includes(ext)) {
      throw new Error(`UBOQ_SEC_MAGIC_EXTENSION_MISMATCH: Binary extension "${ext}" contains non-matching header ${magicHex}`);
    }
    const sampleText = buffer.subarray(0, Math.min(4096, buffer.length)).toString('utf8').trimStart();
    if (ext === '.json' || sampleText.startsWith('{') || sampleText.startsWith('[')) {
      detectedFormat = 'JSON';
      canonicalMimeType = 'application/json';
    } else if (ext === '.xml' || ext === '.html' || ext === '.htm' || sampleText.startsWith('<')) {
      if (/<!ENTITY\s+/i.test(sampleText)) {
        throw new Error('UBOQ_SEC_XXE_BLOCKED: XML External Entity (DOCTYPE ENTITY) declarations are prohibited');
      }
      detectedFormat = 'XML_HTML';
      canonicalMimeType = ext === '.xml' ? 'application/xml' : 'text/html';
    } else if (ext === '.csv' || declaredMimeType?.includes('csv')) {
      detectedFormat = 'CSV';
      canonicalMimeType = 'text/csv';
    } else {
      throw new Error(`UBOQ_SEC_UNSUPPORTED_FORMAT: Unable to verify safe document format for "${fileName}"`);
    }
  }

  return {
    safe: findings.length === 0,
    sha256Hash,
    magicSignature: magicHex,
    detectedFormat,
    canonicalMimeType,
    findings,
  };
}

export function neutralizeSpreadsheetFormulaForCsv(rawText: string): string {
  const text = String(rawText ?? '');
  if (!text) return text;
  // M02: Escape ALL formula-capable untrusted strings starting with =, +, -, @, tab (\t), or CR (\r)
  if (/^[\t\r=+\-@]/.test(text) || /^\s+[=+\-@]/.test(text)) {
    return `'${text}`;
  }
  return text;
}

export function inspectCellSecurity(rawText: string): {
  isFormulaInjection: boolean;
  isPromptInjection: boolean;
  sanitizedText: string;
  alerts: string[];
} {
  const alerts: string[] = [];
  let isFormulaInjection = false;
  let isPromptInjection = false;
  const text = String(rawText ?? '');

  for (const pat of DANGEROUS_FORMULA_PATTERNS) {
    if (pat.test(text)) {
      isFormulaInjection = true;
      alerts.push('FORMULA_DDE_INJECTION_DETECTED');
      break;
    }
  }

  for (const pat of PROMPT_INJECTION_PATTERNS) {
    if (pat.test(text)) {
      isPromptInjection = true;
      alerts.push('ADVERSARIAL_PROMPT_INJECTION_DETECTED');
      break;
    }
  }

  const sanitizedText = isFormulaInjection ? `'${text}` : text;

  return { isFormulaInjection, isPromptInjection, sanitizedText, alerts };
}
