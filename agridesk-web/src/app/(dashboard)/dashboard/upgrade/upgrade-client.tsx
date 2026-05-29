"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Crown, AlertTriangle } from "lucide-react";
import type { SubscriptionStatus } from "@/lib/subscription";
import { api, ApiError } from "@/lib/api";
import { toast } from "sonner";

const features = [
  "अनलिमिटेड किसान / Unlimited farmers",
  "उधारी खाता / Credit ledger",
  "स्टॉक और एक्सपायरी ट्रैकिंग / Stock & expiry tracking",
  "बिलिंग + GST / Billing + GST",
  "WhatsApp रिमाइंडर / WhatsApp reminders",
  "डैशबोर्ड और रिपोर्ट / Dashboard & reports",
  "हिंदी + English",
  "Web + Android App",
  "1 स्टाफ अकाउंट / 1 staff account",
];

export function UpgradeClient({ status, daysLeft, dealerId: _dealerId }: { status: SubscriptionStatus; daysLeft: number; dealerId: string }) {
  useEffect(() => {
    if (document.getElementById("razorpay-checkout")) return;
    const script = document.createElement("script");
    script.id = "razorpay-checkout";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  async function handleUpgrade() {
    try {
      const data = await api.payment.createOrder();

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "AgriDesk",
        description: "Monthly Subscription - ₹499/month",
        order_id: data.orderId,
        handler: async function (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) {
          try {
            await api.payment.verify({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            toast.success("सब्सक्रिप्शन एक्टिव हो गया!");
            setTimeout(() => window.location.reload(), 800);
          } catch {
            toast.error("भुगतान सत्यापन विफल");
          }
        },
        theme: { color: "#15803d" },
      };

      const win = window as unknown as { Razorpay: new (o: typeof options) => { open: () => void } };
      const rzp = new win.Razorpay(options);
      rzp.open();
    } catch (err) {
      if (err instanceof ApiError && err.status === 503) {
        toast.error("भुगतान गेटवे सेटअप नहीं है। सपोर्ट से संपर्क करें।");
      } else {
        toast.error("कुछ गलत हो गया। कृपया दोबारा कोशिश करें।");
      }
    }
  }

  return (
    <div className="max-w-md mx-auto">
      {status === "expired" && (
        <Card className="border-red-200 bg-red-50 mb-6 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-red-800">आपका ट्राई खत्म हो गया है</p>
                <p className="text-sm text-red-600 mt-1">डेटा सुरक्षित है। सब्सक्राइब करके फीचर्स वापस चालू करें।</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {status === "trial" && (
        <Card className="border-amber-200 bg-amber-50 mb-6 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Crown className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-amber-800">फ्री ट्राई — {daysLeft} दिन बाकी</p>
                <p className="text-sm text-amber-600 mt-1">ट्राई खत्म होने से पहले सब्सक्राइब करें।</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {status === "active" && (
        <Card className="border-green-200 bg-green-50 mb-6 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Crown className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-green-800">आपका प्लान एक्टिव है</p>
                <p className="text-sm text-green-600 mt-1">सभी फीचर्स अनलॉक हैं।</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-2 border-green-200 shadow-lg">
        <CardContent className="p-8">
          <div className="text-center">
            <span className="text-xs font-semibold text-green-700 bg-green-100 rounded-full px-3 py-1">
              सब कुछ शामिल
            </span>
            <div className="mt-4">
              <span className="text-5xl font-bold text-green-950">₹499</span>
              <span className="text-gray-400 text-sm">/महीना</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">वार्षिक: ₹4,999/साल (2 महीने फ्री)</p>
          </div>

          <ul className="mt-6 space-y-2.5">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-gray-700">
                <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5 shrink-0">
                  <Check className="h-3 w-3 text-green-700" />
                </div>
                {f}
              </li>
            ))}
          </ul>

          {status !== "active" && (
            <Button onClick={handleUpgrade} className="w-full mt-6 bg-green-700 hover:bg-green-800 text-white py-3">
              <Crown className="h-4 w-4 mr-2" />
              अभी सब्सक्राइब करें
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
