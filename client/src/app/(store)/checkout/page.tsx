import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { CheckoutForm } from "@/components/store/checkout-form";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your order by providing shipping details.",
};

export default async function CheckoutPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "user") {
    redirect("/login?redirect=/checkout");
  }

  return (
    <section className="container space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">Checkout</h1>
        <p className="text-muted-foreground">
          Provide your shipping details and confirm your order.
        </p>
      </div>
      <CheckoutForm defaultName={session.user.name} defaultEmail={session.user.email} />
    </section>
  );
}
