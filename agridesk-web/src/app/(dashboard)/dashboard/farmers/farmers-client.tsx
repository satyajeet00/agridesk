"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DeleteConfirm } from "@/components/delete-confirm";
import { Plus, Search, Pencil, Trash2, MapPin, Phone, Users } from "lucide-react";
import { createFarmer, updateFarmer, deleteFarmer } from "./actions";
import { toast } from "sonner";

interface Farmer {
  id: string;
  name: string;
  phone: string;
  village: string | null;
  crops: string | null;
  outstandingBalance: number;
}

export function FarmersClient({ farmers, onRefresh }: { farmers: Farmer[]; onRefresh: () => Promise<void> }) {
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editFarmer, setEditFarmer] = useState<Farmer | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Farmer | null>(null);

  const filtered = farmers.filter(
    (f) => f.name.toLowerCase().includes(search.toLowerCase()) || f.phone.includes(search) || (f.village && f.village.toLowerCase().includes(search.toLowerCase()))
  );

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    try {
      if (editFarmer) { await updateFarmer(editFarmer.id, formData); toast.success("किसान अपडेट हो गया"); }
      else { await createFarmer(formData); toast.success("किसान जोड़ दिया गया"); }
      setFormOpen(false); setEditFarmer(null);
      await onRefresh();
    } catch { toast.error("कुछ गलत हो गया"); }
    setLoading(false);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try { await deleteFarmer(deleteTarget.id); toast.success("किसान हटा दिया गया"); await onRefresh(); }
    catch { toast.error("हटाने में दिक्कत आई"); }
    setDeleteTarget(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input placeholder="नाम, फ़ोन या गाँव से खोजें..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 pl-9 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent" />
        </div>
        <Button onClick={() => { setEditFarmer(null); setFormOpen(true); }} className="bg-green-700 hover:bg-green-800 text-white">
          <Plus className="h-4 w-4 mr-2" /> किसान जोड़ें
        </Button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 hover:bg-gray-50">
              <TableHead className="text-gray-500 font-medium">नाम / Name</TableHead>
              <TableHead className="text-gray-500 font-medium">फ़ोन / Phone</TableHead>
              <TableHead className="text-gray-500 font-medium hidden sm:table-cell">गाँव / Village</TableHead>
              <TableHead className="text-gray-500 font-medium hidden md:table-cell">फसल / Crops</TableHead>
              <TableHead className="text-gray-500 font-medium text-right">उधारी / Balance</TableHead>
              <TableHead className="w-20"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-16">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-14 w-14 rounded-full bg-green-50 flex items-center justify-center">
                      <Users className="h-7 w-7 text-green-300" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-600">
                        {search ? "कोई किसान नहीं मिला" : "अभी कोई किसान नहीं"}
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        {search ? "दूसरे शब्दों से खोजें" : "अपना पहला किसान जोड़ कर शुरू करें"}
                      </p>
                    </div>
                    {!search && (
                      <Button size="sm" onClick={() => { setEditFarmer(null); setFormOpen(true); }} className="bg-green-700 hover:bg-green-800 text-white mt-1">
                        <Plus className="h-4 w-4 mr-1" /> पहला किसान जोड़ें
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((f) => (
                <TableRow key={f.id} className="hover:bg-gray-50/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-green-50 flex items-center justify-center text-sm font-semibold text-green-700 shrink-0">
                        {f.name.charAt(0)}
                      </div>
                      <span className="font-medium text-gray-900">{f.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-gray-600 text-sm">
                      <Phone className="h-3.5 w-3.5 text-gray-400" />{f.phone}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {f.village ? (
                      <div className="flex items-center gap-1.5 text-gray-500 text-sm">
                        <MapPin className="h-3.5 w-3.5 text-gray-400" />{f.village}
                      </div>
                    ) : <span className="text-gray-300">&mdash;</span>}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-gray-500">{f.crops || <span className="text-gray-300">&mdash;</span>}</TableCell>
                  <TableCell className="text-right">
                    <span className={`text-sm font-semibold ${f.outstandingBalance > 0 ? "text-red-600" : "text-green-600"}`}>
                      {f.outstandingBalance > 0 ? `₹${f.outstandingBalance.toLocaleString("en-IN")}` : "✓ चुकता"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-0.5">
                      <Tooltip>
                        <TooltipTrigger
                          aria-label="संपादित करें"
                          className="p-2 rounded-lg text-gray-400 hover:text-green-700 hover:bg-green-50 transition-colors"
                          onClick={() => { setEditFarmer(f); setFormOpen(true); }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </TooltipTrigger>
                        <TooltipContent>संपादित करें</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger
                          aria-label="हटाएं"
                          className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          onClick={() => setDeleteTarget(f)}
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

      <Dialog open={formOpen} onOpenChange={() => { setFormOpen(false); setEditFarmer(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editFarmer ? "किसान अपडेट करें" : "नया किसान जोड़ें"}</DialogTitle>
          </DialogHeader>
          <form action={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>नाम / Name *</Label>
                <Input name="name" defaultValue={editFarmer?.name} required placeholder="किसान का नाम" />
              </div>
              <div className="space-y-2">
                <Label>फ़ोन / Phone *</Label>
                <Input name="phone" defaultValue={editFarmer?.phone} required placeholder="+91..." />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>गाँव / Village</Label>
                <Input name="village" defaultValue={editFarmer?.village || ""} placeholder="गाँव का नाम" />
              </div>
              <div className="space-y-2">
                <Label>फसल / Crops</Label>
                <Input name="crops" defaultValue={editFarmer?.crops || ""} placeholder="गेहूं, धान, सोयाबीन" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => { setFormOpen(false); setEditFarmer(null); }}>रद्द करें</Button>
              <Button type="submit" disabled={loading} className="bg-green-700 hover:bg-green-800 text-white">
                {loading ? "सेव हो रहा है..." : editFarmer ? "अपडेट करें" : "जोड़ें"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteConfirm
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`"${deleteTarget?.name}" को हटाएं?`}
        description="इस किसान का सारा डेटा और उधारी रिकॉर्ड हटा दिया जाएगा। यह वापस नहीं होगा।"
      />
    </div>
  );
}
