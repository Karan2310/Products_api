import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { OrderHistory } from "@/components/store/order-history";

export const metadata: Metadata = {
  title: "Order History",
  description: "Review past purchases, track delivery status, and view contact details.",
};

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "user") {
    redirect("/login?redirect=/dashboard");
  }

  return (
    <section className="container space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold">Your orders</h1>
        <p className="text-muted-foreground">
          Keep track of your order history, delivery info, and payment details.
        </p>
      </div>
      <OrderHistory />
    </section>
  );
}
