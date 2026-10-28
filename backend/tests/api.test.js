process.env.JWT_SECRET = process.env.JWT_SECRET || "awdf_task_manager_secret_key_2026";
process.env.NODE_ENV = "test";

const request = require("supertest");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const app = require("../server");
const Task = require("../models/Task");
const redisClient = require("../middleware/redis");
const aiService = require("../services/aiService");
const aiRateLimiter = require("../middleware/aiRateLimiter");

describe("AWDF Practical 12 & 13 - Backend API Test Suite", () => {
    const testSecret = process.env.JWT_SECRET;
    let validToken;
    const mockTasks = [
        {
            _id: "660000000000000000000001",
            title: "Implement GitHub Actions CI",
            description: "Continuous integration pipeline for AWDF Practical 12",
            status: "In Progress",
            priority: "High",
            completed: false,
            createdAt: new Date().toISOString()
        },
        {
            _id: "660000000000000000000002",
            title: "Write Automated API Tests",
            description: "Jest and Supertest test suite",
            status: "Completed",
            priority: "Medium",
            completed: true,
            createdAt: new Date().toISOString()
        }
    ];

    beforeAll(() => {
        validToken = jwt.sign(
            {
                userId: "mock_user_12345",
                email: "ci-tester@college.edu",
                name: "CI Tester"
            },
            testSecret,
            { expiresIn: "1h" }
        );
    });

    beforeEach(() => {
        // Reset rate limiter cache before each test
        if (typeof aiRateLimiter.reset === "function") {
            aiRateLimiter.reset();
        }

        // Mock Task.find to guarantee instant, isolated database queries in all test environments
        jest.spyOn(Task, "find").mockReturnValue({
            sort: jest.fn().mockResolvedValue(mockTasks)
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    afterAll(async () => {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
        if (redisClient && redisClient.isOpen) {
            await redisClient.quit();
        }
    });

    // ==========================================================
    // 1. PRACTICAL 12: GET /tasks (Route & Security)
    // ==========================================================
    describe("GET /tasks - Route & Security Verification", () => {
        it("should reject request with malformed Authorization format with HTTP 401", async () => {
            const res = await request(app)
                .get("/tasks")
                .set("Authorization", "InvalidHeaderFormatWithoutBearer");

            expect(res.status).toBe(401);
            expect(res.body).toHaveProperty("message");
            expect(res.body.message).toMatch(/invalid authorization format/i);
        });

        it("should reject request with invalid or tampered JWT token with HTTP 401", async () => {
            const res = await request(app)
                .get("/tasks")
                .set("Authorization", "Bearer invalid.jwt.token");

            expect(res.status).toBe(401);
            expect(res.body).toHaveProperty("message");
            expect(res.body.message).toMatch(/invalid or expired token/i);
        });

        it("should return HTTP 200 with an array of tasks for an authenticated user", async () => {
            const res = await request(app)
                .get("/tasks")
                .set("Authorization", `Bearer ${validToken}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBe(2);
            expect(res.body[0].title).toBe("Implement GitHub Actions CI");
            expect(res.body[0].status).toBe("In Progress");
            expect(res.body[1].title).toBe("Write Automated API Tests");
        });
    });

    // ==========================================================
    // 2. PRACTICAL 12: System Health & Telemetry
    // ==========================================================
    describe("System Health & Telemetry", () => {
        it("should return HTTP 200 and backend operational status on GET /", async () => {
            const res = await request(app).get("/");

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("message");
            expect(res.body.message).toContain("Practical 6 backend is running");
        });

        it("should return HTTP 200 with active metrics snapshot on GET /eda/metrics", async () => {
            const res = await request(app).get("/eda/metrics");

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("systemStatus");
            expect(res.body.systemStatus).toMatch(/healthy/i);
            expect(res.body).toHaveProperty("eventBusMetrics");
            expect(typeof res.body.eventBusMetrics.totalPublished).toBe("number");
        });

        it("should reject registration missing email and password with HTTP 400", async () => {
            const res = await request(app)
                .post("/register")
                .send({ name: "Incomplete User" });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty("message");
            expect(res.body.message).toBe("Email and password are required");
        });
    });

    // ==========================================================
    // 3. PRACTICAL 13: POST /api/ai/generate-description
    // ==========================================================
    describe("PRACTICAL 13: POST /api/ai/generate-description", () => {
        it("Scenario 1: should generate an AI description for a valid task title with configured provider", async () => {
            // Mock OpenAI generation response
            jest.spyOn(aiService, "generateTaskDescription").mockResolvedValue({
                description: "Review database concepts, prepare SQL queries, and test the practical exercises.",
                fallback: false
            });

            const res = await request(app)
                .post("/api/ai/generate-description")
                .send({ title: "Prepare database practical" });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("description");
            expect(res.body.description).toBe("Review database concepts, prepare SQL queries, and test the practical exercises.");
            expect(res.body.fallback).toBe(false);
        });

        it("Scenario 2: should reject empty, whitespace, or missing title with HTTP 400", async () => {
            const resEmpty = await request(app)
                .post("/api/ai/generate-description")
                .send({ title: "   " });

            expect(resEmpty.status).toBe(400);
            expect(resEmpty.body).toHaveProperty("message");
            expect(resEmpty.body.message).toMatch(/task title is required/i);

            const resMissing = await request(app)
                .post("/api/ai/generate-description")
                .send({});

            expect(resMissing.status).toBe(400);
            expect(resMissing.body).toHaveProperty("message");
        });

        it("Scenario 2 (cont.): should reject title exceeding length limit (> 200 chars) with HTTP 400", async () => {
            const overlyLongTitle = "A".repeat(201);
            const res = await request(app)
                .post("/api/ai/generate-description")
                .send({ title: overlyLongTitle });

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/cannot exceed 200 characters/i);
        });

        it("Scenario 3: should return controlled fallback when API key is missing", async () => {
            jest.spyOn(aiService, "generateTaskDescription").mockResolvedValue({
                description: "",
                fallback: true,
                reason: "OpenAI API key is not configured. Please enter a description manually."
            });

            const res = await request(app)
                .post("/api/ai/generate-description")
                .send({ title: "Build React App" });

            expect(res.status).toBe(200);
            expect(res.body.description).toBe("");
            expect(res.body.fallback).toBe(true);
            expect(res.body.reason).toMatch(/not configured/i);
        });

        it("Scenario 4: should handle invalid API key credentials gracefully without crashing", async () => {
            jest.spyOn(aiService, "generateTaskDescription").mockResolvedValue({
                description: "",
                fallback: true,
                reason: "Invalid AI API key credentials. Please enter a description manually."
            });

            const res = await request(app)
                .post("/api/ai/generate-description")
                .send({ title: "Deploy Kubernetes Pods" });

            expect(res.status).toBe(200);
            expect(res.body.fallback).toBe(true);
            expect(res.body.reason).toMatch(/invalid.*credentials/i);
        });

        it("Scenario 5: should handle provider timeout / network failure gracefully", async () => {
            jest.spyOn(aiService, "generateTaskDescription").mockResolvedValue({
                description: "",
                fallback: true,
                reason: "AI request timed out. Please enter a description manually."
            });

            const res = await request(app)
                .post("/api/ai/generate-description")
                .send({ title: "Configure Nginx Reverse Proxy" });

            expect(res.status).toBe(200);
            expect(res.body.fallback).toBe(true);
            expect(res.body.reason).toMatch(/timed out/i);
        });

        it("Scenario 6: should enforce rate limiting on repeated rapid requests", async () => {
            jest.spyOn(aiService, "generateTaskDescription").mockResolvedValue({
                description: "Automated generated description",
                fallback: false
            });

            // First request passes
            const firstRes = await request(app)
                .post("/api/ai/generate-description")
                .send({ title: "Task 1" });

            expect(firstRes.status).toBe(200);

            // Immediate second request from same client triggers rate limit
            const secondRes = await request(app)
                .post("/api/ai/generate-description")
                .send({ title: "Task 2" });

            expect(secondRes.status).toBe(429);
            expect(secondRes.body).toHaveProperty("message");
            expect(secondRes.body.message).toMatch(/too many/i);
            expect(secondRes.body).toHaveProperty("retryAfter");
        });
    });
});
