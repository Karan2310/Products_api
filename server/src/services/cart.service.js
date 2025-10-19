import mongoose from "mongoose";

import Cart from "../models/cart.model.js";

const CART_POPULATE_CONFIG = {
  path: "items.product",
  select: "title price stock images",
};

export const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

export const ensureCartForUser = async (userId) => {
  if (!isValidObjectId(userId)) {
    throw new Error("Invalid user identifier");
  }

  let cart = await Cart.findOne({ user: userId });

  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }

  return cart;
};

export const populateCartProducts = async (cart) => cart.populate(CART_POPULATE_CONFIG);

export const serializeCart = (cart) => {
  if (!cart) {
    return { items: [], subtotal: 0, totalItems: 0 };
  }

  const normalizedItems = (cart.items ?? []).map((item) => {
    const productDoc = item.product && typeof item.product === "object" ? item.product : null;
    const productId =
      typeof item.product === "string"
        ? item.product
        : item.product?._id?.toString?.() ?? item.product?.toString?.();

    return {
      productId,
      quantity: item.quantity,
      title: productDoc?.title ?? null,
      price: productDoc?.price ?? null,
      stock: productDoc?.stock ?? null,
      image: productDoc?.images?.[0]?.url ?? null,
    };
  });

  const subtotal = normalizedItems.reduce((acc, current) => {
    if (typeof current.price !== "number") {
      return acc;
    }
    return acc + current.price * current.quantity;
  }, 0);

  const totalItems = normalizedItems.reduce((acc, current) => acc + current.quantity, 0);

  return {
    id: cart._id?.toString?.() ?? undefined,
    userId: cart.user?.toString?.() ?? undefined,
    items: normalizedItems,
    subtotal,
    totalItems,
    updatedAt: cart.updatedAt,
  };
};
