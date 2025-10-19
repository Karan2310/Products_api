import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { z } from "zod";

import env from "../config/env.js";
import User from "../models/user.model.js";
import { hashPassword, verifyPassword } from "../utils/password.js";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

const serializeUser = (user) => ({
  id: user._id?.toString?.() ?? user.id,
  email: user.email,
  role: user.role ?? "user",
  name: user.name,
});

const signToken = (payload, options = {}) =>
  jwt.sign(payload, env.JWT_SECRET, { expiresIn: "7d", ...options });

export const login = async (req, res) => {
  const parsed = loginSchema.safeParse(req.body ?? {});

  if (!parsed.success) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const { email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  // Admin login (env driven)
  if (normalizedEmail === env.ADMIN_EMAIL.toLowerCase()) {
    const passwordValid = await verifyPassword(password, {
      plain: env.ADMIN_PASSWORD,
      hash: env.ADMIN_PASSWORD_HASH,
    });

    if (!passwordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = signToken(
      {
        sub: "admin",
        email: env.ADMIN_EMAIL,
        role: "admin",
        name: "Administrator",
      },
      { expiresIn: "1h" },
    );

    return res.json({
      token,
      user: {
        id: "admin",
        email: env.ADMIN_EMAIL,
        role: "admin",
        name: "Administrator",
      },
    });
  }

  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const passwordValid = await verifyPassword(password, {
    hash: user.passwordHash,
  });

  if (!passwordValid) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = signToken({
    sub: user._id.toString(),
    email: user.email,
    role: user.role,
    name: user.name,
  });

  return res.json({
    token,
    user: serializeUser(user),
  });
};

export const register = async (req, res) => {
  const parsed = registerSchema.safeParse(req.body ?? {});

  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid registration payload" });
  }

  const { name, email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  if (normalizedEmail === env.ADMIN_EMAIL.toLowerCase()) {
    return res.status(400).json({ error: "Email is reserved for admin access" });
  }

  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    return res.status(409).json({ error: "Email is already registered" });
  }

  const passwordHash = await hashPassword(password);

  const user = await User.create({
    name,
    email: normalizedEmail,
    passwordHash,
    role: "user",
  });

  const token = signToken({
    sub: user._id.toString(),
    email: user.email,
    role: user.role,
    name: user.name,
  });

  return res.status(201).json({
    token,
    user: serializeUser(user),
  });
};

export const getProfile = async (req, res) => {
  const authUser = req.user;

  if (!authUser) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (authUser.role === "admin") {
    return res.json({
      id: "admin",
      email: env.ADMIN_EMAIL,
      role: "admin",
      name: "Administrator",
    });
  }

  if (!mongoose.Types.ObjectId.isValid(authUser.sub)) {
    return res.status(400).json({ error: "Invalid user identifier" });
  }

  const user = await User.findById(authUser.sub).lean();

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  return res.json(serializeUser(user));
};
