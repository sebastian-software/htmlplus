import { spawnSync } from 'node:child_process';
import { copyFile, mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
if (!process.argv.includes('--skip-build')) {
  const result = spawnSync(process.execPath, ['node_modules/typescript/bin/tsc', '-p', 'tsconfig.json'], { cwd: root, stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
const site = join(root, 'site');
await rm(site, { recursive: true, force: true });
await mkdir(join(site, 'demo'), { recursive: true });
await copyFile(join(root, 'demo/index.html'), join(site, 'index.html'));
for (const name of ['styles.css', 'favicon.svg']) await copyFile(join(root, 'demo', name), join(site, 'demo', name));
for (const folder of ['src', 'demo']) {
  const destination = join(site, 'dist', folder);
  await mkdir(destination, { recursive: true });
  for (const file of await readdir(join(root, 'dist', folder))) {
    if (file.endsWith('.js')) await copyFile(join(root, 'dist', folder, file), join(destination, file));
  }
}
await writeFile(join(site, '.nojekyll'), '');
console.log('Static demo exported to site/ with relative asset URLs.');
