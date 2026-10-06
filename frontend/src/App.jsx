import React, { useEffect, useState, useCallback } from "react";
import { getTasks, createTask, updateTask, deleteTask, subscribeToEventStream } from "./api";
import Header from "./components/Header";
import TaskForm from "./components/TaskForm";
import TaskList from "./components/TaskList";
import Toast from "./components/Toast";
import Footer from "./components/Footer";
import EdaDashboard from "./components/EdaDashboard";
import "./index.css";

function App() {
    // State
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    // EDA Event Streaming State
    const [sseConnected, setSseConnected] = useState(false);
    const [lastEvent, setLastEvent] = useState(null);

    // Load tasks on mount
    const loadTasks = useCallback(async () => {
        try {
            setLoading(true);
            setError("");
            const data = await getTasks();
            setTasks(data || []);
        } catch (err) {
            setError(err.message || "Failed to load tasks");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        let isMounted = true;

        async function fetchInitialTasks() {
            try {
                setLoading(true);
                const data = await getTasks();
                if (isMounted) {
                    setTasks(data || []);
                }
            } catch (err) {
                if (isMounted) {
                    setError(err.message || "Failed to load tasks");
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        }

        fetchInitialTasks();

        return () => {
            isMounted = false;
        };
    }, []);

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
                            if (prev.some((t) => t._id === newTask._id)) {
                                return prev;
                            }
                            return [newTask, ...prev];
                        });
                    }
                } else if (event.type === "TASK_UPDATED") {
                    const updated = event.payload;
                    if (updated && updated._id) {
                        setTasks((prev) =>
                            prev.map((t) => (t._id === updated._id ? { ...t, ...updated } : t))
                        );
                    }
                } else if (event.type === "TASK_DELETED") {
                    const deletedId = event.payload?._id;
                    if (deletedId) {
                        setTasks((prev) => prev.filter((t) => t._id !== deletedId));
                    }
                } else if (event.type === "BATCH_TASK_COMPLETED") {
                    loadTasks();
                    setMessage(
                        `⚡ Background Batch Job Complete: ${event.payload?.processedItems || 0} tasks synchronized.`
                    );
                }
            },
            (err) => {
                setSseConnected(false);
            }
        );

        return () => {
            unsubscribe();
        };
    }, [loadTasks]);

    // Toast helper
    const showMessage = useCallback((text) => {
        setMessage(text);
        setTimeout(() => {
            setMessage("");
        }, 3000);
    }, []);

    const handleError = useCallback((errText) => {
        setError(errText);
        setTimeout(() => {
            setError("");
        }, 4000);
    }, []);

    // CREATE
    const handleCreate = useCallback(async (newTaskData) => {
        const newTask = await createTask(newTaskData);
        setTasks((prev) => {
            if (prev.some((t) => t._id === newTask._id)) return prev;
            return [newTask, ...prev];
        });
        showMessage("Task created successfully (Event dispatched asynchronously)");
        return newTask;
    }, [showMessage]);

    // UPDATE
    const handleUpdate = useCallback(async (task) => {
        try {
            setError("");
            setLoading(true);

            const updated = await updateTask(task._id, {
                title: task.title,
                description: task.description,
                completed: !task.completed
            });

            setTasks((prev) =>
                prev.map((item) => (item._id === updated._id ? updated : item))
            );

            showMessage("Task updated successfully (Event dispatched)");
        } catch (err) {
            handleError(err.message || "Failed to update task");
        } finally {
            setLoading(false);
        }
    }, [showMessage, handleError]);

    // DELETE
    const handleDelete = useCallback(async (id) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this task?"
        );

        if (!confirmed) return;

        try {
            setError("");
            setLoading(true);

            await deleteTask(id);

            setTasks((prev) => prev.filter((task) => task._id !== id));
            showMessage("Task deleted successfully (Eviction event dispatched)");
        } catch (err) {
            handleError(err.message || "Failed to delete task");
        } finally {
            setLoading(false);
        }
    }, [showMessage, handleError]);

    return (
        <div className="container">
            {/* Header */}
            <Header />

            {/* Notification Toasts */}
            <Toast message={message} error={error} />

            {/* Event-Driven Architecture Interactive Telemetry & Controls */}
            <EdaDashboard
                sseConnected={sseConnected}
                lastEvent={lastEvent}
                onBatchTriggered={() => {
                    showMessage("Batch submitted: Background queue active.");
                }}
            />

            {/* Main Application Area */}
            <main role="main">
                <TaskForm
                    onTaskCreated={handleCreate}
                    loading={loading}
                    onError={handleError}
                />

                <TaskList
                    tasks={tasks}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                    onRefresh={loadTasks}
                    loading={loading}
                />
            </main>

            {/* Footer */}
            <Footer />
        </div>
    );
}

export default App;