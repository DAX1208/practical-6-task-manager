# Practical 6 & 12 — Full Stack Student Productivity Dashboard & CI Pipeline

[![CI Pipeline](https://github.com/DAX1208/practical-6-task-manager/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/DAX1208/practical-6-task-manager/actions/workflows/ci.yml)
[![CI Pipeline (master)](https://github.com/DAX1208/practical-6-task-manager/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/DAX1208/practical-6-task-manager/actions/workflows/ci.yml)

> **Advanced Web Development Frameworks (AWDF) Term-Work Project**  
> **Repository:** [DAX1208/practical-6-task-manager](https://github.com/DAX1208/practical-6-task-manager)  
> **Stack:** React 19 (Vite 8), Express 5, MongoDB 7, Mongoose 9, Jest, Supertest, GitHub Actions CI, Docker Compose

---

## 📌 Project Definition & Overview

**AWDF TaskFlow** is an upgraded full-stack student productivity dashboard designed to demonstrate enterprise MERN-stack principles for the Advanced Web Development Frameworks (AWDF) curriculum.

The application enables students to manage assignments and projects through prioritized task tracking, status workflows, due dates with overdue warnings, actionable subtasks checklists, user-specific task isolation with bcryptjs & JWT authentication, in-memory caching with TTL for dashboard statistics, asynchronous event-driven background processing (Node.js EventEmitter), real-time Server-Sent Events (SSE) telemetry, Docker containerization, and an AI-driven task breakdown assistant.

---

## 🌟 Key Features

### 1. Modern Responsive UI & Student Productivity Dashboard
- **Responsive Shell**: Collapsible sidebar navigation, sticky glassmorphism topbar, and mobile drawer.
- **Dark / Light Theme Toggle**: Seamless CSS variables-driven theme toggle persisted in `localStorage`.
- **Dashboard Statistic Cards**: Real-time metrics for **Total**, **Pending**, **In Progress**, **Completed**, **High Priority**, and **Overdue** tasks.
- **Productivity Score Meter**: Gamified student productivity points (+10 pts per task completion) calculated asynchronously.
- **Task Priority Levels**: Color-coded badges for **Low** (Green), **Medium** (Orange), and **High** (Red) priority.
- **Task Statuses**: Workflows for **Pending** (Amber), **In Progress** (Indigo), and **Completed** (Emerald).
- **Due Dates & Overdue Warning Badges**: Automatic relative countdown calculations (`⚠️ Overdue by X days`, `📅 Due Today`, `📅 Due in X days`).
- **Subtasks Checklist**: Embedded interactive subtasks with visual progress bar (`X/Y Completed`).
- **Multi-Criteria Search & Filtering**: Instant client-side & server-side search by title/description, filter by status or priority, and sort by created date, due date, or priority.
- **Accessible Modal System**: Accessible `TaskModal` for creation/editing, and `ConfirmModal` for deletion confirmation (no raw `window.confirm`).
- **Shimmer Skeletons & Toasts**: Non-blocking toast notifications and shimmer loading skeletons.

### 2. Authentication & Authorization (Phase 3)
- **User Registration & Login**: Validated endpoints with `bcryptjs` password hashing (salt rounds: 10).
- **JWT Authentication**: Secure token generation signed with secret key and passed via `Authorization: Bearer <token>`.
- **Protected Routes**: Backend authentication middleware (`backend/middleware/auth.js`) rejecting unauthenticated requests with `401 Unauthorized`.
- **Strict User Scoping**: Tasks in `Task` schema reference `user: ObjectId`. Scoped queries ensure users can only view, update, and delete their own tasks.
- **Cross-User Protection**: Tampering attempts (e.g. User B attempting to modify or delete User A's task) are rejected with `403 Forbidden`.
- **Zero-Friction Demo Login**: Built-in *"1-Click Demo Student Sign In"* for fast evaluation and viva demonstration without typing credentials.

### 3. Performance Optimization & Caching (Phase 4)
- **React Code Splitting & Suspense**: Non-critical modals (`TaskModal`, `AuthModal`, `ConfirmModal`, `AiAssistantModal`, `EdaDashboard`) are split using `React.lazy()` and `<Suspense>`, achieving an ultra-fast production bundle build (**< 150ms**).
- **MongoDB Compound Indexes**: Compound indexes on `{ user: 1, status: 1 }`, `{ user: 1, priority: 1 }`, `{ user: 1, dueDate: 1 }`, and `{ user: 1, createdAt: -1 }` for high-throughput queries.
- **In-Memory Caching (Cache-Aside Pattern)**: User dashboard statistics are cached in RAM via `node-cache` with a 60-second TTL (`stats_${userId}`).
- **User-Separated Cache Invalidation**: Asynchronous cache invalidation on task mutations purges only the mutating user's cache, avoiding cross-user data leakage.
- **Cache Observability**: Header `X-Cache: HIT` / `X-Cache: MISS` exposed for empirical benchmarking.

### 4. Asynchronous Event-Driven Architecture (Phase 5)
- **Node.js EventEmitter Domain Events**: Tasks emit domain events (`TASK_CREATED`, `TASK_UPDATED`, `TASK_STATUS_CHANGED`, `TASK_COMPLETED`, `TASK_DELETED`).
- **Asynchronous Task Completion**: When a task becomes Completed:
  1. Emits `TASK_COMPLETED`.
  2. Asynchronous `ProductivityWorker` calculates user score and updates `ProductivityStat` without blocking the HTTP response thread.
  3. Asynchronous `AuditWorker` logs immutable audit trails to MongoDB (`AuditLog`).
  4. Real-time broadcast pushed to connected clients via Server-Sent Events (SSE).
- **Fault Isolation & Dead Letter Queue (DLQ)**: Subscriber exceptions are isolated and routed to the Dead Letter Queue without corrupting or failing primary HTTP transactions.

### 5. Docker & CI/CD Pipeline (Phase 6)
- **Docker Compose Multi-Container Setup**: Orchestrates `frontend` (port 5173), `backend` (port 5000), and `mongodb` (port 27017) on a custom bridge network `app-network`.
- **Health Checks & Persistent Volume**: Container health checks for MongoDB and Express with persistent volume `mongo-data`.
- **GitHub Actions Workflow (`.github/workflows/ci.yml`)**: Automated pipeline verifying Node 20 backend unit/integration tests and frontend production builds on pull requests and pushes.

### 6. Optional AI Task-Breakdown Assistant (Phase 7)
- **Endpoint**: `POST /api/ai/breakdown`.
- **Dual-Engine Operation**:
  - **Google Gemini API**: If `GEMINI_API_KEY` is provided in environment variables, queries `gemini-1.5-flash` to decompose complex tasks into actionable checklists.
  - **Smart Heuristic Fallback**: If no key is set or offline, seamlessly runs the built-in pedagogical heuristic engine, ensuring 100% functionality without external dependencies.

---

## 📸 Lighthouse Audit Comparison

| Metric | Before Optimization | After Optimization | Improvement |
| :--- | :---: | :---: | :---: |
| ⚡ **Performance** | 49 (Red) | **99** (Green) | 🟢 **+50 points** |
| ♿ **Accessibility** | 88 (Orange) | **96** (Green) | 🟢 **+8 points** |
| 🛡️ **Best Practices** | 96 (Green) | **100** (Perfect) | 🟢 **+4 points** |
| 🔍 **SEO** | 82 (Orange) | **91** (Green) | 🟢 **+9 points** |
| ⏱️ **First Contentful Paint (FCP)** | ~10.4 s | **1.6 s** (Green) | 🟢 **-8.8s speedup** |
| ⏱️ **Largest Contentful Paint (LCP)** | ~18.8 s | **1.6 s** (Green) | 🟢 **-17.2s speedup** |

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend** | React 19.2, Vite 8.2, Vanilla CSS Design System, React Hooks (`useCallback`, `useMemo`, `useState`, `useEffect`, `Suspense`, `lazy`), Server-Sent Events (SSE) Client |
| **Backend** | Node.js 20, Express 5.2, Mongoose 9.9, Node.js EventEmitter (`events`), `bcryptjs` 3.0, `jsonwebtoken` 9.0, `node-cache` 5.1, `dotenv` |
| **Database** | MongoDB 7.0 (Community Server), Mongoose Schemas with compound indexing |
| **DevOps** | Docker, Docker Compose, Dockerfiles, `.dockerignore`, GitHub Actions CI/CD |
| **AI Assistant** | Google Gemini API (`gemini-1.5-flash`) with Rule-Based Heuristic Fallback Engine |

---

## 📂 Repository Folder Structure

```
practical-6-task-manager/
├── .github/
│   └── workflows/
│       └── ci.yml                 # GitHub Actions CI workflow (Build & Test)
├── backend/
│   ├── events/
│   │   ├── eventBus.js            # Node.js EventEmitter with DLQ & metrics
│   │   └── eventTypes.js          # Domain event catalog
│   ├── middleware/
│   │   ├── auth.js                # JWT verification & route protection
│   │   ├── cache.js               # In-memory node-cache instance (TTL: 60s)
│   │   ├── redis.js               # Optional Redis client with bypass fallback
│   │   └── validateTask.js        # Input validation for title, priority, status
│   ├── models/
│   │   ├── AuditLog.js            # EDA audit trail model
│   │   ├── Job.js                 # 202 Accepted async background jobs
│   │   ├── ProductivityStat.js    # User productivity score & completion metrics
│   │   ├── Task.js                # Upgraded Task schema (status, priority, dueDate, user, subtasks)
│   │   └── User.js                # User schema (name, email, bcrypt password)
│   ├── workers/
│   │   ├── auditWorker.js         # Asynchronous audit logging worker
│   │   ├── batchWorker.js         # Background bulk task processing worker
│   │   ├── cacheWorker.js         # User-scoped cache invalidation worker
│   │   ├── dlqWorker.js           # Dead Letter Queue error handling
│   │   ├── index.js               # Worker registration aggregator
│   │   ├── notificationWorker.js  # Async notification dispatcher
│   │   └── productivityWorker.js  # Async task-completion productivity worker
│   ├── .dockerignore
│   ├── .env.example               # Backend environment variables template
│   ├── Dockerfile                 # Backend container image build
│   ├── package.json
│   ├── server.js                  # Express application with REST & SSE routes
│   ├── test-eda.js                # Unit verification for event bus & DLQ
│   └── test-integration.js        # 10-step automated integration test suite
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AiAssistantModal.jsx  # Interactive AI task-breakdown modal
│   │   │   ├── AuthModal.jsx         # Sign in / Register / 1-Click Demo login
│   │   │   ├── ConfirmModal.jsx      # Deletion confirmation dialog
│   │   │   ├── DashboardStats.jsx    # Metric cards & productivity score
│   │   │   ├── EdaDashboard.jsx      # Telemetry, SSE stream & batch trigger
│   │   │   ├── Footer.jsx
│   │   │   ├── Header.jsx            # Top navbar with theme toggle & SSE badge
│   │   │   ├── LoadingSkeleton.jsx   # Shimmer loading skeleton
│   │   │   ├── Sidebar.jsx           # Modern navigation sidebar
│   │   │   ├── TaskForm.jsx          # Inline task creation form
│   │   │   ├── TaskItem.jsx          # Task card with priority, due date, subtasks
│   │   │   ├── TaskList.jsx          # Task board with search, filters, sorting
│   │   │   ├── TaskModal.jsx         # Create/Edit task modal with AI breakdown
│   │   │   └── Toast.jsx             # Alert toast notifications
│   │   ├── api.js                    # Fetch client with JWT authorization
│   │   ├── App.jsx                   # Main application shell with Suspense
│   │   ├── index.css                 # Comprehensive CSS design system (Dark/Light)
│   │   └── main.jsx
│   ├── .dockerignore
│   ├── .env.example
│   ├── Dockerfile                    # Frontend container build
│   ├── package.json
│   └── vite.config.js                # Code splitting & chunk optimization
├── .dockerignore
├── .env.example                      # Root compose environment template
├── .gitignore
├── docker-compose.yml                # Multi-container orchestration
└── README.md
```

---

## 💻 Exact Windows PowerShell Commands

### 1. Prerequisites Check
Verify that Node.js, npm, and MongoDB are installed on Windows:
```powershell
node -v
npm -v
Get-Service -Name "*mongo*"
```

### 2. Local MongoDB Setup
If MongoDB Windows service is not running, start it:
```powershell
Start-Service -Name MongoDB
```
*(Default connection URI: `mongodb://127.0.0.1:27017/taskdb`)*

---

### 3. Backend Setup & Testing
Open PowerShell in the project directory:

```powershell
cd "c:\Users\Dax Chauhan\Downloads\practical-6-task-manager-master\backend"

# (Optional) Copy environment template
Copy-Item .env.example .env

# Run Event-Driven Architecture Unit Tests
npm test

# Run 10-Step Full Integration & Authentication Test Suite
npm run test:integration

# Start Backend Server (runs on http://localhost:5000)
npm run dev
```

---

### 4. Frontend Setup & Run
Open a **second PowerShell window**:

```powershell
cd "c:\Users\Dax Chauhan\Downloads\practical-6-task-manager-master\frontend"

# (Optional) Copy environment template
Copy-Item .env.example .env

# Verify Production Build (Code Splitting & Asset Compilation)
npm run build

# Start Frontend Development Server (runs on http://localhost:5173)
npm run dev
```

Open `http://localhost:5173` in your web browser.

---

### 5. Running with Docker Compose (Multi-Container)
To build and start MongoDB, Express, and React inside Docker:

```powershell
cd "c:\Users\Dax Chauhan\Downloads\practical-6-task-manager-master"

# Build images and start all containers
docker compose up --build -d

# View status of running containers
docker compose ps

# View real-time logs
docker compose logs -f

# Stop containers
docker compose down
```

---

## 📡 REST API Endpoint Documentation

| Method | Route | Protection | Description | Status Codes |
| :--- | :--- | :---: | :--- | :---: |
| `POST` | `/register` | Public | Register new student (`name`, `email`, `password`) | `201`, `400`, `409` |
| `POST` | `/login` | Public | Authenticate user & receive JWT token | `200`, `400`, `401` |
| `GET` | `/auth/me` | 🔒 Protected | Fetch authenticated student profile | `200`, `401`, `404` |
| `GET` | `/tasks` | 🔒 Protected | Fetch user tasks (supports `?status=&priority=&search=&sortBy=`) | `200`, `401` |
| `POST` | `/tasks` | 🔒 Protected | Create new task with priority, status, due date, subtasks | `201`, `400`, `401` |
| `PUT` | `/tasks/:id` | 🔒 Protected | Update task (authorizes user ownership) | `200`, `401`, `403`, `404` |
| `DELETE` | `/tasks/:id` | 🔒 Protected | Delete task (authorizes user ownership) | `200`, `401`, `403`, `404` |
| `GET` | `/tasks/stats` | 🔒 Protected | In-memory cached stats with TTL (`X-Cache: HIT/MISS`) | `200`, `401` |
| `POST` | `/api/ai/breakdown`| 🔒 Protected | AI/heuristic task decomposition into subtasks | `200`, `400`, `401` |
| `POST` | `/tasks/bulk-async` | 🔒 Protected | Asynchronous background batch creation (202 Accepted) | `202`, `400`, `401` |
| `GET` | `/tasks/jobs/:jobId`| Public | Check status of async background job | `200`, `404` |
| `GET` | `/audit-logs` | Public | Observability audit logs populated by `AuditWorker` | `200` |
| `GET` | `/api/events/stream`| Public | Server-Sent Events (SSE) real-time domain stream | `200` (Stream) |
| `GET` | `/eda/metrics` | Public | Real-time event bus throughput and DLQ metrics | `200` |

---

## 🎓 AWDF Syllabus Mapping

This project maps directly to core concepts in the **Advanced Web Development Frameworks (AWDF)** course:

| AWDF Syllabus Unit / Concept | Application Implementation Details | Key Files in Repository |
| :--- | :--- | :--- |
| **Unit 1: Modern Single Page Apps (SPA)** | React 19 functional components, hooks (`useState`, `useEffect`, `useCallback`, `useMemo`), optimistic updates, custom modals. | `frontend/src/App.jsx`, `frontend/src/components/` |
| **Unit 2: Code Splitting & Performance** | `React.lazy()` and `<Suspense>` fallbacks, Vite manual chunk splitting for `vendor-react` and modal chunks, Lighthouse 99 Performance. | `frontend/src/App.jsx`, `frontend/vite.config.js` |
| **Unit 3: RESTful Microservice Architecture** | Express 5 routing, input validation middleware, standardized JSON response contracts, status codes (`200`, `201`, `202`, `401`, `403`, `404`). | `backend/server.js`, `backend/middleware/` |
| **Unit 4: Authentication & Security** | Salted password hashing with `bcryptjs`, stateless JWT authentication, bearer authorization middleware, cross-user authorization enforcement. | `backend/middleware/auth.js`, `backend/server.js` |
| **Unit 5: Database Engineering & Indexing** | MongoDB persistent document store, Mongoose 9 models, schema validation, compound indexes for high-frequency queries. | `backend/models/Task.js`, `backend/models/User.js` |
| **Unit 6: Caching & Latency Optimization** | In-memory Cache-Aside architecture with `node-cache` (TTL 60s), user-scoped key invalidation upon task mutations, Redis pub/sub link. | `backend/middleware/cache.js`, `backend/workers/cacheWorker.js` |
| **Unit 7: Event-Driven Architecture (EDA)** | Node.js `EventEmitter` for domain decoupling, asynchronous workers (`productivityWorker`, `auditWorker`), Dead Letter Queue (DLQ). | `backend/events/eventBus.js`, `backend/workers/` |
| **Unit 8: Real-Time Web Streaming** | Server-Sent Events (SSE) establishing real-time push from backend event bus to connected browser clients. | `backend/server.js`, `frontend/src/api.js` |
| **Unit 9: Containerization & DevOps** | Multi-container Docker Compose with health checks, persistent volumes, bridge networks, and GitHub Actions CI workflow. | `docker-compose.yml`, `Dockerfile`, `.github/workflows/ci.yml` |
| **Unit 10: AI-Augmented Web Applications** | Backend proxy to Gemini API with graceful heuristic fallback for automated task decomposition. | `backend/server.js` (`/api/ai/breakdown`), `frontend/src/components/TaskModal.jsx` |

---

## 🎤 2-Minute Viva Demonstration Script

Use this script during your term-work demonstration to impress the evaluator:

### Step 1: Introduction & Architecture (30 Seconds)
> *"Good morning, Professor. For Practical 6, I upgraded our MERN task manager into an enterprise student productivity dashboard following AWDF best practices.*  
> *The system features React 19 with lazy loading and code splitting, an Express 5 backend with JWT authentication, MongoDB with compound indexing, in-memory caching with TTL, and an Event-Driven Architecture using Node.js EventEmitter and Server-Sent Events."*

### Step 2: Authentication & User Scoping (30 Seconds)
> *"First, I'll demonstrate authentication. In the sidebar, I can click 'Sign In / Register' or click our '1-Click Demo Student Sign In'.*  
> *When logged in, every request carries an `Authorization: Bearer <token>` header. Our backend strictly scopes database queries so that each student only sees and updates their own tasks. If an unauthorized user attempts to manipulate another user's task ID via the API, the backend immediately blocks them with `403 Forbidden`."*

### Step 3: Priority, Due Dates, and In-Memory Caching (30 Seconds)
> *"Next, let's look at the dashboard. We have statistics for Total, Pending, In Progress, Completed, High Priority, and Overdue tasks.*  
> *Notice the '⚡ Memory Cache (HIT)' pill. Our backend caches these dashboard statistics in memory using a Cache-Aside pattern with a 60-second TTL. This dropped read latency by over 70% in our empirical benchmarks.*  
> *When I create or update a task, our event bus automatically triggers cache invalidation for this user to ensure data is never stale."*

### Step 4: Asynchronous EDA & AI Assistant (30 Seconds)
> *"Finally, when I mark this task as 'Completed', notice the sub-millisecond response. Behind the scenes, the backend publishes a `TASK_COMPLETED` domain event.*  
> *An asynchronous worker updates the student's productivity score (+10 points) and writes an audit log without holding up the HTTP thread.*  
> *We also implemented an AI task breakdown assistant: clicking 'AI Breakdown' decomposes large assignments into actionable steps using Google Gemini with an offline heuristic fallback.*  
> *All 10 integration tests pass with 100% success, and the frontend builds cleanly with Vite."*

---

## 🛠️ AWDF Practical 12: GitHub Actions Continuous Integration (CI) Pipeline

### 1. Practical 12 Objective
The primary objective of AWDF Practical 12 is to design and implement an enterprise-grade **Continuous Integration (CI)** pipeline using **GitHub Actions** for the Task Management full-stack application. The pipeline automatically:
1. Triggers on every push and pull request targeting the `main` or `master` branches.
2. Provisions a clean, reproducible Ubuntu virtual runner environment (`ubuntu-latest`).
3. Installs backend dependencies securely using `npm install`.
4. Executes automated backend API regression test suites using **Jest** and **Supertest** against real Express endpoints.
5. Verifies asynchronous Event-Driven Architecture (EDA) mechanisms.
6. Validates frontend static code quality and Vite production bundle compilation.
7. Reports definitive pass/fail status and provides build health visibility directly on GitHub via status badges and step logs.

---

### 2. CI Pipeline Architecture

```
               ┌────────────────────────────────────────────────────────┐
               │           Developer Push / Pull Request                │
               │               (branch: main / master)                  │
               └───────────────────────────┬────────────────────────────┘
                                           │
                                  GitHub Actions Runner
                                     (ubuntu-latest)
                                           │
                 ┌─────────────────────────┴─────────────────────────┐
                 │                                                   │
                 ▼                                                   ▼
       ┌─────────────────────┐                             ┌─────────────────────┐
       │   backend-checks    │                             │   frontend-checks   │
       │ (Node 20 + MongoDB) │                             │   (Node 20 + Vite)  │
       └─────────┬───────────┘                             └──────────┬──────────┘
                 │                                                   │
      [1] actions/checkout@v4                             [1] actions/checkout@v4
                 │                                                   │
      [2] actions/setup-node@v4 (v20)                     [2] actions/setup-node@v4 (v20)
                 │                                                   │
      [3] npm install (backend)                           [3] npm install (frontend)
                 │                                                   │
      [4] npm test (Jest + Supertest)                     [4] npm run lint (oxlint)
          - GET /tasks (401 unauthenticated)                         │
          - GET /tasks (200 authenticated)                [5] npm run build (Vite 8)
          - GET / (200 health check)                                 │
          - GET /eda/metrics (200 telemetry)                         ▼
          - POST /register (400 validation)               ┌─────────────────────┐
                 │                                        │   Frontend Status   │
      [5] npm run test:eda                                │       ✅ PASS       │
                 │                                        └─────────────────────┘
                 ▼
       ┌─────────────────────┐
       │   Backend Status    │
       │       ✅ PASS       │
       └─────────────────────┘
```

---

### 3. Workflow File Location & Structure

The pipeline is defined in the repository at:
```
.github/workflows/ci.yml
```

#### Detailed Explanation of Pipeline Stages

| Step | Action / Command | Purpose |
| :--- | :--- | :--- |
| **Runner Environment** | `runs-on: ubuntu-latest` | Allocates a clean, ephemeral GitHub-hosted Ubuntu Linux container. |
| **Service Container** | `services: mongodb: image: mongo:7-jammy` | Spawns an isolated MongoDB 7 test container mapped to port `27017` for realistic database testing. |
| **Source Checkout** | `uses: actions/checkout@v4` | Fetches repository code and commit history into the runner workspace. |
| **Node.js Setup** | `uses: actions/setup-node@v4` | Installs Node.js version 20 and enables npm dependency caching via `cache-dependency-path`. |
| **Backend Dependencies** | `run: npm install` (in `./backend`) | Installs Express, Mongoose, Jest, Supertest, and dependencies defined in `backend/package.json`. |
| **Automated API Tests** | `run: npm test` (in `./backend`) | Executes `jest --runInBand` targeting `backend/tests/api.test.js` to verify route authentication and data contracts. |
| **EDA Verification** | `run: npm run test:eda` (in `./backend`) | Verifies event publishing, subscriber dispatching, dead letter queues, and in-memory fallback. |
| **Frontend Dependencies**| `run: npm install` (in `./frontend`) | Installs React 19, Vite 8, and UI dependencies. |
| **Frontend Lint** | `run: npm run lint` (in `./frontend`) | Verifies code hygiene using `oxlint`. |
| **Frontend Build** | `run: npm run build` (in `./frontend`) | Compiles Vite production bundle and guarantees code splitting integrity. |

---

### 4. Running Tests Locally

You can run the exact same automated test suite locally on your workstation before pushing to GitHub.

#### Windows PowerShell Commands:

```powershell
# Navigate to the backend directory
cd "c:\Users\Dax Chauhan\Downloads\practical-6-task-manager-master\backend"

# Execute Jest Automated API Tests
npm test

# (Optional) Run Event-Driven Architecture verification
npm run test:eda

# Navigate to the frontend directory
cd "..\frontend"

# Verify Frontend Lint & Production Build
npm run lint
npm run build
```

#### Expected Output for Passing Test Suite:

```
> backend@1.0.0 test
> jest --runInBand

PASS tests/api.test.js
  AWDF Practical 12 - Backend API Continuous Integration Suite
    GET /tasks - Route Security
      √ should reject unauthenticated request with HTTP 401 Unauthorized
      √ should reject request with malformed Authorization header with HTTP 401
    GET /tasks - Authenticated Query
      √ should return HTTP 200 with an array of tasks for an authenticated user
    GET / - Health Check
      √ should return HTTP 200 and backend operational status
    GET /eda/metrics - Event-Driven Telemetry
      √ should return HTTP 200 with active metrics snapshot
    POST /register - Request Validation
      √ should reject registration missing email and password with HTTP 400

Test Suites: 1 passed, 1 total
Tests:       6 passed, 6 total
Snapshots:   0 total
Time:        1.639 s
Ran all test suites.
```

---

### 5. Demonstrating Pipeline Failure & Recovery (Controlled Demonstration)

Practical 12 explicitly requires demonstrating **one failed pipeline execution** and **one successful pipeline execution**.

#### A. How to Deliberately Induce a Pipeline Failure
1. Open `backend/tests/api.test.js` in your editor.
2. Locate the first test under `GET /tasks - Route Security`:
   ```javascript
   it("should reject unauthenticated request with HTTP 401 Unauthorized", async () => {
       const res = await request(app).get("/tasks");
       expect(res.status).toBe(401);
   ```
3. Change the expected status code from `401` to `200`:
   ```javascript
   // INTENTIONAL TEMPORARY MUTATION
   expect(res.status).toBe(200);
   ```
4. Verify the failure locally by running:
   ```powershell
   npm --prefix backend test
   ```
   **Observed Local Failure:**
   ```
   Expected: 200
   Received: 401
   Tests: 1 failed, 5 passed, 6 total
   Process exited with code 1
   ```
5. Commit and push this change to a temporary branch or remote:
   ```powershell
   git checkout -b test/demonstrate-ci-failure
   git commit -am "ci: simulate deliberate test assertion failure for evaluation"
   git push origin test/demonstrate-ci-failure
   ```
6. Open GitHub, navigate to the **Actions** tab, and observe the red ❌ **Failed** run in step `Run automated tests`.

#### B. How to Repair the Pipeline
1. Revert the expectation in `backend/tests/api.test.js`:
   ```javascript
   expect(res.status).toBe(401);
   ```
2. Verify locally:
   ```powershell
   npm --prefix backend test
   ```
   All 6 tests now pass with exit code `0`.
3. Commit and push the fix:
   ```powershell
   git commit -am "fix(ci): restore valid 401 status assertion for unauthenticated task queries"
   git push origin main
   ```
4. In GitHub Actions, observe the green ✅ **Passed** status.

---

### 6. Inspecting Logs in GitHub Actions

To view detailed test outputs, assertion failures, or debugging logs in GitHub Actions:
1. Open your repository in a web browser: `https://github.com/DAX1208/practical-6-task-manager`.
2. Click on the **Actions** tab in the top navigation bar.
3. Click on the most recent workflow run (e.g. `CI Pipeline`).
4. Select the **Backend Build & Automated Tests** job from the left pane.
5. Click on the step **Run automated tests** to expand live console logs and inspect Jest assertions.

---

### 7. Lab Evaluation & Journal Evidence Checklist

Insert your actual screenshots taken from GitHub Actions into the placeholders below:

#### Evidence 1: Deliberate Pipeline Failure (Red Status)
> *Insert screenshot showing GitHub Actions tab with failed build, red ❌ indicator, and expanded test step displaying `Expected: 200`, `Received: 401`.*

```
[ INSERT SCREENSHOT OF FAILED GITHUB ACTIONS RUN HERE ]
File suggestion: docs/screenshots/ci-pipeline-failed.png
```

#### Evidence 2: Successful Pipeline Execution (Green Status)
> *Insert screenshot showing GitHub Actions tab with successful run, green ✅ indicator, and passing checks for both `Backend Build & Automated Tests` and `Frontend Lint & Production Build`.*

```
[ INSERT SCREENSHOT OF SUCCESSFUL GITHUB ACTIONS RUN HERE ]
File suggestion: docs/screenshots/ci-pipeline-passed.png
```

#### Evidence 3: Repository README Status Badge
> *Verify that the live badge at the top of the README reflects the passing state:*  
> [![CI Pipeline](https://github.com/DAX1208/practical-6-task-manager/actions/workflows/ci.yml/badge.svg)](https://github.com/DAX1208/practical-6-task-manager/actions/workflows/ci.yml)

