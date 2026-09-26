import express from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import proxy from "express-http-proxy";
import cookieParser from "cookie-parser";
import cors from "cors";
import protect from "./middleware/auth.middleware.js";
import { getCurrentUser } from "./controllers/user.controller.js";
import { proxyWithHeader } from "./utils/proxyWithHeader.js";

dotenv.config();

const port = process.env.PORT || 8000;

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || true,
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(morgan("dev"));
app.use("/api/auth", proxyWithHeader(process.env.AUTH_SERVICE));
app.use("/api/chat", protect, proxyWithHeader(process.env.CHAT_SERVICE));
app.use("/api/agent", protect, proxyWithHeader(process.env.AGENT_SERVICE));
app.use("/api/pdf", protect, proxyWithHeader(process.env.AGENT_SERVICE, { pathPrefix: "/pdf" }));
app.use("/api/billing", protect, proxyWithHeader(process.env.BILLING_SERVICE));
app.get("/api/me", protect, getCurrentUser);

app.get("/", (req, res) => {
  res.json({ message: "hello from gateway" });
});

app.listen(port, () => {
  console.log(`Gateway server is running on port ${port}`);
});
