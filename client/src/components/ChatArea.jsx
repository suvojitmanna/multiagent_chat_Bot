import React from 'react'
import Nav from './Nav'
import MessageList from './MessageList'
import ChatInput from './ChatInput'

const ChatArea = () => {
  return (
    <div className='flex-1 flex flex-col'>
      <Nav/>
      <MessageList/>
      <ChatInput/>
    </div>
  )
}

export default ChatArea