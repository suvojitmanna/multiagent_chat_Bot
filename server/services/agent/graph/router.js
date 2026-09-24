import { getModel } from "../config/model.js";

export const router = async (state) => {
  if (state.agent && state.agent !== "auto") {
    console.log("--> Selected Agent (Direct Route):", state.agent);
    return {
      ...state,
      agent: state.agent,
    };
  }

  const promptText = (state.prompt || "").toLowerCase();
  if (
    /\b(generate|create|make|draw|paint|render|design)\b.*\b(image|picture|photo|wallpaper|artwork|art|illustration|drawing|portrait|sketch|avatar)\b/i.test(
      promptText
    ) ||
    /^(draw|paint|generate image|create image|ai image)\b/i.test(promptText)
  ) {
    console.log("--> Selected Agent (Pattern Match): image");
    return {
      ...state,
      agent: "image",
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
