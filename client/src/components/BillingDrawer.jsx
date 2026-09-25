import React, { useState } from 'react'
import { AnimatePresence, motion } from "framer-motion"
import { Crown, X, Loader2 } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { createOrder } from '../features/createOrder.js'
import { verifyPayment } from '../features/verifyPayment.js'
import { setUserdata } from '../redux/userSlice.js'

const BillingDrawer = ({ open, onClose }) => {
  const dispatch = useDispatch()
  const userData = useSelector((state) => state.user?.userData)
  const [loadingPlan, setLoadingPlan] = useState(null)

  const handleUpgrade = async (plan) => {
    try {
      setLoadingPlan(plan)
      const data = await createOrder(plan)
      if (!data || (!data.order && !data.id)) {
        console.error("Order creation failed:", data)
        return
      }

      const orderObj = data.order || data
      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY || import.meta.env.VITE_RAZORPAY_KEY_ID

      const options = {
        key: razorpayKey,
        amount: orderObj.amount,
        currency: orderObj.currency || "INR",
        order_id: orderObj.id,
        name: "ShifraAI",
        description: `${plan.toUpperCase()} Plan Subscription`,
        handler: async function (response) {
          try {
            const verifyRes = await verifyPayment(response)
            if (verifyRes && verifyRes.success) {
              dispatch(
                setUserdata({
                  ...userData,
                  plan: verifyRes.payment.plan,
                  credits: (userData?.credits || 0) + (verifyRes.payment.credits || 0),
                  totalCredits: (userData?.totalCredits || 100) + (verifyRes.payment.credits || 0),
                })
              )
              onClose()
            }
          } catch (err) {
            console.error("Payment verification failed:", err)
          }
        },
        prefill: {
          name: userData?.name || "",
          email: userData?.email || "",
          contact: userData?.phone || "9999999999",
          method: "upi",
        },
        config: {
          display: {
            blocks: {
              upi: {
                name: "Pay via UPI / QR",
                instruments: [
                  {
                    method: "upi",
                    flows: ["qr", "intent", "collect"],
                  },
                ],
              },
              other: {
                name: "Cards / Netbanking",
                instruments: [
                  { method: "card" },
                  { method: "netbanking" },
                  { method: "wallet" },
                ],
              },
            },
            sequence: ["block.upi", "block.other"],
            preferences: {
              show_default_blocks: true,
            },
          },
        },
        notes: {
          address: "Billing address",
        },
        theme: {
          color: "#6366f1",
        },
      }

      if (window.Razorpay) {
        const rzp = new window.Razorpay(options)
        rzp.on('payment.failed', function (response) {
          console.error("Payment failed:", response)
        })
        rzp.open()
      } else {
        console.error("Razorpay SDK not loaded on window")
      }
    } catch (error) {
      console.error("Error starting checkout:", error)
    } finally {
      setLoadingPlan(null)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="billing-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 cursor-pointer"
        />
      )}
      {open && (
        <motion.div
          key="billing-drawer"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="fixed right-0 top-0 h-screen w-full max-w-[380px] bg-[#0f1117] border-l border-white/10 shadow-2xl flex flex-col z-50 overflow-hidden"
        >
          <div className="flex items-center justify-between p-5 border-b border-white/10">
            <div>
              <div className="text-white text-lg font-semibold">
                Billing & Subscription
              </div>
              <div className="text-slate-400 text-sm">
                Plans & Credits
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Close"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
          <div className="p-5">
            <div className="rounded-xl bg-white/[0.04] border border-white/10 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">
                    Current Plan
                  </p>
                  <h3 className="text-white text-xl font-bold capitalize">
                    {userData?.plan || "Free"}
                  </h3>
                </div>

                <Crown className="text-yellow-400" />
              </div>
              <div className="mt-5">
                <div className="flex justify-between text-xs text-slate-400 mb-2">
                  <span>Credits</span>
                  <span>
                    {userData?.credits !== undefined ? userData.credits : 100}/{userData?.totalCredits || 100}
                  </span>
                </div>

                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        (((userData?.credits !== undefined ? userData.credits : 100) / (userData?.totalCredits || 100)) * 100),
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="px-5 flex-1 overflow-y-auto space-y-4 pb-6">
            <div className="rounded-xl border border-white/10 p-4 bg-white/[0.02]">
              <h3 className="text-white font-semibold">Starter Plan</h3>
              <p className="text-indigo-400 text-2xl font-bold mt-2">₹199</p>
              <p className="text-slate-400 text-sm mt-1">500 Credits</p>
              <button
                type="button"
                disabled={userData?.plan === "starter" || loadingPlan === "starter"}
                className={`mt-4 w-full rounded-lg py-2 text-white font-medium flex items-center justify-center gap-2 cursor-pointer transition-colors ${userData?.plan === "starter"
                  ? "bg-gray-600/50 cursor-not-allowed opacity-60"
                  : "bg-indigo-600 hover:bg-indigo-700"
                  }`}
                onClick={() => handleUpgrade("starter")}
              >
                {loadingPlan === "starter" && <Loader2 size={16} className="animate-spin" />}
                {userData?.plan === "starter" ? "Current Plan" : "Upgrade"}
              </button>
            </div>

            <div className="rounded-xl border border-white/10 p-4 bg-white/[0.02]">
              <h3 className="text-white font-semibold">Pro Plan</h3>
              <p className="text-indigo-400 text-2xl font-bold mt-2">₹499</p>
              <p className="text-slate-400 text-sm mt-1">1000 Credits</p>
              <button
                type="button"
                disabled={userData?.plan === "pro" || loadingPlan === "pro"}
                className={`mt-4 w-full rounded-lg py-2 text-white font-medium flex items-center justify-center gap-2 cursor-pointer transition-colors ${userData?.plan === "pro"
                  ? "bg-gray-600/50 cursor-not-allowed opacity-60"
                  : "bg-indigo-600 hover:bg-indigo-700"
                  }`}
                onClick={() => handleUpgrade("pro")}
              >
                {loadingPlan === "pro" && <Loader2 size={16} className="animate-spin" />}
                {userData?.plan === "pro" ? "Current Plan" : "Upgrade"}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default BillingDrawer