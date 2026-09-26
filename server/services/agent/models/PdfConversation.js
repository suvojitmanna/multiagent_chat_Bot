import mongoose from "mongoose";

const pdfMessageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ["user", "assistant", "system"],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  sources: [
    {
      pageNumber: Number,
      score: Number,
      text: String,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const pdfConversationSchema = new mongoose.Schema(
  {
    conversationId: {
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
    documentId: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: "New PDF Chat",
    },
    messages: [pdfMessageSchema],
  },
  {
    timestamps: true,
  }
);

export const PdfConversation =
  mongoose.models.PdfConversation ||
  mongoose.model("PdfConversation", pdfConversationSchema);
