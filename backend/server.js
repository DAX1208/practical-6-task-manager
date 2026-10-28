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
const ProductivityStat = require("./models/ProductivityStat");

const authMiddleware = require("./middleware/auth");
const validateTask = require("./middleware/validateTask");
const redisClient = require("./middleware/redis");
const cache = require("./middleware/cache");


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

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/taskdb";

if (process.env.NODE_ENV !== "test" || process.env.CONNECT_DB_IN_TEST === "true") {
    mongoose
        .connect(MONGO_URI)
        .then(() => {
            console.log(`MongoDB connected: ${MONGO_URI}`);
        })
        .catch((error) => {
            console.error("MongoDB connection error:", error);
        });
}


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
        const { name, email, password } = req.body;

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
                message: "User already exists with this email"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const displayName = (name && name.trim()) || normalizedEmail.split("@")[0];

        const user = new User({
            name: displayName,
            email: normalizedEmail,
            password: hashedPassword
        });

        await user.save();

        const secret = process.env.JWT_SECRET || "awdf_task_manager_secret_key_2026";
        const token = jwt.sign(
            {
                userId: user._id.toString(),
                email: user.email,
                name: user.name
            },
            secret,
            { expiresIn: "7d" }
        );

        return res.status(201).json({
            message: "User registered successfully",
            token,
            user: {
                id: user._id.toString(),
                name: user.name,
                email: user.email
            }
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

        const secret = process.env.JWT_SECRET || "awdf_task_manager_secret_key_2026";
        const token = jwt.sign(
            {
                userId: user._id.toString(),
                email: user.email,
                name: user.name || user.email.split("@")[0]
            },
            secret,
            {
                expiresIn: "7d"
            }
        );

        return res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user._id.toString(),
                name: user.name || user.email.split("@")[0],
                email: user.email
            }
        });

    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            message: "Login failed"
        });
    }
});


// ==================================================
// GET CURRENT USER PROFILE
// GET /auth/me (Protected)
// ==================================================

app.get("/auth/me", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        return res.status(200).json({
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            createdAt: user.createdAt
        });
    } catch (error) {
        console.error("Auth me error:", error);
        return res.status(500).json({ message: "Failed to retrieve user profile" });
    }
});



// ==================================================
// DASHBOARD STATISTICS (In-Memory Cached with TTL)
// GET /tasks/stats
// PROTECTED
// ==================================================

