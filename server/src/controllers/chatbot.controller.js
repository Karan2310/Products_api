import { z } from "zod";

import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import User from "../models/user.model.js";
import {
  ensureCartForUser,
  populateCartProducts,
  serializeCart,
} from "../services/cart.service.js";

const userParamSchema = z.object({
  userId: z.string().min(1),
});

const addItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().positive().max(99).default(1),
});

const ensureUser = async (userId) => {
  const user = await User.findById(userId).lean();

  if (!user) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }

  return user;
};

const ensureProduct = async (productId) => {
  const product = await Product.findById(productId).lean();

  if (!product) {
    const error = new Error("Product not found");
    error.status = 404;
    throw error;
  }

  return product;
};

const handleError = (res, error) => {
  if (error?.status) {
    return res.status(error.status).json({ error: error.message });
  }

  console.error(error);
  return res.status(500).json({ error: "Internal server error" });
};

export const getUserCartForChatbot = async (req, res) => {
  try {
    const parsed = userParamSchema.safeParse(req.params ?? {});

    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid user identifier" });
    }

    const { userId } = parsed.data;
    await ensureUser(userId);

    const cart = await ensureCartForUser(userId);
    await populateCartProducts(cart);

    return res.json(serializeCart(cart));
  } catch (error) {
    return handleError(res, error);
  }
};

export const addCartItemForChatbot = async (req, res) => {
  try {
    const paramsResult = userParamSchema.safeParse(req.params ?? {});
    const bodyResult = addItemSchema.safeParse(req.body ?? {});

    if (!paramsResult.success || !bodyResult.success) {
      return res.status(400).json({ error: "Invalid request" });
    }

    const { userId } = paramsResult.data;
    const { productId, quantity } = bodyResult.data;

    await ensureUser(userId);
    await ensureProduct(productId);

    const cart = await ensureCartForUser(userId);
    const existing = cart.items.find((item) => item.product.toString() === productId);

    if (existing) {
      existing.quantity = Math.min(99, existing.quantity + quantity);
    } else {
      cart.items.push({ product: productId, quantity });
    }

    await cart.save();
    await populateCartProducts(cart);

    return res.status(201).json(serializeCart(cart));
  } catch (error) {
    return handleError(res, error);
  }
};

export const getUserOrdersForChatbot = async (req, res) => {
  try {
    const parsed = userParamSchema.safeParse(req.params ?? {});

    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid user identifier" });
    }

    const { userId } = parsed.data;
    await ensureUser(userId);

    const orders = await Order.find({ user: userId })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ data: orders });
  } catch (error) {
    return handleError(res, error);
  }
};

export const getOrderForChatbot = async (req, res) => {
  try {
    const orderIdParam = z.object({ orderId: z.string().min(1) });
    const parsed = orderIdParam.safeParse(req.params ?? {});

    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid order identifier" });
    }

    const { orderId } = parsed.data;

    const order = await Order.findById(orderId).lean();

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    return res.json(order);
  } catch (error) {
    return handleError(res, error);
  }
};
