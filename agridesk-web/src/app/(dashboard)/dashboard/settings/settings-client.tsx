"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DeleteConfirm } from "@/components/delete-confirm";
import { Plus, Trash2, Shield, Crown, User } from "lucide-react";
import { updateDealer, addStaff, removeStaff } from "./actions";
import { toast } from "sonner";

interface Dealer { id: string; shopName: string; ownerName: string; phone: string; email: string | null; address: string | null; gstin: string | null; language: string; plan: string; trialEndsAt: string | null; }
interface Staff { id: string; name: string; email: string; role: string; createdAt: string; }

export function SettingsClient({ dealer, staff, onRefresh }: { dealer: Dealer; staff: Staff[]; onRefresh: () => Promise<void> }) {
  const [loading, setLoading] = useState(false);
  const [staffFormOpen, setStaffFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Staff | null>(null);

  async function handleUpdate(formData: FormData) {
    setLoading(true);
    try { await updateDealer(formData); toast.success("जानकारी अपडेट हो गई"); await onRefresh(); }
    catch { toast.error("अपडेट नहीं हो सका"); }
    setLoading(false);
  }

  async function handleAddStaff(formData: FormData) {
    setLoading(true);
    try { await addStaff(formData); toast.success("स्टाफ जोड़ दिया गया"); setStaffFormOpen(false); await onRefresh(); }
    catch { toast.error("ईमेल पहले से इस्तेमाल हो रहा है"); }
    setLoading(false);
  }

  async function handleRemoveStaff() {
    if (!deleteTarget) return;
    try { await removeStaff(deleteTarget.id); toast.success("स्टाफ हटा दिया गया"); await onRefresh(); }
    catch { toast.error("हटा नहीं सकते"); }
    setDeleteTarget(null);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-green-950">दुकान की जानकारी / Shop Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label>दुकान का नाम *</Label>
              <Input name="shopName" defaultValue={dealer.shopName} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>फ़ोन</Label>
                <Input name="phone" defaultValue={dealer.phone} />
              </div>
              <div className="space-y-2">
                <Label>ईमेल</Label>
                <Input name="email" type="email" defaultValue={dealer.email || ""} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>पता / Address</Label>
              <Input name="address" defaultValue={dealer.address || ""} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>GSTIN</Label>
                <Input name="gstin" defaultValue={dealer.gstin || ""} placeholder="22AAAAA0000A1Z5" />
              </div>
              <div className="space-y-2">
                <Label>भाषा / Language</Label>
                <div className="flex gap-2">
                  {[{ val: "hi", label: "हिंदी" }, { val: "en", label: "English" }].map((l) => (
                    <label key={l.val} className="flex-1">
                      <input type="radio" name="language" value={l.val} defaultChecked={dealer.language === l.val} className="peer sr-only" />
                      <div className="cursor-pointer rounded-lg border border-gray-200 py-2 text-center text-sm font-medium text-gray-500 peer-checked:border-green-600 peer-checked:bg-green-50 peer-checked:text-green-800 peer-checked:ring-1 peer-checked:ring-green-600 transition-all">
                        {l.label}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <Button type="submit" disabled={loading} className="bg-green-700 hover:bg-green-800 text-white">
              {loading ? "सेव हो रहा..." : "सेव करें"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-base font-semibold text-green-950">सब्सक्रिप्शन / Subscription</CardTitle>
            <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${dealer.plan === "trial" ? "bg-amber-50 text-amber-700" : "bg-green-50 text-green-700"}`}>
              <Shield className="h-3 w-3" />
              {dealer.plan === "trial" ? "फ्री ट्राई" : dealer.plan}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {dealer.trialEndsAt && (
            <p className="text-sm text-gray-500">ट्राई खत्म: <span className="font-medium text-gray-700">{new Date(dealer.trialEndsAt).toLocaleDateString("en-IN")}</span></p>
          )}
        </CardContent>
      </Card>

      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-base font-semibold text-green-950">स्टाफ / Staff</CardTitle>
            <Button size="sm" onClick={() => setStaffFormOpen(true)} className="bg-green-700 hover:bg-green-800 text-white">
              <Plus className="h-4 w-4 mr-1" /> स्टाफ जोड़ें
            </Button>
          </div>
        </CardHeader>
        <CardContent className="divide-y divide-gray-100">
          {staff.map((s) => (
            <div key={s.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-600">
                  {s.name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">{s.name}</p>
                  <p className="text-xs text-gray-400">{s.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${s.role === "owner" ? "bg-amber-50 text-amber-700" : "bg-gray-100 text-gray-600"}`}>
                  {s.role === "owner" ? <Crown className="h-3 w-3" /> : <User className="h-3 w-3" />}
                  {s.role === "owner" ? "मालिक" : "स्टाफ"}
                </span>
                {s.role !== "owner" && (
                  <Tooltip>
                    <TooltipTrigger
                      aria-label="हटाएं"
                      className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      onClick={() => setDeleteTarget(s)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </TooltipTrigger>
                    <TooltipContent>हटाएं</TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={staffFormOpen} onOpenChange={setStaffFormOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>स्टाफ जोड़ें / Add Staff</DialogTitle></DialogHeader>
          <form action={handleAddStaff} className="space-y-4">
            <div className="space-y-2">
              <Label>नाम *</Label>
              <Input name="name" required />
            </div>
            <div className="space-y-2">
              <Label>ईमेल *</Label>
              <Input name="email" type="email" required />
            </div>
            <div className="space-y-2">
              <Label>पासवर्ड *</Label>
              <Input name="password" type="password" required minLength={6} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setStaffFormOpen(false)}>रद्द करें</Button>
              <Button type="submit" disabled={loading} className="bg-green-700 hover:bg-green-800 text-white">
                {loading ? "जोड़ रहे हैं..." : "जोड़ें"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteConfirm
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleRemoveStaff}
        title={`"${deleteTarget?.name}" को हटाएं?`}
        description="इस स्टाफ का एक्सेस हट जाएगा और वो लॉगिन नहीं कर पाएगा।"
      />
    </div>
  );
}
