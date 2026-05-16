// Drops + reseeds the ShopLite database before a test run.
// Invoked from npm scripts (e.g. `test:smoke`). Requires the docker compose stack to be up.
//
// Exit code is forwarded so failure here halts the test run.

import { execFile } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// scripts/ → qa/e2e/ → qa/ → repo root
const repoRoot = path.resolve(__dirname, "..", "..", "..");

console.log("[reset-db] dropping and reseeding the ShopLite database…");
try {
  const { stdout } = await execFileAsync(
    "docker",
    ["compose", "exec", "-T", "backend", "python", "-m", "app.seeds.seed", "--reset"],
    { cwd: repoRoot, timeout: 30_000 },
  );
  console.log(stdout.trim());
  console.log("[reset-db] done.");
} catch (err) {
  console.error("[reset-db] failed:", err.message ?? err);
  console.error("[reset-db] is the stack up? Try: docker compose up -d");
  process.exit(1);
}
