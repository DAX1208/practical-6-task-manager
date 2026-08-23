# Practical 6 — Full Stack Task Manager

## Practical Statement

Develop a full-stack Task Manager application using React for the frontend, Node.js with Express for the backend, and MongoDB with Mongoose for data persistence. Implement RESTful APIs to perform CRUD operations (Create, Read, Update, Delete) on tasks. Integrate the React frontend with the Express backend using Fetch API, enable CORS, handle loading and error states, synchronize UI state after CRUD operations, and ensure that task data persists in MongoDB after page refresh.

---

## Project Description

This practical demonstrates full-stack integration using:

- React for the frontend
- Node.js and Express for the backend
- MongoDB for database storage
- Mongoose for MongoDB interaction
- Fetch API for frontend-backend communication
- CORS for cross-origin communication

The application allows users to create, view, update, and delete tasks.

---

## Technologies Used

### Frontend

- React
- JavaScript
- HTML
- CSS
- Fetch API
- Vite

### Backend

- Node.js
- Express.js
- Mongoose
- CORS

### Database

- MongoDB

### Development Tool

- Visual Studio Code

---

## Project Structure

```text
P-6
│
├── frontend
│   ├── src
│   │   ├── App.jsx
│   │   ├── api.js
│   │   ├── index.css
│   │   └── main.jsx
│   │
│   ├── package.json
│   └── package-lock.json
│
├── backend
│   ├── models
│   │   └── Task.js
│   │
│   ├── server.js
│   ├── package.json
│   └── package-lock.json
│
├── .gitignore
└── README.md