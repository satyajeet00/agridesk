"use client";

import { useCallback, useEffect, useState } from "react";
import { api, type Dealer, type Staff } from "@/lib/api";
import { SettingsClient } from "./settings-client";
import SettingsLoading from "./loading";

export default function SettingsPage() {
  const [dealer, setDealer] = useState<Dealer | null>(null);
  const [staff, setStaff] = useState<Staff[] | null>(null);

  const refresh = useCallback(async () => {
    const [d, s] = await Promise.all([api.settings.getDealer(), api.settings.listStaff()]);
    setDealer(d);
    setStaff(s);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (!dealer || !staff) return <SettingsLoading />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-green-950">सेटिंग्स / Settings</h1>
        <p className="text-sm text-gray-500 mt-1">दुकान की जानकारी और स्टाफ मैनेज करें।</p>
      </div>
      <SettingsClient dealer={dealer} staff={staff} onRefresh={refresh} />
    </div>
  );
}
