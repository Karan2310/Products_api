"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState, useTransition, type CSSProperties } from "react";
import { toast } from "sonner";

import { useCart } from "@/components/cart/cart-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { queuePendingCartItem } from "@/lib/pending-cart";
import { cn, formatCurrencyINR } from "@/lib/utils";
import { sendChatbotEvent } from "@/lib/chatbot";
import type { Product } from "@/types/products";

interface ProductDetailProps {
  product: Product;
}

export function ProductDetail({ product }: ProductDetailProps) {
  const { addItem, items, subtotal, totalItems } = useCart();
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState<1 | -1>(1);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    void sendChatbotEvent("product.viewed", {
      productId: product.id,
      title: product.title,
      price: product.price,
    });
  }, [product.id, product.price, product.title]);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [product.id]);

  const maxQuantity = useMemo(() => {
    if (typeof product.stock === "number" && product.stock > 0) {
      return Math.min(product.stock, 99);
    }

    return 99;
  }, [product.stock]);
  const quantityOptions = useMemo(() => {
    if (product.stock !== undefined && product.stock <= 0) {
      return [] as number[];
    }
    const limit = Math.min(maxQuantity, product.stock ?? 10, 10);
    return Array.from({ length: limit }, (_, index) => index + 1);
  }, [maxQuantity, product.stock]);

  useEffect(() => {
    if (quantityOptions.length === 0) {
      return;
    }

    const highestOption = quantityOptions[quantityOptions.length - 1];
    if (quantity > highestOption) {
      setQuantity(highestOption);
    }
  }, [quantity, quantityOptions]);

  const images = useMemo(() => {
    if (product.images?.length) {
      return product.images;
    }
    return [null];
  }, [product.images]);

  const activeImage = images[activeImageIndex] ?? null;

  const handleQuantityChange = (value: number) => {
    if (Number.isNaN(value)) {
      return;
    }

    const normalized = Math.max(1, Math.min(maxQuantity, Math.floor(value)));
    setQuantity(normalized);
  };

  const handleAddToCart = () => {
    if (!session?.user) {
      queuePendingCartItem(
        {
          productId: product.id,
          title: product.title,
          price: product.price,
          image: product.images?.[0] ?? null,
          stock: product.stock,
        },
        quantity,
      );

      toast.info("Sign in to add this item", {
        description: "We saved your selection and will add it to your cart after you sign in.",
      });

      const redirectPath = pathname ?? `/products/${product.id}`;
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
        quantity,
      );

      toast.success(`${product.title} added to cart`, {
        description: quantity > 1 ? `${quantity} items added` : undefined,
      });

      const existing = items.find((item) => item.productId === product.id);
      const previousQuantity = existing?.quantity ?? 0;
      const nextQuantity = previousQuantity + quantity;
      const nextTotalItems = totalItems - previousQuantity + nextQuantity;
      const nextSubtotal =
        subtotal - product.price * previousQuantity + product.price * nextQuantity;

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
    <div className="container grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)]">
      <div className="flex flex-col gap-6">
        <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-background/95 p-5 shadow-[0_18px_40px_-28px_rgba(10,10,10,0.35)]">
          <div className="relative flex items-center justify-center">
            {images.length > 1 ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 z-10 h-8 w-8 -translate-y-1/2 rounded-full border border-border/60 bg-background/90 shadow-sm hover:bg-background/95"
                  onClick={() => {
                    if (images.length <= 1) {
                      return;
                    }
                    setSlideDirection(-1);
                    setActiveImageIndex((index) => (index - 1 + images.length) % images.length);
                  }}
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 z-10 h-8 w-8 -translate-y-1/2 rounded-full border border-border/60 bg-background/90 shadow-sm hover:bg-background/95"
                  onClick={() => {
                    if (images.length <= 1) {
                      return;
                    }
                    setSlideDirection(1);
                    setActiveImageIndex((index) => (index + 1) % images.length);
                  }}
                  aria-label="Next image"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            ) : null}

            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-muted shadow-[inset_0_1px_20px_rgba(0,0,0,0.08)]">
              <div
                key={activeImage ?? "placeholder"}
                className="absolute inset-0 animate-image-slide"
                style={
                  {
                    "--slide-direction": String(slideDirection),
                  } as CSSProperties
                }
              >
                {activeImage ? (
                  <Image src={activeImage} alt={product.title} fill priority className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                    No image available
                  </div>
                )}
              </div>
            </div>
            <Badge
              className="absolute left-5 top-5 rounded-full border border-border/60 bg-background/95 px-3 py-1 text-[0.6rem] font-semibold uppercase tracking-wide text-muted-foreground"
              variant={product.stock > 0 ? "outline" : "destructive"}
            >
              {product.stock > 0 ? "In stock" : "Out of stock"}
            </Badge>
          </div>
        </div>

        {images.length > 1 ? (
          <div className="flex gap-3 overflow-x-auto rounded-2xl border border-border/60 bg-background/80 px-3 py-3 shadow-[0_8px_24px_-26px_rgba(0,0,0,0.45)]">
            {images.map((image, index) => (
              <button
                key={`${image ?? "placeholder"}-${index}`}
                type="button"
                onClick={() => {
                  if (index === activeImageIndex) {
                    return;
                  }
                  setSlideDirection(index > activeImageIndex ? 1 : -1);
                  setActiveImageIndex(index);
                }}
                className={cn(
                  "relative aspect-square w-[4.5rem] shrink-0 overflow-hidden rounded-xl border border-border/60 bg-background transition-all duration-200 ease-out",
                  activeImageIndex === index
                    ? "shadow-md ring-2 ring-primary ring-offset-2 ring-offset-background"
                    : "opacity-75 hover:opacity-100 hover:shadow-sm",
                )}
                aria-label={`View image ${index + 1}`}
              >
                {image ? (
                  <Image
                    src={image}
                    alt={`${product.title} ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                    No image
                  </div>
                )}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <Link href="/shop" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary">
            &larr; Back to shop
          </Link>
          <div className="space-y-4 rounded-3xl border border-border/70 bg-background/95 p-6 shadow-[0_14px_40px_-28px_rgba(0,0,0,0.3)]">
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold leading-tight">{product.title}</h1>
              <p className="text-sm leading-relaxed text-muted-foreground">{product.description}</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/90 p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <span className="text-2xl font-bold text-primary">
                  {formatCurrencyINR(product.price)}
                </span>
                <span className="text-sm text-muted-foreground">
                  Category: <span className="font-medium text-foreground">{product.category}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-3xl border border-border/70 bg-background p-6 shadow-sm">
          <div className="flex flex-col gap-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Customize
            </span>
            <div className="flex flex-wrap items-center gap-4">
              <label htmlFor="quantity" className="text-sm font-medium text-muted-foreground">
                Quantity
              </label>
              <Select
                value={String(quantity)}
                onValueChange={(value) => handleQuantityChange(Number(value))}
                disabled={quantityOptions.length === 0}
              >
                <SelectTrigger id="quantity" className="w-28 rounded-full">
                  <SelectValue placeholder="Select qty" />
                </SelectTrigger>
                <SelectContent>
                  {quantityOptions.map((option) => (
                    <SelectItem key={option} value={String(option)}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-xs text-muted-foreground">
                {product.stock > 0 ? `${product.stock} available` : "Currently unavailable"}
              </span>
            </div>
          </div>
          <Button
            className="w-full rounded-full py-5 text-sm font-semibold"
            onClick={handleAddToCart}
            disabled={product.stock <= 0 || isPending}
          >
            {session?.user ? "Add to cart" : "Sign in to add"}
          </Button>
        </div>

        <div className="space-y-4 rounded-3xl border border-border/70 bg-background p-6 shadow-sm">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Product details
            </span>
            <h2 className="text-lg font-semibold text-foreground">Specifications</h2>
          </div>
          <ul className="grid gap-3 text-sm text-muted-foreground">
            <li className="flex justify-between gap-4 border-b border-dashed border-border/60 pb-2 text-xs md:text-sm">
              <span className="font-medium text-foreground">SKU</span>
              <span className="font-mono text-xs uppercase text-muted-foreground">{product.id}</span>
            </li>
            <li className="flex justify-between gap-4 text-xs md:text-sm">
              <span className="font-medium text-foreground">Last updated</span>
              <span>{new Date(product.updatedAt).toLocaleString()}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
