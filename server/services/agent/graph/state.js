import { Annotation } from "@langchain/langgraph";

export const agentState = Annotation.Root({
  prompt: Annotation(),
  aiResponse: Annotation(),
  agent: Annotation(),
  conversationId: Annotation(),
  searchResult: Annotation(),
  images: Annotation(),
  artifacts: Annotation(),
  pdfUrl: Annotation(),
  pptUrl: Annotation(),
  file: Annotation(),
});
