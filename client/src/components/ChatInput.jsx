import {
  Mic,
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
} from 'lucide-react'
import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDispatch, useSelector } from 'react-redux'
import { sendMessage } from '../features/sendMessage'
import { getMessages } from '../features/getMessages'
import { setMessages, setActiveArtifact } from '../redux/messageSlice'
import { createConversation } from '../features/createConverSation'
import { addConversation, setSelectedConversation, updateConversationTitle } from '../redux/conversationSlice'
import { updateConversation as updateConversationApi } from '../features/updateConversation'

const AGENTS = [
  {
    id: "auto",
    label: "Auto",
    icon: Zap,
    color: "text-amber-400 border-amber-500/30 bg-amber-500/10",
    placeholder: "Ask anything... (Auto will route to the best agent)",
    description: "Dynamically classifies your query and selects the most capable agent automatically.",
  },
  {
    id: "chat",
    label: "Chat",
    icon: MessageSquare,
    color: "text-indigo-400 border-indigo-500/30 bg-indigo-500/10",
    placeholder: "Chat, brainstorm ideas, ask general questions...",
    description: "General discussion, smart explanations, educational help, and multi-turn conversations.",
  },
  {
    id: "coding",
    label: "Coding",
    icon: Code2,
    color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
    placeholder: "Ask for code, debug errors, explain architecture...",
    description: "Write clean code, debug syntax, explain complex algorithms, and architect full-stack apps.",
  },
  {
    id: "pdf",
    label: "PDF",
    icon: FileText,
    color: "text-rose-400 border-rose-500/30 bg-rose-500/10",
    placeholder: "Ask questions about documents, reports, or PDF context...",
    description: "Understand, summarize, extract key insights, and answer questions from documents and PDFs.",
  },
  {
    id: "ppt",
    label: "PPT",
    icon: Presentation,
    color: "text-purple-400 border-purple-500/30 bg-purple-500/10",
    placeholder: "Describe a topic for slide presentations and deck outlines...",
    description: "Generates structured slide presentations, deck outlines, and executive summaries.",
  },
  {
    id: "image",
    label: "Image",
    icon: ImageIcon,
    color: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10",
    placeholder: "Describe the image or visual scene you want to generate...",
    description: "Generate creative image concepts, visual descriptions, and artistic prompts.",
  },
  {
    id: "search",
    label: "Search",
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
    const promptText = value.trim()
    if (!promptText || loading) return

    setLoading(true)
    setValue("")

    const currentList = Array.isArray(messages) ? messages : (messages?.messages || [])
    const trimmedTitle = trimPromptToTitle(promptText)
    const pendingUserMsg = { role: "user", content: promptText }
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
        prompt: promptText,
        conversationId: convId,
        agent: selectedAgent.toLocaleLowerCase(),
      }
      console.log(`Sending message with Agent: [${selectedAgent}]`, payload)
      const resData = await sendMessage(payload)

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
    <div className="w-full overflow-visible px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 border-t border-white/[0.06] bg-[#0d0f14] shrink-0 transition-all duration-300 relative">
      <div className="w-full max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto flex flex-col gap-1.5 relative">
        <div className="w-full flex items-center gap-2 bg-white/[0.03] border border-white/[0.07] rounded-2xl px-3 py-2 transition-all duration-300 focus-within:border-indigo-500/20 focus-within:bg-white/[0.04] relative z-20">

          <div className="relative shrink-0" ref={dropdownRef}>
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setDropdownOpen((prev) => !prev)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer select-none shrink-0 ${dropdownOpen
                ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-200 ring-1 ring-indigo-500/30"
                : "bg-white/[0.04] border-white/[0.08] text-slate-200 hover:bg-white/[0.08] hover:border-white/[0.15]"
                }`}
              title="Click to select AI Agent"
            >
              <Plus size={14} className="text-indigo-400 shrink-0" />
              <span className="text-[12.5px] font-medium text-slate-200">{activeAgentConfig.label}</span>
            </motion.button>

            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 8 }}
                  transition={{ duration: 0.16, ease: "easeOut" }}
                  className="absolute bottom-full mb-2 left-0 z-100 w-72 sm:w-100 bg-[#12141c]/95 backdrop-blur-xl border border-white/[0.12] rounded-2xl p-2 shadow-2xl shadow-black/80 flex flex-col gap-1"
                >
                  <div className="px-3 py-2 border-b border-white/[0.06] flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Select AI Agent
                    </span>
                    <span className="text-[10.5px] text-indigo-400 font-mono">
                      {AGENTS.length} Agents
                    </span>
                  </div>

                  <div className="max-h-98` overflow-y-auto flex flex-col gap-1 py-1 hide-scrollbar">
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
                            ? "bg-indigo-500/15 border border-indigo-500/30 text-slate-100"
                            : "bg-transparent border border-transparent hover:bg-white/[0.05] text-slate-300 hover:text-white"
                            }`}
                        >
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center border shrink-0 mt-0.5 ${item.color}`}>
                            <Icon size={14} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1.5">
                              <span className="text-[12.5px] font-semibold truncate">
                                {item.label}
                              </span>
                              {isSelected && (
                                <Check size={13} className="text-emerald-400 shrink-0" />
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
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

          <motion.button
            type="button"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="shrink-0 flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/[0.05] border border-transparent hover:border-white/[0.06] transition-colors cursor-pointer"
            title="Attach file"
            aria-label="Attach file"
          >
            <Paperclip size={16} />
          </motion.button>

          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={activeAgentConfig?.placeholder || "Ask Anything..."}
            rows={1}
            className="flex-1 min-w-0 bg-transparent outline-none resize-none text-[14px] text-slate-200 placeholder:text-slate-500 leading-relaxed [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          />

          <motion.button
            type="button"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="shrink-0 flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/[0.05] border border-transparent hover:border-white/[0.06] transition-colors cursor-pointer"
            title="Voice input"
            aria-label="Voice input"
          >
            <Mic size={16} />
          </motion.button>

          <motion.button
            type="button"
            whileHover={{ scale: !value.trim() || loading ? 1 : 1.08 }}
            whileTap={{ scale: !value.trim() || loading ? 1 : 0.92 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            disabled={!value.trim() || loading}
            className={`shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-linear-to-br from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 text-white shadow-lg shadow-indigo-500/20 transition-opacity cursor-pointer ${!value.trim() || loading ? 'opacity-35 cursor-not-allowed' : 'opacity-100 cursor-pointer'
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