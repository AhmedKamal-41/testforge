import { Pool, type QueryResult, type QueryResultRow } from "pg";

const pool = new Pool({
  host: process.env.PGHOST ?? "127.0.0.1",
  port: Number(process.env.PGPORT ?? 5433),
  user: process.env.PGUSER ?? "shoplite",
  password: process.env.PGPASSWORD ?? "shoplite",
  database: process.env.PGDATABASE ?? "shoplite",
  max: 4,
  idleTimeoutMillis: 1000,
  allowExitOnIdle: true,
});

export async function queryRows<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: ReadonlyArray<unknown> = [],
): Promise<T[]> {
  const result: QueryResult<T> = await pool.query<T>(text, [...params]);
  return result.rows;
}

export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: ReadonlyArray<unknown> = [],
): Promise<T | null> {
  const rows = await queryRows<T>(text, params);
  return rows[0] ?? null;
}
