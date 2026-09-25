import axios from "axios";
import { graph } from "../graph/graph.js";
import { addMessage } from "../config/memory.js";

export const agent = async (req, res) => {
  try {
    const { prompt, conversationId, agent } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const userId = req.headers["x-user-id"];
    let remainingCredits = null;
    const authServiceUrl = process.env.AUTH_SERVICE || "http://localhost:8001";

    const COST = {
      auto: 1,
      chat: 1,
      search: 5,
      coding: 10,
      pdf: 10,
      ppt: 10,
      image: 10,
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
        await axios.post(`${process.env.CHAT_SERVICE}/save-messages`, {
          content: prompt,
          conversationId,
          role: "user",
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
    });

    const response =
      typeof result.aiResponse === "string"
        ? result.aiResponse
        : result.aiResponse?.messages || result.aiResponse;

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
        console.log(
          `[Agent] Deducted credits for user ${userId} after answer generation. Remaining: ${remainingCredits}`,
        );
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
