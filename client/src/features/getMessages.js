import api from '../../utils/axios';

export const getMessages = async (conversationId) => {
  try {
    const { data } = await api.get(`/api/chat/get-messages/${conversationId}`);
    console.log(data);
    return data;
  } catch (err) {
    console.log(err);
    return []
  }
}