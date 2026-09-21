import axios from "axios";
import { graph } from "../graph/graph.js";

export const agent = async (req, res) => {
  try {
    const { prompt, conversationId } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    await axios.post(`${process.env.CHAT_SERVICE}/save-messages`, {
      content: prompt,
      conversationId,
      role: "user",
    });

    const result = await graph.invoke({
      prompt,
      conversationId,
    });

    const response = result.aiResponse?.messages;
    return res.status(200).json(response);
    
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "agent service error" });
  }
};
