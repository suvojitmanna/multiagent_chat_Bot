import { createSlice } from "@reduxjs/toolkit";

const messagesSlice = createSlice({
  name: "message",
  initialState: {
    messages: [],
    activeArtifact: null,
  },
  reducers: {
    setMessages: (state, action) => {
      state.messages = Array.isArray(action.payload)
        ? action.payload
        : action.payload?.messages || [];
    },
    setActiveArtifact: (state, action) => {
      state.activeArtifact = action.payload;
    },
    clearActiveArtifact: (state) => {
      state.activeArtifact = null;
    },
  },
});

export const { setMessages, setActiveArtifact, clearActiveArtifact } = messagesSlice.actions;
export default messagesSlice.reducer;
