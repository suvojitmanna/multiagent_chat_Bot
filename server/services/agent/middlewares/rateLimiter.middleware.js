import { safeRedis } from "../utils/redisClient.js";

export const AGENT_LIMITS = {
  chat: { limit: 4, windowSeconds: 60 },
  auto: { limit: 3, windowSeconds: 60 },
  search: { limit: 5, windowSeconds: 60 },
  coding: { limit: 3, windowSeconds: 60 },
  image: { limit: 2, windowSeconds: 60 },
  imageanalyzer: { limit: 1, windowSeconds: 60 },
  pdf: { limit: 1, windowSeconds: 60 },
  ppt: { limit: 1, windowSeconds: 60 },
  pdfrag: { limit: 1, windowSeconds: 60 },
  default: { limit: 5, windowSeconds: 60 },
  global: { limit: 5, windowSeconds: 60 },
};

export const getClientIdentifier = (req) => {
  return (
    req.headers["x-user-id"] ||
    req.user?._id ||
    req.user?.id ||
    req.ip ||
    req.connection?.remoteAddress ||
    "anonymous"
  );
};

export const agentRateLimiter = async (req, res, next) => {
  try {
    const identifier = getClientIdentifier(req);
    const rawAgent = req.body?.agent || req.query?.agent || "auto";
    const agent = String(rawAgent).toLowerCase().trim();

    const config = AGENT_LIMITS[agent] || AGENT_LIMITS.default;

    const globalCheck = await safeRedis.checkRateLimit(
      identifier,
      "global_all",
      AGENT_LIMITS.global.limit,
      AGENT_LIMITS.global.windowSeconds,
    );

    if (!globalCheck.allowed) {
      res.setHeader("Retry-After", globalCheck.resetSeconds);
      res.setHeader("X-RateLimit-Limit", globalCheck.limit);
      res.setHeader("X-RateLimit-Remaining", 0);
      res.setHeader("X-RateLimit-Reset", globalCheck.resetSeconds);

      console.warn(
        `🛑 [RateLimit] Global limit exceeded for user: ${identifier}`,
      );
      return res.status(429).json({
        error: "Rate limit exceeded",
        message: `Too many total agent requests. Please slow down and try again in ${globalCheck.resetSeconds} seconds.`,
        retryAfter: globalCheck.resetSeconds,
      });
    }

    const agentCheck = await safeRedis.checkRateLimit(
      identifier,
      agent,
      config.limit,
      config.windowSeconds,
    );

    res.setHeader("X-RateLimit-Limit", agentCheck.limit);
    res.setHeader("X-RateLimit-Remaining", agentCheck.remaining);
    res.setHeader("X-RateLimit-Reset", agentCheck.resetSeconds);

    if (!agentCheck.allowed) {
      res.setHeader("Retry-After", agentCheck.resetSeconds);
      console.warn(
        `🛑 [RateLimit] Limit exceeded for agent [${agent}] by user: ${identifier} (${agentCheck.count}/${agentCheck.limit})`,
      );

      return res.status(429).json({
        error: "Rate limit exceeded",
        message: `Too many requests for the [${agent}] agent. Limit is ${agentCheck.limit} requests per ${config.windowSeconds}s. Try again in ${agentCheck.resetSeconds} seconds.`,
        agent,
        limit: agentCheck.limit,
        remaining: 0,
        retryAfter: agentCheck.resetSeconds,
      });
    }

    next();
  } catch (err) {
    console.error("[RateLimiter] Unexpected error:", err);
    next();
  }
};

export const createRouteRateLimiter = (
  actionName,
  limit = 10,
  windowSeconds = 60,
) => {
  return async (req, res, next) => {
    try {
      const identifier = getClientIdentifier(req);
      const result = await safeRedis.checkRateLimit(
        identifier,
        actionName,
        limit,
        windowSeconds,
      );

      res.setHeader("X-RateLimit-Limit", result.limit);
      res.setHeader("X-RateLimit-Remaining", result.remaining);
      res.setHeader("X-RateLimit-Reset", result.resetSeconds);

      if (!result.allowed) {
        res.setHeader("Retry-After", result.resetSeconds);
        console.warn(
          `🛑 [RateLimit] Route [${actionName}] limit exceeded for user: ${identifier}`,
        );

        return res.status(429).json({
          error: "Rate limit exceeded",
          message: `Too many requests for ${actionName}. Please wait ${result.resetSeconds} seconds before trying again.`,
          action: actionName,
          retryAfter: result.resetSeconds,
        });
      }

      next();
    } catch (err) {
      console.error(`[RateLimiter] Error in ${actionName}:`, err);
      next();
    }
  };
};
