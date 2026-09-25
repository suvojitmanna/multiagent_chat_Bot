import { StateGraph } from "@langchain/langgraph";
import { agentState } from "./state.js";
import { router } from "./router.js";
import { chatAgent } from "../agents/chat.agent.js";
import { searchGenAgent } from "../agents/search.agent.js";
import { imageGenAgent } from "../agents/image.agent.js";
import { pptGenAgent } from "../agents/ppt.agent.js";
import { pdfGenAgent } from "../agents/pdf.agent.js";
import { codingGenAgent } from "../agents/coding.agent.js";
import { pdfRag } from "../agents/pdfRag.agent.js";
import { imageAnalyzer } from "../agents/imageAnalyzer.agent.js";

const workFlow = new StateGraph(agentState);

workFlow.addNode("router", router);
workFlow.addNode("chat", chatAgent);
workFlow.addNode("search", searchGenAgent);
workFlow.addNode("image", imageGenAgent);
workFlow.addNode("ppt", pptGenAgent);
workFlow.addNode("pdf", pdfGenAgent);
workFlow.addNode("coding", codingGenAgent);
workFlow.addNode("pdfRag", pdfRag);
workFlow.addNode("imageAnalyzer", imageAnalyzer);

workFlow.addEdge("__start__", "router");
workFlow.addConditionalEdges(
  "router",
  (state) => {
    switch (state.agent) {
      case "chat":
        return "chat";
      case "search":
        return "search";
      case "image":
        return "image";
      case "ppt":
        return "ppt";
      case "pdf":
        return "pdf";
      case "coding":
        return "coding";
      case "pdfRag":
        return "pdfRag";
      case "imageAnalyzer":
        return "imageAnalyzer";
      default:
        return "chat";
    }
  },
  {
    chat: "chat",
    search: "search",
    image: "image",
    ppt: "ppt",
    pdf: "pdf",
    coding: "coding",
    pdfRag: "pdfRag",
    imageAnalyzer: "imageAnalyzer",
  },
);
workFlow.addEdge("search", "chat");
workFlow.addEdge("chat", "__end__");
workFlow.addEdge("coding", "__end__");
workFlow.addEdge("pdf", "__end__");
workFlow.addEdge("ppt", "__end__");
workFlow.addEdge("image", "__end__");
workFlow.addEdge("pdfRag", "__end__");
workFlow.addEdge("imageAnalyzer", "__end__");

export const graph = workFlow.compile();
