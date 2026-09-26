import axios from "axios";

export const searchSearxng = async (query, options = {}) => {
  const baseUrl = (process.env.SEARXNG_URL || "http://localhost:8080").replace(/\/+$/, "");
  const maxResults = options.maxResults || 5;
  const includeImages = options.includeImages !== false;

  const textSearchPromise = axios.get(`${baseUrl}/search`, {
    params: {
      q: query,
      format: "json",
      categories: "general",
      language: "auto",
    },
    timeout: 8000,
    headers: {
      Accept: "application/json",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });

  const imageSearchPromise = includeImages
    ? axios
        .get(`${baseUrl}/search`, {
          params: {
            q: query,
            format: "json",
            categories: "images",
            language: "auto",
          },
          timeout: 6000,
          headers: {
            Accept: "application/json",
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          },
        })
        .catch((err) => {
          return { data: { results: [] } };
        })
    : Promise.resolve({ data: { results: [] } });

  const [textRes, imageRes] = await Promise.all([
    textSearchPromise,
    imageSearchPromise,
  ]);

  const rawResults = textRes.data?.results || [];

  const results = rawResults.slice(0, maxResults).map((item) => ({
    title: item.title || "",
    url: item.url || "",
    content: item.content || item.snippet || "",
  }));

  const imageResults = imageRes.data?.results || [];
  const images = [];

  for (const img of imageResults) {
    const src = img.img_src || img.thumbnail_src || img.thumbnail || img.url;
    if (src && typeof src === "string" && src.startsWith("http")) {
      images.push(src);
    }
    if (images.length >= 5) break;
  }

  if (images.length < 5) {
    for (const item of rawResults) {
      const src = item.img_src || item.thumbnail;
      if (src && typeof src === "string" && src.startsWith("http") && !images.includes(src)) {
        images.push(src);
      }
      if (images.length >= 5) break;
    }
  }

  return {
    results,
    images,
  };
};

export const checkSearxngConnection = async () => {
  const baseUrl = (process.env.SEARXNG_URL || "http://localhost:8080").replace(/\/+$/, "");
  try {
    const res = await axios.get(`${baseUrl}/search`, {
      params: { q: "test", format: "json" },
      timeout: 4000,
      headers: {
        Accept: "application/json",
      },
    });

    if (res.status === 200 && Array.isArray(res.data?.results)) {
      console.log(`🟢 [SearXNG] Connected successfully at ${baseUrl}`);
      return true;
    } else {
      console.warn(`⚠️ [SearXNG] Responded from ${baseUrl} but unexpected response format.`);
      return false;
    }
  } catch (err) {
    console.warn(`⚠️ [SearXNG] Not reachable at ${baseUrl} (${err.message}). Tavily will be used as fallback.`);
    return false;
  }
};

