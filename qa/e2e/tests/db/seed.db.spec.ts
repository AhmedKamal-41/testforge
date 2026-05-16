import { expect, test } from "../../fixtures/test";
import { accounts, seededProductNames } from "../../factories/test-data";
import { resetDatabase } from "../../utils/db-utils";
import { queryRows } from "../../utils/db-client";

test.describe("seed @db", () => {
  test.beforeAll(async () => {
    await resetDatabase();
  });

  test("seeded users exist in the users table with the correct roles", async () => {
    const rows = await queryRows<{ email: string; role: string }>(
      "SELECT email, role FROM users WHERE email = ANY($1) ORDER BY email",
      [[accounts.admin.email, accounts.user.email, "alice@shoplite.io"]],
    );

    expect(rows).toEqual([
      { email: accounts.admin.email, role: "admin" },
      { email: "alice@shoplite.io", role: "user" },
      { email: accounts.user.email, role: "user" },
    ]);
  });

  test("seeded products table contains every catalog item the factory tracks", async () => {
    const rows = await queryRows<{ count: string }>("SELECT COUNT(*)::text AS count FROM products");
    expect(Number(rows[0].count)).toBe(seededProductNames.length);

    const names = await queryRows<{ name: string }>(
      "SELECT name FROM products WHERE name = ANY($1)",
      [seededProductNames as unknown as string[]],
    );
    expect(names.length).toBe(seededProductNames.length);
  });
});
