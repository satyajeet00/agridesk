"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { LayoutDashboard, Users, Package, Receipt, BookOpen, Settings, LogOut, Menu, Leaf } from "lucide-react";
import { clearSession } from "@/lib/session";
import { useState } from "react";

function signOut() {
  clearSession();
  window.location.href = "/login";
}

const navItems = [
  { href: "/dashboard", labelHi: "डैशबोर्ड", labelEn: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/farmers", labelHi: "किसान", labelEn: "Farmers", icon: Users },
  { href: "/dashboard/ledger", labelHi: "उधारी खाता", labelEn: "Credit Ledger", icon: BookOpen },
  { href: "/dashboard/inventory", labelHi: "स्टॉक", labelEn: "Inventory", icon: Package },
  { href: "/dashboard/billing", labelHi: "बिलिंग", labelEn: "Billing", icon: Receipt },
  { href: "/dashboard/settings", labelHi: "सेटिंग्स", labelEn: "Settings", icon: Settings },
];

export function MobileNav({ shopName, language }: { shopName: string; language: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isHi = language === "hi";

  return (
    <div className="md:hidden flex items-center justify-between border-b bg-background px-4 py-3 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-green-700 flex items-center justify-center">
          <Leaf className="h-4 w-4 text-white" />
        </div>
        <span className="font-semibold text-green-900">AgriDesk</span>
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger className="p-2 text-gray-500 hover:text-green-800 rounded-md hover:bg-green-50 transition-colors">
          <Menu className="h-5 w-5" />
        </SheetTrigger>
        <SheetContent side="left" className="w-72 bg-sidebar border-none p-0">
          <div className="px-6 py-6 border-b border-green-800/50">
            <h1 className="text-lg font-semibold text-sidebar-foreground">AgriDesk</h1>
            <p className="text-xs text-green-400">{shopName}</p>
          </div>
          <nav className="px-3 py-4 space-y-0.5">
            {navItems.map((item) => {
              const isActive = item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);
              return (
                <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                    isActive ? "bg-green-600/20 text-white" : "text-green-300 hover:text-white hover:bg-white/5"
                  )}>
                  <item.icon className="h-[18px] w-[18px]" />
                  {isHi ? item.labelHi : item.labelEn}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-green-800/50 p-3 mt-auto">
            <button onClick={() => signOut()}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-green-400 hover:text-white hover:bg-white/5">
              <LogOut className="h-[18px] w-[18px]" />
              {isHi ? "लॉग आउट" : "Log out"}
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
