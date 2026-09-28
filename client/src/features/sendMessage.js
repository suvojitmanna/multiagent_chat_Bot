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
    const data = err.response?.data;
    const status = err.response?.status;
    let errorMessage = "An unexpected error occurred. Please try again.";
    let errorTitle = "Request Failed";

    if (typeof data === "string") {
      errorMessage = data;
    } else if (data && typeof data === "object") {
      errorMessage = data.message || data.error || errorMessage;
      errorTitle = data.error || errorTitle;
    } else if (err.message) {
      errorMessage = err.message;
    }

    if (status === 429) {
      errorTitle = "Rate limit exceeded";
    } else if (status === 504) {
      errorTitle = "Gateway Timeout";
      errorMessage = "The server took too long to respond. Please try again in a few moments.";
    }

    return {
      error: errorTitle,
      message: errorMessage,
      statusCode: status,
      retryAfter: data?.retryAfter,
      agent: data?.agent,
      limit: data?.limit,
      remaining: data?.remaining,
      isRateLimit: status === 429 || String(errorTitle).toLowerCase().includes("rate limit"),
      raw: data,
    };
  }
};
