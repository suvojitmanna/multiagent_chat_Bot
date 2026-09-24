import { getModel, getGemini, invokeWithFallback } from "../config/model.js";
import { getMemory } from "../config/memory.js";

const cleanJsonString = (str) => {
  if (!str) return "";
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

const extractFilesFromText = (text) => {
  const files = [];
  const codeBlockRegex =
    /```(?:([a-zA-Z0-9_\-+]+)\s+)?([a-zA-Z0-9_./\-]+)?\n([\s\S]*?)```/g;
  let match;
  let index = 1;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    const lang = (match[1] || "").toLowerCase();
    let filename = match[2] || "";
    const content = match[3] || "";

    if (!filename) {
      if (lang === "html") filename = "index.html";
      else if (lang === "css") filename = "style.css";
      else if (lang === "javascript" || lang === "js") filename = "script.js";
      else if (lang === "python" || lang === "py")
        filename = `script_${index}.py`;
      else if (lang === "json") filename = `data_${index}.json`;
      else filename = `file_${index}.${lang || "txt"}`;
    }

    if (!files.some((f) => f.name === filename)) {
      files.push({ name: filename, content: content.trim() });
      index++;
    }
  }

  return files;
};

export const codingGenAgent = async (state) => {
  try {
    const codingLlm = getModel("coding");
    let fallbackLlm;
    try {
      fallbackLlm = getGemini();
    } catch {
      fallbackLlm = getModel("chat");
    }

    const rawHistory = await getMemory(state.conversationId);
    const history = Array.isArray(rawHistory)
      ? rawHistory
      : Array.isArray(rawHistory?.messages)
        ? rawHistory.messages
        : [];

    const recentHistory = history
      .slice(-4)
      .map(
        (m) =>
          `${m.role === "user" ? "User" : "Assistant"}: ${typeof m.content === "string" ? m.content.slice(0, 400) : ""}`,
      )
      .join("\n\n");

    const promptText = (state.prompt || "").trim();

    const isProjectRequest =
      /\b(create|build|make|generate|design|code)\b.*\b(game|app|website|page|calculator|clone|dashboard|portfolio|tool|project|widget|component|todo|ui|frontend)\b/i.test(
        promptText,
      ) ||
      /\b(html\s*,\s*css|html\s+and\s+css|html\/css|in\s+html)\b/i.test(
        promptText,
      ) ||
      /\b(snake|tetris|pong|flappy|tictactoe|tic-tac-toe|stopwatch|weather\s+app|clock)\b/i.test(
        promptText,
      );

    if (isProjectRequest) {
      const projectPrompt = `You are ShifraAI, an elite Senior Full-Stack Engineer and Creative Developer.

The user wants to build an interactive web project or application.

User Request: "${promptText}"
${recentHistory ? `Recent Context:\n${recentHistory}\n` : ""}

Generate a complete, fully functional, modern, responsive project (typically index.html, style.css, script.js).

Standards for the code:
1. Modern CSS: Sleek dark theme, vibrant accents, flexbox/grid, smooth animations, glassmorphism, responsive for mobile & desktop.
2. Robust JavaScript: Clean, modular, error-handled, interactive, and completely working.
3. Accessible & Semantic HTML5 with high aesthetic polish.
4. If a game or interactive tool: include scoring, controls, restart options, sound synthesis or visual effects if appropriate.
5. Always use real, publicly accessible images from Unsplash when images are needed.
6. Use direct Unsplash image URLs in the format https://images.unsplash.com/... whenever possible.
7. Images must be relevant to the project's content and should look realistic and professional.
8. For multiple cards, products, destinations, articles, profiles, or gallery items, use different relevant Unsplash images instead of repeating one image.
9. Never use placeholder images, dummy image URLs, broken image URLs, local image paths, base64 images, or generic placeholder services.
10. Make sure every referenced image URL can be loaded directly by the browser without requiring a local file.

Return ONLY a valid JSON object without surrounding commentary.

Structure:
{
  "title": "Short descriptive title of the project",
  "overview": "A clear, professional markdown explanation describing what was built, how the architecture works, how to use it, and key features included.",
  "files": [
    {
      "name": "index.html",
      "content": "..."
    },
    {
      "name": "style.css",
      "content": "..."
    },
    {
      "name": "script.js",
      "content": "..."
    }
  ]
}

Important Rules:
- Return ONLY valid JSON.
- Do NOT wrap in markdown fences.
- Include the complete code for every file; do NOT leave placeholders or TODOs.
- Always use real Unsplash images when the project requires images.
- Never invent or fabricate image URLs.
`;

      let projectRes;
      try {
        projectRes = await invokeWithFallback(
          codingLlm,
          fallbackLlm,
          projectPrompt,
        );
      } catch (err) {
        console.error("Project generation LLM error:", err);
      }

      if (projectRes?.content) {
        const rawContent = projectRes.content;
        let parsed = null;

        try {
          const cleaned = cleanJsonString(rawContent);
          parsed = JSON.parse(cleaned);
        } catch {
          console.warn(
            "JSON parsing of project failed, trying fallback extraction",
          );
        }

        const resolveProjectTitle = (
          parsedTitle,
          files = [],
          promptText = "",
        ) => {
          if (
            parsedTitle &&
            parsedTitle.trim() &&
            ![
              "interactive project",
              "project",
              "web project",
              "generated web project",
            ].includes(parsedTitle.trim().toLowerCase())
          ) {
            return parsedTitle.trim();
          }

          const htmlFile = files.find((f) =>
            f.name?.toLowerCase().endsWith(".html"),
          );
          if (htmlFile?.content) {
            const match = /<title>(.*?)<\/title>/i.exec(htmlFile.content);
            if (match && match[1]?.trim()) {
              const cleanTitle = match[1].trim();
              if (
                !["document", "untitled", "index"].includes(
                  cleanTitle.toLowerCase(),
                )
              ) {
                return cleanTitle;
              }
            }
          }

          if (promptText) {
            const clean = promptText
              .replace(
                /\b(create|build|make|generate|code|design|write|a|an|the|in|html|css|js|javascript|using)\b/gi,
                " ",
              )
              .replace(/\s+/g, " ")
              .trim();
            if (clean.length > 2 && clean.length < 35) {
              return clean
                .split(" ")
                .map(
                  (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(),
                )
                .join(" ");
            }
          }

          return parsedTitle?.trim() || "Web Project";
        };

        if (parsed && Array.isArray(parsed.files) && parsed.files.length > 0) {
          const projectTitle = resolveProjectTitle(
            parsed.title,
            parsed.files,
            promptText,
          );
          const overviewText =
            parsed.overview ||
            `### 🚀 ${projectTitle}\n\nI have generated a complete, interactive project with **${parsed.files.length} files** (${parsed.files.map((f) => `\`${f.name}\``).join(", ")}).\n\nYou can interact with the live preview directly in the Artifacts tab or inspect the source code.`;

          return {
            ...state,
            aiResponse: overviewText,
            artifacts: [
              {
                id: Date.now().toString(),
                type: "Project",
                title: projectTitle,
                files: parsed.files,
              },
            ],
          };
        }

        const extractedFiles = extractFilesFromText(rawContent);
        if (extractedFiles.length > 0) {
          const projectTitle = resolveProjectTitle(
            "",
            extractedFiles,
            promptText,
          );
          return {
            ...state,
            aiResponse: `### 🚀 ${projectTitle}\n\nI have generated the project files for you. You can preview them or copy the code from the Artifact panel.\n\n${rawContent}`,
            artifacts: [
              {
                id: Date.now().toString(),
                type: "Project",
                title: projectTitle,
                files: extractedFiles,
              },
            ],
          };
        }
      }
    }

    const generalCodingPrompt = `You are ShifraAI, an expert Senior Principal Software Engineer and Coding Specialist.

Provide an exceptionally clear, robust, and professional solution to the user's request.

User Request:
${promptText}

${recentHistory ? `Recent Conversation Context:\n${recentHistory}\n` : ""}

Guidelines for your response:
1. **Direct Solution**: Deliver production-grade, clean, fully working code immediately.
2. **Proper Formatting**: Always use appropriate Markdown code blocks with exact language identifiers (e.g., \`\`\`python, \`\`\`javascript, \`\`\`typescript, \`\`\`cpp, \`\`\`go, \`\`\`sql, \`\`\`bash, etc.).
3. **In-depth Explanation**: Explain how the solution works step-by-step, key design decisions, and underlying concepts.
4. **Best Practices & Edge Cases**: Address potential edge cases, error handling, performance considerations, and complexity analysis (Time & Space complexity, O(N)) when relevant.
5. **How to Run/Test**: Include clear instructions or examples showing how to run and test the code with sample inputs and outputs.
6. **Tone**: Helpful, authoritative, and concise. Avoid fluff or generic boilerplate.
`;

    const res = await invokeWithFallback(
      codingLlm,
      fallbackLlm,
      generalCodingPrompt,
    );
    const answer = res?.content || "No response generated. Please try again.";

    const extractedFiles = extractFilesFromText(answer);
    const hasMultipleFiles = extractedFiles.length >= 2;

    return {
      ...state,
      aiResponse: answer,
      artifacts: hasMultipleFiles
        ? [
            {
              id: Date.now().toString(),
              type: "Code",
              title: "Code Files",
              files: extractedFiles,
            },
          ]
        : [],
    };
  } catch (error) {
    return {
      ...state,
      aiResponse: `I encountered an issue processing your coding request: ${error.message}. Please try rephrasing or asking again.`,
      artifacts: [],
    };
  }
};
