"use client";

import { api } from "@/lib/api";

export async function createBill(data: {
  farmerId: string;
  items: { productId: string; batchId?: string; quantity: number; unitPrice: number }[];
  method: string;
  paidAmount: number;
}) {
  await api.bills.create(data);
}

export async function deleteBill(id: string) {
  await api.bills.delete(id);
}
