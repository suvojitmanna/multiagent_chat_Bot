import {
  Mic,
  MicOff,
  Paperclip,
  Send,
  Loader2,
  Zap,
  MessageSquare,
  Code2,
  FileText,
  Presentation,
  Image as ImageIcon,
  Globe,
  Plus,
  Check,
  X,
} from 'lucide-react'
import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDispatch, useSelector } from 'react-redux'
import { sendMessage } from '../features/sendMessage'
import { getMessages } from '../features/getMessages'
import { setMessages, setActiveArtifact } from '../redux/messageSlice'
import { createConversation } from '../features/createConverSation'
import { addConversation, setSelectedConversation, updateConversationTitle } from '../redux/conversationSlice'
import { updateCredits, setUserdata } from '../redux/userSlice'
import getCurrentUser from '../features/getCurrentUser'

const AGENTS = [
  {
    id: "auto",
    label: "Auto",
    credits: -1,
    icon: Zap,
    color: "text-amber-400 border-amber-500/30 bg-amber-500/10",
    placeholder: "Ask anything... (Auto will route to the best agent)",
    description: "Dynamically classifies your query and selects the most capable agent automatically.",
  },
  {
    id: "chat",
    label: "Chat",
    credits: -1,
    icon: MessageSquare,
    color: "text-indigo-400 border-indigo-500/30 bg-indigo-500/10",
    placeholder: "Chat, brainstorm ideas, ask general questions...",
    description: "General discussion, smart explanations, educational help, and multi-turn conversations.",
  },
  {
    id: "coding",
    label: "Coding",
    credits: -10,
    icon: Code2,
    color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
    placeholder: "Ask for code, debug errors, explain architecture...",
    description: "Write clean code, debug syntax, explain complex algorithms, and architect full-stack apps.",
  },
  {
    id: "pdf",
    label: "PDF RAG",
    credits: -10,
    icon: FileText,
    color: "text-rose-400 border-rose-500/30 bg-rose-500/10",
    placeholder: "Attach a PDF to index and ask questions with Custom Vector DB citations...",
    description: "Upload PDF documents to index into Custom Vector DB and chat with source citations.",
  },
  {
    id: "ppt",
    label: "PPT",
    credits: -10,
    icon: Presentation,
    color: "text-purple-400 border-purple-500/30 bg-purple-500/10",
    placeholder: "Describe a topic for slide presentations and deck outlines...",
    description: "Generates structured slide presentations, deck outlines, and executive summaries.",
  },
  {
    id: "image",
    label: "Image Generator",
    credits: -10,
    icon: ImageIcon,
    color: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10",
    placeholder: "Describe the image or visual scene you want to generate...",
    description: "Generate creative image concepts, visual descriptions, and artistic prompts.",
  },
  {
    id: "imageAnalyzer",
    label: "Image Analyzer",
    credits: -10,
    icon: ImageIcon,
    color: "text-amber-400 border-amber-500/30 bg-amber-500/10",
    placeholder: "Attach an image to extract text, analyze charts, or explain diagrams...",
    description: "Multimodal Gemini image understanding: OCR text extraction, chart analysis, and visual reasoning.",
  },
  {
    id: "search",
    label: "Search",
    credits: -5,
    icon: Globe,
    color: "text-blue-400 border-blue-500/30 bg-blue-500/10",
    placeholder: "Search the web for latest news, facts, and live data...",
    description: "Searches the live web for real-time news, recent events, and up-to-date facts.",
  },
]

const trimPromptToTitle = (text) => {
  if (!text || typeof text !== "string") return "New Chat"
  const singleLine = text.replace(/\s+/g, " ").trim()
  if (!singleLine) return "New Chat"
  const formatted = singleLine.charAt(0).toUpperCase() + singleLine.slice(1)
  if (formatted.length <= 32) {
    return formatted
  }
  return formatted.slice(0, 30).trim() + "..."
}

