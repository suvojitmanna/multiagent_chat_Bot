import axios from "axios";
import { graph } from "../graph/graph.js";

export const agent = async (req, res) => {
  try {
    const { prompt, conversationId } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    if (conversationId) {
      try {
        await axios.post(`${process.env.CHAT_SERVICE}/save-messages`, {
          content: prompt,
          conversationId,
          role: "user",
        });
      } catch (err) {
        console.warn("Could not save user message to chat service:", err.message);
      }
    }

    const result = await graph.invoke({
      prompt,
      conversationId,
    });

    const response = typeof result.aiResponse === "string" 
      ? result.aiResponse 
      : (result.aiResponse?.messages || result.aiResponse);

    if (conversationId && response) {
      try {
        await axios.post(`${process.env.CHAT_SERVICE}/save-messages`, {
          content: typeof response === "string" ? response : JSON.stringify(response),
          conversationId,
          role: "assistant",
        });
      } catch (err) {
        console.warn("Could not save assistant message to chat service:", err.message);
      }
    }

    return res.status(200).json({ success: true, response });
    
  } catch (err) {
    console.error("Agent error:", err);
    return res.status(500).json({ error: "agent service error", details: err.message });
  }
};
