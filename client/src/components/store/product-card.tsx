"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import { useCart } from "@/components/cart/cart-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { sendChatbotEvent } from "@/lib/chatbot";
import type { Product } from "@/types/products";
import { formatCurrencyINR } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem, items, totalItems, subtotal } = useCart();
  const [isPending, startTransition] = useTransition();

  const handleProductClick = () => {
    void sendChatbotEvent("product.clicked", {
      productId: product.id,
      title: product.title,
      price: product.price,
    });
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
        1,
      );

      toast.success(`${product.title} added to cart`);

      const existing = items.find((item) => item.productId === product.id);
      const nextQuantity = existing ? existing.quantity + 1 : 1;
      const nextTotalItems = totalItems + 1;
      const nextSubtotal = subtotal + product.price;

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
    <Card className="group flex h-full flex-col overflow-hidden">
      <Link href={`/products/${product.id}`} onClick={handleProductClick}>
        <div className="relative aspect-square w-full overflow-hidden bg-muted">
          {product.images?.[0] ? (
            <Image
              src={product.images[0]}
              alt={product.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              No image
            </div>
          )}
          {product.stock <= 0 ? (
            <Badge className="absolute left-3 top-3 bg-destructive text-destructive-foreground">
              Out of stock
            </Badge>
          ) : null}
        </div>
      </Link>
      <CardContent className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-1 text-lg font-semibold">{product.title}</h3>
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {product.description}
        </p>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-base font-semibold">
            {formatCurrencyINR(product.price)}
          </span>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button className="w-full" onClick={handleAddToCart} disabled={product.stock <= 0 || isPending}>
          <ShoppingBag className="mr-2 h-4 w-4" />
          Add to cart
        </Button>
      </CardFooter>
    </Card>
  );
}
