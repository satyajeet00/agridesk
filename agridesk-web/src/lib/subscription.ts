import type { Dealer } from "./api";

export type SubscriptionStatus = "trial" | "active" | "expired";

export function computeSubscriptionStatus(dealer: Dealer | null): {
  status: SubscriptionStatus;
  daysLeft: number;
  plan: string;
} {
  if (!dealer) {
    return { status: "expired", daysLeft: 0, plan: "expired" };
  }

  if (dealer.plan === "active") {
    return { status: "active", daysLeft: 0, plan: "active" };
  }

  if (dealer.trialEndsAt) {
    const endsAt = new Date(dealer.trialEndsAt).getTime();
    const now = Date.now();
    const msLeft = endsAt - now;
    const daysLeft = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
    if (msLeft <= 0) {
      return { status: "expired", daysLeft: 0, plan: "expired" };
    }
    return { status: "trial", daysLeft, plan: "trial" };
  }

  return { status: "trial", daysLeft: 0, plan: dealer.plan ?? "trial" };
}
