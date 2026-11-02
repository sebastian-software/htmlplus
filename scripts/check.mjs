import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
for (const args of [
  ["node_modules/@biomejs/biome/bin/biome", "check"],
  ["scripts/build.mjs"],
  ["scripts/build-demo.mjs", "--skip-build"],
  ["scripts/sizes.mjs", "--check"],
  ["scripts/check-notices.mjs"],
  ["scripts/generate-api.mjs", "--check"],
  ["--test", "test/*.test.mjs"],
  ["scripts/check-consumer.mjs"],
  ["node_modules/playwright/cli.js", "test", ...process.argv.slice(2)],
]) {
  const result = spawnSync(process.execPath, args, { cwd: root, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
