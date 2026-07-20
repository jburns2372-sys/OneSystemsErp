import { generateCanonicalChecksum, BOQ_CANONICALIZATION_VERSION } from '../src/lib/boq/canonical-checksum';
import fs from 'fs';
import path from 'path';

function runTest() {
  if (BOQ_CANONICALIZATION_VERSION !== 'BOQ_CANONICAL_V1') throw new Error('Invalid version');
  
  const previewDataPath = path.resolve(process.cwd(), 'artifacts/scheduling/uat-v2-authoritative-boq-preview.json');
  const previewData = JSON.parse(fs.readFileSync(previewDataPath, 'utf-8'));
  
  if (previewData.length !== 326) throw new Error('Invalid lines length');

  const checksum = generateCanonicalChecksum(previewData);
  if (checksum !== '514c4bd4a7b188391c5ec7f04f198c2963035021a94b295a7b15d408ba831e17') {
    throw new Error('Checksum mismatch! Got: ' + checksum);
  }

  console.log('Test Passed: Checksum matches 514c4bd4a7b188391c5ec7f04f198c2963035021a94b295a7b15d408ba831e17');
}

runTest();
