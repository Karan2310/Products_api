import { Router } from "express";

import {
  createProduct,
  deleteProduct,
  getProduct,
  listProducts,
  updateProduct,
} from "../controllers/product.controller.js";
import { authenticateRequest, requireRole } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", listProducts);
router.get("/:id", getProduct);

router.use(authenticateRequest, requireRole("admin"));

router.post("/", createProduct);
router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);

export default router;
