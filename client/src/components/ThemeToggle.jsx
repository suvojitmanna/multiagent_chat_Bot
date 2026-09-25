import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon, Laptop, Check } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { setThemeMode } from "../redux/themeSlice";

const THEME_OPTIONS = [
  {
    id: "light",
    label: "Light",
    icon: Sun,
    description: "Clean & bright appearance",
  },
  {
    id: "dark",
    label: "Dark",
    icon: Moon,
    description: "Deep dark eye-friendly palette",
  },
  {
    id: "system",
    label: "System",
    icon: Laptop,
    description: "Matches your device setting",
  },
];

const ThemeToggle = ({ compact = false, align = "right" }) => {
  const dispatch = useDispatch();
  const themeMode = useSelector((state) => state.theme?.themeMode || "system");
  const isDark = useSelector((state) => state.theme?.isDark ?? true);
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const handleSelectMode = (mode) => {
    dispatch(setThemeMode(mode));
    setOpen(false);
  };

  const getButtonIcon = () => {
    if (themeMode === "system") {
      return <Laptop size={compact ? 14 : 15} />;
    }
    return isDark ? (
      <Moon size={compact ? 14 : 15} />
    ) : (
      <Sun size={compact ? 14 : 15} className="text-amber-500" />
    );
  };

  const dropdownAlignmentClass =
    align === "left"
      ? "left-0 origin-top-left"
      : align === "bottom-left"
      ? "bottom-full mb-2 left-0 origin-bottom-left"
      : "right-0 origin-top-right";

  return (
    <div className="relative inline-block" ref={containerRef}>
      <motion.button
        type="button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen((prev) => !prev)}
        className={`flex items-center justify-center rounded-xl transition-all cursor-pointer select-none ${
          compact
            ? "w-8 h-8 text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-white/[0.08]"
            : "px-2.5 py-1.5 gap-1.5 text-xs font-medium border text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border-slate-200 dark:text-slate-300 dark:hover:text-slate-100 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] dark:border-white/[0.08]"
        }`}
        title={`Theme: ${themeMode.charAt(0).toUpperCase() + themeMode.slice(1)}`}
        aria-label="Change theme"
        aria-expanded={open}
      >
        <span className="flex items-center justify-center">{getButtonIcon()}</span>
        {!compact && (
          <span className="capitalize hidden md:inline">
            {themeMode}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: align.startsWith("bottom") ? -6 : 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: align.startsWith("bottom") ? -6 : 6 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className={`absolute ${dropdownAlignmentClass} z-50 mt-1.5 w-52 rounded-2xl bg-white dark:bg-[#12141c] border border-slate-200 dark:border-white/[0.12] p-1.5 shadow-xl shadow-slate-200/50 dark:shadow-2xl dark:shadow-black/70 backdrop-blur-xl`}
          >
            <div className="px-2.5 py-1.5 text-[10.5px] font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
              Appearance
            </div>

            <div className="flex flex-col gap-0.5">
              {THEME_OPTIONS.map((item) => {
                const IconComponent = item.icon;
                const isSelected = themeMode === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectMode(item.id)}
                    className={`flex items-center gap-2.5 w-full px-2.5 py-2 rounded-xl text-left transition-colors cursor-pointer text-xs ${
                      isSelected
                        ? "bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 font-medium"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <div
                      className={`flex items-center justify-center w-6 h-6 rounded-lg ${
                        isSelected
                          ? "bg-indigo-500/20 text-indigo-600 dark:text-indigo-400"
                          : "text-slate-400 dark:text-slate-400"
                      }`}
                    >
                      <IconComponent size={14} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[12.5px] font-medium leading-none">
                          {item.label}
                        </span>
                        {isSelected && (
                          <Check
                            size={13}
                            className="text-indigo-600 dark:text-indigo-400 shrink-0"
                          />
                        )}
                      </div>
                      <span className="text-[10.5px] text-slate-400 dark:text-slate-500 block truncate mt-0.5">
                        {item.description}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ThemeToggle;
