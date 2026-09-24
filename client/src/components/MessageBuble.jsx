import React, { useState, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { setActiveArtifact, setVisibleArtifact, clearVisibleArtifact, setArtifactOpen } from "../redux/messageSlice";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Sparkles, Copy, Check, Brain, Loader2, Zap, Image as ImageIcon, ExternalLink, X, Play, FolderCode, FileCode, Code2 } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import oneDark from "react-syntax-highlighter/dist/esm/styles/prism/one-dark.js";

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

      <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-indigo-500/[0.08] border border-indigo-500/20 w-fit backdrop-blur-xs">
        <div className="relative flex items-center justify-center w-4 h-4 text-indigo-400">
          <Brain size={13} className="animate-pulse text-indigo-400" />
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <span className="font-semibold text-indigo-300">
            {getStatusLabel()}
          </span>
          <span className="text-[11px] font-mono text-indigo-400/70">
            ({seconds}s)
          </span>
        </div>

        <span className="w-1 h-1 rounded-full bg-indigo-400/30" />

        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "300ms" }} />
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
                ? "text-slate-200 font-medium translate-x-0.5"
                : isDone
                  ? "text-slate-500 opacity-60"
                  : "text-slate-600 opacity-35"
                }`}
            >
              <div className="shrink-0 flex items-center justify-center w-3.5 h-3.5">
                {isDone ? (
                  <Check size={12} className="text-emerald-400" />
                ) : isCurrent ? (
                  <Loader2 size={12} className="animate-spin text-indigo-400" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                )}
              </div>

              <div className="flex items-baseline gap-1.5 truncate">
                <span className={isCurrent ? "text-indigo-200 font-medium" : ""}>
                  {phase.title}
                </span>
                {isCurrent && (
                  <span className="text-[11px] text-slate-400 font-normal hidden sm:inline">
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
  const [copied, setCopied] = useState(false);
  const rawLang = (language || "").toLowerCase().trim();
  const highlightLang = NORMALIZE_LANG[rawLang] || rawLang || "javascript";
  const langConfig = LANGUAGE_CONFIG[rawLang] || {
    label: language ? language.toUpperCase() : "CODE",
    dot: "bg-indigo-400",
    badge: "text-indigo-300 bg-indigo-500/10 border-indigo-500/25",
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
    <div className="my-3.5 rounded-2xl overflow-hidden border border-white/[0.1] shadow-2xl bg-[#090b11] transition-all duration-200">
      <div className="flex items-center justify-between px-3.5 py-2 bg-[#0e111a] border-b border-white/[0.08] select-none">
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
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/25 text-indigo-300 hover:text-indigo-200 transition-colors cursor-pointer text-[11.5px] font-medium"
            title="Open and edit in Monaco Editor"
          >
            <Code2 size={12} className="text-indigo-400" />
            <span className="hidden sm:inline">View Or Edit</span>
            <span className="sm:hidden">View Or Edit</span>
          </motion.button>

          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.94 }}
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/[0.12] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer text-[11.5px] font-medium"
            title="Copy code to clipboard"
          >
            {copied ? (
              <>
                <Check size={12} className="text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Copied!</span>
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

      <div className="overflow-x-auto text-[13px] leading-relaxed [scrollbar-width:thin] bg-[#090b11]">
        <SyntaxHighlighter
          language={highlightLang}
          style={oneDark}
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
            color: "#64748b",
            textAlign: "right",
            userSelect: "none",
            borderRight: "1px solid rgba(255, 255, 255, 0.08)",
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

const MessageBuble = ({ role, content, images = [], artifacts = [], isThinking = false, sidebarCollapsed = false }) => {
  const dispatch = useDispatch();
  const [lightBox, setLightBox] = useState(null);
  const artifactCardRef = useRef(null);

  useEffect(() => {
    const el = artifactCardRef.current;
    if (!el || !Array.isArray(artifacts) || artifacts.length === 0) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const firstArt = artifacts[0];
          const resolvedTitle = getArtifactTitle(firstArt, content);
          dispatch(setVisibleArtifact({ ...firstArt, title: resolvedTitle }));
        } else {
          dispatch(clearVisibleArtifact(artifacts[0]?.id));
        }
      },
      {
        threshold: 0.1,
      }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      dispatch(clearVisibleArtifact(artifacts[0]?.id));
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

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="flex items-start my-1.5 w-full justify-end"
      >
        <div className="max-w-[85%] sm:max-w-[78%] md:max-w-[72%] px-4 py-2.5 rounded-2xl rounded-tr-sm bg-linear-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/15 text-[13.5px] sm:text-[14px] leading-relaxed whitespace-pre-wrap break-words">
          {displayText}
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
        className={`w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5 shadow-sm transition-all duration-300 ${isThinking ? "animate-pulse ring-1 ring-indigo-500/30" : ""
          }`}
      >
        {isThinking ? <Brain size={14} className="text-indigo-400" /> : <Sparkles size={13} className="sm:size-[14px]" />}
      </div>

      <div className="flex-1 min-w-0 text-slate-200 text-[13.5px] sm:text-[14.5px] leading-relaxed break-words py-0.5">
        {isThinking ? (
          <ThinkingIndicator />
        ) : (
          <div className="prose prose-invert max-w-none text-[13.5px] sm:text-[14.5px] leading-relaxed">
            {Array.isArray(images) && images.length > 0 && (
              <div className="mb-3.5 not-prose">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mb-2">
                  <ImageIcon size={13} className="text-indigo-400" />
                  <span>Images ({images.length})</span>
                </div>
                <div className="flex items-center gap-2.5 overflow-x-auto pb-1.5 hide-scrollbar">
                  {images.map((imgUrl, idx) => (
                    <motion.div
                      key={idx}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setLightBox(imgUrl)}
                      className="shrink-0 w-32 h-24 sm:w-40 sm:h-28 rounded-xl overflow-hidden border border-white/[0.08] hover:border-indigo-500/50 transition-colors duration-200 group relative block bg-[#161822] cursor-pointer"
                      title="Click to view full image"
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
            {Array.isArray(artifacts) && artifacts.length > 0 && (
              <div ref={artifactCardRef} className="mb-4 flex flex-col gap-2.5 not-prose">
                {artifacts.map((art, idx) => {
                  const filesCount = art.files?.length || 0;
                  const resolvedTitle = getArtifactTitle(art, content);
                  return (
                    <motion.div
                      key={art.id || idx}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ y: -2 }}
                      transition={{ duration: 0.2 }}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-linear-to-r from-indigo-950/40 via-[#111422] to-violet-950/30 border border-indigo-500/25 shadow-lg shadow-indigo-500/5 group hover:border-indigo-500/40 transition-colors duration-200"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-linear-to-br from-indigo-500/20 to-violet-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0 shadow-xs">
                          <FolderCode size={20} />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-100 text-sm truncate">
                              {resolvedTitle}
                            </span>
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 shrink-0">
                              {filesCount} {filesCount === 1 ? "file" : "files"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1 overflow-x-auto [scrollbar-width:none]">
                            {(art.files || []).slice(0, 4).map((f, fi) => (
                              <span
                                key={fi}
                                className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-400 bg-white/[0.04] px-2 py-0.5 rounded-md border border-white/[0.06]"
                              >
                                <FileCode size={10} className="text-indigo-400" />
                                {f.name}
                              </span>
                            ))}
                            {(art.files?.length || 0) > 4 && (
                              <span className="text-[10px] text-slate-500">
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
            )}
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
                      className="px-1.5 py-0.5 rounded-md bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-mono text-[12.5px] font-medium"
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
                p({ children }) {
                  return <p className="mb-2.5 last:mb-0 leading-relaxed text-slate-200">{children}</p>;
                },
                h1({ children }) {
                  return <h1 className="text-lg font-bold text-slate-100 mt-3.5 mb-2 tracking-tight">{children}</h1>;
                },
                h2({ children }) {
                  return <h2 className="text-base font-semibold text-slate-100 mt-3 mb-1.5 tracking-tight">{children}</h2>;
                },
                h3({ children }) {
                  return <h3 className="text-sm font-semibold text-slate-200 mt-2.5 mb-1">{children}</h3>;
                },
                ul({ children }) {
                  return <ul className="list-disc pl-5 space-y-1 mb-2.5 text-slate-200">{children}</ul>;
                },
                ol({ children }) {
                  return <ol className="list-decimal pl-5 space-y-1 mb-2.5 text-slate-200">{children}</ol>;
                },
                li({ children }) {
                  return <li className="leading-relaxed">{children}</li>;
                },
                blockquote({ children }) {
                  return (
                    <blockquote className="border-l-2 border-indigo-500/50 pl-3.5 py-1.5 my-2.5 italic text-slate-300 bg-indigo-500/5 rounded-r-lg">
                      {children}
                    </blockquote>
                  );
                },
                table({ children }) {
                  return (
                    <div className="overflow-x-auto my-3 rounded-lg border border-white/[0.08]">
                      <table className="min-w-full divide-y divide-white/[0.08] text-xs text-left">
                        {children}
                      </table>
                    </div>
                  );
                },
                th({ children }) {
                  return (
                    <th className="px-3 py-2 bg-white/[0.04] font-semibold text-slate-200 uppercase tracking-wider">
                      {children}
                    </th>
                  );
                },
                td({ children }) {
                  return (
                    <td className="px-3 py-2 text-slate-300 border-t border-white/[0.05]">
                      {children}
                    </td>
                  );
                },
                a({ href, children }) {
                  return (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition-colors flex items-center gap-1"
                    >
                      {children}
                      <ExternalLink size={14} />
                    </a>
                  );
                },
                hr() {
                  return <hr className="border-white/[0.08] my-3" />;
                },
              }}
            >
              {displayText}
            </ReactMarkdown>
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