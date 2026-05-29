"use client";

import { api } from "@/lib/api";

export async function createFarmer(formData: FormData) {
  await api.farmers.create({
    name: formData.get("name") as string,
    phone: formData.get("phone") as string,
    village: (formData.get("village") as string) || undefined,
    crops: (formData.get("crops") as string) || undefined,
  });
}

export async function updateFarmer(id: string, formData: FormData) {
  await api.farmers.update(id, {
    name: formData.get("name") as string,
    phone: formData.get("phone") as string,
    village: (formData.get("village") as string) || undefined,
    crops: (formData.get("crops") as string) || undefined,
  });
}

export async function deleteFarmer(id: string) {
  await api.farmers.delete(id);
}
