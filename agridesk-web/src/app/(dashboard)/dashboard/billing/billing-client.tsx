"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DeleteConfirm } from "@/components/delete-confirm";
import { Plus, Search, Trash2, Receipt, Eye, Download, MessageCircle } from "lucide-react";
import { createBill, deleteBill } from "./actions";
import { toast } from "sonner";
import { jsPDF } from "jspdf";

interface Bill {
  id: string; billNo: string; totalAmount: number; paidAmount: number; creditAmount: number; gstAmount: number; method: string; status: string; createdAt: string;
  farmer: { name: string; phone: string };
  items: { quantity: number; unitPrice: number; total: number; product: { name: string; gstRate?: number; hsnCode?: string } }[];
}
interface Farmer { id: string; name: string; phone: string; }
interface StockBatch { id: string; batchNo: string | null; quantity: number; sellingPrice: number; }
interface Product { id: string; name: string; unit: string; gstRate?: number; hsnCode?: string; stockBatches: StockBatch[]; }

function generatePdf(bill: Bill) {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text("AgriDesk", 14, 20);
  doc.setFontSize(10);
  doc.text(`Bill #${bill.billNo}`, 14, 28);
  doc.text(`Date: ${new Date(bill.createdAt).toLocaleDateString("en-IN")}`, 14, 34);
  doc.text(`Farmer: ${bill.farmer.name} (${bill.farmer.phone})`, 14, 42);

  let y = 55;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Item", 14, y);
  doc.text("Qty", 100, y);
  doc.text("Price", 125, y);
  doc.text("Total", 160, y);
  doc.setFont("helvetica", "normal");
  y += 8;

  bill.items.forEach((item) => {
    doc.text(item.product.name, 14, y);
    doc.text(String(item.quantity), 100, y);
    doc.text(`Rs ${item.unitPrice}`, 125, y);
    doc.text(`Rs ${item.total.toLocaleString("en-IN")}`, 160, y);
    y += 7;
  });

  y += 5;
  doc.line(14, y, 196, y);
  y += 8;
  doc.setFont("helvetica", "bold");
  doc.text(`Total: Rs ${bill.totalAmount.toLocaleString("en-IN")}`, 125, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  if (bill.gstAmount > 0) {
    doc.text(`GST: Rs ${bill.gstAmount.toLocaleString("en-IN")}`, 125, y);
    y += 7;
  }
  doc.text(`Paid: Rs ${bill.paidAmount.toLocaleString("en-IN")}`, 125, y);
  if (bill.creditAmount > 0) {
    y += 7;
    doc.text(`Credit: Rs ${bill.creditAmount.toLocaleString("en-IN")}`, 125, y);
  }

  doc.save(`AgriDesk-${bill.billNo}.pdf`);
}

function shareWhatsApp(bill: Bill) {
  const items = bill.items.map((i) => `  ${i.product.name} x${i.quantity} = ₹${i.total.toLocaleString("en-IN")}`).join("\n");
  const msg = [
    `*AgriDesk बिल #${bill.billNo}*`,
    `दिनांक: ${new Date(bill.createdAt).toLocaleDateString("en-IN")}`,
    ``,
    `*आइटम:*`,
    items,
    ``,
    `*कुल: ₹${bill.totalAmount.toLocaleString("en-IN")}*`,
    bill.gstAmount > 0 ? `GST: ₹${bill.gstAmount.toLocaleString("en-IN")}` : "",
    `भुगतान: ₹${bill.paidAmount.toLocaleString("en-IN")}`,
    bill.creditAmount > 0 ? `*उधारी: ₹${bill.creditAmount.toLocaleString("en-IN")}*` : "",
    ``,
    `— AgriDesk`,
  ].filter(Boolean).join("\n");

  const phone = bill.farmer.phone.replace(/\D/g, "");
  const phoneNum = phone.startsWith("91") ? phone : `91${phone}`;
  window.open(`https://wa.me/${phoneNum}?text=${encodeURIComponent(msg)}`, "_blank");
}

function sendReminder(farmer: { name: string; phone: string }, amount: number) {
  const msg = [
    `नमस्ते ${farmer.name} जी,`,
    ``,
    `आपके खाते में ₹${amount.toLocaleString("en-IN")} बाकी है।`,
    `कृपया जल्द भुगतान करें।`,
    ``,
    `धन्यवाद,`,
    `— AgriDesk`,
  ].join("\n");

  const phone = farmer.phone.replace(/\D/g, "");
  const phoneNum = phone.startsWith("91") ? phone : `91${phone}`;
  window.open(`https://wa.me/${phoneNum}?text=${encodeURIComponent(msg)}`, "_blank");
}

export function BillingClient({ bills, farmers, products, onRefresh }: { bills: Bill[]; farmers: Farmer[]; products: Product[]; onRefresh: () => Promise<void> }) {
  const [formOpen, setFormOpen] = useState(false);
  const [detailBill, setDetailBill] = useState<Bill | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState("");
  const [method, setMethod] = useState("cash");
  const [paidAmount, setPaidAmount] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Bill | null>(null);
  const [lineItems, setLineItems] = useState<{ productId: string; batchId: string; quantity: string; unitPrice: string }[]>([
    { productId: "", batchId: "", quantity: "", unitPrice: "" },
  ]);

  const filtered = bills.filter((b) => b.farmer.name.toLowerCase().includes(search.toLowerCase()) || b.billNo.includes(search));

  const lineTotal = (item: typeof lineItems[0]) => (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
  const subtotal = lineItems.reduce((s, i) => s + lineTotal(i), 0);

  const gstTotal = lineItems.reduce((s, item) => {
    const prod = products.find((p) => p.id === item.productId);
    const rate = prod?.gstRate || 0;
    return s + (lineTotal(item) * rate) / 100;
  }, 0);

  const total = subtotal + gstTotal;

  function addLine() { setLineItems([...lineItems, { productId: "", batchId: "", quantity: "", unitPrice: "" }]); }
  function updateLine(idx: number, field: keyof (typeof lineItems)[number], val: string) {
    const updated = [...lineItems];
    updated[idx] = { ...updated[idx], [field]: val };
    if (field === "productId") {
      const prod = products.find((p) => p.id === val);
      if (prod && prod.stockBatches.length > 0) {
        updated[idx].batchId = prod.stockBatches[0].id;
        updated[idx].unitPrice = String(prod.stockBatches[0].sellingPrice);
      }
    }
    setLineItems(updated);
  }
  function removeLine(idx: number) { if (lineItems.length > 1) setLineItems(lineItems.filter((_, i) => i !== idx)); }

  async function handleSubmit() {
    if (!selectedFarmer) { toast.error("किसान चुनें"); return; }
    const validItems = lineItems.filter((i) => i.productId && Number(i.quantity) > 0 && Number(i.unitPrice) > 0);
    if (validItems.length === 0) { toast.error("कम से कम एक आइटम जोड़ें"); return; }
    setLoading(true);
    try {
      await createBill({
        farmerId: selectedFarmer,
        items: validItems.map((i) => ({ productId: i.productId, batchId: i.batchId || undefined, quantity: Number(i.quantity), unitPrice: Number(i.unitPrice) })),
        method,
        paidAmount: Number(paidAmount) || 0,
      });
      toast.success("बिल बन गया!");
      setFormOpen(false);
      setSelectedFarmer(""); setPaidAmount("");
      setLineItems([{ productId: "", batchId: "", quantity: "", unitPrice: "" }]);
      await onRefresh();
    } catch { toast.error("बिल बनाने में दिक्कत"); }
    setLoading(false);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try { await deleteBill(deleteTarget.id); toast.success("बिल हटा दिया गया"); await onRefresh(); }
    catch { toast.error("हटाने में दिक्कत"); }
    setDeleteTarget(null);
  }

  const methodStyles: Record<string, string> = { cash: "bg-emerald-50 text-emerald-700", upi: "bg-violet-50 text-violet-700", credit: "bg-red-50 text-red-700" };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input placeholder="बिल या किसान खोजें..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 pl-9 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent" />
        </div>
        <Button onClick={() => setFormOpen(true)} className="bg-green-700 hover:bg-green-800 text-white">
          <Plus className="h-4 w-4 mr-2" /> नया बिल
        </Button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 hover:bg-gray-50">
              <TableHead className="text-gray-500 font-medium">बिल # / Bill</TableHead>
              <TableHead className="text-gray-500 font-medium">किसान / Farmer</TableHead>
              <TableHead className="text-gray-500 font-medium">राशि / Amount</TableHead>
              <TableHead className="text-gray-500 font-medium hidden sm:table-cell">भुगतान / Paid</TableHead>
              <TableHead className="text-gray-500 font-medium hidden sm:table-cell">तारीख / Date</TableHead>
              <TableHead className="w-24"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-16">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-14 w-14 rounded-full bg-green-50 flex items-center justify-center">
                      <Receipt className="h-7 w-7 text-green-300" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-600">
                        {search ? "कोई बिल नहीं मिला" : "अभी कोई बिल नहीं"}
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        {search ? "दूसरे शब्दों से खोजें" : "पहला बिल बनाकर शुरू करें"}
                      </p>
                    </div>
                    {!search && (
                      <Button size="sm" onClick={() => setFormOpen(true)} className="bg-green-700 hover:bg-green-800 text-white mt-1">
                        <Plus className="h-4 w-4 mr-1" /> पहला बिल बनाएं
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((b) => (
                <TableRow key={b.id} className="hover:bg-gray-50/50">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center"><Receipt className="h-4 w-4 text-green-600" /></div>
                      <span className="font-mono text-sm text-gray-700">{b.billNo}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-medium text-gray-900">{b.farmer.name}</p>
                    <p className="text-xs text-gray-400">{b.farmer.phone}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-semibold text-gray-900">₹{b.totalAmount.toLocaleString("en-IN")}</p>
                    {b.creditAmount > 0 && <p className="text-xs text-red-500">उधारी: ₹{b.creditAmount.toLocaleString("en-IN")}</p>}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${methodStyles[b.method] || "bg-gray-50 text-gray-600"}`}>
                      {b.method === "cash" ? "नकद" : b.method === "upi" ? "UPI" : "उधारी"}
                    </span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-sm text-gray-500">{new Date(b.createdAt).toLocaleDateString("en-IN")}</TableCell>
                  <TableCell>
                    <div className="flex gap-0.5">
                      <Tooltip>
                        <TooltipTrigger
                          aria-label="देखें"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-green-700 hover:bg-green-50 transition-colors"
                          onClick={() => setDetailBill(b)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </TooltipTrigger>
                        <TooltipContent>देखें</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger
                          aria-label="PDF"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          onClick={() => generatePdf(b)}
                        >
                          <Download className="h-3.5 w-3.5" />
                        </TooltipTrigger>
                        <TooltipContent>PDF डाउनलोड</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger
                          aria-label="हटाएं"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          onClick={() => setDeleteTarget(b)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </TooltipTrigger>
                        <TooltipContent>हटाएं</TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Bill Detail Dialog */}
      <Dialog open={!!detailBill} onOpenChange={() => setDetailBill(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>बिल #{detailBill?.billNo}</DialogTitle></DialogHeader>
          {detailBill && (
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <div>
                  <p className="font-medium text-gray-900">{detailBill.farmer.name}</p>
                  <p className="text-gray-500">{detailBill.farmer.phone}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-500">{new Date(detailBill.createdAt).toLocaleDateString("en-IN")}</p>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium mt-1 ${methodStyles[detailBill.method] || "bg-gray-50 text-gray-600"}`}>
                    {detailBill.method === "cash" ? "नकद" : detailBill.method === "upi" ? "UPI" : "उधारी"}
                  </span>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500">
                      <th className="text-left px-3 py-2 font-medium">आइटम</th>
                      <th className="text-right px-3 py-2 font-medium">मात्रा</th>
                      <th className="text-right px-3 py-2 font-medium">दाम</th>
                      <th className="text-right px-3 py-2 font-medium">कुल</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailBill.items.map((item, i) => (
                      <tr key={i} className="border-t border-gray-100">
                        <td className="px-3 py-2 text-gray-900">{item.product.name}</td>
                        <td className="px-3 py-2 text-right text-gray-600">{item.quantity}</td>
                        <td className="px-3 py-2 text-right text-gray-600">₹{item.unitPrice}</td>
                        <td className="px-3 py-2 text-right font-medium text-gray-900">₹{item.total.toLocaleString("en-IN")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">सबटोटल</span>
                  <span className="text-gray-900">₹{(detailBill.totalAmount - detailBill.gstAmount).toLocaleString("en-IN")}</span>
                </div>
                {detailBill.gstAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">GST</span>
                    <span className="text-gray-900">₹{detailBill.gstAmount.toLocaleString("en-IN")}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base border-t border-gray-200 pt-2">
                  <span>कुल / Total</span>
                  <span>₹{detailBill.totalAmount.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-green-700">
                  <span>भुगतान / Paid</span>
                  <span>₹{detailBill.paidAmount.toLocaleString("en-IN")}</span>
                </div>
                {detailBill.creditAmount > 0 && (
                  <div className="flex justify-between text-red-600 font-medium">
                    <span>उधारी / Credit</span>
                    <span>₹{detailBill.creditAmount.toLocaleString("en-IN")}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button className="flex-1 bg-green-700 hover:bg-green-800 text-white" onClick={() => generatePdf(detailBill)}>
                  <Download className="h-4 w-4 mr-2" /> PDF
                </Button>
                <Button className="flex-1 bg-[#25D366] hover:bg-[#1da851] text-white" onClick={() => shareWhatsApp(detailBill)}>
                  <MessageCircle className="h-4 w-4 mr-2" /> WhatsApp
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Bill Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>नया बिल बनाएं / New Bill</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>किसान *</Label>
              <Select value={selectedFarmer} onValueChange={(v) => setSelectedFarmer(v ?? "")}>
                <SelectTrigger><SelectValue placeholder="किसान चुनें" /></SelectTrigger>
                <SelectContent>
                  {farmers.map((f) => <SelectItem key={f.id} value={f.id}>{f.name} ({f.phone})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>आइटम / Items</Label>
              {lineItems.map((item, idx) => {
                const selectedProduct = products.find((p) => p.id === item.productId);
                const batches = selectedProduct?.stockBatches || [];
                return (
                  <div key={idx} className="space-y-1.5 p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <Select value={item.productId} onValueChange={(v) => updateLine(idx, "productId", v ?? "")}>
                          <SelectTrigger className="text-xs"><SelectValue placeholder="प्रोडक्ट" /></SelectTrigger>
                          <SelectContent>
                            {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <Input className="w-20" placeholder="Qty" type="number" value={item.quantity} onChange={(e) => updateLine(idx, "quantity", e.target.value)} />
                      <Input className="w-24" placeholder="₹ Price" type="number" value={item.unitPrice} onChange={(e) => updateLine(idx, "unitPrice", e.target.value)} />
                      {lineItems.length > 1 && (
                        <button type="button" className="p-2 text-gray-400 hover:text-red-500" onClick={() => removeLine(idx)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    {batches.length > 1 && (
                      <div className="pl-1">
                        <Select value={item.batchId} onValueChange={(v) => updateLine(idx, "batchId", v ?? "")}>
                          <SelectTrigger className="text-xs h-8">
                            <SelectValue placeholder="बैच चुनें" />
                          </SelectTrigger>
                          <SelectContent>
                            {batches.map((b) => (
                              <SelectItem key={b.id} value={b.id}>
                                {b.batchNo || "No batch"} — {b.quantity} in stock — ₹{b.sellingPrice}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                );
              })}
              <Button type="button" variant="outline" size="sm" onClick={addLine} className="text-xs">
                <Plus className="h-3 w-3 mr-1" /> और आइटम
              </Button>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">सबटोटल</span>
                <span className="text-gray-700">₹{subtotal.toLocaleString("en-IN")}</span>
              </div>
              {gstTotal > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">GST</span>
                  <span className="text-gray-700">₹{Math.round(gstTotal).toLocaleString("en-IN")}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold border-t border-gray-200 pt-1">
                <span className="text-gray-700">कुल / Total</span>
                <span className="text-gray-900 text-lg">₹{Math.round(total).toLocaleString("en-IN")}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>भुगतान विधि / Method</Label>
                <Select value={method} onValueChange={(v) => setMethod(v ?? "cash")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">नकद / Cash</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="credit">पूरी उधारी / Full Credit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>भुगतान राशि / Paid (₹)</Label>
                <Input type="number" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} placeholder={method === "credit" ? "0" : String(Math.round(total))} />
              </div>
            </div>

            {total > 0 && Number(paidAmount) < total && Number(paidAmount) >= 0 && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                उधारी: ₹{Math.round(total - (Number(paidAmount) || 0)).toLocaleString("en-IN")} किसान के खाते में जुड़ जाएगी
              </p>
            )}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>रद्द करें</Button>
              <Button onClick={handleSubmit} disabled={loading} className="bg-green-700 hover:bg-green-800 text-white">
                {loading ? "बन रहा है..." : "बिल बनाएं"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <DeleteConfirm
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`बिल #${deleteTarget?.billNo} हटाएं?`}
        description="बिल हटाने से उधारी और स्टॉक वापस नहीं होगा। यह कार्य वापस नहीं होगा।"
      />
    </div>
  );
}
