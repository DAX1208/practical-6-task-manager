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

### 1. Response Time Comparison (Cached vs. Uncached Benchmark)

| Metric / Scenario | Uncached (MongoDB Direct Query) | Cached (`node-cache` Hit) | Improvement / Speedup |
| :--- | :---: | :---: | :---: |
| ⚡ **Average Latency (`GET /tasks`)** | **85.83 ms** | **4.31 ms** | 🟢 **~20x Faster (95% Latency Drop)** |
| 🗄️ **Database I/O Overhead** | High (Disk & TCP per query) | **0 queries** (Served from RAM) | 🟢 **100% DB Read Offloaded** |
| 🔄 **Cache Invalidation** | N/A | Instant on POST / PUT / DELETE | 🟢 **Zero Stale State** |

---

### 2. Workflow Without Caching (Before Optimization)

```text
[ Client Request ] ───> [ Express Server ] ───> [ Core Database (MongoDB) ]
```

* **Data Flow**: Every incoming `GET /tasks` request hit Express, which constructed and executed a query directly against MongoDB (`Task.find()`).
* **Overhead**: Every read triggered disk and database network I/O. Under frequent refreshes or traffic spikes, database connections became a resource bottleneck.

---

### 3. Workflow With Caching (After Optimization)

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
* **Cache Hit**: Express checks `node-cache` for key `all_tasks`. If found, it immediately serves the cached JSON array with `200 OK` in ~4ms, completely bypassing MongoDB.
* **Cache Miss**: If `all_tasks` is not cached or expired, Express queries MongoDB, saves the result into `node-cache` with a 60-second TTL, and delivers the response to the client.

#### Write/Update Path & Cache Invalidation (`POST`, `PUT`, `DELETE`)
* **Write-Invalidate Strategy**: Whenever a task is created, updated, or deleted, the modification is committed to MongoDB first. Upon database success, the server explicitly evicts `all_tasks` from `node-cache` (`cache.del('all_tasks')`).
* **Consistency Guarantee**: The subsequent `GET /tasks` request automatically triggers a Cache Miss, pulling the latest committed database records and populating a fresh cache entry.

---

### 4. Summary of Changes & File Locations

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

