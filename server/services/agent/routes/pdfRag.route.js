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

const router = express.Router();

router.post("/upload", upload.single("file"), uploadPdf);
router.get("/", listDocuments);
router.get("/status/:documentId", getDocumentStatus);
router.get("/:documentId", getDocumentDetails);
router.delete("/:documentId", deleteDocument);

router.post("/chat", chatPdf);
router.get("/conversation/:conversationId", getConversationHistory);
router.delete("/conversation/:conversationId", deleteConversation);

export default router;
