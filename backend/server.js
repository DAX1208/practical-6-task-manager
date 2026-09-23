const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

const Task = require("./models/Task");
const User = require("./models/User");

const authMiddleware = require("./middleware/auth");
const validateTask = require("./middleware/validateTask");
const redisClient = require("./middleware/redis");

dotenv.config();

const app = express();

const TASKS_CACHE_KEY = "all_tasks";
const CACHE_TTL_SECONDS = 60; // 60 seconds Time-To-Live


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
// TEST ROUTE
// ==================================================

app.get("/", (req, res) => {
    res.status(200).json({
        message: "Practical 6 backend is running"
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
                const cachedTasks = await redisClient.get(TASKS_CACHE_KEY);
                if (cachedTasks) {
                    return res.status(200).json(JSON.parse(cachedTasks));
                }
            } catch (cacheErr) {
                console.warn("Redis read warning (fallback to DB):", cacheErr.message);
            }

            // (2) Cache Miss: Query Database
            const tasks = await Task.find()
                .sort({ createdAt: -1 });

            // (3) Populate Redis Cache with TTL
            try {
                await redisClient.setEx(
                    TASKS_CACHE_KEY,
                    CACHE_TTL_SECONDS,
                    JSON.stringify(tasks)
                );
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
// CREATE TASK (Write-Invalidate Cache)
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

            // Invalidate Redis Cache after successful database write
            try {
                await redisClient.del(TASKS_CACHE_KEY);
            } catch (cacheErr) {
                console.warn("Redis eviction warning:", cacheErr.message);
            }

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
// UPDATE TASK (Write-Invalidate Cache)
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

            if (!updatedTask) {
                return res.status(404).json({
                    message: "Task not found"
                });
            }

            // Invalidate Redis Cache after successful database update
            try {
                await redisClient.del(TASKS_CACHE_KEY);
            } catch (cacheErr) {
                console.warn("Redis eviction warning:", cacheErr.message);
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
// DELETE TASK (Write-Invalidate Cache)
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

            // Invalidate Redis Cache after successful database delete
            try {
                await redisClient.del(TASKS_CACHE_KEY);
            } catch (cacheErr) {
                console.warn("Redis eviction warning:", cacheErr.message);
            }

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
        `Server running at http://127.0.0.1:${PORT}`
    );
});
