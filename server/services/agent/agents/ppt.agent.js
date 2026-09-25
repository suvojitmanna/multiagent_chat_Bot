import pptxgen from "pptxgenjs";
import path from "path";
import fs from "fs";
import { getGroq } from "../config/model.js";
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

const ACCENT_COLORS = [
  "4F46E5",
  "0284C7",
  "0D9488",
  "D97706",
  "7C3AED",
  "E11D48",
];

const normalizePoint = (item, index) => {
  if (typeof item === "object" && item !== null) {
    const rawTitle = item.title || item.heading || item.label || "";
    const rawDesc =
      item.desc ||
      item.description ||
      item.text ||
      item.content ||
      item.bullet ||
      "";
    if (rawTitle && rawDesc) {
      return { title: rawTitle.trim(), desc: rawDesc.trim() };
    }
    const combined = rawTitle || rawDesc || `Milestone ${index + 1}`;
    return normalizePoint(combined, index);
  }

  const text = String(item || "").trim();
  if (!text) {
    return {
      title: `Key Point ${index + 1}`,
      desc: "Important strategic milestone and key achievement.",
    };
  }

  const splitMatch = text.match(/^([^:\-–—]{3,35})[:\-–—]\s*(.+)$/);
  if (splitMatch) {
    return { title: splitMatch[1].trim(), desc: splitMatch[2].trim() };
  }
  const yearMatch = text.match(/^((?:19|20)\d{2}(?:-\d{2,4})?)\s+(.+)$/);
  if (yearMatch) {
    return { title: `Year ${yearMatch[1]}`, desc: yearMatch[2].trim() };
  }

  const words = text.split(/\s+/);
  if (words.length > 5) {
    const titleCandidate = words.slice(0, 3).join(" ");
    return { title: titleCandidate, desc: text };
  }

  return { title: `Point ${index + 1}`, desc: text };
};

