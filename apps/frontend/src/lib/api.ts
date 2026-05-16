import axios, { AxiosError } from "axios";
import { useAuth } from "../stores/auth";
import type {
  Cart,
  LoginResponse,
  Order,
  Product,
  User,
} from "./types";

const baseURL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = useAuth.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (resp) => resp,
  (err: AxiosError) => {
    if (err.response?.status === 401) {
      const { token, clear } = useAuth.getState();
      if (token) {
        clear();
        if (!window.location.pathname.startsWith("/login")) {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(err);
  },
);

export function extractError(err: unknown, fallback = "Something went wrong"): string {
  if (axios.isAxiosError(err)) {
    const detail = (err.response?.data as { detail?: unknown } | undefined)?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail) && detail.length > 0 && typeof detail[0]?.msg === "string") {
      return detail[0].msg;
    }
  }
  return fallback;
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post<LoginResponse>("/api/auth/login", { email, password }).then((r) => r.data),
  me: () => api.get<User>("/api/auth/me").then((r) => r.data),
  logout: () => api.post("/api/auth/logout").then((r) => r.data),
};

export const productsApi = {
  list: () => api.get<Product[]>("/api/products").then((r) => r.data),
  get: (id: number) => api.get<Product>(`/api/products/${id}`).then((r) => r.data),
};

export const adminProductsApi = {
  create: (data: Omit<Product, "id">) =>
    api.post<Product>("/api/admin/products", data).then((r) => r.data),
  update: (id: number, data: Partial<Omit<Product, "id">>) =>
    api.put<Product>(`/api/admin/products/${id}`, data).then((r) => r.data),
  remove: (id: number) => api.delete(`/api/admin/products/${id}`).then((r) => r.data),
};

export const cartApi = {
  get: () => api.get<Cart>("/api/cart").then((r) => r.data),
  add: (product_id: number, quantity = 1) =>
    api.post<Cart>("/api/cart/items", { product_id, quantity }).then((r) => r.data),
  remove: (item_id: number) =>
    api.delete<Cart>(`/api/cart/items/${item_id}`).then((r) => r.data),
};

export const checkoutApi = {
  submit: () => api.post<Order>("/api/checkout").then((r) => r.data),
};

export const ordersApi = {
  list: () => api.get<Order[]>("/api/orders").then((r) => r.data),
  get: (id: number) => api.get<Order>(`/api/orders/${id}`).then((r) => r.data),
};
