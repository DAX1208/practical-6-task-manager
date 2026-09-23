# Practical 6 — Full Stack Task Manager

## Practical Statement

Develop a full-stack Task Manager application using React for the frontend, Node.js with Express for the backend, and MongoDB with Mongoose for data persistence. Implement RESTful APIs to perform CRUD operations (Create, Read, Update, Delete) on tasks. Integrate the React frontend with the Express backend using Fetch API, enable CORS, handle loading and error states, synchronize UI state after CRUD operations, and ensure that task data persists in MongoDB after page refresh.

---

## Project Description

This practical demonstrates full-stack integration and performance optimization using:

- **React** for the frontend with code-splitting and asynchronous lazy loading
- **Node.js and Express** for the backend REST API
- **MongoDB** for persistent document database storage
- **Mongoose** for schema definition and database interaction
- **Fetch API** for asynchronous HTTP communication
- **CORS** for cross-origin resource sharing
- **Vite & Rollup** for modular bundle splitting and assets optimization

---

## Lighthouse Audit Comparison (Before vs. After)

| Metric | Before Optimization | After Optimization | Improvement |
| :--- | :---: | :---: | :---: |
| ⚡ **Performance** | 49 (Red) | **99** (Green) | 🟢 **+50 points** |
| ♿ **Accessibility** | 88 (Orange) | **96** (Green) | 🟢 **+8 points** |
| 🛡️ **Best Practices** | 96 (Green) | **100** (Perfect) | 🟢 **+4 points** |
| 🔍 **SEO** | 82 (Orange) | **91** (Green) | 🟢 **+9 points** |
| ⏱️ **First Contentful Paint (FCP)** | *Very poor* (~10.4s) | **1.6 s** (Green) | 🟢 **-8.8s speedup** |
| ⏱️ **Largest Contentful Paint (LCP)** | *Very poor* (~18.8s) | **1.6 s** (Green) | 🟢 **-17.2s speedup** |

### 📸 Before Optimization
![Lighthouse Audit — Before Optimization](./Screenshot%202026-09-16%20125413.png)

### 📸 After Optimization (99 Performance)
![Lighthouse Audit — After Optimization](./Screenshot%202026-09-16%20131532.png)

---

## Performance Optimizations & Lighthouse Score Improvements

To achieve optimal Lighthouse audit scores across **Performance**, **Accessibility**, **Best Practices**, and **SEO**, the following strategies were implemented:

### 1. Code Splitting & Dynamic Imports
- **Asynchronous Component Loading**: Leveraged `React.lazy()` and dynamic `import()` to load non-critical components on demand (`TaskForm`, `TaskList`, `Footer`).
- **Instant FCP (First Contentful Paint)**: Main layout and headers are pre-loaded immediately to ensure fast initial render times.
- **Suspense Fallbacks**: Integrated `<Suspense>` with animated shimmer skeletons (`LoadingSkeleton`) to eliminate **Cumulative Layout Shift (CLS)** during async chunk fetching.

### 2. Vite & Rollup Manual Chunk Splitting
- Split vendor dependencies (`react`, `react-dom`) into a separate `vendor-react` cacheable bundle.
- Isolated individual component chunks (`TaskForm`, `TaskList`, `Footer`) to minimize initial JavaScript payload transferred over the network:
  - `dist/assets/vendor-react-*.js` (React runtime)
  - `dist/assets/TaskForm-*.js` (Task Form chunk)
  - `dist/assets/TaskList-*.js` (Task List chunk)
  - `dist/assets/Footer-*.js` (Footer chunk)
  - `dist/assets/index-*.css` (Optimized stylesheet)

### 3. Accessibility (a11y) & WCAG Compliance
- Form inputs mapped with unique `id` and `<label htmlFor="...">` attributes for assistive technologies.
- Added descriptive `aria-label`, `aria-live="polite"` for dynamic toast alerts, and `role="region"`, `role="feed"`, and `role="status"` landmarks.
- Enhanced contrast ratios on buttons, badges, and text to satisfy WCAG AA/AAA standards.

### 4. SEO & Document Metadata
- Configured descriptive page title and `<meta name="description">` tags in `index.html`.
- Added Open Graph (`og:title`, `og:description`, `og:image`) tags and `<meta name="theme-color">` for mobile web app standards.

### 5. Backend Optimization & In-Memory Caching
- **Cache-Aside Architecture**: Integrated an in-memory cache layer for `GET /tasks` with automatic Time-To-Live (TTL = 60s) to serve subsequent reads with sub-millisecond response latency.
- **Write-Invalidation Strategy**: Automatically purges cached tasks upon `POST`, `PUT`, and `DELETE` requests to ensure strict data consistency between memory cache and MongoDB.
- **Non-Blocking API & Async Error Handling**: Synchronous vs asynchronous error handling configured in Express middleware. Non-blocking authorization check for guest operations eliminates unnecessary 401 delays.

