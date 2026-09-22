import "dotenv/config";
import express from "express";
import connectDb from "./config/db.js";
import router from "./routes/agent.route.js";


const port = process.env.PORT || 8003;

const app = express();
app.use(express.json());
app.use("/", router);

app.get("/", (req, res) => {
  res.json({ status: "ok", service: "agent" });
});
app.get("/agent", (req, res) => {
  res.json({ status: "ok", service: "agent" });
});

app.listen(port, () => {
  console.log(`agent service is running on port ${port}`);
  connectDb();
});
