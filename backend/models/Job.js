const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
    {
        jobId: {
            type: String,
            required: true,
            unique: true,
            index: true
        },
        type: {
            type: String,
            required: true
        },
        status: {
            type: String,
            enum: ["queued", "processing", "completed", "failed"],
            default: "queued",
            index: true
        },
        totalItems: {
            type: Number,
            default: 0
        },
        processedItems: {
            type: Number,
            default: 0
        },
        results: {
            type: mongoose.Schema.Types.Mixed
        },
        error: {
            type: String
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        completedAt: {
            type: Date
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Job", jobSchema);