const ChatInput = ({ sidebarCollapsed }) => {
  const [value, setValue] = useState("")
  const [loading, setLoading] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState("auto")
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const dropdownRef = useRef(null)
  const dispatch = useDispatch()
  const { selectedConversation } = useSelector((state) => state.conversation)
  const { messages } = useSelector((state) => state.message)
  const userData = useSelector((state) => state.user?.userData)

  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef(null)
  const baseTextRef = useRef("")

  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const imageInputRef = useRef(null)

  const [selectedPdf, setSelectedPdf] = useState(null)
  const pdfInputRef = useRef(null)

  const handleSelectImage = (file) => {
    if (!file) return
    if (!file.type.startsWith("image/")) {
      alert("Please upload a valid image file (PNG, JPG, WEBP, GIF)")
      return
    }
    if (file.size > 15 * 1024 * 1024) {
      alert("Image file size should be less than 15 MB")
      return
    }
    if (selectedPdf) {
      handleRemovePdf()
    }
    setSelectedImage(file)
    const url = URL.createObjectURL(file)
    setImagePreview(url)
    setSelectedAgent("imageAnalyzer")
    dispatch(setActiveArtifact({
      type: "image",
      title: file.name,
      imageUrl: url,
      size: file.size,
    }))
  }

  const handleRemoveImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview)
    }
    setSelectedImage(null)
    setImagePreview(null)
    if (imageInputRef.current) {
      imageInputRef.current.value = ""
    }
  }

  const handleSelectPdf = (file) => {
    if (!file) return
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      alert("Please upload a valid PDF document (.pdf)")
      return
    }
    if (file.size > 30 * 1024 * 1024) {
      alert("PDF file size should be less than 30 MB")
      return
    }
    if (selectedImage) {
      handleRemoveImage()
    }
    setSelectedPdf(file)
    setSelectedAgent("pdf")
    const pdfUrl = URL.createObjectURL(file)
    dispatch(setActiveArtifact({
      type: "pdf",
      title: file.name,
      pdfUrl: pdfUrl,
      size: file.size,
    }))
  }

  const handleRemovePdf = () => {
    setSelectedPdf(null)
    if (pdfInputRef.current) {
      pdfInputRef.current.value = ""
    }
  }

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview)
      }
    }
  }, [imagePreview])

  const handlePaste = (e) => {
    const items = e.clipboardData?.items
    if (!items) return
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        const file = items[i].getAsFile()
        if (file) {
          e.preventDefault()
          handleSelectImage(file)
          break
        }
      } else if (items[i].type === "application/pdf") {
        const file = items[i].getAsFile()
        if (file) {
          e.preventDefault()
          handleSelectPdf(file)
          break
        }
      }
    }
  }

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort()
        } catch { }
      }
    }
  }, [])

  const toggleListening = async () => {
    const SpeechRecognition =
      typeof window !== "undefined" &&
      (window.SpeechRecognition || window.webkitSpeechRecognition)

    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser. Please use Google Chrome, Microsoft Edge, or Safari.")
      return
    }

    if (isListening) {
      try {
        recognitionRef.current?.stop()
      } catch { }
      setIsListening(false)
      return
    }

    if (navigator?.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        stream.getTracks().forEach((track) => track.stop())
      } catch (micErr) {
        console.warn("Microphone access error:", micErr)
        alert("Microphone access was denied. Please allow microphone permission in your browser to use voice input.")
        setIsListening(false)
        return
      }
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort()
        } catch { }
      }

      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = navigator.language || "en-US"

      recognition.onstart = () => {
        setIsListening(true)
      }

      recognition.onresult = (event) => {
        let interimTranscript = ""
        let finalTranscript = ""

        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i]
          if (result.isFinal) {
            finalTranscript += result[0].transcript
          } else {
            interimTranscript += result[0].transcript
          }
        }

        const fullSpeech = (finalTranscript + interimTranscript).trim()
        const prefix = baseTextRef.current
        const combined = prefix
          ? prefix.endsWith(" ")
            ? prefix + fullSpeech
            : prefix + " " + fullSpeech
          : fullSpeech
        setValue(combined)
      }

      recognition.onerror = (event) => {
        console.warn("Speech recognition notice:", event.error)
        setIsListening(false)

        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          alert("Microphone permission was denied. Please allow microphone access in your browser settings.")
        } else if (event.error === "network") {
          alert(
            "Speech recognition network error.\n\n" +
            "Google's speech recognition server could not be reached. Common causes:\n" +
            "1. Brave Browser: Brave blocks Google speech by default. Go to brave://settings/system and enable 'Use Google services for speech recognition'.\n" +
            "2. Adblocker or Firewall: An adblocker (e.g. uBlock) or firewall may be blocking Google Speech API.\n" +
            "3. Offline or network interruption."
          )
        }
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current = recognition
      baseTextRef.current = value.trim() ? value.trim() + " " : ""
      recognition.start()
    } catch (err) {
      console.error("Could not start voice recognition:", err)
      setIsListening(false)
    }
  }

  useEffect(() => {
    const onInsert = (e) => {
      if (e.detail) setValue(e.detail)
    }
    window.addEventListener('insert-prompt', onInsert)
    return () => window.removeEventListener('insert-prompt', onInsert)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const activeAgentConfig = AGENTS.find((a) => a.id === selectedAgent) || AGENTS[0]

  const handleSendMessage = async () => {
    if (isListening) {
      try {
        recognitionRef.current?.stop()
      } catch { }
      setIsListening(false)
    }

    const promptText = value.trim()
    const imageToSend = selectedImage
    const pdfToSend = selectedPdf
    const previewToSend = imagePreview

    if ((!promptText && !imageToSend && !pdfToSend) || loading) return

    setLoading(true)
    setValue("")
    handleRemoveImage()
    handleRemovePdf()

    const effectivePrompt =
      promptText ||
      (pdfToSend
        ? "Please summarize this PDF document and provide the main key takeaways."
        : imageToSend
          ? "Analyze this image and describe all details, text, and visual features."
          : "")

    const currentList = Array.isArray(messages) ? messages : (messages?.messages || [])
    const trimmedTitle = trimPromptToTitle(
      pdfToSend ? `PDF: ${pdfToSend.name}` : effectivePrompt
    )
    const pendingUserMsg = {
      role: "user",
      content: pdfToSend
        ? `📄 **[PDF: ${pdfToSend.name}]**\n\n${effectivePrompt}`
        : effectivePrompt,
      images: previewToSend ? [previewToSend] : [],
      pdf: pdfToSend ? { name: pdfToSend.name, size: pdfToSend.size, url: URL.createObjectURL(pdfToSend) } : null,
    }
    const pendingAssistantMsg = { role: "assistant", content: "", isThinking: true }
    dispatch(setMessages([...currentList, pendingUserMsg, pendingAssistantMsg]))

    try {
      let convId = selectedConversation?._id
      const isNewChat = !convId || !selectedConversation?.title || selectedConversation?.title === "New Chat"
      if (!convId) {
        const convData = await createConversation({ title: trimmedTitle })
        const newConv = convData?.conversation || convData
        if (newConv?._id) {
          convId = newConv._id
          dispatch(addConversation(newConv))
          dispatch(setSelectedConversation(newConv))
        }
      } else if (isNewChat) {
        dispatch(updateConversationTitle({ id: convId, title: trimmedTitle }))
        updateConversationApi({ id: convId, title: trimmedTitle })
      }

      const payload = {
        prompt: effectivePrompt,
        conversationId: convId,
        agent: pdfToSend ? "pdfRag" : (imageToSend ? "imageAnalyzer" : selectedAgent.toLocaleLowerCase()),
        file: pdfToSend || imageToSend || undefined,
      }
      console.log(`Sending message with Agent: [${payload.agent}]`, payload)
      const resData = await sendMessage(payload)

      if (resData && typeof resData.credits === 'number') {
        dispatch(updateCredits(resData.credits))
      }


      getCurrentUser().then((freshUser) => {
        if (freshUser) {
          dispatch(setUserdata(freshUser))
        }
      }).catch((err) => {
        console.warn("Failed to live-sync user credits:", err)
      })

      if (resData?.error === "Insufficient credits") {
        getCurrentUser().then((freshUser) => {
          if (freshUser) dispatch(setUserdata(freshUser))
        }).catch(() => { })
        dispatch(
          setMessages([
            ...currentList,
            pendingUserMsg,
            {
              role: "assistant",
              content: `⚠️ **${resData.message || "Insufficient credits. Please upgrade your plan in Billing & Subscription to continue."}**`,
              isThinking: false,
            },
          ])
        )
        return
      }

      if (resData?.artifacts && Array.isArray(resData.artifacts) && resData.artifacts.length > 0) {
        dispatch(setActiveArtifact(resData.artifacts[0]))
      }

      if (convId) {
        const data = await getMessages(convId)
        const fetchedList = Array.isArray(data) ? data : (data?.messages || [])
        if (fetchedList.length > 0) {
          dispatch(setMessages(fetchedList))
        } else if (resData?.response) {
          dispatch(
            setMessages([
              ...currentList,
              pendingUserMsg,
              {
                role: "assistant",
                content: resData.response,
                images: resData?.images || [],
                artifacts: resData?.artifacts || [],
                isThinking: false
              },
            ])
          )
        }
      } else if (resData?.response) {
        dispatch(
          setMessages([
            ...currentList,
            pendingUserMsg,
            {
              role: "assistant",
              content: resData.response,
              images: resData?.images || [],
              artifacts: resData?.artifacts || [],
              isThinking: false
            },
          ])
        )
      }
    } catch (error) {
      console.error("Error sending message:", error)
      getCurrentUser().then((freshUser) => {
        if (freshUser) dispatch(setUserdata(freshUser))
      }).catch(() => { })
      dispatch(
        setMessages([
          ...currentList,
          pendingUserMsg,
          {
            role: "assistant",
            content: "Sorry, I encountered an error while processing your request. Please try again.",
            isThinking: false,
          },
        ])
      )
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (!loading) {
        handleSendMessage()
      }
    }
  }

  return (
    <div className="w-full overflow-visible px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 border-t border-slate-200 dark:border-white/[0.06] bg-white/90 dark:bg-[#0d0f14] backdrop-blur-md shrink-0 transition-colors duration-300 relative">
      <div className="w-full max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto flex flex-col gap-1.5 relative">
        <AnimatePresence>
          {isListening && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              className="flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs w-fit mx-auto shadow-lg shadow-rose-500/10 backdrop-blur-md"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
              <span className="font-medium tracking-wide">Listening... Speak now</span>
              <button
                type="button"
                onClick={toggleListening}
                className="ml-1 text-[11px] underline opacity-80 hover:opacity-100 cursor-pointer text-rose-600 dark:text-rose-200"
              >
                Done
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Selected Image Preview Thumbnail */}
        <AnimatePresence>
          {selectedImage && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              onClick={() => {
                dispatch(setActiveArtifact({
                  type: 'image',
                  title: selectedImage.name,
                  imageUrl: imagePreview,
                  size: selectedImage.size
                }))
              }}
              className="relative flex items-center gap-3 p-2 bg-white/95 dark:bg-[#141620] border border-slate-200 hover:border-indigo-400 dark:border-white/[0.1] dark:hover:border-indigo-500/50 rounded-2xl shadow-xl w-fit max-w-sm cursor-pointer group transition-all"
              title="Click to view in Artifact panel"
            >
              <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 shrink-0 bg-slate-100 dark:bg-black/40 group-hover:scale-105 transition-transform">
                <img
                  src={imagePreview}
                  alt="Upload preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col min-w-0 pr-6">
                <span className="text-[12.5px] font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[190px] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {selectedImage.name}
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] text-slate-500 font-mono">
                    {(selectedImage.size / 1024).toFixed(0)} KB
                  </span>
                  <span className="text-[9.5px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                    Gemini Vision
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleRemoveImage()
                }}
                className="absolute top-2 right-2 p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                title="Remove image"
              >
                <X size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Selected PDF Preview Card */}
        <AnimatePresence>
          {selectedPdf && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              onClick={() => {
                const pdfUrl = URL.createObjectURL(selectedPdf)
                dispatch(setActiveArtifact({
                  type: 'pdf',
                  title: selectedPdf.name,
                  pdfUrl: pdfUrl,
                  size: selectedPdf.size
                }))
              }}
              className="relative flex items-center gap-3 p-2 bg-white/95 dark:bg-[#141620] border border-rose-500/30 hover:border-rose-500 dark:border-rose-500/25 dark:hover:border-rose-500/60 rounded-2xl shadow-xl w-fit max-w-sm cursor-pointer group transition-all"
              title="Click to view PDF in Artifact panel"
            >
              <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-rose-500/20 shrink-0 bg-rose-500/10 text-rose-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                <FileText size={22} className="text-rose-500" />
              </div>
              <div className="flex flex-col min-w-0 pr-6">
                <span className="text-[12.5px] font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[190px] group-hover:text-rose-500 transition-colors">
                  {selectedPdf.name}
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] text-slate-500 font-mono">
                    {(selectedPdf.size / 1024).toFixed(0)} KB
                  </span>
                  <span className="text-[9.5px] font-medium text-rose-600 dark:text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                    Custom Vector DB
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleRemovePdf()
                }}
                className="absolute top-2 right-2 p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                title="Remove PDF"
              >
                <X size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={`w-full flex items-center gap-2 rounded-2xl px-3 py-2 transition-all duration-300 relative z-20 border ${isListening
          ? "border-rose-500/40 bg-rose-500/[0.06] dark:bg-rose-500/[0.03] ring-1 ring-rose-500/20 shadow-lg shadow-rose-500/10"
          : "bg-slate-100/90 dark:bg-white/[0.03] border-slate-200 dark:border-white/[0.07] focus-within:border-indigo-400 dark:focus-within:border-indigo-500/20 focus-within:bg-white dark:focus-within:bg-white/[0.04] shadow-xs"
          }`}>

          <div className="relative shrink-0" ref={dropdownRef}>
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setDropdownOpen((prev) => !prev)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer select-none shrink-0 ${dropdownOpen
                ? "bg-indigo-500/15 dark:bg-indigo-500/20 border-indigo-400 dark:border-indigo-500/40 text-indigo-700 dark:text-indigo-200 ring-1 ring-indigo-500/30"
                : "bg-white dark:bg-white/[0.04] border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.15] shadow-xs"
                }`}
              title="Click to select AI Agent"
            >
              <Plus size={14} className="text-indigo-500 dark:text-indigo-400 shrink-0" />
              <span className="text-[12.5px] font-medium text-slate-700 dark:text-slate-200">{activeAgentConfig.label}</span>
            </motion.button>

            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 8 }}
                  transition={{ duration: 0.16, ease: "easeOut" }}
                  className="absolute bottom-full mb-2 left-0 z-100 w-72 sm:w-100 bg-white/95 dark:bg-[#12141c]/95 backdrop-blur-xl border border-slate-200 dark:border-white/[0.12] rounded-2xl p-2 shadow-2xl shadow-slate-900/10 dark:shadow-black/80 flex flex-col gap-1"
                >
                  <div className="px-3 py-2 border-b border-slate-200 dark:border-white/[0.06] flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Select AI Agent
                    </span>
                    <span className="text-[10.5px] text-indigo-600 dark:text-indigo-400 font-mono font-medium">
                      {AGENTS.length} Agents
                    </span>
                  </div>

                  <div className="max-h-96 overflow-y-auto flex flex-col gap-1 py-1 hide-scrollbar">
                    {AGENTS.map((item) => {
                      const Icon = item.icon
                      const isSelected = selectedAgent === item.id

                      return (
                        <motion.button
                          key={item.id}
                          type="button"
                          whileHover={{ x: 3 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            console.log(`Agent Selected: ${item.label} (${item.id})`)
                            setSelectedAgent(item.id)
                            setDropdownOpen(false)
                          }}
                          className={`flex items-start gap-2.5 p-2 rounded-xl text-left transition-colors cursor-pointer ${isSelected
                            ? "bg-indigo-500/10 dark:bg-indigo-500/15 border border-indigo-400/40 dark:border-indigo-500/30 text-indigo-950 dark:text-slate-100"
                            : "bg-transparent border border-transparent hover:bg-slate-100 dark:hover:bg-white/[0.05] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                            }`}
                        >
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center border shrink-0 mt-0.5 ${item.color}`}
                          >
                            <Icon size={14} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1.5">
                              <span className="text-[12.5px] font-semibold truncate">
                                {item.label}
                              </span>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-[10px] font-medium text-amber-500 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-md">
                                  {item.credits} credits / request
                                </span>

                                {isSelected && (
                                  <Check
                                    size={13}
                                    className="text-emerald-500 dark:text-emerald-400"
                                  />
                                )}
                              </div>
                            </div>

                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                              {item.description}
                            </p>
                          </div>
                        </motion.button>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <input
            ref={pdfInputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleSelectPdf(e.target.files[0])
              }
              e.target.value = ""
            }}
          />

          <motion.button
            type="button"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => pdfInputRef.current?.click()}
            className={`shrink-0 flex items-center justify-center w-8 h-8 rounded-lg transition-colors cursor-pointer ${
              selectedPdf
                ? "text-rose-500 bg-rose-500/15 border border-rose-500/30 shadow-xs"
                : "text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-slate-200/60 dark:hover:bg-white/[0.05] border border-transparent hover:border-slate-300 dark:hover:border-white/[0.06]"
            }`}
            title="Upload PDF document (Custom Vector DB RAG)"
            aria-label="Upload PDF"
          >
            <Paperclip size={16} />
          </motion.button>

          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleSelectImage(e.target.files[0])
              }
              e.target.value = ""
            }}
          />

          <motion.button
            type="button"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => imageInputRef.current?.click()}
            className={`shrink-0 flex items-center justify-center w-8 h-8 rounded-lg transition-colors cursor-pointer ${
              selectedImage
                ? "text-amber-500 bg-amber-500/15 border border-amber-500/30 shadow-xs"
                : "text-slate-400 dark:text-slate-500 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-slate-200/60 dark:hover:bg-white/[0.05] border border-transparent hover:border-slate-300 dark:hover:border-white/[0.06]"
            }`}
            title="Upload image to analyze (charts, OCR, diagrams)"
            aria-label="Upload image"
          >
            <ImageIcon size={16} />
          </motion.button>

          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={
              isListening
                ? "Listening to your voice... (speak now into your microphone)"
                : selectedPdf
                  ? "Ask anything about this PDF (or press Enter to summarize)..."
                  : selectedImage
                    ? "Ask about this image (or press Enter to analyze)..."
                    : (activeAgentConfig?.placeholder || "Ask Anything...")
            }
            rows={1}
            className="flex-1 min-w-0 bg-transparent outline-none resize-none text-[14px] text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 leading-relaxed [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          />

          <motion.button
            type="button"
            onClick={toggleListening}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={`shrink-0 flex items-center justify-center w-8 h-8 rounded-lg transition-all cursor-pointer ${isListening
              ? "bg-rose-500/20 text-rose-500 dark:text-rose-400 border border-rose-500/40 shadow-lg shadow-rose-500/20 animate-pulse"
              : "text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-white/[0.05] border border-transparent hover:border-slate-300 dark:hover:border-white/[0.06] transition-colors"
              }`}
            title={isListening ? "Listening... Click to stop" : "Voice input"}
            aria-label={isListening ? "Stop voice input" : "Start voice input"}
          >
            {isListening ? <MicOff size={16} /> : <Mic size={16} />}
          </motion.button>

          <motion.button
            type="button"
            whileHover={{ scale: (!value.trim() && !selectedImage && !selectedPdf) || loading ? 1 : 1.08 }}
            whileTap={{ scale: (!value.trim() && !selectedImage && !selectedPdf) || loading ? 1 : 0.92 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            disabled={(!value.trim() && !selectedImage && !selectedPdf) || loading}
            className={`shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-linear-to-br from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 text-white shadow-lg shadow-indigo-500/20 transition-opacity cursor-pointer ${
              (!value.trim() && !selectedImage && !selectedPdf) || loading ? 'opacity-35 cursor-not-allowed' : 'opacity-100 cursor-pointer'
            }`}
            onClick={handleSendMessage}
            title="Send message"
            aria-label="Send message"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
          </motion.button>
        </div>
      </div>
    </div>
  )
}

export default ChatInput