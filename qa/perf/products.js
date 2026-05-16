import http from "k6/http";
import { check, sleep } from "k6";
import { BASE_URL } from "./lib/config.js";

export const options = {
  scenarios: {
    products_list: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "10s", target: 10 },
        { duration: "20s", target: 10 },
        { duration: "5s", target: 0 },
      ],
      gracefulRampDown: "5s",
    },
  },
  thresholds: {
    "http_req_duration{endpoint:products_list}": ["p(95)<500"],
    "http_req_failed{endpoint:products_list}": ["rate<0.01"],
  },
};

export default function () {
  const res = http.get(`${BASE_URL}/api/products`, {
    tags: { endpoint: "products_list" },
  });

  check(res, {
    "status is 200": (r) => r.status === 200,
    "returns at least one product": (r) => Array.isArray(r.json()) && r.json().length > 0,
  });

  sleep(1);
}
