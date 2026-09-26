import { pdfRagService } from "../services/pdfRag.service.js";

const getUserId = (req) => {
  return (
    req.headers["x-user-id"] ||
    req.user?._id ||
    req.user?.id ||
    req.body?.userId ||
    "guest_user"
  );
};

export const uploadPdf = async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "PDF file is required." });
    }

    if (file.mimetype !== "application/pdf") {
      return res.status(400).json({ error: "Invalid file type. Only PDF documents are allowed." });
    }

    const userId = getUserId(req);

    const result = await pdfRagService.processUploadedPdf({
      filePath: file.path,
      originalName: file.originalname,
      fileSize: file.size,
      userId,
    });

    return res.status(201).json({
      success: true,
      message: "PDF uploaded, chunked, embedded, and stored in Custom Vector DB successfully.",
      document: result,
    });
  } catch (err) {
    console.error("[PdfRagController] Upload error:", err);
    return res.status(500).json({
      error: "Failed to process PDF document",
      details: err.message,
    });
  }
};

export const listDocuments = async (req, res) => {
  try {
    const userId = getUserId(req);
    const documents = await pdfRagService.getUserDocuments(userId);
    return res.status(200).json({
      success: true,
      documents,
    });
  } catch (err) {
    console.error("[PdfRagController] List error:", err);
    return res.status(500).json({ error: "Failed to list documents", details: err.message });
  }
};

export const getDocumentDetails = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { documentId } = req.params;
    const document = await pdfRagService.getDocument(userId, documentId);

    if (!document) {
      return res.status(404).json({ error: "Document not found or access denied." });
    }

    return res.status(200).json({
      success: true,
      document,
    });
  } catch (err) {
    console.error("[PdfRagController] Get details error:", err);
    return res.status(500).json({ error: "Failed to fetch document details", details: err.message });
  }
};

export const getDocumentStatus = async (req, res) => {
  try {
    const { documentId } = req.params;
    const status = await pdfRagService.getProcessingStatus(documentId);

    if (!status) {
      return res.status(404).json({ error: "Document status not found." });
    }

    return res.status(200).json({
      success: true,
      status,
    });
  } catch (err) {
    console.error("[PdfRagController] Get status error:", err);
    return res.status(500).json({ error: "Failed to fetch status", details: err.message });
  }
};

export const deleteDocument = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { documentId } = req.params;

    const result = await pdfRagService.deleteDocument(userId, documentId);
    return res.status(200).json({
      success: true,
      message: "Document, Custom Vector DB vectors, and Redis cache deleted successfully.",
      result,
    });
  } catch (err) {
    console.error("[PdfRagController] Delete error:", err);
    return res.status(500).json({ error: "Failed to delete document", details: err.message });
  }
};

export const chatPdf = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { documentId, conversationId, question, prompt, topK } = req.body;

    const activeQuestion = question || prompt;
    if (!documentId) {
      return res.status(400).json({ error: "documentId is required in request body." });
    }
    if (!activeQuestion) {
      return res.status(400).json({ error: "question is required in request body." });
    }

    const result = await pdfRagService.queryPdfRag({
      userId,
      documentId,
      conversationId,
      question: activeQuestion,
      topK: topK || 5,
    });

    return res.status(200).json({
      success: true,
      answer: result.answer,
      sources: result.sources,
      conversationId: result.conversationId,
      cached: result.cached || false,
    });
  } catch (err) {
    console.error("[PdfRagController] Chat error:", err);
    return res.status(500).json({
      error: "Failed to answer question",
      details: err.message,
    });
  }
};

export const getConversationHistory = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { conversationId } = req.params;
    const messages = await pdfRagService.getConversation(userId, conversationId);

    return res.status(200).json({
      success: true,
      conversationId,
      messages,
    });
  } catch (err) {
    console.error("[PdfRagController] Get conversation error:", err);
    return res.status(500).json({ error: "Failed to get conversation history", details: err.message });
  }
};

export const deleteConversation = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { conversationId } = req.params;
    await pdfRagService.deleteConversation(userId, conversationId);

    return res.status(200).json({
      success: true,
      message: "Conversation deleted successfully.",
    });
  } catch (err) {
    console.error("[PdfRagController] Delete conversation error:", err);
    return res.status(500).json({ error: "Failed to delete conversation", details: err.message });
  }
};
