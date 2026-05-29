"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DeleteConfirm } from "@/components/delete-confirm";
import { Plus, Package, AlertTriangle, Trash2, Search } from "lucide-react";
import { createProduct, addStock, deleteProduct } from "./actions";
import { toast } from "sonner";

interface StockBatch { id: string; batchNo: string | null; quantity: number; costPrice: number; sellingPrice: number; expiryDate: string | null; supplierName: string | null; }
interface Product { id: string; name: string; category: string; unit: string; stockBatches: StockBatch[]; }
interface ExpiringBatch { id: string; batchNo: string | null; expiryDate: string; quantity: number; product: { name: string }; }

const CATEGORIES = [
  { val: "fertilizer", hi: "खाद", en: "Fertilizer" },
  { val: "pesticide", hi: "कीटनाशक", en: "Pesticide" },
  { val: "seed", hi: "बीज", en: "Seed" },
  { val: "other", hi: "अन्य", en: "Other" },
];

export function InventoryClient({ products, expiringBatches, onRefresh }: { products: Product[]; expiringBatches: ExpiringBatch[]; onRefresh: () => Promise<void> }) {
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [stockFormOpen, setStockFormOpen] = useState(false);
  const [stockProductId, setStockProductId] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  const catColor: Record<string, string> = {
    fertilizer: "bg-emerald-50 text-emerald-700",
    pesticide: "bg-orange-50 text-orange-700",
    seed: "bg-blue-50 text-blue-700",
    other: "bg-gray-50 text-gray-600",
  };

  async function handleProductSubmit(formData: FormData) {
    setLoading(true);
    try { await createProduct(formData); toast.success("प्रोडक्ट जोड़ दिया गया"); setProductFormOpen(false); await onRefresh(); }
    catch { toast.error("कुछ गलत हो गया"); }
    setLoading(false);
  }

  async function handleStockSubmit(formData: FormData) {
    setLoading(true);
    try { await addStock(formData); toast.success("स्टॉक जोड़ दिया गया"); setStockFormOpen(false); await onRefresh(); }
    catch { toast.error("कुछ गलत हो गया"); }
    setLoading(false);
  }

  async function handleDeleteProduct() {
    if (!deleteTarget) return;
    try { await deleteProduct(deleteTarget.id); toast.success("हटा दिया गया"); await onRefresh(); }
    catch { toast.error("हटा नहीं सकते — बिल में इस्तेमाल हो रहा है"); }
    setDeleteTarget(null);
  }

  return (
    <div className="space-y-5">
      {expiringBatches.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-amber-800 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> 30 दिनों में एक्सपायर होने वाला स्टॉक
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {expiringBatches.map((b) => (
                <div key={b.id} className="flex items-center justify-between text-sm bg-white rounded-lg px-3 py-2 border border-amber-200">
                  <div>
                    <span className="font-medium text-gray-900">{b.product.name}</span>
                    {b.batchNo && <span className="text-gray-400 ml-2">#{b.batchNo}</span>}
                  </div>
                  <div className="text-right">
                    <span className="text-amber-700 font-medium">{new Date(b.expiryDate).toLocaleDateString("en-IN")}</span>
                    <span className="text-gray-400 ml-2">({b.quantity} यूनिट)</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input placeholder="प्रोडक्ट खोजें..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 pl-9 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent" />
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setProductFormOpen(true)} className="bg-green-700 hover:bg-green-800 text-white">
            <Plus className="h-4 w-4 mr-2" /> प्रोडक्ट जोड़ें
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="py-16">
            <div className="flex flex-col items-center gap-3">
              <div className="h-14 w-14 rounded-full bg-green-50 flex items-center justify-center">
                <Package className="h-7 w-7 text-green-300" />
              </div>
              <div className="text-center">
                <p className="font-medium text-gray-600">
                  {search ? "कोई प्रोडक्ट नहीं मिला" : "अभी कोई प्रोडक्ट नहीं"}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  {search ? "दूसरे शब्दों से खोजें" : "अपना पहला प्रोडक्ट जोड़ कर शुरू करें"}
                </p>
              </div>
              {!search && (
                <Button size="sm" onClick={() => setProductFormOpen(true)} className="bg-green-700 hover:bg-green-800 text-white mt-1">
                  <Plus className="h-4 w-4 mr-1" /> पहला प्रोडक्ट जोड़ें
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => {
            const totalQty = p.stockBatches.reduce((s, b) => s + b.quantity, 0);
            const isLow = totalQty > 0 && totalQty < 10;
            return (
              <Card key={p.id} className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-9 w-9 rounded-lg bg-green-50 flex items-center justify-center">
                        <Package className="h-4 w-4 text-green-700" />
                      </div>
                      <div>
                        <CardTitle className="text-base text-gray-900">{p.name}</CardTitle>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${catColor[p.category] || catColor.other}`}>
                          {CATEGORIES.find((c) => c.val === p.category)?.hi || p.category}
                        </span>
                      </div>
                    </div>
                    <Tooltip>
                      <TooltipTrigger
                        aria-label="हटाएं"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        onClick={() => setDeleteTarget(p)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </TooltipTrigger>
                      <TooltipContent>हटाएं</TooltipContent>
                    </Tooltip>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">कुल स्टॉक</span>
                    <span className={`text-lg font-bold ${isLow ? "text-amber-600" : totalQty === 0 ? "text-red-500" : "text-gray-900"}`}>
                      {totalQty} {p.unit}
                      {isLow && <span className="text-xs ml-1 text-amber-500">कम</span>}
                    </span>
                  </div>
                  {p.stockBatches.length > 0 && (
                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                      {p.stockBatches.slice(0, 3).map((b) => (
                        <div key={b.id} className="text-xs bg-gray-50 rounded-lg px-3 py-2 border border-gray-100 flex justify-between">
                          <span className="text-gray-600">{b.batchNo || "—"} | {b.quantity} {p.unit}</span>
                          <span className="text-gray-900 font-medium">₹{b.sellingPrice}/{p.unit}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <Button size="sm" variant="outline" className="w-full text-green-700 border-green-200 hover:bg-green-50"
                    onClick={() => { setStockProductId(p.id); setStockFormOpen(true); }}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> स्टॉक जोड़ें
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={productFormOpen} onOpenChange={setProductFormOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>नया प्रोडक्ट / New Product</DialogTitle></DialogHeader>
          <form action={handleProductSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>प्रोडक्ट का नाम *</Label>
              <Input name="name" required placeholder="जैसे: DAP 50kg" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>कैटेगरी *</Label>
                <Select name="category" required>
                  <SelectTrigger><SelectValue placeholder="चुनें" /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c.val} value={c.val}>{c.hi} / {c.en}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>यूनिट / Unit</Label>
                <Select name="unit" defaultValue="kg">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="litre">litre</SelectItem>
                    <SelectItem value="packet">packet</SelectItem>
                    <SelectItem value="bottle">bottle</SelectItem>
                    <SelectItem value="bag">bag / बोरी</SelectItem>
                    <SelectItem value="piece">piece</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>HSN Code</Label>
                <Input name="hsnCode" placeholder="Optional" />
              </div>
              <div className="space-y-2">
                <Label>GST Rate (%)</Label>
                <Input name="gstRate" type="number" defaultValue="0" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setProductFormOpen(false)}>रद्द करें</Button>
              <Button type="submit" disabled={loading} className="bg-green-700 hover:bg-green-800 text-white">
                {loading ? "सेव हो रहा..." : "जोड़ें"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={stockFormOpen} onOpenChange={setStockFormOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>स्टॉक जोड़ें / Add Stock</DialogTitle></DialogHeader>
          <form action={handleStockSubmit} className="space-y-4">
            <input type="hidden" name="productId" value={stockProductId} />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>बैच नंबर</Label>
                <Input name="batchNo" placeholder="Optional" />
              </div>
              <div className="space-y-2">
                <Label>मात्रा / Quantity *</Label>
                <Input name="quantity" type="number" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>खरीद मूल्य / Cost (₹) *</Label>
                <Input name="costPrice" type="number" required />
              </div>
              <div className="space-y-2">
                <Label>बिक्री मूल्य / Sell (₹) *</Label>
                <Input name="sellingPrice" type="number" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>एक्सपायरी / Expiry</Label>
                <Input name="expiryDate" type="date" />
              </div>
              <div className="space-y-2">
                <Label>सप्लायर / Supplier</Label>
                <Input name="supplierName" placeholder="Optional" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setStockFormOpen(false)}>रद्द करें</Button>
              <Button type="submit" disabled={loading} className="bg-green-700 hover:bg-green-800 text-white">
                {loading ? "सेव हो रहा..." : "स्टॉक जोड़ें"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteConfirm
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDeleteProduct}
        title={`"${deleteTarget?.name}" को हटाएं?`}
        description="इस प्रोडक्ट का सारा स्टॉक डेटा भी हट जाएगा। अगर इसके बिल बने हैं तो हटा नहीं सकते।"
      />
    </div>
  );
}