const createPresentationBuffer = async (pptData) => {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE";
  pres.title = pptData.title || "Presentation";

  const now = new Date();
  const formattedTimestamp = now.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const rawSlides = Array.isArray(pptData.slides) ? pptData.slides : [];
  const totalSlides = rawSlides.length + 2;
  const titleSlide = pres.addSlide();
  titleSlide.background = { color: "0A0F1D" };

  titleSlide.addShape(pres.ShapeType.roundRect, {
    x: 8.5,
    y: -0.8,
    w: 5.5,
    h: 3.5,
    fill: { color: "1E1B4B" },
    line: { color: "312E81", width: 1 },
    rectRadius: 0.5,
  });

  titleSlide.addShape(pres.ShapeType.roundRect, {
    x: 1.2,
    y: 1.5,
    w: 2.9,
    h: 0.42,
    fill: { color: "1E1B4B" },
    line: { color: "4338CA", width: 1 },
    rectRadius: 0.2,
  });

  titleSlide.addText(
    pptData.category
      ? pptData.category.toUpperCase()
      : "EXECUTIVE PRESENTATION",
    {
      x: 1.2,
      y: 1.5,
      w: 2.9,
      h: 0.42,
      fontSize: 9.5,
      bold: true,
      color: "A5B4FC",
      align: "center",
      valign: "middle",
      fontFace: "Segoe UI",
    },
  );

  titleSlide.addText(pptData.title || "Executive Briefing", {
    x: 1.2,
    y: 2.15,
    w: 10.8,
    h: 1.35,
    fontSize: 38,
    fontFace: "Segoe UI",
    color: "FFFFFF",
    bold: true,
    valign: "top",
  });

  if (pptData.subtitle) {
    titleSlide.addText(pptData.subtitle, {
      x: 1.2,
      y: 3.65,
      w: 10.8,
      h: 0.85,
      fontSize: 17,
      fontFace: "Segoe UI",
      color: "94A3B8",
      valign: "top",
    });
  }

  titleSlide.addShape(pres.ShapeType.roundRect, {
    x: 1.2,
    y: 4.7,
    w: 1.8,
    h: 0.08,
    fill: { color: "6366F1" },
    line: { color: "6366F1" },
    rectRadius: 0.04,
  });

  titleSlide.addText(
    `Created by ShifraAI Team  •  Lead Developer: Suvojit Manna  •  ${formattedTimestamp}`,
    {
      x: 1.2,
      y: 6.25,
      w: 6.0,
      h: 0.4,
      fontSize: 10.5,
      fontFace: "Segoe UI",
      color: "64748B",
    },
  );

  titleSlide.addText("Confidential & Executive Briefing  •  16:9 Widescreen", {
    x: 7.2,
    y: 6.25,
    w: 4.9,
    h: 0.4,
    fontSize: 10,
    fontFace: "Segoe UI",
    color: "475569",
    align: "right",
  });

  rawSlides.forEach((slideItem, index) => {
    const slide = pres.addSlide();
    slide.background = { color: "F8FAFC" };

    const slideAccent = ACCENT_COLORS[index % ACCENT_COLORS.length];

    slide.addShape(pres.ShapeType.rect, {
      x: 0.8,
      y: 0.42,
      w: 0.08,
      h: 0.68,
      fill: { color: slideAccent },
      line: { color: slideAccent },
    });

    const categoryText = (
      slideItem.category ||
      (slideItem.title && slideItem.title.includes("&")
        ? slideItem.title.split("&")[0].trim()
        : "STRATEGIC OVERVIEW")
    ).toUpperCase();

    slide.addText(categoryText, {
      x: 1.05,
      y: 0.38,
      w: 10.0,
      h: 0.24,
      fontSize: 9.5,
      bold: true,
      color: slideAccent,
      fontFace: "Segoe UI",
    });

    slide.addText(slideItem.title || `Slide ${index + 1}`, {
      x: 1.05,
      y: 0.62,
      w: 10.5,
      h: 0.5,
      fontSize: 22,
      fontFace: "Segoe UI",
      bold: true,
      color: "0F172A",
    });

    slide.addShape(pres.ShapeType.line, {
      x: 0.8,
      y: 1.25,
      w: 11.73,
      h: 0,
      line: { color: "E2E8F0", width: 1 },
    });

    const rawPoints = Array.isArray(slideItem.points)
      ? slideItem.points
      : Array.isArray(slideItem.bullets)
        ? slideItem.bullets
        : [];

    const normalized = rawPoints.map((pt, pIdx) => normalizePoint(pt, pIdx));
    const pointCount = normalized.length;
    if (pointCount === 4) {
      const gridPositions = [
        { x: 0.8, y: 1.5, w: 5.7, h: 2.38 },
        { x: 6.83, y: 1.5, w: 5.7, h: 2.38 },
        { x: 0.8, y: 4.08, w: 5.7, h: 2.38 },
        { x: 6.83, y: 4.08, w: 5.7, h: 2.38 },
      ];

      normalized.forEach((pt, pIdx) => {
        const pos = gridPositions[pIdx];
        const cardAccent = ACCENT_COLORS[(index + pIdx) % ACCENT_COLORS.length];

        slide.addShape(pres.ShapeType.roundRect, {
          x: pos.x,
          y: pos.y,
          w: pos.w,
          h: pos.h,
          fill: { color: "FFFFFF" },
          line: { color: "E2E8F0", width: 1 },
          rectRadius: 0.08,
          shadow: {
            type: "outer",
            color: "0F172A",
            blur: 4,
            offset: 2,
            angle: 90,
            opacity: 0.05,
          },
        });

        slide.addShape(pres.ShapeType.roundRect, {
          x: pos.x,
          y: pos.y,
          w: pos.w,
          h: 0.07,
          fill: { color: cardAccent },
          line: { color: cardAccent },
          rectRadius: 0.03,
        });

        const numStr = `0${pIdx + 1}`;
        slide.addShape(pres.ShapeType.roundRect, {
          x: pos.x + 0.3,
          y: pos.y + 0.28,
          w: 0.55,
          h: 0.35,
          fill: { color: cardAccent },
          rectRadius: 0.06,
        });
        slide.addText(numStr, {
          x: pos.x + 0.3,
          y: pos.y + 0.28,
          w: 0.55,
          h: 0.35,
          fontSize: 11,
          bold: true,
          color: "FFFFFF",
          align: "center",
          valign: "middle",
          fontFace: "Segoe UI",
        });

        slide.addText(pt.title, {
          x: pos.x + 0.98,
          y: pos.y + 0.26,
          w: pos.w - 1.25,
          h: 0.38,
          fontSize: 13.5,
          bold: true,
          color: "0F172A",
          valign: "middle",
          fontFace: "Segoe UI",
        });

        slide.addText(pt.desc, {
          x: pos.x + 0.3,
          y: pos.y + 0.78,
          w: pos.w - 0.6,
          h: pos.h - 0.95,
          fontSize: 11.5,
          color: "475569",
          valign: "top",
          lineSpacing: 18,
          fontFace: "Segoe UI",
        });
      });
    } else if (pointCount === 3) {
      const colPositions = [
        { x: 0.8, y: 1.5, w: 3.7, h: 4.95 },
        { x: 4.81, y: 1.5, w: 3.7, h: 4.95 },
        { x: 8.83, y: 1.5, w: 3.7, h: 4.95 },
      ];

      normalized.forEach((pt, pIdx) => {
        const pos = colPositions[pIdx];
        const cardAccent = ACCENT_COLORS[(index + pIdx) % ACCENT_COLORS.length];

        slide.addShape(pres.ShapeType.roundRect, {
          x: pos.x,
          y: pos.y,
          w: pos.w,
          h: pos.h,
          fill: { color: "FFFFFF" },
          line: { color: "E2E8F0", width: 1 },
          rectRadius: 0.08,
          shadow: {
            type: "outer",
            color: "0F172A",
            blur: 4,
            offset: 2,
            angle: 90,
            opacity: 0.05,
          },
        });

        slide.addShape(pres.ShapeType.roundRect, {
          x: pos.x,
          y: pos.y,
          w: pos.w,
          h: 0.08,
          fill: { color: cardAccent },
          line: { color: cardAccent },
          rectRadius: 0.03,
        });

        const numStr = `0${pIdx + 1}`;
        slide.addShape(pres.ShapeType.roundRect, {
          x: pos.x + 0.3,
          y: pos.y + 0.35,
          w: 0.6,
          h: 0.38,
          fill: { color: cardAccent },
          rectRadius: 0.06,
        });
        slide.addText(numStr, {
          x: pos.x + 0.3,
          y: pos.y + 0.35,
          w: 0.6,
          h: 0.38,
          fontSize: 12,
          bold: true,
          color: "FFFFFF",
          align: "center",
          valign: "middle",
          fontFace: "Segoe UI",
        });

        slide.addText(pt.title, {
          x: pos.x + 0.3,
          y: pos.y + 0.9,
          w: pos.w - 0.6,
          h: 0.45,
          fontSize: 15,
          bold: true,
          color: "0F172A",
          valign: "middle",
          fontFace: "Segoe UI",
        });

        slide.addText(pt.desc, {
          x: pos.x + 0.3,
          y: pos.y + 1.45,
          w: pos.w - 0.6,
          h: 3.2,
          fontSize: 12,
          color: "475569",
          valign: "top",
          lineSpacing: 20,
          fontFace: "Segoe UI",
        });
      });
    } else if (pointCount === 2) {
      const colPositions = [
        { x: 0.8, y: 1.5, w: 5.7, h: 4.95 },
        { x: 6.83, y: 1.5, w: 5.7, h: 4.95 },
      ];

      normalized.forEach((pt, pIdx) => {
        const pos = colPositions[pIdx];
        const cardAccent = ACCENT_COLORS[(index + pIdx) % ACCENT_COLORS.length];

        slide.addShape(pres.ShapeType.roundRect, {
          x: pos.x,
          y: pos.y,
          w: pos.w,
          h: pos.h,
          fill: { color: "FFFFFF" },
          line: { color: "E2E8F0", width: 1 },
          rectRadius: 0.08,
          shadow: {
            type: "outer",
            color: "0F172A",
            blur: 4,
            offset: 2,
            angle: 90,
            opacity: 0.05,
          },
        });

        slide.addShape(pres.ShapeType.roundRect, {
          x: pos.x,
          y: pos.y,
          w: pos.w,
          h: 0.08,
          fill: { color: cardAccent },
          line: { color: cardAccent },
          rectRadius: 0.03,
        });

        const numStr = `0${pIdx + 1}`;
        slide.addShape(pres.ShapeType.roundRect, {
          x: pos.x + 0.35,
          y: pos.y + 0.35,
          w: 0.65,
          h: 0.4,
          fill: { color: cardAccent },
          rectRadius: 0.06,
        });
        slide.addText(numStr, {
          x: pos.x + 0.35,
          y: pos.y + 0.35,
          w: 0.65,
          h: 0.4,
          fontSize: 12,
          bold: true,
          color: "FFFFFF",
          align: "center",
          valign: "middle",
          fontFace: "Segoe UI",
        });

        slide.addText(pt.title, {
          x: pos.x + 0.35,
          y: pos.y + 0.95,
          w: pos.w - 0.7,
          h: 0.5,
          fontSize: 16,
          bold: true,
          color: "0F172A",
          valign: "middle",
          fontFace: "Segoe UI",
        });

        slide.addText(pt.desc, {
          x: pos.x + 0.35,
          y: pos.y + 1.6,
          w: pos.w - 0.7,
          h: 3.0,
          fontSize: 13,
          color: "475569",
          valign: "top",
          lineSpacing: 22,
          fontFace: "Segoe UI",
        });
      });
    } else {
      const rows = Math.ceil(pointCount / 2);
      const rowHeight = Math.min(1.55, 4.95 / rows - 0.15);

      normalized.forEach((pt, pIdx) => {
        const col = pIdx % 2;
        const row = Math.floor(pIdx / 2);
        const cardX = col === 0 ? 0.8 : 6.83;
        const cardY = 1.5 + row * (rowHeight + 0.15);
        const cardAccent = ACCENT_COLORS[(index + pIdx) % ACCENT_COLORS.length];

        slide.addShape(pres.ShapeType.roundRect, {
          x: cardX,
          y: cardY,
          w: 5.7,
          h: rowHeight,
          fill: { color: "FFFFFF" },
          line: { color: "E2E8F0", width: 1 },
          rectRadius: 0.06,
          shadow: {
            type: "outer",
            color: "0F172A",
            blur: 3,
            offset: 1.5,
            angle: 90,
            opacity: 0.04,
          },
        });

        slide.addShape(pres.ShapeType.roundRect, {
          x: cardX,
          y: cardY,
          w: 0.08,
          h: rowHeight,
          fill: { color: cardAccent },
          line: { color: cardAccent },
          rectRadius: 0.02,
        });

        const numStr = pIdx < 9 ? `0${pIdx + 1}` : `${pIdx + 1}`;
        slide.addText(numStr, {
          x: cardX + 0.2,
          y: cardY + 0.15,
          w: 0.45,
          h: 0.3,
          fontSize: 10,
          bold: true,
          color: cardAccent,
          fontFace: "Segoe UI",
        });

        slide.addText(pt.title, {
          x: cardX + 0.7,
          y: cardY + 0.15,
          w: 4.8,
          h: 0.3,
          fontSize: 12.5,
          bold: true,
          color: "0F172A",
          fontFace: "Segoe UI",
        });

        slide.addText(pt.desc, {
          x: cardX + 0.2,
          y: cardY + 0.5,
          w: 5.3,
          h: rowHeight - 0.6,
          fontSize: 10.5,
          color: "475569",
          lineSpacing: 15,
          valign: "top",
          fontFace: "Segoe UI",
        });
      });
    }

    slide.addShape(pres.ShapeType.line, {
      x: 0.8,
      y: 6.72,
      w: 11.73,
      h: 0,
      line: { color: "E2E8F0", width: 0.75 },
    });

    slide.addText(
      `Shifra AI Presentation  •  ${pptData.title || "Executive Deck"}`,
      {
        x: 0.8,
        y: 6.82,
        w: 7.0,
        h: 0.35,
        fontSize: 9.5,
        fontFace: "Segoe UI",
        color: "94A3B8",
      },
    );

    slide.addText(`Slide ${index + 2} of ${totalSlides}`, {
      x: 8.53,
      y: 6.82,
      w: 4.0,
      h: 0.35,
      fontSize: 9.5,
      fontFace: "Segoe UI",
      bold: true,
      color: "64748B",
      align: "right",
    });
  });

  const endSlide = pres.addSlide();
  endSlide.background = { color: "0A0F1D" };

  endSlide.addShape(pres.ShapeType.roundRect, {
    x: 5.16,
    y: 1.4,
    w: 3.0,
    h: 0.4,
    fill: { color: "1E1B4B" },
    line: { color: "4338CA", width: 1 },
    rectRadius: 0.2,
  });

  endSlide.addText("EXECUTIVE SUMMARY", {
    x: 5.16,
    y: 1.4,
    w: 3.0,
    h: 0.4,
    fontSize: 9.5,
    bold: true,
    color: "A5B4FC",
    align: "center",
    valign: "middle",
    fontFace: "Segoe UI",
  });

  endSlide.addText(pptData.title || "Summary & Discussion", {
    x: 1.0,
    y: 2.05,
    w: 11.33,
    h: 1.0,
    fontSize: 36,
    fontFace: "Segoe UI",
    color: "FFFFFF",
    bold: true,
    align: "center",
  });

  endSlide.addText(
    pptData.subtitle || "Key Takeaways, Strategic Implications & Next Steps",
    {
      x: 1.5,
      y: 3.15,
      w: 10.33,
      h: 0.8,
      fontSize: 16,
      fontFace: "Segoe UI",
      color: "94A3B8",
      align: "center",
    },
  );

  const summaryCards = [
    {
      title: "Strategic Vision",
      text: "Clear direction, high standards, and decisive execution.",
      color: "4F46E5",
    },
    {
      title: "Performance & Impact",
      text: "Transformative milestones establishing long-term excellence.",
      color: "0284C7",
    },
    {
      title: "Sustainable Legacy",
      text: "Enduring standards and cultural benchmarks for the future.",
      color: "0D9488",
    },
  ];

  summaryCards.forEach((sc, idx) => {
    const sx = 1.2 + idx * 3.8;
    endSlide.addShape(pres.ShapeType.roundRect, {
      x: sx,
      y: 4.2,
      w: 3.3,
      h: 1.65,
      fill: { color: "111827" },
      line: { color: "1F2937", width: 1 },
      rectRadius: 0.08,
    });

    endSlide.addShape(pres.ShapeType.roundRect, {
      x: sx,
      y: 4.2,
      w: 3.3,
      h: 0.06,
      fill: { color: sc.color },
      line: { color: sc.color },
      rectRadius: 0.03,
    });

    endSlide.addText(sc.title, {
      x: sx + 0.25,
      y: 4.35,
      w: 2.8,
      h: 0.35,
      fontSize: 13,
      bold: true,
      color: "FFFFFF",
      fontFace: "Segoe UI",
    });

    endSlide.addText(sc.text, {
      x: sx + 0.25,
      y: 4.75,
      w: 2.8,
      h: 0.95,
      fontSize: 11,
      color: "9CA3AF",
      lineSpacing: 16,
      fontFace: "Segoe UI",
    });
  });

  endSlide.addText(
    `Created by ShifraAI Team  •  Lead Developer: Suvojit Manna  •  ${formattedTimestamp}`,
    {
      x: 1.0,
      y: 6.55,
      w: 11.33,
      h: 0.4,
      fontSize: 10.5,
      fontFace: "Segoe UI",
      color: "64748B",
      align: "center",
    },
  );

  const buffer = await pres.write({ outputType: "nodebuffer" });
  return buffer;
};

