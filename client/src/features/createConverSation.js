import api from "../../utils/axios";

export const createConversation = async (param = {}) => {
  try {
    const title = typeof param === "string" ? param : param?.title;
    const url = title
      ? `/api/chat/create-conversation?title=${encodeURIComponent(title)}`
      : "/api/chat/create-conversation";
    const { data } = await api.get(url);
    return data;
  } catch (err) {
    console.error("Error creating conversation:", err);
    return null;
  }
};
