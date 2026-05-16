import { copyFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { request } from "@playwright/test";

const ALLURE_RESULTS = path.resolve(__dirname, "allure-results");
const ALLURE_CATEGORIES_SRC = path.resolve(__dirname, "allure", "categories.json");

async function writeAllureEnvironment(baseURL: string): Promise<void> {
  const props = [
    `BASE_URL=${baseURL}`,
    `OS=${process.platform}`,
    `NODE=${process.version}`,
    `CI=${process.env.CI ? "true" : "false"}`,
    `RUN_AT=${new Date().toISOString()}`,
  ].join("\n");

  await mkdir(ALLURE_RESULTS, { recursive: true });
  await writeFile(path.join(ALLURE_RESULTS, "environment.properties"), `${props}\n`);
  await copyFile(ALLURE_CATEGORIES_SRC, path.join(ALLURE_RESULTS, "categories.json"));
}

async function globalSetup() {
  const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5173";
  const ctx = await request.newContext({ baseURL });
  try {
    const resp = await ctx.get("/health", { timeout: 5_000 });
    if (!resp.ok()) {
      throw new Error(`/health returned ${resp.status()}`);
    }
    const body = await resp.json();
    if (body?.status !== "ok") {
      throw new Error(`/health body unexpected: ${JSON.stringify(body)}`);
    }
    console.log(`[global-setup] stack healthy at ${baseURL}`);
    await writeAllureEnvironment(baseURL);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Health check failed against ${baseURL}: ${msg}\n` +
        `Bring the stack up before running tests:\n` +
        `  cd <repo root>\n` +
        `  docker compose up --build`,
    );
  } finally {
    await ctx.dispose();
  }
}

export default globalSetup;
