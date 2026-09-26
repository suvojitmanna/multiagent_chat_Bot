export const normalizeUrl = (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== "string") return "";
  try {
    const parsed = new URL(rawUrl.trim());
    const trackingParams = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "fbclid",
      "gclid",
      "ref",
      "source",
      "ref_src",
      "igshid",
    ];
    trackingParams.forEach((param) => parsed.searchParams.delete(param));
    parsed.hash = "";
    let pathname = parsed.pathname;
    if (pathname.length > 1 && pathname.endsWith("/")) {
      pathname = pathname.slice(0, -1);
    }
    parsed.pathname = pathname;

    return parsed.toString();
  } catch {
    return rawUrl.trim().toLowerCase().replace(/\/+$/, "");
  }
};

const isJunkSnippet = (content) => {
  if (!content || typeof content !== "string") return true;
  const lower = content.toLowerCase();
  const junkPatterns = [
    "javascript is disabled",
    "enable javascript to continue",
    "please enable cookies",
    "access denied",
    "404 not found",
    "page not found",
    "verify you are a human",
    "cloudflare ray id",
    "checking your browser",
  ];
  return junkPatterns.some((pattern) => lower.includes(pattern));
};

export const calculateRelevanceScore = (query, item) => {
  if (!query || typeof query !== "string") return 0;

  const queryTerms = query
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2);

  if (queryTerms.length === 0) return 1;

  const title = (item.title || "").toLowerCase();
  const content = (item.content || item.snippet || "").toLowerCase();
  const url = (item.url || "").toLowerCase();

  let score = 0;

  if (typeof item.score === "number" && item.score > 0) {
    score += Math.min(item.score * 2, 4);
  }

  for (const term of queryTerms) {
    if (title.includes(term)) {
      score += 5;
      if (new RegExp(`\\b${term}\\b`, "i").test(title)) {
        score += 3;
      }
    }

    const matches = (content.match(new RegExp(term, "gi")) || []).length;
    score += Math.min(matches * 2, 6);

    if (url.includes(term)) {
      score += 2;
    }
  }

  const len = content.length;
  if (len >= 80 && len <= 800) {
    score += 3;
  } else if (len < 30) {
    score -= 4;
  }

  if (isJunkSnippet(content)) {
    score -= 25;
  }

  return score;
};

export const deduplicateAndRerankResults = (
  results = [],
  query = "",
  maxResults = 5,
) => {
  if (!Array.isArray(results) || results.length === 0) return [];

  const seenUrls = new Set();
  const seenTitles = new Set();
  const candidates = [];

  for (const item of results) {
    if (!item || !item.url) continue;

    const normUrl = normalizeUrl(item.url);
    if (!normUrl || seenUrls.has(normUrl)) {
      continue;
    }

    const cleanTitle = (item.title || "")
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .trim();

    if (cleanTitle && seenTitles.has(cleanTitle)) {
      continue;
    }

    const content = item.content || item.snippet || "";
    if (isJunkSnippet(content)) {
      continue;
    }

    const score = calculateRelevanceScore(query, item);

    seenUrls.add(normUrl);
    if (cleanTitle) seenTitles.add(cleanTitle);

    candidates.push({
      title: item.title?.trim() || "Untitled",
      url: normUrl,
      content: content.trim(),
      _score: score,
    });
  }

  candidates.sort((a, b) => b._score - a._score);

  return candidates.slice(0, maxResults).map(({ _score, ...rest }) => rest);
};

export const deduplicateImages = (images = [], maxImages = 5) => {
  if (!Array.isArray(images) || images.length === 0) return [];

  const seen = new Set();
  const validImages = [];

  for (const item of images) {
    const url = typeof item === "string" ? item.trim() : item?.url?.trim();
    if (!url || !url.startsWith("http")) continue;

    const lower = url.toLowerCase();
    if (
      lower.includes("1x1") ||
      lower.includes("pixel") ||
      lower.includes("spacer") ||
      lower.includes("favicon")
    ) {
      continue;
    }

    const normUrl = normalizeUrl(url);
    if (!normUrl || seen.has(normUrl)) continue;

    seen.add(normUrl);
    validImages.push(url);

    if (validImages.length >= maxImages) break;
  }

  return validImages;
};
