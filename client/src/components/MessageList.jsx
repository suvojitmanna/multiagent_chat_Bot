import React, { useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import MessageBuble from './MessageBuble'
import { Sparkles, MessageSquareCode, Compass, Lightbulb, Bot, Loader2 } from 'lucide-react'

const SUGGESTIONS = [
  { icon: MessageSquareCode, label: "Write a React component" },
  { icon: Compass, label: "Explain microservice architecture" },
  { icon: Lightbulb, label: "Brainstorm startup ideas" },
  { icon: Bot, label: "Debug an asynchronous error" },
]

const MessageList = ({ sidebarCollapsed, loading }) => {
  const { selectedConversation } = useSelector((state) => state.conversation)
  const { messages } = useSelector((state) => state.message)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSuggestionClick = (prompt) => {
    window.dispatchEvent(new CustomEvent('insert-prompt', { detail: prompt }))
  }

  const messageList = Array.isArray(messages) ? messages : (messages?.messages || [])

  return (
    <div className="flex-1 overflow-y-auto px-3 sm:px-4 md:px-6 py-2 sm:py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden overscroll-contain transition-all duration-300">
      <div className="w-full max-w-4xl lg:max-w-5xl xl:max-w-6xl min-h-full flex flex-col justify-start">
        {loading && (!messageList || messageList.length === 0) ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-2 py-4 sm:py-6 my-auto">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3 shadow-lg shadow-indigo-500/10 animate-pulse">
              <Loader2 size={20} className="animate-spin text-indigo-400" />
            </div>
            <p className="text-xs font-medium text-slate-400">
              Loading conversation...
            </p>
          </div>
        ) : (!messageList || messageList.length === 0) ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-2 py-4 sm:py-6 my-auto">
            <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-linear-to-br from-indigo-500/20 to-violet-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-3 shadow-lg shadow-indigo-500/10">
              <Sparkles size={22} className="sm:size-[24px]" />
            </div>

            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-100 tracking-tight">
              ShifraAI
            </h2>

            <p className="text-xs sm:text-sm font-medium text-slate-300 mt-0.5">
              How can I help you today?
            </p>

            <p className="text-[11.5px] sm:text-xs text-slate-500 max-w-sm sm:max-w-md mt-1 leading-relaxed">
              Ask me anything — code, system design, creative ideas, or quick technical questions.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-5 sm:mt-6 w-full max-w-lg px-1">
              {SUGGESTIONS.map((item, i) => {
                const IconComponent = item.icon
                return (
                  <button
                    key={i}
                    onClick={() => handleSuggestionClick(item.label)}
                    className="flex items-center gap-2.5 text-left text-xs sm:text-[13px] text-slate-300 hover:text-white bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] hover:border-indigo-500/30 px-3 py-2 rounded-xl transition-all duration-150 cursor-pointer group active:scale-[0.99]"
                  >
                    <div className="p-1.5 rounded-lg bg-white/[0.04] text-slate-400 group-hover:text-indigo-400 group-hover:bg-indigo-500/10 transition-colors shrink-0">
                      <IconComponent size={13} />
                    </div>
                    <span className="truncate">{item.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="w-full flex flex-col space-y-2 pt-0.5 pb-4">
            {messageList.map((msg, i) => (
              <MessageBuble
                key={msg?._id || `${msg?.role || 'msg'}-${i}`}
                role={msg?.role}
                content={msg?.content}
                images={msg?.images}
                isThinking={msg?.isThinking}
                sidebarCollapsed={sidebarCollapsed}
              />
            ))}
            <div ref={messagesEndRef} className="h-1.5" />
          </div>
        )}
      </div>
    </div>
  )
}

export default MessageList