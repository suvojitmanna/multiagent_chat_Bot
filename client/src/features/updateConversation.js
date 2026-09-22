import api from "../../utils/axios";

export const updateConversation = async (param1, param2) => {
  try {
    const id = typeof param1 === "object" ? param1?.id : param1;
    const title = typeof param1 === "object" ? param1?.title : param2;
    const { data } = await api.post("/api/chat/update-conversation", {
      id,
      title,
    });
    return data;
  } catch (err) {
    console.error("Error updating conversation:", err);
    return null;
  }
};
