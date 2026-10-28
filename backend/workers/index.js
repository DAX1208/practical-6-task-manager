const registerAuditWorker = require("./auditWorker");
const registerCacheWorker = require("./cacheWorker");
const registerNotificationWorker = require("./notificationWorker");
const registerBatchWorker = require("./batchWorker");
const registerDlqWorker = require("./dlqWorker");
const registerProductivityWorker = require("./productivityWorker");

/**
 * Initializes and wires all asynchronous event consumers.
 */
function initWorkers(eventBus) {
    console.log("⚡ [EDA] Initializing Asynchronous Event-Driven Workers...");

    registerCacheWorker(eventBus);
    registerAuditWorker(eventBus);
    registerNotificationWorker(eventBus);
    registerBatchWorker(eventBus);
    registerProductivityWorker(eventBus);
    const dlq = registerDlqWorker(eventBus);

    return { dlq };
}

module.exports = initWorkers;
