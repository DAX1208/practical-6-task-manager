import React, { useEffect, useState, useCallback } from "react";
import { getTasks, createTask, updateTask, deleteTask } from "./api";
import Header from "./components/Header";
import TaskForm from "./components/TaskForm";
import TaskList from "./components/TaskList";
import Toast from "./components/Toast";
import Footer from "./components/Footer";
import "./index.css";

function App() {
    // State
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

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
        setTasks((prev) => [newTask, ...prev]);
        showMessage("Task created successfully");
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

            showMessage("Task updated successfully");
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
            showMessage("Task deleted successfully");
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