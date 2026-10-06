const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

const Task = require("./models/Task");
const User = require("./models/User");
const AuditLog = require("./models/AuditLog");
const Job = require("./models/Job");

const authMiddleware = require("./middleware/auth");
const validateTask = require("./middleware/validateTask");
const redisClient = require("./middleware/redis");

// Event-Driven Architecture Components
const eventBus = require("./events/eventBus");
const EventTypes = require("./events/eventTypes");
const initWorkers = require("./workers");

dotenv.config();

const app = express();

const TASKS_CACHE_KEY = "all_tasks";
const CACHE_TTL_SECONDS = 60; // 60 seconds Time-To-Live

// ==================================================
// INITIALIZE ASYNCHRONOUS WORKERS & EVENT BUS
// ==================================================
const workers = initWorkers(eventBus);

// Active Server-Sent Events (SSE) clients
const sseClients = new Set();

// Broadcast all domain events to connected SSE clients in real-time
eventBus.subscribeAll((event) => {
    const data = `data: ${JSON.stringify(event)}\n\n`;
    for (const client of sseClients) {
        try {
            client.write(data);
        } catch (err) {
            sseClients.delete(client);
        }
    }
});


// ==================================================
// MIDDLEWARE
// ==================================================

app.use(cors());
app.use(express.json());


// ==================================================
// MONGODB CONNECTION
// ==================================================

mongoose
    .connect("mongodb://127.0.0.1:27017/practical6")
    .then(() => {
        console.log("MongoDB connected");
    })
    .catch((error) => {
        console.error("MongoDB connection error:", error);
    });


// ==================================================
// TEST ROUTE & HEALTH
// ==================================================

app.get("/", (req, res) => {
    res.status(200).json({
        message: "Practical 6 backend is running with Event-Driven Architecture (EDA)"
    });
});


// ==================================================
// REGISTER
// POST /register
// ==================================================

app.post("/register", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                message: "Password must be at least 6 characters"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const existingUser = await User.findOne({
            email: normalizedEmail
        });

        if (existingUser) {
            return res.status(409).json({
                message: "User already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            email: normalizedEmail,
            password: hashedPassword
        });

        await user.save();

        return res.status(201).json({
            message: "User registered successfully"
        });

    } catch (error) {
        console.error("Register error:", error);

        return res.status(500).json({
            message: "Registration failed"
        });
    }
});


// ==================================================
// LOGIN
// POST /login
// ==================================================

app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const user = await User.findOne({
            email: normalizedEmail
        });

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const token = jwt.sign(
            {
                userId: user._id.toString(),
                email: user.email
            },
            process.env.JWT_SECRET || "default_secret_key",
            {
                expiresIn: "1h"
            }
        );

        return res.status(200).json({
            message: "Login successful",
            token: token
        });

    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            message: "Login failed"
        });
    }
});


// ==================================================
// GET TASKS (Cache-Aside Pattern with Redis)
// GET /tasks
// PROTECTED
// ==================================================

app.get(
    "/tasks",
    authMiddleware,
    async (req, res) => {
        try {
            // (1) Check Redis Cache (Cache Hit)
            try {
                if (redisClient && redisClient.isOpen) {
                    const cachedTasks = await redisClient.get(TASKS_CACHE_KEY);
                    if (cachedTasks) {
                        return res.status(200).json(JSON.parse(cachedTasks));
                    }
                }
            } catch (cacheErr) {
                console.warn("Redis read warning (fallback to DB):", cacheErr.message);
            }

            // (2) Cache Miss: Query Database
            const tasks = await Task.find()
                .sort({ createdAt: -1 });

            // (3) Populate Redis Cache with TTL
            try {
                if (redisClient && redisClient.isOpen) {
                    await redisClient.setEx(
                        TASKS_CACHE_KEY,
                        CACHE_TTL_SECONDS,
                        JSON.stringify(tasks)
                    );
                }
            } catch (cacheErr) {
                console.warn("Redis write warning:", cacheErr.message);
            }

            return res.status(200).json(tasks);

        } catch (error) {
            console.error("Get tasks error:", error);

            return res.status(500).json({
                message: "Failed to fetch tasks"
            });
        }
    }
);


