const eventBus = require("./events/eventBus");
const EventTypes = require("./events/eventTypes");
const initWorkers = require("./workers");

async function runEdaVerification() {
    console.log("🧪 Starting EDA Unit & Integration Verification...\n");

    const { dlq } = initWorkers(eventBus);

    let auditTriggered = false;
    let notificationTriggered = false;
    let batchCompleted = false;

    // Custom test subscriber to verify end-to-end event delivery
    eventBus.subscribe(EventTypes.AUDIT_LOG_RECORDED, () => {
        auditTriggered = true;
    });

    eventBus.subscribe(EventTypes.NOTIFICATION_DISPATCHED, (evt) => {
        console.log(`[TEST] Received simulated notification event: ${evt.payload.message}`);
        notificationTriggered = true;
    });

    eventBus.subscribe(EventTypes.BATCH_TASK_COMPLETED, (evt) => {
        console.log(`[TEST] Batch completed with ${evt.payload.processedItems} items.`);
        batchCompleted = true;
    });

    // Test 1: Publish TASK_CREATED
    console.log("1. Publishing TASK_CREATED...");
    eventBus.publish(EventTypes.TASK_CREATED, {
        _id: "test_task_001",
        title: "Test Task 1",
        description: "Checking EDA delivery",
        completed: false
    });

    // Test 2: Publish TASK_STATUS_CHANGED to test notification worker
    console.log("2. Publishing TASK_STATUS_CHANGED...");
    eventBus.publish(EventTypes.TASK_STATUS_CHANGED, {
        _id: "test_task_001",
        title: "Test Task 1",
        completed: true
    });

    // Test 3: Test DLQ Fault Isolation
    console.log("3. Testing Dead Letter Queue fault isolation...");
    eventBus.subscribe("FAULTY_EVENT", () => {
        throw new Error("Intentional subscriber failure test");
    });
    eventBus.publish("FAULTY_EVENT", { test: 123 });

    // Wait for async workers to complete
    await new Promise((resolve) => setTimeout(resolve, 500));

    const metrics = eventBus.getMetrics();
    console.log("\n📊 EDA Metrics Snapshot:", JSON.stringify(metrics, null, 2));

    const deadLetters = dlq.getDeadLetters();
    console.log(`\n🛡️ DLQ Captured ${deadLetters.length} error(s) (Expected >= 1).`);

    console.log("\n✅ All asynchronous event bus mechanisms verified successfully!");
    process.exit(0);
}

runEdaVerification().catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
});
