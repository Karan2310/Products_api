import { z } from "zod";

import User from "../models/user.model.js";

const addressInputSchema = z.object({
  label: z.enum(["Home", "Office", "Other"]).default("Home"),
  recipient: z.string().min(1),
  line1: z.string().min(1),
  line2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  postalCode: z.string().min(1),
  country: z.string().min(1),
  phone: z.string().optional(),
  isDefault: z.boolean().optional(),
});

const basicsSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
});

const serializeAddresses = (addresses = []) =>
  addresses.map((address) => ({
    id: address._id.toString(),
    label: address.label,
    recipient: address.recipient,
    line1: address.line1,
    line2: address.line2 ?? "",
    city: address.city,
    state: address.state,
    postalCode: address.postalCode,
    country: address.country,
    phone: address.phone ?? "",
    isDefault: Boolean(address.isDefault),
  }));

const applyDefaultAddress = (user, preferredId) => {
  if (!user.addresses?.length) {
    return;
  }

  let defaultApplied = false;
  user.addresses.forEach((address) => {
    if (preferredId && address._id.toString() === preferredId.toString()) {
      address.isDefault = true;
      defaultApplied = true;
    } else {
      address.isDefault = false;
    }
  });

  if (!defaultApplied) {
    user.addresses[0].isDefault = true;
  }
};

export const getProfile = async (req, res) => {
  const user = await User.findById(req.user?.sub).lean();

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const addresses = serializeAddresses(user.addresses ?? []);
  if (addresses.length > 0 && !addresses.some((address) => address.isDefault)) {
    addresses[0].isDefault = true;
  }

  return res.json({
    basics: {
      name: user.name,
      email: user.email,
      phone: user.phone ?? "",
    },
    addresses,
  });
};

export const updateBasics = async (req, res) => {
  const parsed = basicsSchema.safeParse(req.body ?? {});

  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid profile details" });
  }

  const { name, email, phone } = parsed.data;
  const user = await User.findById(req.user?.sub);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  if (email !== user.email) {
    const existing = await User.findOne({ email }).lean();
    if (existing && existing._id.toString() !== user._id.toString()) {
      return res.status(409).json({ error: "Email already in use" });
    }
  }

  user.name = name;
  user.email = email;
  user.phone = phone ?? "";

  await user.save();

  return res.json({
    basics: {
      name: user.name,
      email: user.email,
      phone: user.phone ?? "",
    },
  });
};

export const createAddress = async (req, res) => {
  const parsed = addressInputSchema.safeParse(req.body ?? {});

  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid address payload" });
  }

  const user = await User.findById(req.user?.sub);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const payload = parsed.data;
  const newAddress = user.addresses.create({
    ...payload,
    isDefault: Boolean(payload.isDefault || user.addresses.length === 0),
  });

  user.addresses.push(newAddress);

  if (newAddress.isDefault) {
    applyDefaultAddress(user, newAddress._id);
  }

  await user.save();

  return res.status(201).json({ addresses: serializeAddresses(user.addresses) });
};

export const updateAddress = async (req, res) => {
  const paramsSchema = z.object({ id: z.string().min(1) });
  const paramsResult = paramsSchema.safeParse(req.params ?? {});

  if (!paramsResult.success) {
    return res.status(400).json({ error: "Invalid address identifier" });
  }

  const parsed = addressInputSchema.partial().safeParse(req.body ?? {});

  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid address payload" });
  }

  const user = await User.findById(req.user?.sub);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const address = user.addresses.id(paramsResult.data.id);

  if (!address) {
    return res.status(404).json({ error: "Address not found" });
  }

  Object.assign(address, parsed.data);

  if (parsed.data.isDefault) {
    applyDefaultAddress(user, address._id);
  }

  await user.save();

  return res.json({ addresses: serializeAddresses(user.addresses) });
};

export const deleteAddress = async (req, res) => {
  const paramsSchema = z.object({ id: z.string().min(1) });
  const paramsResult = paramsSchema.safeParse(req.params ?? {});

  if (!paramsResult.success) {
    return res.status(400).json({ error: "Invalid address identifier" });
  }

  const user = await User.findById(req.user?.sub);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const address = user.addresses.id(paramsResult.data.id);

  if (!address) {
    return res.status(404).json({ error: "Address not found" });
  }

  address.deleteOne();

  if (user.addresses.length > 0 && !user.addresses.some((entry) => entry.isDefault)) {
    user.addresses[0].isDefault = true;
  }

  await user.save();

  return res.json({ addresses: serializeAddresses(user.addresses) });
};

export const setDefaultAddress = async (req, res) => {
  const paramsSchema = z.object({ id: z.string().min(1) });
  const paramsResult = paramsSchema.safeParse(req.params ?? {});

  if (!paramsResult.success) {
    return res.status(400).json({ error: "Invalid address identifier" });
  }

  const user = await User.findById(req.user?.sub);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const address = user.addresses.id(paramsResult.data.id);

  if (!address) {
    return res.status(404).json({ error: "Address not found" });
  }

  applyDefaultAddress(user, address._id);
  await user.save();

  return res.json({ addresses: serializeAddresses(user.addresses) });
};

