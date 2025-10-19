"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { useCart } from "@/components/cart/cart-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sendChatbotEvent } from "@/lib/chatbot";
import { formatCurrencyINR } from "@/lib/utils";
import type { Product } from "@/types/products";

interface ProductDetailProps {
  product: Product;
}

export function ProductDetail({ product }: ProductDetailProps) {
  const { addItem, items, subtotal, totalItems } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    void sendChatbotEvent("product.viewed", {
      productId: product.id,
      title: product.title,
      price: product.price,
    });
  }, [product.id, product.price, product.title]);

  const maxQuantity = useMemo(() => {
    if (typeof product.stock === "number" && product.stock > 0) {
      return Math.min(product.stock, 99);
    }

    return 99;
  }, [product.stock]);

  const handleQuantityChange = (value: number) => {
    if (Number.isNaN(value)) {
      return;
    }

    const normalized = Math.max(1, Math.min(maxQuantity, Math.floor(value)));
    setQuantity(normalized);
  };

  const handleAddToCart = () => {
    startTransition(() => {
      addItem(
        {
          productId: product.id,
          title: product.title,
          price: product.price,
          image: product.images?.[0] ?? null,
          stock: product.stock,
        },
        quantity,
      );

      toast.success(`${product.title} added to cart`, {
        description: quantity > 1 ? `${quantity} items added` : undefined,
      });

      const existing = items.find((item) => item.productId === product.id);
      const previousQuantity = existing?.quantity ?? 0;
      const nextQuantity = previousQuantity + quantity;
      const nextTotalItems = totalItems - previousQuantity + nextQuantity;
      const nextSubtotal = subtotal - product.price * previousQuantity + product.price * nextQuantity;

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

  return (
    <div className="container grid gap-10 lg:grid-cols-2">
      <div className="grid gap-4">
        <div className="relative aspect-square overflow-hidden rounded-lg border bg-muted">
          {product.images?.[0] ? (
            <Image
              src={product.images[0]}
              alt={product.title}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              No image available
            </div>
          )}
          {product.stock <= 0 ? (
            <Badge className="absolute left-3 top-3 bg-destructive text-destructive-foreground">
              Out of stock
            </Badge>
          ) : (
            <Badge className="absolute left-3 top-3">In stock</Badge>
          )}
        </div>
        {product.images?.length ? (
          <div className="grid grid-cols-4 gap-2">
            {product.images.slice(0, 4).map((image, index) => (
              <div key={image ?? index} className="relative aspect-square overflow-hidden rounded-md border">
                <Image src={image} alt={`${product.title} ${index + 1}`} fill className="object-cover" />
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Link href="/shop" className="text-sm text-muted-foreground hover:text-primary">
            &larr; Back to shop
          </Link>
          <h1 className="text-3xl font-semibold">{product.title}</h1>
          <p className="text-muted-foreground">{product.description}</p>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-3xl font-bold text-primary">
            {formatCurrencyINR(product.price)}
          </span>
          <span className="text-sm text-muted-foreground">
            Category: <span className="font-medium text-foreground">{product.category}</span>
          </span>
        </div>

        <div className="space-y-4 rounded-lg border bg-background p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <label htmlFor="quantity" className="text-sm font-medium text-muted-foreground">
              Quantity
            </label>
            <Input
              id="quantity"
              type="number"
              min={1}
              max={maxQuantity}
              value={quantity}
              onChange={(event) => handleQuantityChange(Number(event.target.value))}
              className="w-24"
            />
            <span className="text-xs text-muted-foreground">
              {product.stock > 0
                ? `${product.stock} available`
                : "Currently unavailable"}
            </span>
          </div>
          <Button
            className="w-full"
            onClick={handleAddToCart}
            disabled={product.stock <= 0 || isPending}
          >
            Add to cart
          </Button>
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Product details</h2>
          <ul className="grid gap-2 text-sm text-muted-foreground">
            <li>
              <span className="font-medium text-foreground">SKU:</span> {product.id}
            </li>
            <li>
              <span className="font-medium text-foreground">Updated:</span> {new Date(product.updatedAt).toLocaleString()}
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
