"use client";

import { api } from "@/lib/api";

export async function createProduct(formData: FormData) {
  await api.products.create({
    name: formData.get("name") as string,
    category: formData.get("category") as string,
    unit: (formData.get("unit") as string) || "kg",
    hsnCode: (formData.get("hsnCode") as string) || undefined,
    gstRate: Number(formData.get("gstRate")) || 0,
  });
}

export async function deleteProduct(id: string) {
  await api.products.delete(id);
}

export async function addStock(formData: FormData) {
  await api.products.addStock({
    productId: formData.get("productId") as string,
    batchNo: (formData.get("batchNo") as string) || undefined,
    quantity: Number(formData.get("quantity")),
    costPrice: Number(formData.get("costPrice")),
    sellingPrice: Number(formData.get("sellingPrice")),
    expiryDate: formData.get("expiryDate")
      ? new Date(formData.get("expiryDate") as string).toISOString()
      : undefined,
    supplierName: (formData.get("supplierName") as string) || undefined,
  });
}
