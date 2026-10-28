/**
 * Basic in-memory rate limiter for AI generation requests.
 * Limits users/clients to at most 1 generation request per minute (60 seconds)
 * to prevent excessive API quota consumption.
 */

const WINDOW_MS = 60 * 1000; // 1 minute
const clientRequestHistory = new Map();

// Periodic cleanup of stale entries every 5 minutes to prevent memory leaks
setInterval(() => {
    const now = Date.now();
    for (const [clientId, timestamp] of clientRequestHistory.entries()) {
        if (now - timestamp > WINDOW_MS) {
            clientRequestHistory.delete(clientId);
        }
    }
}, 5 * 60 * 1000).unref(); // unref ensures this timer does not prevent process/Jest from exiting

function aiRateLimiter(req, res, next) {
    // Identify client securely using authenticated userId if available, falling back to IP
    const clientId = req.user && req.user.userId
        ? `user:${req.user.userId}`
        : `ip:${req.ip || req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "127.0.0.1"}`;

    const now = Date.now();
    const lastRequest = clientRequestHistory.get(clientId);

    if (lastRequest && now - lastRequest < WINDOW_MS) {
        const remainingSeconds = Math.ceil((WINDOW_MS - (now - lastRequest)) / 1000);
        return res.status(429).json({
            message: `Too many AI description requests. Please wait ${remainingSeconds} second(s) before trying again.`,
            retryAfter: remainingSeconds
        });
    }

    clientRequestHistory.set(clientId, now);
    next();
}

// Utility to clear history in automated test runs
aiRateLimiter.reset = () => {
    clientRequestHistory.clear();
};

module.exports = aiRateLimiter;

