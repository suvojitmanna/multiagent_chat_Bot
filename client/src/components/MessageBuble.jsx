import React, { useState, useEffect, useRef, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setActiveArtifact, setVisibleArtifact, clearVisibleArtifact, setArtifactOpen } from "../redux/messageSlice";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Sparkles, Copy, Check, Brain, Loader2, Zap, Image as ImageIcon, ExternalLink, X, Play, FolderCode, FileCode, Code2, FileText, Presentation, ChevronLeft, ChevronRight, Download, Layers, List } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import oneDark from "react-syntax-highlighter/dist/esm/styles/prism/one-dark.js";
import oneLight from "react-syntax-highlighter/dist/esm/styles/prism/one-light.js";

const THINKING_PHASES = [
  {
    title: "Analyzing query & intent",
    detail: "Deconstructing prompt context",
    icon: Zap,
  },
  {
    title: "Thinking & reasoning",
    detail: "Formulating multi-agent strategy",
    icon: Brain,
  },
  {
    title: "Evaluating knowledge & context",
    detail: "Synthesizing optimal solution",
    icon: Sparkles,
  },
  {
    title: "Generating response",
    detail: "Drafting structured answer",
    icon: Loader2,
  },
];

const ThinkingIndicator = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    const stepTimer = setInterval(() => {
      setCurrentStep((prev) => (prev < THINKING_PHASES.length - 1 ? prev + 1 : prev));
    }, 2200);

    return () => {
      clearInterval(timer);
      clearInterval(stepTimer);
    };
  }, []);

  const getStatusLabel = () => {
    switch (currentStep) {
      case 0:
        return "Analyzing query...";
      case 1:
        return "Thinking & reasoning...";
      case 2:
        return "Evaluating context...";
      case 3:
      default:
        return "Generating response...";
    }
  };

  return (
    <div className="flex flex-col gap-2.5 py-1 w-full max-w-lg transition-all duration-200">

      <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/[0.08] border border-indigo-200 dark:border-indigo-500/20 w-fit backdrop-blur-xs">
        <div className="relative flex items-center justify-center w-4 h-4 text-indigo-500 dark:text-indigo-400">
          <Brain size={13} className="animate-pulse text-indigo-500 dark:text-indigo-400" />
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <span className="font-semibold text-indigo-600 dark:text-indigo-300">
            {getStatusLabel()}
          </span>
          <span className="text-[11px] font-mono text-indigo-500/80 dark:text-indigo-400/70">
            ({seconds}s)
          </span>
        </div>

        <span className="w-1 h-1 rounded-full bg-indigo-400/30" />

        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400 animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400 animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400 animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5 pl-1.5 sm:pl-2">
        {THINKING_PHASES.map((phase, index) => {
          const isDone = index < currentStep;
          const isCurrent = index === currentStep;

          return (
            <div
              key={index}
              className={`flex items-center gap-2.5 text-xs transition-all duration-300 ${isCurrent
                ? "text-slate-800 dark:text-slate-200 font-medium translate-x-0.5"
                : isDone
                  ? "text-slate-500 opacity-60"
                  : "text-slate-400 dark:text-slate-600 opacity-40"
                }`}
            >
              <div className="shrink-0 flex items-center justify-center w-3.5 h-3.5">
                {isDone ? (
                  <Check size={12} className="text-emerald-500 dark:text-emerald-400" />
                ) : isCurrent ? (
                  <Loader2 size={12} className="animate-spin text-indigo-500 dark:text-indigo-400" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                )}
              </div>

              <div className="flex items-baseline gap-1.5 truncate">
                <span className={isCurrent ? "text-indigo-600 dark:text-indigo-200 font-medium" : ""}>
                  {phase.title}
                </span>
                {isCurrent && (
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal hidden sm:inline">
                    — {phase.detail}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const formatContent = (val) => {
  if (val === null || val === undefined) return "";
  if (Array.isArray(val)) {
    const hasTextBlocks = val.some((item) => item && typeof item === "object" && (item.text || item.content));
    if (hasTextBlocks) {
      return val
        .map((item) => {
          if (typeof item === "string") return item;
          if (item && typeof item === "object") {
            if (item.text) return item.text;
            if (item.content) return formatContent(item.content);
          }
          return formatContent(item);
        })
        .filter(Boolean)
        .join("\n\n");
    }
  }
  if (typeof val === "object") {
    if (val.response) return formatContent(val.response);
    if (val.content) return formatContent(val.content);
    if (val.text) return formatContent(val.text);
    if (val.message && typeof val.message === "string") return val.message;
    if (val.error) return `Error: ${val.error}`;
    try {
      return JSON.stringify(val, null, 2);
    } catch {
      return String(val);
    }
  }
  if (typeof val === "string") {
    const trimmed = val.trim();
    if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed && typeof parsed === "object") {
          return formatContent(parsed);
        }
      } catch {
      }
    }
    return val;
  }
  return String(val);
};

const LANGUAGE_CONFIG = {
  javascript: { label: "JavaScript", dot: "bg-amber-400", badge: "text-amber-300 bg-amber-500/10 border-amber-500/25" },
  js: { label: "JavaScript", dot: "bg-amber-400", badge: "text-amber-300 bg-amber-500/10 border-amber-500/25" },
  jsx: { label: "React JSX", dot: "bg-cyan-400", badge: "text-cyan-300 bg-cyan-500/10 border-cyan-500/25" },
  typescript: { label: "TypeScript", dot: "bg-blue-400", badge: "text-blue-300 bg-blue-500/10 border-blue-500/25" },
  ts: { label: "TypeScript", dot: "bg-blue-400", badge: "text-blue-300 bg-blue-500/10 border-blue-500/25" },
  tsx: { label: "React TSX", dot: "bg-sky-400", badge: "text-sky-300 bg-sky-500/10 border-sky-500/25" },
  python: { label: "Python", dot: "bg-emerald-400", badge: "text-emerald-300 bg-emerald-500/10 border-emerald-500/25" },
  py: { label: "Python", dot: "bg-emerald-400", badge: "text-emerald-300 bg-emerald-500/10 border-emerald-500/25" },
  html: { label: "HTML", dot: "bg-orange-400", badge: "text-orange-300 bg-orange-500/10 border-orange-500/25" },
  css: { label: "CSS", dot: "bg-pink-400", badge: "text-pink-300 bg-pink-500/10 border-pink-500/25" },
  scss: { label: "SCSS", dot: "bg-pink-400", badge: "text-pink-300 bg-pink-500/10 border-pink-500/25" },
  json: { label: "JSON", dot: "bg-purple-400", badge: "text-purple-300 bg-purple-500/10 border-purple-500/25" },
  bash: { label: "Bash", dot: "bg-emerald-400", badge: "text-emerald-300 bg-emerald-500/10 border-emerald-500/25" },
  sh: { label: "Shell", dot: "bg-emerald-400", badge: "text-emerald-300 bg-emerald-500/10 border-emerald-500/25" },
  sql: { label: "SQL", dot: "bg-sky-400", badge: "text-sky-300 bg-sky-500/10 border-sky-500/25" },
  rust: { label: "Rust", dot: "bg-rose-400", badge: "text-rose-300 bg-rose-500/10 border-rose-500/25" },
  go: { label: "Go", dot: "bg-cyan-400", badge: "text-cyan-300 bg-cyan-500/10 border-cyan-500/25" },
  java: { label: "Java", dot: "bg-red-400", badge: "text-red-300 bg-red-500/10 border-red-500/25" },
  cpp: { label: "C++", dot: "bg-blue-400", badge: "text-blue-300 bg-blue-500/10 border-blue-500/25" },
  c: { label: "C", dot: "bg-slate-400", badge: "text-slate-300 bg-slate-500/10 border-slate-500/25" },
};

const NORMALIZE_LANG = {
  js: "javascript",
  jsx: "jsx",
  ts: "typescript",
  tsx: "tsx",
  py: "python",
  sh: "bash",
  shell: "bash",
  zsh: "bash",
  yml: "yaml",
  md: "markdown",
};

const CodeBlock = ({ language, value }) => {
  const dispatch = useDispatch();
  const isDark = useSelector((state) => state.theme?.isDark ?? true);
  const [copied, setCopied] = useState(false);
  const rawLang = (language || "").toLowerCase().trim();
  const highlightLang = NORMALIZE_LANG[rawLang] || rawLang || "javascript";
  const langConfig = LANGUAGE_CONFIG[rawLang] || {
    label: language ? language.toUpperCase() : "CODE",
    dot: "bg-indigo-400",
    badge: "text-indigo-500 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/25",
  };

  const lineCount = (value || "").split("\n").length;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  const handleOpenInMonaco = () => {
    const extMap = {
      javascript: "js",
      typescript: "ts",
      python: "py",
      html: "html",
      css: "css",
      json: "json",
      sql: "sql",
      bash: "sh",
      shell: "sh",
      cpp: "cpp",
      c: "c",
      java: "java",
      markdown: "md",
      rust: "rs",
      go: "go",
    };
    const ext = extMap[highlightLang] || highlightLang || "txt";
    dispatch(
      setActiveArtifact({
        title: `${langConfig.label} Snippet`,
        files: [{ name: `snippet.${ext}`, content: value }],
      })
    );
    dispatch(setArtifactOpen(true));
  };

  return (
    <div className="my-3.5 rounded-2xl overflow-hidden border border-slate-200 dark:border-white/[0.1] shadow-xl bg-slate-50 dark:bg-[#090b11] transition-all duration-200">
      <div className="flex items-center justify-between px-3.5 py-2 bg-slate-100 dark:bg-[#0e111a] border-b border-slate-200 dark:border-white/[0.08] select-none">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 mr-1.5 opacity-70">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]/80" />
          </div>

          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${langConfig.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${langConfig.dot}`} />
            <span className="tracking-wider uppercase font-mono">{langConfig.label}</span>
          </div>

          <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
            {lineCount} {lineCount === 1 ? "line" : "lines"}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.94 }}
            onClick={handleOpenInMonaco}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/25 text-indigo-600 dark:text-indigo-300 hover:text-indigo-700 dark:hover:text-indigo-200 transition-colors cursor-pointer text-[11.5px] font-medium"
            title="Open and edit in Monaco Editor"
          >
            <Code2 size={12} className="text-indigo-500 dark:text-indigo-400" />
            <span className="hidden sm:inline">View Or Edit</span>
            <span className="sm:hidden">View Or Edit</span>
          </motion.button>

          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.94 }}
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-white/[0.04] hover:bg-slate-100 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/[0.06] hover:border-slate-300 dark:hover:border-white/[0.12] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors cursor-pointer text-[11.5px] font-medium"
            title="Copy code to clipboard"
          >
            {copied ? (
              <>
                <Check size={12} className="text-emerald-500 dark:text-emerald-400" />
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <Copy size={12} />
                <span>Copy</span>
              </>
            )}
          </motion.button>
        </div>
      </div>

      <div className="overflow-x-auto text-[13px] leading-relaxed [scrollbar-width:thin] bg-slate-50 dark:bg-[#090b11]">
        <SyntaxHighlighter
          language={highlightLang}
          style={isDark ? oneDark : oneLight}
          showLineNumbers={true}
          wrapLongLines={false}
          customStyle={{
            margin: 0,
            padding: "0.85rem 1rem",
            background: "transparent",
            fontSize: "13px",
            lineHeight: "1.65",
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          }}
          lineNumberStyle={{
            minWidth: "2.5em",
            paddingRight: "1em",
            color: isDark ? "#64748b" : "#94a3b8",
            textAlign: "right",
            userSelect: "none",
            borderRight: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid rgba(0, 0, 0, 0.08)",
            marginRight: "1em",
          }}
          codeTagProps={{
            style: {
              fontFamily: "inherit",
            },
          }}
        >
          {value || ""}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

const getArtifactTitle = (art, content = "") => {
  if (
    art?.title &&
    art.title.trim() &&
    !["interactive project", "project", "web project", "generated web project"].includes(
      art.title.trim().toLowerCase()
    )
  ) {
    return art.title.trim();
  }

  const htmlFile = art?.files?.find((f) => f.name?.toLowerCase().endsWith(".html"));
  if (htmlFile?.content) {
    const match = /<title>(.*?)<\/title>/i.exec(htmlFile.content);
    if (match && match[1]?.trim()) {
      const title = match[1].trim();
      if (!["document", "untitled", "index", "my project"].includes(title.toLowerCase())) {
        return title;
      }
    }
  }

  if (content && typeof content === "string") {
    const headingMatch = /^#{1,3}\s+(?:[^\w\s]+\s+)?([^\n#]+)/m.exec(content);
    if (headingMatch && headingMatch[1]?.trim()) {
      const heading = headingMatch[1].trim();
      if (!["overview", "interactive web project", "project"].includes(heading.toLowerCase())) {
        return heading;
      }
    }
  }

  const specificFile = art?.files?.find(
    (f) => f.name && !["index.html", "style.css", "script.js"].includes(f.name.toLowerCase())
  );
  if (specificFile) {
    return specificFile.name.replace(/\.[^/.]+$/, "");
  }

  return art?.title || "Interactive Project";
};

const parsePresentationData = (content) => {
  if (!content || typeof content !== "string") return null;
  const hasMarker =
    content.includes("Generated Presentation") ||
    content.includes("download-ppt") ||
    content.includes(".pptx");
  if (!hasMarker) return null;

  const titleMatch = content.match(
    /###\s*(?:[^\w\s]+\s*)?Generated Presentation:\s*\*\*([^*]+)\*\*/i
  );
  const title = titleMatch ? titleMatch[1].trim() : "Presentation Deck";

  const subtitleMatch = content.match(/\n\*([^*\n]+)\*\s*\n/);
  const subtitle = subtitleMatch ? subtitleMatch[1].trim() : "";

  const linkMatch =
    content.match(/\[([^\]]*PowerPoint[^\]]*)\]\((https?:\/\/[^\s)]+)\)/i) ||
    content.match(/\[([^\]]*)\]\((https?:\/\/[^\s)]+(?:download-ppt|\.pptx)[^\s)]*)\)/i);
  const downloadUrl = linkMatch ? linkMatch[2] : null;

  const slideRegex = /\*\*Slide\s+(\d+):\s*([^*]+)\*\*\s*\n([\s\S]*?)(?=\*\*Slide\s+\d+:|$)/gi;
  const slides = [];
  let match;
  while ((match = slideRegex.exec(content)) !== null) {
    const slideNum = parseInt(match[1], 10);
    const slideTitle = match[2].trim();
    const rawBody = match[3].trim();
    const lines = rawBody
      .split("\n")
      .filter((l) => l.trim().startsWith("-") || l.trim().startsWith("*"));
    const points = lines.map((l, pIdx) => {
      const clean = l.replace(/^[-*]\s*/, "").trim();
      const boldMatch = clean.match(/^\*\*([^*]+)\*\*:\s*(.+)$/);
      if (boldMatch) {
        return { title: boldMatch[1].trim(), desc: boldMatch[2].trim() };
      }
      return { title: `Key Point ${pIdx + 1}`, desc: clean };
    });
    slides.push({
      num: slideNum,
      title: slideTitle,
      points: points.length > 0 ? points : [{ title: "Overview", desc: rawBody }],
    });
  }

  if (slides.length === 0 && !downloadUrl) return null;
  return { title, subtitle, downloadUrl, slides };
};

const DECK_ACCENTS = [
  { bar: "bg-indigo-500", badge: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30", pill: "bg-indigo-500", text: "text-indigo-400" },
  { bar: "bg-sky-500", badge: "bg-sky-500/15 text-sky-300 border-sky-500/30", pill: "bg-sky-500", text: "text-sky-400" },
  { bar: "bg-teal-500", badge: "bg-teal-500/15 text-teal-300 border-teal-500/30", pill: "bg-teal-500", text: "text-teal-400" },
  { bar: "bg-amber-500", badge: "bg-amber-500/15 text-amber-300 border-amber-500/30", pill: "bg-amber-500", text: "text-amber-400" },
  { bar: "bg-purple-500", badge: "bg-purple-500/15 text-purple-300 border-purple-500/30", pill: "bg-purple-500", text: "text-purple-400" },
  { bar: "bg-rose-500", badge: "bg-rose-500/15 text-rose-300 border-rose-500/30", pill: "bg-rose-500", text: "text-rose-400" },
];

const PresentationDeckCard = ({ data, originalContent }) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [viewMode, setViewMode] = useState("deck");
  const [copied, setCopied] = useState(false);

  const { title, subtitle, downloadUrl, slides = [] } = data;
  const currentSlide = slides[activeIdx] || slides[0] || { title: "Overview", points: [] };
  const currentAccent = DECK_ACCENTS[activeIdx % DECK_ACCENTS.length];

  const handleCopyOutline = async () => {
    try {
      await navigator.clipboard.writeText(originalContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const downloadFilename = title
    ? `${title.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "_")}.pptx`
    : "presentation.pptx";

  let finalDownloadUrl = downloadUrl;
  if (downloadUrl && downloadUrl.includes("res.cloudinary.com") && downloadUrl.includes("/raw/upload/")) {
    const proxyBase = import.meta.env.VITE_AGENT_URL || import.meta.env.VITE_SERVER_URL || "";
    finalDownloadUrl = `${proxyBase}/proxy-pdf?url=${encodeURIComponent(downloadUrl)}&filename=${encodeURIComponent(downloadFilename)}`;
  }

  const pointCount = currentSlide.points?.length || 0;
  const gridClass =
    pointCount <= 2
      ? "grid-cols-1 sm:grid-cols-2"
      : pointCount === 3
      ? "grid-cols-1 sm:grid-cols-3"
      : "grid-cols-1 sm:grid-cols-2";

  return (
    <div className="my-4 rounded-2xl overflow-hidden border border-amber-300/80 dark:border-amber-500/25 bg-white dark:bg-gradient-to-b dark:from-[#13111c] dark:via-[#0c0e17] dark:to-[#090b12] shadow-xl not-prose">

      <div className="h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500" />

      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-white/[0.08] flex flex-col md:flex-row md:items-center justify-between gap-3.5 bg-slate-50/80 dark:bg-white/[0.02]">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-600/30 border border-amber-500/40 flex items-center justify-center text-amber-500 dark:text-amber-400 shrink-0 shadow-sm mt-0.5">
            <Presentation size={20} />
          </div>
          <div className="min-w-0 flex flex-col">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base sm:text-lg truncate tracking-tight">
                {title}
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/30 text-amber-600 dark:text-amber-300">
                {slides.length} Slides
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-400">
                16:9 Widescreen
              </span>
            </div>
            {subtitle && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0 flex-wrap">
          <div className="flex items-center rounded-lg bg-slate-100 dark:bg-white/[0.04] p-0.5 border border-slate-200 dark:border-white/[0.08]">
            <button
              type="button"
              onClick={() => setViewMode("deck")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                viewMode === "deck"
                  ? "bg-amber-500/20 text-amber-600 dark:text-amber-300 shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <Layers size={13} />
              <span>Slide Deck</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("outline")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                viewMode === "outline"
                  ? "bg-amber-500/20 text-amber-600 dark:text-amber-300 shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <List size={13} />
              <span>Outline</span>
            </button>
          </div>

          {finalDownloadUrl && (
            <motion.a
              href={finalDownloadUrl}
              download={downloadFilename}
              target="_self"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white font-semibold text-xs shadow-md shadow-orange-500/20 cursor-pointer no-underline"
            >
              <Download size={13} />
              <span>Download PPTX</span>
            </motion.a>
          )}
        </div>
      </div>

      {viewMode === "deck" ? (
        <div className="p-4 sm:p-5 flex flex-col gap-4">
          <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50/80 dark:bg-[#0f121d] p-4 sm:p-5 flex flex-col min-h-[300px] shadow-inner relative overflow-hidden">

            <div className="flex items-center justify-between gap-2 pb-3 mb-3.5 border-b border-slate-200 dark:border-white/[0.06]">
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-4 rounded-full ${currentAccent.bar}`} />
                <span className={`text-[11px] font-bold uppercase tracking-wider ${currentAccent.text}`}>
                  {currentSlide.category || "STRATEGIC OVERVIEW"}
                </span>
                <span className="text-slate-400 dark:text-slate-600 text-xs">•</span>
                <h4 className="text-sm sm:text-base font-bold text-slate-800 dark:text-white tracking-tight">
                  {currentSlide.title}
                </h4>
              </div>

              <div className="text-[11px] font-mono font-medium text-slate-600 dark:text-slate-400 shrink-0 bg-white dark:bg-white/[0.05] px-2 py-0.5 rounded-md border border-slate-200 dark:border-white/[0.06]">
                Slide {activeIdx + 1} of {slides.length}
              </div>
            </div>

            <div className={`grid ${gridClass} gap-3 my-auto py-1`}>
              {(currentSlide.points || []).map((pt, pIdx) => {
                const numStr = `0${pIdx + 1}`;
                return (
                  <motion.div
                    key={pIdx}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: pIdx * 0.05 }}
                    className="flex flex-col gap-1.5 p-3 sm:p-3.5 rounded-xl bg-white dark:bg-white/[0.025] hover:bg-slate-100/80 dark:hover:bg-white/[0.045] border border-slate-200 dark:border-white/[0.07] hover:border-amber-400/40 dark:hover:border-amber-500/30 transition-all duration-200"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10.5px] font-bold text-white shrink-0 ${currentAccent.pill}`}>
                        {numStr}
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-100 text-xs sm:text-[13px] line-clamp-1">
                        {pt.title}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed pl-7">
                      {pt.desc}
                    </p>
                  </motion.div>
                );
              })}
            </div>

            <div className="pt-3 mt-3 border-t border-slate-200 dark:border-white/[0.05] flex items-center justify-between text-[10.5px] text-slate-400 dark:text-slate-500 font-sans">
              <span>Shifra AI Executive Deck</span>
              <span>16:9 Presentation View</span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <button
              type="button"
              disabled={activeIdx === 0}
              onClick={() => setActiveIdx((prev) => Math.max(0, prev - 1))}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                activeIdx === 0
                  ? "opacity-35 cursor-not-allowed border-slate-200 dark:border-white/[0.06] text-slate-400 dark:text-slate-500"
                  : "bg-white dark:bg-white/[0.04] hover:bg-slate-100 dark:hover:bg-white/[0.08] border-slate-200 dark:border-white/[0.1] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              }`}
            >
              <ChevronLeft size={14} />
              <span>Previous</span>
            </button>

            <div className="flex items-center gap-1.5 overflow-x-auto max-w-[50%] py-1">
              {slides.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveIdx(idx)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    activeIdx === idx
                      ? "w-6 bg-amber-500 shadow-xs shadow-amber-500/50"
                      : "w-2 bg-slate-300 dark:bg-white/20 hover:bg-slate-400 dark:hover:bg-white/40"
                  }`}
                  title={`Jump to slide ${idx + 1}: ${s.title}`}
                />
              ))}
            </div>

            <button
              type="button"
              disabled={activeIdx === slides.length - 1}
              onClick={() => setActiveIdx((prev) => Math.min(slides.length - 1, prev + 1))}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                activeIdx === slides.length - 1
                  ? "opacity-35 cursor-not-allowed border-slate-200 dark:border-white/[0.06] text-slate-400 dark:text-slate-500"
                  : "bg-white dark:bg-white/[0.04] hover:bg-slate-100 dark:hover:bg-white/[0.08] border-slate-200 dark:border-white/[0.1] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              }`}
            >
              <span>Next</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      ) : (
        /* Outline View */
        <div className="p-4 sm:p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-white/[0.08]">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              Presentation Outline ({slides.length} Slides)
            </span>
            <button
              type="button"
              onClick={handleCopyOutline}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check size={12} className="text-emerald-500 dark:text-emerald-400" />
                  <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={12} />
                  <span>Copy Outline</span>
                </>
              )}
            </button>
          </div>

          <div className="flex flex-col gap-3 max-h-[360px] overflow-y-auto pr-1">
            {slides.map((s, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] flex flex-col gap-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-800 dark:text-slate-100 text-xs sm:text-[13px]">
                    Slide {idx + 1}: {s.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveIdx(idx);
                      setViewMode("deck");
                    }}
                    className="text-[11px] text-amber-500 hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300 hover:underline cursor-pointer"
                  >
                    View Slide
                  </button>
                </div>
                <div className="space-y-1 pl-2 border-l border-slate-200 dark:border-white/[0.08] mt-1">
                  {(s.points || []).map((pt, pIdx) => (
                    <div key={pIdx} className="text-xs text-slate-600 dark:text-slate-300">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{pt.title}: </span>
                      <span className="text-slate-500 dark:text-slate-400">{pt.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const MessageBuble = ({ role, content, images = [], artifacts = [], isThinking = false, sidebarCollapsed = false, ...props }) => {
  const dispatch = useDispatch();
  const [lightBox, setLightBox] = useState(null);
  const artifactCardRef = useRef(null);

  useEffect(() => {
    const el = artifactCardRef.current;
    const validArts = (Array.isArray(artifacts) ? artifacts : []).filter(
      (a) => Array.isArray(a?.files) && a.files.length > 0
    );
    if (!el || validArts.length === 0) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const firstArt = validArts[0];
          const resolvedTitle = getArtifactTitle(firstArt, content);
          dispatch(setVisibleArtifact({ ...firstArt, title: resolvedTitle }));
        } else {
          dispatch(clearVisibleArtifact(validArts[0]?.id));
        }
      },
      {
        threshold: 0.1,
      }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      dispatch(clearVisibleArtifact(validArts[0]?.id));
    };
  }, [artifacts, content, dispatch]);

  useEffect(() => {
    if (!lightBox) return;

    const handleClose = () => {
      setLightBox(null);
    };

    window.addEventListener("wheel", handleClose, { passive: true });
    window.addEventListener("scroll", handleClose, { passive: true, capture: true });
    window.addEventListener("touchmove", handleClose, { passive: true });

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setLightBox(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("wheel", handleClose);
      window.removeEventListener("scroll", handleClose, { capture: true });
      window.removeEventListener("touchmove", handleClose);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [lightBox]);

  const isUser = role === "user";
  const displayText = formatContent(content);
  const pptData = useMemo(() => parsePresentationData(displayText), [displayText]);

  if (isUser) {
    const pdfMatch = typeof content === "string" ? content.match(/📄\s*\*\*\[PDF:\s*([^\]]+)\]\*\*/) : null;
    const imageMatch = typeof content === "string" ? content.match(/🖼️\s*\*\*\[Image:\s*([^\]]+)\]\*\*/) : null;
    const detectedPdfName = pdfMatch ? pdfMatch[1].trim() : (props?.pdf?.name || null);
    const detectedImageName = imageMatch ? imageMatch[1].trim() : (props?.image?.name || null);

    let cleanUserText = displayText;
    if (pdfMatch) {
      cleanUserText = cleanUserText.replace(/📄\s*\*\*\[PDF:\s*([^\]]+)\]\*\*\s*/g, "").trim();
    }
    if (imageMatch) {
      cleanUserText = cleanUserText.replace(/🖼️\s*\*\*\[Image:\s*([^\]]+)\]\*\*\s*/g, "").trim();
    }

    const resolvedPdfUrl =
      props?.pdf?.url ||
      (detectedPdfName && typeof window !== "undefined" && window.__pdfBlobCache?.get(detectedPdfName)) ||
      null;

    const resolvedImages = (Array.isArray(images) && images.length > 0)
      ? images
      : (detectedImageName && typeof window !== "undefined" && window.__imageBlobCache?.has(detectedImageName))
        ? [window.__imageBlobCache.get(detectedImageName)]
        : (props?.imageUrl ? [props.imageUrl] : []);

    return (
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="flex items-start my-1.5 w-full justify-end"
      >
        <div className="max-w-[85%] sm:max-w-[78%] md:max-w-[72%] px-4 py-3 rounded-2xl rounded-tr-sm bg-linear-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/15 text-[13.5px] sm:text-[14px] leading-relaxed break-words flex flex-col gap-2.5">
          {resolvedImages.length > 0 && (
            <div className="flex flex-wrap gap-2.5 not-prose">
              {resolvedImages.map((imgUrl, idx) => (
                <div
                  key={idx}
                  onClick={() => dispatch(setActiveArtifact({
                    type: 'image',
                    title: detectedImageName || 'Attached Image',
                    imageUrl: imgUrl
                  }))}
                  className="group relative rounded-xl overflow-hidden border border-white/30 hover:border-white/80 shadow-md hover:shadow-lg cursor-pointer transition-all bg-black/20"
                  title="Click to show image in Artifact panel"
                >
                  <div className="w-28 h-28 sm:w-32 sm:h-32 overflow-hidden relative bg-indigo-950/50 flex items-center justify-center">
                    <ImageIcon size={28} className="text-white/30 absolute pointer-events-none" />
                    <img
                      src={imgUrl}
                      alt={detectedImageName || "Attached visual"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 relative z-1"
                      onError={(e) => {
                        if (detectedImageName && typeof window !== "undefined" && window.__imageBlobCache?.has(detectedImageName)) {
                          const cached = window.__imageBlobCache.get(detectedImageName);
                          if (cached && cached !== e.target.src) {
                            e.target.src = cached;
                            return;
                          }
                        }
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                  <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/20 to-transparent opacity-90 group-hover:opacity-100 flex flex-col justify-end p-2 transition-opacity">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-semibold text-white/90 truncate max-w-[80px]">
                        {detectedImageName || 'Image'}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] font-medium text-white bg-white/20 group-hover:bg-indigo-500/80 px-1.5 py-0.5 rounded-md backdrop-blur-xs transition-colors">
                        <Sparkles size={10} className="text-amber-300" />
                        <span>Artifact</span>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {resolvedImages.length === 0 && detectedImageName && (
            <div
              onClick={() => dispatch(setActiveArtifact({
                type: 'image',
                title: detectedImageName,
                imageUrl: (typeof window !== "undefined" && window.__imageBlobCache?.get(detectedImageName)) || null
              }))}
              className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 hover:border-white/40 cursor-pointer transition-all group"
              title="Click to show Image in Artifact panel"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/30 border border-indigo-300/40 flex items-center justify-center text-indigo-100 shrink-0">
                  <ImageIcon size={16} />
                </div>
                <div className="flex flex-col min-w-0 pr-1">
                  <span className="text-xs font-semibold text-white truncate max-w-[200px]">
                    {detectedImageName}
                  </span>
                  <span className="text-[10px] text-indigo-100/80 group-hover:text-white transition-colors">
                    Attached visual document
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/20 group-hover:bg-white/30 text-white font-medium text-[11px] shrink-0 border border-white/25 transition-all">
                <Sparkles size={11} className="text-amber-300" />
                <span>Show Artifact</span>
              </div>
            </div>
          )}

          {detectedPdfName && (
            <div
              onClick={() => dispatch(setActiveArtifact({
                type: 'pdf',
                title: detectedPdfName,
                pdfUrl: resolvedPdfUrl || undefined
              }))}
              className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 hover:border-white/40 cursor-pointer transition-all group"
              title="Click to show PDF in Artifact panel"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-rose-500/25 border border-rose-300/40 flex items-center justify-center text-rose-200 shrink-0">
                  <FileText size={16} />
                </div>
                <div className="flex flex-col min-w-0 pr-1">
                  <span className="text-xs font-semibold text-white truncate max-w-[200px]">
                    {detectedPdfName}
                  </span>
                  <span className="text-[10px] text-indigo-100/80 group-hover:text-white transition-colors">
                    Custom Vector DB • Indexed
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/20 group-hover:bg-white/30 text-white font-medium text-[11px] shrink-0 border border-white/25 transition-all">
                <Sparkles size={11} className="text-amber-300" />
                <span>Show Artifact</span>
              </div>
            </div>
          )}

          {cleanUserText && (
            <div className="whitespace-pre-wrap">{cleanUserText}</div>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="flex items-start gap-2.5 sm:gap-3 my-2 w-full justify-start"
    >
      <div
        className={`w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5 shadow-xs transition-all duration-300 ${isThinking ? "animate-pulse ring-1 ring-indigo-500/30" : ""
          }`}
      >
        {isThinking ? <Brain size={14} className="text-indigo-600 dark:text-indigo-400" /> : <Sparkles size={13} className="sm:size-[14px]" />}
      </div>

      <div className="flex-1 min-w-0 text-slate-800 dark:text-slate-200 text-[13.5px] sm:text-[14.5px] leading-relaxed break-words py-0.5">
        {isThinking ? (
          <ThinkingIndicator />
        ) : (
          <div className="prose dark:prose-invert max-w-none text-[13.5px] sm:text-[14.5px] leading-relaxed text-slate-800 dark:text-slate-200">
            {Array.isArray(images) && images.length > 0 && (
              <div className="mb-3.5 not-prose">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium mb-2">
                  <ImageIcon size={13} className="text-indigo-500 dark:text-indigo-400" />
                  <span>Images ({images.length})</span>
                </div>
                <div className="flex items-center gap-2.5 overflow-x-auto pb-1.5 hide-scrollbar">
                  {images.map((imgUrl, idx) => (
                    <motion.div
                      key={idx}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => dispatch(setActiveArtifact({
                        type: 'image',
                        title: `Visual Reference ${idx + 1}`,
                        imageUrl: imgUrl
                      }))}
                      className="shrink-0 w-32 h-24 sm:w-40 sm:h-28 rounded-xl overflow-hidden border border-slate-200 dark:border-white/[0.08] hover:border-indigo-400 dark:hover:border-indigo-500/50 transition-colors duration-200 group relative block bg-slate-100 dark:bg-[#161822] cursor-pointer"
                      title="Click to view in Artifact panel"
                    >
                      <img
                        src={imgUrl}
                        alt={`Search visual ${idx + 1}`}
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.parentElement.style.display = "none";
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <ExternalLink size={14} className="text-white drop-shadow" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
            {(() => {
              const codeArtifacts = (Array.isArray(artifacts) ? artifacts : []).filter(
                (art) => Array.isArray(art?.files) && art.files.length > 0
              );
              if (codeArtifacts.length === 0) return null;

              return (
                <div ref={artifactCardRef} className="mb-4 flex flex-col gap-2.5 not-prose">
                  {codeArtifacts.map((art, idx) => {
                    const filesCount = art.files?.length || 0;
                    const resolvedTitle = getArtifactTitle(art, content);
                    return (
                    <motion.div
                      key={art.id || idx}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ y: -2 }}
                      transition={{ duration: 0.2 }}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-linear-to-r from-indigo-50/80 via-white to-violet-50/80 dark:from-indigo-950/40 dark:via-[#111422] dark:to-violet-950/30 border border-indigo-200 hover:border-indigo-300 dark:border-indigo-500/25 dark:hover:border-indigo-500/40 shadow-xs dark:shadow-indigo-500/5 group transition-colors duration-200"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-linear-to-br from-indigo-500/15 to-violet-600/25 dark:from-indigo-500/20 dark:to-violet-600/30 border border-indigo-200 dark:border-indigo-500/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 shadow-xs">
                          <FolderCode size={20} />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-800 dark:text-slate-100 text-sm truncate">
                              {resolvedTitle}
                            </span>
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/15 border border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-300 shrink-0">
                              {filesCount} {filesCount === 1 ? "file" : "files"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1 overflow-x-auto [scrollbar-width:none]">
                            {(art.files || []).slice(0, 4).map((f, fi) => (
                              <span
                                key={fi}
                                className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-600 dark:text-slate-400 bg-white dark:bg-white/[0.04] px-2 py-0.5 rounded-md border border-slate-200 dark:border-white/[0.06]"
                              >
                                <FileCode size={10} className="text-indigo-500 dark:text-indigo-400" />
                                {f.name}
                              </span>
                            ))}
                            {(art.files?.length || 0) > 4 && (
                              <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                +{art.files.length - 4} more
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => dispatch(setActiveArtifact({ ...art, title: resolvedTitle }))}
                        className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-linear-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 border border-indigo-400/30 shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-150 cursor-pointer shrink-0 self-stretch sm:self-auto justify-center"
                      >
                        <Play size={13} className="fill-white" />
                        <span>Open & Preview</span>
                      </motion.button>
                    </motion.div>
                  );
                })}
              </div>
              );
            })()}
            {pptData ? (
              <PresentationDeckCard data={pptData} originalContent={displayText} />
            ) : (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || "");
                  const codeString = String(children).replace(/\n$/, "");

                  if (!inline && (match || codeString.includes("\n"))) {
                    return <CodeBlock language={match ? match[1] : ""} value={codeString} />;
                  }

                  return (
                    <code
                      className="px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 font-mono text-[12.5px] font-medium"
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
                p({ children }) {
                  return <p className="mb-2.5 last:mb-0 leading-relaxed text-slate-800 dark:text-slate-200">{children}</p>;
                },
                h1({ children }) {
                  return <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-3.5 mb-2 tracking-tight">{children}</h1>;
                },
                h2({ children }) {
                  return <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mt-3 mb-1.5 tracking-tight">{children}</h2>;
                },
                h3({ children }) {
                  return <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-2.5 mb-1">{children}</h3>;
                },
                ul({ children }) {
                  return <ul className="list-disc pl-5 space-y-1 mb-2.5 text-slate-800 dark:text-slate-200">{children}</ul>;
                },
                ol({ children }) {
                  return <ol className="list-decimal pl-5 space-y-1 mb-2.5 text-slate-800 dark:text-slate-200">{children}</ol>;
                },
                li({ children }) {
                  return <li className="leading-relaxed">{children}</li>;
                },
                blockquote({ children }) {
                  return (
                    <blockquote className="border-l-2 border-indigo-400 dark:border-indigo-500/50 pl-3.5 py-1.5 my-2.5 italic text-slate-700 dark:text-slate-300 bg-indigo-50/60 dark:bg-indigo-500/5 rounded-r-lg">
                      {children}
                    </blockquote>
                  );
                },
                table({ children }) {
                  return (
                    <div className="overflow-x-auto my-3 rounded-lg border border-slate-200 dark:border-white/[0.08]">
                      <table className="min-w-full divide-y divide-slate-200 dark:divide-white/[0.08] text-xs text-left">
                        {children}
                      </table>
                    </div>
                  );
                },
                th({ children }) {
                  return (
                    <th className="px-3 py-2 bg-slate-100 dark:bg-white/[0.04] font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                      {children}
                    </th>
                  );
                },
                td({ children }) {
                  return (
                    <td className="px-3 py-2 text-slate-700 dark:text-slate-300 border-t border-slate-200 dark:border-white/[0.05]">
                      {children}
                    </td>
                  );
                },
                a({ href, children }) {
                  const isPdf = href && (href.endsWith(".pdf") || href.includes("download-pdf"));
                  const isPpt =
                    href &&
                    (href.endsWith(".pptx") ||
                      href.endsWith(".ppt") ||
                      href.includes("download-ppt") ||
                      href.includes("download-pptx"));
                  const isDownload =
                    isPdf ||
                    isPpt ||
                    (href &&
                      (href.includes("download") ||
                        (typeof children === "string" &&
                          children.toLowerCase().includes("download"))));

                  if (isDownload) {
                    let finalUrl = href;
                    let downloadFilename = isPpt ? "presentation.pptx" : "document.pdf";
                    try {
                      const parsed = new URL(href, window.location.origin);
                      const queryFilename = parsed.searchParams.get("filename");
                      if (queryFilename) {
                        downloadFilename = queryFilename;
                      } else {
                        const pathEnd = parsed.pathname.split("/").pop();
                        if (
                          pathEnd &&
                          (pathEnd.endsWith(".pdf") ||
                            pathEnd.endsWith(".pptx") ||
                            pathEnd.endsWith(".ppt"))
                        ) {
                          downloadFilename = decodeURIComponent(pathEnd);
                        }
                      }
                    } catch (e) {
                      const lastPart = href.split("/").pop()?.split("?")[0];
                      if (
                        lastPart &&
                        (lastPart.endsWith(".pdf") ||
                          lastPart.endsWith(".pptx") ||
                          lastPart.endsWith(".ppt"))
                      ) {
                        downloadFilename = decodeURIComponent(lastPart);
                      }
                    }

                    if (href.includes("res.cloudinary.com") && href.includes("/raw/upload/")) {
                      const proxyBase = import.meta.env.VITE_AGENT_URL || import.meta.env.VITE_SERVER_URL || "";
                      finalUrl = `${proxyBase}/proxy-pdf?url=${encodeURIComponent(href)}&filename=${encodeURIComponent(downloadFilename)}`;
                    }

                    return (
                      <motion.a
                        href={finalUrl}
                        download={downloadFilename}
                        target="_self"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`inline-flex items-center gap-2 px-4 py-2.5 my-2 rounded-xl text-white font-semibold text-xs shadow-lg transition-all not-prose no-underline cursor-pointer select-none ${
                          isPpt
                            ? "bg-linear-to-r from-amber-600 via-orange-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 shadow-orange-500/25"
                            : "bg-linear-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-indigo-500/25"
                        }`}
                      >
                        {isPpt ? <Presentation size={15} /> : <FileText size={15} />}
                        <span>{children}</span>
                      </motion.a>
                    );
                  }

                  return (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 underline underline-offset-2 transition-colors flex items-center gap-1"
                    >
                      {children}
                      <ExternalLink size={14} />
                    </a>
                  );
                },
                hr() {
                  return <hr className="border-slate-200 dark:border-white/[0.08] my-3" />;
                },
                img() {
                  return null;
                },
              }}
            >
              {displayText}
            </ReactMarkdown>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {lightBox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 cursor-pointer select-none"
            onClick={() => setLightBox(null)}
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setLightBox(null)}
              className="absolute top-5 right-5 text-white hover:text-rose-400 text-xl font-bold z-10 bg-black/70 hover:bg-black/90 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer border border-white/20 shadow-lg"
              title="Close image"
            >
              <X size={20} />
            </motion.button>
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              src={lightBox}
              alt="Full view"
              onClick={(e) => e.stopPropagation()}
              className="max-w-[90vw] max-h-[85vh] object-contain rounded-xl shadow-2xl border border-white/15 cursor-default"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default MessageBuble;