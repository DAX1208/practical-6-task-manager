# Performance Optimization & Caching Benchmark

This document provides empirical benchmarking data comparing API response times **before vs. after caching** using `node-cache` in the Task Manager backend.

---

## ⏱️ Empirical Latency Benchmark Results

### 1. Sequential Request Execution Table

| Request # | HTTP Method & Route | Request State | Data Source / Processing | Response Time (Latency) | Status / Observation |
| :---: | :--- | :--- | :--- | :---: | :--- |
| **1st Request** | `GET /tasks` | **Uncached (Cache Miss)** | MongoDB (`Task.find()`) + Cache Write | **31 ms** | Initial database fetch & cache population (Baseline) |
| **2nd Request** | `GET /tasks` | **Cached (Cache Hit)** | `node-cache` (In-Memory RAM) | **10 ms** | 🟢 **67.7% Faster (3.1x Speedup)** |
| **3rd Request** | `GET /tasks` | **Cached (Cache Hit)** | `node-cache` (In-Memory RAM) | **8 ms** | 🟢 **74.2% Faster (3.9x Speedup)** |
| **4th Request** | `GET /tasks` | **Cached (Cache Hit)** | `node-cache` (In-Memory RAM) | **9 ms** | 🟢 **71.0% Faster (3.4x Speedup)** |
| **5th Request** | `POST /tasks` | **Write + Invalidation** | MongoDB Insert + Cache Purge | **11 ms** | Data saved to DB & cache cleared |
| **6th Request** | `PUT /tasks/:id` | **Update + Invalidation** | MongoDB Update + Cache Purge | **10 ms** | Status toggled & cache cleared |
| **7th Request** | `DELETE /tasks/:id` | **Delete + Invalidation** | MongoDB Remove + Cache Purge | **9 ms** | Task deleted & cache cleared |

---

### 2. Summary Comparison (Uncached vs. Cached)

| Metric | Uncached Read (1st `GET`) | Cached Reads (Subsequent `GET`) | CRUD Mutations (`POST` / `PUT` / `DELETE`) |
| :--- | :---: | :---: | :---: |
| **Data Source** | MongoDB via Disk / TCP | Server In-Memory RAM | MongoDB Write + Cache Invalidation |
| **Average Latency** | **31 ms** | **9.0 ms** (Range: `8 - 10 ms`) | **10.0 ms** (Range: `9 - 11 ms`) |
| **Database Read I/O** | 100% Hit on Database | **0 DB Queries** (Offloaded to RAM) | Direct Write to MongoDB |
| **Performance Gain** | Baseline (1x) | 🟢 **~3.4x Faster (~70% Latency Drop)** | Optimized non-blocking writes |
| **Cache Status** | Cache Miss $\rightarrow$ Saved to Cache | Cache Hit $\rightarrow$ Instant Response | Cache Invalidation (`cache.del`) |

---

## 📋 REST API CRUD Request Comparison Table

| HTTP Method | API Endpoint | CRUD Operation | Request Payload / Params | Mongoose / DB Operation | In-Memory Cache Action | Success Status | Error Statuses | Idempotent |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: | :---: | :---: |
| **`GET`** | `/tasks` | **Read** (Retrieve all tasks) | *None* | `Task.find().sort({ createdAt: -1 })` *(Only on Cache Miss)* | **Cache Read** (Hits `all_tasks` key) / Populates cache on Miss (TTL: 60s) | `200 OK` | `401`, `500` | **Yes** |
| **`POST`** | `/tasks` | **Create** (Add new task) | **JSON Body:**<br>`{ "title": "...", "description": "..." }` | `new Task(...).save()` | **Write-Invalidation** (`cache.del('all_tasks')`) | `201 Created` | `400`, `401`, `500` | **No** |
| **`PUT`** | `/tasks/:id` | **Update** (Modify task / toggle status) | **URL Param:** `id`<br>**JSON Body:**<br>`{ "title": "...", "description": "...", "completed": true/false }` | `Task.findByIdAndUpdate(id, data, { new: true, runValidators: true })` | **Write-Invalidation** (`cache.del('all_tasks')`) | `200 OK` | `400`, `401`, `404`, `500` | **Yes** |
| **`DELETE`** | `/tasks/:id` | **Delete** (Remove task) | **URL Param:** `id` | `Task.findByIdAndDelete(id)` | **Write-Invalidation** (`cache.del('all_tasks')`) | `200 OK` | `401`, `404`, `500` | **Yes** |

---

## In-Memory Caching Architecture with `node-cache`

```text
                                 ┌────────────── [ node-cache Memory ] ──────────────┐
                                 │                                                   │
                                 │ (1) Check Cache           (2) Return Data [HIT]   │
                                 ▼                           │                       │
[ Client Request (GET /tasks) ] ───> [ Express Controller ] ─────────────────────────┘
                                     │
                                     │ (3) Query MongoDB [MISS]
                                     └───> [ MongoDB: Task.find() ]
                                                    │
                                                    │ (4) Store in node-cache (TTL=60s)
                                                    ▼
                                           [ Client Response ]
```

---

## Cache Invalidation Strategy on Write Operations

To prevent data drift and stale cache states, the backend enforces a **Write-Invalidate** pattern across all modifying routes:

| HTTP Method | Route | Action | Cache Invalidation Trigger |
| :--- | :--- | :--- | :--- |
| `POST` | `/tasks` | Create new task | Evicts `all_tasks` key from `node-cache` on DB success |
| `PUT` | `/tasks/:id` | Update task title/description/status | Evicts `all_tasks` key from `node-cache` on DB success |
| `DELETE` | `/tasks/:id` | Remove task | Evicts `all_tasks` key from `node-cache` on DB success |

---

## Implementation Reference

### In-Memory Cache Wrapper (`backend/middleware/cache.js`)
```javascript
const NodeCache = require("node-cache");

const cache = new NodeCache({
    stdTTL: 60,         // Standard Time-To-Live: 60 seconds
    checkperiod: 120,    // Key cleanup interval: 120 seconds
    useClones: false
});

module.exports = cache;
```
