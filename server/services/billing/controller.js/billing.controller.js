import crypto from "crypto";
import { PLANS } from "../config/plan.js";
import razorPay from "../config/razorPay.js";
import Payment from "../models/payment.model.js";
import axios from "axios";

export const createOrder = async (req, res) => {
  try {
    const { plan } = req.body;
    const userId = req.headers["x-user-id"] || req.headers.userid;
    const selectedPlan = PLANS[plan];
    if (!selectedPlan) {
      return res.status(400).json({ message: "Invalid plan" });
    }

    const order = await razorPay.orders.create({
      amount: selectedPlan.amount * 100,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    });

    await Payment.create({
      userId,
      orderId: order.id,
      amount: selectedPlan.amount,
      credits: selectedPlan.credits,
      plan: selectedPlan.id,
      currency: order.currency,
      status: "created",
    });

    return res.status(200).json({ order, plan: selectedPlan });
  } catch (error) {
    console.error("Error in creating order:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const razorpay_order_id = req.body.razorpay_order_id || req.body.razorPay_orderID;
    const razorpay_payment_id = req.body.razorpay_payment_id || req.body.razorPay_paymentID;
    const razorpay_signature = req.body.razorpay_signature || req.body.razorPay_signature;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Missing payment verification parameters" });
    }

    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generatedSignature = hmac.digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    const paymentDoc = await Payment.findOne({ orderId: razorpay_order_id });

    if (!paymentDoc) {
      return res.status(404).json({ message: "Payment not found" });
    }

    paymentDoc.status = "paid";
    paymentDoc.paymentId = razorpay_payment_id;
    await paymentDoc.save();

    await axios.post(`${process.env.AUTH_SERVICE}/update-plan`, {
      userId: paymentDoc.userId,
      plan: paymentDoc.plan,
      credits: paymentDoc.credits,
    });

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      payment: paymentDoc,
    });
  } catch (error) {
    console.error("Error in payment verification:", error);
    return res.status(500).json({
      success: false,
      message: "Error in payment verification",
      error: error.message,
    });
  }
};
