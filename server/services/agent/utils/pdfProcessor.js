import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pdfParseModule = require("pdf-parse");

export function cleanText(text) {
  if (!text || typeof text !== "string") return "";

  return text
    .replace(/[\r\f\v]/g, "\n")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .replace(/[^\S\r\n]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function extractPdfPages(pdfBuffer) {
  const pages = [];

  try {
    if (pdfParseModule.PDFParse) {
      const parser = new pdfParseModule.PDFParse({ data: pdfBuffer });
      await parser.load();
      const result = await parser.getText();

      if (Array.isArray(result.pages) && result.pages.length > 0) {
        for (const p of result.pages) {
          const cleaned = cleanText(p.text);
          if (cleaned.length > 0) {
            pages.push({
              pageNumber: Number(p.num || pages.length + 1),
              text: cleaned,
            });
          }
        }
      } else if (result.text) {
        const cleaned = cleanText(result.text);
        if (cleaned.length > 0) {
          pages.push({
            pageNumber: 1,
            text: cleaned,
          });
        }
      }

      return {
        numPages: Number(result.total || pages.length || 1),
        pages,
      };
    }

    if (typeof pdfParseModule === "function") {
      const parsed = await pdfParseModule(pdfBuffer);
      const cleaned = cleanText(parsed.text);
      if (cleaned.length > 0) {
        pages.push({
          pageNumber: 1,
          text: cleaned,
        });
      }
      return {
        numPages: parsed.numpages || 1,
        pages,
      };
    }

    throw new Error("Unable to locate valid PDF parser in module.");
  } catch (err) {
    throw new Error(`Failed to parse PDF document: ${err.message}`);
  }
}

export function chunkText(text, chunkSize = 1000, chunkOverlap = 150) {
  if (!text || text.length <= chunkSize) {
    return text ? [text] : [];
  }

  const chunks = [];
  let startIndex = 0;

  while (startIndex < text.length) {
    let endIndex = startIndex + chunkSize;

    if (endIndex >= text.length) {
      chunks.push(text.slice(startIndex).trim());
      break;
    }

    const windowStart = Math.max(startIndex, endIndex - 150);
    const windowText = text.slice(windowStart, endIndex);

    const breakMatch = /[\n.!?]\s+[A-Z0-9]/g;
    let bestBreak = -1;
    let match;
    while ((match = breakMatch.exec(windowText)) !== null) {
      bestBreak = windowStart + match.index + 1;
    }

    if (bestBreak > startIndex) {
      endIndex = bestBreak;
    } else {
      const lastSpace = text.lastIndexOf(" ", endIndex);
      if (lastSpace > startIndex) {
        endIndex = lastSpace;
      }
    }

    const chunk = text.slice(startIndex, endIndex).trim();
    if (chunk.length > 0) {
      chunks.push(chunk);
    }

    startIndex = Math.max(startIndex + 1, endIndex - chunkOverlap);
  }

  return chunks;
}

export async function processPdfIntoChunks(pdfBuffer, documentId, metadata = {}) {
  const { numPages, pages } = await extractPdfPages(pdfBuffer);

  if (pages.length === 0) {
    throw new Error("No readable text found in the uploaded PDF. It may be empty or contain only scanned images.");
  }

  const chunks = [];
  let globalChunkIndex = 0;

  for (const page of pages) {
    const pageChunks = chunkText(page.text, 1000, 150);

    for (let i = 0; i < pageChunks.length; i++) {
      const chunkTextContent = pageChunks[i];
      if (!chunkTextContent || chunkTextContent.length < 10) continue;

      chunks.push({
        id: `chunk_${documentId}_p${page.pageNumber}_${globalChunkIndex++}`,
        documentId,
        pageNumber: page.pageNumber,
        text: chunkTextContent,
        metadata: {
          ...metadata,
          chunkIndex: globalChunkIndex,
          pageChunkIndex: i + 1,
          charCount: chunkTextContent.length,
        },
      });
    }
  }

  return {
    numPages,
    chunks,
  };
}
