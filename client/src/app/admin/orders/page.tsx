import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AdminOrdersPanel } from "@/components/admin/admin-orders-panel";

export const metadata: Metadata = {
  title: "Order Management",
  description: "Audit and manage customer orders across the storefront.",
};

export default async function AdminOrdersPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "admin") {
    redirect("/login");
  }

  return (
    <main className="container space-y-6 py-10">
      <AdminOrdersPanel />
    </main>
  );
}
