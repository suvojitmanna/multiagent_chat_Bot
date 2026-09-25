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

export const deductCredits = async (req, res) => {
  try {
    const userId = req.body.userId || req.headers["x-user-id"];
    const agent = req.body.agent;

    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "User ID is required" });
    }

    const COST = {
      auto: 1,
      chat: 1,
      search: 5,
      coding: 10,
      pdf: 10,
      ppt: 10,
      image: 10,
    };

    const user = await User.findById(userId);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (user.credits === undefined || user.credits === null) {
      user.credits = 100;
    }
    if (user.totalCredits === undefined || user.totalCredits === null) {
      user.totalCredits = 100;
    }

    let requiredCredits = 1;
    if (req.body.credits !== undefined) {
      requiredCredits = Number(req.body.credits);
    } else if (agent) {
      const normalizedAgent = String(agent).toLowerCase().trim();
      requiredCredits =
        COST[normalizedAgent] !== undefined ? COST[normalizedAgent] : 1;
    }

    if (user.credits < requiredCredits) {
      return res.status(400).json({
        success: false,
        message: "Insufficient credits",
        credits: user.credits,
        requiredCredits,
      });
    }

    user.credits -= requiredCredits;
    await user.save();

    const sessionId =
      req.cookies?.session || req.cookies?.sessionId || req.body.sessionId;
    if (sessionId) {
      await redis.set(
        `session-${sessionId}`,
        JSON.stringify({
          userId: user._id,
          _id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          plan: user.plan || "free",
          credits: user.credits,
          totalCredits: user.totalCredits,
          planExpiresAt: user.planExpiresAt,
        }),
        "EX",
        7 * 24 * 60 * 60,
      );
    }

    return res.status(200).json({
      success: true,
      message: "Credits deducted successfully",
      credits: user.credits,
      requiredCredits,
      user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Deduct credits error",
      error: error.message,
    });
  }
};
