import { createSlice } from "@reduxjs/toolkit";

const messagesSlice = createSlice({
  name: "message",
  initialState: {
    messages: [],
    activeArtifact: null,
    visibleArtifact: null,
    isArtifactOpen: false,
  },
  reducers: {
    setMessages: (state, action) => {
      state.messages = Array.isArray(action.payload)
        ? action.payload
        : action.payload?.messages || [];
      state.visibleArtifact = null;
    },
    setActiveArtifact: (state, action) => {
      state.activeArtifact = action.payload;
      state.isArtifactOpen = true;
    },
    setVisibleArtifact: (state, action) => {
      state.visibleArtifact = action.payload;
    },
    clearVisibleArtifact: (state, action) => {
      if (!action.payload || state.visibleArtifact?.id === action.payload) {
        state.visibleArtifact = null;
      }
    },
    setArtifactOpen: (state, action) => {
      state.isArtifactOpen = action.payload;
    },
    toggleArtifactOpen: (state) => {
      state.isArtifactOpen = !state.isArtifactOpen;
    },
    clearActiveArtifact: (state) => {
      state.isArtifactOpen = false;
    },
  },
});

export const {
  setMessages,
  setActiveArtifact,
  setVisibleArtifact,
  clearVisibleArtifact,
  setArtifactOpen,
  toggleArtifactOpen,
  clearActiveArtifact,
} = messagesSlice.actions;
export default messagesSlice.reducer;
