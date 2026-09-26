import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Upload,
  Trash2,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Database,
  Layers,
  ChevronDown,
  ChevronUp,
  Sparkles,
  BookOpen,
  X,
  RefreshCw,
  Copy,
  Check,
  Search,
  Zap,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  uploadPdf,
  getDocuments,
  getDocumentStatus,
  deleteDocument,
  chatPdf,
  getPdfConversation,
  deletePdfConversation,
} from "../features/pdfRagApi";
import { useSelector } from "react-redux";

const formatBytes = (bytes, decimals = 1) => {
  if (!+bytes) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

const SUGGESTED_QUESTIONS = [
  "Summarize the key insights of this document",
  "What are the main findings and conclusions?",
  "What is covered on the first page?",
  "Explain the core terminology and definitions",
];

const PdfRagStudio = ({ isOpen, onClose }) => {
  const userData = useSelector((state) => state.user?.userData);

  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [loadingDocs, setLoadingDocs] = useState(false);

  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState("");
  const [uploadError, setUploadError] = useState("");

  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isQuerying, setIsQuerying] = useState(false);
  const [expandedSources, setExpandedSources] = useState({});
  const [copiedIndex, setCopiedIndex] = useState(null);

  const [mobileDocsOpen, setMobileDocsOpen] = useState(false);

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const pollingRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isQuerying]);

  useEffect(() => {
    if (isOpen) {
      loadDocuments();
    } else {
      clearInterval(pollingRef.current);
    }
    return () => clearInterval(pollingRef.current);
  }, [isOpen]);

  useEffect(() => {
    if (!selectedDoc || selectedDoc.status === "ready" || selectedDoc.status === "error") {
      clearInterval(pollingRef.current);
      return;
    }

    pollingRef.current = setInterval(async () => {
      try {
        const status = await getDocumentStatus(selectedDoc.documentId);
        if (status) {
          if (status.status === "ready" || status.status === "error") {
            clearInterval(pollingRef.current);
            loadDocuments();
          }
        }
      } catch (err) {
        console.warn("Status poll error:", err.message);
      }
    }, 2500);

    return () => clearInterval(pollingRef.current);
  }, [selectedDoc?.documentId, selectedDoc?.status]);

  useEffect(() => {
    if (selectedDoc?.documentId) {
      loadConversation(selectedDoc.documentId);
    } else {
      setMessages([]);
    }
  }, [selectedDoc?.documentId]);

  const loadDocuments = async () => {
    try {
      setLoadingDocs(true);
      const docs = await getDocuments();
      setDocuments(docs);
      if (docs.length > 0 && !selectedDoc) {
        setSelectedDoc(docs[0]);
      } else if (selectedDoc) {
        const updated = docs.find((d) => d.documentId === selectedDoc.documentId);
        if (updated) setSelectedDoc(updated);
      }
    } catch (err) {
      console.error("Failed to load documents:", err);
    } finally {
      setLoadingDocs(false);
    }
  };

  const loadConversation = async (docId) => {
    const convId = `conv_${docId}_${userData?._id || "user"}`;
    try {
      const history = await getPdfConversation(convId);
      if (Array.isArray(history) && history.length > 0) {
        setMessages(history);
      } else {
        setMessages([]);
      }
    } catch {
      setMessages([]);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    if (file.type !== "application/pdf") {
      setUploadError("Only PDF documents (.pdf) are supported.");
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setUploadError("File size exceeds 25 MB limit.");
      return;
    }

    try {
      setUploading(true);
      setUploadError("");
      setUploadProgress(10);
      setUploadStage("Uploading file to server...");

      const res = await uploadPdf(file, (progress) => {
        setUploadProgress(progress);
        if (progress >= 100) {
          setUploadStage("Extracting text and page boundaries...");
        }
      });

      setUploadProgress(100);
      setUploadStage("Generating embeddings & indexing in Custom Vector DB...");

      const newDoc = res.document;
      await loadDocuments();
      if (newDoc) {
        setSelectedDoc(newDoc);
      }
      setUploading(false);
      setUploadStage("");
      setMobileDocsOpen(false);
    } catch (err) {
      console.error("PDF upload error:", err);
      setUploadError(err.response?.data?.details || err.message || "Failed to process PDF.");
      setUploading(false);
      setUploadStage("");
    }
  };

  const handleDeleteDocument = async (e, docId) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this document and all its indexed vectors?")) {
      return;
    }

    try {
      await deleteDocument(docId);
      const remaining = documents.filter((d) => d.documentId !== docId);
      setDocuments(remaining);
      if (selectedDoc?.documentId === docId) {
        setSelectedDoc(remaining.length > 0 ? remaining[0] : null);
      }
    } catch (err) {
      console.error("Failed to delete document:", err);
      alert("Failed to delete document: " + (err.response?.data?.details || err.message));
    }
  };

  const handleSendMessage = async (customPrompt) => {
    const question = (customPrompt || inputValue).trim();
    if (!question || isQuerying || !selectedDoc) return;

    if (selectedDoc.status !== "ready") {
      alert("This document is still being indexed. Please wait until processing completes.");
      return;
    }

    const convId = `conv_${selectedDoc.documentId}_${userData?._id || "user"}`;
    const userMsg = {
      role: "user",
      content: question,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsQuerying(true);

    try {
      const data = await chatPdf({
        documentId: selectedDoc.documentId,
        conversationId: convId,
        question,
      });

      const assistantMsg = {
        role: "assistant",
        content: data.answer,
        sources: data.sources || [],
        cached: data.cached || false,
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `⚠️ **Error:** ${err.response?.data?.details || err.message || "Could not generate response. Please check your query or server connection."}`,
          sources: [],
          createdAt: new Date(),
        },
      ]);
    } finally {
      setIsQuerying(false);
    }
  };

  const handleClearChat = async () => {
    if (!selectedDoc || messages.length === 0) return;
    if (!window.confirm("Clear this conversation history?")) return;

    const convId = `conv_${selectedDoc.documentId}_${userData?._id || "user"}`;
    try {
      await deletePdfConversation(convId);
      setMessages([]);
    } catch (err) {
      console.error("Clear chat error:", err);
    }
  };

  const toggleSourceExpand = (msgIndex, sourceIdx) => {
    const key = `${msgIndex}_${sourceIdx}`;
    setExpandedSources((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCopyAnswer = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-md p-2 sm:p-4 md:p-6"
      >
        <motion.div
          initial={{ scale: 0.95, y: 15 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 15 }}
          transition={{ type: "spring", damping: 25, stiffness: 350 }}
          className="w-full max-w-7xl h-[92vh] max-h-[900px] bg-white dark:bg-[#11131a] border border-slate-200 dark:border-white/[0.08] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Top Navigation Bar */}
          <header className="px-4 sm:px-6 py-3.5 border-b border-slate-200 dark:border-white/[0.08] bg-slate-50/80 dark:bg-white/[0.02] flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-rose-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-rose-500/20 shrink-0">
                <FileText size={19} />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white truncate">
                    PDF RAG Agent Studio
                  </h2>
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <Database size={11} /> Custom Vector DB
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  Pure in-memory vector storage with manual cosine similarity & Gemini grounded generation
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMobileDocsOpen(!mobileDocsOpen)}
                className="md:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.05]"
              >
                <BookOpen size={14} />
                Docs ({documents.length})
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/[0.08] transition-colors"
                title="Close Studio"
              >
                <X size={18} />
              </button>
            </div>
          </header>

          {/* Body Content */}
          <div className="flex-1 flex overflow-hidden relative">
            {/* Left Sidebar: Document Management & Dropzone */}
            <aside
              className={`${
                mobileDocsOpen ? "flex" : "hidden"
              } md:flex flex-col w-full md:w-80 lg:w-96 border-r border-slate-200 dark:border-white/[0.08] bg-slate-50/50 dark:bg-black/20 shrink-0 absolute md:relative inset-0 z-20 md:z-auto backdrop-blur-md md:backdrop-blur-none`}
            >
              <div className="p-4 border-b border-slate-200 dark:border-white/[0.08] flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Layers size={14} className="text-indigo-500" />
                  Your Documents ({documents.length})
                </span>
                <button
                  type="button"
                  onClick={loadDocuments}
                  disabled={loadingDocs}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                  title="Refresh documents"
                >
                  <RefreshCw size={14} className={loadingDocs ? "animate-spin" : ""} />
                </button>
              </div>

              {/* Drag and Drop Upload Area */}
              <div className="p-4">
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      handleFileUpload(e.dataTransfer.files[0]);
                    }
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-200 ${
                    isDragging
                      ? "border-indigo-500 bg-indigo-500/10 scale-[1.01]"
                      : "border-slate-300 dark:border-white/[0.12] hover:border-indigo-400 dark:hover:border-indigo-500/50 bg-white dark:bg-white/[0.02]"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleFileUpload(e.target.files[0]);
                      }
                    }}
                  />

                  <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-2">
                    <Upload size={18} />
                  </div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Click to browse or drag & drop PDF
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Max size 25MB • Up to 100 pages
                  </p>
                </div>

                {/* Upload Progress Bar */}
                <AnimatePresence>
                  {uploading && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 overflow-hidden"
                    >
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-medium text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5 truncate">
                          <Loader2 size={13} className="animate-spin text-indigo-500 shrink-0" />
                          <span className="truncate">{uploadStage || "Processing..."}</span>
                        </span>
                        <span className="font-mono text-indigo-600 dark:text-indigo-400 shrink-0">
                          {uploadProgress}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-white/10 rounded-full h-1.5 overflow-hidden">
                        <motion.div
                          className="bg-linear-to-r from-indigo-500 to-rose-500 h-1.5 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${uploadProgress}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {uploadError && (
                  <div className="mt-2.5 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2">
                    <AlertCircle size={15} className="shrink-0 mt-0.5" />
                    <span>{uploadError}</span>
                  </div>
                )}
              </div>

              {/* Document List */}
              <div className="flex-1 overflow-y-auto px-3 pb-3 flex flex-col gap-1.5 hide-scrollbar">
                {documents.length === 0 && !loadingDocs ? (
                  <div className="text-center py-10 px-4">
                    <BookOpen size={28} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      No PDF documents uploaded yet
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                      Upload a PDF above to create your custom vector embeddings!
                    </p>
                  </div>
                ) : (
                  documents.map((doc) => {
                    const isSelected = selectedDoc?.documentId === doc.documentId;
                    const isReady = doc.status === "ready";
                    const isError = doc.status === "error";

                    return (
                      <div
                        key={doc.documentId}
                        onClick={() => {
                          setSelectedDoc(doc);
                          setMobileDocsOpen(false);
                        }}
                        className={`p-3 rounded-xl border transition-all cursor-pointer group flex items-start gap-2.5 ${
                          isSelected
                            ? "bg-indigo-500/10 dark:bg-indigo-500/15 border-indigo-400/50 dark:border-indigo-500/40 shadow-xs"
                            : "bg-white dark:bg-white/[0.02] border-slate-200 dark:border-white/[0.06] hover:border-slate-300 dark:hover:border-white/[0.12] hover:bg-slate-100/50 dark:hover:bg-white/[0.04]"
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                            isSelected
                              ? "bg-indigo-500 text-white shadow-xs"
                              : "bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300"
                          }`}
                        >
                          <FileText size={16} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {doc.originalName || doc.filename}
                          </h4>
                          <div className="flex items-center gap-2 mt-1 text-[10.5px] text-slate-500 dark:text-slate-400">
                            <span>{formatBytes(doc.fileSize)}</span>
                            {doc.pageCount > 0 && <span>• {doc.pageCount} pgs</span>}
                            {doc.chunkCount > 0 && <span>• {doc.chunkCount} chunks</span>}
                          </div>

                          <div className="mt-1.5 flex items-center justify-between">
                            {isReady ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 size={11} /> Indexed
                              </span>
                            ) : isError ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-rose-500">
                                <AlertCircle size={11} /> Failed
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-500">
                                <Loader2 size={11} className="animate-spin" /> Processing
                              </span>
                            )}

                            <button
                              type="button"
                              onClick={(e) => handleDeleteDocument(e, doc.documentId)}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                              title="Delete document and vector store"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </aside>

            {/* Right Main Chat Panel */}
            <main className="flex-1 flex flex-col h-full min-w-0 bg-white dark:bg-[#11131a] relative">
              {selectedDoc ? (
                <>
                  {/* Document Header in Chat */}
                  <div className="px-4 sm:px-6 py-2.5 border-b border-slate-200 dark:border-white/[0.08] bg-slate-50/50 dark:bg-white/[0.01] flex items-center justify-between gap-3 shrink-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText size={16} className="text-rose-500 shrink-0" />
                      <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {selectedDoc.originalName || selectedDoc.filename}
                      </span>
                      {selectedDoc.pageCount > 0 && (
                        <span className="px-2 py-0.5 rounded-md text-[10.5px] font-medium bg-slate-200 dark:bg-white/[0.08] text-slate-600 dark:text-slate-300 shrink-0">
                          {selectedDoc.pageCount} Pages
                        </span>
                      )}
                      {selectedDoc.chunkCount > 0 && (
                        <span className="hidden sm:inline-flex px-2 py-0.5 rounded-md text-[10.5px] font-medium bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shrink-0">
                          {selectedDoc.chunkCount} Vector Chunks
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleClearChat}
                      disabled={messages.length === 0}
                      className="text-xs text-slate-500 hover:text-rose-500 dark:text-slate-400 dark:hover:text-rose-400 transition-colors disabled:opacity-40 disabled:hover:text-slate-400"
                    >
                      Clear History
                    </button>
                  </div>

                  {/* Messages Scroll Area */}
                  <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-4 hide-scrollbar">
                    {messages.length === 0 && (
                      <div className="my-auto max-w-lg mx-auto text-center py-8">
                        <div className="w-12 h-12 rounded-2xl bg-linear-to-tr from-indigo-500 to-rose-500 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-indigo-500/20">
                          <Sparkles size={24} />
                        </div>
                        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
                          Ask questions about {selectedDoc.originalName}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                          Our custom vector database compares your questions against document chunks and extracts
                          ground-truth answers using Gemini.
                        </p>

                        <div className="mt-5 flex flex-col gap-2 text-left">
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
                            Suggested Inquiries
                          </span>
                          {SUGGESTED_QUESTIONS.map((q, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleSendMessage(q)}
                              className="text-xs p-2.5 rounded-xl border border-slate-200 dark:border-white/[0.08] hover:border-indigo-400 dark:hover:border-indigo-500/50 hover:bg-slate-50 dark:hover:bg-white/[0.04] text-slate-700 dark:text-slate-300 text-left transition-all duration-150 flex items-center justify-between group"
                            >
                              <span>{q}</span>
                              <Send
                                size={12}
                                className="text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {messages.map((msg, index) => {
                      const isUser = msg.role === "user";
                      return (
                        <div
                          key={index}
                          className={`flex flex-col gap-1.5 ${isUser ? "items-end" : "items-start"}`}
                        >
                          <div className={`flex items-start gap-2.5 max-w-[85%] sm:max-w-[78%]`}>
                            {!isUser && (
                              <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-500 flex items-center justify-center shrink-0 mt-0.5 text-xs font-semibold">
                                AI
                              </div>
                            )}

                            <div
                              className={`rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed ${
                                isUser
                                  ? "bg-indigo-600 text-white rounded-tr-xs shadow-md shadow-indigo-600/15"
                                  : "bg-slate-100 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.08] text-slate-900 dark:text-slate-100 rounded-tl-xs"
                              }`}
                            >
                              {isUser ? (
                                <p className="whitespace-pre-wrap">{msg.content}</p>
                              ) : (
                                <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm prose-p:my-1 prose-headings:my-2 prose-ul:my-1">
                                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                                </div>
                              )}

                              {!isUser && (
                                <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-white/[0.06] flex items-center justify-between gap-2 text-[10.5px] text-slate-400">
                                  <span>Grounded in PDF Context</span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyAnswer(msg.content, index)}
                                    className="flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                                  >
                                    {copiedIndex === index ? (
                                      <>
                                        <Check size={11} className="text-emerald-500" />
                                        <span className="text-emerald-500">Copied</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy size={11} />
                                        <span>Copy</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Source Citations from Custom Vector Database */}
                          {!isUser && Array.isArray(msg.sources) && msg.sources.length > 0 && (
                            <div className="ml-9 max-w-[85%] sm:max-w-[78%] flex flex-col gap-1.5 mt-0.5">
                              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                <Database size={11} className="text-indigo-500" />
                                Retrieved Sources ({msg.sources.length} chunks via Cosine Similarity):
                              </span>

                              <div className="flex flex-col gap-1.5">
                                {msg.sources.map((source, sIdx) => {
                                  const key = `${index}_${sIdx}`;
                                  const isExpanded = !!expandedSources[key];
                                  const matchPct = Math.round((source.score || 0) * 100);

                                  return (
                                    <div
                                      key={sIdx}
                                      className="border border-slate-200 dark:border-white/[0.08] rounded-xl bg-slate-50/80 dark:bg-white/[0.02] p-2 text-xs transition-colors"
                                    >
                                      <div
                                        onClick={() => toggleSourceExpand(index, sIdx)}
                                        className="flex items-center justify-between cursor-pointer select-none"
                                      >
                                        <div className="flex items-center gap-2">
                                          <span className="px-2 py-0.5 rounded-md font-semibold text-[10.5px] bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                            Page {source.pageNumber}
                                          </span>
                                          <span className="px-2 py-0.5 rounded-md font-mono text-[10px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                                            {matchPct}% Match (Cosine Sim)
                                          </span>
                                        </div>

                                        <button type="button" className="text-slate-400 hover:text-slate-600">
                                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                        </button>
                                      </div>

                                      {isExpanded && (
                                        <motion.div
                                          initial={{ opacity: 0, height: 0 }}
                                          animate={{ opacity: 1, height: "auto" }}
                                          className="mt-2 pt-2 border-t border-slate-200 dark:border-white/[0.06] text-[11px] text-slate-600 dark:text-slate-300 font-serif leading-relaxed italic bg-white/60 dark:bg-black/20 p-2 rounded-lg"
                                        >
                                          "{source.text}"
                                        </motion.div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {isQuerying && (
                      <div className="flex items-start gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-500 flex items-center justify-center shrink-0 mt-0.5 text-xs font-semibold">
                          AI
                        </div>
                        <div className="rounded-2xl rounded-tl-xs px-4 py-3 bg-slate-100 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.08] flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                          <Loader2 size={14} className="animate-spin text-indigo-500 shrink-0" />
                          <span>Searching Custom Vector DB & synthesizing answer...</span>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input Form */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage();
                    }}
                    className="p-3 sm:p-4 border-t border-slate-200 dark:border-white/[0.08] bg-slate-50/50 dark:bg-white/[0.01] flex items-center gap-2"
                  >
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder={`Ask a question grounded in ${selectedDoc.originalName}...`}
                      disabled={isQuerying || selectedDoc.status !== "ready"}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-black/20 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 disabled:opacity-50"
                    />

                    <button
                      type="submit"
                      disabled={isQuerying || !inputValue.trim() || selectedDoc.status !== "ready"}
                      className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs sm:text-sm flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-indigo-600/20"
                    >
                      {isQuerying ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                      <span className="hidden sm:inline">Ask PDF</span>
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
                    <FileText size={28} />
                  </div>
                  <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
                    No Document Selected
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1">
                    Upload a PDF document or choose an existing document from the left panel to begin querying with
                    Custom Vector DB.
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow-md shadow-indigo-600/20"
                  >
                    <Upload size={14} /> Upload First PDF
                  </button>
                </div>
              )}
            </main>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PdfRagStudio;
