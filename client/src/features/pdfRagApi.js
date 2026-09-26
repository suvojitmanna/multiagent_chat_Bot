import api from "../../utils/axios";

export const uploadPdf = async (file, onProgress) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post("/api/pdf/upload", formData, {
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(percentCompleted);
      }
    },
  });

  return response.data;
};

export const getDocuments = async () => {
  const response = await api.get("/api/pdf");
  return response.data?.documents || [];
};


export const getDocumentDetails = async (documentId) => {
  const response = await api.get(`/api/pdf/${documentId}`);
  return response.data?.document || null;
};


export const getDocumentStatus = async (documentId) => {
  const response = await api.get(`/api/pdf/status/${documentId}`);
  return response.data?.status || null;
};


export const deleteDocument = async (documentId) => {
  const response = await api.delete(`/api/pdf/${documentId}`);
  return response.data;
};


export const chatPdf = async ({ documentId, conversationId, question }) => {
  const response = await api.post("/api/pdf/chat", {
    documentId,
    conversationId,
    question,
  });
  return response.data;
};


export const getPdfConversation = async (conversationId) => {
  const response = await api.get(`/api/pdf/conversation/${conversationId}`);
  return response.data?.messages || [];
};

export const deletePdfConversation = async (conversationId) => {
  const response = await api.delete(`/api/pdf/conversation/${conversationId}`);
  return response.data;
};
