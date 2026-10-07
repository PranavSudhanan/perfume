"use client";

import { Check, Mail, MessageSquare, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useSyncExternalStore } from "react";

const EVENT = "order-placed-dismissed";
/** Fallback for browsers where session storage is unavailable (e.g. private mode). */
const dismissedThisVisit = new Set<string>();

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  return () => window.removeEventListener(EVENT, onChange);
}

function isDismissed(key: string) {
  if (dismissedThisVisit.has(key)) return true;
  try {
    return window.sessionStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function dismiss(key: string) {
  dismissedThisVisit.add(key);
  try {
    window.sessionStorage.setItem(key, "1");
  } catch {
    // The in-memory set above still keeps it closed for this visit.
  }
  window.dispatchEvent(new Event(EVENT));
}

/**
 * The "order placed" popup shown right after checkout. It only claims an email
 * or text was sent when the server recorded that it actually went out.
 * Once closed it stays closed, even if the customer refreshes the page.
 */
export function OrderPlacedDialog({
  orderId,
  orderNumber,
  name,
  total,
  cashOnDelivery,
  emailedTo,
  textedTo,
}: {
  orderId: string;
  orderNumber: string;
  name: string;
  total: string;
  cashOnDelivery: boolean;
  emailedTo: string | null;
  textedTo: string | null;
}) {
  const key = `order-placed:${orderId}`;
  // On the server (and while hydrating) the popup counts as dismissed, so nothing flashes.
  const dismissed = useSyncExternalStore(
    subscribe,
    () => isDismissed(key),
    () => true,
  );
  const primary = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (dismissed) return;
    primary.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") dismiss(key);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [dismissed, key]);

  if (dismissed) return null;

  return (
    // The outer layer scrolls, so the whole card stays reachable on short screens.
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div className="fixed inset-0 bg-black/55" onClick={() => dismiss(key)} />
      <div className="pointer-events-none relative flex min-h-full items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="order-placed-title"
          className="bg-bg text-ink rounded-theme animate-fade-up pointer-events-auto relative w-full max-w-md px-7 py-9 text-center shadow-2xl sm:px-10"
        >
          <button
            type="button"
            onClick={() => dismiss(key)}
            className="text-muted hover:text-ink absolute top-3 right-3 p-2"
            aria-label="Close"
          >
            <X className="size-5" strokeWidth={1.5} />
          </button>

          <span className="bg-primary text-on-primary mx-auto flex size-14 items-center justify-center rounded-full">
            <Check className="size-7" strokeWidth={2} />
          </span>
          <p className="eyebrow mt-6">Order {orderNumber}</p>
          <h2 id="order-placed-title" className="heading mt-2 text-4xl">
            Order placed!
          </h2>
          <p className="text-muted mt-3 leading-relaxed">
            Thank you, {name}.{" "}
            {cashOnDelivery
              ? `Please keep ${total} ready to pay when your order arrives.`
              : `We’ve received your payment of ${total}.`}
          </p>

          {emailedTo || textedTo ? (
            <ul className="border-line mt-6 space-y-3 border-y py-5 text-left text-sm">
              {emailedTo && (
                <li className="flex items-start gap-3">
                  <Mail className="text-accent mt-0.5 size-4 shrink-0" strokeWidth={1.5} />
                  <span>
                    A confirmation email is on its way to{" "}
                    <span className="font-medium [overflow-wrap:anywhere]">{emailedTo}</span>
                  </span>
                </li>
              )}
              {textedTo && (
                <li className="flex items-start gap-3">
                  <MessageSquare className="text-accent mt-0.5 size-4 shrink-0" strokeWidth={1.5} />
                  <span>
                    We’ve sent a text message to <span className="font-medium">{textedTo}</span>
                  </span>
                </li>
              )}
            </ul>
          ) : (
            <p className="border-line text-muted mt-6 border-y py-5 text-sm">
              Keep your order number handy — you can use it to track your order at any time.
            </p>
          )}

          <div className="mt-7 flex flex-col gap-3">
            <button
              ref={primary}
              type="button"
              onClick={() => dismiss(key)}
              className="btn btn-primary w-full"
            >
              View order details
            </button>
            <Link href="/shop" className="btn btn-outline w-full">
              Continue shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
