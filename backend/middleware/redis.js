// backend/config/redis.js
const { createClient } = require("redis");

const redisClient = createClient({
    url: process.env.REDIS_URL || "redis://127.0.0.1:6379"
});

redisClient.on("error", (err) => {
    console.error("❌ Redis Client Error:", err);
});

redisClient.on("connect", () => {
    console.log("✅ Redis connected successfully on port 6379");
});

// Immediately connect to Redis
(async () => {
    try {
        await redisClient.connect();
    } catch (error) {
        console.error("❌ Failed to connect to Redis:", error);
    }
})();

module.exports = redisClient;
