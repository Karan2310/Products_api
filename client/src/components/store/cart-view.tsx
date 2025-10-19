"use client";

import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { toast } from "sonner";

import { useCart } from "@/components/cart/cart-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sendChatbotEvent } from "@/lib/chatbot";
import { formatCurrencyINR } from "@/lib/utils";

export function CartView() {
  const { items, subtotal, totalItems, updateQuantity, removeItem } = useCart();
  const { data: session } = useSession();
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);

  const handleQuantityChange = (productId: string, quantity: number) => {
    const existingItem = items.find((cartItem) => cartItem.productId === productId);
    const normalized = Math.max(1, Math.min(99, Math.floor(quantity)));
    updateQuantity(productId, normalized);

    if (existingItem) {
      const currentTotalItems = totalItems;
      const nextTotalItems = currentTotalItems - existingItem.quantity + normalized;
      const nextSubtotal =
        subtotal - existingItem.price * existingItem.quantity + existingItem.price * normalized;

      void sendChatbotEvent("cart.updated", {
        action: "update",
        productId,
        quantity: normalized,
        cart: {
          totalItems: nextTotalItems,
          subtotal: nextSubtotal,
        },
      });
    }
  };

  const handleRemove = (productId: string) => {
    const item = items.find((cartItem) => cartItem.productId === productId);
    removeItem(productId);

    if (item) {
      toast.message(`${item.title} removed from cart`);

      const nextTotalItems = Math.max(0, totalItems - item.quantity);
      const nextSubtotal = Math.max(0, subtotal - item.price * item.quantity);

      void sendChatbotEvent("cart.updated", {
        action: "remove",
        productId,
        quantity: 0,
        cart: {
          totalItems: nextTotalItems,
          subtotal: nextSubtotal,
        },
      });
    }
  };

  const handleCheckout = () => {
    setPending("checkout");

    if (!session?.user) {
      router.push("/login?redirect=/checkout");
      setPending(null);
      return;
    }

    router.push("/checkout");
  };

  if (items.length === 0) {
    return (
      <div className="container flex flex-col items-center justify-center gap-4 py-20 text-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold">Your cart is empty</h1>
          <p className="text-muted-foreground">
            Browse the shop and add items to your cart to get started.
          </p>
        </div>
        <Button asChild>
          <Link href="/shop">Continue shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container grid gap-8 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Shopping cart</h1>
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.productId}
              className="grid gap-4 rounded-lg border bg-background p-4 shadow-sm sm:grid-cols-[auto_1fr_auto]"
            >
              <div className="relative h-24 w-24 overflow-hidden rounded-md border bg-muted">
                {item.image ? (
                  <Image src={item.image} alt={item.title} fill className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                    No image
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Link href={`/products/${item.productId}`} className="text-base font-medium hover:underline">
                  {item.title}
                </Link>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{formatCurrencyINR(item.price)}</span>
                  <span>&times;</span>
                  <Input
                    type="number"
                    min={1}
                    max={item.stock ?? 99}
                    value={item.quantity}
                    onChange={(event) => handleQuantityChange(item.productId, Number(event.target.value))}
                    className="h-9 w-20"
                  />
                </div>
              </div>
              <div className="flex flex-col items-end justify-between gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => handleRemove(item.productId)}
                >
                  <X className="h-4 w-4" />
                </Button>
                <span className="font-semibold">
                  {formatCurrencyINR(item.price * item.quantity)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <aside className="space-y-4 rounded-lg border bg-background p-6 shadow-sm">
        <div className="space-y-1 text-sm text-muted-foreground">
          <div className="flex items-center justify-between text-base text-foreground">
            <span>Subtotal</span>
            <span>{formatCurrencyINR(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Shipping</span>
            <span>Calculated at checkout</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Tax</span>
            <span>Included</span>
          </div>
        </div>
        <div className="flex items-center justify-between border-t pt-4 text-lg font-semibold">
          <span>Total</span>
          <span>{formatCurrencyINR(subtotal)}</span>
        </div>
        <Button className="w-full" onClick={handleCheckout} disabled={pending !== null}>
          Proceed to checkout
        </Button>
        {!session?.user ? (
          <p className="text-xs text-muted-foreground">
            You&apos;ll be asked to sign in or create an account before placing your order.
          </p>
        ) : null}
      </aside>
    </div>
  );
}
