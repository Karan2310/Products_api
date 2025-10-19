import mongoose from "mongoose";
import { z } from "zod";

import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import User from "../models/user.model.js";
import { dispatchChatbotEvent } from "../utils/chatbot.js";

const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1, "At least one item is required"),
  shippingAddress: z.object({
    line1: z.string().min(1),
    line2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().min(1),
    postalCode: z.string().min(1),
    country: z.string().min(1),
  }),
  contact: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().optional(),
  }),
  notes: z.string().max(500).optional(),
});

const listOrdersSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(10),
  status: z.string().optional(),
  search: z.string().optional(),
});

const serializeOrder = (document, { includeUser = false } = {}) => {
  if (!document) {
    return null;
  }

  const order = typeof document.toObject === "function" ? document.toObject() : document;

  return {
    id: order._id?.toString?.() ?? order.id,
    status: order.status,
    subtotal: order.subtotal,
    tax: order.tax,
    total: order.total,
    notes: order.notes ?? null,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    items: (order.items ?? []).map((item) => ({
      productId: item.product?.toString?.() ?? item.product,
      title: item.title,
      price: item.price,
      quantity: item.quantity,
      image: item.image ?? null,
    })),
    shippingAddress: order.shippingAddress,
    contact: order.contact,
    chatbotDispatchedAt: order.chatbotDispatchedAt ?? null,
    user:
      includeUser && order.user
        ? {
            id: order.user._id?.toString?.() ?? order.user.id ?? order.user,
            name: order.user.name,
            email: order.user.email,
          }
        : undefined,
  };
};

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

export const createOrder = async (req, res) => {
  if (!req.user || req.user.role !== "user") {
    return res.status(403).json({ error: "Only users can place orders" });
  }

  if (!isValidObjectId(req.user.sub)) {
    return res.status(400).json({ error: "Invalid user identifier" });
  }

  const parsed = createOrderSchema.safeParse(req.body ?? {});

  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid order payload" });
  }

  const { items, shippingAddress, contact, notes } = parsed.data;
  const uniqueProductIds = [...new Set(items.map((item) => item.productId))];

  if (!uniqueProductIds.every(isValidObjectId)) {
    return res.status(400).json({ error: "One or more product IDs are invalid" });
  }

  const user = await User.findById(req.user.sub);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const products = await Product.find({ _id: { $in: uniqueProductIds } }).lean();
  const productById = new Map(products.map((product) => [product._id.toString(), product]));

  const orderItems = [];

  for (const item of items) {
    const product = productById.get(item.productId);

    if (!product) {
      return res
        .status(404)
        .json({ error: `Product ${item.productId} is no longer available` });
    }

    if (typeof product.stock === "number" && product.stock < item.quantity) {
      return res
        .status(400)
        .json({ error: `Only ${product.stock} units left for ${product.title}` });
    }

    orderItems.push({
      product: product._id,
      title: product.title,
      price: product.price,
      quantity: item.quantity,
      image: product.images?.[0]?.url ?? null,
    });
  }

  const subtotal = orderItems.reduce(
    (acc, current) => acc + current.price * current.quantity,
    0,
  );

  const tax = 0;
  const total = subtotal + tax;

  const order = await Order.create({
    user: user._id,
    items: orderItems,
    subtotal,
    tax,
    total,
    shippingAddress,
    contact: {
      ...contact,
      email: contact.email ?? user.email,
    },
    notes,
    status: "pending",
  });

  try {
    const bulkResult = await Product.bulkWrite(
      orderItems.map((item) => ({
        updateOne: {
          filter: { _id: item.product, stock: { $gte: item.quantity } },
          update: { $inc: { stock: -item.quantity } },
        },
      })),
    );
    if (bulkResult.matchedCount !== orderItems.length) {
      console.warn(
        "One or more inventory updates did not match expected products",
        order._id.toString(),
      );
    }
  } catch (error) {
    console.warn("Failed to sync product inventory after order", order._id.toString(), error);
  }

  const chatbotPayload = {
    orderId: order._id.toString(),
    userId: user._id.toString(),
    total,
    subtotal,
    tax,
    status: order.status,
    contact,
    shippingAddress,
    items: orderItems.map((item) => ({
      productId: item.product.toString(),
      title: item.title,
      price: item.price,
      quantity: item.quantity,
    })),
  };

  const chatbotSuccess = await dispatchChatbotEvent("order.created", chatbotPayload);

  if (chatbotSuccess) {
    order.chatbotDispatchedAt = new Date();
    await order.save();
  }

  return res.status(201).json(serializeOrder(order));
};

export const listUserOrders = async (req, res) => {
  if (!req.user || req.user.role !== "user") {
    return res.status(403).json({ error: "Only users can view their orders" });
  }

  if (!isValidObjectId(req.user.sub)) {
    return res.status(400).json({ error: "Invalid user identifier" });
  }

  const orders = await Order.find({ user: req.user.sub })
    .sort({ createdAt: -1 })
    .lean();

  return res.json({
    data: orders.map((order) => serializeOrder(order)),
  });
};

export const listOrders = async (req, res) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Only admins can list all orders" });
  }

  const parsed = listOrdersSchema.safeParse(req.query ?? {});

  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid query params" });
  }

  const { page, pageSize, status, search } = parsed.data;

  const filter = {};

  if (status && ["pending", "processing", "completed", "cancelled"].includes(status)) {
    filter.status = status;
  }

  if (search) {
    filter.$or = [
      { "contact.name": new RegExp(search, "i") },
      { "contact.email": new RegExp(search, "i") },
      { notes: new RegExp(search, "i") },
    ];
  }

  const [total, orders] = await Promise.all([
    Order.countDocuments(filter),
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .populate("user", "name email")
      .lean(),
  ]);

  return res.json({
    data: orders.map((order) => serializeOrder(order, { includeUser: true })),
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize) || 1,
    },
  });
};

export const getOrder = async (req, res) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Only admins can view orders" });
  }

  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ error: "Invalid order identifier" });
  }

  const order = await Order.findById(id).populate("user", "name email").lean();

  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }

  return res.json(serializeOrder(order, { includeUser: true }));
};
