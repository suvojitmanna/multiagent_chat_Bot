import { getAuth } from "firebase-admin/auth";
import { app } from "../config/firebase.js";
import User from "../models/user.model.js";
import crypto from "crypto";
import redis from "../../../redis.js";

export const login = async (req, res) => {
  try {
    const { token } = req.body;
    const decoded = await getAuth(app).verifyIdToken(token);
    let user = await User.findOne({
      firebaseUid: decoded.uid,
    });
    if (!user) {
      user = await User.create({
        firebaseUid: decoded.uid,
        name: decoded.name,
        email: decoded.email,
        avatar: decoded.picture,
        plan: "free",
        credits: 100,
        totalCredits: 100,
        planExpiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
      });
    } else {
      let updated = false;
      if (!user.plan) {
        user.plan = "free";
        updated = true;
      }
      if (user.credits === undefined) {
        user.credits = 100;
        updated = true;
      }
      if (user.totalCredits === undefined) {
        user.totalCredits = 100;
        updated = true;
      }
      if (!user.planExpiresAt) {
        user.planExpiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
        updated = true;
      }
      if (updated) {
        await user.save();
      }
    }

    const sessionId = crypto.randomUUID();

    await redis.set(
      `session-${sessionId}`,
      JSON.stringify({
        userId: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        plan: user.plan || "free",
        credits: user.credits ?? 100,
        totalCredits: user.totalCredits ?? 100,
        planExpiresAt: user.planExpiresAt,
      }),
      "EX",
      7 * 24 * 60 * 60,
    );

    res.cookie("session", sessionId, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return res.status(200).json({ success: true, user });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "auth server error",
      error: error.message,
    });
  }
};

export const logout = async (req, res) => {
  try {
    const sessionId = req.cookies?.session;

    if (sessionId) {
      await redis.del(`session-${sessionId}`);
    }

    res.clearCookie("session", {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    });

    return res
      .status(200)
      .json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "auth server error",
      error: error.message,
    });
  }
};

export const updateUserPayment = async (req, res) => {
  try {
    const { plan, credits, userId } = req.body;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.plan = plan;
    user.credits += credits;
    user.totalCredits += credits;
    user.planExpiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
    await user.save();

    const sessionId = crypto.randomUUID();

    await redis.set(
      `session-${sessionId}`,
      JSON.stringify({
        userId: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        plan: user.plan,
        credits: user.credits,
        totalCredits: user.totalCredits,
        planExpiresAt: user.planExpiresAt,
      }),
      "EX",
      7 * 24 * 60 * 60,
    );

    res.cookie("session", sessionId, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return res.status(200).json({ success: true, user, session: sessionId });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "update user payment error",
      error: error.message,
    });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    let user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let updated = false;
    if (!user.plan) {
      user.plan = "free";
      updated = true;
    }
    if (user.credits === undefined) {
      user.credits = 100;
      updated = true;
    }
    if (user.totalCredits === undefined) {
      user.totalCredits = 100;
      updated = true;
    }
    if (!user.planExpiresAt) {
      user.planExpiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
      updated = true;
    }
    if (updated) {
      await user.save();
    }

    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "get user by id error",
      error: error.message,
    });
  }
};
