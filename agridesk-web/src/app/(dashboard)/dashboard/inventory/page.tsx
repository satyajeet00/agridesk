"use client";

import { useCallback, useEffect, useState } from "react";
import { api, type Product } from "@/lib/api";
import { InventoryClient } from "./inventory-client";
import InventoryLoading from "./loading";

type ExpiringBatch = {
  id: string;
  batchNo: string | null;
  expiryDate: string;
  quantity: number;
  product: { name: string };
};

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [expiring, setExpiring] = useState<ExpiringBatch[] | null>(null);

  const refresh = useCallback(async () => {
    const [p, e] = await Promise.all([api.products.list(), api.products.expiring()]);
    setProducts(p);
    setExpiring(e.map((b) => ({ ...b, product: { name: b.productName } })));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (!products || !expiring) return <InventoryLoading />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-green-950">स्टॉक / Inventory</h1>
        <p className="text-sm text-gray-500 mt-1">प्रोडक्ट, बैच, और एक्सपायरी ट्रैक करें।</p>
      </div>
      <InventoryClient
        products={products}
        expiringBatches={expiring}
        onRefresh={refresh}
      />
    </div>
  );
}
