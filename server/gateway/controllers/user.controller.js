import redis from "../../shared/redis/redis.js";

export const getCurrentUser = async (req, res) => {
  try {
    let user = req.user;
    const sessionId = req.cookies?.session || req.cookies?.sessionId;
    const userId = user?.userId || user?._id || user?.id;

    if (userId && process.env.AUTH_SERVICE) {
      try {
        const response = await fetch(
          `${process.env.AUTH_SERVICE}/user/${userId}`,
        );
        if (response.ok) {
          const freshUser = await response.json();
          user = {
            ...user,
            plan: freshUser.plan || "free",
            credits: freshUser.credits !== undefined ? freshUser.credits : 100,
            totalCredits:
              freshUser.totalCredits !== undefined
                ? freshUser.totalCredits
                : 100,
            planExpiresAt: freshUser.planExpiresAt,
          };
          if (sessionId) {
            await redis.set(
              `session-${sessionId}`,
              JSON.stringify(user),
              "EX",
              7 * 24 * 60 * 60,
            );
          }
        }
      } catch (err) {
        console.error("Error fetching fresh user in gateway:", err.message);
      }
    }

    return res.status(200).json(user);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: `get current user Error ${error}` });
  }
};
