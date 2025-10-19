"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";

import { ProductCard } from "@/components/store/product-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProductsResponse } from "@/types/products";

const sortOptions = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
];

const getSortParams = (sort: string) => {
  switch (sort) {
    case "price-asc":
      return { sort: "price", order: "asc" } as const;
    case "price-desc":
      return { sort: "price", order: "desc" } as const;
    default:
      return { sort: "createdAt", order: "desc" } as const;
  }
};

interface QueryFilters {
  search?: string;
  category?: string;
  sort: string;
}

const buildQueryString = (filters: QueryFilters) => {
  const params = new URLSearchParams({ page: "1", pageSize: "24" });

  if (filters.search) {
    params.set("search", filters.search);
  }

  if (filters.category && filters.category !== "all") {
    params.set("categories", filters.category);
  }

  const sortParams = getSortParams(filters.sort);
  params.set("sort", sortParams.sort);
  params.set("order", sortParams.order);

  return params.toString();
};

const fetchProducts = async (filters: QueryFilters): Promise<ProductsResponse> => {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!apiBaseUrl) {
    throw new Error("API base URL is not configured");
  }

  const response = await fetch(`${apiBaseUrl}/api/products?${buildQueryString(filters)}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody?.error ?? "Failed to load products");
  }

  return response.json();
};

export function ProductsExplorer() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sort, setSort] = useState("newest");

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 400);

    return () => clearTimeout(handle);
  }, [searchTerm]);

  const filters = useMemo<QueryFilters>(
    () => ({
      search: debouncedSearch || undefined,
      category: selectedCategory === "all" ? undefined : selectedCategory,
      sort,
    }),
    [debouncedSearch, selectedCategory, sort],
  );

  const query = useQuery({
    queryKey: ["store-products", filters],
    queryFn: () => fetchProducts(filters),
    staleTime: 1000 * 60,
  });

  useEffect(() => {
    if (query.error instanceof Error) {
      toast.error("Could not load products", {
        description: query.error.message,
      });
    }
  }, [query.error]);

  const categories = query.data?.meta.availableCategories ?? [];
  const totalProducts = query.data?.meta.total ?? 0;
  const showingProducts = query.data?.data.length ?? 0;
  const summaryText =
    query.isLoading && !query.data
      ? "Loading product recommendations..."
      : `Showing ${showingProducts} of ${totalProducts} products`;

  const activeFilters = useMemo(() => {
    const filtersList: Array<{ label: string; value: string }> = [];

    if (debouncedSearch) {
      filtersList.push({ label: "Search", value: debouncedSearch });
    }

    if (selectedCategory !== "all") {
      filtersList.push({ label: "Category", value: selectedCategory });
    }

    if (sort !== "newest") {
      const sortLabel = sortOptions.find((option) => option.value === sort)?.label ?? "Custom";
      filtersList.push({ label: "Sort", value: sortLabel });
    }

    return filtersList;
  }, [debouncedSearch, selectedCategory, sort]);

  const hasActiveFilters = activeFilters.length > 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 rounded-2xl border border-border/70 bg-background/90 p-4 shadow-sm backdrop-blur md:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)_minmax(0,1fr)_auto] animate-filter-expand">
        <div className="flex w-full flex-col gap-2">
          <label className="text-sm font-medium text-muted-foreground">Search products</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or category"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <div className="flex w-full flex-col gap-2">
          <label className="text-sm font-medium text-muted-foreground">Category</label>
          <Select value={selectedCategory ?? "all"} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-full flex-col gap-2">
          <label className="text-sm font-medium text-muted-foreground">Sort by</label>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Sort products" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end justify-end">
          <Button
            variant={hasActiveFilters ? "outline" : "ghost"}
            onClick={() => {
              setSearchTerm("");
              setSelectedCategory("all");
              setSort("newest");
            }}
            disabled={!hasActiveFilters}
          >
            Reset filters
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
        <span>{summaryText}</span>
        {hasActiveFilters ? (
          <div className="flex flex-wrap items-center gap-2">
            {activeFilters.map((filter) => (
              <span
                key={`${filter.label}-${filter.value}`}
                className="inline-flex items-center gap-2 rounded-full border border-dashed border-primary/50 bg-primary/5 px-3 py-1 text-xs font-medium text-primary"
              >
                <span className="uppercase text-[0.6rem] tracking-wide text-primary/70">
                  {filter.label}
                </span>
                {filter.value}
              </span>
            ))}
          </div>
        ) : (
          <span>Use filters to personalize your browsing experience.</span>
        )}
      </div>

      {query.isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="mb-4 h-6 w-6 animate-spin" />
          Loading products...
        </div>
      ) : null}

      {query.isSuccess && query.data.data.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-muted/40 p-12 text-center text-muted-foreground">
          No products match your filters. Try adjusting your search.
        </div>
      ) : null}

      {query.isSuccess && query.data.data.length > 0 ? (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {query.data.data.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
