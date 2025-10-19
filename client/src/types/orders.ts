export type OrderContact = {
  name: string;
  email: string;
  phone?: string;
};

export type OrderShippingAddress = {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

export type OrderItem = {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  image?: string | null;
};

export type Order = {
  id: string;
  status: string;
  subtotal: number;
  tax: number;
  total: number;
  createdAt: string;
  updatedAt: string;
  notes?: string | null;
  chatbotDispatchedAt?: string | null;
  items: OrderItem[];
  contact: OrderContact;
  shippingAddress: OrderShippingAddress;
  user?: {
    id: string;
    name?: string;
    email?: string;
  };
};

export type OrdersResponse = {
  data: Order[];
  meta?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};
