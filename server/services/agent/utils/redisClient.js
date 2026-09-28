import Redis from "ioredis";
import crypto from "crypto";

class SafeRedisClient {
  constructor() {
    this.redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
    this.client = null;
    this.isConnected = false;
    this.fallbackCache = new Map();
    this.init();
  }

  init() {
    try {
      this.client = new Redis(this.redisUrl, {
        maxRetriesPerRequest: 1,
        retryStrategy: (times) => {
          if (times > 3) {
            console.warn(
              "[Redis] Max retries reached, pausing reconnects. Fallback cache will be used.",
            );
            return null;
          }
          return Math.min(times * 1000, 3000);
        },
        lazyConnect: false,
      });

      this.client.on("connect", () => {
        this.isConnected = true;
        console.log("[Redis] Connected successfully to Redis server.");
      });

      this.client.on("error", (err) => {
        this.isConnected = false;
        console.warn(
          "[Redis] Redis error, operating in fallback mode:",
          err.message,
        );
      });

      this.client.on("close", () => {
        this.isConnected = false;
      });
    } catch (err) {
      this.isConnected = false;
      console.warn("[Redis] Failed to initialize Redis client:", err.message);
    }
  }

  hashQuery(question) {
    const normalized = String(question || "")
      .trim()
      .toLowerCase();
    return crypto
      .createHash("sha256")
      .update(normalized)
      .digest("hex")
      .slice(0, 16);
  }

  async setPdfStatus(documentId, statusData, ttlSeconds = 1800) {
    const key = `pdf:status:${documentId}`;
    const payload = JSON.stringify({
      ...statusData,
      updatedAt: new Date().toISOString(),
    });

    if (this.isConnected && this.client) {
      try {
        await this.client.set(key, payload, "EX", ttlSeconds);
        return;
      } catch (e) {
        console.warn("[Redis] setPdfStatus failed:", e.message);
      }
    }
    this.fallbackCache.set(key, {
      payload,
      expires: Date.now() + ttlSeconds * 1000,
    });
  }

  async getPdfStatus(documentId) {
    const key = `pdf:status:${documentId}`;
    if (this.isConnected && this.client) {
      try {
        const data = await this.client.get(key);
        if (data) return JSON.parse(data);
      } catch (e) {
        console.warn("[Redis] getPdfStatus failed:", e.message);
      }
    }

    const fallback = this.fallbackCache.get(key);
    if (fallback) {
      if (Date.now() > fallback.expires) {
        this.fallbackCache.delete(key);
        return null;
      }
      return JSON.parse(fallback.payload);
    }
    return null;
  }

  async setCachedRagAnswer(
    documentId,
    question,
    answerData,
    ttlSeconds = 3600,
  ) {
    const queryHash = this.hashQuery(question);
    const key = `rag:answer:${documentId}:${queryHash}`;
    const payload = JSON.stringify(answerData);

    if (this.isConnected && this.client) {
      try {
        await this.client.set(key, payload, "EX", ttlSeconds);
        return;
      } catch (e) {
        console.warn("[Redis] setCachedRagAnswer failed:", e.message);
      }
    }
    this.fallbackCache.set(key, {
      payload,
      expires: Date.now() + ttlSeconds * 1000,
    });
  }

  async getCachedRagAnswer(documentId, question) {
    const queryHash = this.hashQuery(question);
    const key = `rag:answer:${documentId}:${queryHash}`;

    if (this.isConnected && this.client) {
      try {
        const cached = await this.client.get(key);
        if (cached) {
          return JSON.parse(cached);
        }
      } catch (e) {
        console.warn("[Redis] getCachedRagAnswer failed:", e.message);
      }
    }

    const fallback = this.fallbackCache.get(key);
    if (fallback) {
      if (Date.now() > fallback.expires) {
        this.fallbackCache.delete(key);
        return null;
      }
      return JSON.parse(fallback.payload);
    }

    return null;
  }

