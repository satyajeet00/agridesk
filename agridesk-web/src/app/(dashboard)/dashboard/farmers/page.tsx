"use client";

import { useCallback, useEffect, useState } from "react";
import { api, type Farmer } from "@/lib/api";
import { FarmersClient } from "./farmers-client";
import FarmersLoading from "./loading";

export default function FarmersPage() {
  const [farmers, setFarmers] = useState<Farmer[] | null>(null);

  const refresh = useCallback(async () => {
    const f = await api.farmers.list();
    setFarmers(f);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (!farmers) return <FarmersLoading />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-green-950">किसान / Farmers</h1>
        <p className="text-sm text-gray-500 mt-1">अपने सभी किसानों को यहाँ मैनेज करें।</p>
      </div>
      <FarmersClient farmers={farmers} onRefresh={refresh} />
    </div>
  );
}
