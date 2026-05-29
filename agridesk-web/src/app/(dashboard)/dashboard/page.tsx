"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, AlertTriangle, TrendingUp, BookOpen, ArrowUpRight, Package } from "lucide-react";
import { api, type DashboardData } from "@/lib/api";
import DashboardLoading from "./loading";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    api.dashboard.overview().then(setData).catch(() => {});
  }, []);

  if (!data) return <DashboardLoading />;

  const outstanding = data.totalOutstanding || 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-green-950">डैशबोर्ड</h1>
        <p className="text-sm text-gray-500 mt-1">आपकी दुकान का आज का हाल। Your shop at a glance.</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm border-gray-200 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">कुल उधारी</p>
                <p className="text-3xl font-bold text-red-600 mt-1">₹{outstanding.toLocaleString("en-IN")}</p>
                <p className="text-xs text-gray-400 mt-1">Total outstanding</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-red-50 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-200 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">आज की बिक्री</p>
                <p className="text-3xl font-bold text-green-700 mt-1">₹{(data.todaySales || 0).toLocaleString("en-IN")}</p>
                <p className="text-xs text-gray-400 mt-1">Today&apos;s sales</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-green-50 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-200 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">कुल किसान</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{data.totalFarmers}</p>
                <p className="text-xs text-gray-400 mt-1">Total farmers</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-200 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">एक्सपायरी जल्द</p>
                <p className="text-3xl font-bold text-amber-600 mt-1">{data.expiringStock}</p>
                <p className="text-xs text-gray-400 mt-1">Expiring in 30 days</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2 shadow-sm border-gray-200">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-green-950">टॉप उधारी / Top Debtors</CardTitle>
              <Link href="/dashboard/ledger" className="text-xs text-green-700 hover:text-green-800 font-medium flex items-center gap-0.5">
                सब देखें <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {data.topDebtors.length === 0 ? (
              <p className="text-sm text-gray-400 py-8 text-center">कोई उधारी नहीं</p>
            ) : (
              <div className="space-y-3">
                {data.topDebtors.map((f) => (
                  <div key={f.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-green-50 flex items-center justify-center text-sm font-semibold text-green-700">
                        {f.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{f.name}</p>
                        <p className="text-xs text-gray-400">{f.village || f.phone}</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-red-600">₹{f.outstandingBalance.toLocaleString("en-IN")}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 shadow-sm border-gray-200">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-green-950">हाल के बिल / Recent Bills</CardTitle>
              <Link href="/dashboard/billing" className="text-xs text-green-700 hover:text-green-800 font-medium flex items-center gap-0.5">
                सब देखें <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {data.recentBills.length === 0 ? (
              <p className="text-sm text-gray-400 py-8 text-center">अभी कोई बिल नहीं</p>
            ) : (
              <div className="space-y-3">
                {data.recentBills.map((b) => (
                  <div key={b.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-600">
                        {b.farmerName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{b.farmerName}</p>
                        <p className="text-xs text-gray-400">
                          #{b.billNo} &middot; {new Date(b.createdAt).toLocaleDateString("en-IN")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">₹{b.totalAmount.toLocaleString("en-IN")}</p>
                      {b.creditAmount > 0 && (
                        <p className="text-xs text-red-500">उधारी: ₹{b.creditAmount.toLocaleString("en-IN")}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">इस महीने की बिक्री / This Month Sales</p>
              <p className="text-2xl font-bold text-green-700 mt-1">₹{(data.monthSales || 0).toLocaleString("en-IN")}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-green-50 flex items-center justify-center">
              <Package className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
