import type { Metadata } from "next";
import { CartView } from "@/components/store/cart-view";

export const metadata: Metadata = { title: "Your bag", robots: { index: false } };

export default function CartPage() {
  return (
    <div className="container-page py-12 md:py-16">
      <h1 className="heading mb-10 text-center text-5xl md:text-6xl">Your bag</h1>
      <CartView />
    </div>
  );
}
