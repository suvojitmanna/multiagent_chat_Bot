import { createSlice } from "@reduxjs/toolkit";

const userSlice = createSlice({
  name: "user",
  initialState: {
    userData: null,
  },
  reducers: {
    setUserdata: (state, action) => {
      state.userData = action.payload;
    },
    updateCredits: (state, action) => {
      if (state.userData) {
        state.userData = {
          ...state.userData,
          credits: action.payload,
        };
      }
    },
  },
});

export const { setUserdata, updateCredits } = userSlice.actions;
export default userSlice.reducer;
