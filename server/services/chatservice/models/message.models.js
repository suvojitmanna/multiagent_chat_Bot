import mongoose from "mongoose";

const filesSchema = new mongoose.Schema(
  {
    name: String,
    content: String,
  },
  { _id: false },
);

const artifactsSchema = new mongoose.Schema(
  {
    id: String,
    type: String,
    title: String,
    files: [filesSchema],
  },
  { _id: false },
);

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },

    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },

    content: {
      type: String,
      required: true,
    },
    images: [String],
    artifacts: [artifactsSchema],
  },
  { timestamps: true },
);

const Message = mongoose.model("Message", messageSchema);

export default Message;
