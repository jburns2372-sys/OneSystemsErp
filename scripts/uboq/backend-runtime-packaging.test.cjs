'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createRequire } = require('node:module');
const ts = require('typescript');

const repositoryRoot = path.resolve(__dirname, '../..');

test('compiled backend document-template imports load with native CommonJS resolution', async t => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'oserp-backend-imports-'));
  t.after(() => {
    for (const filename of Object.keys(require.cache)) {
      if (filename.startsWith(temporaryRoot + path.sep)) delete require.cache[filename];
    }
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  });

  function write(relativePath, contents) {
    const filename = path.join(temporaryRoot, relativePath);
    fs.mkdirSync(path.dirname(filename), { recursive: true });
    fs.writeFileSync(filename, contents);
  }

  // Compile the real transitive chain that failed in the deployed function. No
  // tsconfig-paths hook, alias mock, or bundler is installed in the temporary tree.
  const sourceFiles = [
    'src/lib/services/document-template.service.ts',
    'src/lib/accessControl.ts',
    'src/lib/permissions.ts',
    'src/lib/authorizationActions.ts',
  ];
  for (const relativePath of sourceFiles) {
    const compiled = ts.transpileModule(
      fs.readFileSync(path.join(repositoryRoot, relativePath), 'utf8'),
      {
        fileName: relativePath,
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2022,
          esModuleInterop: true,
        },
        reportDiagnostics: true,
      }
    );
    const errors = (compiled.diagnostics || []).filter(d => d.category === ts.DiagnosticCategory.Error);
    assert.equal(errors.length, 0, errors.map(d => ts.flattenDiagnosticMessageText(d.messageText, '\n')).join('\n'));
    write(relativePath.replace(/\.ts$/, '.js'), compiled.outputText);
  }

  // Replace only the database and request-cookie boundaries. Any use of them
  // fails immediately; this import regression never reads credentials or a DB.
  write('src/lib/prisma.js', `
    exports.prisma = new Proxy(Object.create(null), {
      get(_target, property) {
        throw new Error('Database access prohibited in import regression: ' + String(property));
      }
    });
  `);
  write('node_modules/next/headers.js', `
    exports.cookies = () => { throw new Error('Request cookies unavailable in import regression'); };
  `);

  const requireCompiled = createRequire(path.join(temporaryRoot, 'runtime-check.cjs'));
  const service = requireCompiled('./src/lib/services/document-template.service.js');
  assert.equal(typeof service.fetchActiveTemplatesService, 'function');
  assert.ok(require.cache[path.join(temporaryRoot, 'src/lib/accessControl.js')], 'real access control module must load transitively');
  assert.ok(require.cache[path.join(temporaryRoot, 'src/lib/permissions.js')], 'real permissions module must load transitively');
  await assert.rejects(service.fetchActiveTemplatesService(''), /Unauthorized: Missing actor id/);
});
