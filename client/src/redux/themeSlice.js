import { createSlice } from "@reduxjs/toolkit";

const getSavedThemeMode = () => {
  if (typeof window === "undefined") return "system";
  try {
    const saved = localStorage.getItem("shifra_theme");
    if (saved === "light" || saved === "dark" || saved === "system") {
      return saved;
    }
    return "system";
  } catch {
    return "system";
  }
};

const getInitialIsDark = (mode) => {
  if (typeof window === "undefined") return true;
  if (mode === "dark") return true;
  if (mode === "light") return false;
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
};

const initialMode = getSavedThemeMode();

const themeSlice = createSlice({
  name: "theme",
  initialState: {
    themeMode: initialMode, // 'light' | 'dark' | 'system'
    isDark: getInitialIsDark(initialMode),
  },
  reducers: {
    setThemeMode: (state, action) => {
      const mode = action.payload;
      state.themeMode = mode;
      try {
        localStorage.setItem("shifra_theme", mode);
      } catch (e) {
        console.error("Failed to save theme in localStorage:", e);
      }
      state.isDark = getInitialIsDark(mode);
    },
    setIsDark: (state, action) => {
      state.isDark = Boolean(action.payload);
    },
  },
});

export const { setThemeMode, setIsDark } = themeSlice.actions;
export default themeSlice.reducer;
