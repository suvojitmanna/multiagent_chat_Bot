import { getModel } from "../config/model.js";

export const router = async (state) => {
  if (state.file?.mimetype === "application/pdf") {
    console.log("--> Selected Agent (File: PDF): pdfRag");
    return {
      ...state,
      agent: "pdfRag",
    };
  }

  if (state.file?.mimetype?.startsWith("image/")) {
    console.log("--> Selected Agent (File: Image): imageAnalyzer");
    return {
      ...state,
      agent: "imageAnalyzer",
    };
  }

  if (state.agent && state.agent !== "auto") {
    const directAgent =
      state.agent === "pdf" || state.agent === "pdfRag"
        ? "pdfRag"
        : state.agent;
    return {
      ...state,
      agent: directAgent,
    };
  }

  const promptText = (state.prompt || "").toLowerCase();

  if (
    /\b(who\s+(created|made|built|developed|programmed)\s+you|who\s+are\s+you|who\s+is\s+your\s+(creator|developer|maker|owner|author|founder)|tell\s+me\s+about\s+your\s+creator)\b/i.test(
      promptText,
    )
  ) {
    console.log("--> Selected Agent (Identity): chat");
    return {
      ...state,
      agent: "chat",
    };
  }

  if (
    /\b(generate|create|make|draw|paint|render|design)\b.*\b(image|picture|photo|wallpaper|artwork|art|illustration|drawing|portrait|sketch|avatar)\b/i.test(
      promptText,
    ) ||
    /^(draw|paint|generate image|create image|ai image)\b/i.test(promptText)
  ) {
    console.log("--> Selected Agent (Pattern Match): image");
    return {
      ...state,
      agent: "image",
    };
  }

  if (
    /\b(pdf|document|page\s*\d+|summarize\s+page|uploaded\s*(file|pdf|doc)|this\s*(file|pdf|doc))\b/i.test(promptText)
  ) {
    console.log("--> Selected Agent (Document Query): pdfRag");
    return {
      ...state,
      agent: "pdfRag",
    };
  }

  const llm = await getModel("router");
  const prompt = `You are an agent router.
    
    Available agents:
    - chat
    - search
    - image
    - ppt
    - pdf
    - coding
    
    Rules:

    chat:
    General conversation,
    explanations,
    learning,
    questions.

    search:
    Current events,
    latest information,
    news,
    recent developments,
    internet lookup.

    coding:
    Generate code,
    debug code,
    build projects,
    architecture,
    API design.

    pdf:
    Questions about generate PDFs
    or document context.

    ppt:
    Questions about generate PPTs
    or presentation context.

    image:
    Generate image from text description.
    Create digital art or visual content.

    Return ONLY one word:

    chat
    search
    pdf
    ppt
    coding
    image

    User Query:
    ${state.prompt}
    `;
  const response = await llm.invoke(prompt);
  const rawText = (
    typeof response?.content === "string" ? response.content : ""
  )
    .trim()
    .toLowerCase();
  const validAgents = ["chat", "search", "image", "ppt", "pdf", "coding"];
  const matchedAgent = validAgents.find((a) => rawText.includes(a)) || "chat";

  return {
    ...state,
    agent: matchedAgent,
  };
};
