const EventEmitter = require("events");
const redisClient = require("../middleware/redis");
const EventTypes = require("./eventTypes");

class EventBus extends EventEmitter {
    constructor() {
        super();
        this.setMaxListeners(50); // support multiple workers and SSE clients

        this.metrics = {
            totalPublished: 0,
            totalDelivered: 0,
            failedDeliveries: 0,
            eventsByType: {}
        };

        this.redisChannel = "tasks:events:bus";
        this.initRedisPubSub();
    }

    /**
     * Initializes Redis pub/sub if Redis is available.
     * Uses a duplicate client for subscribing so it doesn't block command operations.
     */
    async initRedisPubSub() {
        try {
            if (redisClient && redisClient.isOpen) {
                this.subscriberClient = redisClient.duplicate();
                await this.subscriberClient.connect();

                await this.subscriberClient.subscribe(this.redisChannel, (message) => {
                    try {
                        const event = JSON.parse(message);
                        // Avoid echoing self-published events on the same process
                        if (event.metadata && event.metadata.source !== "local-process") {
                            this.emitLocal(event);
                        }
                    } catch (parseErr) {
                        console.error("[EDA EventBus] Redis message parse error:", parseErr);
                    }
                });
                console.log("✅ [EDA EventBus] Distributed Redis Pub/Sub linked.");
            }
        } catch (err) {
            console.warn("⚠️ [EDA EventBus] Redis Pub/Sub disabled, falling back to In-Memory Event Bus:", err.message);
        }
    }

    /**
     * Publish an event asynchronously (Non-blocking).
     * @param {string} type - Event type from EventTypes
     * @param {object} payload - Domain data
     * @param {object} [metadata] - Correlation ID, Actor info, etc.
     */
    publish(type, payload = {}, metadata = {}) {
        const event = {
            eventId: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            type,
            timestamp: new Date().toISOString(),
            payload,
            metadata: {
                correlationId: metadata.correlationId || `corr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                actor: metadata.actor || { userId: "anonymous", email: "guest" },
                source: "local-process",
                ...metadata
            }
        };

        // Update metrics
        this.metrics.totalPublished++;
        this.metrics.eventsByType[type] = (this.metrics.eventsByType[type] || 0) + 1;

        // Asynchronous non-blocking dispatch to local subscribers
        setImmediate(() => {
            this.emitLocal(event);
        });

        // Publish to distributed Redis channel if available
        if (redisClient && redisClient.isOpen) {
            redisClient.publish(this.redisChannel, JSON.stringify(event)).catch((err) => {
                console.warn("[EDA EventBus] Redis publish error:", err.message);
            });
        }

        return event;
    }

    /**
     * Internal dispatcher for local in-process consumers.
     */
    emitLocal(event) {
        // Emit specific type
        this.emit(event.type, event);
        // Emit wildcard for global listeners (SSE, metrics, audit)
        this.emit("*", event);
    }

    /**
     * Safe subscriber with fault isolation and Dead-Letter Queue (DLQ) support.
     * @param {string} type
     * @param {Function} handler
     */
    subscribe(type, handler) {
        this.on(type, async (event) => {
            try {
                this.metrics.totalDelivered++;
                await handler(event);
            } catch (error) {
                this.metrics.failedDeliveries++;
                console.error(`❌ [EDA EventBus] Error in subscriber for ${type}:`, error);

                // Publish to Dead Letter Queue (DLQ) unless it is already a DLQ event
                if (type !== EventTypes.DEAD_LETTER_EVENT) {
                    this.publish(EventTypes.DEAD_LETTER_EVENT, {
                        originalEvent: event,
                        error: error.message,
                        stack: error.stack,
                        failedAt: new Date().toISOString()
                    });
                }
            }
        });
    }

    /**
     * Subscribe to all events
     */
    subscribeAll(handler) {
        this.on("*", async (event) => {
            try {
                await handler(event);
            } catch (err) {
                console.error("❌ [EDA EventBus] Error in wildcard subscriber:", err);
            }
        });
    }

    /**
     * Fetch active EDA metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            activeListeners: this.eventNames().map((name) => ({
                event: name,
                count: this.listenerCount(name)
            }))
        };
    }
}

// Export singleton instance
const eventBus = new EventBus();
module.exports = eventBus;
