import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { getModel } from "../config/model.js";
import fs from "fs";

export const imageAnalyzer = async (state) => {
  try {
    const llm = await getModel("imageAnalyzer");

    const imageBuffer = await fs.promises.readFile(state.file.path);

    const base64image = imageBuffer.toString("base64");

    const messages = [
      new SystemMessage(
        `
                You are ShifraAI image analyzer Agent.

                Rules:
                - Analyze only the uploaded image
                - If text exists in the image, extract it
                - If charts or tables exist, explain them.
                - If something is unclear, say so.
                - Use Markdown when helpful.
                - Do not hallucinate.
                `,
      ),
      new HumanMessage({
        content: [
          {
            type: "text",
            text: state.prompt || "analyze the image",
          },
          {
            type: "image_url",
            image_url: `data:${state.file.mimetype};base64,${base64image}`,
          },
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
    if (state.file?.path && fs.existsSync(state.file.path)) {
      await fs.promises.unlink(state.file.path).catch(() => {});
    }
  }
};
