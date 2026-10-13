// backend/middleware/redis.js
const { createClient } = require("redis");

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

const redisClient = createClient({
    url: redisUrl,
    socket: {
        reconnectStrategy: (retries) => {
            // Stop retrying after 2 attempts to avoid log spam if Redis is not active
            if (retries > 2) {
                return false;
            }
            return Math.min(retries * 100, 500);
        }
    }
});

redisClient.on("error", (err) => {
    // Only log error if Redis was previously connected or in active operations
    if (redisClient.isOpen) {
        console.error("❌ Redis Client Error:", err.message);
    }
});

redisClient.on("connect", () => {
    console.log("✅ Redis connected successfully");
});

// Immediately connect to Redis
(async () => {
    try {
        await redisClient.connect();
    } catch (error) {
        console.warn("ℹ️ Optional Redis not available - caching will operate in memory/bypass mode.");
    }
})();

module.exports = redisClient;

