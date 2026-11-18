import crypto from 'node:crypto';
import path from 'node:path';
import { inflateRawSync } from 'node:zlib';
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
const MAX_ZIP_ENTRIES = 2048; // Bound synchronous per-entry parsing and inflation

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
  entries: Array<{ name: string; method: number; compressedSize: number; uncompressedSize: number; dataStart: number }>;
} {
  let totalUncompressed = 0;
  let maxRatio = 1;
  let hasNestedArchive = false;
  const entryNames: string[] = [];
  const seenNames = new Set<string>();
  const seenLocalOffsets = new Set<number>();
  const occupiedRanges: Array<{ start: number; end: number }> = [];
  const entries: Array<{ name: string; method: number; compressedSize: number; uncompressedSize: number; dataStart: number }> = [];

  // ZIP local headers may intentionally contain zero sizes when bit 3 indicates
  // a data descriptor. Only verified central-directory sizes are authoritative.
  const zipInvalid = () => new Error('UBOQ_SEC_ZIP_DIRECTORY_INVALID: Inconsistent ZIP metadata');
  let eocd = -1;
  for (let pos = buf.length - 22; pos >= Math.max(0, buf.length - 22 - 0xffff); pos--) {
    if (buf.readUInt32LE(pos) === 0x06054b50 &&
        pos + 22 + buf.readUInt16LE(pos + 20) === buf.length) {
      eocd = pos;
      break;
    }
  }
  if (eocd < 0) throw zipInvalid();

  const diskNumber = buf.readUInt16LE(eocd + 4);
  const directoryDisk = buf.readUInt16LE(eocd + 6);
  const entriesOnDisk = buf.readUInt16LE(eocd + 8);
  const entryCount = buf.readUInt16LE(eocd + 10);
  const dirSize = buf.readUInt32LE(eocd + 12);
  const dirOffset = buf.readUInt32LE(eocd + 16);
  // The 25-MB Office upload limit does not require multi-disk or ZIP64 archives.
  if (diskNumber || directoryDisk || !entryCount || entriesOnDisk !== entryCount ||
      entryCount === 0xffff || dirSize === 0xffffffff || dirOffset === 0xffffffff ||
      dirOffset + dirSize !== eocd) throw zipInvalid();
  if (entryCount > MAX_ZIP_ENTRIES) {
    throw new Error('UBOQ_SEC_ZIP_ENTRY_COUNT_EXCEEDED: Too many Office ZIP entries');
  }

  let offset = dirOffset;
  for (let i = 0; i < entryCount; i++) {
    if (offset + 46 > eocd || buf.readUInt32LE(offset) !== 0x02014b50) throw zipInvalid();
    const flags = buf.readUInt16LE(offset + 8);
    const method = buf.readUInt16LE(offset + 10);
    const compSize = buf.readUInt32LE(offset + 20);
    const uncompSize = buf.readUInt32LE(offset + 24);
    const nameLen = buf.readUInt16LE(offset + 28);
    const extraLen = buf.readUInt16LE(offset + 30);
    const commentLen = buf.readUInt16LE(offset + 32);
    const entryDisk = buf.readUInt16LE(offset + 34);
    const localOffset = buf.readUInt32LE(offset + 42);
    const next = offset + 46 + nameLen + extraLen + commentLen;
    if (next > eocd || !nameLen || entryDisk ||
        localOffset === 0xffffffff || compSize === 0xffffffff || uncompSize === 0xffffffff ||
        (flags & (0x1 | 0x40)) !== 0 || (method !== 0 && method !== 8) ||
        (method === 0 && compSize !== uncompSize)) throw zipInvalid();

    const nameBytes = buf.subarray(offset + 46, offset + 46 + nameLen);
    const name = nameBytes.toString('utf8');
    if (seenNames.has(name) || seenLocalOffsets.has(localOffset)) {
      throw new Error('UBOQ_SEC_ZIP_DUPLICATE_ENTRY: Repeated ZIP name or local record');
    }
    seenNames.add(name);
    seenLocalOffsets.add(localOffset);
    if (name.includes('\0') || name.startsWith('/') || name.split('/').includes('..')) throw zipInvalid();
    if (localOffset + 30 > dirOffset || buf.readUInt32LE(localOffset) !== 0x04034b50 ||
        buf.readUInt16LE(localOffset + 6) !== flags ||
        buf.readUInt16LE(localOffset + 8) !== method ||
        buf.readUInt16LE(localOffset + 26) !== nameLen) throw zipInvalid();
    const localNameLen = buf.readUInt16LE(localOffset + 26);
    const localExtraLen = buf.readUInt16LE(localOffset + 28);
    const localDataStart = localOffset + 30 + localNameLen + localExtraLen;
    if (localDataStart + compSize > dirOffset ||
        !buf.subarray(localOffset + 30, localOffset + 30 + localNameLen).equals(nameBytes)) {
      throw zipInvalid();
    }
    // Without a data descriptor, local sizes must match the central record.
    if (!(flags & 0x8) &&
        (buf.readUInt32LE(localOffset + 18) !== compSize ||
         buf.readUInt32LE(localOffset + 22) !== uncompSize)) throw zipInvalid();

    totalUncompressed += uncompSize;
    const ratio = compSize ? uncompSize / compSize : (uncompSize ? Infinity : 1);
    maxRatio = Math.max(maxRatio, ratio);
    if (totalUncompressed > MAX_ZIP_UNCOMPRESSED_BYTES || maxRatio > MAX_ZIP_COMPRESSION_RATIO) {
      throw new Error('UBOQ_SEC_ZIP_BOMB_BLOCKED: ZIP central-directory sizes exceed safety ceiling');
    }
    // Do not decompress until ALL central records have been checked for aliases,
    // repeated local records and overlapping regions.
    occupiedRanges.push({ start: localOffset, end: localDataStart + compSize });
    entryNames.push(name);
    entries.push({ name, method, compressedSize: compSize, uncompressedSize: uncompSize, dataStart: localDataStart });
    if (/\.(zip|rar|7z|tar|gz|bz2|xz|cab|iso)$/i.test(name)) hasNestedArchive = true;
    offset = next;
  }
  if (offset !== eocd) throw zipInvalid();
  occupiedRanges.sort((a, b) => a.start - b.start);
  for (let i = 1; i < occupiedRanges.length; i++) {
    if (occupiedRanges[i].start < occupiedRanges[i - 1].end) {
      throw new Error('UBOQ_SEC_ZIP_DUPLICATE_ENTRY: Overlapping local ZIP record ranges');
    }
  }
  // Once the entire central directory is validated, check DEFLATE sizes with
  // bounded inflation, so forged output-size claims cannot bypass the ceiling.
  for (const entry of entries) {
    if (entry.method !== 8) continue;
    let inflatedSize: number;
    try {
      inflatedSize = inflateRawSync(
        buf.subarray(entry.dataStart, entry.dataStart + entry.compressedSize),
        { maxOutputLength: entry.uncompressedSize + 1 },
      ).length;
    } catch {
      throw new Error('UBOQ_SEC_ZIP_SIZE_MISMATCH: Declared ZIP size differs from bounded decompression');
    }
    if (inflatedSize !== entry.uncompressedSize) {
      throw new Error('UBOQ_SEC_ZIP_SIZE_MISMATCH: ZIP entry size mismatch');
    }
  }
  return { totalUncompressed, maxRatio, hasNestedArchive, entryNames, entries };
}

