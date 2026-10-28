const mongoose = require("mongoose");

const productivityStatSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true,
            unique: true,
            index: true
        },
        userEmail: {
            type: String,
            default: "guest"
        },
        completedTasksCount: {
            type: Number,
            default: 0
        },
        productivityScore: {
            type: Number,
            default: 100
        },
        lastCompletedAt: {
            type: Date,
            default: null
        },
        recentActivities: [
            {
                taskId: String,
                taskTitle: String,
                completedAt: {
                    type: Date,
                    default: Date.now
                }
            }
        ]
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("ProductivityStat", productivityStatSchema);
