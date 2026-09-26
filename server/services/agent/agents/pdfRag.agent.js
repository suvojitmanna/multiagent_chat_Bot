import { pdfRagService } from "../services/pdfRag.service.js";
import { Document } from "../models/Document.js";
import fs from "fs";


export const pdfRag = async (state) => {
  try {
    const userId = state.userId || state.user?._id || "chat_user";
    const prompt = (state.prompt || "").trim();
    if (state.file && state.file.path) {
      console.log(`[pdfRag Agent] Processing uploaded file: ${state.file.originalname}`);

      const processed = await pdfRagService.processUploadedPdf({
        filePath: state.file.path,
        originalName: state.file.originalname,
        fileSize: state.file.size,
        userId,
      });
      if (prompt && !/^(analyze|read|process|summarize\s+this|what\s+is\s+this)\b/i.test(prompt)) {
        const queryRes = await pdfRagService.queryPdfRag({
          userId,
          documentId: processed.documentId,
          conversationId: state.conversationId,
          question: prompt,
        });

        const formattedSources = queryRes.sources
          ?.map((s) => `• **Page ${s.pageNumber}** (${(s.score * 100).toFixed(0)}% match): _"${s.text}"_`)
          .join("\n\n");

        return {
          ...state,
          documentId: processed.documentId,
          aiResponse: `${queryRes.answer}\n\n---\n**📚 Retrieved Sources (Custom Vector DB):**\n${formattedSources || "Grounded strictly in document context."}`,
          artifacts: [],
        };
      }
      const welcomeResponse = `### 📄 PDF Indexed Successfully!
**Document:** \`${processed.filename}\`  
**Pages:** ${processed.pageCount} | **Vector Chunks:** ${processed.chunkCount}  
**Status:** Stored in Custom Vector Database (In-Memory + Disk Persistence)

---
You can now ask any question about this document! Here are a few ideas:
- *"What are the main key points of this document?"*
- *"Summarize page 1 for me."*
- *"What conclusions does this document draw?"*`;

      return {
        ...state,
        documentId: processed.documentId,
        aiResponse: welcomeResponse,
        artifacts: [],
      };
    }
    let targetDocId = state.documentId;

    if (!targetDocId) {
      const latestDoc = await Document.findOne({ userId, status: "ready" }).sort({ createdAt: -1 });
      if (latestDoc) {
        targetDocId = latestDoc.documentId;
      }
    }

    if (!targetDocId) {
      return {
        ...state,
        aiResponse:
          "⚠️ **No PDF document selected.** Please upload a PDF file or select an uploaded document from the PDF Studio to ask questions.",
      };
    }

    const queryRes = await pdfRagService.queryPdfRag({
      userId,
      documentId: targetDocId,
      conversationId: state.conversationId,
      question: prompt || "What is the summary of this document?",
    });

    const formattedSources = queryRes.sources
      ?.map((s) => `• **Page ${s.pageNumber}** (${(s.score * 100).toFixed(0)}% match): _"${s.text}"_`)
      .join("\n\n");

    const answerWithSources =
      queryRes.sources && queryRes.sources.length > 0
        ? `${queryRes.answer}\n\n---\n**📚 Retrieved Sources (Custom Vector DB):**\n${formattedSources}`
        : queryRes.answer;

    return {
      ...state,
      documentId: targetDocId,
      aiResponse: answerWithSources,
      artifacts: [],
    };
  } catch (err) {
    console.error("[pdfRag Agent] Error:", err);
    return {
      ...state,
      aiResponse: `❌ Error querying PDF: ${err.message}`,
    };
  } finally {
    if (state.file?.path && fs.existsSync(state.file.path)) {
      await fs.promises.unlink(state.file.path).catch(() => {});
    }
  }
};