export const pptGenAgent = async (state) => {
  console.log("--> Selected Agent: ppt");
  const topic = state.topic || state.prompt || "Presentation Overview";
  console.log("PPT agent received topic:", topic);

  try {
    const groq = getGroq();
    const prompt = `
You are a world-class executive presentation designer and strategic deck creator.

Generate a comprehensive, beautifully structured slide deck for the topic: "${topic}".

Do NOT return markdown.
Do NOT return explanations or conversational text.
Return ONLY valid, parseable JSON matching this exact structure:

{
  "title": "Presentation Title",
  "subtitle": "Inspiring, descriptive subtitle highlighting key theme",
  "category": "STRATEGIC ANALYSIS",
  "slides": [
    {
      "title": "Slide Title",
      "category": "SECTION OR THEME",
      "points": [
        {
          "title": "Short Punchy Title (2 to 5 words)",
          "desc": "Insightful, concise explanation detailing the milestone, metric, or strategic insight."
        },
        {
          "title": "Short Punchy Title (2 to 5 words)",
          "desc": "Insightful, concise explanation detailing the milestone, metric, or strategic insight."
        },
        {
          "title": "Short Punchy Title (2 to 5 words)",
          "desc": "Insightful, concise explanation detailing the milestone, metric, or strategic insight."
        },
        {
          "title": "Short Punchy Title (2 to 5 words)",
          "desc": "Insightful, concise explanation detailing the milestone, metric, or strategic insight."
        }
      ]
    }
  ]
}

Instructions:
- Provide between 5 to 7 rich, logical slides.
- Each slide MUST have 3 to 4 points.
- Each point MUST have both a punchy "title" and an informative "desc".
- Topic: ${topic}
    `;

    const res = await groq.invoke(prompt);
    const content = typeof res?.content === "string" ? res.content : "";
    const cleaned = cleanJson(content);

    let pptData;
    try {
      pptData = JSON.parse(cleaned);
    } catch (parseErr) {
      console.warn(
        "[PPT Agent] JSON parse failed, using fallback data:",
        parseErr.message,
      );
      pptData = {
        title: topic,
        subtitle: "Key Highlights & Strategic Analysis",
        category: "EXECUTIVE BRIEFING",
        slides: [
          {
            title: "Overview & Foundations",
            category: "STRATEGIC FOUNDATIONS",
            points: [
              {
                title: "Core Principles",
                desc: "Establishing foundational standards, key focus areas, and strategic intent.",
              },
              {
                title: "Strategic Relevance",
                desc: "Addressing high-priority objectives with disciplined and consistent execution.",
              },
              {
                title: "Implementation Milestones",
                desc: "Executing critical roadmap deliverables with measurable team benchmarks.",
              },
              {
                title: "Cultural Alignment",
                desc: "Instilling an uncompromising high-performance ethos and accountability.",
              },
            ],
          },
          {
            title: "Key Takeaways & Future Outlook",
            category: "OUTLOOK & ROADMAP",
            points: [
              {
                title: "Actionable Milestones",
                desc: "Prioritizing immediate next steps and high-leverage initiatives.",
              },
              {
                title: "Long-term Impact",
                desc: "Building sustainable value and setting enduring benchmarks.",
              },
              {
                title: "Strategic Recommendations",
                desc: "Synthesizing core lessons into an executive roadmap for continued excellence.",
              },
            ],
          },
        ],
      };
    }

    const pptBuffer = await createPresentationBuffer(pptData);

    const rawPrompt = (
      state.topic ||
      state.prompt ||
      pptData.title ||
      "presentation"
    ).trim();
    const trimmedSlug = rawPrompt
      .replace(
        /^(?:please\s+)?(?:create|generate|make|write|give\s+me)\s+(?:a\s+)?(?:ppt|presentation|slides|pptx)?\s*(?:about|on|for)?\s*/i,
        "",
      )
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "_")
      .replace(/_+/g, "_")
      .slice(0, 35)
      .replace(/^_+|_+$/g, "")
      .toLowerCase();

    const filename = `${trimmedSlug || "presentation"}.pptx`;
    const pptsDir = path.join(process.cwd(), "public", "ppts");
    if (!fs.existsSync(pptsDir)) {
      fs.mkdirSync(pptsDir, { recursive: true });
    }
    const localFilePath = path.join(pptsDir, filename);
    await fs.promises.writeFile(localFilePath, pptBuffer);

    const directDownloadUrl = `http://localhost:${process.env.PORT || 8003}/download-ppt/${filename}`;
    console.log("[PPT Agent] Direct Download URL:", directDownloadUrl);

    let cloudinaryUrl = "";
    try {
      console.log("[PPT Agent] Uploading PPTX to Cloudinary...");
      const cloudinaryResult = await uploadImageToCloudinary(pptBuffer, {
        folder: "ai_presentations",
        public_id: `${trimmedSlug || "ppt"}_${Date.now()}`,
        resource_type: "raw",
        format: "pptx",
      });
      cloudinaryUrl = cloudinaryResult.url;
      console.log("[PPT Agent] PPTX Cloudinary URL:", cloudinaryUrl);
    } catch (cErr) {
      console.warn("[PPT Agent] Cloudinary upload skipped:", cErr.message);
    }

    const activeDownloadUrl = directDownloadUrl || cloudinaryUrl;

    const slidesList = Array.isArray(pptData.slides)
      ? pptData.slides
          .map((s, i) => {
            const rawPts = Array.isArray(s.points)
              ? s.points
              : Array.isArray(s.bullets)
                ? s.bullets
                : [];
            const ptsText = rawPts
              .map((pt, pIdx) => {
                const norm = normalizePoint(pt, pIdx);
                return `- **${norm.title}**: ${norm.desc}`;
              })
              .join("\n");
            return `**Slide ${i + 1}: ${s.title}**\n${ptsText}`;
          })
          .join("\n\n")
      : "";

    const markdownSummary = `### 📊 Generated Presentation: **${pptData.title || topic}**
${pptData.subtitle ? `*${pptData.subtitle}*\n` : ""}
📥 **[Download PowerPoint Presentation](${activeDownloadUrl})**

---

${slidesList}`;

    return {
      ...state,
      aiResponse: markdownSummary,
      pptUrl: activeDownloadUrl,
    };
  } catch (error) {
    console.error("[PPT Agent] Error generating presentation:", error);
    return {
      ...state,
      aiResponse: `❌ Error generating presentation: ${error.message}`,
    };
  }
};
