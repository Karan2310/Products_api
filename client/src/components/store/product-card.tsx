"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { useSession } from "next-auth/react";
import { useTransition } from "react";
import { toast } from "sonner";

import { useCart } from "@/components/cart/cart-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { queuePendingCartItem } from "@/lib/pending-cart";
import { cn, formatCurrencyINR } from "@/lib/utils";
import { sendChatbotEvent } from "@/lib/chatbot";
import type { Product } from "@/types/products";

interface ProductCardProps {
  product: Product;
}

const normalizeStockValue = (stock?: number) => {
  if (typeof stock !== "number" || Number.isNaN(stock)) {
    return undefined;
  }

  return Math.max(0, Math.floor(stock));
};

export function ProductCard({ product }: ProductCardProps) {
  const { addItem, items, totalItems, subtotal, updateQuantity, removeItem } = useCart();
  const [isPending, startTransition] = useTransition();
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const normalizedStock = normalizeStockValue(product.stock);
  const existingItem = items.find((item) => item.productId === product.id);
  const existingQuantity = existingItem?.quantity ?? 0;
  const remainingStockForCart =
    normalizedStock === undefined ? undefined : Math.max(0, normalizedStock - existingQuantity);
  const isOutOfStock = normalizedStock === 0;

  const stockBadge = (() => {
    if (isOutOfStock) {
      return { variant: "destructive" as const, label: "Out of stock" };
    }

    return null;
  })();
  const showQuantityControls = Boolean(session?.user && existingItem);
  const maxAllowed = normalizedStock ?? 99;
  const canIncrement =
    showQuantityControls && existingItem ? existingItem.quantity < maxAllowed : false;

  const handleProductClick = () => {
    void sendChatbotEvent("product.clicked", {
      productId: product.id,
      title: product.title,
      price: product.price,
    });
  };

  const handleAddToCart = () => {
    const quantityToAdd = remainingStockForCart === undefined ? 1 : Math.min(1, remainingStockForCart);

    if (quantityToAdd <= 0) {
      toast.info(
        normalizedStock === 0
          ? "This item is currently out of stock."
          : `You've already added all available units (${normalizedStock}) to your cart.`,
      );
      return;
    }

    if (normalizedStock !== undefined && existingQuantity + quantityToAdd > normalizedStock) {
      toast.info(`You can buy a maximum of ${normalizedStock} ${normalizedStock === 1 ? "unit" : "units"}.`);
      return;
    }

    if (!session?.user) {
      queuePendingCartItem(
        {
          productId: product.id,
          title: product.title,
          price: product.price,
          image: product.images?.[0] ?? null,
          stock: product.stock,
        },
        quantityToAdd,
      );

      toast.info("Sign in to add this item", {
        description: "We saved it for you and will add it to your cart after you sign in.",
      });

      const redirectPath = pathname ?? "/shop";
      router.push(`/login?redirect=${encodeURIComponent(redirectPath)}`);
      return;
    }

    startTransition(() => {
      addItem(
        {
          productId: product.id,
          title: product.title,
          price: product.price,
          image: product.images?.[0] ?? null,
          stock: product.stock,
        },
        quantityToAdd,
      );

      toast.success(
        quantityToAdd === 1
          ? `${product.title} added to your cart`
          : `${quantityToAdd} units of ${product.title} added to your cart`,
      );

      const nextQuantity = (existingItem?.quantity ?? 0) + quantityToAdd;
      const nextTotalItems = totalItems + quantityToAdd;
      const nextSubtotal = subtotal + product.price * quantityToAdd;

      void sendChatbotEvent("cart.updated", {
        action: "add",
        productId: product.id,
        quantity: nextQuantity,
        cart: {
          totalItems: nextTotalItems,
          subtotal: nextSubtotal,
        },
      });
    });
  };

  const handleUpdateQuantity = (productId: string, nextQuantity: number) => {
    if (nextQuantity <= 0) {
      removeItem(productId);
      toast.message("Item removed from cart");
      return;
    }

    if (normalizedStock !== undefined && nextQuantity > normalizedStock) {
      toast.info(
        `You can buy a maximum of ${normalizedStock} ${normalizedStock === 1 ? "unit" : "units"}.`,
      );
      updateQuantity(productId, normalizedStock);
      return;
    }

    updateQuantity(productId, nextQuantity);
  };

  const stockWarning = (() => {
    if (isOutOfStock || normalizedStock === undefined) {
      return null;
    }

    if (normalizedStock <= 3) {
      return `Only ${normalizedStock} ${normalizedStock === 1 ? "unit" : "units"} left`;
    }

    if (normalizedStock <= 5) {
      return "Few units left";
    }

    return null;
  })();
  const descriptionClampClass = "line-clamp-3";

  return (
    <Card className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/50 bg-card/95 shadow-sm transition-transform duration-300 hover:-translate-y-[6px] hover:shadow-lg">
      <Link
        href={`/products/${product.id}`}
        onClick={handleProductClick}
        className="relative block aspect-[3/2] w-full overflow-hidden bg-muted"
      >
        {product.images?.[0] ? (
          <Image
            src={product.images[0]}
            alt={product.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            No image
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-5 p-5">
        <div className="flex items-center justify-between text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground">
          <span>{product.category}</span>
          {stockWarning ? (
            <span className="inline-flex items-center rounded-full bg-amber-100/90 px-3 py-1 text-[0.65rem] font-semibold text-amber-900 shadow-sm">
              {stockWarning}
            </span>
          ) : stockBadge ? (
            <Badge
              variant={stockBadge.variant}
              className={cn(
                "whitespace-nowrap text-[0.65rem]",
                stockBadge.variant === "destructive" ? "" : "bg-amber-100 text-amber-900",
              )}
            >
              {stockBadge.label}
            </Badge>
          ) : null}
        </div>

        <div className="space-y-2">
          <Link
            href={`/products/${product.id}`}
            className="block text-lg font-semibold leading-tight hover:underline"
          >
            {product.title}
          </Link>
          <p className={cn("text-sm text-muted-foreground", descriptionClampClass)}>
            {product.description}
          </p>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3">
          <span className="text-xl font-semibold text-foreground">
            {formatCurrencyINR(product.price)}
          </span>
          {showQuantityControls ? (
            <div className="flex items-center gap-2 rounded-full border border-border/70 bg-background px-3 py-1.5 shadow-sm">
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-8 w-8 rounded-full"
                onClick={() =>
                  handleUpdateQuantity(
                    existingItem!.productId,
                    Math.max(0, (existingItem?.quantity ?? 0) - 1),
                  )
                }
                disabled={isPending || (existingItem?.quantity ?? 0) <= 0}
              >
                <span className="text-lg leading-none">−</span>
              </Button>
              <span className="min-w-[1.5rem] text-center text-sm font-semibold">
                {existingItem?.quantity ?? 0}
              </span>
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-8 w-8 rounded-full"
                onClick={() =>
                  handleUpdateQuantity(existingItem!.productId, (existingItem?.quantity ?? 0) + 1)
                }
                disabled={isPending || !canIncrement}
              >
                <span className="text-lg leading-none">+</span>
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              className="gap-1.5 rounded-full px-4 py-2 whitespace-nowrap"
              onClick={handleAddToCart}
              disabled={isOutOfStock || isPending}
            >
              <ShoppingBag className="h-4 w-4" />
              {session?.user ? "Add to cart" : "Sign in to add"}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
