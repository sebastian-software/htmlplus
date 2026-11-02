import { build } from "esbuild";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const { metafile } = await build({
  absWorkingDir: root,
  entryPoints: ["src/index.ts"],
  bundle: true,
  write: false,
  metafile: true,
  format: "esm",
  logLevel: "silent",
});
const packages = new Set(
  Object.keys(metafile.inputs).flatMap((input) => {
    const match = /node_modules\/((?:@[^/]+\/)?[^/]+)\//.exec(input);
    return match ? [match[1]] : [];
  }),
);
const notices = await readFile(new URL("../THIRD_PARTY_NOTICES.txt", import.meta.url), "utf8");
const missing = [...packages].filter((name) => !notices.includes(name)).sort();
if (missing.length) {
  console.error(`Add these bundled packages to THIRD_PARTY_NOTICES.txt: ${missing.join(", ")}`);
  process.exit(1);
}
console.log(`Third-party notices cover all ${packages.size} bundled packages.`);
