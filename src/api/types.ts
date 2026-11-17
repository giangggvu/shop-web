export type Role = "CUSTOMER" | "ADMIN";

export interface User {
  id: number;
  email: string;
  fullName: string;
  role: Role;
}

export interface TokenResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  stock: number;
  imageUrl: string | null;
  active: boolean;
  category: Category;
}

export interface Page<T> {
  items: T[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
}

export interface CartLine {
  productId: number;
  name: string;
  slug: string;
  imageUrl: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  stock: number;
}

export interface Cart {
  items: CartLine[];
  total: number;
  itemCount: number;
}

export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "SHIPPING"
  | "COMPLETED"
  | "CANCELLED";

export interface OrderLine {
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface Payment {
  bankId: string;
  accountNo: string;
  accountName: string | null;
  amount: number;
  transferContent: string;
  qrImageUrl: string;
}

export interface Order {
  code: string;
  status: OrderStatus;
  total: number;
  recipientName: string;
  phone: string;
  address: string;
  note: string | null;
  createdAt: string;
  paidAt: string | null;
  items: OrderLine[];
  payment: Payment | null;
}

export interface OrderSummary {
  code: string;
  status: OrderStatus;
  total: number;
  createdAt: string;
}

export interface Problem {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  errors?: Record<string, string>;
}
