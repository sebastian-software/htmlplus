import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const compiler = fileURLToPath(new URL('../node_modules/typescript/bin/tsc', import.meta.url));
const initial = spawnSync(process.execPath, ['scripts/build.mjs'], { cwd: root, stdio: 'inherit' });
if (initial.status !== 0) process.exit(initial.status ?? 1);
const watcher = spawn(process.execPath, [compiler, '-p', 'tsconfig.json', '--noEmit', '--watch', '--preserveWatchOutput'], { cwd: root, stdio: 'inherit' });
const bundler = spawn(process.execPath, ['scripts/build.mjs', '--watch'], { cwd: root, stdio: 'inherit' });
const preview = spawn(process.execPath, ['scripts/serve.mjs'], { cwd: root, stdio: 'inherit' });
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  watcher.kill(); bundler.kill(); preview.kill();
  process.exitCode = code;
}
watcher.on('error', (error) => { console.error(error); stop(1); });
bundler.on('error', (error) => { console.error(error); stop(1); });
preview.on('error', (error) => { console.error(error); stop(1); });
preview.on('exit', (code) => stop(code ?? 0));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => stop());