---

## Caching & Performance Optimization

We have optimized backend data retrieval by introducing an **in-memory caching layer** powered by **`node-cache`** using a **Cache-Aside (Lazy Loading)** architecture with **Write-Invalidation**. This significantly reduces direct MongoDB queries and elevates API throughput.

### 1. Response Time Comparison (Empirical Benchmark)

#### Sequential Request Execution Table
| Request # | HTTP Method & Route | Request State | Data Source / Processing | Response Time (Latency) | Status / Observation |
| :---: | :--- | :--- | :--- | :---: | :--- |
| **1st Request** | `GET /tasks` | **Uncached (Cache Miss)** | MongoDB (`Task.find()`) + Cache Write | **31 ms** | Initial database fetch & cache population (Baseline) |
| **2nd Request** | `GET /tasks` | **Cached (Cache Hit)** | `node-cache` (In-Memory RAM) | **10 ms** | 🟢 **67.7% Faster (3.1x Speedup)** |
| **3rd Request** | `GET /tasks` | **Cached (Cache Hit)** | `node-cache` (In-Memory RAM) | **8 ms** | 🟢 **74.2% Faster (3.9x Speedup)** |
| **4th Request** | `GET /tasks` | **Cached (Cache Hit)** | `node-cache` (In-Memory RAM) | **9 ms** | 🟢 **71.0% Faster (3.4x Speedup)** |
| **5th Request** | `POST /tasks` | **Write + Invalidation** | MongoDB Insert + Cache Purge | **11 ms** | Data saved to DB & cache cleared |
| **6th Request** | `PUT /tasks/:id` | **Update + Invalidation** | MongoDB Update + Cache Purge | **10 ms** | Status toggled & cache cleared |
| **7th Request** | `DELETE /tasks/:id` | **Delete + Invalidation** | MongoDB Remove + Cache Purge | **9 ms** | Task deleted & cache cleared |

#### Summary Benchmark
| Metric / Scenario | Uncached Read (1st `GET`) | Cached Reads (Subsequent `GET`) | CRUD Mutations (`POST` / `PUT` / `DELETE`) |
| :--- | :---: | :---: | :---: |
| ⚡ **Average Latency** | **31 ms** | **9.0 ms** (Range: `8 - 10 ms`) | **10.0 ms** (Range: `9 - 11 ms`) |
| 🗄️ **Database I/O Overhead** | 100% Direct Query on MongoDB | **0 queries** (Served from RAM) | Direct Write to MongoDB |
| 🚀 **Performance Gain** | Baseline (1x) | 🟢 **~3.4x Faster (~70% Latency Drop)** | Non-blocking write & instant cache purge |
| 🔄 **Cache Invalidation** | Miss $\rightarrow$ Saved to Cache (TTL=60s) | Cache Hit $\rightarrow$ Sub-millisecond read | Instant eviction on mutation (`cache.del`) |

---

### 2. REST API CRUD Request Comparison Table

| HTTP Method | API Endpoint | CRUD Operation | Request Payload / Params | Mongoose / DB Operation | In-Memory Cache Action | Success Status | Error Statuses | Idempotent |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: | :---: | :---: |
| **`GET`** | `/tasks` | **Read** (Retrieve all tasks) | *None* | `Task.find().sort({ createdAt: -1 })` *(Only on Cache Miss)* | **Cache Read** (Hits `all_tasks` key) / Populates cache on Miss (TTL: 60s) | `200 OK` | `401`, `500` | **Yes** |
| **`POST`** | `/tasks` | **Create** (Add new task) | **JSON Body:**<br>`{ "title": "...", "description": "..." }` | `new Task(...).save()` | **Write-Invalidation** (`cache.del('all_tasks')`) | `201 Created` | `400`, `401`, `500` | **No** |
| **`PUT`** | `/tasks/:id` | **Update** (Modify task / toggle status) | **URL Param:** `id`<br>**JSON Body:**<br>`{ "title": "...", "description": "...", "completed": true/false }` | `Task.findByIdAndUpdate(id, data, { new: true, runValidators: true })` | **Write-Invalidation** (`cache.del('all_tasks')`) | `200 OK` | `400`, `401`, `404`, `500` | **Yes** |
| **`DELETE`** | `/tasks/:id` | **Delete** (Remove task) | **URL Param:** `id` | `Task.findByIdAndDelete(id)` | **Write-Invalidation** (`cache.del('all_tasks')`) | `200 OK` | `401`, `404`, `500` | **Yes** |

---

### 3. Workflow Without Caching (Before Optimization)

```text
[ Client Request ] ───> [ Express Server ] ───> [ Core Database (MongoDB) ]
```

