"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrencyINR } from "@/lib/utils";
import type { OrdersResponse } from "@/types/orders";

const fetchOrders = async (token: string): Promise<OrdersResponse> => {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!apiBaseUrl) {
    throw new Error("API base URL is not configured");
  }

  const response = await fetch(`${apiBaseUrl}/api/orders/me`, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody?.error ?? "Failed to fetch orders");
  }

  return response.json();
};

const statusVariantMap: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  processing: "default",
  completed: "outline",
  cancelled: "destructive",
};

export function OrderHistory() {
  const { data: session } = useSession();
  const accessToken = session?.accessToken;

  const query = useQuery({
    queryKey: ["user-orders", accessToken],
    queryFn: () => {
      if (!accessToken) {
        throw new Error("Missing access token");
      }
      return fetchOrders(accessToken);
    },
    enabled: Boolean(accessToken),
    retry: 1,
  });

  useEffect(() => {
    if (query.error instanceof Error) {
      toast.error("Unable to load orders", {
        description: query.error.message,
      });
    }
  }, [query.error]);

  if (!accessToken) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/30 p-12 text-center text-muted-foreground">
        Sign in to view your order history.
      </div>
    );
  }

  if (query.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
        <RefreshCw className="h-6 w-6 animate-spin" />
        Fetching your orders...
      </div>
    );
  }

  if (query.isSuccess && query.data.data.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/30 p-12 text-center text-muted-foreground">
        You haven&apos;t placed any orders yet. Explore the shop and add your favourites to the cart!
      </div>
    );
  }

  if (!query.data) {
    return null;
  }

  return (
    <div className="space-y-6">
      {query.data.data.map((order) => (
        <Card key={order.id} className="border shadow-sm">
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg">Order #{order.id.slice(-8)}</CardTitle>
              <p className="text-sm text-muted-foreground">
                Placed on {format(new Date(order.createdAt), "dd MMM yyyy, hh:mm a")}
              </p>
            </div>
            <Badge variant={statusVariantMap[order.status] ?? "default"}>{order.status}</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.productId} className="flex items-start justify-between gap-4 text-sm">
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-muted-foreground">
                      {item.quantity} × {formatCurrencyINR(item.price)}
                    </p>
                  </div>
                  <span className="font-medium">{formatCurrencyINR(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="grid gap-2 rounded-md bg-muted/20 p-4 text-sm text-muted-foreground sm:grid-cols-2">
              <div>
                <h4 className="font-medium text-foreground">Shipping address</h4>
                <p>
                  {order.shippingAddress.line1}
                  {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""}
                </p>
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                </p>
                <p>{order.shippingAddress.country}</p>
              </div>
              <div>
                <h4 className="font-medium text-foreground">Contact</h4>
                <p>{order.contact.name}</p>
                <p>{order.contact.email}</p>
                {order.contact.phone ? <p>{order.contact.phone}</p> : null}
              </div>
            </div>

            <div className="flex items-center justify-between border-t pt-4 text-base font-semibold">
              <span>Total paid</span>
              <span>{formatCurrencyINR(order.total)}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
