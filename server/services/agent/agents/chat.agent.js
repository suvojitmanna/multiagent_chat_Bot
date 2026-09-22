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

  const systemPrompt = `You are Shifra Ai, an intelligent AI assistant.

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
