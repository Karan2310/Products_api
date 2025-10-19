import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";

import { AdminDashboard, type ProductFilters } from "./admin-dashboard";

type AdminSearchParams = Record<string, string | string[] | undefined>;

interface AdminPageProps {
  searchParams?: Promise<AdminSearchParams>;
}

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Manage catalogue inventory, pricing, and orders for Products Portal.",
};

const parseFilters = (params: AdminSearchParams): ProductFilters => {
  const page = Number(Array.isArray(params.page) ? params.page[0] : params.page) || 1;
  const pageSize =
    Number(Array.isArray(params.pageSize) ? params.pageSize[0] : params.pageSize) ||
    10;
  const sortParam =
    (Array.isArray(params.sort) ? params.sort[0] : params.sort) ?? "createdAt";
  const orderParam =
    (Array.isArray(params.order) ? params.order[0] : params.order) ?? "desc";
  const search = Array.isArray(params.search) ? params.search[0] : params.search;

  const categoriesParam = params.categories ?? params.category;
  const categories =
    categoriesParam !== undefined
      ? (Array.isArray(categoriesParam) ? categoriesParam : [categoriesParam])
          .flatMap((value) =>
            value
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean),
          )
      : [];
  const uniqueCategories = Array.from(new Set(categories));

  const sortOptions = ["createdAt", "updatedAt", "price", "title", "stock"] as const;
  const sort = sortOptions.includes(sortParam as (typeof sortOptions)[number])
    ? (sortParam as ProductFilters["sort"])
    : "createdAt";

  const order = orderParam === "asc" ? "asc" : "desc";

  return {
    page: Math.max(page, 1),
    pageSize: [10, 20, 50].includes(pageSize) ? pageSize : 10,
    sort,
    order,
    search: search || undefined,
    categories: uniqueCategories.length ? uniqueCategories : undefined,
  };
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const session = await auth();

  if (!session?.user || session.user.role !== "admin") {
    redirect("/login");
  }

  const resolvedParams = searchParams ? await searchParams : {};
  const filters = parseFilters(resolvedParams);

  return (
    <main className="container mx-auto max-w-6xl space-y-6 py-10">
      <AdminDashboard initialFilters={filters} />
    </main>
  );
}
