"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  LogOut,
  Plus,
  RefreshCcw,
  Search,
  SortAsc,
  SortDesc,
  Trash2,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ModeToggle } from "@/components/mode-toggle";
import {
  ProductForm,
  type ProductFormSubmitPayload,
} from "@/components/admin/product-form";
import { ColumnResizeHandle } from "@/components/admin/column-resize-handle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn, formatCurrencyINR } from "@/lib/utils";
import type { Product, ProductsResponse } from "@/types/products";

interface AdminDashboardProps {
  initialFilters: ProductFilters;
}

type SortField = "createdAt" | "updatedAt" | "price" | "title" | "stock";
type SortOrder = "asc" | "desc";

export interface ProductFilters {
  page: number;
  pageSize: number;
  search?: string;
  categories?: string[];
  sort: SortField;
  order: SortOrder;
}

const sortOptions: { value: SortField; label: string }[] = [
  { value: "createdAt", label: "Created" },
  { value: "updatedAt", label: "Updated" },
  { value: "price", label: "Price" },
  { value: "title", label: "Title" },
  { value: "stock", label: "Stock" },
];

const pageSizeOptions = [10, 20, 50];

const buildQueryString = (filters: ProductFilters) => {
  const params = new URLSearchParams();
  params.set("page", String(filters.page));
  params.set("pageSize", String(filters.pageSize));
  params.set("sort", filters.sort);
  params.set("order", filters.order);
  if (filters.search) {
    params.set("search", filters.search);
  }
  if (filters.categories?.length) {
    params.set("categories", filters.categories.join(","));
  }
  return params.toString();
};

