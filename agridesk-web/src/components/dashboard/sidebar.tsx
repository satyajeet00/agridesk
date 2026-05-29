"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Users, Package, Receipt, BookOpen, Settings, LogOut, Leaf } from "lucide-react";
import { clearSession } from "@/lib/session";

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

export function Sidebar({ shopName, language }: { shopName: string; language: string }) {
  const pathname = usePathname();
  const isHi = language === "hi";

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-sidebar">
      <div className="flex items-center gap-3 px-6 py-6 border-b border-green-800/50">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-600">
          <Leaf className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-base font-semibold text-sidebar-foreground tracking-tight">AgriDesk</h1>
          <p className="text-xs text-green-400 truncate max-w-[160px]">{shopName}</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                isActive ? "bg-green-600/20 text-white shadow-sm" : "text-green-300 hover:text-white hover:bg-white/5"
              )}>
              <item.icon className={cn("h-[18px] w-[18px]", isActive ? "text-green-400" : "text-green-500")} />
              <span>{isHi ? item.labelHi : item.labelEn}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-green-800/50 p-3">
        <button onClick={() => signOut()}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-green-400 hover:text-white hover:bg-white/5 transition-all">
          <LogOut className="h-[18px] w-[18px]" />
          {isHi ? "लॉग आउट" : "Log out"}
        </button>
      </div>
    </aside>
  );
}
