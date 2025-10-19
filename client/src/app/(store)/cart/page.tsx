import type { Metadata } from "next";

import { CartView } from "@/components/store/cart-view";

export const metadata: Metadata = {
  title: "Cart",
  description: "Review the items you’ve saved before checking out.",
};

export default function CartPage() {
  return <CartView />;
}
