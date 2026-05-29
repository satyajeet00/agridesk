"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Leaf, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { saveSession } from "@/lib/session";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.auth.login(form);
      saveSession(res);
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        toast.error("ईमेल या पासवर्ड गलत है");
      } else {
        toast.error("कुछ गलत हो गया");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-700 to-green-900 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fff' fill-opacity='0.15'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/svg%3E\")" }} />
        <div className="relative">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center">
              <Leaf className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">AgriDesk</span>
          </div>
        </div>
        <div className="relative">
          <h2 className="text-3xl font-bold text-white leading-tight">
            अपनी दुकान का पूरा<br />हिसाब-किताब यहाँ रखें
          </h2>
          <p className="text-green-200 mt-4 text-lg leading-relaxed">
            उधारी, स्टॉक, बिल — सब कुछ एक जगह।
          </p>
        </div>
        <p className="relative text-sm text-green-300">Smart dukaan management for agri-input dealers</p>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="h-9 w-9 rounded-lg bg-green-700 flex items-center justify-center">
              <Leaf className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-green-900">AgriDesk</span>
          </div>

          <h1 className="text-2xl font-bold text-green-950">वापस स्वागत है</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to your dashboard</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">ईमेल / Email</label>
              <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
                placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">पासवर्ड / Password</label>
              <div className="relative">
                <input type={showPw ? "text" : "password"} required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent pr-10"
                  placeholder="अपना पासवर्ड डालें" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full rounded-lg bg-green-700 hover:bg-green-800 text-white font-medium py-2.5 text-sm transition-colors disabled:opacity-50 shadow-sm">
              {loading ? "लॉग इन हो रहा है..." : "लॉग इन करें"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            अकाउंट नहीं है?{" "}
            <Link href="/signup" className="font-medium text-green-700 hover:text-green-800">रजिस्टर करें</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
