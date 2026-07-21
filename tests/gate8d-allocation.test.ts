import fs from 'fs';
import path from 'path';
import { Decimal } from 'decimal.js';

describe('Gate 8D Allocation Validation', () => {
    const blueprintPath = path.join(__dirname, '../src/lib/scheduling/blueprints/historical-validated-v1.json');
    let blueprint: any;

    beforeAll(() => {
        blueprint = JSON.parse(fs.readFileSync(blueprintPath, 'utf-8'));
    });

    test('Allocation check', () => {
        let total = new Decimal(0);
        const mappedIds = new Set();
        for (const alloc of blueprint.allocations) {
            total = total.plus(alloc.amount);
            mappedIds.add(alloc.boqItemId);
        }
        
        expect(total.toFixed(2)).toBe('43106674.89');
        expect(mappedIds.size).toBe(326);
        expect(blueprint.expectations.boqChecksum).toBe('514c4bd4a7b188391c5ec7f04f198c2963035021a94b295a7b15d408ba831e17');
    });
});
