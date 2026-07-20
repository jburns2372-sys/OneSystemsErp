const fs = require('fs');

const env1 = fs.readFileSync('.env.uat-v4-r7', 'utf-8');
const env2 = fs.readFileSync('.env.uat-v4-r7.credentials.local', 'utf-16le').replace(/^\uFEFF/, '');

let combined = env1 + '\n' + env2;
fs.writeFileSync('.env.local', combined, 'utf-8');
console.log('.env.local created successfully.');
