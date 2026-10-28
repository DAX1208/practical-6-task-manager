import React, { useEffect, useState, useCallback, Suspense, lazy } from "react";
import {
    getTasks,
    createTask,
    updateTask,
    deleteTask,
    getTaskStats,
    getAuthProfile,
    getStoredUser,
    clearToken,
    subscribeToEventStream
} from "./api";

import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import DashboardStats from "./components/DashboardStats";
import TaskList from "./components/TaskList";
import Toast from "./components/Toast";
import LoadingSkeleton from "./components/LoadingSkeleton";
import Footer from "./components/Footer";
import "./index.css";

// Lazy-Loaded Components for Performance Optimization & Code Splitting
const EdaDashboard = lazy(() => import("./components/EdaDashboard"));
const TaskModal = lazy(() => import("./components/TaskModal"));
const AuthModal = lazy(() => import("./components/AuthModal"));
const ConfirmModal = lazy(() => import("./components/ConfirmModal"));
const AiAssistantModal = lazy(() => import("./components/AiAssistantModal"));

function App() {
    // Navigation & View State
    const [activeTab, setActiveTab] = useState("dashboard");
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Theme State
    const [theme, setTheme] = useState(() => localStorage.getItem("awdf_theme") || "light");

    // Authentication State
    const [user, setUser] = useState(() => getStoredUser());
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    // Tasks & Statistics State
    const [tasks, setTasks] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [statsLoading, setStatsLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    // Modal States
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [taskToEdit, setTaskToEdit] = useState(null);

    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState(null);

    const [isAiModalOpen, setIsAiModalOpen] = useState(false);

    // EDA Event Streaming State
    const [sseConnected, setSseConnected] = useState(false);
    const [lastEvent, setLastEvent] = useState(null);

    // Synchronize HTML theme attribute
    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("awdf_theme", theme);
    }, [theme]);

    const toggleTheme = useCallback(() => {
        setTheme((prev) => (prev === "dark" ? "light" : "dark"));
    }, []);

    // Toast helpers
    const showMessage = useCallback((text) => {
        setMessage(text);
        setTimeout(() => setMessage(""), 3500);
    }, []);

    const handleError = useCallback((errText) => {
        setError(errText);
        setTimeout(() => setError(""), 4500);
    }, []);

    // Verify authentication profile on mount
    useEffect(() => {
        let isMounted = true;
        async function checkSession() {
            try {
                const profile = await getAuthProfile();
                if (isMounted && profile) {
                    setUser(profile);
                }
            } catch {
                // Keep guest state if unauthenticated
            }
        }
        checkSession();
        return () => { isMounted = false; };
    }, []);

    // Load statistics (In-memory cached with TTL)
    const loadStats = useCallback(async () => {
        try {
            setStatsLoading(true);
            const data = await getTaskStats();
            setStats(data);
        } catch (err) {
            console.warn("Could not load stats:", err.message);
        } finally {
            setStatsLoading(false);
        }
    }, []);

    // Load tasks
    const loadTasks = useCallback(async () => {
        try {
            setLoading(true);
            setError("");
            const data = await getTasks();
            setTasks(data || []);
            loadStats();
        } catch (err) {
            // If 401 unauthenticated, prompt auth modal gently
            if (err.message && err.message.toLowerCase().includes("log in")) {
                setIsAuthModalOpen(true);
            }
            handleError(err.message || "Failed to load tasks");
        } finally {
            setLoading(false);
        }
    }, [loadStats, handleError]);

    // Initial load
    useEffect(() => {
        loadTasks();
    }, [loadTasks, user]);

    // Setup Server-Sent Events (SSE) connection for Real-Time EDA synchronization
    useEffect(() => {
        const unsubscribe = subscribeToEventStream(
            (event) => {
                setLastEvent(event);

                if (event.type === "CONNECTED") {
                    setSseConnected(true);
                    return;
                }

                // Handle domain events pushed from backend
                if (event.type === "TASK_CREATED") {
                    const newTask = event.payload;
                    if (newTask && newTask._id) {
                        setTasks((prev) => {
                            if (prev.some((t) => t._id === newTask._id)) return prev;
                            return [newTask, ...prev];
                        });
                        loadStats();
                    }
                } else if (event.type === "TASK_UPDATED" || event.type === "TASK_STATUS_CHANGED" || event.type === "TASK_COMPLETED") {
                    const updated = event.payload;
                    if (updated && updated._id) {
                        setTasks((prev) =>
                            prev.map((t) => (t._id === updated._id ? { ...t, ...updated } : t))
                        );
                        loadStats();
                    }
                } else if (event.type === "TASK_DELETED") {
                    const deletedId = event.payload?._id;
                    if (deletedId) {
                        setTasks((prev) => prev.filter((t) => t._id !== deletedId));
                        loadStats();
                    }
                } else if (event.type === "BATCH_TASK_COMPLETED") {
                    loadTasks();
                    showMessage(
                        `⚡ Background Batch Job Complete: ${event.payload?.processedItems || 0} tasks synchronized.`
                    );
                }
            },
            () => {
                setSseConnected(false);
            }
        );

        return () => {
            unsubscribe();
        };
    }, [loadTasks, loadStats, showMessage]);

    // Auth handlers
    const handleAuthSuccess = useCallback((authedUser) => {
        setUser(authedUser);
        showMessage(`Welcome, ${authedUser.name || authedUser.email}!`);
        loadTasks();
    }, [loadTasks, showMessage]);

    const handleLogout = useCallback(() => {
        clearToken();
        setUser(null);
        setTasks([]);
        setStats(null);
        showMessage("You have been signed out successfully.");
    }, [showMessage]);

    // CREATE / EDIT Task
    const handleSaveTask = useCallback(async (taskData, existingId) => {
        try {
            setLoading(true);
            if (existingId) {
                // Update
                const updated = await updateTask(existingId, taskData);
                setTasks((prev) =>
                    prev.map((t) => (t._id === updated._id ? updated : t))
                );
                showMessage("Task updated successfully (Event dispatched)");
            } else {
                // Create
                const created = await createTask(taskData);
                setTasks((prev) => [created, ...prev]);
                showMessage("Task created successfully (Event dispatched)");
            }
            loadStats();
        } catch (err) {
            handleError(err.message || "Failed to save task");
            throw err;
        } finally {
            setLoading(false);
        }
    }, [loadStats, showMessage, handleError]);

    // Quick Update (Status / Completion toggle)
    const handleUpdate = useCallback(async (task) => {
        try {
            setError("");
            setLoading(true);

            const updated = await updateTask(task._id, {
                title: task.title,
                description: task.description,
                priority: task.priority || "Medium",
                status: task.status,
                completed: task.completed,
                dueDate: task.dueDate,
                subtasks: task.subtasks
            });

            setTasks((prev) =>
                prev.map((item) => (item._id === updated._id ? updated : item))
            );

            loadStats();
            showMessage(`Task "${task.title.slice(0, 25)}" status updated (Event dispatched)`);
        } catch (err) {
            handleError(err.message || "Failed to update task");
        } finally {
            setLoading(false);
        }
    }, [loadStats, showMessage, handleError]);

    // Subtask toggle inside TaskItem
    const handleSubtaskToggle = useCallback(async (task, subtaskIndex) => {
        const newSubtasks = (task.subtasks || []).map((s, idx) =>
            idx === subtaskIndex ? { ...s, completed: !s.completed } : s
        );

        try {
            const updated = await updateTask(task._id, {
                title: task.title,
                description: task.description,
                status: task.status,
                priority: task.priority,
                dueDate: task.dueDate,
                completed: task.completed,
                subtasks: newSubtasks
            });

            setTasks((prev) =>
                prev.map((item) => (item._id === updated._id ? updated : item))
            );
        } catch (err) {
            handleError(err.message || "Failed to update subtask");
        }
    }, [handleError]);

    // Open Delete Confirm Modal
    const handleRequestDelete = useCallback((task) => {
        setTaskToDelete(task);
        setIsConfirmOpen(true);
    }, []);

    // Confirm Delete Action
    const handleConfirmDelete = useCallback(async () => {
        if (!taskToDelete) return;
        const id = taskToDelete._id;

        try {
            setError("");
            setLoading(true);
            await deleteTask(id);
            setTasks((prev) => prev.filter((task) => task._id !== id));
            loadStats();
            showMessage("Task deleted successfully (Eviction event dispatched)");
        } catch (err) {
            handleError(err.message || "Failed to delete task");
        } finally {
            setLoading(false);
            setIsConfirmOpen(false);
            setTaskToDelete(null);
        }
    }, [taskToDelete, loadStats, showMessage, handleError]);

    return (
        <div className="app-shell" data-theme={theme}>
            {/* Sidebar Navigation */}
            <Sidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                user={user}
                onOpenAuth={() => setIsAuthModalOpen(true)}
                onLogout={handleLogout}
                theme={theme}
                toggleTheme={toggleTheme}
                stats={stats}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            {/* Mobile backdrop for sidebar */}
            {isSidebarOpen && (
                <div
                    className="sidebar-backdrop"
                    onClick={() => setIsSidebarOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Main Application Container */}
            <div className="app-main-viewport">
                {/* Header Navbar */}
                <Header
                    onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                    sseConnected={sseConnected}
                    user={user}
                    onOpenAuth={() => setIsAuthModalOpen(true)}
                    onLogout={handleLogout}
                    theme={theme}
                    toggleTheme={toggleTheme}
                    onOpenCreateTask={() => {
                        setTaskToEdit(null);
                        setIsTaskModalOpen(true);
                    }}
                />

                {/* Toast Alerts */}
                <Toast message={message} error={error} />

                {/* Content View Switching */}
                <main className="app-content-body" role="main">
                    {/* View 1: Dashboard Overview */}
                    {activeTab === "dashboard" && (
                        <div className="tab-pane-view">
                            <DashboardStats
                                stats={stats}
                                loading={statsLoading}
                                onNewTask={() => {
                                    setTaskToEdit(null);
                                    setIsTaskModalOpen(true);
                                }}
                                onOpenAi={() => setIsAiModalOpen(true)}
                                onRefresh={loadStats}
                            />

                            <TaskList
                                tasks={tasks}
                                onUpdate={handleUpdate}
                                onEdit={(task) => {
                                    setTaskToEdit(task);
                                    setIsTaskModalOpen(true);
                                }}
                                onDelete={handleRequestDelete}
                                onSubtaskToggle={handleSubtaskToggle}
                                onRefresh={loadTasks}
                                onOpenCreateModal={() => {
                                    setTaskToEdit(null);
                                    setIsTaskModalOpen(true);
                                }}
                                loading={loading}
                            />
                        </div>
                    )}

                    {/* View 2: Tasks Board Focus */}
                    {activeTab === "tasks" && (
                        <div className="tab-pane-view">
                            <TaskList
                                tasks={tasks}
                                onUpdate={handleUpdate}
                                onEdit={(task) => {
                                    setTaskToEdit(task);
                                    setIsTaskModalOpen(true);
                                }}
                                onDelete={handleRequestDelete}
                                onSubtaskToggle={handleSubtaskToggle}
                                onRefresh={loadTasks}
                                onOpenCreateModal={() => {
                                    setTaskToEdit(null);
                                    setIsTaskModalOpen(true);
                                }}
                                loading={loading}
                            />
                        </div>
                    )}

                    {/* View 3: AI Assistant Focus */}
                    {activeTab === "ai" && (
                        <div className="tab-pane-view ai-tab-container">
                            <div className="card ai-feature-card">
                                <div className="card-header-with-badge">
                                    <span className="feature-icon">✨</span>
                                    <div>
                                        <h2>AI Task-Breakdown Assistant</h2>
                                        <p>Decompose assignments, lab tasks, and coursework into sequential checklists</p>
                                    </div>
                                    <span className="badge-pill-accent">Phase 7 Ready</span>
                                </div>
                                <button
                                    type="button"
                                    className="primary-button launch-ai-btn"
                                    onClick={() => setIsAiModalOpen(true)}
                                >
                                    🚀 Launch Interactive AI Assistant
                                </button>
                            </div>

                            <TaskList
                                tasks={tasks}
                                onUpdate={handleUpdate}
                                onEdit={(task) => {
                                    setTaskToEdit(task);
                                    setIsTaskModalOpen(true);
                                }}
                                onDelete={handleRequestDelete}
                                onSubtaskToggle={handleSubtaskToggle}
                                onRefresh={loadTasks}
                                onOpenCreateModal={() => {
                                    setTaskToEdit(null);
                                    setIsTaskModalOpen(true);
                                }}
                                loading={loading}
                            />
                        </div>
                    )}

                    {/* View 4: EDA & Telemetry */}
                    {activeTab === "eda" && (
                        <div className="tab-pane-view">
                            <Suspense fallback={<LoadingSkeleton count={2} label="Loading EDA Telemetry..." />}>
                                <EdaDashboard
                                    sseConnected={sseConnected}
                                    lastEvent={lastEvent}
                                    onBatchTriggered={() => {
                                        showMessage("Batch submitted: Background worker active.");
                                        loadTasks();
                                    }}
                                />
                            </Suspense>
                        </div>
                    )}
                </main>

                {/* Footer */}
                <Footer />
            </div>

            {/* Modals with React Suspense */}
            <Suspense fallback={null}>
                {isTaskModalOpen && (
                    <TaskModal
                        isOpen={isTaskModalOpen}
                        onClose={() => setIsTaskModalOpen(false)}
                        onSave={handleSaveTask}
                        taskToEdit={taskToEdit}
                        loading={loading}
                    />
                )}

                {isAuthModalOpen && (
                    <AuthModal
                        isOpen={isAuthModalOpen}
                        onClose={() => setIsAuthModalOpen(false)}
                        onAuthSuccess={handleAuthSuccess}
                    />
                )}

                {isConfirmOpen && (
                    <ConfirmModal
                        isOpen={isConfirmOpen}
                        title="Delete Task Confirmation"
                        message={`Are you sure you want to delete "${taskToDelete?.title || "this task"}"? This will permanently remove the record and evict cached statistics.`}
                        confirmText="Delete Permanently"
                        danger={true}
                        onConfirm={handleConfirmDelete}
                        onCancel={() => {
                            setIsConfirmOpen(false);
                            setTaskToDelete(null);
                        }}
                    />
                )}

                {isAiModalOpen && (
                    <AiAssistantModal
                        isOpen={isAiModalOpen}
                        onClose={() => setIsAiModalOpen(false)}
                        onTaskCreated={async (payload) => {
                            await handleSaveTask(payload, null);
                            showMessage("AI-generated task created successfully!");
                        }}
                    />
                )}
            </Suspense>
        </div>
    );
}

export default App;