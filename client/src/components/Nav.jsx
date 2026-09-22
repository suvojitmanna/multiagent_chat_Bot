import React from 'react'
import { MessageSquare, Plus, Sparkles, PanelLeftOpen, Trash2 } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { setSelectedConversation, removeConversation } from '../redux/conversationSlice'
import { deleteConversation as deleteConversationApi } from '../features/deleteConversation'

const Nav = ({ sidebarCollapsed, onToggleSidebar }) => {
    const dispatch = useDispatch()
    const { selectedConversation } = useSelector((state) => state.conversation)
    const { messages } = useSelector((state) => state.message)
    const messageList = Array.isArray(messages) ? messages : (messages?.messages || [])
    const userMessageCount = messageList.filter((m) => m?.role === "user").length

    const handleNewChat = () => {
        dispatch(setSelectedConversation(null))
    }

    const handleDeleteActiveChat = async () => {
        if (!selectedConversation?._id) return
        const idToDelete = selectedConversation._id
        dispatch(removeConversation(idToDelete))
        try {
            await deleteConversationApi(idToDelete)
        } catch (error) {
            console.error("Error deleting active chat:", error)
        }
    }

    return (
        <header className="h-13 sm:h-14 border-b border-white/[0.06] bg-[#0d0f14]/80 backdrop-blur-md sticky top-0 z-20 shrink-0 w-full transition-all duration-300">
            <div className="w-full max-w-4xl lg:max-w-5xl xl:max-w-6xl h-full flex items-center justify-between gap-2.5 px-3 sm:px-4 md:px-6">
                <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
                    {sidebarCollapsed && onToggleSidebar && (
                        <button
                            type="button"
                            onClick={onToggleSidebar}
                            className="flex lg:hidden items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/[0.06] transition-colors cursor-pointer shrink-0 mr-1"
                            title="Expand sidebar"
                            aria-label="Expand sidebar"
                        >
                            <PanelLeftOpen size={18} />
                        </button>
                    )}

                    <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 shrink-0">
                        {selectedConversation ? (
                            <MessageSquare size={13} className="text-indigo-400" />
                        ) : (
                            <Sparkles size={13} className="text-indigo-400" />
                        )}
                    </div>

                    <h1 className="text-[13.5px] sm:text-[14.5px] font-semibold text-slate-100 tracking-tight truncate min-w-0">
                        {selectedConversation?.title || "New Chat"}
                    </h1>

                    {(selectedConversation || userMessageCount > 0) && (
                        <span className="inline-flex items-center gap-1 text-[10.5px] sm:text-[11px] font-medium text-slate-400 bg-white/[0.04] border border-white/[0.07] px-2 py-0.5 rounded-full shrink-0">
                            <span className="text-indigo-400 font-semibold">{userMessageCount}</span>
                            <span className="hidden sm:inline">{userMessageCount === 1 ? "user message" : "user messages"}</span>
                            <span className="sm:hidden">{userMessageCount === 1 ? "user msg" : "user msgs"}</span>
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                    {selectedConversation?._id && (
                        <button
                            type="button"
                            onClick={handleDeleteActiveChat}
                            className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-400 bg-white/[0.04] hover:bg-rose-500/10 border border-white/[0.07] hover:border-rose-500/20 transition-all duration-150 cursor-pointer"
                            title="Delete this chat"
                            aria-label="Delete this chat"
                        >
                            <Trash2 size={13} />
                            <span className="hidden sm:inline">Delete</span>
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={handleNewChat}
                        className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-slate-100 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] transition-all duration-150 cursor-pointer"
                        title="Start new chat"
                    >
                        <Plus size={14} />
                        <span className="hidden sm:inline">New Chat</span>
                    </button>
                </div>
            </div>
        </header>
    )
}

export default Nav