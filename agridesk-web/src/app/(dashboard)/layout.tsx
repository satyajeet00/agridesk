"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/dashboard/sidebar";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { TrialBanner } from "@/components/dashboard/trial-banner";
import { getSession } from "@/lib/session";
import { api, type Dealer } from "@/lib/api";
import { computeSubscriptionStatus } from "@/lib/subscription";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [shopName, setShopName] = useState("My Shop");
  const [language, setLanguage] = useState("hi");
  const [dealer, setDealer] = useState<Dealer | null>(null);

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace("/login");
      return;
    }
    setShopName(session.shopName || "My Shop");
    setLanguage(session.language || "hi");

    api.settings
      .getDealer()
      .then((d) => setDealer(d))
      .catch(() => {})
      .finally(() => setReady(true));
  }, [router]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-gray-400">
        लोड हो रहा है…
      </div>
    );
  }

  const sub = computeSubscriptionStatus(dealer);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar shopName={shopName} language={language} />
      <MobileNav shopName={shopName} language={language} />
      <main className="md:pl-64">
        <div className="p-5 md:p-8 max-w-[1400px] mx-auto space-y-5">
          <TrialBanner status={sub.status} daysLeft={sub.daysLeft} />
          {children}
        </div>
      </main>
    </div>
  );
}
