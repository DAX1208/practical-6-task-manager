/**
 * Event Types catalogue for Asynchronous Processing & Event-Driven Architecture (EDA)
 */
const EventTypes = {
    // Task Domain Events
    TASK_CREATED: "TASK_CREATED",
    TASK_UPDATED: "TASK_UPDATED",
    TASK_DELETED: "TASK_DELETED",
    TASK_STATUS_CHANGED: "TASK_STATUS_CHANGED",

    // Cache Synchronization Events
    TASK_CACHE_INVALIDATE: "TASK_CACHE_INVALIDATE",

    // Asynchronous Background Batch Processing Events
    BATCH_TASK_REQUESTED: "BATCH_TASK_REQUESTED",
    BATCH_TASK_PROGRESS: "BATCH_TASK_PROGRESS",
    BATCH_TASK_COMPLETED: "BATCH_TASK_COMPLETED",
    BATCH_TASK_FAILED: "BATCH_TASK_FAILED",

    // Auxiliary Events
    NOTIFICATION_DISPATCHED: "NOTIFICATION_DISPATCHED",
    AUDIT_LOG_RECORDED: "AUDIT_LOG_RECORDED",
    DEAD_LETTER_EVENT: "DEAD_LETTER_EVENT"
};

module.exports = EventTypes;
