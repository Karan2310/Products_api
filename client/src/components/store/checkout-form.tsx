"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { useCart } from "@/components/cart/cart-provider";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Home, Building2, MapPin } from "lucide-react";
import { AddressFormDialog } from "@/components/profile/address-form-dialog";
import { useProfile } from "@/components/profile/profile-provider";
import { sendChatbotEvent } from "@/lib/chatbot";
import { cn, formatCurrencyINR } from "@/lib/utils";

const formSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().optional(),
  addressLine1: z.string().min(3, "Address is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  postalCode: z.string().min(2, "Postal code is required"),
  country: z.string().min(2, "Country is required"),
  notes: z.string().max(500).optional(),
});

export type CheckoutFormValues = z.infer<typeof formSchema>;

interface CheckoutFormProps {
  defaultName?: string | null;
  defaultEmail?: string | null;
}

export function CheckoutForm({ defaultName, defaultEmail }: CheckoutFormProps) {
  const { items, subtotal, clearCart } = useCart();
  const { addresses, basics, loading: profileLoading } = useProfile();
  const router = useRouter();
  const { data: session } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: defaultName ?? "",
      email: defaultEmail ?? "",
      phone: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "India",
      notes: "",
    },
  });

  useEffect(() => {
    if ((basics.name || defaultName) && !form.getValues("name")) {
      form.setValue("name", basics.name || defaultName || "");
    }
    if ((basics.email || defaultEmail) && !form.getValues("email")) {
      form.setValue("email", basics.email || defaultEmail || "");
    }
    if (basics.phone && !form.getValues("phone")) {
      form.setValue("phone", basics.phone);
    }
  }, [basics, defaultEmail, defaultName, form]);

  useEffect(() => {
    setSelectedAddressId((previous) => {
      if (previous && addresses.some((address) => address.id === previous)) {
        return previous;
      }
      const defaultAddress = addresses.find((address) => address.isDefault);
      if (defaultAddress) {
        return defaultAddress.id;
      }
      if (addresses.length > 0) {
        return addresses[addresses.length - 1].id;
      }
      return null;
    });
  }, [addresses]);

  useEffect(() => {
    if (!selectedAddressId) {
      return;
    }
    const selectedAddress = addresses.find((address) => address.id === selectedAddressId);
    if (!selectedAddress) {
      return;
    }

    form.setValue("name", selectedAddress.recipient || basics.name || "");
    form.setValue("phone", selectedAddress.phone || basics.phone || "");
    form.setValue("addressLine1", selectedAddress.line1 ?? "");
    form.setValue("addressLine2", selectedAddress.line2 ?? "");
    form.setValue("city", selectedAddress.city ?? "");
    form.setValue("state", selectedAddress.state ?? "");
    form.setValue("postalCode", selectedAddress.postalCode ?? "");
    form.setValue("country", selectedAddress.country ?? "");
  }, [selectedAddressId, addresses, basics.name, basics.phone, form]);

  if (items.length === 0) {
    return (
      <div className="container flex flex-col items-center justify-center gap-4 py-20 text-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold">Your cart is empty</h1>
          <p className="text-muted-foreground">
            Add some items to your cart before checking out.
          </p>
        </div>
        <Button asChild>
          <Link href="/shop">Browse products</Link>
        </Button>
      </div>
    );
  }

  const onSubmit = async (values: CheckoutFormValues) => {
    if (!session?.accessToken) {
      toast.error("You need to be signed in to place an order");
      router.push("/login?redirect=/checkout");
      return;
    }

    setIsSubmitting(true);

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

      if (!apiBaseUrl) {
        throw new Error("API base URL is not configured");
      }

      const payload = {
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        shippingAddress: {
          line1: values.addressLine1,
          line2: values.addressLine2 || undefined,
          city: values.city,
          state: values.state,
          postalCode: values.postalCode,
          country: values.country,
        },
        contact: {
          name: values.name,
          email: values.email,
          phone: values.phone || undefined,
        },
        notes: values.notes || undefined,
      };

      const response = await fetch(`${apiBaseUrl}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody?.error ?? "Failed to place order");
      }

      const order = await response.json();

      clearCart();

      toast.success("Order placed successfully", {
        description: "You can track it from your dashboard.",
      });

      const totalQuantity = items.reduce((acc, item) => acc + item.quantity, 0);

      void sendChatbotEvent("order.submitted", {
        orderId: order?.id,
        total: order?.total,
        itemCount: order?.items?.reduce?.(
          (acc: number, item: { quantity: number }) => acc + item.quantity,
          0,
        ) ?? totalQuantity,
        cart: {
          subtotal,
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      });

      router.replace("/dashboard");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to place order";
      toast.error("Could not place order", {
        description: message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const iconForLabel = (label: string) => {
    if (label === "Office") {
      return <Building2 className="h-4 w-4 text-muted-foreground" />;
    }
    if (label === "Other") {
      return <MapPin className="h-4 w-4 text-muted-foreground" />;
    }
    return <Home className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <div className="container grid gap-8 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-6">
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg">Saved addresses</CardTitle>
              <p className="text-sm text-muted-foreground">
                Choose a saved address or add a new one for this order.
              </p>
            </div>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setAddressDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Add new
            </Button>
          </CardHeader>
          <CardContent>
            {profileLoading ? (
              <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                Loading saved addresses...
              </div>
            ) : addresses.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
                You haven&apos;t saved any addresses yet. Add one to speed up checkout next time.
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {addresses.map((address) => {
                  const isSelected = selectedAddressId === address.id;
                  return (
                    <button
                      key={address.id}
                      type="button"
                      onClick={() => setSelectedAddressId(address.id)}
                      className={cn(
                        "flex w-full flex-col gap-2 rounded-2xl border px-4 py-3 text-left transition-all",
                        isSelected
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border/70 bg-background hover:border-primary/60",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                          {iconForLabel(address.label)}
                          {address.label}
                        </div>
                        {address.isDefault ? (
                          <Badge variant="secondary" className="rounded-full text-xs">
                            Default
                          </Badge>
                        ) : null}
                      </div>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <p>
                          {address.recipient}
                          {address.phone ? ` • ${address.phone}` : ""}
                        </p>
                        <p>{address.line1}</p>
                        {address.line2 ? <p>{address.line2}</p> : null}
                        <p>
                          {address.city}, {address.state} {address.postalCode}
                        </p>
                        <p>{address.country}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle>Shipping details</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
            <form className="grid gap-6" onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="you@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="+91 98765 43210" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="addressLine1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address line 1</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Main Street" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="addressLine2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address line 2</FormLabel>
                    <FormControl>
                      <Input placeholder="Apartment, suite, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="Mumbai" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input placeholder="Maharashtra" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="postalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Postal code</FormLabel>
                      <FormControl>
                        <Input placeholder="400001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input placeholder="India" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Order notes (optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Let us know any delivery notes" rows={4} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Placing order..." : "Place order"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      </div>

      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle>Order summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.productId} className="flex items-start justify-between text-sm">
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
          <div className="border-t pt-4 text-sm text-muted-foreground">
            Shipping and taxes are calculated at delivery.
          </div>
          <div className="flex items-center justify-between text-lg font-semibold">
            <span>Total</span>
            <span>{formatCurrencyINR(subtotal)}</span>
          </div>
        </CardContent>
      </Card>
      <AddressFormDialog address={null} open={addressDialogOpen} onOpenChange={setAddressDialogOpen} />
    </div>
  );
}
