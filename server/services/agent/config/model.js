import "dotenv/config";
import { ChatGroq } from "@langchain/groq";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

let groqInstance = null;
let geminiInstance = null;

export const getGroq = () => {
  if (!groqInstance) {
    const apiKey = process.env.GROQ_API_KEY || process.env.GORK_API_KEY;
    if (!apiKey) {
      throw new Error(
        "Groq API key not found. Please set GROQ_API_KEY in server/services/agent/.env"
      );
    }
    groqInstance = new ChatGroq({
      apiKey,
      model: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
      temperature: 0,
      maxRetries: 2,
    });
  }
  return groqInstance;
};

export const getGemini = () => {
  if (!geminiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "Gemini API key not found. Please set GEMINI_API_KEY in server/services/agent/.env"
      );
    }
    geminiInstance = new ChatGoogleGenerativeAI({
      apiKey,
      model: process.env.GEMINI_MODEL || "gemini-1.5-flash",
      temperature: 0,
      maxRetries: 2,
    });
  }
  return geminiInstance;
};

export const getModel = (param = {}) => {
  const agent = typeof param === "string" ? param : param?.agent;
  switch (agent) {
    case "router":
    case "chat":
    case "search":
      return getGroq();
    case "image":
    case "ppt":
    case "pdf":
    case "coding":
      return getGemini();
    default:
      return getGroq();
  }
};

export const groq = new Proxy({}, {
  get: (_, prop) => getGroq()[prop],
});

export const gemini = new Proxy({}, {
  get: (_, prop) => getGemini()[prop],
});
