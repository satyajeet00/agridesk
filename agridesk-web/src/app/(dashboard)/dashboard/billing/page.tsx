"use client";

import { useCallback, useEffect, useState } from "react";
import { api, type Bill, type Farmer, type Product } from "@/lib/api";
import { BillingClient } from "./billing-client";
import BillingLoading from "./loading";

export default function BillingPage() {
  const [bills, setBills] = useState<Bill[] | null>(null);
  const [farmers, setFarmers] = useState<Farmer[] | null>(null);
  const [products, setProducts] = useState<Product[] | null>(null);

  const refresh = useCallback(async () => {
    const [b, f, p] = await Promise.all([
      api.bills.list(),
      api.farmers.list(),
      api.products.list(),
    ]);
    setBills(b);
    setFarmers(f);
    setProducts(p);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (!bills || !farmers || !products) return <BillingLoading />;

  const billsForClient = bills.map((b) => ({
    id: b.id,
    billNo: b.billNo,
    totalAmount: b.totalAmount,
    paidAmount: b.paidAmount,
    creditAmount: b.creditAmount,
    gstAmount: b.gstAmount,
    method: b.method,
    status: b.status,
    farmerId: b.farmerId,
    createdAt: b.createdAt,
    farmer: { name: b.farmerName, phone: b.farmerPhone },
    items: b.items.map((i) => ({
      id: i.id,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      total: i.total,
      product: { name: i.productName },
    })),
  }));

  const productsForClient = products.map((p) => ({
    id: p.id,
    name: p.name,
    unit: p.unit,
    gstRate: p.gstRate,
    stockBatches: p.stockBatches
      .filter((b) => b.quantity > 0)
      .map((b) => ({
        id: b.id,
        batchNo: b.batchNo,
        quantity: b.quantity,
        sellingPrice: b.sellingPrice,
        expiryDate: b.expiryDate,
      })),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-green-950">बिलिंग / Billing</h1>
        <p className="text-sm text-gray-500 mt-1">बिल बनाएं और ट्रैक करें।</p>
      </div>
      <BillingClient
        bills={billsForClient}
        farmers={farmers.map((f) => ({ id: f.id, name: f.name, phone: f.phone }))}
        products={productsForClient}
        onRefresh={refresh}
      />
    </div>
  );
}
