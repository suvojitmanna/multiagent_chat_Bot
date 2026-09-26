import { searchSearxng } from "../config/searxng.js";
import { searchTavily } from "../config/tavily.js";

export const searchGenAgent = async (state) => {
  const query = state?.prompt || "";
  const preferredProvider = (process.env.SEARCH_PROVIDER || "searxng").toLowerCase();

  let result = null;
  let source = "";

  if (preferredProvider === "tavily") {
    try {
      console.log("--> [1/2] Executing Tavily Search for:", query);
      result = await searchTavily(query);
      source = "Tavily";
    } catch (tavilyErr) {
      console.warn(`⚠️ Tavily search failed (${tavilyErr.message}). Falling back to SearXNG...`);
      try {
        console.log("--> [2/2] Executing SearXNG Fallback Search for:", query);
        result = await searchSearxng(query);
        source = "SearXNG (fallback)";
      } catch (searxngErr) {
        console.error("❌ Both Tavily and SearXNG search providers failed:", searxngErr.message);
      }
    }
  } else {
    try {
      console.log(`🔍 [SearXNG] Searching for: "${query}"...`);
      result = await searchSearxng(query);
      if (!result?.results || result.results.length === 0) {
        console.warn("⚠️ [SearXNG] Returned 0 results. Triggering Tavily fallback...");
        throw new Error("SearXNG returned empty results");
      }

      console.log(`🟢 [SearXNG] Connected successfully! Found ${result.results.length} web results & ${result.images?.length || 0} images.`);
      source = "SearXNG";
    } catch (searxngErr) {
      console.warn(`⚠️ [SearXNG] Failed (${searxngErr.message}). Falling back to Tavily...`);
      try {
        console.log(`🔍 [Tavily] Fallback search for: "${query}"...`);
        result = await searchTavily(query);
        console.log(`🟡 [Tavily Fallback] Connected successfully! Found ${result?.results?.length || 0} web results & ${result?.images?.length || 0} images.`);
        source = "Tavily (fallback)";
      } catch (tavilyErr) {
        console.error("❌ Both SearXNG and Tavily search providers failed:", tavilyErr.message);
      }
    }
  }

  const rawImages = result?.images || [];
  const imageUrls = Array.isArray(rawImages)
    ? rawImages
        .map((img) => (typeof img === "string" ? img : img?.url))
        .filter((url) => typeof url === "string" && url.startsWith("http"))
    : [];

  return {
    ...state,
    searchResult: result?.results || [],
    images: imageUrls,
  };
};
