import { getModel } from "../config/model";

export const router = async (state) => {
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
  console.log(response);
  return {
    ...state,
    agent: response.content.trim().toLowerCase(),
  };
};
