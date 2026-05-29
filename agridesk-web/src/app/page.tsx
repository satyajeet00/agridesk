"use client";

import Link from "next/link";
import { useState } from "react";
import {
  BookOpen,
  Package,
  Receipt,
  BarChart3,
  MessageCircle,
  Shield,
  ArrowRight,
  Check,
  Star,
  Leaf,
  Smartphone,
  Menu,
  X,
} from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "Udhari Khata",
    titleHi: "उधारी खाता",
    description: "Track every rupee of credit given to farmers. No more forgotten debts.",
  },
  {
    icon: Package,
    title: "Stock Management",
    titleHi: "स्टॉक प्रबंधन",
    description: "Batch tracking, expiry alerts, low stock warnings. Never lose money to expired stock.",
  },
  {
    icon: Receipt,
    title: "Quick Billing",
    titleHi: "तुरंत बिल",
    description: "Generate bills in seconds. Share on WhatsApp. GST-ready.",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp Reminders",
    titleHi: "WhatsApp रिमाइंडर",
    description: "Send payment reminders to farmers with one tap. Collect faster.",
  },
  {
    icon: BarChart3,
    title: "Business Reports",
    titleHi: "बिज़नेस रिपोर्ट",
    description: "Daily sales, monthly profit, top debtors — all at a glance.",
  },
  {
    icon: Shield,
    title: "Safe & Secure",
    titleHi: "सुरक्षित डेटा",
    description: "Your data is encrypted and backed up. Never lose your records again.",
  },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-green-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-green-700 flex items-center justify-center">
              <Leaf className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-green-900 tracking-tight">
              AgriDesk
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-gray-500 hover:text-green-800 transition-colors">Features</a>
            <a href="#pricing" className="text-sm text-gray-500 hover:text-green-800 transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden sm:inline-flex text-sm font-medium text-gray-600 hover:text-green-800 px-4 py-2">
              Log in
            </Link>
            <Link href="/signup" className="hidden sm:inline-flex text-sm font-medium text-white bg-green-700 hover:bg-green-800 rounded-lg px-5 py-2.5 transition-colors shadow-sm">
              शुरू करें
            </Link>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-green-50 hover:text-green-800 transition-colors">
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-green-100 bg-white px-6 py-4 space-y-3">
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-gray-600 hover:text-green-800 py-1">Features</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-gray-600 hover:text-green-800 py-1">Pricing</a>
            <div className="flex gap-3 pt-2 border-t border-gray-100">
              <Link href="/login" className="flex-1 text-center text-sm font-medium text-gray-600 border border-gray-200 rounded-lg px-4 py-2.5 hover:bg-gray-50">
                Log in
              </Link>
              <Link href="/signup" className="flex-1 text-center text-sm font-medium text-white bg-green-700 hover:bg-green-800 rounded-lg px-4 py-2.5">
                शुरू करें
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-white to-emerald-50" />
        <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-24 md:pt-28 md:pb-32">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full bg-green-50 border border-green-200 px-4 py-1.5 mb-6">
              <Star className="h-3.5 w-3.5 text-green-700 fill-green-700" />
              <span className="text-xs font-medium text-green-800">भारत के कृषि डीलर्स के लिए बनाया गया</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-green-950 tracking-tight leading-[1.1]">
              अपनी दुकान का हिसाब{" "}
              <span className="text-green-600">स्मार्ट</span> रखें
            </h1>
            <p className="text-lg md:text-xl text-gray-500 mt-6 max-w-2xl mx-auto leading-relaxed">
              उधारी, स्टॉक, बिलिंग — सब कुछ अपने फ़ोन से मैनेज करें।
              <br className="hidden md:block" />
              <span className="text-gray-400">Manage credit, stock & billing — all from your phone.</span>
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
              <Link
                href="/signup"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-green-700 hover:bg-green-800 text-white font-medium rounded-lg px-8 py-3.5 text-sm transition-all shadow-sm shadow-green-200 hover:shadow-md"
              >
                14 दिन फ्री ट्राई करें <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#features"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-gray-200 hover:border-green-300 bg-white text-gray-700 font-medium rounded-lg px-8 py-3.5 text-sm transition-all"
              >
                Features देखें
              </a>
            </div>
            <p className="text-xs text-gray-400 mt-4">
              कोई क्रेडिट कार्ड नहीं चाहिए &middot; 2 मिनट में शुरू करें
            </p>
          </div>

          {/* Dashboard Preview */}
          <div className="mt-16 max-w-4xl mx-auto">
            <div className="rounded-2xl border border-green-200 bg-white shadow-2xl shadow-green-100/50 overflow-hidden">
              <div className="bg-green-800 px-6 py-3 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-green-500/40" />
                  <div className="w-3 h-3 rounded-full bg-green-500/40" />
                  <div className="w-3 h-3 rounded-full bg-green-500/40" />
                </div>
                <span className="text-green-200 text-xs ml-2">AgriDesk Dashboard</span>
              </div>
              <div className="p-6 md:p-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="rounded-xl bg-red-50 border border-red-100 p-4">
                    <p className="text-xs text-red-400 font-medium">कुल उधारी</p>
                    <p className="text-2xl font-bold text-red-700 mt-1">₹4,85,200</p>
                  </div>
                  <div className="rounded-xl bg-green-50 border border-green-100 p-4">
                    <p className="text-xs text-green-500 font-medium">आज की बिक्री</p>
                    <p className="text-2xl font-bold text-green-800 mt-1">₹24,500</p>
                  </div>
                  <div className="rounded-xl bg-amber-50 border border-amber-100 p-4">
                    <p className="text-xs text-amber-500 font-medium">एक्सपायरी जल्द</p>
                    <p className="text-2xl font-bold text-amber-700 mt-1">12</p>
                  </div>
                  <div className="rounded-xl bg-blue-50 border border-blue-100 p-4">
                    <p className="text-xs text-blue-400 font-medium">कुल किसान</p>
                    <p className="text-2xl font-bold text-blue-800 mt-1">156</p>
                  </div>
                </div>
                <div className="mt-6 flex gap-4">
                  <div className="flex-1 rounded-xl bg-gray-50 border border-gray-100 p-4">
                    <p className="text-xs text-gray-400 font-semibold mb-3">टॉप उधारी वाले किसान</p>
                    <div className="space-y-2.5">
                      {["रामू यादव — ₹45,000", "सुरेश पटेल — ₹38,500", "मोहन सिंह — ₹32,000"].map((f) => (
                        <div key={f} className="flex items-center justify-between text-sm">
                          <span className="text-gray-700">{f.split("—")[0]}</span>
                          <span className="font-semibold text-red-600">{f.split("—")[1]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="hidden md:flex flex-1 rounded-xl bg-gray-50 border border-gray-100 p-4 items-end gap-1.5 justify-center">
                    {[30, 50, 35, 65, 45, 80, 60, 75, 55, 90, 70, 85].map((h, i) => (
                      <div key={i} className="w-5 rounded-t bg-green-400/60" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile callout */}
      <section className="py-16 bg-green-800">
        <div className="max-w-4xl mx-auto px-6 flex flex-col md:flex-row items-center gap-8">
          <div className="h-16 w-16 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
            <Smartphone className="h-8 w-8 text-green-200" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">फ़ोन पर चलाएं, कहीं भी</h3>
            <p className="text-green-200 mt-1 text-sm">
              Web browser में खोलें या Play Store से app डाउनलोड करें। दोनों तरीके से चलेगा।
              <br />
              <span className="text-green-300">Works on any phone — browser or Android app.</span>
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 md:py-28 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-sm font-semibold text-green-700 tracking-wide uppercase">Features</p>
            <h2 className="text-3xl md:text-4xl font-bold text-green-950 mt-3 tracking-tight">
              आपकी दुकान के लिए सब कुछ
            </h2>
            <p className="text-gray-500 mt-4 text-lg">Everything your shop needs, in one app.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-green-200 transition-all group">
                <div className="h-12 w-12 rounded-xl bg-green-50 flex items-center justify-center mb-4 group-hover:bg-green-100 transition-colors">
                  <f.icon className="h-6 w-6 text-green-700" />
                </div>
                <h3 className="text-base font-semibold text-green-950">
                  {f.titleHi} <span className="text-gray-400 font-normal text-sm">/ {f.title}</span>
                </h3>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 md:py-28 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-sm font-semibold text-green-700 tracking-wide uppercase">Pricing</p>
            <h2 className="text-3xl md:text-4xl font-bold text-green-950 mt-3 tracking-tight">
              एक दाम, सब कुछ शामिल
            </h2>
            <p className="text-gray-500 mt-4 text-lg">One price. Everything included. No hidden charges.</p>
          </div>
          <div className="max-w-md mx-auto">
            <div className="rounded-2xl border-2 border-green-200 bg-gradient-to-b from-green-50/50 to-white p-8 shadow-lg ring-1 ring-green-600/10">
              <div className="text-center">
                <span className="text-xs font-semibold text-green-700 bg-green-100 rounded-full px-3 py-1">
                  सब कुछ शामिल / Everything Included
                </span>
                <div className="mt-6">
                  <span className="text-5xl font-bold text-green-950">₹499</span>
                  <span className="text-gray-400 text-sm">/महीना</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">वार्षिक: ₹4,999/साल (2 महीने फ्री)</p>
              </div>
              <ul className="mt-8 space-y-3">
                {[
                  "अनलिमिटेड किसान / Unlimited farmers",
                  "उधारी खाता / Credit ledger",
                  "स्टॉक और एक्सपायरी ट्रैकिंग / Stock & expiry tracking",
                  "बिलिंग + GST / Billing + GST",
                  "WhatsApp रिमाइंडर / WhatsApp reminders",
                  "डैशबोर्ड और रिपोर्ट / Dashboard & reports",
                  "हिंदी + English",
                  "Web + Android App",
                  "1 स्टाफ अकाउंट / 1 staff account",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-gray-700">
                    <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5 shrink-0">
                      <Check className="h-3 w-3 text-green-700" />
                    </div>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="mt-8 block text-center rounded-xl bg-green-700 hover:bg-green-800 text-white font-medium py-3 px-6 text-sm transition-colors shadow-sm"
              >
                14 दिन फ्री शुरू करें
              </Link>
              <p className="text-center text-xs text-gray-400 mt-3">कोई क्रेडिट कार्ड नहीं चाहिए</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-green-700 to-green-800">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
            अपनी दुकान को डिजिटल बनाएं
          </h2>
          <p className="text-green-100 mt-4 text-lg">
            हज़ारों डीलर्स पहले से अपना कारोबार AgriDesk से मैनेज कर रहे हैं।
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 mt-8 bg-white text-green-800 font-medium rounded-lg px-8 py-3.5 text-sm hover:bg-green-50 transition-colors shadow-sm"
          >
            अभी शुरू करें <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded bg-green-700 flex items-center justify-center">
              <Leaf className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-semibold text-green-900 text-sm">AgriDesk</span>
          </div>
          <p className="text-sm text-gray-400">&copy; {new Date().getFullYear()} AgriDesk. Made in India.</p>
        </div>
      </footer>
    </div>
  );
}
