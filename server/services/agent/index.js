import "dotenv/config";
import express from "express";
import path from "path";
import fs from "fs";
import axios from "axios";
import connectDb from "./config/db.js";
import router from "./routes/agent.route.js";
import pdfRagRoutes from "./routes/pdfRag.route.js";
import { customVectorDB } from "./utils/vectorStore.js";
import { getCloudinaryDownloadUrl } from "./config/cloudinary.js";

const port = process.env.PORT || 8003;
const app = express();

const pdfsDir = path.join(process.cwd(), "public", "pdfs");
if (!fs.existsSync(pdfsDir)) {
  fs.mkdirSync(pdfsDir, { recursive: true });
}

const pptsDir = path.join(process.cwd(), "public", "ppts");
if (!fs.existsSync(pptsDir)) {
  fs.mkdirSync(pptsDir, { recursive: true });
}

app.use(express.json());

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-user-id");
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

app.use("/pdfs", express.static(pdfsDir));
app.use("/ppts", express.static(pptsDir));

app.get("/download-pdf/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(pdfsDir, filename);
  if (fs.existsSync(filePath)) {
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.sendFile(filePath);
  }
  return res.status(404).send("PDF not found");
});

app.get(["/download-ppt/:filename", "/download-pptx/:filename"], (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(pptsDir, filename);
  if (fs.existsSync(filePath)) {
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.sendFile(filePath);
  }
  return res.status(404).send("Presentation not found");
});
app.get("/proxy-pdf", async (req, res) => {
  const fileUrl = req.query.url;
  if (!fileUrl) return res.status(400).send("URL parameter is required");

  try {
    let targetUrl = fileUrl;
    if (fileUrl.includes("cloudinary.com") && fileUrl.includes("/raw/upload/")) {
      const match = /\/raw\/upload\/(?:v\d+\/)?([^?#]+)/.exec(fileUrl);
      if (match && match[1]) {
        const publicId = match[1];
        const signed = getCloudinaryDownloadUrl(publicId, "raw");
        if (signed) {
          targetUrl = signed;
        }
      }
    }

    const response = await axios.get(targetUrl, {
      responseType: "stream",
      timeout: 30000,
    });

    const filename = req.query.filename || "document.pdf";
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return response.data.pipe(res);
  } catch (err) {
    console.error("[Proxy PDF] Error downloading file:", err.message);
    return res.status(500).send(`Failed to download PDF: ${err.message}`);
  }
});

app.use("/pdf", pdfRagRoutes);
app.use("/api/pdf", pdfRagRoutes);

app.use("/", router);

app.get("/", (req, res) => {
  res.json({ status: "ok", service: "agent" });
});

app.get("/agent", (req, res) => {
  res.json({ status: "ok", service: "agent" });
});

app.listen(port, async () => {
  console.log(`agent service is running on port ${port}`);
  await connectDb();
  await customVectorDB.init();
});
