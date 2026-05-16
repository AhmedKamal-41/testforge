// Shared config for k6 scripts.
// All values are overridable from the CLI, e.g.:
//   k6 run -e BASE_URL=https://staging.example.com qa/perf/products.js
//
// DEMO-ONLY defaults below — `user@shoplite.io / user1234` is a fake seed
// account that only exists in the local Dockerized dev database. Override
// via SHOPLITE_USER_EMAIL / SHOPLITE_USER_PASSWORD env vars for any other
// target.

export const BASE_URL = __ENV.BASE_URL || "http://localhost:8000";

export const USER = {
  email: __ENV.SHOPLITE_USER_EMAIL || "user@shoplite.io",
  password: __ENV.SHOPLITE_USER_PASSWORD || "user1234",
};

export const JSON_HEADERS = { "Content-Type": "application/json" };

export function authHeaders(token) {
  return { ...JSON_HEADERS, Authorization: `Bearer ${token}` };
}
