import React, { useEffect, useRef, useState } from 'react'
import Nav from './Nav'
import MessageList from './MessageList'
import ChatInput from './ChatInput'
import { useDispatch, useSelector } from 'react-redux'
import { getMessages } from '../features/getMessages'
import { setMessages } from '../redux/messageSlice'

const ChatArea = ({ sidebarCollapsed, onToggleSidebar }) => {
  const { selectedConversation } = useSelector((state) => state.conversation)
  const { messages } = useSelector((state) => state.message)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const dispatch = useDispatch()
  const activeConvIdRef = useRef(null)
  const messagesRef = useRef(messages)

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  useEffect(() => {
    const currentId = selectedConversation?._id

    const messageList = Array.isArray(messagesRef.current)
      ? messagesRef.current
      : messagesRef.current?.messages || []
    const isCurrentlyThinking = messageList.some((m) => m?.isThinking)
    if (isCurrentlyThinking) {
      activeConvIdRef.current = currentId
      return
    }

    if (currentId && activeConvIdRef.current === currentId && messageList.length > 0) {
      return
    }
    activeConvIdRef.current = currentId

    const fetchConversationMessages = async () => {
      if (currentId) {
        setLoadingMessages(true)
        try {
          const data = await getMessages(currentId)
          dispatch(setMessages(data))
        } catch (error) {
          console.error("Error loading messages:", error)
        } finally {
          setLoadingMessages(false)
        }
      } else {
        dispatch(setMessages([]))
      }
    }
    fetchConversationMessages()
  }, [selectedConversation?._id, dispatch])

  return (
    <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative w-full bg-slate-50 dark:bg-[#0d0f14] transition-all duration-300 ease-in-out">
      <Nav
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={onToggleSidebar}
      />
      <MessageList sidebarCollapsed={sidebarCollapsed} loading={loadingMessages} />
      <ChatInput sidebarCollapsed={sidebarCollapsed} />
    </main>
  )
}

export default ChatArea