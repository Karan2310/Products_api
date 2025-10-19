import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductDetail } from "@/components/store/product-detail";
import type { Product } from "@/types/products";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

const fetchProduct = async (id: string): Promise<Product | null> => {
  if (!apiBaseUrl) {
    throw new Error("API base URL is not configured");
  }

  const response = await fetch(`${apiBaseUrl}/api/products/${id}`, {
    cache: "no-store",
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Failed to load product");
  }

  return response.json();
};

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const product = await fetchProduct(resolvedParams.id);

  if (!product) {
    return {
      title: "Product not found",
    } satisfies Metadata;
  }

  return {
    title: product.title,
    description: product.description,
  } satisfies Metadata;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const resolvedParams = await params;
  const product = await fetchProduct(resolvedParams.id);

  if (!product) {
    notFound();
  }

  return <ProductDetail product={product} />;
}
