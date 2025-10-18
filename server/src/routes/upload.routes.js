import { Router } from "express";
import multer from "multer";

import { uploadImages } from "../controllers/upload.controller.js";
import { authenticateRequest } from "../middleware/auth.middleware.js";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 10 },
});

router.use(authenticateRequest);
router.post("/", upload.array("files", 10), uploadImages);

export default router;
