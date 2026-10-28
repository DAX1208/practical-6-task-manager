const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "awdf_task_manager_secret_key_2026";

const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                message: "Authentication required. Please log in."
            });
        }

        const parts = authHeader.split(" ");

        if (parts.length !== 2 || parts[0] !== "Bearer" || !parts[1]) {
            return res.status(401).json({
                message: "Invalid authorization format. Format must be 'Bearer <token>'"
            });
        }

        const token = parts[1];
        const decoded = jwt.verify(token, JWT_SECRET);

        req.user = decoded;
        next();
    } catch (error) {
        console.warn("JWT verification failed:", error.message);

        return res.status(401).json({
            message: "Invalid or expired token. Please log in again."
        });
    }
};

module.exports = authMiddleware;
module.exports.JWT_SECRET = JWT_SECRET;