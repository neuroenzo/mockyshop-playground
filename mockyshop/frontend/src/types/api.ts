// --- Auth ---
export interface LoginRequest {
  username: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

// --- User ---
export interface User {
  id: number;
  email: string;
  is_active: boolean;
  role: "buyer" | "seller" | "admin";
}

export interface UserCreate {
  email: string;
  password: string;
  role?: "buyer" | "seller";
}

export interface UserAdminCreate {
  email: string;
  password: string;
  role: "buyer" | "seller" | "admin";
}

export interface UserUpdate {
  email?: string;
  password?: string;
}

export interface UserRoleUpdate {
  role: "buyer" | "seller" | "admin";
}

export interface UserFilter {
  search?: string;
  role?: string;
  is_active?: boolean;
  sort_by?: "email" | "role" | "id_asc" | "id_desc";
  page?: number;
  size?: number;
}

export interface UserPaginatedResponse {
  items: User[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

// --- Category ---
export interface Category {
  id: number;
  name: string;
  parent_id: number | null;
  is_active: boolean;
}

export interface CategoryCreate {
  name: string;
  parent_id?: number | null;
}

// --- Product ---
export interface Product {
  id: number;
  name: string;
  description: string | null;
  price: string;
  image_url: string | null;
  stock: number;
  category_id: number;
  is_active: boolean;
  created_at: string;
}

export interface ProductCreate {
  name: string;
  description?: string | null;
  price: string;
  image_url?: string | null;
  stock: number;
  category_id: number;
}

export interface ProductFilter {
  search?: string;
  category_id?: number;
  min_price?: string;
  max_price?: string;
  is_active?: boolean;
  sort_by?: "price_asc" | "price_desc" | "name_asc" | "name_desc" | "newest" | "oldest";
  page?: number;
  size?: number;
}

export interface ProductPaginatedResponse {
  items: Product[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

// --- Product Image ---
export interface ProductImage {
  id: number;
  product_id: number;
  image_url: string;
  original_filename: string | null;
  is_main: boolean;
  sort_order: number;
  uploaded_at: string;
}

export interface UploadImageResponse {
  images: ProductImage[];
}

// --- Cart ---
export interface CartItemCreate {
  product_id: number;
  quantity: number;
}

export interface CartItemResponse {
  id: number;
  product_id: number;
  quantity: number;
  product: Record<string, unknown>;
}

export interface CartResponse {
  id: number;
  items: CartItemResponse[];
  total_amount: string;
  total_items: number;
}

// --- Order ---
export interface OrderCreate {
  // empty body
}

export interface OrderItemResponse {
  id: number;
  product_id: number;
  quantity: number;
  price: string;
  product: Record<string, unknown>;
}

export interface OrderResponse {
  id: number;
  user_id: number;
  status: string;
  total_amount: string;
  created_at: string;
  items: OrderItemResponse[];
}

export interface OrderStatusUpdate {
  status: "paid" | "shipped" | "delivered" | "cancelled";
}

export interface OrderFilter {
  status?: string;
  user_id?: number;
  min_amount?: string;
  max_amount?: string;
  created_from?: string;
  created_to?: string;
  sort_by?: "newest" | "oldest" | "amount_asc" | "amount_desc";
  page?: number;
  size?: number;
}

export interface OrderPaginatedResponse {
  items: OrderResponse[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

// --- Payment ---
export interface CheckoutItemResponse {
  product_id: number;
  name: string;
  quantity: number;
  unit_price: string;
  total_price: string;
}

export interface CheckoutResponse {
  order_id: number;
  status: string;
  total_amount: string;
  items: CheckoutItemResponse[];
  message: string;
}

export interface PaymentCreate {
  payment_method: "card" | "cash" | "mock";
}

export interface PaymentResponse {
  id: number;
  order_id: number;
  amount: string;
  status: string;
  payment_method: string;
  transaction_id: string;
  paid_at: string | null;
  created_at: string;
}

// --- Pagination helpers ---
export interface PaginationParams {
  page: number;
  size: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}
