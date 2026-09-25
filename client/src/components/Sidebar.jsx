import React, { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Coins,
    LogOut,
    MessageSquare,
    PanelLeftClose,
    PanelLeftOpen,
    Plus,
    User,
    X,
    Trash2,
    Pencil,
    Check,
    Settings,
    Crown,
    ChevronRight,
    ChevronLeft,
    Mail,
    Copy,
    Sparkles,
    ShieldCheck,
    Sun,
    Moon,
    Laptop,
    Zap
} from "lucide-react"
import { getConversations } from '../features/getConverSations'
import { setConversations, setSelectedConversation, removeConversation, updateConversationTitle } from '../redux/conversationSlice'
import { deleteConversation as deleteConversationApi } from '../features/deleteConversation'
import { updateConversation as updateConversationApi } from '../features/updateConversation'
import { useDispatch, useSelector } from 'react-redux'
import logout from '../features/logout'
import { setUserdata } from '../redux/userSlice'
import { getMessages } from '../features/getMessages'
import { setMessages } from '../redux/messageSlice'
import { setThemeMode } from '../redux/themeSlice'
import BillingDrawer from './BillingDrawer'
import ThemeToggle from './ThemeToggle'

export const UserPlanAvatar = ({
    userData,
    imageError,
    setImageError,
    size = "md",
    className = "",
}) => {
    const plan = (userData?.plan || "free").toLowerCase()
    const isPro = plan === "pro"
    const isStarter = plan === "starter"

    const sizeConfig = {
        sm: {
            box: "w-8.5 h-8.5",
            icon: 15,
            badge: "w-3.5 h-3.5 -bottom-0.5 -right-0.5",
            badgeIcon: 8,
            dot: "w-2.5 h-2.5 bottom-0 right-0",
        },
        md: {
            box: "w-10 h-10",
            icon: 18,
            badge: "w-4 h-4 -bottom-0.5 -right-0.5",
            badgeIcon: 9,
            dot: "w-2.5 h-2.5 bottom-0 right-0",
        },
        lg: {
            box: "w-12 h-12",
            icon: 22,
            badge: "w-4.5 h-4.5 -bottom-0.5 -right-0.5",
            badgeIcon: 10,
            dot: "w-3 h-3 bottom-0 right-0",
        },
    }[size] || {
        box: "w-10 h-10",
        icon: 18,
        badge: "w-4 h-4 -bottom-0.5 -right-0.5",
        badgeIcon: 9,
        dot: "w-2.5 h-2.5 bottom-0 right-0",
    }

    // Distinct circle rings based on subscription tier
    // Pro: Gemini Pro active multi-color spectrum
    // Starter: Previous vibrant indigo/sky/cyan gradient ring
    // Free: Clean subtle slate ring with emerald active indicator
    const ringStyle = isPro
        ? "p-[2.5px] bg-[conic-gradient(from_0deg,_#3b82f6_0%,_#8b5cf6_22%,_#ec4899_45%,_#f59e0b_68%,_#06b6d4_85%,_#3b82f6_100%)] shadow-lg shadow-purple-500/25 ring-2 ring-purple-400/40"
        : isStarter
            ? "p-[2px] bg-linear-to-tr from-indigo-500 via-sky-400 to-cyan-400 shadow-md shadow-indigo-500/25 ring-2 ring-indigo-400/40"
            : "p-[1.5px] bg-slate-200 dark:bg-white/10 ring-1 ring-slate-300/60 dark:ring-white/5"

    return (
        <div className={`relative shrink-0 rounded-full ${ringStyle} ${className}`}>
            <div className={`${sizeConfig.box} rounded-full overflow-hidden bg-white dark:bg-[#0d0f14] flex items-center justify-center`}>
                {userData?.avatar && !imageError ? (
                    <img
                        src={userData.avatar}
                        alt="Profile"
                        onError={() => setImageError && setImageError(true)}
                        className="w-full h-full rounded-full object-cover"
                    />
                ) : (
                    <div className="flex items-center justify-center w-full h-full bg-slate-100 dark:bg-white/[0.08] text-slate-600 dark:text-slate-300">
                        <User size={sizeConfig.icon} />
                    </div>
                )}
            </div>

            {isPro ? (
                <span
                    className={`absolute ${sizeConfig.badge} rounded-full bg-linear-to-tr from-blue-600 via-purple-600 to-pink-500 text-white flex items-center justify-center shadow-md ring-2 ring-white dark:ring-[#0f1118]`}
                    title="Gemini Pro Member"
                >
                    <Sparkles size={sizeConfig.badgeIcon} className="fill-white text-white stroke-[2]" />
                </span>
            ) : isStarter ? (
                <span
                    className={`absolute ${sizeConfig.badge} rounded-full bg-linear-to-tr from-indigo-600 via-sky-500 to-cyan-400 text-white flex items-center justify-center shadow-md ring-2 ring-white dark:ring-[#0f1118]`}
                    title="Starter Plan Member"
                >
                    <Zap size={sizeConfig.badgeIcon} className="fill-white text-white stroke-[2.5]" />
                </span>
            ) : (
                <span
                    className={`absolute ${sizeConfig.dot} rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#0f1118]`}
                    title="Active"
                />
            )}
        </div>
    )
}

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

    const [showProfilePopup, setShowProfilePopup] = useState(false)
    const [popupView, setPopupView] = useState("main") // "main" | "settings" | "profile"
    const [copiedEmail, setCopiedEmail] = useState(false)
    const profilePopupRef = useRef(null)
    const profileButtonRef = useRef(null)
    const themeMode = useSelector((state) => state.theme?.themeMode || 'system')

    const currentCredits = userData?.credits !== undefined ? userData.credits : 100
    const totalCredits = userData?.totalCredits || 100
    const creditsPercent = Math.min(Math.max(Math.round((currentCredits / totalCredits) * 100), 0), 100)
    const userPlan = (userData?.plan || "free").toLowerCase()
    const isPro = userPlan === "pro"
    const isStarter = userPlan === "starter"

    useEffect(() => {
        const handleClickOutsidePopup = (e) => {
            if (
                showProfilePopup &&
                profilePopupRef.current &&
                !profilePopupRef.current.contains(e.target) &&
                profileButtonRef.current &&
                !profileButtonRef.current.contains(e.target)
            ) {
                setShowProfilePopup(false)
            }
        }
        const handleKeyDownPopup = (e) => {
            if (e.key === 'Escape') {
                setShowProfilePopup(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutsidePopup)
        document.addEventListener('touchstart', handleClickOutsidePopup)
        window.addEventListener('keydown', handleKeyDownPopup)
        return () => {
            document.removeEventListener('mousedown', handleClickOutsidePopup)
            document.removeEventListener('touchstart', handleClickOutsidePopup)
            window.removeEventListener('keydown', handleKeyDownPopup)
        }
    }, [showProfilePopup])

    const handleToggleProfilePopup = (e) => {
        if (e) e.stopPropagation()
        setShowProfilePopup((prev) => {
            if (!prev) setPopupView("main")
            return !prev
        })
    }

    const handleCopyEmail = (email) => {
        if (!email) return
        navigator.clipboard.writeText(email)
        setCopiedEmail(true)
        setTimeout(() => setCopiedEmail(false), 2000)
    }

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
                className={`h-screen shrink-0 bg-white dark:bg-[#0d0f14] border-slate-200 dark:border-white/[0.06] flex flex-col transition-all duration-300 ease-in-out select-none ${collaPsed
                    ? "w-0 -translate-x-full lg:translate-x-0 lg:w-[68px] overflow-hidden border-r-0 lg:border-r"
                    : "w-[270px] fixed lg:static inset-y-0 left-0 z-40 shadow-2xl lg:shadow-none translate-x-0 border-r"
                    }`}
            >
                <div className="flex flex-col h-full overflow-hidden">

                    <div className={`flex items-center h-14 border-b border-slate-200 dark:border-white/[0.06] shrink-0 transition-all duration-300 ${collaPsed ? "justify-center px-0" : "gap-2.5 px-4 justify-between"}`}>
                        <AnimatePresence initial={false}>
                            {!collaPsed && (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ duration: 0.15 }}
                                    className="flex items-center gap-2.5 min-w-0 flex-1"
                                >
                                    <span className="text-[15px] font-semibold text-slate-800 dark:text-slate-100 tracking-tight truncate">
                                        ShifraAI
                                    </span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide uppercase shrink-0 ${isPro
                                            ? "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-300/80 dark:border-amber-500/30"
                                            : isStarter
                                                ? "text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-500/10 border border-sky-300/80 dark:border-sky-500/30"
                                                : "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20"
                                        }`}>
                                        {userPlan}
                                    </span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <motion.button
                            type="button"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-white/[0.06] transition-colors bg-transparent border-none cursor-pointer shrink-0"
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
                                    <div className="flex items-center justify-center py-4 text-slate-400 dark:text-slate-500 text-xs shrink-0">
                                        No conversations yet
                                    </div>
                                ) : (
                                    <div className="px-5 pt-4 pb-1.5 text-[10.5px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 shrink-0">
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
                                                ? "bg-indigo-50 dark:bg-indigo-500/20 border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-300 shadow-[inset_0_0_15px_rgba(99,102,241,0.08)]"
                                                : "bg-transparent border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:text-slate-900 dark:hover:text-slate-200"
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
                                            className="flex items-center gap-1.5 mb-1 px-2.5 py-1.5 rounded-xl border bg-slate-100 dark:bg-white/[0.06] border-indigo-300 dark:border-indigo-500/40 text-slate-900 dark:text-slate-100 shadow-xs"
                                        >
                                            <div className="flex items-center justify-center shrink-0 w-6 h-6 rounded-lg bg-indigo-500/15 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300">
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
                                                className="flex-1 min-w-0 bg-white dark:bg-white/[0.08] border border-slate-300 dark:border-white/[0.15] focus:border-indigo-400 rounded-md px-2 py-0.5 text-[12.5px] text-slate-900 dark:text-slate-100 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                                placeholder="Chat title..."
                                            />

                                            <motion.button
                                                type="button"
                                                whileHover={{ scale: 1.15 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={(e) => handleSaveTitle(e, conv?._id)}
                                                className="p-1 rounded-md text-emerald-500 hover:text-emerald-600 dark:text-emerald-400 dark:hover:text-emerald-300 hover:bg-emerald-500/10 dark:hover:bg-emerald-500/20 transition-colors cursor-pointer shrink-0"
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
                                                className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors cursor-pointer shrink-0"
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
                                            ? "bg-indigo-50/80 dark:bg-indigo-500/15 border-indigo-200/80 dark:border-indigo-500/25 shadow-[inset_0_0_20px_rgba(99,102,241,0.04)] text-indigo-950 dark:text-slate-100 font-medium"
                                            : "bg-transparent border-transparent hover:bg-slate-100 hover:border-slate-200 dark:hover:bg-white/[0.04] dark:hover:border-white/[0.06] text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
                                            }`}
                                    >
                                        <div
                                            className={`flex items-center justify-center shrink-0 w-7 h-7 rounded-lg border transition-all duration-200 ${isActive
                                                ? "bg-indigo-500/15 border-indigo-300/40 text-indigo-600 dark:bg-indigo-500/20 dark:border-indigo-400/30 dark:text-indigo-300"
                                                : "bg-slate-100 border-slate-200 text-slate-500 group-hover:text-slate-700 group-hover:bg-slate-200/60 dark:bg-white/[0.04] dark:border-white/[0.04] dark:text-slate-400 dark:group-hover:text-slate-200 dark:group-hover:bg-white/[0.07]"
                                                }`}
                                        >
                                            <MessageSquare size={13} strokeWidth={2} />
                                        </div>

                                        <span
                                            className="text-[13px] truncate flex-1 min-w-0 select-none"
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
                                                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:text-indigo-300 dark:hover:bg-indigo-500/15 border-none cursor-pointer transition-colors"
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
                                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-500/15 border-none cursor-pointer transition-colors"
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

                    <div className="mx-3 h-px bg-slate-200 dark:bg-white/[0.06] shrink-0" />

                    <div className={`relative py-3 shrink-0 ${collaPsed ? "px-2 flex flex-col items-center gap-2" : "px-3"}`}>
                        <AnimatePresence>
                            {showProfilePopup && userData && (
                                <motion.div
                                    ref={profilePopupRef}
                                    initial={{ opacity: 0, scale: 0.94, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.94, y: 10 }}
                                    transition={{ duration: 0.16, ease: "easeOut" }}
                                    onClick={(e) => e.stopPropagation()}
                                    className={`z-50 bg-white/95 dark:bg-[#111420]/95 backdrop-blur-xl border border-slate-200/90 dark:border-white/[0.12] rounded-2xl shadow-2xl shadow-slate-900/15 dark:shadow-black/90 p-3.5 flex flex-col gap-3 text-slate-800 dark:text-slate-100 max-h-[82vh] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ring-1 ring-slate-900/5 dark:ring-white/[0.05] ${collaPsed
                                        ? "fixed left-16 bottom-3 w-[265px]"
                                        : "absolute bottom-[calc(100%+8px)] left-2 right-2"
                                        }`}
                                >
                                    {popupView === "main" && (
                                        <>
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <UserPlanAvatar
                                                        userData={userData}
                                                        imageError={imageError}
                                                        setImageError={setImageError}
                                                        size="md"
                                                    />

                                                    <div className="flex flex-col min-w-0">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-[13px] font-bold text-slate-900 dark:text-white truncate">
                                                                {userData?.name || "User"}
                                                            </span>
                                                            <span className={`text-[9.5px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full shrink-0 ${isPro
                                                                    ? "bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400"
                                                                    : isStarter
                                                                        ? "bg-sky-500/15 border border-sky-500/30 text-sky-600 dark:text-sky-400"
                                                                        : "bg-indigo-500/15 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400"
                                                                }`}>
                                                                {userPlan}
                                                            </span>
                                                        </div>
                                                        <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5" title={userData?.email}>
                                                            {userData?.email || "No email available"}
                                                        </span>
                                                    </div>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => setShowProfilePopup(false)}
                                                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer shrink-0"
                                                    title="Close"
                                                    aria-label="Close"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>

                                            <div className="px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.06]">
                                                <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                                                    <Sparkles size={11} className="text-indigo-500 dark:text-indigo-400" />
                                                    <span>About</span>
                                                </div>
                                                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed italic line-clamp-2">
                                                    "{userData?.about || userData?.bio || userData?.description || "Building intelligent multi-agent workflows and generating full-stack solutions with ShifraAI."}"
                                                </p>
                                            </div>

                                            <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-500/20 dark:border-indigo-500/25">
                                                <div className="flex items-center justify-between text-xs mb-1.5">
                                                    <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-200 text-[11.5px]">
                                                        <Coins size={13} className="text-amber-500 dark:text-amber-400" />
                                                        Available Credits
                                                    </span>
                                                    <span className="font-semibold text-slate-900 dark:text-white text-xs">
                                                        {currentCredits} <span className="text-slate-400 dark:text-slate-500 font-normal text-[11px]">/ {totalCredits}</span>
                                                    </span>
                                                </div>

                                                <div className="h-1.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden mb-2">
                                                    <div
                                                        className="h-full bg-linear-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-300"
                                                        style={{ width: `${creditsPercent}%` }}
                                                    />
                                                </div>

                                                <div className="flex items-center justify-between text-[10.5px]">
                                                    <span className="text-slate-500 dark:text-slate-400 font-medium">
                                                        {creditsPercent}% remaining
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setShowProfilePopup(false)
                                                            setShowBilling(true)
                                                        }}
                                                        className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 cursor-pointer flex items-center gap-0.5 hover:underline"
                                                    >
                                                        <span>Upgrade</span>
                                                        <ChevronRight size={11} />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-0.5 pt-0.5 border-t border-slate-200/80 dark:border-white/[0.06]">
                                                <button
                                                    type="button"
                                                    onClick={() => setPopupView("profile")}
                                                    className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-left text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors cursor-pointer group"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-md bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                                                            <User size={13} />
                                                        </div>
                                                        <span className="text-[12px]">Account Profile</span>
                                                    </div>
                                                    <ChevronRight size={12} className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 group-hover:translate-x-0.5 transition-transform" />
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => setPopupView("settings")}
                                                    className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-left text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors cursor-pointer group"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-md bg-purple-500/10 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                                                            <Settings size={13} />
                                                        </div>
                                                        <span className="text-[12px]">Preferences & Theme</span>
                                                    </div>
                                                    <ChevronRight size={12} className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 group-hover:translate-x-0.5 transition-transform" />
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setShowProfilePopup(false)
                                                        setShowBilling(true)
                                                    }}
                                                    className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-left text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors cursor-pointer group"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-md bg-amber-500/10 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                                                            <Crown size={13} />
                                                        </div>
                                                        <span className="text-[12px]">Billing & Subscription</span>
                                                    </div>
                                                    <ChevronRight size={12} className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 group-hover:translate-x-0.5 transition-transform" />
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setShowProfilePopup(false)
                                                        handleLogout()
                                                    }}
                                                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer mt-0.5"
                                                >
                                                    <div className="w-6 h-6 rounded-md bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                                                        <LogOut size={13} />
                                                    </div>
                                                    <span className="text-[12px]">Sign out</span>
                                                </button>
                                            </div>
                                        </>
                                    )}

                                    {popupView === "profile" && (
                                        <div className="flex flex-col gap-2.5">
                                            <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/80 dark:border-white/[0.06]">
                                                <button
                                                    type="button"
                                                    onClick={() => setPopupView("main")}
                                                    className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 cursor-pointer"
                                                >
                                                    <ChevronLeft size={13} />
                                                    <span>Back</span>
                                                </button>
                                                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                                    Account Profile
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowProfilePopup(false)}
                                                    className="p-0.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                                                >
                                                    <X size={13} />
                                                </button>
                                            </div>

                                            <div className="flex flex-col items-center text-center py-1">
                                                <div className="relative shrink-0 mb-1.5">
                                                    <UserPlanAvatar
                                                        userData={userData}
                                                        imageError={imageError}
                                                        setImageError={setImageError}
                                                        size="lg"
                                                    />
                                                </div>
                                                <h4 className="text-[13px] font-bold text-slate-900 dark:text-white">
                                                    {userData?.name || "User"}
                                                </h4>
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${isPro
                                                            ? "text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/30"
                                                            : isStarter
                                                                ? "text-sky-600 dark:text-sky-400 bg-sky-500/10 border border-sky-500/30"
                                                                : "text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border border-indigo-500/30"
                                                        }`}>
                                                        {userPlan} Plan
                                                    </span>
                                                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                        <ShieldCheck size={11} />
                                                        <span>Verified</span>
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-1.5 text-xs">
                                                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.06]">
                                                    <div className="flex items-center gap-1.5 min-w-0">
                                                        <Mail size={13} className="text-slate-400 shrink-0" />
                                                        <span className="text-[11px] text-slate-600 dark:text-slate-300 truncate" title={userData?.email}>
                                                            {userData?.email || "No email"}
                                                        </span>
                                                    </div>
                                                    {userData?.email && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleCopyEmail(userData.email)}
                                                            className="p-1 rounded text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer shrink-0"
                                                            title="Copy email"
                                                        >
                                                            {copiedEmail ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.06]">
                                                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Current Plan</span>
                                                    <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 capitalize">
                                                        {userData?.plan || "Free"}
                                                    </span>
                                                </div>

                                                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.06]">
                                                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Credits Remaining</span>
                                                    <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                                                        {currentCredits} / {totalCredits}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {popupView === "settings" && (
                                        <div className="flex flex-col gap-2.5">
                                            <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/80 dark:border-white/[0.06]">
                                                <button
                                                    type="button"
                                                    onClick={() => setPopupView("main")}
                                                    className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 cursor-pointer"
                                                >
                                                    <ChevronLeft size={13} />
                                                    <span>Back</span>
                                                </button>
                                                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                                    Preferences
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowProfilePopup(false)}
                                                    className="p-0.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                                                >
                                                    <X size={13} />
                                                </button>
                                            </div>

                                            <div className="flex flex-col gap-1.5">
                                                <span className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                                    Appearance Theme
                                                </span>
                                                <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.06]">
                                                    {[
                                                        { id: "light", label: "Light", icon: Sun },
                                                        { id: "dark", label: "Dark", icon: Moon },
                                                        { id: "system", label: "System", icon: Laptop },
                                                    ].map((item) => {
                                                        const Icon = item.icon
                                                        const isActive = themeMode === item.id
                                                        return (
                                                            <button
                                                                key={item.id}
                                                                type="button"
                                                                onClick={() => dispatch(setThemeMode(item.id))}
                                                                className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-lg text-[10.5px] font-medium transition-all cursor-pointer ${isActive
                                                                    ? "bg-white dark:bg-[#1a1e2d] text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200/80 dark:border-white/[0.08]"
                                                                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                                                                    }`}
                                                            >
                                                                <Icon size={14} />
                                                                <span>{item.label}</span>
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-1.5 pt-1">
                                                <span className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                                    AI Agent Routing
                                                </span>
                                                <div className="p-2 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.06] flex items-center justify-between text-[11px]">
                                                    <span className="text-slate-600 dark:text-slate-300">Multiagent Auto Mode</span>
                                                    <span className="text-[9.5px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                                        Active
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-1.5">
                                                <span className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                                    Voice Input (Speech)
                                                </span>
                                                <div className="p-2 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.06] flex items-center justify-between text-[11px]">
                                                    <span className="text-slate-600 dark:text-slate-300">Web Speech API</span>
                                                    <span className="text-[9.5px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                                                        Enabled
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {userData ? (
                            collaPsed ? (
                                <div className="flex flex-col items-center gap-2">
                                    <motion.button
                                        ref={profileButtonRef}
                                        type="button"
                                        whileHover={{ scale: 1.08 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleToggleProfilePopup}
                                        className="relative shrink-0 cursor-pointer"
                                        title={showProfilePopup ? "Close profile menu" : `${userData?.name || "User"} (${userPlan.toUpperCase()} Plan)`}
                                        aria-label="User Profile"
                                    >
                                        <UserPlanAvatar
                                            userData={userData}
                                            imageError={imageError}
                                            setImageError={setImageError}
                                            size="sm"
                                        />
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        title="Logout"
                                        className="flex items-center justify-center w-8 h-8 rounded-lg border-none bg-transparent text-slate-400 cursor-pointer hover:bg-slate-100 hover:text-red-500 dark:hover:bg-white/[0.08] dark:hover:text-red-400 transition-colors"
                                        onClick={handleLogout}
                                    >
                                        <LogOut size={16} />
                                    </motion.button>
                                </div>
                            ) : (
                                <div className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2 transition-all duration-200 ${showProfilePopup ? "bg-slate-100 dark:bg-white/[0.07]" : "hover:bg-slate-100 dark:hover:bg-white/[0.04]"
                                    }`}>
                                    <motion.button
                                        ref={profileButtonRef}
                                        type="button"
                                        whileHover={{ scale: 1.08 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleToggleProfilePopup}
                                        className="relative shrink-0 cursor-pointer"
                                        title={showProfilePopup ? "Close profile menu" : `${userData?.name || "User"} (${userPlan.toUpperCase()} Plan)`}
                                        aria-label="User Profile"
                                    >
                                        <UserPlanAvatar
                                            userData={userData}
                                            imageError={imageError}
                                            setImageError={setImageError}
                                            size="sm"
                                        />
                                    </motion.button>

                                    <div
                                        className="flex-1 min-w-0 cursor-pointer"
                                        onClick={handleToggleProfilePopup}
                                        title="Click to view profile"
                                    >
                                        <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-100 truncate">
                                            {userData?.name || "User"}
                                        </p>
                                        <p className="text-[11px] text-slate-500 mt-0.5 capitalize flex">
                                            {userData?.plan || "Free"} • <span className="text-amber-500 dark:text-amber-400/90 font-medium">{userData?.credits !== undefined ? userData.credits : 100} credits</span>
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-1 shrink-0">
                                        <motion.button
                                            whileHover={{ scale: 1.15, rotate: 12 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => setShowBilling(!showBilling)}
                                            title="Tokens & Coins"
                                            className="flex items-center justify-center w-7 h-7 rounded-lg border-none bg-transparent text-amber-500 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                                        >
                                            <Coins size={15} />
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.15 }}
                                            whileTap={{ scale: 0.9 }}
                                            title="Logout"
                                            onClick={handleLogout}
                                            className="flex items-center justify-center w-7 h-7 rounded-lg border-none bg-transparent text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:text-red-400 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                                        >
                                            <LogOut size={15} />
                                        </motion.button>
                                    </div>
                                </div>
                            )
                        ) : (
                            collaPsed ? (
                                <div className="flex flex-col items-center gap-2">
                                    <ThemeToggle compact={true} align="bottom-left" />
                                    <motion.button
                                        whileHover={{ scale: 1.08 }}
                                        whileTap={{ scale: 0.92 }}
                                        title="Guest"
                                        className="w-10 h-10 flex items-center justify-center text-slate-600 bg-slate-100 border border-slate-200 dark:text-slate-300 dark:bg-white/[0.05] dark:border-white/[0.08] rounded-xl cursor-pointer hover:bg-slate-200 dark:hover:bg-white/[0.08] transition-colors"
                                    >
                                        <User size={16} />
                                    </motion.button>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between px-2.5 py-1 text-xs text-slate-400 dark:text-slate-500">
                                    <span>Guest mode</span>
                                    <ThemeToggle compact={true} align="bottom-left" />
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
