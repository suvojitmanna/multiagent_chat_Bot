import React, { useEffect } from 'react'
import Nav from './Nav'
import MessageList from './MessageList'
import ChatInput from './ChatInput'
import { useDispatch, useSelector } from 'react-redux'
import { getMessages } from '../features/getMessages'
import { setMessages } from '../redux/messageSlice'

const ChatArea = ({ sidebarCollapsed, onToggleSidebar }) => {
  const { selectedConversation } = useSelector((state) => state.conversation)
  const dispatch = useDispatch()

  useEffect(() => {
    const fetchConversationMessages = async () => {
      if (selectedConversation?._id) {
        try {
          const data = await getMessages(selectedConversation._id)
          dispatch(setMessages(data))
        } catch (error) {
          console.error("Error loading messages:", error)
        }
      } else {
        dispatch(setMessages([]))
      }
    }
    fetchConversationMessages()
  }, [selectedConversation?._id, dispatch])

  return (
    <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative w-full bg-[#0d0f14] transition-all duration-300 ease-in-out">
      <Nav
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={onToggleSidebar}
      />
      <MessageList sidebarCollapsed={sidebarCollapsed} />
      <ChatInput sidebarCollapsed={sidebarCollapsed} />
    </main>
  )
}

export default ChatArea