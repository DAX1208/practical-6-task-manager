const EventTypes = require("../events/eventTypes");

/**
 * Asynchronous Worker: Dispatches notifications (e.g., email alerts, push triggers, webhook calls).
 * Simulates real-world external I/O without blocking user requests.
 */
function registerNotificationWorker(eventBus) {
    // Notify when task status changes or when a batch job completes
    const notificationTriggers = [
        EventTypes.TASK_STATUS_CHANGED,
        EventTypes.BATCH_TASK_COMPLETED
    ];

    notificationTriggers.forEach((eventType) => {
        eventBus.subscribe(eventType, async (event) => {
            const { type, payload, metadata } = event;

            // Simulate non-blocking asynchronous email / webhook dispatch
            await new Promise((resolve) => setTimeout(resolve, 80));

            let notificationMessage = "";
            if (type === EventTypes.TASK_STATUS_CHANGED) {
                const statusStr = payload.completed ? "COMPLETED" : "REOPENED";
                notificationMessage = `Task "${payload.title || payload._id}" marked as ${statusStr}.`;
            } else if (type === EventTypes.BATCH_TASK_COMPLETED) {
                notificationMessage = `Batch job ${payload.jobId} processed ${payload.processedItems} tasks successfully.`;
            }

            console.log(`🔔 [NotificationWorker] Dispatched async notification: "${notificationMessage}" (Recipient: ${metadata?.actor?.email || "user@example.com"})`);

            // Publish secondary notification event for streaming
            eventBus.publish(EventTypes.NOTIFICATION_DISPATCHED, {
                message: notificationMessage,
                recipient: metadata?.actor?.email || "guest",
                triggerEvent: type,
                deliveredAt: new Date().toISOString()
            });
        });
    });

    console.log("✅ [EDA Workers] NotificationWorker registered.");
}

module.exports = registerNotificationWorker;
