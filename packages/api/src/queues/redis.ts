import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

export const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

export const connection = {
  host: redis.options.host || "localhost",
  port: redis.options.port || 6379,
  password: redis.options.password || undefined,
  tls: redis.options.tls ? {} : undefined,
};

export default redis;