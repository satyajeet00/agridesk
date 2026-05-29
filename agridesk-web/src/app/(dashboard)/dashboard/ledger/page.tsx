"use client";

import { useCallback, useEffect, useState } from "react";
import { api, type Farmer, type LedgerEntry } from "@/lib/api";
import { LedgerClient } from "./ledger-client";
import LedgerLoading from "./loading";

export default function LedgerPage() {
  const [farmers, setFarmers] = useState<Farmer[] | null>(null);
  const [entries, setEntries] = useState<LedgerEntry[] | null>(null);

  const refresh = useCallback(async () => {
    const [f, e] = await Promise.all([api.farmers.list(), api.ledger.list()]);
    setFarmers(f);
    setEntries(e);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (!farmers || !entries) return <LedgerLoading />;

  const totalOutstanding = farmers.reduce((sum, f) => sum + (f.outstandingBalance || 0), 0);
  const ledgerEntries = entries.map((e) => ({
    id: e.id,
    type: e.type,
    amount: e.amount,
    note: e.note,
    farmerId: e.farmerId,
    date: e.date,
    farmer: { name: e.farmerName, phone: e.farmerPhone },
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-green-950">उधारी खाता / Credit Ledger</h1>
        <p className="text-sm text-gray-500 mt-1">सभी किसानों की उधारी और भुगतान यहाँ ट्रैक करें।</p>
      </div>
      <LedgerClient
        farmers={farmers}
        entries={ledgerEntries}
        totalOutstanding={totalOutstanding}
        onRefresh={refresh}
      />
    </div>
  );
}