* **Data Flow**: Every incoming `GET /tasks` request hit Express, which constructed and executed a query directly against MongoDB (`Task.find()`).
* **Overhead**: Every read triggered disk and database network I/O. Under frequent refreshes or traffic spikes, database connections became a resource bottleneck.

---

### 4. Workflow With Caching (After Optimization)

```text
┌──────────────────────── [ node-cache Memory (Key: 'all_tasks') ] ──────────────────────┐
│                                                                                       │
│ (1) Check Cache                                 (2) Return Cached Tasks [Cache Hit]   │
▼                                                 │                                     │
[ Client Request ] ───> [ Express Server (GET /tasks) ] <───────────────────────────────┘
                                │
                                │ (3) Query DB [Cache Miss]
                                └───> [ MongoDB: Task.find() ]
                                               │
                                               │ (4) Populate node-cache & Return Response
                                               ▼
                                      [ Client Response ]
```

#### Read Path Logic (`GET /tasks`)
* **Cache Hit**: Express checks `node-cache` for key `all_tasks`. If found, it immediately serves the cached JSON array with `200 OK` in ~8-10ms, completely bypassing MongoDB.
* **Cache Miss**: If `all_tasks` is not cached or expired, Express queries MongoDB, saves the result into `node-cache` with a 60-second TTL, and delivers the response to the client.

#### Write/Update Path & Cache Invalidation (`POST`, `PUT`, `DELETE`)
* **Write-Invalidate Strategy**: Whenever a task is created, updated, or deleted, the modification is committed to MongoDB first. Upon database success, the server explicitly evicts `all_tasks` from `node-cache` (`cache.del('all_tasks')`).
* **Consistency Guarantee**: The subsequent `GET /tasks` request automatically triggers a Cache Miss, pulling the latest committed database records and populating a fresh cache entry.

---

### 5. Summary of Changes & File Locations

| What Was Changed | Where It Was Changed |
| :--- | :--- |
| **In-Memory Cache Provider** (`node-cache` wrapper with TTL & Invalidation) | `backend/middleware/cache.js` |
| **GET /tasks Route Optimization** (Cache-Aside Read Path) | `backend/server.js` |
| **Mutation Invalidation** (POST, PUT, DELETE Cache Eviction) | `backend/server.js` |
| **Benchmark Documentation** (Empirical Latency Data) | `docs/caching-benchmark.md` |

---

## Technologies Used

### Frontend
- React (React.lazy, Suspense, useCallback, useMemo)
- JavaScript (ESNext, Dynamic Imports)
- HTML5 (Semantic elements & ARIA landmarks)
- Vanilla CSS (Glassmorphism, Shimmer Animations, Responsive Grid/Flexbox)
- Fetch API
- Vite & Rolldown/Rollup

### Backend
- Node.js
- Express.js
- node-cache (In-Memory Cache-Aside & Invalidation Layer)
- Mongoose
- CORS
- dotenv & bcryptjs

### Database
- MongoDB Community Server

---

## Project Structure

```text
P-6
│
├── frontend
│   ├── src
│   │   ├── components
│   │   │   ├── Footer.jsx
│   │   │   ├── Header.jsx
│   │   │   ├── LoadingSkeleton.jsx
│   │   │   ├── TaskForm.jsx
│   │   │   ├── TaskItem.jsx
│   │   │   ├── TaskList.jsx
│   │   │   └── Toast.jsx
│   │   ├── App.jsx
│   │   ├── api.js
│   │   ├── index.css
│   │   └── main.jsx
│   │
│   ├── public
│   │   └── favicon.svg
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── package-lock.json
│
├── backend
│   ├── middleware
│   │   ├── auth.js
│   │   ├── cache.js
│   │   └── validateTask.js
│   ├── models
│   │   ├── Task.js
│   │   └── User.js
│   ├── server.js
│   ├── package.json
│   └── package-lock.json
│
├── .gitignore
└── README.md
```

---
1. CODE SPLITTING
   ↓
   Break big JS into smaller pieces
   ↓
   Faster initial loading


2. CHUNK SPLITTING
   ↓
   Separate libraries/components into files
   ↓
   Better loading + caching


3. ACCESSIBILITY
   ↓
   Make website understandable to everyone
   ↓
   Labels + ARIA + contrast


4. SEO
   ↓
   Help search engines understand the website
   ↓
   Title + description + metadata


5. BACKEND OPTIMIZATION
   ↓
   Don't unnecessarily block requests
   ↓
   Better API responsiveness
## How to Run Locally

1. **Start MongoDB**:
   Ensure MongoDB service is running locally on port `27017`.

2. **Start Backend Server**:
   ```bash
   cd backend
   npm install
   node server.js
   ```
   Runs at: `http://127.0.0.1:5000`

3. **Start Frontend Client**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Runs at: `http://localhost:5173`

4. **Production Build & Chunk Inspection**:
   ```bash
   cd frontend
   npm run build
   ```

