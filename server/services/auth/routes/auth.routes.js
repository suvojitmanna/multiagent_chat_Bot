import express from "express";
import {
  getUserById,
  login,
  logout,
  updateUserPayment,
} from "../controllers/auth.controller.js";

const router = express.Router();
router.post("/login", login);
router.get("/logout", logout);
router.post("/update-plan", updateUserPayment);
router.get("/user/:id", getUserById);

export default router;
