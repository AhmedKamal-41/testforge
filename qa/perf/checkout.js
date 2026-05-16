// Checkout latency — smoke-load profile.
//
// Profile choice: 1 VU. The seeded backend has a single test user shared
// across all VUs (there's no public registration endpoint), so a multi-VU
// checkout journey would race on the same cart row — one iteration's
// checkout would drain items another iteration just added, producing
// spurious empty-cart 400s that aren't a real latency signal.
//
// At 1 VU each iteration is self-contained: clear cart → add → checkout.
// Threshold gates only the POST /api/checkout call (`endpoint:checkout`).
// This is a smoke-load benchmark, not production capacity testing.

import http from "k6/http";
import { check, sleep } from "k6";
import { BASE_URL, JSON_HEADERS, USER, authHeaders } from "./lib/config.js";

export const options = {
  scenarios: {
    checkout_journey: {
      executor: "constant-vus",
      vus: 1,
      duration: "30s",
    },
  },
  thresholds: {
    "http_req_duration{endpoint:checkout}": ["p(95)<800"],
    "http_req_failed{endpoint:checkout}": ["rate<0.01"],
  },
};

export function setup() {
  const loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ email: USER.email, password: USER.password }),
    { headers: JSON_HEADERS },
  );
  if (loginRes.status !== 200) {
    throw new Error(`setup login failed: ${loginRes.status} ${loginRes.body}`);
  }

  const productsRes = http.get(`${BASE_URL}/api/products`);
  if (productsRes.status !== 200) {
    throw new Error(`setup products fetch failed: ${productsRes.status}`);
  }
  const products = productsRes.json();

  return {
    token: loginRes.json("access_token"),
    productIds: products.map((p) => p.id),
  };
}

function clearCart(headers) {
  const cart = http.get(`${BASE_URL}/api/cart`, { headers });
  if (cart.status !== 200) return;
  const items = cart.json("items") || [];
  for (const item of items) {
    http.del(`${BASE_URL}/api/cart/items/${item.id}`, null, {
      headers,
      tags: { endpoint: "cart_clear_setup" },
    });
  }
}

export default function (data) {
  const headers = authHeaders(data.token);
  const productId = data.productIds[Math.floor(Math.random() * data.productIds.length)];

  clearCart(headers);

  http.post(
    `${BASE_URL}/api/cart/items`,
    JSON.stringify({ product_id: productId, quantity: 1 }),
    { headers, tags: { endpoint: "cart_add_setup" } },
  );

  const checkoutRes = http.post(`${BASE_URL}/api/checkout`, null, {
    headers,
    tags: { endpoint: "checkout" },
  });

  check(checkoutRes, {
    "checkout status is 201": (r) => r.status === 201,
    "returns order id": (r) => Number.isInteger(r.json("id")),
  });

  sleep(1);
}
