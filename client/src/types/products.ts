export type Product = {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  images: string[];
  createdAt: string;
  updatedAt: string;
};

export type ProductsResponse = {
  data: Product[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    sort: string;
    order: "asc" | "desc";
    search: string | null;
    categories: string[];
    availableCategories: string[];
  };
};
