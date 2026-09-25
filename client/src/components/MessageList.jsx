import React, { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import MessageBuble from './MessageBuble'
import { Sparkles, MessageSquareCode, Compass, Lightbulb, Bot, Loader2, ArrowDown } from 'lucide-react'

const SUGGESTIONS = [
  { icon: MessageSquareCode, label: "Write a React component" },
  { icon: Compass, label: "Explain microservice architecture" },
  { icon: Lightbulb, label: "Brainstorm startup ideas" },
  { icon: Bot, label: "Debug an asynchronous error" },
]

const MessageList = ({ sidebarCollapsed, loading }) => {
  const { messages } = useSelector((state) => state.message)
  const messagesEndRef = useRef(null)
  const scrollContainerRef = useRef(null)
  const [showScrollBottom, setShowScrollBottom] = useState(false)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleScroll = (e) => {
    const el = e.currentTarget
    const isUp = el.scrollHeight - el.scrollTop - el.clientHeight > 120
    setShowScrollBottom(isUp)
  }

  const handleSuggestionClick = (prompt) => {
    window.dispatchEvent(new CustomEvent('insert-prompt', { detail: prompt }))
  }

  const messageList = Array.isArray(messages) ? messages : (messages?.messages || [])

  return (
    <div
      ref={scrollContainerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto px-3 sm:px-4 md:px-6 py-2 sm:py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden overscroll-contain transition-all duration-300 relative"
    >
      <div className="w-full max-w-4xl lg:max-w-5xl xl:max-w-6xl min-h-full flex flex-col justify-start">
        {loading && (!messageList || messageList.length === 0) ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col items-center justify-center text-center px-2 py-4 sm:py-6 my-auto"
          >
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 dark:text-indigo-400 mb-3 shadow-lg shadow-indigo-500/10 animate-pulse">
              <Loader2 size={20} className="animate-spin text-indigo-500 dark:text-indigo-400" />
            </div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Loading conversation...
            </p>
          </motion.div>
        ) : (!messageList || messageList.length === 0) ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="flex-1 flex flex-col items-center justify-center text-center px-2 py-4 sm:py-6 my-auto"
          >
            <motion.div
              initial={{ scale: 0.7, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 20 }}
              className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-linear-to-br from-indigo-500/20 to-violet-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-500 dark:text-indigo-400 mb-3 shadow-lg shadow-indigo-500/10"
            >
              <Sparkles size={22} className="sm:size-[24px]" />
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg sm:text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight"
            >
              ShifraAI
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mt-0.5"
            >
              How can I help you today?
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-[11.5px] sm:text-xs text-slate-500 max-w-sm sm:max-w-md mt-1 leading-relaxed"
            >
              Ask me anything — code, system design, creative ideas, or quick technical questions.
            </motion.p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-5 sm:mt-6 w-full max-w-lg px-1">
              {SUGGESTIONS.map((item, i) => {
                const IconComponent = item.icon
                return (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.07, duration: 0.25 }}
                    whileHover={{ scale: 1.02, x: 2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSuggestionClick(item.label)}
                    className="flex items-center gap-2.5 text-left text-xs sm:text-[13px] text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-white hover:bg-slate-50 dark:bg-white/[0.03] dark:hover:bg-white/[0.07] border border-slate-200 dark:border-white/[0.06] hover:border-indigo-300 dark:hover:border-indigo-500/40 px-3 py-2 rounded-xl transition-colors cursor-pointer group shadow-xs dark:shadow-none"
                  >
                    <div className="p-1.5 rounded-lg bg-slate-100 group-hover:bg-indigo-50 text-slate-500 group-hover:text-indigo-600 dark:bg-white/[0.04] dark:text-slate-400 dark:group-hover:text-indigo-400 dark:group-hover:bg-indigo-500/10 transition-colors shrink-0">
                      <IconComponent size={13} />
                    </div>
                    <span className="truncate">{item.label}</span>
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        ) : (
          <div className="w-full flex flex-col space-y-2 pt-0.5 pb-4">
            <AnimatePresence initial={false}>
              {messageList.map((msg, i) => (
                <motion.div
                  key={msg?._id || `${msg?.role || 'msg'}-${i}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                >
                  <MessageBuble
                    role={msg?.role}
                    content={msg?.content}
                    images={msg?.images}
                    artifacts={msg?.artifacts}
                    isThinking={msg?.isThinking}
                    sidebarCollapsed={sidebarCollapsed}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} className="h-1.5" />
          </div>
        )}
      </div>

      <AnimatePresence>
        {showScrollBottom && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })}
            className="fixed bottom-20 right-6 z-30 flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600/90 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400/30 backdrop-blur-md cursor-pointer transition-colors"
            title="Scroll to bottom"
          >
            <ArrowDown size={15} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}

export default MessageList