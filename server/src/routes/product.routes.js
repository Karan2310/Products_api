import { Router } from "express";

import {
  createProduct,
  deleteProduct,
  getProduct,
  listProducts,
  updateProduct,
} from "../controllers/product.controller.js";
import { authenticateRequest } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticateRequest);

router.get("/", listProducts);
router.post("/", createProduct);
router.get("/:id", getProduct);
router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);

export default router;
