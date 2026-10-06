const AuditLog = require("../models/AuditLog");
const EventTypes = require("../events/eventTypes");

/**
 * Asynchronous Worker: Records audit trails for all domain events without blocking API threads.
 */
function registerAuditWorker(eventBus) {
    const auditableEvents = [
        EventTypes.TASK_CREATED,
        EventTypes.TASK_UPDATED,
        EventTypes.TASK_DELETED,
        EventTypes.TASK_STATUS_CHANGED,
        EventTypes.BATCH_TASK_COMPLETED
    ];

    auditableEvents.forEach((eventType) => {
        eventBus.subscribe(eventType, async (event) => {
            try {
                const { eventId, type, payload, metadata } = event;
                const entityId = payload._id || payload.taskId || payload.jobId || "N/A";

                const logEntry = new AuditLog({
                    eventId,
                    action: type,
                    entityType: type.startsWith("BATCH") ? "Job" : "Task",
                    entityId: String(entityId),
                    actor: metadata.actor || { userId: "anonymous", email: "guest" },
                    details: payload,
                    timestamp: event.timestamp || new Date()
                });

                await logEntry.save();
                console.log(`📝 [AuditWorker] Asynchronously persisted audit log for event ${type} (Entity: ${entityId})`);
            } catch (err) {
                console.error(`❌ [AuditWorker] Failed to write audit record:`, err.message);
                throw err; // Let EventBus route to DLQ
            }
        });
    });

    console.log("✅ [EDA Workers] AuditWorker registered for domain events.");
}

module.exports = registerAuditWorker;
