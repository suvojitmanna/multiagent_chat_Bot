import api from "../../utils/axios";

export const sendMessage = async (payload) => {
  try {
    let body = payload;
    let config = {};

    if (payload?.file || payload?.files || payload instanceof FormData) {
      if (payload instanceof FormData) {
        body = payload;
      } else {
        const formData = new FormData();
        Object.keys(payload).forEach((key) => {
          if (key === "files" && Array.isArray(payload.files)) {
            payload.files.forEach((f) => formData.append("files", f));
          } else if (key === "file" && payload.file) {
            formData.append("file", payload.file);
          } else if (payload[key] !== undefined && payload[key] !== null) {
            formData.append(key, payload[key]);
          }
        });
        body = formData;
      }
    }

    const { data } = await api.post(`/api/agent/chat`, body);
    console.log(data);
    return data;
  } catch (err) {
    console.error("Error sending message:", err);
    return err.response?.data || { error: err.message };
  }
};
