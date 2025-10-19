import { z } from "zod";

import Product from "../models/product.model.js";
import User from "../models/user.model.js";
import {
  ensureCartForUser,
  populateCartProducts,
  serializeCart,
} from "../services/cart.service.js";

const upsertItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().positive().max(99).default(1),
});

const updateQuantitySchema = z.object({
  quantity: z.coerce.number().int().positive().max(99),
});

const removeItemParamsSchema = z.object({
  productId: z.string().min(1),
});

export const getCart = async (req, res) => {
  const userId = req.user?.sub;
  const user = await User.findById(userId).lean();

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const cart = await ensureCartForUser(userId);
  await populateCartProducts(cart);

  return res.json(serializeCart(cart));
};

export const addOrIncrementCartItem = async (req, res) => {
  const userId = req.user?.sub;
  const parsed = upsertItemSchema.safeParse(req.body ?? {});

  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid item payload" });
  }

  const { productId, quantity } = parsed.data;

  const user = await User.findById(userId).lean();

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const product = await Product.findById(productId).lean();

  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }

  const cart = await ensureCartForUser(userId);

  const existingIndex = cart.items.findIndex(
    (item) => item.product.toString() === productId,
  );

  if (existingIndex === -1) {
    cart.items.push({ product: productId, quantity });
  } else {
    cart.items[existingIndex].quantity = Math.min(
      99,
      cart.items[existingIndex].quantity + quantity,
    );
  }

  await cart.save();
  await populateCartProducts(cart);

  return res.status(200).json(serializeCart(cart));
};

export const updateCartItemQuantity = async (req, res) => {
  const userId = req.user?.sub;
  const paramsResult = removeItemParamsSchema.safeParse(req.params ?? {});
  const bodyResult = updateQuantitySchema.safeParse(req.body ?? {});

  if (!paramsResult.success || !bodyResult.success) {
    return res.status(400).json({ error: "Invalid request" });
  }

  const { productId } = paramsResult.data;
  const { quantity } = bodyResult.data;

  const user = await User.findById(userId).lean();

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const product = await Product.findById(productId).lean();

  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }

  const cart = await ensureCartForUser(userId);
  const item = cart.items.find((entry) => entry.product.toString() === productId);

  if (!item) {
    return res.status(404).json({ error: "Cart item not found" });
  }

  item.quantity = quantity;
  await cart.save();
  await populateCartProducts(cart);

  return res.json(serializeCart(cart));
};

export const removeCartItem = async (req, res) => {
  const userId = req.user?.sub;
  const parsed = removeItemParamsSchema.safeParse(req.params ?? {});

  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid product identifier" });
  }

  const { productId } = parsed.data;

  const user = await User.findById(userId).lean();

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const cart = await ensureCartForUser(userId);
  const initialLength = cart.items.length;
  cart.items = cart.items.filter((item) => item.product.toString() !== productId);

  if (cart.items.length === initialLength) {
    return res.status(404).json({ error: "Cart item not found" });
  }

  await cart.save();
  await populateCartProducts(cart);

  return res.json(serializeCart(cart));
};

export const clearCart = async (req, res) => {
  const userId = req.user?.sub;
  const user = await User.findById(userId).lean();

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const cart = await ensureCartForUser(userId);
  cart.items = [];
  await cart.save();

  return res.json(serializeCart(cart));
};
