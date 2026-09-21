import redis from "../../shared/redis/redis.js";

const protect = async (req, res, next) => {
  try {
    const sessionId = req.cookies?.session || req.cookies?.sessionId;

    if (!sessionId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const session = await redis.get(`session-${sessionId}`);
    if (!session) {
      return res.status(401).json({ error: "Session Expired" });
    }

    req.user = JSON.parse(session);
    next();
  } catch (error) {
    console.log("error in middleware", error);
    return res.status(401).json({ error: "Protect Error" });
  }
};

export default protect;
