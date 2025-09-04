import "server-only";

import { Redis } from "ioredis";
import globalLogger from "lib/logger";
import { colorize } from "consola/utils";

const logger = globalLogger.withDefaults({
  message: colorize("dim", "[Redis Client] "),
});

let redisClient: Redis | null = null;

/**
 * Get or create Redis client instance
 * @returns Redis client instance
 */
export function getRedisClient(): Redis {
  if (redisClient) {
    return redisClient;
  }

  const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

  try {
    redisClient = new Redis(redisUrl, {
      retryDelayOnFailover: 100,
      enableReadyCheck: true,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      connectTimeout: 10000,
      commandTimeout: 5000,
    });

    // Add event listeners for monitoring
    redisClient.on("connect", () => {
      logger.info("Redis client connected");
    });

    redisClient.on("ready", () => {
      logger.info("Redis client ready");
    });

    redisClient.on("error", (error) => {
      logger.error(`Redis client error: ${error}`);
    });

    redisClient.on("close", () => {
      logger.warn("Redis client connection closed");
    });

    redisClient.on("reconnecting", () => {
      logger.info("Redis client reconnecting...");
    });

    logger.info(`Redis client initialized with URL: ${redisUrl}`);
    return redisClient;
  } catch (error) {
    logger.error(`Failed to initialize Redis client: ${error}`);
    throw new Error(`Redis connection failed: ${error}`);
  }
}

/**
 * Close Redis client connection
 */
export async function closeRedisClient(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info("Redis client connection closed");
  }
}

/**
 * Check if Redis client is connected
 * @returns True if connected, false otherwise
 */
export function isRedisConnected(): boolean {
  return redisClient?.status === "ready";
}
