"use client";

import { clearSession, getToken } from "./session";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8080";

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, body: unknown, message?: string) {
    super(message || `API error ${status}`);
    this.status = status;
    this.body = body;
  }
}

async function request<T>(
  path: string,
  options: {
    method?: "GET" | "POST" | "PUT" | "DELETE";
    body?: unknown;
    auth?: boolean;
    params?: Record<string, string | number | undefined | null>;
  } = {}
): Promise<T> {
  const { method = "GET", body, auth = true, params } = options;

  let url = `${API_URL}${path}`;
  if (params) {
    const usp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== "") usp.set(k, String(v));
    }
    const query = usp.toString();
    if (query) url += `?${query}`;
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  if (res.status === 204) return undefined as T;

  let parsed: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }

  if (!res.ok) {
    if (res.status === 401) {
      clearSession();
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    throw new ApiError(res.status, parsed, (parsed as { error?: string })?.error || res.statusText);
  }
  return parsed as T;
}

// ---------- Types ----------
export type AuthResponse = {
  token: string;
  userId: string;
  email: string;
  name: string;
  role: string;
  dealerId: string;
  shopName: string;
  language: string;
};

export type Farmer = {
  id: string;
  name: string;
  phone: string;
  village: string | null;
  crops: string | null;
  outstandingBalance: number;
  createdAt: string;
};

export type StockBatch = {
  id: string;
  batchNo: string | null;
  quantity: number;
  costPrice: number;
  sellingPrice: number;
  expiryDate: string | null;
  supplierName: string | null;
};

export type Product = {
  id: string;
  name: string;
  category: string;
  unit: string;
  hsnCode: string | null;
  gstRate: number;
  stockBatches: StockBatch[];
};

export type LedgerEntry = {
  id: string;
  type: "credit" | "payment";
  amount: number;
  note: string | null;
  billId: string | null;
  farmerId: string;
  farmerName: string;
  farmerPhone: string;
  date: string;
};

export type BillItem = {
  id: string;
  quantity: number;
  unitPrice: number;
  total: number;
  productId: string;
  productName: string;
  batchId: string | null;
};

export type Bill = {
  id: string;
  billNo: string;
  totalAmount: number;
  paidAmount: number;
  creditAmount: number;
  gstAmount: number;
  method: string;
  status: string;
  farmerId: string;
  farmerName: string;
  farmerPhone: string;
  items: BillItem[];
  createdAt: string;
};

export type Dealer = {
  id: string;
  shopName: string;
  ownerName: string;
  phone: string;
  email: string | null;
  address: string | null;
  gstin: string | null;
  language: string;
  plan: string;
  trialEndsAt: string | null;
};

export type Staff = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
};

export type DashboardData = {
  totalFarmers: number;
  totalOutstanding: number;
  todaySales: number;
  monthSales: number;
  expiringStock: number;
  topDebtors: Farmer[];
  recentBills: Bill[];
};

// ---------- API namespaces ----------
export const api = {
  auth: {
    signup: (body: {
      shopName: string;
      ownerName: string;
      phone: string;
      email: string;
      password: string;
      language?: string;
    }) => request<AuthResponse>("/api/auth/signup", { method: "POST", body, auth: false }),
    login: (body: { email: string; password: string }) =>
      request<AuthResponse>("/api/auth/login", { method: "POST", body, auth: false }),
  },
  farmers: {
    list: () => request<Farmer[]>("/api/farmers"),
    create: (body: { name: string; phone: string; village?: string; crops?: string }) =>
      request<Farmer>("/api/farmers", { method: "POST", body }),
    update: (id: string, body: { name: string; phone: string; village?: string; crops?: string }) =>
      request<Farmer>(`/api/farmers/${id}`, { method: "PUT", body }),
    delete: (id: string) => request<void>(`/api/farmers/${id}`, { method: "DELETE" }),
  },
  ledger: {
    list: (params?: { from?: string; to?: string }) =>
      request<LedgerEntry[]>("/api/ledger", { params }),
    addCredit: (body: { farmerId: string; amount: number; note?: string }) =>
      request<LedgerEntry>("/api/ledger/credit", { method: "POST", body }),
    addPayment: (body: { farmerId: string; amount: number; note?: string }) =>
      request<LedgerEntry>("/api/ledger/payment", { method: "POST", body }),
    delete: (id: string) => request<void>(`/api/ledger/${id}`, { method: "DELETE" }),
  },
  products: {
    list: () => request<Product[]>("/api/products"),
    create: (body: {
      name: string;
      category: string;
      unit?: string;
      hsnCode?: string;
      gstRate?: number;
    }) => request<Product>("/api/products", { method: "POST", body }),
    delete: (id: string) => request<void>(`/api/products/${id}`, { method: "DELETE" }),
    addStock: (body: {
      productId: string;
      batchNo?: string;
      quantity: number;
      costPrice: number;
      sellingPrice: number;
      expiryDate?: string;
      supplierName?: string;
    }) => request<StockBatch>("/api/stock", { method: "POST", body }),
    expiring: () => request<{ id: string; batchNo: string | null; expiryDate: string; quantity: number; productName: string }[]>("/api/stock/expiring"),
  },
  bills: {
    list: () => request<Bill[]>("/api/bills"),
    create: (body: {
      farmerId: string;
      items: { productId: string; batchId?: string; quantity: number; unitPrice: number }[];
      method?: string;
      paidAmount?: number;
    }) => request<Bill>("/api/bills", { method: "POST", body }),
    delete: (id: string) => request<void>(`/api/bills/${id}`, { method: "DELETE" }),
  },
  dashboard: {
    overview: () => request<DashboardData>("/api/dashboard"),
  },
  settings: {
    getDealer: () => request<Dealer>("/api/settings/dealer"),
    updateDealer: (body: {
      shopName: string;
      phone?: string;
      email?: string;
      address?: string;
      gstin?: string;
      language?: string;
    }) => request<Dealer>("/api/settings/dealer", { method: "PUT", body }),
    listStaff: () => request<Staff[]>("/api/settings/staff"),
    addStaff: (body: { name: string; email: string; password: string }) =>
      request<Staff>("/api/settings/staff", { method: "POST", body }),
    removeStaff: (id: string) => request<void>(`/api/settings/staff/${id}`, { method: "DELETE" }),
  },
  payment: {
    createOrder: () =>
      request<{ orderId: string; amount: number; currency: string; keyId: string }>(
        "/api/payment/create-order",
        { method: "POST" }
      ),
    verify: (body: {
      razorpayOrderId: string;
      razorpayPaymentId: string;
      razorpaySignature: string;
    }) => request<{ success: boolean }>("/api/payment/verify", { method: "POST", body }),
  },
};
