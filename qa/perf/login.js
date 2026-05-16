import http from "k6/http";
import { check, sleep } from "k6";
import { BASE_URL, JSON_HEADERS, USER } from "./lib/config.js";

export const options = {
  scenarios: {
    auth_login: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "10s", target: 5 },
        { duration: "20s", target: 5 },
        { duration: "5s", target: 0 },
      ],
      gracefulRampDown: "5s",
    },
  },
  thresholds: {
    "http_req_duration{endpoint:auth_login}": ["p(95)<500"],
    "http_req_failed{endpoint:auth_login}": ["rate<0.01"],
  },
};

export default function () {
  const res = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ email: USER.email, password: USER.password }),
    {
      headers: JSON_HEADERS,
      tags: { endpoint: "auth_login" },
    },
  );

  check(res, {
    "status is 200": (r) => r.status === 200,
    "returns access_token": (r) => r.json("access_token") !== undefined,
  });

  sleep(1);
}
