import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    documentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    filename: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    pageCount: {
      type: Number,
      default: 0,
    },
    chunkCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["uploading", "extracting", "embedding", "ready", "error"],
      default: "uploading",
      index: true,
    },
    error: {
      type: String,
      default: null,
    },
    localPath: {
      type: String,
      default: null,
    },
    cloudinaryUrl: {
      type: String,
      default: null,
    },
    mimeType: {
      type: String,
      default: "application/pdf",
    },
  },
  {
    timestamps: true,
  }
);

export const Document =
  mongoose.models.Document || mongoose.model("Document", documentSchema);