export function AdminDashboard({ initialFilters }: AdminDashboardProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [filters, setFilters] = useState<ProductFilters>(initialFilters);
  const [searchInput, setSearchInput] = useState(initialFilters.search ?? "");
  const [dialogState, setDialogState] = useState<
    { mode: "create" } | { mode: "edit"; product: Product } | null
  >(null);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
  const [titleColumnWidth, setTitleColumnWidth] = useState<number>(320);

  const fetchProducts = useCallback(async (): Promise<ProductsResponse> => {
    if (!apiBaseUrl) {
      throw new Error("API base URL is not configured");
    }

    if (!session?.accessToken) {
      throw new Error("Missing access token");
    }

    const response = await fetch(
      `${apiBaseUrl}/api/products?${buildQueryString(filters)}`,
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
        cache: "no-store",
      },
    );

    if (response.status === 401) {
      await signOut({ redirect: false });
      router.push("/login");
      throw new Error("Session expired. Please sign in again.");
    }

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody?.error ?? "Failed to fetch products");
    }

    return response.json();
  }, [apiBaseUrl, filters, router, session?.accessToken]);

  const uploadImages = useCallback(
    async (files: File[]) => {
      if (files.length === 0) {
        return [] as string[];
      }

      if (!apiBaseUrl) {
        throw new Error("API base URL is not configured");
      }

      if (!session?.accessToken) {
        throw new Error("Missing access token");
      }

      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));

      const response = await fetch(`${apiBaseUrl}/api/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: formData,
      });

      if (response.status === 401) {
        await signOut({ redirect: false });
        router.push("/login");
        throw new Error("Session expired. Please sign in again.");
      }

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error ?? "Image upload failed");
      }

      const payload = await response.json();
      return (payload?.data as { url: string }[]).map((item) => item.url);
    },
    [apiBaseUrl, router, session?.accessToken],
  );

  useEffect(() => {
    const handle = setTimeout(() => {
      setFilters((current) => ({
        ...current,
        page: 1,
        search: searchInput.trim() ? searchInput.trim() : undefined,
      }));
    }, 350);

    return () => clearTimeout(handle);
  }, [searchInput]);

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ["products", filters, session?.accessToken],
    queryFn: fetchProducts,
    enabled: status === "authenticated" && Boolean(session?.accessToken),
    placeholderData: (previousData) => previousData,
  });

  const isTableLoading = isLoading || status === "loading";

  const categories = useMemo(() => {
    if (data?.meta.availableCategories?.length) {
      return data.meta.availableCategories;
    }

    const items = new Set<string>();
    data?.data.forEach((product) => {
      if (product.category) {
        items.add(product.category);
      }
    });
    return Array.from(items).sort((a, b) => a.localeCompare(b));
  }, [data]);

  const selectedCategories = filters.categories ?? [];

  const invalidateProducts = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: ["products"],
      exact: false,
      refetchType: "active",
    });
  }, [queryClient]);

  const createMutation = useMutation({
    mutationFn: async (payload: ProductFormSubmitPayload) => {
      const uploadedImages = await uploadImages(payload.newFiles);
      if (!session?.accessToken) {
        throw new Error("Missing access token");
      }

      const response = await fetch(`${apiBaseUrl}/api/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({
          ...payload.values,
          images: [...payload.existingImages, ...uploadedImages],
        }),
      });

      if (response.status === 401) {
        await signOut({ redirect: false });
        router.push("/login");
        throw new Error("Session expired. Please sign in again.");
      }

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error ?? "Failed to create product");
      }

      return (await response.json()) as Product;
    },
    onSuccess: async (product) => {
      toast.success("Product created", {
        description: `${product.title} is now live.`,
      });
      await invalidateProducts();
      setDialogState(null);
    },
    onError: (mutationError: unknown) => {
      const message =
        mutationError instanceof Error
          ? mutationError.message
          : "Unable to create product";
      toast.error(message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: ProductFormSubmitPayload;
    }) => {
      const uploadedImages = await uploadImages(payload.newFiles);
      if (!session?.accessToken) {
        throw new Error("Missing access token");
      }

      const response = await fetch(`${apiBaseUrl}/api/products/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({
          ...payload.values,
          images: [...payload.existingImages, ...uploadedImages],
        }),
      });

      if (response.status === 401) {
        await signOut({ redirect: false });
        router.push("/login");
        throw new Error("Session expired. Please sign in again.");
      }

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error ?? "Failed to update product");
      }

      return (await response.json()) as Product;
    },
    onSuccess: async (product) => {
      toast.success("Product updated", {
        description: `${product.title} has been refreshed.`,
      });
      await invalidateProducts();
      setDialogState(null);
    },
    onError: (mutationError: unknown) => {
      const message =
        mutationError instanceof Error
          ? mutationError.message
          : "Unable to update product";
      toast.error(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (product: Product) => {
      if (!session?.accessToken) {
        throw new Error("Missing access token");
      }

      const response = await fetch(`${apiBaseUrl}/api/products/${product.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      });

      if (response.status === 401) {
        await signOut({ redirect: false });
        router.push("/login");
        throw new Error("Session expired. Please sign in again.");
      }

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error ?? "Failed to delete product");
      }

      return product;
    },
    onSuccess: async (product) => {
      toast.success("Product deleted", {
        description: `${product.title} has been removed.`,
      });
      await invalidateProducts();
    },
    onError: (mutationError: unknown) => {
      const message =
        mutationError instanceof Error
          ? mutationError.message
          : "Unable to delete product";
      toast.error(message);
    },
  });

  const isBusy =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  const openCreateDialog = () => setDialogState({ mode: "create" });
  const openEditDialog = (product: Product) =>
    setDialogState({ mode: "edit", product });

  const closeDialog = () => {
    setDialogState(null);
  };

  const handleSubmit = async (payload: ProductFormSubmitPayload) => {
    if (dialogState?.mode === "edit" && dialogState.product) {
      await updateMutation.mutateAsync({ id: dialogState.product.id, payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
  };

  const handleDelete = (product: Product) => {
    const confirmed = window.confirm(
      `Delete ${product.title}? This action cannot be undone.`,
    );
    if (!confirmed) {
      return;
    }
    deleteMutation.mutate(product);
  };

  const handleToggleOrder = () => {
    setFilters((current) => ({
      ...current,
      order: current.order === "asc" ? "desc" : "asc",
    }));
  };

  const handleCategoryToggle = useCallback(
    (category: string, checked: boolean | "indeterminate") => {
      setFilters((current) => {
        const nextSet = new Set(current.categories ?? []);
        if (checked) {
          nextSet.add(category);
        } else {
          nextSet.delete(category);
        }
        const next = Array.from(nextSet).sort((a, b) => a.localeCompare(b));
        return {
          ...current,
          page: 1,
          categories: next.length ? next : undefined,
        };
      });
    },
    [],
  );

  const clearCategories = useCallback(() => {
    setFilters((current) => ({
      ...current,
      page: 1,
      categories: undefined,
    }));
  }, []);

  const currentMeta = data?.meta;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Product Catalogue</h1>
          <p className="text-sm text-muted-foreground">
            Manage inventory, pricing, and visibility for your storefront.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              queryClient.invalidateQueries({
                queryKey: ["products"],
                exact: false,
              })
            }
            disabled={isFetching}
          >
            <RefreshCcw
              className={cn(
                "mr-2 h-4 w-4",
                isFetching ? "animate-spin" : "transition-transform duration-200",
              )}
            />
            {isFetching ? "Refreshing" : "Refresh"}
          </Button>
          <ModeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="sm">
                Admin
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  signOut({ redirect: false }).finally(() => {
                    router.push("/login");
                    router.refresh();
                  });
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <Card>
        <CardHeader className="space-y-6 pb-0">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)] lg:items-end">
            <div className="lg:pr-2">
              <Label htmlFor="search" className="sr-only">
                Search products
              </Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by title, description, or category"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  className="h-11 w-full rounded-lg pl-9"
                />
              </div>
            </div>
            <div className="lg:pr-2">
              <Label
                htmlFor="categories-trigger"
                className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                Categories
              </Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    id="categories-trigger"
                    variant="outline"
                    className="h-11 w-full justify-between rounded-lg text-left font-normal"
                  >
                    {selectedCategories.length
                      ? `${selectedCategories.length} selected`
                      : "All categories"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuItem
                    onSelect={(event) => {
                      event.preventDefault();
                      clearCategories();
                    }}
                  >
                    Show all categories
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {categories.map((category) => (
                    <DropdownMenuCheckboxItem
                      key={category}
                      checked={selectedCategories.includes(category)}
                      onCheckedChange={(checked) =>
                        handleCategoryToggle(category, checked === true)
                      }
                    >
                      {category}
                    </DropdownMenuCheckboxItem>
                  ))}
                  {categories.length === 0 && (
                    <DropdownMenuItem disabled>No categories</DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
              <div>
                <Label
                  htmlFor="sort"
                  className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  Sort by
                </Label>
                <Select
                  value={filters.sort}
                  onValueChange={(value: SortField) =>
                    setFilters((current) => ({ ...current, sort: value }))
                  }
                >
                  <SelectTrigger id="sort" className="h-11 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="end">
                    {sortOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-11 w-11 rounded-lg"
                onClick={handleToggleOrder}
              >
                {filters.order === "asc" ? (
                  <SortAsc className="h-4 w-4" />
                ) : (
                  <SortDesc className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span>
                {currentMeta?.total ?? 0} product
                {(currentMeta?.total ?? 0) === 1 ? "" : "s"}
              </span>
              <Badge variant="secondary">Page {filters.page}</Badge>
              <Badge variant="outline">Page size {filters.pageSize}</Badge>
              <Badge variant="outline">
                Categories {selectedCategories.length || "All"}
              </Badge>
          </div>
            <div className="flex flex-wrap items-center gap-3">
              <Label
                htmlFor="page-size"
                className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                Page size
              </Label>
              <Select
                value={String(filters.pageSize)}
                onValueChange={(value) =>
                  setFilters((current) => ({
                    ...current,
                    page: 1,
                    pageSize: Number(value),
                  }))
                }
              >
                <SelectTrigger id="page-size" className="h-9 w-[110px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pageSizeOptions.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size} / page
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={openCreateDialog}
                className="h-11 gap-2 rounded-lg px-4 font-medium"
              >
                <Plus className="h-4 w-4" />
                New product
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto rounded-md border">
            <Table className="min-w-[760px]">
              <TableHeader>
                <TableRow>
                  <TableHead style={{ width: `${titleColumnWidth}px` }}>
                    <div className="flex items-center justify-between">
                      <span>Title</span>
                      <ColumnResizeHandle
                        onResize={(deltaX) =>
                          setTitleColumnWidth((prev) =>
                            Math.min(640, Math.max(220, prev + deltaX)),
                          )
                        }
                      />
                    </div>
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    Category
                  </TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead className="hidden sm:table-cell">Stock</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isTableLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> Loading
                        products...
                      </span>
                    </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-12 text-center text-sm text-destructive"
                  >
                    {(error as Error).message}
                  </TableCell>
                </TableRow>
              ) : data && data.data.length > 0 ? (
                data.data.map((product) => (
                  <TableRow key={product.id} className="group">
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{product.title}</span>
                        <span className="line-clamp-3 text-xs text-muted-foreground">
                          {product.description}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline">{product.category}</Badge>
                    </TableCell>
                    <TableCell>{formatCurrencyINR(product.price)}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {product.stock}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(product)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(product)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-12 text-center text-sm text-muted-foreground"
                  >
                    No products found. Try adjusting your filters or add a new
                    product.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

          <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              Showing page {filters.page} of {currentMeta?.totalPages ?? 1}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setFilters((current) => ({
                    ...current,
                    page: Math.max(1, current.page - 1),
                  }))
                }
                disabled={filters.page <= 1 || isFetching}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setFilters((current) => ({
                    ...current,
                    page: current.page + 1,
                  }))
                }
                disabled={
                  isFetching ||
                  (currentMeta ? filters.page >= currentMeta.totalPages : false)
                }
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(dialogState)}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent
          className="max-h-[90vh] overflow-y-auto"
          aria-describedby="product-form-description"
        >
          <DialogHeader>
            <DialogTitle>
              {dialogState?.mode === "edit" ? "Edit product" : "Create product"}
            </DialogTitle>
            <p
              id="product-form-description"
              className="text-sm text-muted-foreground"
            >
              Provide product details and images, then submit to save changes.
            </p>
          </DialogHeader>
          <ProductForm
            mode={dialogState?.mode === "edit" ? "edit" : "create"}
            product={
              dialogState?.mode === "edit" ? dialogState.product : undefined
            }
            categoryOptions={categories}
            onCancel={closeDialog}
            onSubmit={handleSubmit}
            isSubmitting={isBusy}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
