import { build, context } from 'esbuild';
import { spawnSync } from 'node:child_process';
import { copyFile, readdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const watch = process.argv.includes('--watch');
if (!watch) {
  await rm(new URL('../dist/', import.meta.url), { recursive: true, force: true });
  const result = spawnSync(process.execPath, ['node_modules/typescript/bin/tsc', '-p', 'tsconfig.json', '--emitDeclarationOnly'], { cwd: root, stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
const entryPoints = (await Promise.all(['src', 'demo'].map(async (folder) =>
  (await readdir(new URL(`../${folder}/`, import.meta.url))).filter((name) => name.endsWith('.ts')).map((name) => `${folder}/${name}`),
))).flat();
const options = { absWorkingDir: root, entryPoints, outdir: 'dist', outbase: '.', bundle: true, splitting: true, format: 'esm', platform: 'browser', target: 'es2022', sourcemap: true, chunkNames: 'chunks/[name]-[hash]', banner: { js: '/*! Third-party license notices: ../THIRD_PARTY_NOTICES.txt */' }, define: { 'process.env.NODE_ENV': '"production"' } };
if (watch) {
  const compiler = await context(options);
  await compiler.watch();
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, async () => { await compiler.dispose(); process.exit(0); });
  console.log('Watching browser modules. Refresh the playground after changes.');
} else {
  await build(options);
  await copyFile(new URL('../THIRD_PARTY_NOTICES.txt', import.meta.url), new URL('../dist/THIRD_PARTY_NOTICES.txt', import.meta.url));
  console.log('Browser modules and declarations built.');
}
