import { createSlice } from "@reduxjs/toolkit";

const conversationSlice = createSlice({
  name: "conversation",
  initialState: {
    conversations: [],
    selectedConversation:null
  },
  reducers: {
    setConversations: (state, action) => {
      state.conversations = Array.isArray(action.payload)
        ? action.payload
        : action.payload?.conversations || [];
    },
    addConversation: (state, action) => {
      const newConv = action.payload?.conversation || action.payload;
      if (newConv) {
        state.conversations.unshift(newConv);
      }
    },
    setSelectedConversation: (state, action) => {
      state.selectedConversation = action.payload;
    },
  },
});

export const { setConversations, addConversation,setSelectedConversation } =
  conversationSlice.actions;
export default conversationSlice.reducer;
