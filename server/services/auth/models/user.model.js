import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    avatar: {
      type: String,
      default: "",
    },
    firebaseUid: {
      type: String,
      unique: true,
      sparse: true,
    },
    plan:{
      type:String,
      default:"free"
    },
    credits:{
      type:Number,
      default:100,
    },
    totalCredits:{
      type:Number,
      default:100,
    },
    planExpiresAt:{
      type:Date,
      default:Date.now() + 30 * 24 * 60 * 60 * 1000,
    },
    
  },
  {
    timestamps: true,
  },
);

const User = mongoose.model("User", userSchema);
export default User;
