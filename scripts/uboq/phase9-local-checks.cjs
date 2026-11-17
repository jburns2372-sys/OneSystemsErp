'use strict';
// Local checks receive no inherited service credentials and cannot reach a real DB.
const fs = require('node:fs');
const cp = require('node:child_process');
const path = require('node:path');
const env = {};
for (const key of ['SystemRoot','WINDIR','ComSpec','Path','PATH','PATHEXT','TEMP','TMP','USERPROFILE','APPDATA','LOCALAPPDATA','PROGRAMFILES','ProgramFiles','ProgramFiles(x86)','PROCESSOR_ARCHITECTURE']) {
  if (process.env[key]) env[key] = process.env[key];
}
Object.assign(env, {
  CI: '1', NEXT_TELEMETRY_DISABLED: '1', AWS_EC2_METADATA_DISABLED: 'true',
  DATABASE_URL: 'postgresql://fixture:fixture@127.0.0.1:1/phase9_no_database?connect_timeout=1',
  DIRECT_URL: 'postgresql://fixture:fixture@127.0.0.1:1/phase9_no_database?connect_timeout=1',
  AUTH_SECRET: 'phase9-local-build-synthetic-secret-only',
});
const mode = process.argv[2];
let executable = process.execPath, args;
if (mode === 'generate') args = ['node_modules/prisma/build/index.js', 'generate'];
else if (mode === 'typegen') args = ['node_modules/next/dist/bin/next', 'typegen'];
else if (mode === 'types') args = ['node_modules/typescript/bin/tsc', '--noEmit', '--incremental', 'false'];
else if (mode === 'build') {
  executable = process.env.ComSpec || 'C:\\Windows\\System32\\cmd.exe';
  args = ['/d', '/s', '/c', 'npm.cmd run build'];
} else throw Error('Expected generate, typegen, types or build');
const out = path.resolve('artifacts/phase9-' + mode + '.log');
fs.mkdirSync(path.dirname(out), { recursive: true });
const fd = fs.openSync(out, 'w');
const child = cp.spawn(executable, args, { cwd: process.cwd(), env, stdio: ['ignore',fd,fd], windowsHide: true });
child.on('error', error => { console.error(error.message); process.exitCode=1; });
child.on('close', code => { fs.closeSync(fd); console.log(mode + ' exit=' + code + ' log=' + out); process.exitCode = code ?? 1; });
