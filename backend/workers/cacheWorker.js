const redisClient = require("../middleware/redis");
const cache = require("../middleware/cache");
const EventTypes = require("../events/eventTypes");

const TASKS_CACHE_KEY = "all_tasks";

/**
 * Asynchronous Worker: Decouples cache invalidation from primary HTTP request lifecycles.
 * Invalidate both in-memory cache (scoped by user to prevent cross-user leakage) and optional Redis.
 */
function registerCacheWorker(eventBus) {
    const invalidationEvents = [
        EventTypes.TASK_CREATED,
        EventTypes.TASK_UPDATED,
        EventTypes.TASK_DELETED,
        EventTypes.TASK_STATUS_CHANGED,
        EventTypes.TASK_COMPLETED,
        EventTypes.TASK_CACHE_INVALIDATE,
        EventTypes.BATCH_TASK_COMPLETED
    ];

    invalidationEvents.forEach((eventType) => {
        eventBus.subscribe(eventType, async (event) => {
            const actor = event?.metadata?.actor;
            const userId = actor?.userId ? String(actor.userId) : null;

            // In-Memory cache eviction
            try {
                if (userId) {
                    cache.del(`stats_${userId}`);
                    cache.del(`tasks_${userId}`);
                    console.log(`🧹 [CacheWorker] In-memory cache invalidated for user: ${userId}`);
                }
                cache.del("stats_anonymous");
                cache.del("tasks_anonymous");
            } catch (memErr) {
                console.warn(`⚠️ [CacheWorker] In-memory eviction warning:`, memErr.message);
            }

            // Redis eviction (if connected)
            try {
                if (redisClient && redisClient.isOpen) {
                    await redisClient.del(TASKS_CACHE_KEY);
                    if (userId) {
                        await redisClient.del(`tasks:${userId}`);
                        await redisClient.del(`stats:${userId}`);
                    }
                    console.log(`🧹 [CacheWorker] Redis keys evicted asynchronously on ${event.type}`);
                }
            } catch (err) {
                console.warn(`⚠️ [CacheWorker] Redis cache eviction warning for ${event.type}:`, err.message);
            }
        });
    });

    console.log("✅ [EDA Workers] CacheWorker registered with user-scoped invalidation.");
}

module.exports = registerCacheWorker;