app.get("/tasks/stats", authMiddleware, async (req, res) => {
    try {
        const userId = req.user ? req.user.userId : "anonymous";
        const cacheKey = `stats_${userId}`;

        // (1) Check in-memory node-cache
        const cachedData = cache.get(cacheKey);
        if (cachedData) {
            res.setHeader("X-Cache", "HIT");
            return res.status(200).json({ ...cachedData, cached: true });
        }

        // (2) Cache Miss: Query Database scoped to user
        const userFilter = req.user
            ? { $or: [{ user: req.user.userId }, { user: null }] }
            : {};

        const tasks = await Task.find(userFilter);
        const total = tasks.length;
        const pending = tasks.filter((t) => t.status === "Pending" || (!t.status && !t.completed)).length;
        const inProgress = tasks.filter((t) => t.status === "In Progress").length;
        const completed = tasks.filter((t) => t.status === "Completed" || t.completed).length;
        const highPriority = tasks.filter((t) => t.priority === "High" && t.status !== "Completed" && !t.completed).length;

        const now = new Date();
        const overdue = tasks.filter(
            (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== "Completed" && !t.completed
        ).length;

        // Fetch user productivity score
        const userStat = await ProductivityStat.findOne({ userId });
        const productivityScore = userStat ? userStat.productivityScore : 100;

        const stats = {
            total,
            pending,
            inProgress,
            completed,
            highPriority,
            overdue,
            productivityScore,
            completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
            generatedAt: new Date().toISOString()
        };

        // (3) Store in-memory cache for 60 seconds
        cache.set(cacheKey, stats, CACHE_TTL_SECONDS);

        res.setHeader("X-Cache", "MISS");
        return res.status(200).json({ ...stats, cached: false });

    } catch (error) {
        console.error("Task stats error:", error);
        return res.status(500).json({ message: "Failed to fetch task statistics" });
    }
});


// ==================================================
// GET TASKS (User-Scoped & Filterable)
// GET /tasks
// PROTECTED
// ==================================================

app.get("/tasks", authMiddleware, async (req, res) => {
    try {
        const { status, priority, search, sortBy } = req.query;

        // User separation: users only access their own tasks or legacy null-user tasks
        const query = req.user
            ? { $or: [{ user: req.user.userId }, { user: null }] }
            : {};

        if (status && status !== "all") {
            if (status === "completed") {
                query.$or = [{ status: "Completed" }, { completed: true }];
            } else if (status === "pending") {
                query.$or = [{ status: "Pending" }, { completed: false, status: { $ne: "In Progress" } }];
            } else if (status === "in-progress") {
                query.status = "In Progress";
            }
        }

        if (priority && priority !== "all") {
            query.priority = priority;
        }

        if (search && search.trim()) {
            const regex = new RegExp(search.trim(), "i");
            query.$and = query.$and || [];
            query.$and.push({
                $or: [{ title: regex }, { description: regex }]
            });
        }

        let sortOption = { createdAt: -1 };
        if (sortBy === "dueDate") {
            sortOption = { dueDate: 1, createdAt: -1 };
        } else if (sortBy === "priority") {
            sortOption = { priority: 1, createdAt: -1 };
        }

        const tasks = await Task.find(query).sort(sortOption);

        return res.status(200).json(tasks);

    } catch (error) {
        console.error("Get tasks error:", error);
        return res.status(500).json({
            message: "Failed to fetch tasks"
        });
    }
});


// ==================================================
// CREATE TASK (Event-Driven Asynchronous Processing)
// POST /tasks
// PROTECTED + VALIDATION
// ==================================================

app.post("/tasks", authMiddleware, validateTask, async (req, res) => {
    try {
        const {
            title,
            description,
            priority = "Medium",
            status = "Pending",
            dueDate = null,
            subtasks = []
        } = req.body;

        const isCompleted = status === "Completed";

        const task = new Task({
            title: title.trim(),
            description: description.trim(),
            priority: ["Low", "Medium", "High"].includes(priority) ? priority : "Medium",
            status: ["Pending", "In Progress", "Completed"].includes(status) ? status : "Pending",
            dueDate: dueDate ? new Date(dueDate) : null,
            completed: isCompleted,
            user: req.user ? req.user.userId : null,
            subtasks: Array.isArray(subtasks) ? subtasks : []
        });

        const savedTask = await task.save();

        const actor = req.user
            ? { userId: req.user.userId, email: req.user.email, name: req.user.name }
            : { userId: "anonymous", email: "guest" };

        // Emit TASK_CREATED event
        eventBus.publish(
            EventTypes.TASK_CREATED,
            savedTask.toObject(),
            { actor }
        );

        // If created directly in completed status, emit TASK_COMPLETED
        if (isCompleted) {
            eventBus.publish(
                EventTypes.TASK_COMPLETED,
                savedTask.toObject(),
                { actor }
            );
        }

        return res.status(201).json(savedTask);

    } catch (error) {
        console.error("Create task error:", error);
        return res.status(500).json({
            message: "Failed to create task"
        });
    }
});


// ==================================================
// UPDATE TASK (Event-Driven Asynchronous Processing)
// PUT /tasks/:id
// PROTECTED + VALIDATION
// ==================================================

app.put("/tasks/:id", authMiddleware, validateTask, async (req, res) => {
    try {
        const {
            title,
            description,
            priority,
            status,
            dueDate,
            completed,
            subtasks
        } = req.body;

        const existingTask = await Task.findById(req.params.id);
        if (!existingTask) {
            return res.status(404).json({
                message: "Task not found"
            });
        }

        // Authorization check: User can only update their own tasks
        if (
            existingTask.user &&
            req.user &&
            existingTask.user.toString() !== req.user.userId
        ) {
            return res.status(403).json({
                message: "Forbidden: You are not authorized to update this task"
            });
        }

        const wasCompleted = existingTask.status === "Completed" || existingTask.completed;
        const newStatus = status || (completed === true ? "Completed" : (completed === false ? "Pending" : existingTask.status));
        const nowCompleted = newStatus === "Completed";
        const statusChanged = wasCompleted !== nowCompleted;

        const updateData = {
            title: title.trim(),
            description: description.trim(),
            status: newStatus,
            completed: nowCompleted
        };

        if (priority && ["Low", "Medium", "High"].includes(priority)) {
            updateData.priority = priority;
        }

        if (dueDate !== undefined) {
            updateData.dueDate = dueDate ? new Date(dueDate) : null;
        }

        if (Array.isArray(subtasks)) {
            updateData.subtasks = subtasks;
        }

        const updatedTask = await Task.findByIdAndUpdate(
            req.params.id,
            updateData,
            { returnDocument: "after", runValidators: true }
        );

        const actor = req.user
            ? { userId: req.user.userId, email: req.user.email, name: req.user.name }
            : { userId: "anonymous", email: "guest" };

        // Emit TASK_UPDATED
        eventBus.publish(
            EventTypes.TASK_UPDATED,
            {
                ...updatedTask.toObject(),
                previousState: {
                    title: existingTask.title,
                    status: existingTask.status,
                    completed: existingTask.completed
                }
            },
            { actor }
        );

        // If toggled completion, emit domain events
        if (statusChanged) {
            eventBus.publish(
                EventTypes.TASK_STATUS_CHANGED,
                updatedTask.toObject(),
                { actor }
            );

            if (nowCompleted) {
                // Publish TASK_COMPLETED to trigger async productivity update
                eventBus.publish(
                    EventTypes.TASK_COMPLETED,
                    updatedTask.toObject(),
                    { actor }
                );
            }
        }

        return res.status(200).json(updatedTask);

    } catch (error) {
        console.error("Update task error:", error);
        return res.status(500).json({
            message: "Failed to update task"
        });
    }
});


// ==================================================
// DELETE TASK (Event-Driven Asynchronous Processing)
// DELETE /tasks/:id
// PROTECTED
// ==================================================

app.delete("/tasks/:id", authMiddleware, async (req, res) => {
    try {
        const existingTask = await Task.findById(req.params.id);
        if (!existingTask) {
            return res.status(404).json({
                message: "Task not found"
            });
        }

        // Authorization check: User can only delete their own tasks
        if (
            existingTask.user &&
            req.user &&
            existingTask.user.toString() !== req.user.userId
        ) {
            return res.status(403).json({
                message: "Forbidden: You are not authorized to delete this task"
            });
        }

        const deletedTask = await Task.findByIdAndDelete(req.params.id);

        const actor = req.user
            ? { userId: req.user.userId, email: req.user.email, name: req.user.name }
            : { userId: "anonymous", email: "guest" };

        // Emit TASK_DELETED domain event
        eventBus.publish(
            EventTypes.TASK_DELETED,
            deletedTask.toObject(),
            { actor }
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
});


// ==================================================
// OPTIONAL AI TASK-BREAKDOWN ASSISTANT (Phase 7)
// POST /api/ai/breakdown
// PROTECTED
// ==================================================

app.post("/api/ai/breakdown", authMiddleware, async (req, res) => {
    try {
        const { title, description = "", priority = "Medium" } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({ message: "Task title is required for AI breakdown" });
        }

        const apiKey = process.env.GEMINI_API_KEY;

        // If Gemini API key is configured, query the model
        if (apiKey) {
            try {
                const prompt = `As an expert academic and productivity coach, break down this student task into 3 to 5 clear, concrete, sequential subtasks.\nTask Title: "${title}"\nDescription: "${description}"\nPriority: ${priority}\nReturn ONLY a valid JSON array of strings representing the subtasks, e.g. ["Research sources", "Draft section 1", "Review code"]. No markdown formatting, no other text.`;

                const response = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: prompt }] }],
                            generationConfig: { temperature: 0.2 }
                        })
                    }
                );

                if (response.ok) {
                    const data = await response.json();
                    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
                    const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
                    const parsed = JSON.parse(cleaned);

                    if (Array.isArray(parsed) && parsed.length > 0) {
                        return res.status(200).json({
                            subtasks: parsed.map((item) => ({ title: String(item), completed: false })),
                            source: "gemini-ai"
                        });
                    }
                }
            } catch (aiErr) {
                console.warn("Gemini AI API call failed, falling back to smart heuristic engine:", aiErr.message);
            }
        }

        // Graceful Heuristic Fallback (Always works offline without external keys)
        const t = title.trim();
        const subtasks = [
            { title: `Define requirements & outline deliverables for: ${t.slice(0, 40)}`, completed: false },
            { title: "Conduct research & review relevant class materials / references", completed: false },
            { title: "Implement core solution & draft deliverable", completed: false },
            { title: "Self-review, test against criteria, and prepare final submission", completed: false }
        ];

        return res.status(200).json({
            subtasks,
            source: "heuristic-assistant"
        });

    } catch (error) {
        console.error("AI breakdown error:", error);
        return res.status(500).json({ message: "Failed to generate task breakdown" });
    }
});



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

const PORT = process.env.PORT || 5000;

let server;
// Start listener only when executed directly (or outside test runners)
if (require.main === module || (process.env.NODE_ENV !== "test" && !process.env.JEST_WORKER_ID)) {
    server = app.listen(PORT, "0.0.0.0", () => {
        console.log(
            `Server running at http://0.0.0.0:${PORT} [Event-Driven Architecture Active]`
        );
    });
}

module.exports = app;

