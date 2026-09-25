import React, { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Coins, LogOut, MessageSquare, PanelLeftClose, PanelLeftOpen, Plus, User, X, Trash2, Pencil, Check } from "lucide-react"
import { getConversations } from '../features/getConverSations'
import { setConversations, setSelectedConversation, removeConversation, updateConversationTitle } from '../redux/conversationSlice'
import { deleteConversation as deleteConversationApi } from '../features/deleteConversation'
import { updateConversation as updateConversationApi } from '../features/updateConversation'
import { useDispatch, useSelector } from 'react-redux'
import logout from '../features/logout'
import { setUserdata } from '../redux/userSlice'
import { getMessages } from '../features/getMessages'
import { setMessages } from '../redux/messageSlice'
import BillingDrawer from './BillingDrawer'

const Sidebar = ({ collapsed: propCollapsed, setCollapsed: propSetCollapsed }) => {
    const [localCollapsed, setLocalCollapsed] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth < 1024
        }
        return false
    })

    const collaPsed = propCollapsed !== undefined ? propCollapsed : localCollapsed
    const setCollaPsed = propSetCollapsed !== undefined ? propSetCollapsed : setLocalCollapsed

    const [imageError, setImageError] = useState(false)
    const dispatch = useDispatch()
    const sidebarRef = useRef(null)

    const { conversations, selectedConversation } = useSelector((state) => state.conversation)
    const conversationList = Array.isArray(conversations) ? conversations : []
    const userData = useSelector((state) => state.user?.userData)

    const [editingId, setEditingId] = useState(null)
    const [editTitle, setEditTitle] = useState("")
    const [showBilling, setShowBilling] = useState(false)
    const editInputRef = useRef(null)

    useEffect(() => {
        if (editingId && editInputRef.current) {
            editInputRef.current.focus()
            editInputRef.current.select()
        }
    }, [editingId])

    const handleStartEdit = (e, conv) => {
        e.stopPropagation()
        setEditingId(conv?._id)
        setEditTitle(conv?.title || "New Chat")
    }

    const handleCancelEdit = (e) => {
        if (e) e.stopPropagation()
        setEditingId(null)
        setEditTitle("")
    }

    const handleSaveTitle = async (e, convId) => {
        if (e) e.stopPropagation()
        const trimmed = editTitle.trim()
        if (!trimmed || !convId) {
            handleCancelEdit()
            return
        }

        dispatch(updateConversationTitle({ id: convId, title: trimmed }))
        setEditingId(null)

        try {
            await updateConversationApi({ id: convId, title: trimmed })
        } catch (error) {
            console.error("Failed to update chat title:", error)
        }
    }

    useEffect(() => {
        const getConv = async () => {
            if (!userData) {
                dispatch(setConversations([]))
                return
            }
            const data = await getConversations()
            dispatch(setConversations(data))
        }
        getConv()
    }, [userData, dispatch])

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (window.innerWidth < 1024 && !collaPsed) {
                if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
                    setCollaPsed(true)
                }
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        document.addEventListener('touchstart', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            document.removeEventListener('touchstart', handleClickOutside)
        }
    }, [collaPsed])

    const handleCreateConversation = () => {
        dispatch(setSelectedConversation(null))
        if (window.innerWidth < 1024) {
            setCollaPsed(true)
        }
    }

    const handleDeleteConversation = async (e, convId) => {
        e.stopPropagation()
        if (!convId) return
        dispatch(removeConversation(convId))
        try {
            await deleteConversationApi(convId)
        } catch (err) {
            console.error("Failed to delete conversation:", err)
        }
    }

    const handleSelectConversation = async (conv) => {
        dispatch(setSelectedConversation(conv))
        if (window.innerWidth < 1024) {
            setCollaPsed(true)
        }
        if (conv?._id) {
            try {
                const data = await getMessages(conv._id)
                dispatch(setMessages(data))
            } catch (err) {
                console.error("Failed to load messages on select:", err)
            }
        }
    }

    const handleLogout = async () => {
        try {
            await logout()
            dispatch(setUserdata(null))
            dispatch(setConversations([]))
            dispatch(setSelectedConversation(null))
            if (window.innerWidth < 1024) {
                setCollaPsed(true)
            }
        } catch (error) {
            console.error("Logout failed:", error)
        }
    }

    return (
        <>
            <AnimatePresence>
                {!collaPsed && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-30 bg-black/60 backdrop-blur-xs lg:hidden cursor-pointer"
                        onClick={() => setCollaPsed(true)}
                        aria-label="Close sidebar"
                    />
                )}
            </AnimatePresence>

            <aside
                ref={sidebarRef}
                className={`h-screen shrink-0 bg-[#0d0f14] border-white/[0.06] flex flex-col transition-all duration-300 ease-in-out select-none ${collaPsed
                    ? "w-0 -translate-x-full lg:translate-x-0 lg:w-[68px] overflow-hidden border-r-0 lg:border-r"
                    : "w-[270px] fixed lg:static inset-y-0 left-0 z-40 shadow-2xl lg:shadow-none translate-x-0 border-r"
                    }`}
            >
                <div className="flex flex-col h-full overflow-hidden">

                    <div className={`flex items-center h-14 border-b border-white/[0.06] shrink-0 transition-all duration-300 ${collaPsed ? "justify-center px-0" : "gap-2.5 px-4 justify-between"}`}>
                        <AnimatePresence initial={false}>
                            {!collaPsed && (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ duration: 0.15 }}
                                    className="flex items-center gap-2.5 min-w-0 flex-1"
                                >
                                    <span className="text-[15px] font-semibold text-slate-100 tracking-tight truncate">
                                        ShifraAI
                                    </span>
                                    <span className="text-[10px] font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full tracking-wide uppercase shrink-0">
                                        free
                                    </span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <motion.button
                            type="button"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/[0.06] transition-colors bg-transparent border-none cursor-pointer shrink-0"
                            onClick={() => setCollaPsed(!collaPsed)}
                            title={collaPsed ? "Expand sidebar" : "Collapse sidebar"}
                        >
                            {collaPsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
                        </motion.button>
                    </div>

                    <div className={`pt-3.5 pb-1 shrink-0 ${collaPsed ? "px-2.5 flex justify-center" : "px-4"}`}>
                        {collaPsed ? (
                            <motion.button
                                whileHover={{ scale: 1.08 }}
                                whileTap={{ scale: 0.92 }}
                                onClick={handleCreateConversation}
                                title="New Chat"
                                className="w-10 h-10 flex items-center justify-center text-white bg-linear-to-br from-indigo-500 to-violet-700 rounded-xl border-none cursor-pointer shadow-lg shadow-indigo-500/20"
                            >
                                <Plus size={18} />
                            </motion.button>
                        ) : (
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.97 }}
                                className="w-full flex items-center justify-center gap-2 text-[13.5px] font-medium text-white bg-linear-to-br from-indigo-500 to-violet-700 rounded-xl py-2.5 border-none cursor-pointer shadow-lg shadow-indigo-500/20"
                                onClick={handleCreateConversation}
                            >
                                <Plus size={15} />
                                <span>New Chat</span>
                            </motion.button>
                        )}
                    </div>

                    <AnimatePresence initial={false}>
                        {!collaPsed && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.15 }}
                                className="shrink-0 overflow-hidden"
                            >
                                {conversationList.length === 0 ? (
                                    <div className="flex items-center justify-center py-4 text-slate-500 text-xs shrink-0">
                                        No conversations yet
                                    </div>
                                ) : (
                                    <div className="px-5 pt-4 pb-1.5 text-[10.5px] font-semibold uppercase tracking-widest text-slate-500 shrink-0">
                                        Recent Chats
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className={`flex-1 overflow-y-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${collaPsed ? "px-2 pt-2" : "px-3"}`}>
                        <AnimatePresence mode="popLayout" initial={false}>
                            {conversationList.map((conv, i) => {
                                const isActive = selectedConversation?._id === conv?._id;

                                if (collaPsed) {
                                    return (
                                        <motion.div
                                            key={conv?._id || i}
                                            layout
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8, height: 0 }}
                                            whileHover={{ scale: 1.08 }}
                                            whileTap={{ scale: 0.94 }}
                                            onClick={() => handleSelectConversation(conv)}
                                            title={conv?.title || "New Chat"}
                                            className={`w-10 h-10 mx-auto flex items-center justify-center cursor-pointer mb-1.5 rounded-xl border transition-colors duration-200 ${isActive
                                                ? "bg-indigo-500/20 border-indigo-500/30 text-indigo-300 shadow-[inset_0_0_15px_rgba(99,102,241,0.1)]"
                                                : "bg-transparent border-transparent text-slate-400 hover:bg-white/[0.06] hover:text-slate-200"
                                                }`}
                                        >
                                            <MessageSquare size={16} strokeWidth={2} />
                                        </motion.div>
                                    )
                                }

                                const isEditing = editingId === conv?._id;

                                if (isEditing) {
                                    return (
                                        <motion.div
                                            key={conv?._id || i}
                                            layout
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            onClick={(e) => e.stopPropagation()}
                                            className="flex items-center gap-1.5 mb-1 px-2.5 py-1.5 rounded-xl border bg-white/[0.06] border-indigo-500/40 text-slate-100 shadow-sm"
                                        >
                                            <div className="flex items-center justify-center shrink-0 w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-300">
                                                <MessageSquare size={12} strokeWidth={2} />
                                            </div>

                                            <input
                                                ref={editInputRef}
                                                type="text"
                                                value={editTitle}
                                                onChange={(e) => setEditTitle(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") {
                                                        e.preventDefault()
                                                        handleSaveTitle(e, conv?._id)
                                                    } else if (e.key === "Escape") {
                                                        e.preventDefault()
                                                        handleCancelEdit(e)
                                                    }
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                                className="flex-1 min-w-0 bg-white/[0.08] border border-white/[0.15] focus:border-indigo-400 rounded-md px-2 py-0.5 text-[12.5px] text-slate-100 outline-none placeholder:text-slate-500"
                                                placeholder="Chat title..."
                                            />

                                            <motion.button
                                                type="button"
                                                whileHover={{ scale: 1.15 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={(e) => handleSaveTitle(e, conv?._id)}
                                                className="p-1 rounded-md text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20 transition-colors cursor-pointer shrink-0"
                                                title="Save title (Enter)"
                                                aria-label="Save title"
                                            >
                                                <Check size={13} />
                                            </motion.button>

                                            <motion.button
                                                type="button"
                                                whileHover={{ scale: 1.15 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={handleCancelEdit}
                                                className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-white/[0.08] transition-colors cursor-pointer shrink-0"
                                                title="Cancel (Esc)"
                                                aria-label="Cancel"
                                            >
                                                <X size={13} />
                                            </motion.button>
                                        </motion.div>
                                    )
                                }

                                return (
                                    <motion.div
                                        key={conv?._id || i}
                                        layout
                                        initial={{ opacity: 0, y: -4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9, height: 0, marginBottom: 0, padding: 0 }}
                                        transition={{ duration: 0.2 }}
                                        whileHover={{ x: 2 }}
                                        onClick={() => handleSelectConversation(conv)}
                                        onDoubleClick={(e) => handleStartEdit(e, conv)}
                                        className={`group flex items-center gap-2.5 cursor-pointer mb-1 px-3 py-2 rounded-xl border transition-colors duration-200 relative ${isActive
                                            ? "bg-indigo-500/15 border-indigo-500/25 shadow-[inset_0_0_20px_rgba(99,102,241,0.05)] text-slate-100"
                                            : "bg-transparent border-transparent hover:bg-white/[0.04] hover:border-white/[0.06] text-slate-300 hover:text-slate-100"
                                            }`}
                                    >
                                        <div
                                            className={`flex items-center justify-center shrink-0 w-7 h-7 rounded-lg border transition-all duration-200 ${isActive
                                                ? "bg-indigo-500/20 border-indigo-400/30 text-indigo-300"
                                                : "bg-white/[0.04] border-white/[0.04] text-slate-400 group-hover:text-slate-200 group-hover:bg-white/[0.07]"
                                                }`}
                                        >
                                            <MessageSquare size={13} strokeWidth={2} />
                                        </div>

                                        <span
                                            className="text-[13px] font-medium truncate flex-1 min-w-0 select-none"
                                            title={conv?.title || "New Chat"}
                                        >
                                            {conv?.title || "New Chat"}
                                        </span>

                                        <div className={`flex items-center gap-0.5 shrink-0 transition-opacity duration-150 ${isActive ? "opacity-90" : "opacity-0 group-hover:opacity-100"
                                            }`}>
                                            <motion.button
                                                type="button"
                                                whileHover={{ scale: 1.15 }}
                                                whileTap={{ scale: 0.85 }}
                                                onClick={(e) => handleStartEdit(e, conv)}
                                                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/15 border-none cursor-pointer transition-colors"
                                                title="Rename chat (or double click)"
                                                aria-label="Rename chat"
                                            >
                                                <Pencil size={12} />
                                            </motion.button>

                                            <motion.button
                                                type="button"
                                                whileHover={{ scale: 1.15 }}
                                                whileTap={{ scale: 0.85 }}
                                                onClick={(e) => handleDeleteConversation(e, conv?._id)}
                                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 border-none cursor-pointer transition-colors"
                                                title="Delete chat"
                                                aria-label="Delete chat"
                                            >
                                                <Trash2 size={12} />
                                            </motion.button>
                                        </div>
                                    </motion.div>
                                )
                            })}
                        </AnimatePresence>
                    </div>

                    <div className="mx-3 h-px bg-white/[0.06] shrink-0" />

                    <div className={`py-3 shrink-0 ${collaPsed ? "px-2 flex flex-col items-center gap-2" : "px-3"}`}>
                        {userData ? (
                            collaPsed ? (
                                <div className="flex flex-col items-center gap-2">
                                    <div className="relative shrink-0" title={userData?.name || "User"}>
                                        {userData?.avatar && !imageError ? (
                                            <img
                                                src={userData.avatar}
                                                alt="Profile"
                                                onError={() => setImageError(true)}
                                                className="w-9 h-9 rounded-full object-cover border border-white/[0.08]"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-white/[0.06] border border-white/[0.08] text-slate-400">
                                                <User size={17} />
                                            </div>
                                        )}
                                    </div>
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        title="Logout"
                                        className="flex items-center justify-center w-8 h-8 rounded-lg border-none bg-transparent text-slate-400 cursor-pointer hover:bg-white/[0.08] hover:text-red-400 transition-colors"
                                        onClick={handleLogout}
                                    >
                                        <LogOut size={16} />
                                    </motion.button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 hover:bg-white/[0.04] transition-all duration-200">
                                    <div className="relative shrink-0">
                                        {userData?.avatar && !imageError ? (
                                            <img
                                                src={userData.avatar}
                                                alt="Profile"
                                                onError={() => setImageError(true)}
                                                className="w-9 h-9 rounded-full object-cover border border-white/[0.08]"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-white/[0.06] border border-white/[0.08] text-slate-400">
                                                <User size={17} />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className="text-[13px] font-semibold text-slate-100 truncate">
                                            {userData?.name || "User"}
                                        </p>
                                        <p className="text-[11px] text-slate-500 mt-0.5 capitalize">
                                            {userData?.plan || "Free"} • <span className="text-amber-400/90 font-medium">{userData?.credits !== undefined ? userData.credits : 100} credits</span>
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-1 shrink-0">
                                        <motion.button
                                            whileHover={{ scale: 1.15, rotate: 12 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => setShowBilling(!showBilling)}
                                            title="Tokens & Coins"
                                            className="flex items-center justify-center w-7 h-7 rounded-lg border-none bg-transparent text-amber-400 hover:bg-white/[0.06] transition-colors cursor-pointer"
                                        >
                                            <Coins size={15} />
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.15 }}
                                            whileTap={{ scale: 0.9 }}
                                            title="Logout"
                                            onClick={handleLogout}
                                            className="flex items-center justify-center w-7 h-7 rounded-lg border-none bg-transparent text-slate-400 hover:text-red-400 hover:bg-white/[0.06] transition-colors cursor-pointer"
                                        >
                                            <LogOut size={15} />
                                        </motion.button>
                                    </div>
                                </div>
                            )
                        ) : (
                            collaPsed ? (
                                <motion.button
                                    whileHover={{ scale: 1.08 }}
                                    whileTap={{ scale: 0.92 }}
                                    title="Guest"
                                    className="w-10 h-10 flex items-center justify-center text-slate-300 bg-white/[0.05] border border-white/[0.08] rounded-xl cursor-pointer hover:bg-white/[0.08] transition-colors"
                                >
                                    <User size={16} />
                                </motion.button>
                            ) : (
                                <div className="text-center py-2 text-xs text-slate-500">
                                    Guest mode
                                </div>
                            )
                        )}
                    </div>
                </div>

            </aside>
            <BillingDrawer
                open={showBilling}
                onClose={() => setShowBilling(false)}
            />
        </>
    )
}

export default Sidebar