/** Read only a validated, size-bounded Office ZIP entry. Never use unverified local header lengths. */
export function readVerifiedOfficeZipEntry(buf: Buffer, entryName: string): Buffer {
  const directory = inspectZipCentralDirectory(buf);
  const matching = directory.entries.filter(entry => entry.name === entryName);
  if (matching.length !== 1) {
    throw new Error('UBOQ_SEC_OFFICE_ENTRY_MISSING_OR_DUPLICATE: Required Office entry is not unique');
  }
  const entry = matching[0];
  const compressed = buf.subarray(entry.dataStart, entry.dataStart + entry.compressedSize);
  if (entry.method === 0) return Buffer.from(compressed);
  // inspectZipCentralDirectory already confirmed the bounded expanded size.
  const inflated = inflateRawSync(compressed, { maxOutputLength: entry.uncompressedSize + 1 });
  if (inflated.length !== entry.uncompressedSize) {
    throw new Error('UBOQ_SEC_ZIP_SIZE_MISMATCH: Office entry expanded size changed');
  }
  return inflated;
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

  // Empty/generic MIME is common for browser uploads. A specific declaration
  // must agree with detected content; preserve established CSV/XML aliases.
  const declared = declaredMimeType?.split(';', 1)[0].trim().toLowerCase();
  const aliases: Record<string, string[]> = {
    'text/csv': ['application/csv', 'application/vnd.ms-excel'],
    'application/xml': ['text/xml'],
    'image/jpeg': ['image/jpg'],
  };
  if (declared && declared !== 'application/octet-stream' && declared !== canonicalMimeType &&
      !aliases[canonicalMimeType]?.includes(declared)) {
    throw new Error('UBOQ_SEC_MIME_MISMATCH: Declared MIME does not match verified document content');
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
