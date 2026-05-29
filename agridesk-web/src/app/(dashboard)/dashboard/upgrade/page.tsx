"use client";

import { useEffect, useState } from "react";
import { api, type Dealer } from "@/lib/api";
import { computeSubscriptionStatus } from "@/lib/subscription";
import { UpgradeClient } from "./upgrade-client";

export default function UpgradePage() {
  const [dealer, setDealer] = useState<Dealer | null>(null);

  useEffect(() => {
    api.settings.getDealer().then(setDealer).catch(() => {});
  }, []);

  if (!dealer) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-green-950">प्लान अपग्रेड करें / Upgrade</h1>
          <p className="text-sm text-gray-500 mt-1">सभी फीचर्स अनलॉक करें।</p>
        </div>
        <p className="text-sm text-gray-400">लोड हो रहा है…</p>
      </div>
    );
  }

  const sub = computeSubscriptionStatus(dealer);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-green-950">प्लान अपग्रेड करें / Upgrade</h1>
        <p className="text-sm text-gray-500 mt-1">सभी फीचर्स अनलॉक करें।</p>
      </div>
      <UpgradeClient
        status={sub.status}
        daysLeft={sub.daysLeft}
        dealerId={dealer.id}
      />
    </div>
  );
}
