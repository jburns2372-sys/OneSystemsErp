'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const assert = require('node:assert/strict');
function loadTs(file, dependencies = {}) {
  const compiled = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    reportDiagnostics: true,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  });
  assert.equal(compiled.diagnostics.length, 0, 'TypeScript transpilation diagnostics');
  const exports = {};
  vm.runInNewContext(compiled.outputText, { exports, process: { env: {} }, console: { error() {}, log() {} },
    require: name => {
      if (Object.hasOwn(dependencies, name)) return dependencies[name];
      if (name === './authorizationActions' || name === '@/lib/authorizationActions') {
        return loadTs('src/lib/authorizationActions.ts');
      }
      throw new Error('Unexpected test dependency: ' + name + ' in ' + path.basename(file));
    },
  }, { filename: file });
  return exports;
}
module.exports = { loadTs };
