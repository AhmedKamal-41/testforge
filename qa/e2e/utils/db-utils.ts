import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

// repo root = three levels up from this file: qa/e2e/utils/ → qa/e2e/ → qa/ → root
const REPO_ROOT = path.resolve(__dirname, "..", "..", "..");

/**
 * Drop + recreate tables, then re-seed canonical data.
 * Uses `docker compose exec backend python -m app.seeds.seed --reset`.
 *
 * Slow (~1–2s) but reliable. Call from `test.beforeAll` for suite-level isolation;
 * for per-test isolation, prefer API-driven setup (see ApiClient) over calling this.
 *
 * Requires the Compose stack to be up. If you need a faster reset later we can swap
 * this for a test-only API endpoint on the backend.
 */
export async function resetDatabase(): Promise<void> {
  await execFileAsync(
    "docker",
    ["compose", "exec", "-T", "backend", "python", "-m", "app.seeds.seed", "--reset"],
    { cwd: REPO_ROOT, timeout: 30_000 },
  );
}

/**
 * Idempotent re-seed without dropping schema. Safe to run on a partially-modified DB
 * if you only need to ensure the canonical users/products exist.
 */
export async function seedDatabase(): Promise<void> {
  await execFileAsync(
    "docker",
    ["compose", "exec", "-T", "backend", "python", "-m", "app.seeds.seed"],
    { cwd: REPO_ROOT, timeout: 30_000 },
  );
}
