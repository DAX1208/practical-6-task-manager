const EventTypes = require("../events/eventTypes");

/**
 * Dead Letter Queue (DLQ) Worker: Captures unhandled consumer failures for observability and recovery.
 */
function registerDlqWorker(eventBus) {
    const deadLetters = [];

    eventBus.subscribe(EventTypes.DEAD_LETTER_EVENT, async (event) => {
        const dlqEntry = {
            id: `dlq_${Date.now()}`,
            timestamp: new Date().toISOString(),
            ...event.payload
        };

        deadLetters.push(dlqEntry);
        // Keep last 100 entries in memory
        if (deadLetters.length > 100) deadLetters.shift();

        console.error(`🚨 [DLQ Worker] Dead Letter Captured! Event Type: ${event.payload?.originalEvent?.type}, Reason: ${event.payload?.error}`);
    });

    console.log("✅ [EDA Workers] DLQ Worker registered.");

    return {
        getDeadLetters: () => [...deadLetters]
    };
}

module.exports = registerDlqWorker;
