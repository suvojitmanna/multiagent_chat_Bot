import api from "../../utils/axios";

export const deleteConversation = async (id) => {
  try {
    const { data } = await api.delete(`/api/chat/delete-conversation/${id}`);
    return data;
  } catch (err) {
    console.error("Error deleting conversation:", err);
    return null;
  }
};
