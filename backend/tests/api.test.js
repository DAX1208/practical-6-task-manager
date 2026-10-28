process.env.JWT_SECRET = process.env.JWT_SECRET || "awdf_task_manager_secret_key_2026";
process.env.NODE_ENV = "test";

const request = require("supertest");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const app = require("../server");
const Task = require("../models/Task");
const redisClient = require("../middleware/redis");

describe("AWDF Practical 12 - Backend API Continuous Integration Suite", () => {
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
    // 1. PRIMARY REQUIRED ENDPOINT: GET /tasks
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
    // 2. SECONDARY ENDPOINT: GET / (System Health & EDA Status)
    // ==========================================================
    describe("GET / - Health Check", () => {
        it("should return HTTP 200 and backend operational status", async () => {
            const res = await request(app).get("/");

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("message");
            expect(res.body.message).toContain("Practical 6 backend is running");
        });
    });

    // ==========================================================
    // 3. SECONDARY ENDPOINT: GET /eda/metrics (Telemetry)
    // ==========================================================
    describe("GET /eda/metrics - Event-Driven Telemetry", () => {
        it("should return HTTP 200 with active metrics snapshot", async () => {
            const res = await request(app).get("/eda/metrics");

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("systemStatus");
            expect(res.body.systemStatus).toMatch(/healthy/i);
            expect(res.body).toHaveProperty("eventBusMetrics");
            expect(typeof res.body.eventBusMetrics.totalPublished).toBe("number");
        });
    });

    // ==========================================================
    // 4. SECONDARY ENDPOINT: POST /register - Input Validation
    // ==========================================================
    describe("POST /register - Request Validation", () => {
        it("should reject registration missing email and password with HTTP 400", async () => {
            const res = await request(app)
                .post("/register")
                .send({ name: "Incomplete User" });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty("message");
            expect(res.body.message).toBe("Email and password are required");
        });
    });
});
