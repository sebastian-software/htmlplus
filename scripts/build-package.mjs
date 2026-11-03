// Builds what `npm pack` ships: separate modules for bundlers and a bundled build for pages without one.
import { build } from "esbuild";
import { spawnSync } from "node:child_process";
import { copyFile, mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const path = (name) => new URL(`../${name}`, import.meta.url);

for (const folder of ["lib", "browser", "styles"]) await rm(path(`${folder}/`), { recursive: true, force: true });

const compiled = spawnSync(process.execPath, ["node_modules/typescript/bin/tsc", "-p", "tsconfig.lib.json"], {
  cwd: root,
  stdio: "inherit",
});
if (compiled.status !== 0) process.exit(compiled.status ?? 1);

const elements = (await readdir(path("src/elements/"))).filter((name) => name.endsWith(".ts"));
await build({
  absWorkingDir: root,
  entryPoints: ["src/index.ts", ...elements.map((name) => `src/elements/${name}`)],
  outdir: "browser",
  outbase: "src",
  bundle: true,
  splitting: true,
  minify: true,
  format: "esm",
  platform: "browser",
  target: "es2022",
  chunkNames: "chunks/[name]-[hash]",
  // Anchor positioning places popups, so Floating UI stays out of the bundle.
  alias: { "@zag-js/popper": "./src/zag-popper.ts" },
  banner: { js: "/*! Third-party license notices: THIRD_PARTY_NOTICES.txt */" },
  define: { "process.env.NODE_ENV": '"production"' },
});

await mkdir(path("styles/"), { recursive: true });
const { nativeStyles } = await import(path("lib/native-styles.js"));
await writeFile(path("styles/native.css"), nativeStyles);
for (const name of ["themes.css", "shadcn.css"]) await copyFile(path(`demo/${name}`), path(`styles/${name}`));
console.log("Package built: lib/, browser/, and styles/.");
