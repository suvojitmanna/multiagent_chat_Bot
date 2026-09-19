import { OAuth2Client } from "google-auth-library";
import dotenv from "dotenv";

dotenv.config();

export const getOAuth2Client = () => {
  return new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_CALLBACK_URL || "http://localhost:8000/auth/google/callback"
  );
};

export const generateGoogleAuthUrl = (state) => {
  const client = getOAuth2Client();
  return client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "openid",
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
    prompt: "consent",
    state: state || undefined,
  });
};

export const exchangeCodeForTokens = async (code) => {
  const client = getOAuth2Client();
  const { tokens } = await client.getToken(code);
  return tokens;
};

export const verifyGoogleIdToken = async (idToken) => {
  const client = getOAuth2Client();
  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  return ticket.getPayload();
};
