// Installs the real tarball into a Vite and React 19 app, so the package contract is tested as users get it.
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const root = fileURLToPath(new URL("../", import.meta.url));
const consumer = join(root, "test/consumer");
const singleElementLimit = 6_000;

function run(command, args, cwd, env = {}) {
  const result = spawnSync(command, args, { cwd, stdio: "inherit", env: { ...process.env, ...env } });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

const packed = mkdtempSync(join(tmpdir(), "htmlplus-pack-"));
run("npm", ["pack", "--silent", "--pack-destination", packed], root);
const tarball = join(
  packed,
  readdirSync(packed).find((name) => name.endsWith(".tgz")),
);

run("npm", ["ci", "--silent", "--no-audit", "--no-fund"], consumer);
run("npm", ["install", "--silent", "--no-save", "--no-package-lock", "--no-audit", "--no-fund", tarball], consumer);
rmSync(packed, { recursive: true });

run("npx", ["tsc", "--noEmit"], consumer);

// Every entry must be importable where no DOM exists, such as during server rendering.
const entries = readdirSync(join(root, "src/elements")).map((name) => `htmlplus/${name.replace(/\.ts$/, "")}`);
const imports = ["htmlplus", ...entries, "htmlplus/react"].map((name) => `await import(${JSON.stringify(name)});`);
run(process.execPath, ["--input-type=module", "-e", imports.join("\n")], consumer);

run("npx", ["vite", "build"], consumer);
run("npx", ["vite", "build", "--ssr", "src/prerender.tsx", "--outDir", "dist-ssr"], consumer);
run(process.execPath, ["dist-ssr/prerender.js"], consumer);

// One small element must not pull in the others or any Zag machine.
run("npx", ["vite", "build", "--outDir", "dist-switch"], consumer, { CONSUMER_ENTRY: "switch.html" });
const assets = join(consumer, "dist-switch/assets");
const scripts = readdirSync(assets).filter((name) => name.endsWith(".js"));
const source = scripts.map((name) => readFileSync(join(assets, name)));
const size = source.reduce((total, content) => total + gzipSync(content).length, 0);
if (size > singleElementLimit || source.some((content) => content.includes("data-scope"))) {
  console.error(`htmlplus/switch alone is ${size} bytes gzipped, or it includes Zag. Limit: ${singleElementLimit}.`);
  process.exit(1);
}
writeFileSync(join(consumer, "dist-switch/size.txt"), String(size));
console.log(`Consumer app works; htmlplus/switch adds ${size.toLocaleString("en-US")} bytes gzipped in Vite.`);
