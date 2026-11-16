const fs=require('fs'),assert=require('assert/strict'),crypto=require('crypto'),esbuild=require('esbuild');
const base='artifacts/uboq/wp3/increment-01/';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const compiled=p=>esbuild.transformSync(fs.readFileSync(p,'utf8'),{loader:'ts',target:'es2022',minifyWhitespace:true,minifySyntax:true,minifyIdentifiers:false}).code;
const before=compiled(base+'route-before-type-bridge.ts'),after=compiled('src/app/api/uboq/templates/route.ts');
assert.equal(before,after);
fs.writeFileSync(base+'type-bridge-equivalence.json',JSON.stringify({status:'PASS',compiled_runtime_sha256:hash(after),explanation:'The only post-runtime-test handler change is an erased TypeScript TransactionClient assertion and comment. Minified JavaScript is byte-identical.'},null,2));
console.log('PASS final transaction type bridge has identical emitted JavaScript to tested handler');
