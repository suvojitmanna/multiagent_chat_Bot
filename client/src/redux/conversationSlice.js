import { createSlice } from "@reduxjs/toolkit";

const loadSavedConversation = () => {
  if (typeof window === "undefined") return null;
  try {
    const saved = sessionStorage.getItem("activeConversation");
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    if (parsed && typeof parsed === "object" && parsed._id) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
};

const conversationSlice = createSlice({
  name: "conversation",
  initialState: {
    conversations: [],
    selectedConversation: loadSavedConversation(),
  },
  reducers: {
    setConversations: (state, action) => {
      const list = Array.isArray(action.payload)
        ? action.payload
        : action.payload?.conversations || [];
      state.conversations = list;

      if (
        state.selectedConversation?._id &&
        Array.isArray(list) &&
        list.length > 0
      ) {
        const found = list.find(
          (c) => c?._id === state.selectedConversation._id,
        );
        if (found) {
          state.selectedConversation = found;
          try {
            sessionStorage.setItem("activeConversation", JSON.stringify(found));
          } catch {}
        }
      }
    },
    addConversation: (state, action) => {
      const newConv = action.payload?.conversation || action.payload;
      if (newConv) {
        state.conversations.unshift(newConv);
      }
    },
    setSelectedConversation: (state, action) => {
      state.selectedConversation = action.payload;
      try {
        if (action.payload && action.payload._id) {
          sessionStorage.setItem(
            "activeConversation",
            JSON.stringify(action.payload),
          );
        } else {
          sessionStorage.removeItem("activeConversation");
        }
      } catch (e) {
        console.error("Failed to update sessionStorage:", e);
      }
    },
    removeConversation: (state, action) => {
      const idToDelete = action.payload;
      state.conversations = state.conversations.filter(
        (c) => c?._id !== idToDelete,
      );
      if (state.selectedConversation?._id === idToDelete) {
        state.selectedConversation = null;
        try {
          sessionStorage.removeItem("activeConversation");
        } catch {}
      }
    },
    updateConversationTitle: (state, action) => {
      const { id, title } = action.payload || {};
      if (!id || !title) return;
      const conv = state.conversations.find((c) => c?._id === id);
      if (conv) {
        conv.title = title;
      }
      if (state.selectedConversation?._id === id) {
        state.selectedConversation = {
          ...state.selectedConversation,
          title,
        };
        try {
          sessionStorage.setItem(
            "activeConversation",
            JSON.stringify(state.selectedConversation),
          );
        } catch {}
      }
    },
  },
});

export const {
  setConversations,
  addConversation,
  setSelectedConversation,
  removeConversation,
  updateConversationTitle,
} = conversationSlice.actions;
export default conversationSlice.reducer;
