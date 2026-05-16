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

export type Cart = {
  items: CartItem[];
  total: string;
};

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

export type LoginResponse = {
  access_token: string;
  token_type: "bearer";
};

export type ApiError = {
  detail: string;
};
