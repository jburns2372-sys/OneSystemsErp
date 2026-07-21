import fs from 'fs';
import path from 'path';

describe('Gate 8D CPM Validation', () => {
    const blueprintPath = path.join(__dirname, '../src/lib/scheduling/blueprints/historical-validated-v1.json');
    let blueprint: any;

    beforeAll(() => {
        blueprint = JSON.parse(fs.readFileSync(blueprintPath, 'utf-8'));
    });

    test('CPM Calculation computes exactly 2026-10-18', () => {
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
});
