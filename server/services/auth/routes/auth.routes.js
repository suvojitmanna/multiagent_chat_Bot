import express from "express";
import {
  getGoogleAuthUrl,
  googleCallback,
  verifyGoogleToken,
  getMe,
  logout,
} from "../controllers/auth.controller.js";
import { verifyAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/google", getGoogleAuthUrl);
router.get("/google/url", (req, res, next) => {
  req.query.json = "true";
  getGoogleAuthUrl(req, res, next);
});
router.get("/google/callback", googleCallback);
router.post("/google/verify", verifyGoogleToken);

router.get("/me", verifyAuth, getMe);
router.post("/logout", logout);
router.get("/logout", logout);

export default router;
