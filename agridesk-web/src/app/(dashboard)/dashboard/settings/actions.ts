"use client";

import { api } from "@/lib/api";

export async function updateDealer(formData: FormData) {
  await api.settings.updateDealer({
    shopName: formData.get("shopName") as string,
    phone: (formData.get("phone") as string) || undefined,
    email: (formData.get("email") as string) || undefined,
    address: (formData.get("address") as string) || undefined,
    gstin: (formData.get("gstin") as string) || undefined,
    language: (formData.get("language") as string) || "hi",
  });
}

export async function addStaff(formData: FormData) {
  await api.settings.addStaff({
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  });
}

export async function removeStaff(id: string) {
  await api.settings.removeStaff(id);
}
