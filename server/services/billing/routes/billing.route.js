import express from "express";
import {
  createOrder,
  verifyPayment,
} from "../controller.js/billing.controller.js";

const router = express.Router();

router.post("/create", createOrder);
router.post("/verify", verifyPayment);

export default router;
