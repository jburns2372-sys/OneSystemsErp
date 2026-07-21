import * as crypto from 'crypto';

export const BOQ_CANONICALIZATION_VERSION = "BOQ_CANONICAL_V1";

export function generateCanonicalChecksum(boqLines: any[]): string {
  // Sort first
  const sortedLines = [...boqLines].sort((a: any, b: any) => {
    if (a.seq !== b.seq) return String(a.seq).localeCompare(String(b.seq));
    return String(a.sourceRow).localeCompare(String(b.sourceRow));
  });

  // Map to the required base format for BOQ_CANONICAL_V1
  const canonicalForm = sortedLines.map((p: any) => ({
    seq: p.seq, 
    sourceRow: p.sourceRow, 
    itemRef: (p.itemRef || '').trim(),
    section: p.section, 
    subsection: p.subsection, 
    description: p.description,
    unit: p.unit, 
    qty: String(p.qty), 
    unitCost: String(p.unitCost),
    amount: String(p.amount), 
    isLot: p.isLot, 
    breakdownRequired: p.breakdownRequired
  }));

  // JSON stringify and SHA-256 hash
  return crypto.createHash('sha256').update(JSON.stringify(canonicalForm)).digest('hex');
}
