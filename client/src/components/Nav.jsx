import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, Plus, Sparkles, PanelLeftOpen, Trash2, Pencil, Check, X } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { setSelectedConversation, removeConversation, updateConversationTitle } from '../redux/conversationSlice'
import { deleteConversation as deleteConversationApi } from '../features/deleteConversation'
import { updateConversation as updateConversationApi } from '../features/updateConversation'

const Nav = ({ sidebarCollapsed, onToggleSidebar }) => {
    const dispatch = useDispatch()
    const { selectedConversation } = useSelector((state) => state.conversation)
    const { messages } = useSelector((state) => state.message)
    const messageList = Array.isArray(messages) ? messages : (messages?.messages || [])
    const userMessageCount = messageList.filter((m) => m?.role === "user").length

    const [isEditingTitle, setIsEditingTitle] = useState(false)
    const [navTitle, setNavTitle] = useState("")
    const navInputRef = useRef(null)

    useEffect(() => {
        if (isEditingTitle && navInputRef.current) {
            navInputRef.current.focus()
            navInputRef.current.select()
        }
    }, [isEditingTitle])

    useEffect(() => {
        setIsEditingTitle(false)
    }, [selectedConversation?._id])

    const handleStartEdit = () => {
        if (!selectedConversation?._id) return
        setNavTitle(selectedConversation?.title || "New Chat")
        setIsEditingTitle(true)
    }

    const handleCancelEdit = () => {
        setIsEditingTitle(false)
        setNavTitle("")
    }

    const handleSaveTitle = async () => {
        const trimmed = navTitle.trim()
        if (!trimmed || !selectedConversation?._id) {
            handleCancelEdit()
            return
        }

        const convId = selectedConversation._id
        dispatch(updateConversationTitle({ id: convId, title: trimmed }))
        setIsEditingTitle(false)

        try {
            await updateConversationApi({ id: convId, title: trimmed })
        } catch (error) {
            console.error("Error updating title in nav:", error)
        }
    }

    const handleNewChat = () => {
        setIsEditingTitle(false)
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
        <header className="h-13 sm:h-14 border-b border-slate-200 dark:border-white/[0.06] bg-white/80 dark:bg-[#0d0f14]/80 backdrop-blur-md sticky top-0 z-20 shrink-0 w-full transition-all duration-300">
            <div className="w-full max-w-4xl lg:max-w-5xl xl:max-w-6xl h-full flex items-center justify-between gap-2.5 px-3 sm:px-4 md:px-6">
                <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
                    {sidebarCollapsed && onToggleSidebar && (
                        <motion.button
                            type="button"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={onToggleSidebar}
                            className="flex lg:hidden items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer shrink-0 mr-1"
                            title="Expand sidebar"
                            aria-label="Expand sidebar"
                        >
                            <PanelLeftOpen size={18} />
                        </motion.button>
                    )}

                    <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 shrink-0">
                        {selectedConversation ? (
                            <MessageSquare size={13} className="text-indigo-500 dark:text-indigo-400" />
                        ) : (
                            <Sparkles size={13} className="text-indigo-500 dark:text-indigo-400" />
                        )}
                    </div>

                    {isEditingTitle ? (
                        <div className="flex items-center gap-1.5 min-w-0 max-w-xs sm:max-w-sm">
                            <input
                                ref={navInputRef}
                                type="text"
                                value={navTitle}
                                onChange={(e) => setNavTitle(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault()
                                        handleSaveTitle()
                                    } else if (e.key === "Escape") {
                                        e.preventDefault()
                                        handleCancelEdit()
                                    }
                                }}
                                className="bg-slate-100 dark:bg-white/[0.08] border border-slate-300 dark:border-white/[0.15] focus:border-indigo-400 rounded-md px-2 py-0.5 text-[13px] text-slate-900 dark:text-slate-100 outline-none w-full"
                                placeholder="Chat title..."
                            />
                            <motion.button
                                type="button"
                                whileHover={{ scale: 1.15 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={handleSaveTitle}
                                className="p-1 rounded-md text-emerald-500 hover:text-emerald-600 dark:text-emerald-400 dark:hover:text-emerald-300 hover:bg-emerald-500/10 dark:hover:bg-emerald-500/20 transition-colors cursor-pointer shrink-0"
                                title="Save title (Enter)"
                                aria-label="Save title"
                            >
                                <Check size={14} />
                            </motion.button>
                            <motion.button
                                type="button"
                                whileHover={{ scale: 1.15 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={handleCancelEdit}
                                className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors cursor-pointer shrink-0"
                                title="Cancel (Esc)"
                                aria-label="Cancel"
                            >
                                <X size={14} />
                            </motion.button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 min-w-0 max-w-full">
                            <h1
                                onDoubleClick={handleStartEdit}
                                title={selectedConversation?._id ? "Double-click to rename" : undefined}
                                className="text-[13.5px] sm:text-[14.5px] font-semibold text-slate-800 dark:text-slate-100 tracking-tight truncate min-w-0 cursor-default"
                            >
                                {selectedConversation?.title || "New Chat"}
                            </h1>
                            {selectedConversation?._id && (
                                <motion.button
                                    type="button"
                                    whileHover={{ scale: 1.2 }}
                                    whileTap={{ scale: 0.85 }}
                                    onClick={handleStartEdit}
                                    className="p-1 rounded-md text-slate-400 hover:text-indigo-600 dark:text-slate-500 dark:hover:text-indigo-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer shrink-0"
                                    title="Rename chat"
                                    aria-label="Rename chat"
                                >
                                    <Pencil size={12} />
                                </motion.button>
                            )}
                        </div>
                    )}

                    {(selectedConversation || userMessageCount > 0) && (
                        <span className="inline-flex items-center gap-1 text-[10.5px] sm:text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.07] px-2 py-0.5 rounded-full shrink-0">
                            <span className="text-indigo-500 dark:text-indigo-400 font-semibold">{userMessageCount}</span>
                            <span className="hidden sm:inline">{userMessageCount === 1 ? "user message" : "user messages"}</span>
                            <span className="sm:hidden">{userMessageCount === 1 ? "user msg" : "user msgs"}</span>
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    <AnimatePresence>
                        {selectedConversation?._id && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                type="button"
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.96 }}
                                onClick={handleDeleteActiveChat}
                                className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 bg-slate-100 hover:bg-rose-50 dark:bg-white/[0.04] dark:hover:bg-rose-500/10 border border-slate-200 hover:border-rose-300 dark:border-white/[0.07] dark:hover:border-rose-500/20 transition-colors cursor-pointer"
                                title="Delete this chat"
                                aria-label="Delete this chat"
                            >
                                <Trash2 size={13} />
                                <span className="hidden sm:inline">Delete</span>
                            </motion.button>
                        )}
                    </AnimatePresence>

                    <motion.button
                        type="button"
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={handleNewChat}
                        className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100 bg-slate-100 hover:bg-slate-200/80 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/[0.07] transition-colors cursor-pointer"
                        title="Start new chat"
                    >
                        <Plus size={14} />
                        <span className="hidden sm:inline">New Chat</span>
                    </motion.button>
                </div>
            </div>
        </header>
    )
}

export default Nav