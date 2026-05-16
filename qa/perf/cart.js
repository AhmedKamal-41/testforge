import http from "k6/http";
import { check, sleep } from "k6";
import { BASE_URL, JSON_HEADERS, USER, authHeaders } from "./lib/config.js";

export const options = {
  scenarios: {
    cart_add: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "5s", target: 5 },
        { duration: "20s", target: 5 },
        { duration: "5s", target: 0 },
      ],
      gracefulRampDown: "5s",
    },
  },
  thresholds: {
    "http_req_duration{endpoint:cart_add}": ["p(95)<500"],
    "http_req_failed{endpoint:cart_add}": ["rate<0.01"],
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
  const token = loginRes.json("access_token");

  const productsRes = http.get(`${BASE_URL}/api/products`);
  if (productsRes.status !== 200) {
    throw new Error(`setup products fetch failed: ${productsRes.status}`);
  }
  const products = productsRes.json();
  if (!Array.isArray(products) || products.length === 0) {
    throw new Error("setup found no products to add");
  }

  return { token, productIds: products.map((p) => p.id) };
}

export default function (data) {
  const productId = data.productIds[Math.floor(Math.random() * data.productIds.length)];

  const res = http.post(
    `${BASE_URL}/api/cart/items`,
    JSON.stringify({ product_id: productId, quantity: 1 }),
    {
      headers: authHeaders(data.token),
      tags: { endpoint: "cart_add" },
    },
  );

  check(res, {
    "status is 200": (r) => r.status === 200,
    "cart total is a number": (r) => !isNaN(parseFloat(r.json("total"))),
  });

  sleep(1);
}
