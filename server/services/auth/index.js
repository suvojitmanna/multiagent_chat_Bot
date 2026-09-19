import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import connectDb from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";

dotenv.config();

const port = process.env.PORT || 8001;
const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || true,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.json({ status: "ok", service: "auth" });
});
app.get("/auth", (req, res) => {
  res.json({ status: "ok", service: "auth" });
});

app.use("/auth", authRoutes);

app.listen(port, () => {
  console.log(`Auth service is running on port ${port}`);
  connectDb();
});