// ==================================================
// CREATE TASK (Event-Driven Asynchronous Processing)
// POST /tasks
// PROTECTED + VALIDATION
// ==================================================

app.post(
    "/tasks",
    authMiddleware,
    validateTask,
    async (req, res) => {
        try {
            const {
                title,
                description
            } = req.body;

            const task = new Task({
                title: title.trim(),
                description: description.trim(),
                completed: false
            });

            const savedTask = await task.save();

            // Emit Domain Event: Asynchronous Processing handles:
            // 1. Cache Eviction (CacheWorker)
            // 2. Audit Trail Record (AuditWorker)
            // 3. Real-Time Push to Connected Clients (SSE)
            eventBus.publish(
                EventTypes.TASK_CREATED,
                savedTask.toObject(),
                {
                    actor: req.user
                        ? { userId: req.user.userId, email: req.user.email }
                        : { userId: "anonymous", email: "guest" }
                }
            );

            // Immediate sub-millisecond response without blocking on side-effects
            return res.status(201).json(savedTask);

        } catch (error) {
            console.error("Create task error:", error);

            return res.status(500).json({
                message: "Failed to create task"
            });
        }
    }
);


// ==================================================
// UPDATE TASK (Event-Driven Asynchronous Processing)
// PUT /tasks/:id
// PROTECTED + VALIDATION
// ==================================================

app.put(
    "/tasks/:id",
    authMiddleware,
    validateTask,
    async (req, res) => {
        try {
            const {
                title,
                description,
                completed
            } = req.body;

            const existingTask = await Task.findById(req.params.id);
            if (!existingTask) {
                return res.status(404).json({
                    message: "Task not found"
                });
            }

            const statusChanged = existingTask.completed !== Boolean(completed);

            const updatedTask =
                await Task.findByIdAndUpdate(
                    req.params.id,
                    {
                        title: title.trim(),
                        description: description.trim(),
                        completed: completed
                    },
                    {
                        new: true,
                        runValidators: true
                    }
                );

            const actor = req.user
                ? { userId: req.user.userId, email: req.user.email }
                : { userId: "anonymous", email: "guest" };

            // Emit TASK_UPDATED domain event
            eventBus.publish(
                EventTypes.TASK_UPDATED,
                {
                    ...updatedTask.toObject(),
                    previousState: {
                        title: existingTask.title,
                        completed: existingTask.completed
                    }
                },
                { actor }
            );

            // Emit TASK_STATUS_CHANGED event if completion was toggled
            if (statusChanged) {
                eventBus.publish(
                    EventTypes.TASK_STATUS_CHANGED,
                    updatedTask.toObject(),
                    { actor }
                );
            }

            return res.status(200).json(updatedTask);

        } catch (error) {
            console.error("Update task error:", error);

            return res.status(500).json({
                message: "Failed to update task"
            });
        }
    }
);


// ==================================================
// DELETE TASK (Event-Driven Asynchronous Processing)
// DELETE /tasks/:id
// PROTECTED
// ==================================================

app.delete(
    "/tasks/:id",
    authMiddleware,
    async (req, res) => {
        try {
            const deletedTask =
                await Task.findByIdAndDelete(
                    req.params.id
                );

            if (!deletedTask) {
                return res.status(404).json({
                    message: "Task not found"
                });
            }

            // Emit TASK_DELETED domain event
            eventBus.publish(
                EventTypes.TASK_DELETED,
                deletedTask.toObject(),
                {
                    actor: req.user
                        ? { userId: req.user.userId, email: req.user.email }
                        : { userId: "anonymous", email: "guest" }
                }
            );

            return res.status(200).json({
                message: "Task deleted successfully",
                task: deletedTask
            });

        } catch (error) {
            console.error("Delete task error:", error);

            return res.status(500).json({
                message: "Failed to delete task"
            });
        }
    }
);


