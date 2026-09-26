import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

let embeddingsInstance = null;

export function getEmbeddingsClient() {
  if (!embeddingsInstance) {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined in server environment.");
    }

    embeddingsInstance = new GoogleGenerativeAIEmbeddings({
      apiKey,
      model: process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001",
    });
  }
  return embeddingsInstance;
}

export async function embedQuery(text) {
  if (!text || typeof text !== "string") {
    throw new Error("Query text is required for embedding generation.");
  }
  const client = getEmbeddingsClient();
  return await client.embedQuery(text.trim());
}


export async function embedDocuments(texts, batchSize = 8) {
  if (!Array.isArray(texts) || texts.length === 0) {
    return [];
  }

  const client = getEmbeddingsClient();
  const allEmbeddings = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    let attempts = 0;
    let success = false;

    while (!success && attempts < 3) {
      try {
        attempts++;
        const embeddings = await client.embedDocuments(batch);
        allEmbeddings.push(...embeddings);
        success = true;
      } catch (err) {
        console.warn(
          `[Gemini Embeddings] Batch ${i / batchSize + 1} attempt ${attempts} failed: ${err.message}`
        );
        if (attempts >= 3) {
          throw new Error(`Embedding generation failed after 3 attempts: ${err.message}`);
        }
        await new Promise((res) => setTimeout(res, attempts * 1000));
      }
    }

    if (i + batchSize < texts.length) {
      await new Promise((res) => setTimeout(res, 300));
    }
  }

  return allEmbeddings;
}
