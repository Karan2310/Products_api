import { Router } from "express";

import { getProfile, login, register } from "../controllers/auth.controller.js";
import { authenticateRequest } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/login", login);
router.post("/register", register);
router.get("/me", authenticateRequest, getProfile);

export default router;
