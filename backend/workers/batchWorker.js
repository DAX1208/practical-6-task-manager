const Task = require("../models/Task");
const Job = require("../models/Job");
const EventTypes = require("../events/eventTypes");

/**
 * Asynchronous Worker: Background processing for batch/bulk task operations.
 */
function registerBatchWorker(eventBus) {
    eventBus.subscribe(EventTypes.BATCH_TASK_REQUESTED, async (event) => {
        const { jobId, tasks } = event.payload;

        console.log(`⏳ [BatchWorker] Starting async processing for Job ${jobId} (${tasks.length} items)...`);

        try {
            // Update Job status to processing
            await Job.findOneAndUpdate(
                { jobId },
                { status: "processing" }
            );

            const insertedTasks = [];

            for (let i = 0; i < tasks.length; i++) {
                const item = tasks[i];
                if (item.title) {
                    const newTask = new Task({
                        title: item.title.trim(),
                        description: (item.description || "").trim(),
                        completed: Boolean(item.completed)
                    });
                    const saved = await newTask.save();
                    insertedTasks.push(saved);
                }

                // Update progress in job document
                await Job.findOneAndUpdate(
                    { jobId },
                    { processedItems: i + 1 }
                );

                // Simulate slight processing interval to emulate heavy background queue
                await new Promise((r) => setTimeout(r, 40));
            }

            // Mark job complete
            const completedJob = await Job.findOneAndUpdate(
                { jobId },
                {
                    status: "completed",
                    processedItems: insertedTasks.length,
                    results: { insertedCount: insertedTasks.length, taskIds: insertedTasks.map((t) => t._id) },
                    completedAt: new Date()
                },
                { new: true }
            );

            console.log(`✅ [BatchWorker] Job ${jobId} completed successfully! Created ${insertedTasks.length} tasks.`);

            // Publish BATCH_TASK_COMPLETED event
            eventBus.publish(EventTypes.BATCH_TASK_COMPLETED, {
                jobId,
                processedItems: insertedTasks.length,
                insertedTasks
            }, { actor: event.metadata.actor });

        } catch (err) {
            console.error(`❌ [BatchWorker] Job ${jobId} failed:`, err.message);

            await Job.findOneAndUpdate(
                { jobId },
                {
                    status: "failed",
                    error: err.message,
                    completedAt: new Date()
                }
            );

            eventBus.publish(EventTypes.BATCH_TASK_FAILED, {
                jobId,
                error: err.message
            }, { actor: event.metadata.actor });
        }
    });

    console.log("✅ [EDA Workers] BatchWorker registered.");
}

module.exports = registerBatchWorker;
