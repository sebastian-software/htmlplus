import { spawnSync } from 'node:child_process';
import { copyFile, mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
if (!process.argv.includes('--skip-build')) {
  const result = spawnSync(process.execPath, ['scripts/build.mjs'], { cwd: root, stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
const site = join(root, 'site');
await rm(site, { recursive: true, force: true });
await mkdir(join(site, 'demo'), { recursive: true });
await copyFile(join(root, 'demo/index.html'), join(site, 'index.html'));
await copyFile(join(root, 'demo/styling.html'), join(site, 'styling.html'));
for (const name of ['styles.css', 'base.css', 'styling.css', 'favicon.svg']) await copyFile(join(root, 'demo', name), join(site, 'demo', name));
async function copyModules(source, destination) {
  await mkdir(destination, { recursive: true });
  for (const file of await readdir(source, { withFileTypes: true })) {
    if (file.isDirectory()) await copyModules(join(source, file.name), join(destination, file.name));
    else if (file.name.endsWith('.js') || file.name === 'THIRD_PARTY_NOTICES.txt') await copyFile(join(source, file.name), join(destination, file.name));
  }
}
await copyModules(join(root, 'dist'), join(site, 'dist'));
await writeFile(join(site, '.nojekyll'), '');
console.log('Static demo exported to site/ with relative asset URLs.');
