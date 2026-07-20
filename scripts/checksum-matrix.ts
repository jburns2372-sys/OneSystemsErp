import fs from 'fs';
import { generateCanonicalChecksum, BOQ_CANONICALIZATION_VERSION } from '../src/lib/boq/canonical-checksum';

export const UNSUPPORTED_LEGACY_ASSERTION = '040d59da1b76e0721c26645a74207c40b33f27c2a3df4a1c216b6340bf9f2fb7';

function run() {
  const previewData = JSON.parse(fs.readFileSync('artifacts/scheduling/uat-v2-authoritative-boq-preview.json', 'utf8'));

  const canonicalChecksum = generateCanonicalChecksum(previewData);
  
  console.log(`UNSUPPORTED_LEGACY_ASSERTION: ${UNSUPPORTED_LEGACY_ASSERTION}`);
  console.log(`CURRENT_CANONICAL_CHECKSUM (${BOQ_CANONICALIZATION_VERSION}): ${canonicalChecksum}`);
}

run();
