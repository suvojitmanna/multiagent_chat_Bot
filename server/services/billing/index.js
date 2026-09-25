import "dotenv/config";
import express from "express";
import connectDb from "./config/db.js";
import router from "./routes/billing.route.js";

const port = process.env.PORT || 8004;
const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "ok", service: "billing" });
});

app.use("/", router);
app.use("/api/billing", router);

app.get("/billing", (req, res) => {
  res.json({ status: "ok", service: "billing" });
});

app.listen(port, () => {
  console.log(`billing service is running on port ${port}`);
  connectDb();
});
