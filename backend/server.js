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

dotenv.config();

const app = express();


// ==================================================
// MIDDLEWARE
// ==================================================

app.use(cors());
app.use(express.json());


// ==================================================
// MONGODB
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
// TEST
// ==================================================

app.get("/", (req, res) => {
    res.status(200).json({
        message: "Practical 7 backend is running"
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
            process.env.JWT_SECRET,
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
// GET TASKS
// GET /tasks
// PROTECTED
// ==================================================

app.get(
    "/tasks",
    authMiddleware,
    async (req, res) => {
        try {
            const tasks = await Task.find()
                .sort({ createdAt: -1 });

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
// CREATE TASK
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
// UPDATE TASK
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
// DELETE TASK
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
// 404 HANDLER
// ==================================================

app.use((req, res) => {
    res.status(404).json({
        message: "Route not found"
    });
});


// ==================================================
// SERVER
// ==================================================

const PORT = 5000;

app.listen(PORT, "127.0.0.1", () => {
    console.log(
        `Server running at http://127.0.0.1:${PORT}`
    );
});