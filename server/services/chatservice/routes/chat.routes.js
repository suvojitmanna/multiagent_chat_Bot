import express from "express";
import {
  createConverSation,
  getConversations,
  getMessages,
  saveMessage,
  updateConversation,
  deleteConversation,
} from "../controllers/chat.controller.js";

const router = express.Router();

router.get("/create-conversation", createConverSation);
router.post("/create-conversation", createConverSation);
router.get("/get-conversations", getConversations);
router.post("/save-messages", saveMessage);
router.get("/get-messages/:conversationId", getMessages);
router.post("/update-conversation", updateConversation);
router.put("/update-conversation", updateConversation);
router.put("/update-conversation/:id", updateConversation);
router.patch("/update-conversation", updateConversation);
router.patch("/update-conversation/:id", updateConversation);
router.delete("/delete-conversation/:id", deleteConversation);
router.post("/delete-conversation", deleteConversation);

export default router;
