"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { confirmPaymentAction, startPaymentAction } from "@/lib/actions/shop";

type RazorpayResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  order_id: string;
  prefill: { name: string; email: string; contact: string };
  handler: (response: RazorpayResponse) => void;
  modal: { ondismiss: () => void };
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => { open: () => void };
  }
}

const SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

function loadCheckout() {
  return new Promise<void>((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const script = document.createElement("script");
    script.src = SCRIPT;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load the payment window."));
    document.body.appendChild(script);
  });
}

/** Opens Razorpay Checkout for an unpaid order and confirms the payment server-side. */
export function PayNow({ orderId, autoStart }: { orderId: string; autoStart: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  const pay = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const session = await startPaymentAction(orderId);
      if (!session.ok) throw new Error(session.error);
      await loadCheckout();
      if (!window.Razorpay) throw new Error("Could not load the payment window.");
      new window.Razorpay({
        key: session.keyId,
        amount: session.amount,
        currency: session.currency,
        name: session.storeName,
        order_id: session.gatewayOrderId,
        prefill: { name: session.name, email: session.email, contact: session.phone },
        handler: async (response) => {
          const result = await confirmPaymentAction({
            orderId,
            gatewayOrderId: response.razorpay_order_id,
            paymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature,
          });
          if (!result.ok) setError(result.error);
          setBusy(false);
          router.refresh();
        },
        modal: { ondismiss: () => setBusy(false) },
      }).open();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Payment could not be started.");
      setBusy(false);
    }
  }, [orderId, router]);

  useEffect(() => {
    if (!autoStart || started.current) return;
    started.current = true;
    void pay();
  }, [autoStart, pay]);

  return (
    <div>
      <button type="button" onClick={pay} disabled={busy} className="btn btn-primary">
        {busy ? "Opening payment…" : "Pay now"}
      </button>
      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
    </div>
  );
}
