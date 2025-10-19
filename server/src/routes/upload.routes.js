import { Router } from "express";
import multer from "multer";

import { uploadImages } from "../controllers/upload.controller.js";
import { authenticateRequest, requireRole } from "../middleware/auth.middleware.js";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 10 },
});

router.use(authenticateRequest, requireRole("admin"));
router.post("/", upload.array("files", 10), uploadImages);

export default router;
