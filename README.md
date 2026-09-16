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

### 5. Backend Optimization & Non-Blocking API
- Synchronous vs asynchronous error handling configured in Express middleware.
- Made authentication verification non-blocking for guest task operations, eliminating 401 delays.

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

