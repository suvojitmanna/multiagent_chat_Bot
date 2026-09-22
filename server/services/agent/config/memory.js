import redis from "../../../redis.js";
import { getMessages } from "../utils/getMessages.js";

export const getMemory = async (conversationId) => {
  if (!conversationId) return [];
  const key = `messages-${conversationId}`;

  try {
    const cached = await redis.get(key);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) return parsed;
      if (Array.isArray(parsed?.messages)) return parsed.messages;
    }
  } catch (err) {
    console.error("Error reading memory from redis:", err.message);
  }

  const rawMessages = await getMessages(conversationId);
  const messages = Array.isArray(rawMessages)
    ? rawMessages
    : (Array.isArray(rawMessages?.messages) ? rawMessages.messages : []);

  try {
    await redis.set(key, JSON.stringify(messages), "EX", 24 * 60 * 60);
  } catch (err) {
    console.error("Error saving memory to redis:", err.message);
  }

  return messages;
};

export const addMessage = async (conversationId, role, content) => {
  if (!conversationId) return;
  const key = `messages-${conversationId}`;

  let messages = [];
  try {
    const rawMessages = await redis.get(key);
    if (rawMessages) {
      const parsed = JSON.parse(rawMessages);
      messages = Array.isArray(parsed)
        ? parsed
        : (Array.isArray(parsed?.messages) ? parsed.messages : []);
    } else {
      const dbMessages = await getMessages(conversationId);
      messages = Array.isArray(dbMessages) ? dbMessages : [];
    }
  } catch (err) {
    console.error("Error getting messages in addMessage:", err.message);
    messages = [];
  }

  messages.push({ role, content });

  if (messages.length > 20) {
    messages.shift();
  }

  try {
    await redis.set(key, JSON.stringify(messages), "EX", 24 * 60 * 60);
  } catch (err) {
    console.error("Error saving message in redis:", err.message);
  }
};
