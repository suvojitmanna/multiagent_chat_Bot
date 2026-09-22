import { searchTavily } from "../config/tavily.js";

export const searchGenAgent = async (state) => {
  try {
    console.log("--> Executing Tavily Search for:", state?.prompt);
    const result = await searchTavily(state?.prompt || "");
    console.log("Tavily search response received:", result?.results?.length || 0, "results,", result?.images?.length || 0, "images");

    const rawImages = result?.images || [];
    const imageUrls = Array.isArray(rawImages)
      ? rawImages
          .map((img) => (typeof img === "string" ? img : img?.url))
          .filter((url) => typeof url === "string" && url.startsWith("http"))
      : [];

    return {
      ...state,
      searchResult: result?.results || result,
      images: imageUrls,
    };
  } catch (error) {
    console.error("Error in search agent:", error);
    return {
      ...state,
      searchResult: [],
      images: [],
    };
  }
};
