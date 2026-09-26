import { tavily } from "@tavily/core";

const apiKey = (process.env.TAVILY_API_KEY || "").replace(/['"]/g, "").trim();

let client = null;
if (apiKey) {
  try {
    client = tavily({ apiKey });
  } catch (err) {
    console.warn("Failed to initialize Tavily client:", err.message);
  }
}

export const searchTavily = async (query) => {
  if (!client) {
    throw new Error("Tavily API key is missing or not configured.");
  }
  return await client.search(query, {
    maxResults: 5,
    topic: "general",
    includeImages: true,
  });
};
