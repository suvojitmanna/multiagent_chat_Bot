import express from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import proxy from "express-http-proxy";

import cors from "cors";

dotenv.config();

const port = process.env.PORT || 8000;

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || true,
    credentials: true,
  }),
);
app.use(morgan("dev"));

app.use("/auth", proxy(process.env.AUTH_SERVICE));

app.get("/", (req, res) => {
  res.json({ message: "hello from gateway" });
});

app.listen(port, () => {
  console.log(`Gateway server is running on port ${port}`);
});
