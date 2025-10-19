"use client";

import { useEffect, useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { LogOut, RefreshCcw, Search, View } from "lucide-react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ModeToggle } from "@/components/mode-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
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
import { formatCurrencyINR } from "@/lib/utils";
import type { Order, OrdersResponse } from "@/types/orders";

const statusOptions = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const statusVariantMap: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  processing: "default",
  completed: "outline",
  cancelled: "destructive",
};

const fetchAdminOrders = async (
  token: string,
  params: { page: number; status?: string; search?: string },
): Promise<OrdersResponse> => {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!apiBaseUrl) {
    throw new Error("API base URL is not configured");
  }

  const query = new URLSearchParams();
  query.set("page", String(params.page));
  query.set("pageSize", "20");
  if (params.status && params.status !== "all") {
    query.set("status", params.status);
  }
  if (params.search) {
    query.set("search", params.search);
  }

  const response = await fetch(`${apiBaseUrl}/api/orders?${query.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody?.error ?? "Failed to fetch orders");
  }

  return response.json();
};

export function AdminOrdersPanel() {
  const { data: session } = useSession();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const accessToken = session?.accessToken;

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
      setPage(1);
    }, 400);

    return () => clearTimeout(handle);
  }, [searchTerm]);

  const queryKey = useMemo(
    () => ["admin-orders", { page, statusFilter, debouncedSearch, token: accessToken }],
    [page, statusFilter, debouncedSearch, accessToken],
  );

  const ordersQuery = useQuery({
    queryKey,
    queryFn: () => {
      if (!accessToken) {
        throw new Error("Missing access token");
      }
      return fetchAdminOrders(accessToken, {
        page,
        status: statusFilter === "all" ? undefined : statusFilter,
        search: debouncedSearch || undefined,
      });
    },
    enabled: Boolean(accessToken),
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (ordersQuery.error instanceof Error) {
      toast.error("Could not load orders", {
        description: ordersQuery.error.message,
      });
    }
  }, [ordersQuery.error]);

  const handleSignOut = () => {
    signOut({ redirect: false }).finally(() => {
      router.push("/login");
      router.refresh();
    });
  };

  const meta = ordersQuery.data?.meta;
  const orders = ordersQuery.data?.data ?? [];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Orders</h1>
          <p className="text-sm text-muted-foreground">
            Review order activity and keep track of customer fulfillment.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => ordersQuery.refetch()}
            disabled={ordersQuery.isFetching}
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            {ordersQuery.isFetching ? "Refreshing" : "Refresh"}
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin">Products</Link>
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
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <Card>
        <CardHeader>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.6fr)_auto] lg:items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground" htmlFor="order-search">
                Search orders
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="order-search"
                  placeholder="Search by customer or notes"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setPage(1);
                }}
              >
                Reset filters
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Placed</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                      {ordersQuery.isFetching ? "Loading orders..." : "No orders found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">#{order.id.slice(-8)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col text-sm">
                          <span>{order.contact?.name ?? order.user?.name ?? "Unknown"}</span>
                          <span className="text-xs text-muted-foreground">
                            {order.contact?.email ?? order.user?.email ?? ""}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrencyINR(order.total)}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariantMap[order.status] ?? "default"}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(order.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <View className="mr-2 h-4 w-4" />
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {meta ? (
            <div className="flex flex-col items-center justify-between gap-3 border-t pt-4 text-sm text-muted-foreground sm:flex-row">
              <div>
                Showing page {meta.page} of {meta.totalPages} ({meta.total} orders)
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={meta.page <= 1 || ordersQuery.isFetching}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((current) => current + 1)}
                  disabled={meta.page >= meta.totalPages || ordersQuery.isFetching}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={Boolean(selectedOrder)} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl">
          {selectedOrder ? (
            <>
              <DialogHeader>
                <DialogTitle>Order #{selectedOrder.id.slice(-8)}</DialogTitle>
                <DialogDescription>
                  Placed on {new Date(selectedOrder.createdAt).toLocaleString()}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <div className="grid gap-4 rounded-md bg-muted/20 p-4 sm:grid-cols-2">
                  <div>
                    <h4 className="font-semibold">Customer</h4>
                    <p>{selectedOrder.contact?.name ?? selectedOrder.user?.name ?? "Unknown"}</p>
                    <p>{selectedOrder.contact?.email ?? selectedOrder.user?.email ?? ""}</p>
                    {selectedOrder.contact?.phone ? <p>{selectedOrder.contact.phone}</p> : null}
                  </div>
                  <div>
                    <h4 className="font-semibold">Shipping address</h4>
                    {selectedOrder.shippingAddress ? (
                      <>
                        <p>{selectedOrder.shippingAddress.line1}</p>
                        {selectedOrder.shippingAddress.line2 ? (
                          <p>{selectedOrder.shippingAddress.line2}</p>
                        ) : null}
                        <p>
                          {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state}
                        </p>
                        <p>
                          {selectedOrder.shippingAddress.postalCode}, {selectedOrder.shippingAddress.country}
                        </p>
                      </>
                    ) : (
                      <p>—</p>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="mb-2 font-semibold">Items</h4>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item) => (
                      <div key={item.productId} className="flex items-center justify-between text-sm">
                        <span>
                          {item.title} × {item.quantity}
                        </span>
                        <span>{formatCurrencyINR(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between border-t pt-4 text-base font-semibold">
                  <span>Total</span>
                  <span>{formatCurrencyINR(selectedOrder.total)}</span>
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
