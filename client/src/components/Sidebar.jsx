import React, { useEffect, useState, useRef } from 'react'
import { Coins, LogOut, MessageSquare, PanelLeftIcon, PenSquare, Plus, User } from "lucide-react"
import { getConversations } from '../features/getConverSations'
import { addConversation, setConversations, setSelectedConversation } from '../redux/conversationSlice'
import { createConversation } from '../features/createConverSation'
import { useDispatch, useSelector } from 'react-redux'
import logout from '../features/logout'
import { setUserdata } from '../redux/userSlice'

const Sidebar = () => {

    const [collaPsed, setCollaPsed] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth < 1024
        }
        return false
    })
    
    const [imageError, setImageError] = useState(false)
    const dispatch = useDispatch()
    const sidebarRef = useRef(null)

    const { conversations, selectedConversation } = useSelector((state) => state.conversation)
    const { userData } = useSelector((state) => state.user)

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
    }, [userData])

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

    const handleCreateConversation = async () => {
        const data = await createConversation()
        dispatch(addConversation(data))
        if (window.innerWidth < 1024) {
            setCollaPsed(true)
        }
    }

    const handleSelectConversation = (conv) => {
        dispatch(setSelectedConversation(conv))
        if (window.innerWidth < 1024) {
            setCollaPsed(true)
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

            <div
                ref={sidebarRef}
                className={`fixed lg:static inset-y-0 left-0 z-40 h-screen shrink-0 bg-[#0d0f14] border-r border-white/[0.06] flex flex-col transition-all duration-300 ease-in-out ${collaPsed ? "w-[68px]" : "w-[270px]"}`}
            >
                <div className="flex flex-col h-full">
                    <div className={`flex items-center h-14 border-b border-white/[0.06] shrink-0 transition-all duration-300 ${collaPsed ? "justify-center px-0" : "gap-2.5 px-4"}`}>
                        <button
                            type="button"
                            className="flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/[0.06] transition-colors duration-150 bg-transparent border-none cursor-pointer"
                            onClick={() => setCollaPsed(!collaPsed)}
                            title={collaPsed ? "Expand sidebar" : "Collapse sidebar"}
                        >
                            <PanelLeftIcon size={17} />
                        </button>

                        {!collaPsed && (
                            <>
                                <span className="text-[15px] font-semibold text-slate-100 tracking-tight flex-1 truncate">
                                    ShifraAI
                                </span>

                                <span className="text-[10px] font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full tracking-wide uppercase shrink-0">
                                    free
                                </span>
                                <button
                                    className='flex items-center justify-center w-7 h-7 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/[0.05] transition-colors duration-150 bg-transparent border-none cursor-pointer'
                                    onClick={() => handleCreateConversation()}
                                    title="New Chat"
                                >
                                    <PenSquare size={14} />
                                </button>
                            </>
                        )}
                    </div>


                    <div className={`pt-3.5 pb-1 ${collaPsed ? "px-2.5 flex justify-center" : "px-4"}`}>
                        {collaPsed ? (
                            <button
                                onClick={() => handleCreateConversation()}
                                title="New Chat"
                                className="w-10 h-10 flex items-center justify-center text-white bg-linear-to-br from-indigo-500 to-violet-700 rounded-xl border-none cursor-pointer hover:opacity-90 transition-opacity shadow-lg shadow-indigo-500/20"
                            >
                                <Plus size={18} />
                            </button>
                        ) : (
                            <button
                                className="w-full flex items-center justify-center gap-2 text-sm font-medium text-white bg-linear-to-br from-indigo-500 to-violet-700 rounded-xl py-[10px] border-none cursor-pointer hover:opacity-90 transition-opacity duration-150 shadow-lg shadow-indigo-500/20"
                                onClick={() => handleCreateConversation()}
                            >
                                <Plus size={15} />
                                New Chat
                            </button>
                        )}
                    </div>

                    {!collaPsed && (
                        conversations.length === 0 ? (
                            <div className="flex items-center justify-center py-6 text-slate-500 text-xs">
                                No conversations found
                            </div>
                        ) : (
                            <div className="px-5 pt-4 pb-1.5 text-[10.5px] font-semibold uppercase tracking-widest text-slate-600">
                                Recents
                            </div>
                        )
                    )}

                    <div className={`flex-1 overflow-y-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${collaPsed ? "px-2 pt-2" : "px-2.5"}`}>
                        {conversations.map((conv, i) => {
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
                                );
                            }
                            return (
                                <div
                                    key={conv?._id || i}
                                    onClick={() => handleSelectConversation(conv)}
                                    className={`group flex items-center gap-2.5 cursor-pointer mb-0.5 px-3 py-2.5 rounded-[10px] border transition-all duration-200 ${isActive
                                        ? "bg-indigo-500/10 border-indigo-500/20 shadow-[inset_0_0_20px_rgba(99,102,241,0.03)]"
                                        : "bg-transparent border-transparent hover:bg-white/[0.04] hover:border-white/[0.06]"
                                        }`}
                                >
                                    <div
                                        className={`flex items-center justify-center shrink-0 w-[28px] h-[28px] rounded-lg border transition-all duration-200 ${isActive
                                            ? "bg-indigo-500/15 border-indigo-400/30 text-indigo-300"
                                            : "bg-white/[0.05] border-white/[0.04] text-slate-500 group-hover:text-slate-300 group-hover:bg-white/[0.08]"
                                            }`}
                                    >
                                        <MessageSquare size={13} strokeWidth={2} />
                                    </div>

                                    <span
                                        className={`text-[13px] font-medium truncate transition-colors duration-200 ${isActive
                                            ? "text-slate-100"
                                            : "text-slate-300 group-hover:text-slate-100"
                                            }`}
                                    >
                                        {conv?.title || "New Chat"}
                                    </span>
                                </div>
                            )
                        })}
                    </div>

                    <div className="mx-2.5 h-px bg-white/[0.06]" />
                    <div className={`py-3.5 ${collaPsed ? "px-2 flex flex-col items-center gap-2" : "px-3.5"}`}>
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
                                        className='flex items-center justify-center w-8 h-8 rounded-lg border-none bg-transparent text-slate-500 cursor-pointer hover:bg-white/[0.08] hover:text-slate-300 transition-all duration-150'
                                        onClick={async () => {
                                            await logout()
                                            dispatch(setUserdata(null))
                                        }}
                                    >
                                        <LogOut size={16} />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2.5 cursor-pointer rounded-xl px-3 py-2.5 hover:bg-white/[0.05] transition-all duration-200">
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
                                        <p className='text-[13.5px] font-semibold text-slate-100 truncate'>{userData?.name || "User"}</p>
                                        <p className='text-[11px] text-slate-600 mt-px'>{"Free Plan"}</p>
                                    </div>

                                    <div className="flex gap-1">
                                        <button className='flex items-center w-7 h-7 rounded-[7px] border-none bg-transparent text-yellow-600 cursor-pointer hover:bg-white/[0.08] hover:text-slate-400 transition-all duration-150'><Coins size={16} /></button>
                                        <button className='flex items-center justify-center w-7 h-7 rounded-[7px] border-none bg-transparent text-slate-600 cursor-pointer hover:bg-white/[0.08] hover:text-slate-400 transition-all duration-150' onClick={async () => {
                                            await logout()
                                            dispatch(setUserdata(null))
                                        }}>
                                            <LogOut size={16} />
                                        </button>
                                    </div>
                                </div>
                            )
                        ) : (
                            collaPsed ? (
                                <button
                                    title="Login"
                                    className="w-10 h-10 flex items-center justify-center text-slate-300 bg-white/[0.05] border border-white/[0.08] rounded-xl cursor-pointer hover:bg-white/[0.08] transition-colors duration-150"
                                >
                                    <User size={16} />
                                </button>
                            ) : (
                                <button
                                    className="w-full flex items-center justify-center gap-2 text-sm font-medium text-slate-200 bg-white/[0.05] border border-white/[0.08] rounded-xl py-[10px] cursor-pointer hover:bg-white/[0.08] transition-colors duration-150"
                                >
                                    Login
                                </button>
                            )
                        )}
                    </div>

                </div>

            </div>
        </>
    )
}

export default Sidebar
