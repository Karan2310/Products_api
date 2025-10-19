import type { Metadata } from "next";

import { ProductsExplorer } from "@/components/store/products-explorer";

export const metadata: Metadata = {
  title: "Shop",
  description: "Browse the latest products and place orders easily.",
};

export default function ShopPage() {
  return (
    <section className="bg-background">
      <div className="container space-y-12 py-10">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Find your next favourite product
          </h1>
          <p className="text-muted-foreground">
            Search, filter, and explore all products available in the catalogue. Sign in to
            save your cart and place orders fast.
          </p>
        </div>
        <ProductsExplorer />
      </div>
    </section>
  );
}
