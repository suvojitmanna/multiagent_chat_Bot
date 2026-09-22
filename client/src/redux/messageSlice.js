import { createSlice } from "@reduxjs/toolkit";

const messagesSlice = createSlice({
  name: "message",
  initialState: {
    messages: [],
  },
  reducers: {
    setMessages: (state, action) => {
      state.messages = Array.isArray(action.payload)
        ? action.payload
        : action.payload?.messages || [];
    },
  },
});

export const { setMessages } = messagesSlice.actions;
export default messagesSlice.reducer;