// ==================================================
// ASYNCHRONOUS BATCH TASK PROCESSING (202 ACCEPTED)
// POST /tasks/bulk-async
// ==================================================

app.post("/tasks/bulk-async", authMiddleware, async (req, res) => {
    try {
        const { tasks } = req.body;

        if (!Array.isArray(tasks) || tasks.length === 0) {
            return res.status(400).json({
                message: "A non-empty array of tasks is required"
            });
        }

        const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

        const job = new Job({
            jobId,
            type: "BULK_TASK_CREATION",
            status: "queued",
            totalItems: tasks.length,
            processedItems: 0
        });

        await job.save();

        const actor = req.user
            ? { userId: req.user.userId, email: req.user.email }
            : { userId: "anonymous", email: "guest" };

        // Publish to background worker queue
        eventBus.publish(
            EventTypes.BATCH_TASK_REQUESTED,
            {
                jobId,
                tasks
            },
            { actor }
        );

        // Immediate 202 Accepted response for asynchronous execution
        return res.status(202).json({
            message: "Batch tasks accepted for asynchronous processing",
            jobId,
            status: "queued",
            totalItems: tasks.length
        });

    } catch (error) {
        console.error("Bulk async error:", error);

        return res.status(500).json({
            message: "Failed to initiate asynchronous batch processing"
        });
    }
});


// ==================================================
// BACKGROUND JOB STATUS
// GET /tasks/jobs/:jobId
// ==================================================

app.get("/tasks/jobs/:jobId", async (req, res) => {
    try {
        const job = await Job.findOne({ jobId: req.params.jobId });

        if (!job) {
            return res.status(404).json({
                message: "Job not found"
            });
        }

        return res.status(200).json(job);

    } catch (error) {
        console.error("Job status error:", error);

        return res.status(500).json({
            message: "Failed to fetch job status"
        });
    }
});


// ==================================================
// AUDIT LOGS (Observability for Event-Driven Architecture)
// GET /audit-logs
// ==================================================

app.get("/audit-logs", async (req, res) => {
    try {
        const logs = await AuditLog.find()
            .sort({ timestamp: -1 })
            .limit(50);

        return res.status(200).json(logs);

    } catch (error) {
        console.error("Audit logs fetch error:", error);

        return res.status(500).json({
            message: "Failed to fetch audit logs"
        });
    }
});


// ==================================================
// REAL-TIME EVENT STREAMING (Server-Sent Events)
// GET /api/events/stream
// ==================================================

app.get("/api/events/stream", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");

    if (typeof res.flushHeaders === "function") {
        res.flushHeaders();
    }

    // Handshake
    res.write(`data: ${JSON.stringify({ type: "CONNECTED", message: "SSE stream established with EventBus", timestamp: new Date().toISOString() })}\n\n`);

    sseClients.add(res);
    console.log(`📡 [SSE] Client connected. Total active streams: ${sseClients.size}`);

    req.on("close", () => {
        sseClients.delete(res);
        console.log(`📡 [SSE] Client disconnected. Total active streams: ${sseClients.size}`);
    });
});


// ==================================================
// EDA TELEMETRY & METRICS
// GET /eda/metrics
// ==================================================

app.get("/eda/metrics", (req, res) => {
    res.status(200).json({
        eventBusMetrics: eventBus.getMetrics(),
        activeSseClients: sseClients.size,
        systemStatus: "Healthy - Event-Driven Architecture Active"
    });
});


// ==================================================
// 404 NOT FOUND HANDLER
// ==================================================

app.use((req, res) => {
    res.status(404).json({
        message: "Route not found"
    });
});


// ==================================================
// START SERVER
// ==================================================

const PORT = 5000;

app.listen(PORT, "127.0.0.1", () => {
    console.log(
        `Server running at http://127.0.0.1:${PORT} [Event-Driven Architecture Active]`
    );
});
