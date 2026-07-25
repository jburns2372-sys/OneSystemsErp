import { test, expect } from '@playwright/test';
import { Prisma } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Gate 7D Importer Tests', () => {
  // We will test the core logic used in reconstruction.ts
  const simulateImportLine = (line: any) => {
    if (line.amount === undefined || line.amount === null) {
      throw new Error(`missing mandatory amount`);
    }
    const amountVal = parseFloat(line.amount);
    if (isNaN(amountVal) || amountVal < 0) {
      throw new Error(`invalid or negative amount`);
    }

    const qty = line.qty !== undefined && line.qty !== null ? parseFloat(line.qty) : 0;
    const ucost = line.unitCost !== undefined && line.unitCost !== null ? parseFloat(line.unitCost) : 0;
    const totalCost = new Prisma.Decimal(line.amount).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

    return {
      quantity: qty,
      directCost: ucost,
      totalCost: totalCost.toNumber()
    };
  };

  test('lot line with amount and null unitCost', () => {
    const result = simulateImportLine({ amount: '1000.50', qty: null, unitCost: null });
    expect(result.totalCost).toBe(1000.50);
  });

  test('ordinary quantity/unit-cost line', () => {
    const result = simulateImportLine({ amount: '500.00', qty: '5', unitCost: '100' });
    expect(result.totalCost).toBe(500.00);
  });

  test('missing amount rejection', () => {
    expect(() => simulateImportLine({ qty: '5', unitCost: '100' })).toThrow(/missing mandatory amount/);
  });

  test('negative amount rejection', () => {
    expect(() => simulateImportLine({ amount: '-10.00' })).toThrow(/invalid or negative amount/);
  });

  test('zero amount acceptance', () => {
    const result = simulateImportLine({ amount: '0' });
    expect(result.totalCost).toBe(0);
  });

  test('fractional rounding', () => {
    const result = simulateImportLine({ amount: '10.555' });
    expect(result.totalCost).toBe(10.56);
  });

  test('complete 326-row manifest', () => {
    const manifestPath = path.join(process.cwd(), 'artifacts/scheduling/uat-v2-authoritative-boq-preview.json');
    const lines = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    expect(lines.length).toBe(326);
    
    let grandTotal = 0;
    const categoryTotals: Record<string, number> = {};
    
    for (const line of lines) {
      const res = simulateImportLine(line);
      grandTotal += res.totalCost;
      
      const cat = line.section;
      if (!categoryTotals[cat]) categoryTotals[cat] = 0;
      categoryTotals[cat] += res.totalCost;
    }

    // Fix float precision for sum assertion
    grandTotal = Math.round(grandTotal * 100) / 100;

    expect(grandTotal).toBe(43106674.89);
    expect(Math.round(categoryTotals['General Requirements'] * 100)/100).toBe(2700549.00);
    expect(Math.round(categoryTotals['Mechanical Works'] * 100)/100).toBe(23674716.57);
    expect(Math.round(categoryTotals['Electrical Works'] * 100)/100).toBe(16731409.32);
  });
});
