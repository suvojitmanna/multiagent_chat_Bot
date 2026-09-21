import express from "express";
import dotenv from "dotenv";
import connectDb from "./config/db.js";
import router from "./routes/chat.routes.js";
dotenv.config();

const port = process.env.PORT || 8002;

const app = express();
app.use(express.json());
app.use("/", router);

app.get("/", (req, res) => {
  res.json({ status: "ok", service: "chat" });
});
app.get("/chat", (req, res) => {
  res.json({ status: "ok", service: "chat" });
});

app.listen(port, () => {
  console.log(`Chat service is running on port ${port}`);
  connectDb();
});
