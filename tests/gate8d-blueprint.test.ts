import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Decimal } from 'decimal.js';

describe('Gate 8D Blueprint and CPM Validation', () => {
    const blueprintPath = path.join(__dirname, '../src/lib/scheduling/blueprints/historical-validated-v1.json');
    let blueprint: any;

    beforeAll(() => {
        blueprint = JSON.parse(fs.readFileSync(blueprintPath, 'utf-8'));
    });

    test('Blueprint structure matches expectations', () => {
        expect(blueprint.version).toBe('HISTORICAL_VALIDATED_V1');
        expect(blueprint.wbs.length).toBe(13);
        expect(blueprint.activities.length).toBe(14);
        expect(blueprint.dependencies.length).toBe(11);
        expect(blueprint.allocations.length).toBe(326);

        // Required phase naming
        expect(blueprint.wbs.find((w: any) => w.sourceKey === 'PH_11').name).toBe('Testing and Commissioning');
        expect(blueprint.wbs.find((w: any) => w.sourceKey === 'PH_12').name).toBe('Project Acceptance and Demobilization');
    });

    test('Dependencies match the historical exactly', () => {
        const expected = [
            { predecessorKey: 'ACT_1', successorKey: 'ACT_2', type: 'FS' },
            { predecessorKey: 'ACT_1', successorKey: 'ACT_3', type: 'FS' },
            { predecessorKey: 'ACT_2', successorKey: 'ACT_4', type: 'FS' },
            { predecessorKey: 'ACT_3', successorKey: 'ACT_5', type: 'FS' },
            { predecessorKey: 'ACT_4', successorKey: 'ACT_6', type: 'FS' },
            { predecessorKey: 'ACT_5', successorKey: 'ACT_7', type: 'FS' },
            { predecessorKey: 'ACT_6', successorKey: 'ACT_8', type: 'FS' },
            { predecessorKey: 'ACT_7', successorKey: 'ACT_9', type: 'FS' },
            { predecessorKey: 'ACT_8', successorKey: 'ACT_11', type: 'FS' },
            { predecessorKey: 'ACT_9', successorKey: 'ACT_11', type: 'FS' },
            { predecessorKey: 'ACT_11', successorKey: 'ACT_12', type: 'FS' }
        ];

        for (const dep of blueprint.dependencies) {
            const match = expected.find(e => e.predecessorKey === dep.predecessorKey && e.successorKey === dep.successorKey && e.type === dep.type);
            expect(match).toBeDefined();
        }
        
        // Cyclic check
        const graph: any = {};
        for (const act of blueprint.activities) {
            graph[act.sourceKey] = [];
        }
        for (const dep of blueprint.dependencies) {
            graph[dep.predecessorKey].push(dep.successorKey);
        }

        const visited = new Set();
        const recursionStack = new Set();

        function hasCycle(node: string) {
            visited.add(node);
            recursionStack.add(node);

            for (const neighbor of graph[node]) {
                if (!visited.has(neighbor)) {
                    if (hasCycle(neighbor)) return true;
                } else if (recursionStack.has(neighbor)) {
                    return true;
                }
            }

            recursionStack.delete(node);
            return false;
        }

        let isCyclic = false;
        for (const node in graph) {
            if (!visited.has(node)) {
                if (hasCycle(node)) {
                    isCyclic = true;
                    break;
                }
            }
        }
        
        expect(isCyclic).toBe(false);
    });

    test('CPM Calculation computes exactly 2026-10-18', () => {
        // Independent CPM recalculation
        const START_DATE = new Date('2026-06-12T00:00:00Z');
        
        const addDays = (date: Date, days: number) => {
            const d = new Date(date);
            d.setDate(d.getDate() + days);
            return d;
        };

        const actDates: any = {};
        for (const act of blueprint.activities) {
            if (act.sourceKey === 'ACT_1' || act.sourceKey === 'ACT_13') {
                actDates[act.sourceKey] = { start: START_DATE, finish: addDays(START_DATE, act.duration) };
            }
        }
        
        let updated = true;
        while(updated) {
            updated = false;
            for (const dep of blueprint.dependencies) {
                const predDate = actDates[dep.predecessorKey];
                const succDur = blueprint.activities.find((a:any) => a.sourceKey === dep.successorKey).duration;
                if (predDate && !actDates[dep.successorKey]) {
                    actDates[dep.successorKey] = { start: predDate.finish, finish: addDays(predDate.finish, succDur) };
                    updated = true;
                } else if (predDate && actDates[dep.successorKey]) {
                    if (predDate.finish > actDates[dep.successorKey].start) {
                        actDates[dep.successorKey].start = predDate.finish;
                        actDates[dep.successorKey].finish = addDays(actDates[dep.successorKey].start, succDur);
                        updated = true;
                    }
                }
            }
        }

        // LOE handling
        actDates['ACT_10'] = { start: actDates['ACT_6'].start, finish: addDays(actDates['ACT_6'].start, 30) };
        actDates['ACT_14'] = { start: actDates['ACT_11'].start, finish: addDays(actDates['ACT_11'].start, 21) };

        const finishDates = Object.values(actDates).map((d: any) => d.finish.getTime());
        const maxFinish = new Date(Math.max(...finishDates));

        expect(maxFinish.toISOString().substring(0, 10)).toBe('2026-10-18');
        expect(blueprint.expectations.cpmFinishDate).toBe('2026-10-18');
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
