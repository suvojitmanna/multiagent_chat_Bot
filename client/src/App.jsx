import React, { useEffect } from 'react'
import Home from "./pages/Home";
import getCurrentUser from './features/getCurrentUser';
import { useDispatch, useSelector } from 'react-redux'
import { setUserdata } from './redux/userSlice';
import { setIsDark } from './redux/themeSlice';

const App = () => {
  const dispatch = useDispatch()
  const themeMode = useSelector((state) => state.theme?.themeMode || "system")

  useEffect(() => {
    const getUser = async () => {
      const data = await getCurrentUser();
      dispatch(setUserdata(data))
    }
    getUser()
  }, [dispatch]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = () => {
      const isDark =
        themeMode === "dark" ||
        (themeMode === "system" && mediaQuery.matches);

      if (isDark) {
        document.documentElement.classList.add("dark");
        document.documentElement.classList.remove("light");
      } else {
        document.documentElement.classList.add("light");
        document.documentElement.classList.remove("dark");
      }
      document.documentElement.style.colorScheme = isDark ? "dark" : "light";
      dispatch(setIsDark(isDark));
    };

    applyTheme();

    if (themeMode === "system") {
      const handler = () => applyTheme();
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    }
  }, [themeMode, dispatch]);

  return (
    <div className="w-full h-full min-h-screen bg-slate-50 dark:bg-[#0d0f14] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <Home />
    </div>
  );
};

export default App;