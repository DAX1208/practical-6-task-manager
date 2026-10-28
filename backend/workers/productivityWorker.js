const EventTypes = require("../events/eventTypes");
const ProductivityStat = require("../models/ProductivityStat");
const cache = require("../middleware/cache");

/**
 * Asynchronous Productivity Worker
 * Listens for TASK_COMPLETED events emitted via Node.js EventEmitter.
 * Updates user productivity metrics without blocking or failing the HTTP response.
 */
function registerProductivityWorker(eventBus) {
    eventBus.subscribe(EventTypes.TASK_COMPLETED, async (event) => {
        try {
            const { payload, metadata } = event;
            const actor = metadata?.actor || { userId: "anonymous", email: "guest" };
            const userId = String(actor.userId || "anonymous");

            console.log(`📈 [ProductivityWorker] Processing async productivity stats for user: ${userId}`);

            // Find or create user's productivity stats document
            const stat = await ProductivityStat.findOneAndUpdate(
                { userId },
                {
                    $setOnInsert: { userId, userEmail: actor.email || "guest" },
                    $inc: { completedTasksCount: 1, productivityScore: 10 },
                    $set: { lastCompletedAt: new Date() },
                    $push: {
                        recentActivities: {
                            $each: [
                                {
                                    taskId: String(payload._id || payload.taskId || "unknown"),
                                    taskTitle: String(payload.title || "Completed Task"),
                                    completedAt: new Date()
                                }
                            ],
                            $slice: -20 // keep last 20 activities
                        }
                    }
                },
                { upsert: true, returnDocument: "after" }
            );

            // Invalidate user cached statistics
            const cacheKey = `stats_${userId}`;
            cache.del(cacheKey);

            console.log(`✅ [ProductivityWorker] Updated score (${stat.productivityScore}) for user ${userId}. Invalidated cache '${cacheKey}'.`);
        } catch (error) {
            // Fault isolation: Never throw unhandled exception to prevent crashing main thread
            console.error("❌ [ProductivityWorker] Error updating productivity stats:", error.message);
            // Routed to DLQ via eventBus or monitored gracefully
        }
    });

    console.log("✅ [EDA Workers] ProductivityWorker registered for TASK_COMPLETED events.");
}

module.exports = registerProductivityWorker;
