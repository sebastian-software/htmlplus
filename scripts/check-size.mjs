import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const root = fileURLToPath(new URL("../", import.meta.url));
// Gzipped bytes across every module an entry loads. Raise a limit deliberately, not by habit.
const limits = {
  "dist/src/index.js": 165_000,
  "dist/src/date-range-picker.js": 70_000,
  "dist/src/select.js": 55_000,
  "dist/src/switch.js": 5_000,
  "dist/landing/landing.js": 18_000,
};

function modules(entry, seen = new Set()) {
  if (seen.has(entry)) return seen;
  seen.add(entry);
  for (const [, specifier] of readFileSync(join(root, entry), "utf8").matchAll(/(?:from|import)\s*"(\.[^"]+)"/g))
    modules(join(dirname(entry), specifier), seen);
  return seen;
}

let failed = false;
for (const [entry, limit] of Object.entries(limits)) {
  const size = [...modules(entry)].reduce((total, file) => total + gzipSync(readFileSync(join(root, file))).length, 0);
  const within = size <= limit;
  failed ||= !within;
  console.log(
    `${within ? "ok  " : "over"} ${entry}: ${size.toLocaleString("en-US")} of ${limit.toLocaleString("en-US")} bytes gzipped`,
  );
}
if (failed) process.exit(1);
