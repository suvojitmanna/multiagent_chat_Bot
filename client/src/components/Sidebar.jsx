import React, { useEffect, useState, useRef } from 'react'
import { Coins, LogOut, MessageSquare, PanelLeftClose, PanelLeftOpen, Plus, User, X, Trash2, Pencil, Check } from "lucide-react"
import { getConversations } from '../features/getConverSations'
import { setConversations, setSelectedConversation, removeConversation, updateConversationTitle } from '../redux/conversationSlice'
import { deleteConversation as deleteConversationApi } from '../features/deleteConversation'
import { updateConversation as updateConversationApi } from '../features/updateConversation'
import { useDispatch, useSelector } from 'react-redux'
import logout from '../features/logout'
import { setUserdata } from '../redux/userSlice'

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
    const { userData } = useSelector((state) => state.user)

    const [editingId, setEditingId] = useState(null)
    const [editTitle, setEditTitle] = useState("")
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

    const handleSelectConversation = (conv) => {
        dispatch(setSelectedConversation(conv))
        if (window.innerWidth < 1024) {
            setCollaPsed(true)
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
            {!collaPsed && (
                <div
                    className="fixed inset-0 z-30 bg-black/60 backdrop-blur-xs lg:hidden cursor-pointer transition-opacity duration-300"
                    onClick={() => setCollaPsed(true)}
                    aria-label="Close sidebar"
                />
            )}

            <aside
                ref={sidebarRef}
                className={`h-screen shrink-0 bg-[#0d0f14] border-white/[0.06] flex flex-col transition-all duration-300 ease-in-out select-none ${collaPsed
                    ? "w-0 -translate-x-full lg:translate-x-0 lg:w-[68px] overflow-hidden border-r-0 lg:border-r"
                    : "w-[270px] fixed lg:static inset-y-0 left-0 z-40 shadow-2xl lg:shadow-none translate-x-0 border-r"
                    }`}
            >
                <div className="flex flex-col h-full overflow-hidden">

                    <div className={`flex items-center h-14 border-b border-white/[0.06] shrink-0 transition-all duration-300 ${collaPsed ? "justify-center px-0" : "gap-2.5 px-4 justify-between"}`}>
                        <div className={`flex items-center gap-2.5 min-w-0 flex-1 ${collaPsed ? "hidden" : "flex"}`}>
                            <span className="text-[15px] font-semibold text-slate-100 tracking-tight truncate">
                                ShifraAI
                            </span>
                            <span className="text-[10px] font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full tracking-wide uppercase shrink-0">
                                free
                            </span>
                        </div>

                        <button
                            type="button"
                            className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/[0.06] transition-colors duration-150 bg-transparent border-none cursor-pointer shrink-0"
                            onClick={() => setCollaPsed(!collaPsed)}
                            title={collaPsed ? "Expand sidebar" : "Collapse sidebar"}
                        >
                            {collaPsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
                        </button>
                    </div>

                    <div className={`pt-3.5 pb-1 shrink-0 ${collaPsed ? "px-2.5 flex justify-center" : "px-4"}`}>
                        {collaPsed ? (
                            <button
                                onClick={handleCreateConversation}
                                title="New Chat"
                                className="w-10 h-10 flex items-center justify-center text-white bg-linear-to-br from-indigo-500 to-violet-700 rounded-xl border-none cursor-pointer hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-indigo-500/20"
                            >
                                <Plus size={18} />
                            </button>
                        ) : (
                            <button
                                className="w-full flex items-center justify-center gap-2 text-[13.5px] font-medium text-white bg-linear-to-br from-indigo-500 to-violet-700 rounded-xl py-2.5 border-none cursor-pointer hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-indigo-500/20"
                                onClick={handleCreateConversation}
                            >
                                <Plus size={15} />
                                <span>New Chat</span>
                            </button>
                        )}
                    </div>

                    {!collaPsed && (
                        conversationList.length === 0 ? (
                            <div className="flex items-center justify-center py-4 text-slate-500 text-xs shrink-0">
                                No conversations yet
                            </div>
                        ) : (
                            <div className="px-5 pt-4 pb-1.5 text-[10.5px] font-semibold uppercase tracking-widest text-slate-500 shrink-0">
                                Recent Chats
                            </div>
                        )
                    )}

                    <div className={`flex-1 overflow-y-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${collaPsed ? "px-2 pt-2" : "px-3"}`}>
                        {conversationList.map((conv, i) => {
                            const isActive = selectedConversation?._id === conv?._id;

                            if (collaPsed) {
                                return (
                                    <div
                                        key={conv?._id || i}
                                        onClick={() => handleSelectConversation(conv)}
                                        title={conv?.title || "New Chat"}
                                        className={`w-10 h-10 mx-auto flex items-center justify-center cursor-pointer mb-1.5 rounded-xl border transition-all duration-200 ${isActive
                                            ? "bg-indigo-500/20 border-indigo-500/30 text-indigo-300 shadow-[inset_0_0_15px_rgba(99,102,241,0.1)]"
                                            : "bg-transparent border-transparent text-slate-400 hover:bg-white/[0.06] hover:text-slate-200"
                                            }`}
                                    >
                                        <MessageSquare size={16} strokeWidth={2} />
                                    </div>
                                )
                            }

                            const isEditing = editingId === conv?._id;

                            if (isEditing) {
                                return (
                                    <div
                                        key={conv?._id || i}
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

                                        <button
                                            type="button"
                                            onClick={(e) => handleSaveTitle(e, conv?._id)}
                                            className="p-1 rounded-md text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20 transition-colors cursor-pointer shrink-0"
                                            title="Save title (Enter)"
                                            aria-label="Save title"
                                        >
                                            <Check size={13} />
                                        </button>

                                        <button
                                            type="button"
                                            onClick={handleCancelEdit}
                                            className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-white/[0.08] transition-colors cursor-pointer shrink-0"
                                            title="Cancel (Esc)"
                                            aria-label="Cancel"
                                        >
                                            <X size={13} />
                                        </button>
                                    </div>
                                )
                            }

                            return (
                                <div
                                    key={conv?._id || i}
                                    onClick={() => handleSelectConversation(conv)}
                                    onDoubleClick={(e) => handleStartEdit(e, conv)}
                                    className={`group flex items-center gap-2.5 cursor-pointer mb-1 px-3 py-2 rounded-xl border transition-all duration-200 relative ${isActive
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
                                        <button
                                            type="button"
                                            onClick={(e) => handleStartEdit(e, conv)}
                                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/15 border-none cursor-pointer transition-all duration-150"
                                            title="Rename chat (or double click)"
                                            aria-label="Rename chat"
                                        >
                                            <Pencil size={12} />
                                        </button>

                                        <button
                                            type="button"
                                            onClick={(e) => handleDeleteConversation(e, conv?._id)}
                                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 border-none cursor-pointer transition-all duration-150"
                                            title="Delete chat"
                                            aria-label="Delete chat"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
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
                                    <button
                                        title="Logout"
                                        className="flex items-center justify-center w-8 h-8 rounded-lg border-none bg-transparent text-slate-400 cursor-pointer hover:bg-white/[0.08] hover:text-red-400 transition-all duration-150"
                                        onClick={handleLogout}
                                    >
                                        <LogOut size={16} />
                                    </button>
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
                                        <p className="text-[11px] text-slate-500 mt-0.5">Free Plan</p>
                                    </div>

                                    <div className="flex items-center gap-1 shrink-0">
                                        <button
                                            title="Tokens & Coins"
                                            className="flex items-center justify-center w-7 h-7 rounded-lg border-none bg-transparent text-amber-400 hover:bg-white/[0.06] transition-all cursor-pointer"
                                        >
                                            <Coins size={15} />
                                        </button>
                                        <button
                                            title="Logout"
                                            onClick={handleLogout}
                                            className="flex items-center justify-center w-7 h-7 rounded-lg border-none bg-transparent text-slate-400 hover:text-red-400 hover:bg-white/[0.06] transition-all cursor-pointer"
                                        >
                                            <LogOut size={15} />
                                        </button>
                                    </div>
                                </div>
                            )
                        ) : (
                            collaPsed ? (
                                <button
                                    title="Guest"
                                    className="w-10 h-10 flex items-center justify-center text-slate-300 bg-white/[0.05] border border-white/[0.08] rounded-xl cursor-pointer hover:bg-white/[0.08] transition-colors duration-150"
                                >
                                    <User size={16} />
                                </button>
                            ) : (
                                <div className="text-center py-2 text-xs text-slate-500">
                                    Guest mode
                                </div>
                            )
                        )}
                    </div>
                </div>
            </aside>
        </>
    )
}

export default Sidebar
