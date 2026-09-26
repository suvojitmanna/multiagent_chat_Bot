import { createSlice } from "@reduxjs/toolkit";

const uiSlice = createSlice({
  name: "ui",
  initialState: {
    pdfStudioOpen: false,
  },
  reducers: {
    setPdfStudioOpen: (state, action) => {
      state.pdfStudioOpen = action.payload;
    },
    togglePdfStudio: (state) => {
      state.pdfStudioOpen = !state.pdfStudioOpen;
    },
  },
});

export const { setPdfStudioOpen, togglePdfStudio } = uiSlice.actions;
export default uiSlice.reducer;
