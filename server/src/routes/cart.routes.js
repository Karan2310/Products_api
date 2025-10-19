import { Router } from "express";

import {
  addOrIncrementCartItem,
  clearCart,
  getCart,
  removeCartItem,
  updateCartItemQuantity,
} from "../controllers/cart.controller.js";
import { authenticateRequest, requireRole } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticateRequest, requireRole("user"));

router.get("/", getCart);
router.post("/items", addOrIncrementCartItem);
router.patch("/items/:productId", updateCartItemQuantity);
router.delete("/items/:productId", removeCartItem);
router.delete("/", clearCart);

export default router;
