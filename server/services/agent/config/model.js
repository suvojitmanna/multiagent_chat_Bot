import "dotenv/config";
import { ChatGroq } from "@langchain/groq";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenRouter } from "@langchain/openrouter";

let groqInstance = null;
let geminiInstance = null;

export const getGroq = () => {
  if (!groqInstance) {
    const apiKey = process.env.GROQ_API_KEY || process.env.GORK_API_KEY;
    if (!apiKey) {
      throw new Error(
        "Groq API key not found. Please set GROQ_API_KEY in server/services/agent/.env",
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
        "Gemini API key not found. Please set GEMINI_API_KEY in server/services/agent/.env",
      );
    }
    geminiInstance = new ChatGoogleGenerativeAI({
      apiKey,
      model: process.env.GEMINI_MODEL || "gemini-3.8-flash",
      temperature: 0,
      maxRetries: 2,
    });
  }
  return geminiInstance;
};
let openRouterInstance = null;
export const getOpenRouter = () => {
  if (!openRouterInstance) {
    const rawKey = process.env.OPENROUTER_API_KEY || "";
    const apiKey = rawKey.trim().replace(/^["']|["']$/g, "").trim();
    if (!apiKey) {
      throw new Error(
        "OpenRouter API key not found. Please set OPENROUTER_API_KEY in server/services/agent/.env"
      );
    }
    openRouterInstance = new ChatOpenRouter({
      apiKey,
      model: process.env.OPENROUTER_MODEL || "deepseek/deepseek-chat",
      temperature: 0.2,
      maxTokens: parseInt(process.env.OPENROUTER_MAX_TOKENS || "4096", 10),
    });
  }
  return openRouterInstance;
};

export const openRouter = new Proxy(
  {},
  {
    get: (_, prop) => getOpenRouter()[prop],
  }
);

export const getModel = (param = {}) => {
  const agent = typeof param === "string" ? param : param?.agent;
  switch (agent) {
    case "router":
    case "chat":
    case "search":
    case "intent":
      return getGroq();
    case "image":
    case "ppt":
    case "pdf":
      return getGroq();
    case "coding":
      return openRouter;
    case "imageAnalyzer":
      return gemini;
    case "pdfRag":
      return getGroq();
    default:
      return getGroq();
  }
};

export const invokeWithFallback = async (
  primaryModel,
  fallbackModel,
  input,
) => {
  try {
    return await primaryModel.invoke(input);
  } catch (err) {
    console.warn(
      "Primary model invocation failed, attempting fallback:",
      err.message,
    );
    if (fallbackModel) {
      return await fallbackModel.invoke(input);
    }
    throw err;
  }
};

export const groq = new Proxy(
  {},
  {
    get: (_, prop) => getGroq()[prop],
  },
);

export const gemini = new Proxy(
  {},
  {
    get: (_, prop) => getGemini()[prop],
  },
);
