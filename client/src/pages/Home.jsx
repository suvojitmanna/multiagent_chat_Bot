import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FcGoogle } from "react-icons/fc"
import { Sparkles, Loader2 } from "lucide-react"
import api from '../../utils/axios'
import { useSelector, useDispatch } from 'react-redux'
import { setUserdata } from '../redux/userSlice'
import Sidebar from '../components/Sidebar'
import ChatArea from '../components/ChatArea'
import Artifact from '../components/Artifact'
const Home = () => {
    const userData = useSelector((state) => state.user?.userData)
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
            setLoginLoading(true)
            const { data } = await api.post("/api/auth/login", { token })
            const user = data.user || data
            dispatch(setUserdata(user))
        } catch (err) {
            console.error("Login API error:", err?.response?.data || err.message || err)
        } finally {
            setLoginLoading(false)
        }
    }

    const googleLogin = () => {
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
        if (!clientId) {
            console.error("VITE_GOOGLE_CLIENT_ID is not configured in client .env")
            return
        }

        setLoginLoading(true)

        if (window.google?.accounts?.oauth2) {
            try {
                const tokenClient = window.google.accounts.oauth2.initTokenClient({
                    client_id: clientId,
                    scope: "openid email profile",
                    callback: async (response) => {
                        if (response.error) {
                            console.error("Google sign-in error response:", response)
                            setLoginLoading(false)
                            return
                        }
                        if (response.access_token) {
                            await handleLogin(response.access_token)
                        } else {
                            setLoginLoading(false)
                        }
                    },
                    error_callback: (err) => {
                        console.error("Google OAuth error:", err)
                        setLoginLoading(false)
                    }
                })
                tokenClient.requestAccessToken({ prompt: "consent" })
                return
            } catch (err) {
                console.error("GIS initTokenClient error:", err)
            }
        }

        try {
            const redirectUri = window.location.origin
            const scope = encodeURIComponent("openid email profile")
            const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=token&scope=${scope}&prompt=select_account`
            
            const width = 500
            const height = 600
            const left = window.screenX + (window.outerWidth - width) / 2
            const top = window.screenY + (window.outerHeight - height) / 2
            
            const popup = window.open(
                authUrl,
                "google_oauth_popup",
                `width=${width},height=${height},left=${left},top=${top}`
            )

            if (!popup) {
                setLoginLoading(false)
                alert("Please allow popups to continue with Google sign-in.")
                return
            }

            const pollTimer = setInterval(() => {
                try {
                    if (popup.closed) {
                        clearInterval(pollTimer)
                        setLoginLoading(false)
                        return
                    }
                    if (popup.location.href.includes(window.location.origin)) {
                        const hash = popup.location.hash
                        if (hash) {
                            const params = new URLSearchParams(hash.substring(1))
                            const accessToken = params.get("access_token")
                            const idToken = params.get("id_token")
                            const token = idToken || accessToken
                            if (token) {
                                popup.close()
                                clearInterval(pollTimer)
                                handleLogin(token)
                                return
                            }
                        }
                    }
                } catch (e) {
                }
            }, 500)
        } catch (e) {
            console.error("OAuth popup error:", e)
            setLoginLoading(false)
        }
    }

    return (
        <div className="h-screen h-[100dvh] w-full flex bg-slate-50 dark:bg-[#0d0f14] text-slate-900 dark:text-white overflow-hidden relative selection:bg-indigo-500/30">
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
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/70 backdrop-blur-sm p-4 overflow-y-auto"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.92, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.92, y: 15 }}
                            transition={{ type: "spring", damping: 25, stiffness: 350 }}
                            className="w-full max-w-[360px] bg-white dark:bg-[#13151c] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-6 sm:p-7 flex flex-col gap-5 shadow-2xl my-auto"
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-linear-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/20 text-white shrink-0">
                                    <Sparkles size={20} />
                                </div>
                                <div className="flex flex-col">
                                    <h2 className="text-[17px] font-semibold text-slate-800 dark:text-slate-100 tracking-tight">
                                        ShifraAI
                                    </h2>
                                    <span className="text-[11px] text-slate-500">
                                        Multi-agent conversational intelligence
                                    </span>
                                </div>
                            </div>

                            <p className="text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed">
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