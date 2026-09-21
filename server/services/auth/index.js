import express from "express";
import dotenv from "dotenv";
import connectDb from "./config/db.js";
import router from "./routes/auth.routes.js";

dotenv.config();

const port = process.env.PORT || 8001;
const app = express();

app.use(express.json());
app.use("/", router)

app.get("/", (req, res) => {
  res.json({ status: "ok", service: "auth" });
});
app.get("/auth", (req, res) => {
  res.json({ status: "ok", service: "auth" });
});

app.listen(port, () => {
  console.log(`Auth service is running on port ${port}`);
  connectDb();
});

