import Conversation from "../models/conversation.models.js";
import Message from "../models/message.models.js";

export const createConverSation = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] || req.header("x-user-id");
    const title = req.body?.title || req.query?.title;
    console.log("Creating conversation for userId:", userId);
    const conversation = await Conversation.create({
      userId,
      ...(title ? { title: String(title).trim() } : {}),
    });
    return res
      .status(201)
      .json({ message: "Conversation created successfully", conversation });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "Error while creating conversation" });
  }
};

export const getConversations = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] || req.header("x-user-id");
    console.log("Fetching conversations for userId:", userId);
    const conversations = await Conversation.find({
      userId,
    }).sort({ updatedAt: -1 });
    return res
      .status(200)
      .json({ message: "Conversation fetched successfully", conversations });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "Error while creating conversation" });
  }
};

export const saveMessage = async (req, res) => {
  try {
    const { conversationId, role, content, images } = req.body;
    if (!conversationId || !role || !content) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }
    const message = await Message.create({
      conversationId,
      role,
      content,
      images,
    });
    return res
      .status(201)
      .json({ message: "Message saved successfully", message });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error while saving message" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    if (!conversationId) {
      return res.status(400).json({ message: "ConversationId is required" });
    }
    const messages = await Message.find({ conversationId }).sort({
      createdAt: 1,
    });
    return res
      .status(200)
      .json({ message: "Messages fetched successfully", messages });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error while fetching messages" });
  }
};

export const updateConversation = async (req, res) => {
  try {
    const id = req.body?.id || req.body?.conversationId || req.params?.id;
    const title = req.body?.title;
    if (!id) {
      return res.status(400).json({ message: "Id is required" });
    }
    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ message: "Valid title is required" });
    }
    const conversation = await Conversation.findByIdAndUpdate(
      id,
      { title: title.trim() },
      { new: true },
    );
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }
    return res
      .status(200)
      .json({ message: "Conversation updated successfully", conversation });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "Error while updating conversation" });
  }
};

export const deleteConversation = async (req, res) => {
  try {
    const id = req.params.id || req.body.id || req.body.conversationId;
    if (!id) {
      return res.status(400).json({ message: "Conversation ID is required" });
    }
    await Conversation.findByIdAndDelete(id);
    await Message.deleteMany({ conversationId: id });
    return res
      .status(200)
      .json({ success: true, message: "Conversation deleted successfully" });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "Error while deleting conversation" });
  }
};
