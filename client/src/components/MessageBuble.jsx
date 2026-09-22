import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Sparkles, Copy, Check, Brain, Loader2, Zap } from "lucide-react";

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
              className={`flex items-center gap-2.5 text-xs transition-all duration-300 ${
                isCurrent
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

const CodeBlock = ({ language, value }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-white/[0.08] shadow-lg bg-[#090b10]">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-white/[0.03] border-b border-white/[0.06] text-xs text-slate-400 font-mono">
        <span className="text-[11.5px] uppercase font-semibold text-slate-400 tracking-wider">
          {language || "code"}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-0.5 rounded-md hover:bg-white/[0.06] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer text-[11.5px]"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check size={12} className="text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied!</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3.5 overflow-x-auto text-[13px] font-mono leading-relaxed text-slate-200 [scrollbar-width:thin]">
        <code>{value}</code>
      </pre>
    </div>
  );
};

const MessageBuble = ({ role, content, isThinking = false, sidebarCollapsed = false }) => {
  const isUser = role === "user";
  const displayText = formatContent(content);

  if (isUser) {
    return (
      <div className="flex items-start my-1.5 w-full justify-end transition-all duration-200">
        <div className="max-w-[85%] sm:max-w-[78%] md:max-w-[72%] px-4 py-2.5 rounded-2xl rounded-tr-sm bg-linear-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/15 text-[13.5px] sm:text-[14px] leading-relaxed whitespace-pre-wrap break-words">
          {displayText}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2.5 sm:gap-3 my-2 w-full justify-start transition-all duration-200">
      <div
        className={`w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5 shadow-sm transition-all duration-300 ${
          isThinking ? "animate-pulse ring-1 ring-indigo-500/30" : ""
        }`}
      >
        {isThinking ? <Brain size={14} className="text-indigo-400" /> : <Sparkles size={13} className="sm:size-[14px]" />}
      </div>

      <div className="flex-1 min-w-0 text-slate-200 text-[13.5px] sm:text-[14.5px] leading-relaxed break-words py-0.5">
        {isThinking ? (
          <ThinkingIndicator />
        ) : (
          <div className="prose prose-invert max-w-none text-[13.5px] sm:text-[14.5px] leading-relaxed">
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
                      className="px-1.5 py-0.5 rounded-md bg-white/[0.08] text-indigo-300 font-mono text-[12.5px] border border-white/[0.06]"
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
                      className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition-colors"
                    >
                      {children}
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
    </div>
  );
};

export default MessageBuble;