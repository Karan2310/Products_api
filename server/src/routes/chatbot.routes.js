import { Router } from "express";

import {
  addCartItemForChatbot,
  getOrderForChatbot,
  getUserCartForChatbot,
  getUserOrdersForChatbot,
} from "../controllers/chatbot.controller.js";
import { authenticateChatbot } from "../middleware/chatbot.middleware.js";

const router = Router();

router.use(authenticateChatbot);

router.get("/users/:userId/cart", getUserCartForChatbot);
router.post("/users/:userId/cart/items", addCartItemForChatbot);
router.get("/users/:userId/orders", getUserOrdersForChatbot);
router.get("/orders/:orderId", getOrderForChatbot);

export default router;
