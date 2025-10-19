import { Router } from "express";

import {
  createOrder,
  getOrder,
  listOrders,
  listUserOrders,
} from "../controllers/order.controller.js";
import { authenticateRequest, requireRole } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticateRequest);

router.post("/", requireRole("user"), createOrder);
router.get("/me", requireRole("user"), listUserOrders);

router.use(requireRole("admin"));
router.get("/", listOrders);
router.get("/:id", getOrder);

export default router;
