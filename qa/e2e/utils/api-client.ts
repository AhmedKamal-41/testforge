import type { APIRequestContext, APIResponse } from "@playwright/test";

export type Role = "user" | "admin";

export type User = {
  id: number;
  email: string;
  full_name: string;
  role: Role;
};

export type Product = {
  id: number;
  name: string;
  description: string;
  price: string;
  stock: number;
  category: string;
  image_url: string;
};

export type CartItem = {
  id: number;
  product: Product;
  quantity: number;
  line_total: string;
};

export type Cart = { items: CartItem[]; total: string };

export type OrderItem = {
  id: number;
  product_id: number;
  product_name: string;
  unit_price: string;
  quantity: number;
};

export type Order = {
  id: number;
  total: string;
  status: string;
  created_at: string;
  items: OrderItem[];
};

export type ProductCreate = Omit<Product, "id">;
export type ProductUpdate = Partial<ProductCreate>;

function unwrap<T>(resp: APIResponse, label: string): Promise<T> {
  if (!resp.ok()) {
    return resp.text().then((body) => {
      throw new Error(`${label} failed: ${resp.status()} ${resp.statusText()} — ${body}`);
    });
  }
  return resp.json() as Promise<T>;
}

export class ApiClient {
  private token: string | null = null;

  constructor(private readonly request: APIRequestContext) {}

  get authHeaders(): Record<string, string> {
    return this.token ? { Authorization: `Bearer ${this.token}` } : {};
  }

  setToken(token: string | null): void {
    this.token = token;
  }

  getToken(): string | null {
    return this.token;
  }

  async login(email: string, password: string): Promise<{ access_token: string }> {
    const resp = await this.request.post("/api/auth/login", { data: { email, password } });
    const body = await unwrap<{ access_token: string; token_type: "bearer" }>(resp, "login");
    this.token = body.access_token;
    return { access_token: body.access_token };
  }

  async me(): Promise<User> {
    const resp = await this.request.get("/api/auth/me", { headers: this.authHeaders });
    return unwrap<User>(resp, "auth/me");
  }

  async listProducts(): Promise<Product[]> {
    const resp = await this.request.get("/api/products");
    return unwrap<Product[]>(resp, "listProducts");
  }

  async getProduct(id: number): Promise<Product> {
    const resp = await this.request.get(`/api/products/${id}`);
    return unwrap<Product>(resp, `getProduct(${id})`);
  }

  async createProduct(data: ProductCreate): Promise<Product> {
    const resp = await this.request.post("/api/admin/products", {
      headers: this.authHeaders,
      data,
    });
    return unwrap<Product>(resp, "createProduct");
  }

  async updateProduct(id: number, data: ProductUpdate): Promise<Product> {
    const resp = await this.request.put(`/api/admin/products/${id}`, {
      headers: this.authHeaders,
      data,
    });
    return unwrap<Product>(resp, `updateProduct(${id})`);
  }

  async deleteProduct(id: number): Promise<void> {
    const resp = await this.request.delete(`/api/admin/products/${id}`, {
      headers: this.authHeaders,
    });
    if (!resp.ok()) {
      const body = await resp.text();
      throw new Error(`deleteProduct(${id}) failed: ${resp.status()} — ${body}`);
    }
  }

  async getCart(): Promise<Cart> {
    const resp = await this.request.get("/api/cart", { headers: this.authHeaders });
    return unwrap<Cart>(resp, "getCart");
  }

  async addCartItem(productId: number, quantity = 1): Promise<Cart> {
    const resp = await this.request.post("/api/cart/items", {
      headers: this.authHeaders,
      data: { product_id: productId, quantity },
    });
    return unwrap<Cart>(resp, "addCartItem");
  }

  async removeCartItem(itemId: number): Promise<Cart> {
    const resp = await this.request.delete(`/api/cart/items/${itemId}`, {
      headers: this.authHeaders,
    });
    return unwrap<Cart>(resp, `removeCartItem(${itemId})`);
  }

  /** Empty the authenticated user's cart by deleting each line item. */
  async clearCart(): Promise<Cart> {
    const cart = await this.getCart();
    let latest: Cart = cart;
    for (const item of cart.items) {
      latest = await this.removeCartItem(item.id);
    }
    return latest;
  }

  async checkout(): Promise<Order> {
    const resp = await this.request.post("/api/checkout", { headers: this.authHeaders });
    return unwrap<Order>(resp, "checkout");
  }

  async listOrders(): Promise<Order[]> {
    const resp = await this.request.get("/api/orders", { headers: this.authHeaders });
    return unwrap<Order[]>(resp, "listOrders");
  }

  async getOrder(id: number): Promise<Order> {
    const resp = await this.request.get(`/api/orders/${id}`, { headers: this.authHeaders });
    return unwrap<Order>(resp, `getOrder(${id})`);
  }

  async health(): Promise<{ status: string }> {
    const resp = await this.request.get("/health");
    return unwrap<{ status: string }>(resp, "health");
  }
}
