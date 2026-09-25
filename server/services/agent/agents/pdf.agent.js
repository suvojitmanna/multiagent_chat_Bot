import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs";
import { getModel } from "../config/model.js";
import { uploadImageToCloudinary } from "../config/cloudinary.js";

const cleanJson = (str) => {
  if (!str) return "{}";
  let cleaned = str.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "");
  cleaned = cleaned.replace(/\s*```$/i, "");
  cleaned = cleaned.trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    return cleaned.slice(start, end + 1);
  }
  return cleaned;
};

const createPdfBuffer = (docData) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 50,
        size: "A4",
        bufferPages: true,
      });

      const buffers = [];
      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", (err) => reject(err));
      doc.moveDown(0.8);
      doc
        .fontSize(22)
        .font("Helvetica-Bold")
        .fillColor("#111827")
        .text(docData.title || "Generated Document", 50, doc.y, {
          align: "center",
          width: 495,
        });

      if (docData.subtitle) {
        doc.moveDown(0.3);
        doc
          .fontSize(12)
          .font("Helvetica-Oblique")
          .fillColor("#4b5563")
          .text(docData.subtitle, 50, doc.y, {
            align: "center",
            width: 495,
          });
      }

      doc.moveDown(0.8);
      doc
        .strokeColor("#e5e7eb")
        .lineWidth(0.8)
        .moveTo(50, doc.y)
        .lineTo(545, doc.y)
        .stroke();
      doc.moveDown(1.2);

      if (Array.isArray(docData.sections)) {
        docData.sections.forEach((section, sIdx) => {
          if (doc.y > 720) {
            doc.addPage();
          }

          doc
            .fontSize(13)
            .font("Helvetica-Bold")
            .fillColor("#111827")
            .text(`${sIdx + 1}. ${section.heading || "Section"}`);

          doc.moveDown(0.3);

          if (Array.isArray(section.points)) {
            section.points.forEach((point) => {
              doc
                .fontSize(10)
                .font("Helvetica")
                .fillColor("#374151")
                .text(`•  ${point}`, {
                  indent: 12,
                  lineGap: 3,
                  paragraphGap: 2.5,
                });
            });
          }

          doc.moveDown(0.6);
        });
      }

      const range = doc.bufferedPageRange();
      const lastPageIndex = range.start + range.count - 1;
      doc.switchToPage(lastPageIndex);

      const originalBottomMargin = doc.page.margins.bottom;
      doc.page.margins.bottom = 0;

      const now = new Date();
      const formattedTimestamp = now.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

      const footerY = doc.page.height - 35;
      const margin = 50;
      const contentWidth = 495;

      doc
        .strokeColor("#e5e7eb")
        .lineWidth(0.75)
        .moveTo(margin, footerY - 8)
        .lineTo(margin + contentWidth, footerY - 8)
        .stroke();

      doc
        .fontSize(8.5)
        .font("Helvetica")
        .fillColor("#6b7280")
        .text(
          `Created by ShifraAI Team  •  Lead Developer: Suvojit Manna  •  ${formattedTimestamp}`,
          margin,
          footerY,
          {
            align: "center",
            width: contentWidth,
            lineBreak: false,
          },
        );

      doc.page.margins.bottom = originalBottomMargin;

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

export const pdfGenAgent = async (state) => {
  const topic = state.topic || state.prompt || "Document Summary";

  try {
    const llm = await getModel("pdf");
    const prompt = `
You are an document writer.

Do Not return markdown.

Do Not return explanations.

Structure:

{
"title":"",
"subtitle":"",
"sections":[
{
"heading":"",
"points":[]
}
]
}
Generate 4-8 sections.

Each section should have 3-6 concise bullet points.

Topic: ${topic}
    `;

    const res = await llm.invoke(prompt);
    const content = typeof res?.content === "string" ? res.content : "";
    const cleaned = cleanJson(content);

    let docData;
    try {
      docData = JSON.parse(cleaned);
    } catch (parseErr) {
      console.warn(
        "[PDF Agent] JSON parse failed, using fallback data:",
        parseErr.message,
      );
      docData = {
        title: topic,
        subtitle: "Document Overview",
        sections: [
          {
            heading: "Overview",
            points: [content.slice(0, 300)],
          },
        ],
      };
    }

    const pdfBuffer = await createPdfBuffer(docData);

    const rawPrompt = (
      state.topic ||
      state.prompt ||
      docData.title ||
      "document"
    ).trim();
    const trimmedSlug = rawPrompt
      .replace(
        /^(?:please\s+)?(?:create|generate|make|write|give\s+me)\s+(?:a\s+)?(?:pdf|document)?\s*(?:about|on|for)?\s*/i,
        "",
      )
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "_")
      .replace(/_+/g, "_")
      .slice(0, 35)
      .replace(/^_+|_+$/g, "")
      .toLowerCase();

    const filename = `${trimmedSlug || "document"}.pdf`;
    const pdfsDir = path.join(process.cwd(), "public", "pdfs");
    if (!fs.existsSync(pdfsDir)) {
      fs.mkdirSync(pdfsDir, { recursive: true });
    }
    const localFilePath = path.join(pdfsDir, filename);
    await fs.promises.writeFile(localFilePath, pdfBuffer);

    const directDownloadUrl = `{process.env.SERVER_URL}/download-pdf/${filename}`;
    let cloudinaryUrl = "";
    try {
      const cloudinaryResult = await uploadImageToCloudinary(pdfBuffer, {
        folder: "ai_documents",
        public_id: `${trimmedSlug || "doc"}_${Date.now()}`,
        resource_type: "raw",
        format: "pdf",
      });
      cloudinaryUrl = cloudinaryResult.url;
      console.log("[PDF Agent] PDF Cloudinary URL:", cloudinaryUrl);
    } catch (cErr) {
      console.warn("[PDF Agent] Cloudinary upload skipped:", cErr.message);
    }
    const activeDownloadUrl = directDownloadUrl || cloudinaryUrl;
    const markdownSummary = `### 📄 Generated Document: **${docData.title || topic}**
${docData.subtitle ? `*${docData.subtitle}*\n` : ""}
📥 **[Download PDF Document](${activeDownloadUrl})**

---

${
  Array.isArray(docData.sections)
    ? docData.sections
        .map(
          (sec, i) =>
            `**${i + 1}. ${sec.heading}**\n` +
            (Array.isArray(sec.points)
              ? sec.points.map((p) => `- ${p}`).join("\n")
              : ""),
        )
        .join("\n\n")
    : ""
}`;

    return {
      ...state,
      aiResponse: markdownSummary,
      pdfUrl: activeDownloadUrl,
    };
  } catch (error) {
    console.error("[PDF Agent] Error generating PDF:", error);
    return {
      ...state,
      aiResponse: `❌ Error generating PDF: ${error.message}`,
    };
  }
};
