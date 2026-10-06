const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
    {
        eventId: {
            type: String,
            required: true,
            index: true
        },
        action: {
            type: String,
            required: true,
            index: true
        },
        entityType: {
            type: String,
            default: "Task"
        },
        entityId: {
            type: String,
            required: true,
            index: true
        },
        actor: {
            userId: { type: String, default: "anonymous" },
            email: { type: String, default: "guest" }
        },
        details: {
            type: mongoose.Schema.Types.Mixed
        },
        timestamp: {
            type: Date,
            default: Date.now,
            index: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("AuditLog", auditLogSchema);
