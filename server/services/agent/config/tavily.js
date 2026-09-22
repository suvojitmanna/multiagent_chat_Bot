import { tavily } from "@tavily/core";

const apiKey = (process.env.TAVILY_API_KEY || "").replace(/['"]/g, "").trim();

const client = tavily({ apiKey });

export const searchTavily = async (query) => {
  return await client.search(query, {
    maxResults: 5,
    topic: "general",
    includeImages: true,
  });
};
