"use client";

import { api } from "@/lib/api";

export async function addCredit(farmerId: string, amount: number, note: string) {
  await api.ledger.addCredit({ farmerId, amount, note: note || undefined });
}

export async function addPayment(farmerId: string, amount: number, note: string) {
  await api.ledger.addPayment({ farmerId, amount, note: note || undefined });
}

export async function deleteEntry(id: string, _farmerId: string, _type: string, _amount: number) {
  await api.ledger.delete(id);
}
