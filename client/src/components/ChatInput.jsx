import { Mic, Paperclip, Send, Loader2 } from 'lucide-react'
import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { sendMessage } from '../features/sendMessage'
import { getMessages } from '../features/getMessages'
import { setMessages } from '../redux/messageSlice'
import { createConversation } from '../features/createConverSation'
import { addConversation, setSelectedConversation } from '../redux/conversationSlice'

const ChatInput = ({ sidebarCollapsed }) => {
  const [value, setValue] = useState("")
  const [loading, setLoading] = useState(false)
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

  const handleSendMessage = async () => {
    const promptText = value.trim()
    if (!promptText || loading) return

    setLoading(true)
    setValue("")

    try {
      let convId = selectedConversation?._id

      if (!convId) {
        const convData = await createConversation()
        const newConv = convData?.conversation || convData
        if (newConv?._id) {
          dispatch(addConversation(newConv))
          dispatch(setSelectedConversation(newConv))
          convId = newConv._id
        }
      }

      const currentList = Array.isArray(messages) ? messages : (messages?.messages || [])
      dispatch(
        setMessages([
          ...currentList,
          { role: "user", content: promptText },
          { role: "assistant", content: "", isThinking: true },
        ])
      )

      const payload = {
        prompt: promptText,
        conversationId: convId,
      }
      const resData = await sendMessage(payload)

      if (convId) {
        const data = await getMessages(convId)
        if (data && (Array.isArray(data) ? data.length > 0 : data?.messages?.length > 0)) {
          dispatch(setMessages(data))
        } else if (resData?.response) {
          dispatch(
            setMessages([
              ...currentList,
              { role: "user", content: promptText },
              { role: "assistant", content: resData.response, isThinking: false },
            ])
          )
        }
      } else if (resData?.response) {
        dispatch(
          setMessages([
            ...currentList,
            { role: "user", content: promptText },
            { role: "assistant", content: resData.response, isThinking: false },
          ])
        )
      }
    } catch (error) {
      console.error("Error sending message:", error)
      if (selectedConversation?._id) {
        const data = await getMessages(selectedConversation._id)
        if (data && (Array.isArray(data) ? data.length > 0 : data?.messages?.length > 0)) {
          dispatch(setMessages(data))
        }
      }
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
    <div className="w-full overflow-hidden px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 border-t border-white/[0.06] bg-[#0d0f14] shrink-0 transition-all duration-300">
      <div className="w-full max-w-4xl lg:max-w-5xl xl:max-w-6xl flex items-center gap-2 bg-white/[0.03] border border-white/[0.07] rounded-2xl px-3 py-2 transition-all duration-300 focus-within:border-indigo-500/20 focus-within:bg-white/[0.04]">
        <button
          type="button"
          className="shrink-0 flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/[0.05] border border-transparent hover:border-white/[0.06] transition-all duration-150 cursor-pointer"
        >
          <Paperclip size={16} />
        </button>

        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Anything..."
          rows={1}
          className="flex-1 min-w-0 bg-transparent outline-none resize-none text-[14px] text-slate-200 placeholder:text-slate-500 leading-relaxed [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        />

        <button
          type="button"
          className="shrink-0 flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/[0.05] border border-transparent hover:border-white/[0.06] transition-all duration-150 cursor-pointer"
        >
          <Mic size={16} />
        </button>

        <button
          type="button"
          disabled={!value.trim() || loading}
          className={`shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-linear-to-br from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 text-white shadow-lg shadow-indigo-500/20 transition-all duration-200 active:scale-95 cursor-pointer ${
            !value.trim() || loading ? 'opacity-35 cursor-not-allowed' : 'opacity-100 cursor-pointer'
          }`}
          onClick={handleSendMessage}
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
        </button>
      </div>
    </div>
  )
}

export default ChatInput