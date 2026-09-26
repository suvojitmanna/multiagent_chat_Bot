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
    return {
      ...state,
      aiResponse: response.content,
    };
  } catch (error) {
    console.error("Image Analyzer error:", error);
    throw error;
  } finally {
    if (state.file?.path && fs.existsSync(state.file.path)) {
      await fs.promises.unlink(state.file.path).catch(() => {});
    }
  }
};
