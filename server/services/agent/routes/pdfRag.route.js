import express from "express";
import upload from "../config/multer.js";
import {
  uploadPdf,
  listDocuments,
  getDocumentDetails,
  getDocumentStatus,
  deleteDocument,
  chatPdf,
  getConversationHistory,
  deleteConversation,
} from "../controllers/pdfRag.controller.js";
import { createRouteRateLimiter } from "../middlewares/rateLimiter.middleware.js";

const router = express.Router();

router.post("/upload", createRouteRateLimiter("pdf_upload", 10, 60), upload.single("file"), uploadPdf);
router.get("/", listDocuments);
router.get("/status/:documentId", getDocumentStatus);
router.get("/:documentId", getDocumentDetails);
router.delete("/:documentId", deleteDocument);

router.post("/chat", createRouteRateLimiter("pdf_chat", 20, 60), chatPdf);
router.get("/conversation/:conversationId", getConversationHistory);
router.delete("/conversation/:conversationId", deleteConversation);

export default router;
