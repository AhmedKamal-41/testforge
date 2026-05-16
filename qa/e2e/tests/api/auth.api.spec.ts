import { expect, test } from "../../fixtures/test";
import { accounts } from "../../factories/test-data";
import { resetDatabase } from "../../utils/db-utils";

test.describe("auth API @api", () => {
  test.beforeAll(async () => {
    await resetDatabase();
  });

  test("POST /api/auth/login returns 200 and a bearer token for valid credentials", async ({
    request,
  }) => {
    const resp = await request.post("/api/auth/login", {
      data: { email: accounts.user.email, password: accounts.user.password },
    });

    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(typeof body.access_token).toBe("string");
    expect(body.access_token.length).toBeGreaterThan(20);
    expect(body.token_type).toBe("bearer");
  });

  test("POST /api/auth/login returns 401 for a wrong password", async ({ request }) => {
    const resp = await request.post("/api/auth/login", {
      data: { email: accounts.user.email, password: "totally-wrong" },
    });

    expect(resp.status()).toBe(401);
    const body = await resp.json();
    expect(body.detail).toBe("invalid email or password");
  });

  test("POST /api/auth/login returns 422 when the email field is missing", async ({
    request,
  }) => {
    const resp = await request.post("/api/auth/login", {
      data: { password: "anything" },
    });

    expect(resp.status()).toBe(422);
    const body = await resp.json();
    expect(Array.isArray(body.detail)).toBe(true);
    expect(body.detail.some((e: { loc: string[] }) => e.loc.includes("email"))).toBe(true);
  });

  test("GET /api/auth/me returns 401 without a token", async ({ request }) => {
    const resp = await request.get("/api/auth/me");

    expect(resp.status()).toBe(401);
  });

  test("GET /api/auth/me returns the authenticated user's profile", async ({
    request,
    userAuth,
  }) => {
    const resp = await request.get("/api/auth/me", {
      headers: { Authorization: `Bearer ${userAuth.token}` },
    });

    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.id).toBe(userAuth.user.id);
    expect(body.email).toBe(accounts.user.email);
    expect(body.role).toBe("user");
    expect(typeof body.full_name).toBe("string");
  });
});
