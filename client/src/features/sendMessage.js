import api from "../../utils/axios";

export const sendMessage = async (payload) => {
  try {
    const { data } = await api.post(`/api/agent/chat`, payload);
    console.log(data);
    return data;
  } catch (err) {
    console.log(err);
    return [];
  }
};
