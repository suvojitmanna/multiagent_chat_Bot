import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_VECTORS_DIR = path.resolve(__dirname, "..", "data", "vectors");

export function cosineSimilarity(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
    return 0;
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
export class CustomVectorDB {
  constructor(storageDir = null) {
    this.storageDir = storageDir || DEFAULT_VECTORS_DIR;
    this.records = new Map();
    this.documents = new Map();
    this.initialized = false;
    this.ensureStorageDirectory();
  }

  ensureStorageDirectory() {
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  async init() {
    this.ensureStorageDirectory();
    let loadedCount = 0;

    try {
      const files = await fs.promises.readdir(this.storageDir);
      for (const file of files) {
        if (!file.endsWith(".json")) continue;
        const filePath = path.join(this.storageDir, file);
        try {
          const content = await fs.promises.readFile(filePath, "utf-8");
          const records = JSON.parse(content);
          if (Array.isArray(records)) {
            for (const record of records) {
              this._indexRecordInMemory(record);
              loadedCount++;
            }
          }
        } catch (readErr) {
          console.error(`[CustomVectorDB] Failed to load vector file ${file}:`, readErr.message);
        }
      }
      this.initialized = true;
    } catch (err) {
      console.error("[CustomVectorDB] Error during initialization:", err);
      this.initialized = true;
    }
  }

  _indexRecordInMemory(record) {
    if (!record || !record.id || !record.documentId) return;

    this.records.set(record.id, record);

    if (!this.documents.has(record.documentId)) {
      this.documents.set(record.documentId, new Set());
    }
    this.documents.get(record.documentId).add(record.id);
  }

  _removeRecordFromMemory(id) {
    const record = this.records.get(id);
    if (!record) return;

    this.records.delete(id);
    const docSet = this.documents.get(record.documentId);
    if (docSet) {
      docSet.delete(id);
      if (docSet.size === 0) {
        this.documents.delete(record.documentId);
      }
    }
  }

  async _persistDocument(documentId) {
    this.ensureStorageDirectory();
    const docSet = this.documents.get(documentId);
    const filePath = path.join(this.storageDir, `${documentId}.json`);

    if (!docSet || docSet.size === 0) {
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath).catch(() => {});
      }
      return;
    }

    const docRecords = [];
    for (const id of docSet) {
      const rec = this.records.get(id);
      if (rec) docRecords.push(rec);
    }

    await fs.promises.writeFile(filePath, JSON.stringify(docRecords), "utf-8");
  }

  async insert(record) {
    if (!record.id || !record.documentId || !record.embedding) {
      throw new Error("Vector record requires id, documentId, and embedding array.");
    }

    const cleanRecord = {
      id: String(record.id),
      documentId: String(record.documentId),
      pageNumber: Number(record.pageNumber || 1),
      text: String(record.text || ""),
      embedding: Array.from(record.embedding),
      metadata: record.metadata || {},
    };

    this._indexRecordInMemory(cleanRecord);
    await this._persistDocument(cleanRecord.documentId);
    return cleanRecord;
  }

  async insertMany(records) {
    if (!Array.isArray(records) || records.length === 0) {
      return [];
    }

    const affectedDocs = new Set();
    const inserted = [];

    for (const record of records) {
      if (!record.id || !record.documentId || !record.embedding) continue;

      const cleanRecord = {
        id: String(record.id),
        documentId: String(record.documentId),
        pageNumber: Number(record.pageNumber || 1),
        text: String(record.text || ""),
        embedding: Array.from(record.embedding),
        metadata: record.metadata || {},
      };

      this._indexRecordInMemory(cleanRecord);
      affectedDocs.add(cleanRecord.documentId);
      inserted.push(cleanRecord);
    }

    for (const docId of affectedDocs) {
      await this._persistDocument(docId);
    }

    return inserted;
  }

  get(id) {
    return this.records.get(String(id)) || null;
  }

  getByDocumentId(documentId) {
    const docSet = this.documents.get(String(documentId));
    if (!docSet) return [];

    const results = [];
    for (const id of docSet) {
      const rec = this.records.get(id);
      if (rec) results.push(rec);
    }
    return results;
  }

  async deleteByDocumentId(documentId) {
    const docId = String(documentId);
    const docSet = this.documents.get(docId);
    const count = docSet ? docSet.size : 0;

    if (docSet) {
      for (const id of Array.from(docSet)) {
        this.records.delete(id);
      }
      this.documents.delete(docId);
    }

    const filePath = path.join(this.storageDir, `${docId}.json`);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath).catch(() => {});
    }

    console.log(`[CustomVectorDB] Deleted ${count} vectors for document ${docId}`);
    return count;
  }

  search({ queryEmbedding, documentId, topK = 5, minScore = 0.0 }) {
    if (!Array.isArray(queryEmbedding) || queryEmbedding.length === 0) {
      throw new Error("Query embedding is required for vector search.");
    }
    if (!documentId) {
      throw new Error("documentId is strictly required for document-isolated vector search.");
    }

    const docSet = this.documents.get(String(documentId));
    if (!docSet || docSet.size === 0) {
      return [];
    }

    const scoredResults = [];

    for (const id of docSet) {
      const record = this.records.get(id);
      if (!record || !record.embedding) continue;

      const score = cosineSimilarity(queryEmbedding, record.embedding);

      if (score >= minScore) {
        scoredResults.push({
          id: record.id,
          documentId: record.documentId,
          pageNumber: record.pageNumber,
          text: record.text,
          metadata: record.metadata,
          score: parseFloat(score.toFixed(4)),
        });
      }
    }

    scoredResults.sort((a, b) => b.score - a.score);

    return scoredResults.slice(0, topK);
  }


  async clearAll() {
    const count = this.records.size;
    this.records.clear();
    this.documents.clear();
    try {
      if (fs.existsSync(this.storageDir)) {
        const files = await fs.promises.readdir(this.storageDir);
        for (const file of files) {
          if (file.endsWith(".json")) {
            await fs.promises.unlink(path.join(this.storageDir, file)).catch(() => {});
          }
        }
      }
    } catch (e) {
      console.warn("[CustomVectorDB] clearAll error:", e.message);
    }
    console.log(`[CustomVectorDB] Cleared all ${count} vectors from memory and disk.`);
    return count;
  }

  getStats() {
    return {
      totalVectors: this.records.size,
      totalDocuments: this.documents.size,
      storageDirectory: this.storageDir,
    };
  }
}

export const customVectorDB = new CustomVectorDB();
