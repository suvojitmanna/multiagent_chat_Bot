import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { signInWithPopup } from 'firebase/auth'
import { auth, googleProvider } from '../../utils/firebase'
import { FcGoogle } from "react-icons/fc"
import { Sparkles, Loader2 } from "lucide-react"
import api from '../../utils/axios'
import { useSelector, useDispatch } from 'react-redux'
import { setUserdata } from '../redux/userSlice'
import Sidebar from '../components/Sidebar'
import ChatArea from '../components/ChatArea'
import Artifact from '../components/Artifact'

const Home = () => {
    const { userData } = useSelector((state) => state.user)
    const dispatch = useDispatch()
    const [loginLoading, setLoginLoading] = useState(false)
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth < 1024
        }
        return false
    })

    const handleLogin = async (token) => {
        try {
            const { data } = await api.post("/api/auth/login", { token })
            const user = data.user || data
            dispatch(setUserdata(user))
        } catch (err) {
            console.error("Login API error:", err)
        }
    }

    const googleLogin = async () => {
        try {
            setLoginLoading(true)
            const data = await signInWithPopup(auth, googleProvider)
            const token = await data.user.getIdToken()
            await handleLogin(token)
        } catch (error) {
            console.error("Google sign-in error:", error)
        } finally {
            setLoginLoading(false)
        }
    }

    return (
        <div className="h-screen h-[100dvh] w-full flex bg-[#0d0f14] text-white overflow-hidden relative selection:bg-indigo-500/30">
            <Sidebar
                collapsed={sidebarCollapsed}
                setCollapsed={setSidebarCollapsed}
            />

            <ChatArea
                sidebarCollapsed={sidebarCollapsed}
                onToggleSidebar={() => setSidebarCollapsed((prev) => !prev)}
            />

            <Artifact />

            <AnimatePresence>
                {!userData && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.92, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.92, y: 15 }}
                            transition={{ type: "spring", damping: 25, stiffness: 350 }}
                            className="w-full max-w-[360px] bg-[#13151c] border border-white/[0.08] rounded-2xl p-6 sm:p-7 flex flex-col gap-5 shadow-2xl my-auto"
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-linear-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/20 text-white shrink-0">
                                    <Sparkles size={20} />
                                </div>
                                <div className="flex flex-col">
                                    <h2 className="text-[17px] font-semibold text-slate-100 tracking-tight">
                                        ShifraAI
                                    </h2>
                                    <span className="text-[11px] text-slate-500">
                                        Multi-agent conversational intelligence
                                    </span>
                                </div>
                            </div>

                            <p className="text-[13px] text-slate-400 leading-relaxed">
                                Sign in to save your chat history, manage multi-agent conversations, and access smart tools.
                            </p>

                            <motion.button
                                type="button"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                disabled={loginLoading}
                                onClick={googleLogin}
                                className="w-full flex items-center justify-center gap-3 py-3 rounded-xl text-sm font-medium text-white bg-linear-to-br from-indigo-500 to-violet-700 hover:from-indigo-400 hover:to-violet-600 border border-indigo-500/30 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loginLoading ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        <span>Signing in...</span>
                                    </>
                                ) : (
                                    <>
                                        <FcGoogle size={19} />
                                        <span>Continue with Google</span>
                                    </>
                                )}
                            </motion.button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default Home