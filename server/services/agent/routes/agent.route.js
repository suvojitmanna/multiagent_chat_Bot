import express from "express";
import { agent } from "../controllers/agent.controller.js";
import multer from "../config/multer.js";

const router = express.Router();

router.post("/chat", multer.any(), agent);

export default router;
