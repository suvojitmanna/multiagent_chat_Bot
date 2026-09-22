import axios from "axios";

export const getMessages = async (conversationId) => {
  if (!conversationId) return [];
  try {
    const { data } = await axios.get(
      `${process.env.CHAT_SERVICE}/get-messages/${conversationId}`,
    );
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.messages)) return data.messages;
    return [];
  } catch (error) {
    console.error("Error fetching messages:", error?.message || error);
    return [];
  }
};
