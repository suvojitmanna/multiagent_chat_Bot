import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import {
  generateGoogleAuthUrl,
  exchangeCodeForTokens,
  verifyGoogleIdToken,
} from "../config/google.js";

export const getGoogleAuthUrl = async (req, res) => {
  try {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return res.status(500).json({
        success: false,
        message:
          "Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in server/services/auth/.env",
      });
    }

    const state = req.query.state || undefined;
    const url = generateGoogleAuthUrl(state);
    if (req.query.json === "true") {
      return res.status(200).json({
        success: true,
        url,
      });
    }
    return res.redirect(url);
  } catch (error) {
    console.error("Error generating Google Auth URL:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate Google Auth URL",
      error: error.message,
    });
  }
};

const handleGoogleUserAndTokens = async (payload, res) => {
  const { sub: googleId, email, name, picture: avatar } = payload;

  if (!email) {
    throw new Error("Google account does not provide an email address.");
  }
  let user = await User.findOne({
    $or: [{ googleId }, { email }],
  });

  if (user) {
    let updated = false;
    if (!user.googleId) {
      user.googleId = googleId;
      updated = true;
    }
    if (!user.avatar && avatar) {
      user.avatar = avatar;
      updated = true;
    }
    if (updated) {
      await user.save();
    }
  } else {
    user = await User.create({
      name: name || email.split("@")[0],
      email,
      avatar: avatar || "",
      googleId,
    });
  }
  const jwtSecret = process.env.JWT_SECRET || "default_jwt_secret";
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
  const token = jwt.sign(
    {
      id: user._id,
      email: user.email,
      name: user.name,
    },
    jwtSecret,
    { expiresIn },
  );

  const isProduction = process.env.NODE_ENV === "production";
  res.cookie("token", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return { user, token };
};

export const googleCallback = async (req, res) => {
  try {
    const { code, error } = req.query;

    if (error) {
      return res.status(400).json({
        success: false,
        message: `Google OAuth error: ${error}`,
      });
    }

    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Authorization code is missing from callback.",
      });
    }
    const tokens = await exchangeCodeForTokens(code);

    if (!tokens.id_token) {
      return res.status(400).json({
        success: false,
        message: "Failed to retrieve ID token from Google.",
      });
    }
    const payload = await verifyGoogleIdToken(tokens.id_token);

    const { user, token } = await handleGoogleUserAndTokens(payload, res);

    if (process.env.CLIENT_URL) {
      return res.redirect(
        `${process.env.CLIENT_URL}?auth_success=true&token=${token}`,
      );
    }

    return res.status(200).json({
      success: true,
      message: "Google authentication successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error("Error in Google OAuth callback:", error);
    return res.status(500).json({
      success: false,
      message: "Authentication failed during Google callback",
      error: error.message,
    });
  }
};

export const verifyGoogleToken = async (req, res) => {
  try {
    const { credential, idToken, token: clientToken } = req.body;
    const tokenToVerify = credential || idToken || clientToken;

    if (!tokenToVerify) {
      return res.status(400).json({
        success: false,
        message: "Google ID token/credential is required in request body.",
      });
    }

    const payload = await verifyGoogleIdToken(tokenToVerify);
    const { user, token } = await handleGoogleUserAndTokens(payload, res);

    return res.status(200).json({
      success: true,
      message: "Google authentication successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error("Error verifying Google ID token:", error);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired Google token",
      error: error.message,
    });
  }
};

export const getMe = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve user profile",
      error: error.message,
    });
  }
};

export const logout = async (req, res) => {
  try {
    const isProduction = process.env.NODE_ENV === "production";
    res.clearCookie("token", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
    });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Logout failed",
      error: error.message,
    });
  }
};
