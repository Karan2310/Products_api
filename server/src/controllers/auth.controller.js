import jwt from "jsonwebtoken";

import env from "../config/env.js";
import { verifyPassword } from "../utils/password.js";

export const login = async (req, res) => {
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  if (email.toLowerCase() !== env.ADMIN_EMAIL.toLowerCase()) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const passwordValid = await verifyPassword(password, {
    plain: env.ADMIN_PASSWORD,
    hash: env.ADMIN_PASSWORD_HASH,
  });

  if (!passwordValid) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign({ sub: "admin", email: env.ADMIN_EMAIL, role: "admin" }, env.JWT_SECRET, {
    expiresIn: "1h",
  });

  return res.json({
    token,
    user: {
      id: "admin",
      email: env.ADMIN_EMAIL,
      role: "admin",
    },
  });
};
