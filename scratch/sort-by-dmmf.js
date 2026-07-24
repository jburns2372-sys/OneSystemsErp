const fs = require('fs');
const { Prisma } = require('@prisma/client');
const { dmmf } = Prisma;

const models = dmmf.datamodel.models;

// Build dependency graph
const graph = {};
const inDegree = {};

for (const model of models) {
    graph[model.name] = [];
    inDegree[model.name] = 0;
}

for (const model of models) {
    for (const field of model.fields) {
        if (field.kind === 'object' && field.relationName) {
            // Check if this model is the one holding the foreign key (it has relationFromFields)
            if (field.relationFromFields && field.relationFromFields.length > 0) {
                // this model depends on field.type
                const parent = field.type;
                const child = model.name;
                if (graph[parent]) {
                    graph[parent].push(child);
                    inDegree[child] = (inDegree[child] || 0) + 1;
                }
            }
        }
    }
}

// Topological sort
const queue = [];
for (const model of models) {
    if (inDegree[model.name] === 0) {
        queue.push(model.name);
    }
}

const sortedModels = [];
while (queue.length > 0) {
    const current = queue.shift();
    sortedModels.push(current);
    
    if (graph[current]) {
        for (const child of graph[current]) {
            inDegree[child]--;
            if (inDegree[child] === 0) {
                queue.push(child);
            }
        }
    }
}

// Any remaining models not in sortedModels have a cycle or unresolved dependencies
const missing = models.filter(m => !sortedModels.includes(m.name));
if (missing.length > 0) {
    console.log('Cycles detected or unresolved dependencies for:', missing.map(m => m.name));
    // Just append them and hope for the best
    for (const m of missing) {
        sortedModels.push(m.name);
    }
}

let lines = fs.readFileSync('filtered_list.txt', 'utf8').split('\n').filter(l => l);

function getRelation(line) {
    const parts = line.split(/\s+/);
    const idx = parts.indexOf('TABLE');
    if (idx !== -1 && parts[idx+1] === 'DATA') {
        return parts[idx+3];
    }
    return '';
}

lines.sort((a, b) => {
    const relA = getRelation(a);
    const relB = getRelation(b);
    let iA = sortedModels.indexOf(relA);
    let iB = sortedModels.indexOf(relB);
    if (iA === -1) iA = 9999;
    if (iB === -1) iB = 9999;
    if (iA !== iB) return iA - iB;
    const isSeqA = a.includes('SEQUENCE SET') ? 1 : 0;
    const isSeqB = b.includes('SEQUENCE SET') ? 1 : 0;
    return isSeqA - isSeqB;
});

fs.writeFileSync('filtered_list_sorted.txt', lines.join('\n') + '\n');
console.log('Topologically sorted list generated.');
