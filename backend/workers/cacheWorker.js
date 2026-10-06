const redisClient = require("../middleware/redis");
const EventTypes = require("../events/eventTypes");

const TASKS_CACHE_KEY = "all_tasks";

/**
 * Asynchronous Worker: Decouples cache invalidation from primary HTTP request lifecycles.
 */
function registerCacheWorker(eventBus) {
    const invalidationEvents = [
        EventTypes.TASK_CREATED,
        EventTypes.TASK_UPDATED,
        EventTypes.TASK_DELETED,
        EventTypes.TASK_CACHE_INVALIDATE,
        EventTypes.BATCH_TASK_COMPLETED
    ];

    invalidationEvents.forEach((eventType) => {
        eventBus.subscribe(eventType, async (event) => {
            try {
                if (redisClient && redisClient.isOpen) {
                    await redisClient.del(TASKS_CACHE_KEY);
                    console.log(`🧹 [CacheWorker] Redis key '${TASKS_CACHE_KEY}' evicted asynchronously on ${event.type}`);
                }
            } catch (err) {
                console.warn(`⚠️ [CacheWorker] Cache eviction warning for ${event.type}:`, err.message);
            }
        });
    });

    console.log("✅ [EDA Workers] CacheWorker registered for cache invalidation events.");
}

module.exports = registerCacheWorker;
