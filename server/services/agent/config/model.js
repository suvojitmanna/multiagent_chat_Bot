import { ChatGroq } from "@langchain/groq";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

export const groq = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY || process.env.GORK_API_KEY,
  model: "openai/gpt-oss-120b",
  temperature: 0,
  maxTokens: undefined,
  maxRetries: 2,
});

export const gemini = new ChatGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
  model: "gemini-flash-latest",
  temperature: 0,
  maxRetries: 2,
});

export const getModel = (param = {}) => {
  const agent = typeof param === "string" ? param : param?.agent;
  switch (agent) {
    case "router":
      return groq;
    case "chat":
      return groq;
    case "search":
      return groq;
    case "image":
      return gemini;
    case "ppt":
      return gemini;
    case "pdf":
      return gemini;
    case "coding":
      return gemini;
    default:
      return groq;
  }
};
