import { Router } from "express";

import {
  createAddress,
  deleteAddress,
  getProfile,
  setDefaultAddress,
  updateAddress,
  updateBasics,
} from "../controllers/profile.controller.js";
import { authenticateRequest } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticateRequest);

router.get("/", getProfile);
router.put("/basics", updateBasics);
router.post("/addresses", createAddress);
router.put("/addresses/:id", updateAddress);
router.delete("/addresses/:id", deleteAddress);
router.patch("/addresses/:id/default", setDefaultAddress);

export default router;
