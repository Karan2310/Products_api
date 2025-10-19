"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

import { useCart } from "@/components/cart/cart-provider";
import { consumePendingCartItems } from "@/lib/pending-cart";

export function PendingCartSync() {
  const { addItem } = useCart();
  const { status } = useSession();
  const [processed, setProcessed] = useState(false);

  useEffect(() => {
    if (processed) {
      return;
    }

    if (status !== "authenticated") {
      return;
    }

    const pending = consumePendingCartItems();
    if (pending.length === 0) {
      setProcessed(true);
      return;
    }

    pending.forEach(({ item, quantity }) => {
      addItem(item, quantity);
    });

    toast.success("Saved items were added to your cart.");
    setProcessed(true);
  }, [status, processed, addItem]);

  return null;
}
