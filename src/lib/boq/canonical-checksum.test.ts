import { generateCanonicalChecksum, BOQ_CANONICALIZATION_VERSION } from './canonical-checksum';
import fs from 'fs';
import path from 'path';

describe('BOQ Canonical Checksum', () => {
  it('should generate the exact approved checksum 514c4bd4a7b188391c5ec7f04f198c2963035021a94b295a7b15d408ba831e17 for the 326 authoritative lines', () => {
    expect(BOQ_CANONICALIZATION_VERSION).toBe('BOQ_CANONICAL_V1');
    
    // Load the preview data
    const previewDataPath = path.resolve(process.cwd(), 'artifacts/scheduling/uat-v2-authoritative-boq-preview.json');
    const previewData = JSON.parse(fs.readFileSync(previewDataPath, 'utf-8'));
    
    // Verify count is 326
    expect(previewData.length).toBe(326);

    const checksum = generateCanonicalChecksum(previewData);
    expect(checksum).toBe('514c4bd4a7b188391c5ec7f04f198c2963035021a94b295a7b15d408ba831e17');
  });
});
