import { getModel } from "../config/model.js";
import { getMemory } from "../config/memory.js";
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";

export const chatAgent = async (state) => {
  const llm = getModel("chat");

  const rawHistory = await getMemory(state.conversationId);
  const history = Array.isArray(rawHistory)
    ? rawHistory
    : Array.isArray(rawHistory?.messages)
      ? rawHistory.messages
      : [];

  const searchResultsData = state.searchResult || state.searchResults;
  const hasSearchResults = Array.isArray(searchResultsData)
    ? searchResultsData.length > 0
    : Boolean(searchResultsData);

  const searchContext = hasSearchResults
    ? Array.isArray(searchResultsData)
      ? `Web search results:\n${searchResultsData
          .map(
            (item, idx) =>
              `[${idx + 1}] ${item.title || "Source"} (${item.url || ""}):\n${item.content || ""}`,
          )
          .join(
            "\n\n",
          )}\n\nUse the above search results to provide an accurate, up-to-date answer. Cite sources if helpful. Do not mention internal tools.`
      : `Web search results:\n${JSON.stringify(searchResultsData, null, 2)}\n\nUse the search results to answer the query.`
    : ``;

  const systemPrompt = `You are ShifraAI, an intelligent conversational AI assistant.

  CRITICAL IDENTITY & CREATOR INSTRUCTION:
  - If the user asks who created you, who made you, who developed you, who is your developer, or who built you, you MUST ALWAYS clearly answer that you were created by the **ShifraAI Team** and **lead developer Suvojit Manna**.
  - Always credit the ShifraAI Team and lead developer Suvojit Manna whenever questioned about your origin, creation, or identity. Never claim to be made by any other company or developer.

  ${searchContext}

    Rules:
    - For simple questions, greetings,and short queries, respond naturally in plain text.
    - For technical, education, coding, or detailed topics, use clean markdown.
    
    Formatting:

    - Use # for titles and ## for subtitles.
    - Leave a blank line after headings.
    - use bullet points for lists.
    - use numbered list for step-by-step instructions.
    - Use backticks for code blocks.
    - use bold text for emphasis.
    - If you include any code, always wrap it in a markdown code block.

    Response Rules:
    - If the user asks for a simple greeting or small chitchat, respond naturally in a conversational tone.
    - If the user asks a technical, educational, coding, or detailed topic, use structured markdown.

    - If the user asks for a summary of recent events, give a brief overview with key points in bulleted format.
    - If you need to provide instructions, use numbered steps with clear, concise action items.
    - Never use emojis.
    - Keep responses professional and focused. 
    `;
  const messages = [new SystemMessage({ content: systemPrompt })];

  history.forEach((message) => {
    if (!message || !message.content) return;
    if (message.role === "user") {
      messages.push(new HumanMessage({ content: message.content }));
    } else {
      messages.push(new AIMessage({ content: message.content }));
    }
  });

  const lastMsg = history[history.length - 1];
  if (!lastMsg || lastMsg.role !== "user" || lastMsg.content !== state.prompt) {
    messages.push(new HumanMessage({ content: state.prompt }));
  }

  const response = await llm.invoke(messages);

  return {
    ...state,
    aiResponse: response.content,
  };
};
