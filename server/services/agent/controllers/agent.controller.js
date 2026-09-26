import axios from "axios";
import fs from "fs";
import { graph } from "../graph/graph.js";
import { addMessage } from "../config/memory.js";

export const agent = async (req, res) => {
  try {
    const { prompt, conversationId, agent } = req.body;
    const uploadedFiles = Array.isArray(req.files)
      ? req.files
      : req.file
        ? [req.file]
        : [];
    const file = uploadedFiles[0] || null;
    if (!prompt && uploadedFiles.length === 0) {
      return res.status(400).json({ error: "Prompt or file is required" });
    }

    const userId = req.headers["x-user-id"];
    let remainingCredits = null;
    const authServiceUrl = process.env.AUTH_SERVICE;

    const COST = {
      auto: 1,
      chat: 1,
      search: 5,
      coding: 10,
      pdf: 10,
      pdfrag: 10,
      ppt: 10,
      image: 10,
      imageanalyzer: 10,
    };
    const normalizedAgent = String(agent || "auto")
      .toLowerCase()
      .trim();
    const requiredCredits =
      COST[normalizedAgent] !== undefined ? COST[normalizedAgent] : 1;

    if (userId) {
      try {
        const userRes = await axios.get(`${authServiceUrl}/user/${userId}`);
        const user = userRes.data;
        const currentCredits = user?.credits !== undefined ? user.credits : 100;
        if (currentCredits < requiredCredits) {
          return res.status(400).json({
            error: "Insufficient credits",
            message:
              "Insufficient credits. Please upgrade your plan or recharge credits.",
            credits: currentCredits,
            requiredCredits,
          });
        }
      } catch (checkErr) {
        console.warn(
          "Could not check user balance before generation:",
          checkErr.message,
        );
      }
    }

    if (conversationId) {
      try {
        const imageFiles = uploadedFiles.filter((f) =>
          f?.mimetype?.startsWith("image/"),
        );
        const pdfFiles = uploadedFiles.filter(
          (f) => f?.mimetype === "application/pdf",
        );

        let userContent = prompt || "";
        if (pdfFiles.length > 0) {
          userContent =
            `📄 **[PDF: ${pdfFiles.map((p) => p.originalname).join(", ")}]**\n\n${userContent}`.trim();
        }
        if (imageFiles.length > 0) {
          userContent =
            `🖼️ **[Image: ${imageFiles.map((i) => i.originalname).join(", ")}]**\n\n${userContent}`.trim();
        }

        let savedImages = [];
        for (const img of imageFiles) {
          if (
            img.path &&
            fs.existsSync(img.path) &&
            img.size < 4 * 1024 * 1024
          ) {
            try {
              const buf = await fs.promises.readFile(img.path);
              savedImages.push(
                `data:${img.mimetype};base64,${buf.toString("base64")}`,
              );
            } catch (e) {
              console.warn(
                "Could not read image buffer for persistence:",
                e.message,
              );
            }
          }
        }

        await axios.post(`${process.env.CHAT_SERVICE}/save-messages`, {
          content: userContent,
          conversationId,
          role: "user",
          images: savedImages,
        });
      } catch (err) {
        console.warn(
          "Could not save user message to chat service:",
          err.message,
        );
      }
    }

    const result = await graph.invoke({
      prompt,
      conversationId,
      agent,
      file,
      files: uploadedFiles,
      userId,
      documentId: req.body?.documentId,
    });

    const extractCleanText = (val) => {
      if (!val) return "";
      if (typeof val === "string") return val;
      if (Array.isArray(val)) {
        return val
          .map((v) => (typeof v === "string" ? v : v?.text || v?.content || ""))
          .filter(Boolean)
          .join("\n\n");
      }
      if (typeof val === "object") {
        if (val.content) return extractCleanText(val.content);
        if (val.text) return extractCleanText(val.text);
        if (val.messages) return extractCleanText(val.messages);
      }
      return String(val);
    };

    const response = extractCleanText(result.aiResponse);

    await addMessage(conversationId, "user", prompt);
    if (conversationId && response) {
      try {
        await addMessage(conversationId, "assistant", response);
        await axios.post(`${process.env.CHAT_SERVICE}/save-messages`, {
          content:
            typeof response === "string" ? response : JSON.stringify(response),
          conversationId,
          role: "assistant",
          images: Array.isArray(result.images) ? result.images : [],
          artifacts: Array.isArray(result.artifacts) ? result.artifacts : [],
        });
      } catch (err) {
        console.warn(
          "Could not save assistant message to chat service:",
          err.message,
        );
      }
    }

    if (userId && response) {
      try {
        const deductRes = await axios.post(
          `${authServiceUrl}/deduct-credits`,
          {
            userId,
            agent: agent || "auto",
          },
          {
            headers: {
              "x-user-id": userId,
              cookie: req.headers.cookie || "",
            },
          },
        );
        remainingCredits =
          deductRes.data?.credits !== undefined
            ? deductRes.data.credits
            : deductRes.data?.user?.credits;
      } catch (creditErr) {
        console.warn(
          "Could not deduct credits after answer generation:",
          creditErr.response?.data || creditErr.message,
        );
      }
    }

    return res.status(200).json({
      success: true,
      response,
      images: Array.isArray(result.images) ? result.images : [],
      artifacts: Array.isArray(result.artifacts) ? result.artifacts : [],
      credits: remainingCredits,
    });
  } catch (err) {
    console.error("Agent error:", err);
    return res
      .status(500)
      .json({ error: "agent service error", details: err.message });
  }
};
