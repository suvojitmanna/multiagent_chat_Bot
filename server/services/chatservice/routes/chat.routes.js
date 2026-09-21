import express from "express";
import {
  createConverSation,
  getConversations,
  getMessages,
  saveMessage,
  updateConversation,
} from "../controllers/chat.controller.js";

const router = express.Router();

router.get("/create-conversation", createConverSation);
router.get("/get-conversations", getConversations);
router.post("/save-messages", saveMessage);
router.get("/get-messages/:conversationId", getMessages);
router.post("/update-conversation", updateConversation);

export default router;
