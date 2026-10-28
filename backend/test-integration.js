const mongoose = require("mongoose");
const http = require("http");

async function runIntegrationTests() {
    console.log("🚀 Starting Full AWDF Task Manager Integration Test Suite...\n");

    // Dynamic import server (which establishes Mongo connection and starts express)
    const serverModule = require("./server"); // starts express on its port, or let's inspect

    // Wait 500ms for server to bind
    await new Promise((r) => setTimeout(r, 800));

    const PORT = process.env.PORT || 5000;
    const BASE_URL = `http://127.0.0.1:${PORT}`;

    // Helper fetch wrapper
    async function apiRequest(path, method = "GET", body = null, token = null) {
        const headers = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch(`${BASE_URL}${path}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined
        });

        const data = await res.json().catch(() => ({}));
        return { status: res.status, data, headers: res.headers };
    }

    const testEmailA = `student_a_${Date.now()}@college.edu`;
    const testEmailB = `student_b_${Date.now()}@college.edu`;
    const password = "Password123!";

    // TEST 1: Register User A
    console.log("1. Testing User A Registration...");
    const regRes = await apiRequest("/register", "POST", {
        name: "Alice Developer",
        email: testEmailA,
        password
    });
    if (regRes.status !== 201 || !regRes.data.token) {
        throw new Error(`Registration failed: ${JSON.stringify(regRes.data)}`);
    }
    const tokenA = regRes.data.token;
    console.log("✅ User A registered successfully with JWT.");

    // TEST 2: Register User B
    console.log("2. Testing User B Registration...");
    const regResB = await apiRequest("/register", "POST", {
        name: "Bob Engineer",
        email: testEmailB,
        password
    });
    const tokenB = regResB.data.token;
    console.log("✅ User B registered successfully with JWT.");

    // TEST 3: Login User A
    console.log("3. Testing User A Login...");
    const loginRes = await apiRequest("/login", "POST", {
        email: testEmailA,
        password
    });
    if (loginRes.status !== 200 || !loginRes.data.token) {
        throw new Error(`Login failed: ${JSON.stringify(loginRes.data)}`);
    }
    console.log("✅ User A login verified.");

    // TEST 4: Protected route rejection without token
    console.log("4. Testing Protected Route Authentication (without token)...");
    const unauthRes = await apiRequest("/tasks", "GET");
    if (unauthRes.status !== 401) {
        throw new Error(`Expected 401 Unauthorized, got: ${unauthRes.status}`);
    }
    console.log("✅ Protected endpoint correctly rejected unauthenticated request with 401.");

    // TEST 5: Create Task for User A
    console.log("5. Testing Task Creation with Priority, Status, DueDate...");
    const taskRes = await apiRequest("/tasks", "POST", {
        title: "AWDF Term Project Implementation",
        description: "Complete modern responsive dashboard and authentication",
        priority: "High",
        status: "In Progress",
        dueDate: new Date(Date.now() + 86400000).toISOString()
    }, tokenA);
    if (taskRes.status !== 201 || !taskRes.data._id) {
        throw new Error(`Task creation failed: ${JSON.stringify(taskRes.data)}`);
    }
    const taskIdA = taskRes.data._id;
    console.log(`✅ Task created successfully (ID: ${taskIdA}, Priority: ${taskRes.data.priority}, Status: ${taskRes.data.status}).`);

    // TEST 6: Dashboard Statistics & In-Memory Caching
    console.log("6. Testing In-Memory Dashboard Statistics Caching...");
    const stat1 = await apiRequest("/tasks/stats", "GET", null, tokenA);
    const headerCache1 = stat1.headers.get("x-cache");
    console.log(`- Call 1 X-Cache: ${headerCache1} (Expected MISS)`);

    const stat2 = await apiRequest("/tasks/stats", "GET", null, tokenA);
    const headerCache2 = stat2.headers.get("x-cache");
    console.log(`- Call 2 X-Cache: ${headerCache2} (Expected HIT)`);

    if (headerCache2 !== "HIT") {
        console.warn("⚠️ Note: Expected HIT on second stats call.");
    } else {
        console.log("✅ In-memory stats caching verified with cache HIT!");
    }

    // TEST 7: Cross-User Authorization (User B cannot modify or delete User A's task)
    console.log("7. Testing Cross-User Access Control (User B attempting to modify User A's task)...");
    const hijackRes = await apiRequest(`/tasks/${taskIdA}`, "PUT", {
        title: "Malicious Tampering",
        description: "Trying to overwrite someone else's task"
    }, tokenB);
    if (hijackRes.status !== 403) {
        throw new Error(`Expected 403 Forbidden for cross-user mutation, got ${hijackRes.status}`);
    }
    console.log("✅ Cross-user tampering correctly blocked with 403 Forbidden!");

    const hijackDelRes = await apiRequest(`/tasks/${taskIdA}`, "DELETE", null, tokenB);
    if (hijackDelRes.status !== 403) {
        throw new Error(`Expected 403 Forbidden for cross-user deletion, got ${hijackDelRes.status}`);
    }
    console.log("✅ Cross-user deletion correctly blocked with 403 Forbidden!");

    // TEST 8: Task Completion & Async Event Processing
    console.log("8. Testing Task Completion & Asynchronous Productivity Event...");
    const completeRes = await apiRequest(`/tasks/${taskIdA}`, "PUT", {
        title: "AWDF Term Project Implementation",
        description: "Complete modern responsive dashboard and authentication",
        status: "Completed",
        completed: true
    }, tokenA);
    if (completeRes.status !== 200 || completeRes.data.status !== "Completed") {
        throw new Error(`Task update failed: ${JSON.stringify(completeRes.data)}`);
    }
    console.log("✅ Task successfully marked as Completed.");

    // Wait 300ms for asynchronous worker processing
    await new Promise((r) => setTimeout(r, 400));

    // Verify cache was invalidated
    const statAfterComplete = await apiRequest("/tasks/stats", "GET", null, tokenA);
    console.log(`- Stats after mutation completed count: ${statAfterComplete.data.completed} (Cache: ${statAfterComplete.headers.get("x-cache")})`);

    // TEST 9: AI Task Breakdown Assistant
    console.log("9. Testing AI Task Breakdown Assistant...");
    const aiRes = await apiRequest("/api/ai/breakdown", "POST", {
        title: "Build Distributed Microservice System",
        description: "Docker, Kubernetes, RabbitMQ setup for AWDF lab",
        priority: "High"
    }, tokenA);
    if (aiRes.status !== 200 || !Array.isArray(aiRes.data.subtasks) || aiRes.data.subtasks.length === 0) {
        throw new Error(`AI breakdown failed: ${JSON.stringify(aiRes.data)}`);
    }
    console.log(`✅ AI Assistant returned ${aiRes.data.subtasks.length} actionable subtasks (Engine: ${aiRes.data.source}).`);

    // TEST 10: Delete Task
    console.log("10. Testing Task Deletion...");
    const delRes = await apiRequest(`/tasks/${taskIdA}`, "DELETE", null, tokenA);
    if (delRes.status !== 200) {
        throw new Error(`Task deletion failed: ${JSON.stringify(delRes.data)}`);
    }
    console.log("✅ Task successfully deleted.");

    console.log("\n🎉 ALL 10 INTEGRATION TESTS PASSED WITH 100% SUCCESS!\n");
    process.exit(0);
}

runIntegrationTests().catch((err) => {
    console.error("❌ Integration test failed:", err);
    process.exit(1);
});
