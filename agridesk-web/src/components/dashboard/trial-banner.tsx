import Link from "next/link";
import { AlertTriangle, Crown } from "lucide-react";
import type { SubscriptionStatus } from "@/lib/subscription";

export function TrialBanner({ status, daysLeft }: { status: SubscriptionStatus; daysLeft: number }) {
  if (status === "active") return null;

  if (status === "expired") {
    return (
      <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
          <p className="text-sm text-red-700">
            <span className="font-semibold">ट्राई खत्म!</span> डेटा सुरक्षित है। फीचर्स चालू करने के लिए सब्सक्राइब करें।
          </p>
        </div>
        <Link href="/dashboard/upgrade" className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg px-4 py-2 transition-colors shrink-0">
          <Crown className="h-3.5 w-3.5" /> अभी सब्सक्राइब करें
        </Link>
      </div>
    );
  }

  if (daysLeft <= 5) {
    return (
      <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Crown className="h-4 w-4 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-700">
            <span className="font-semibold">फ्री ट्राई — {daysLeft} दिन बाकी।</span> ट्राई खत्म होने से पहले सब्सक्राइब करें।
          </p>
        </div>
        <Link href="/dashboard/upgrade" className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium rounded-lg px-4 py-2 transition-colors shrink-0">
          <Crown className="h-3.5 w-3.5" /> ₹499/महीना
        </Link>
      </div>
    );
  }

  return null;
}