  async appendChatMessage(
    userId,
    conversationId,
    role,
    content,
    ttlSeconds = 86400,
  ) {
    if (!userId || !conversationId) return;
    const key = `chat:${userId}:${conversationId}`;
    const message = JSON.stringify({ role, content, timestamp: Date.now() });

    if (this.isConnected && this.client) {
      try {
        await this.client.rpush(key, message);
        await this.client.ltrim(key, -30, -1);
        await this.client.expire(key, ttlSeconds);
        return;
      } catch (e) {
        console.warn("[Redis] appendChatMessage failed:", e.message);
      }
    }

    const list = this.fallbackCache.get(key) || [];
    list.push({ role, content, timestamp: Date.now() });
    if (list.length > 30) list.shift();
    this.fallbackCache.set(key, list);
  }

  async getChatHistory(userId, conversationId, limit = 10) {
    if (!userId || !conversationId) return [];
    const key = `chat:${userId}:${conversationId}`;

    if (this.isConnected && this.client) {
      try {
        const raw = await this.client.lrange(key, -limit, -1);
        if (raw && raw.length > 0) {
          return raw.map((item) => JSON.parse(item));
        }
      } catch (e) {
        console.warn("[Redis] getChatHistory failed:", e.message);
      }
    }

    const list = this.fallbackCache.get(key) || [];
    return list.slice(-limit);
  }

  async deleteChatHistory(userId, conversationId) {
    if (!userId || !conversationId) return;
    const key = `chat:${userId}:${conversationId}`;

    if (this.isConnected && this.client) {
      try {
        await this.client.del(key);
      } catch (e) {
        console.warn("[Redis] deleteChatHistory failed:", e.message);
      }
    }
    this.fallbackCache.delete(key);
  }

  async clearDocumentCache(documentId) {
    if (this.isConnected && this.client) {
      try {
        const pattern = `rag:answer:${documentId}:*`;
        const keys = await this.client.keys(pattern);
        if (keys && keys.length > 0) {
          await this.client.del(...keys);
        }
        await this.client.del(`pdf:status:${documentId}`);
      } catch (e) {
        console.warn("[Redis] clearDocumentCache failed:", e.message);
      }
    }

    for (const key of this.fallbackCache.keys()) {
      if (key.includes(documentId)) {
        this.fallbackCache.delete(key);
      }
    }
  }

  async checkRateLimit(
    identifier,
    agent = "general",
    limit = 20,
    windowSeconds = 60,
  ) {
    const safeAgent = String(agent || "general")
      .toLowerCase()
      .trim();
    const safeId = String(identifier || "anonymous").trim();
    const key = `ratelimit:agent:${safeAgent}:${safeId}`;

    if (this.isConnected && this.client) {
      try {
        const pipeline = this.client.pipeline();
        pipeline.incr(key);
        pipeline.ttl(key);
        const results = await pipeline.exec();

        const count = results[0][1];
        let ttl = results[1][1];

        if (ttl === -1 || count === 1) {
          await this.client.expire(key, windowSeconds);
          ttl = windowSeconds;
        }

        const remaining = Math.max(0, limit - count);
        const allowed = count <= limit;
        const resetSeconds = ttl > 0 ? ttl : windowSeconds;

        if (!allowed) {
          await this.client.decr(key).catch(() => {});
        }

        return {
          allowed,
          count,
          limit,
          remaining,
          resetSeconds,
        };
      } catch (err) {
        console.warn(
          `[Redis] Rate limit check failed for ${key}, falling back to memory:`,
          err.message,
        );
      }
    }

    const now = Date.now();
    let entry = this.fallbackCache.get(key);

    if (!entry || now > entry.expires) {
      entry = { count: 1, expires: now + windowSeconds * 1000 };
      this.fallbackCache.set(key, entry);
      return {
        allowed: 1 <= limit,
        count: 1,
        limit,
        remaining: Math.max(0, limit - 1),
        resetSeconds: windowSeconds,
      };
    }

    entry.count += 1;
    const remaining = Math.max(0, limit - entry.count);
    const allowed = entry.count <= limit;
    const resetSeconds = Math.max(1, Math.ceil((entry.expires - now) / 1000));

    if (!allowed) {
      entry.count -= 1;
    }

    return {
      allowed,
      count: entry.count,
      limit,
      remaining,
      resetSeconds,
    };
  }
}

export const safeRedis = new SafeRedisClient();
