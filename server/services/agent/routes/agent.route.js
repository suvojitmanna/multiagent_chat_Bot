import express from "express";
import { agent } from "../controllers/agent.controller.js";
import multer from "../config/multer.js";
import { agentRateLimiter } from "../middlewares/rateLimiter.middleware.js";

const router = express.Router();

router.post("/chat", multer.any(), agentRateLimiter, agent);

export default router;
