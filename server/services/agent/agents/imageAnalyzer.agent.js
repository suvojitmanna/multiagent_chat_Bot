import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { getModel } from "../config/model.js";
import fs from "fs";

export const imageAnalyzer = async (state) => {
  const targetFiles =
    Array.isArray(state.files) && state.files.length > 0
      ? state.files.filter((f) => f?.mimetype?.startsWith("image/"))
      : state.file?.mimetype?.startsWith("image/")
        ? [state.file]
        : [];

  try {
    const llm = await getModel("imageAnalyzer");

    const imageBlocks = [];
    for (const f of targetFiles) {
      if (f?.path && fs.existsSync(f.path)) {
        const imageBuffer = await fs.promises.readFile(f.path);
        const base64image = imageBuffer.toString("base64");
        imageBlocks.push({
          type: "image_url",
          image_url: `data:${f.mimetype};base64,${base64image}`,
        });
      }
    }

    if (imageBlocks.length === 0) {
      return {
        ...state,
        aiResponse: "❌ No valid image file was found to analyze.",
      };
    }

    const messages = [
      new SystemMessage(
        `
You are ShifraAI image analyzer Agent.

Rules:
- Analyze all uploaded images thoroughly.
- If text exists in the images, extract it.
- If charts or tables exist, explain them clearly.
- If multiple images are provided, compare and reference each image clearly.
- If something is unclear, say so.
- Use Markdown when helpful.
- Do not hallucinate.
        `,
      ),
      new HumanMessage({
        content: [
          {
            type: "text",
            text: state.prompt || "analyze the uploaded images",
          },
          ...imageBlocks,
        ],
      }),
    ];

    const response = await llm.invoke(messages);
    const contentText = Array.isArray(response.content)
      ? response.content
          .map((part) => (typeof part === "string" ? part : part?.text || ""))
          .join("\n\n")
      : typeof response.content === "string"
        ? response.content
        : String(response.content || "");

    return {
      ...state,
      aiResponse: contentText,
    };
  } catch (error) {
    console.error("Image Analyzer error:", error);
    const isRateLimit =
      error?.status === 429 ||
      error?.message?.includes("429") ||
      error?.message?.includes("Quota");
    return {
      ...state,
      aiResponse: isRateLimit
        ? "⚠️ **Gemini API Rate Limit (429):** Free-tier quota was temporarily reached. Please wait ~30-60 seconds and try again."
        : `❌ **Image analysis error:** ${error.message || "Could not analyze image."}`,
    };
  } finally {
    for (const f of targetFiles) {
      if (f?.path && fs.existsSync(f.path)) {
        await fs.promises.unlink(f.path).catch(() => {});
      }
    }
  }
};
