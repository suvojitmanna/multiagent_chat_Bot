import api from "../../utils/axios";

export const createConversation = async () => {
    try {
        const { data } = await api.get("/api/chat/create-conversation");
        console.log(data);
        return data;
    } catch (err) {
        console.log(err);
        return []
    }
};
