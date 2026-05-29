"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DeleteConfirm } from "@/components/delete-confirm";
import { ArrowDownLeft, ArrowUpRight, Search, BookOpen, Trash2, ChevronDown, MessageCircle } from "lucide-react";
import { addCredit, addPayment, deleteEntry } from "./actions";
import { toast } from "sonner";

interface Farmer { id: string; name: string; phone: string; village: string | null; outstandingBalance: number; }
interface Entry { id: string; type: string; amount: number; note: string | null; date: string; farmerId: string; farmer: { name: string; phone: string }; }

const PAGE_SIZE = 25;

export function LedgerClient({ farmers, entries, totalOutstanding, onRefresh }: { farmers: Farmer[]; entries: Entry[]; totalOutstanding: number; onRefresh: () => Promise<void> }) {
  const [formOpen, setFormOpen] = useState(false);
  const [formType, setFormType] = useState<"credit" | "payment">("credit");
  const [selectedFarmer, setSelectedFarmer] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Entry | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "credit" | "payment">("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const farmersWithDebt = farmers.filter((f) => f.outstandingBalance > 0);

  function sendReminder(farmer: Farmer) {
    const msg = [
      `नमस्ते ${farmer.name} जी,`,
      ``,
      `आपके खाते में ₹${farmer.outstandingBalance.toLocaleString("en-IN")} बाकी है।`,
      `कृपया जल्द भुगतान करें।`,
      ``,
      `धन्यवाद`,
    ].join("\n");
    const phone = farmer.phone.replace(/\D/g, "");
    const phoneNum = phone.startsWith("91") ? phone : `91${phone}`;
    window.open(`https://wa.me/${phoneNum}?text=${encodeURIComponent(msg)}`, "_blank");
  }

  const filtered = useMemo(() => {
    let result = entries;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((e) => e.farmer.name.toLowerCase().includes(q) || e.farmer.phone.includes(q));
    }
    if (typeFilter !== "all") {
      result = result.filter((e) => e.type === typeFilter);
    }
    if (dateFrom) {
      const from = new Date(dateFrom);
      result = result.filter((e) => new Date(e.date) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      result = result.filter((e) => new Date(e.date) <= to);
    }
    return result;
  }, [entries, search, typeFilter, dateFrom, dateTo]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  async function handleSubmit(formData: FormData) {
    if (!selectedFarmer) return;
    const amount = Number(formData.get("amount"));
    const note = formData.get("note") as string;
    if (!amount || amount <= 0) { toast.error("राशि डालें"); return; }
    setLoading(true);
    try {
      if (formType === "credit") await addCredit(selectedFarmer, amount, note);
      else await addPayment(selectedFarmer, amount, note);
      toast.success(formType === "credit" ? "उधारी दर्ज हो गई" : "भुगतान दर्ज हो गया");
      setFormOpen(false); setSelectedFarmer("");
      await onRefresh();
    } catch { toast.error("कुछ गलत हो गया"); }
    setLoading(false);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try { await deleteEntry(deleteTarget.id, deleteTarget.farmerId, deleteTarget.type, deleteTarget.amount); toast.success("हटा दिया गया"); await onRefresh(); }
    catch { toast.error("हटाने में दिक्कत"); }
    setDeleteTarget(null);
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Card className="shadow-sm border-red-200 bg-gradient-to-br from-red-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-400">कुल बाकी उधारी / Total Outstanding</p>
                <p className="text-3xl font-bold text-red-700 mt-1">₹{totalOutstanding.toLocaleString("en-IN")}</p>
                <p className="text-xs text-red-300 mt-1">{farmersWithDebt.length} किसानों पर बाकी</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-red-100 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-3 gap-3">
          <button onClick={() => { setFormType("credit"); setFormOpen(true); }}
            className="rounded-xl border-2 border-dashed border-red-200 bg-white hover:bg-red-50 p-4 text-center transition-colors group">
            <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center mx-auto group-hover:bg-red-100 transition-colors">
              <ArrowUpRight className="h-5 w-5 text-red-600" />
            </div>
            <p className="text-sm font-semibold text-red-700 mt-2">उधारी दें</p>
            <p className="text-xs text-red-400">Add Credit</p>
          </button>
          <button onClick={() => { setFormType("payment"); setFormOpen(true); }}
            className="rounded-xl border-2 border-dashed border-green-200 bg-white hover:bg-green-50 p-4 text-center transition-colors group">
            <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center mx-auto group-hover:bg-green-100 transition-colors">
              <ArrowDownLeft className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-sm font-semibold text-green-700 mt-2">भुगतान लें</p>
            <p className="text-xs text-green-400">Record Payment</p>
          </button>
          {farmersWithDebt.length > 0 && (
            <div className="rounded-xl border-2 border-dashed border-emerald-200 bg-white p-4 text-center space-y-1.5">
              <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center mx-auto">
                <MessageCircle className="h-5 w-5 text-emerald-600" />
              </div>
              <p className="text-xs font-semibold text-emerald-700">रिमाइंडर भेजें</p>
              <select onChange={(e) => {
                const f = farmersWithDebt.find((f) => f.id === e.target.value);
                if (f) sendReminder(f);
                e.target.value = "";
              }} className="w-full text-xs rounded border border-gray-200 py-1 px-1 text-gray-600">
                <option value="">किसान चुनें</option>
                {farmersWithDebt.map((f) => (
                  <option key={f.id} value={f.id}>{f.name} — ₹{f.outstandingBalance.toLocaleString("en-IN")}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input placeholder="किसान खोजें..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 pl-9 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent" />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as any)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-600">
          <option value="all">सभी / All</option>
          <option value="credit">उधारी / Credit</option>
          <option value="payment">भुगतान / Payment</option>
        </select>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} placeholder="From"
          className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-600" />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} placeholder="To"
          className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-600" />
        {(dateFrom || dateTo || typeFilter !== "all") && (
          <Button variant="ghost" size="sm" onClick={() => { setDateFrom(""); setDateTo(""); setTypeFilter("all"); }} className="text-gray-500">
            फ़िल्टर हटाएं
          </Button>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 hover:bg-gray-50">
              <TableHead className="text-gray-500 font-medium">किसान / Farmer</TableHead>
              <TableHead className="text-gray-500 font-medium">प्रकार / Type</TableHead>
              <TableHead className="text-gray-500 font-medium">राशि / Amount</TableHead>
              <TableHead className="text-gray-500 font-medium hidden sm:table-cell">नोट / Note</TableHead>
              <TableHead className="text-gray-500 font-medium">तारीख / Date</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-16">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-14 w-14 rounded-full bg-green-50 flex items-center justify-center">
                      <BookOpen className="h-7 w-7 text-green-300" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-600">
                        {search || dateFrom || dateTo || typeFilter !== "all" ? "कोई एंट्री नहीं मिली" : "अभी कोई एंट्री नहीं है"}
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        {search || dateFrom || dateTo || typeFilter !== "all" ? "फ़िल्टर बदलें" : "उधारी या भुगतान दर्ज करके शुरू करें"}
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              visible.map((e) => (
                <TableRow key={e.id} className="hover:bg-gray-50/50">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-green-50 flex items-center justify-center text-xs font-semibold text-green-700">
                        {e.farmer.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{e.farmer.name}</p>
                        <p className="text-xs text-gray-400">{e.farmer.phone}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      e.type === "credit" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
                    }`}>
                      {e.type === "credit" ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownLeft className="h-3 w-3" />}
                      {e.type === "credit" ? "उधारी" : "भुगतान"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`text-sm font-semibold ${e.type === "credit" ? "text-red-600" : "text-green-600"}`}>
                      {e.type === "credit" ? "+" : "-"}₹{e.amount.toLocaleString("en-IN")}
                    </span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-sm text-gray-500">{e.note || <span className="text-gray-300">&mdash;</span>}</TableCell>
                  <TableCell className="text-sm text-gray-500">{new Date(e.date).toLocaleDateString("en-IN")}</TableCell>
                  <TableCell>
                    <Tooltip>
                      <TooltipTrigger
                        aria-label="हटाएं"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        onClick={() => setDeleteTarget(e)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </TooltipTrigger>
                      <TooltipContent>हटाएं</TooltipContent>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {hasMore && (
          <div className="border-t border-gray-100 p-3 text-center">
            <Button variant="ghost" size="sm" onClick={() => setVisibleCount((v) => v + PAGE_SIZE)} className="text-green-700">
              <ChevronDown className="h-4 w-4 mr-1" /> और दिखाएं ({filtered.length - visibleCount} बाकी)
            </Button>
          </div>
        )}
      </div>

      <Dialog open={formOpen} onOpenChange={() => { setFormOpen(false); setSelectedFarmer(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{formType === "credit" ? "उधारी दें / Add Credit" : "भुगतान लें / Record Payment"}</DialogTitle>
          </DialogHeader>
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>किसान चुनें / Select Farmer *</Label>
              <Select value={selectedFarmer} onValueChange={(v) => setSelectedFarmer(v ?? "")}>
                <SelectTrigger><SelectValue placeholder="किसान चुनें" /></SelectTrigger>
                <SelectContent>
                  {farmers.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name} ({f.phone}) {f.outstandingBalance > 0 && `— ₹${f.outstandingBalance.toLocaleString("en-IN")}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>राशि / Amount (₹) *</Label>
              <Input name="amount" type="number" required placeholder="0" />
            </div>
            <div className="space-y-2">
              <Label>नोट / Note</Label>
              <Input name="note" placeholder="जैसे: DAP 2 बोरी" />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => { setFormOpen(false); setSelectedFarmer(""); }}>रद्द करें</Button>
              <Button type="submit" disabled={loading || !selectedFarmer}
                className={formType === "credit" ? "bg-red-600 hover:bg-red-700 text-white" : "bg-green-700 hover:bg-green-800 text-white"}>
                {loading ? "सेव हो रहा..." : formType === "credit" ? "उधारी दर्ज करें" : "भुगतान दर्ज करें"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteConfirm
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="इस एंट्री को हटाएं?"
        description={`₹${deleteTarget?.amount.toLocaleString("en-IN") || 0} की ${deleteTarget?.type === "credit" ? "उधारी" : "भुगतान"} एंट्री हटाने से किसान का बैलेंस बदल जाएगा।`}
      />
    </div>
  );
}
