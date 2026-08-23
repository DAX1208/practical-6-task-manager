import { useEffect, useState } from "react";

import {
    getTasks,
    createTask,
    updateTask,
    deleteTask
} from "./api";

import "./index.css";


function App() {

    // ===============================
    // State
    // ===============================

    const [tasks, setTasks] = useState([]);

    const [title, setTitle] = useState("");

    const [description, setDescription] = useState("");

    const [loading, setLoading] = useState(false);

    const [error, setError] = useState("");

    const [message, setMessage] = useState("");


    // ===============================
    // Load Tasks
    // ===============================

    useEffect(() => {

        loadTasks();

    }, []);


    const loadTasks = async () => {

        try {

            setLoading(true);

            setError("");

            const data = await getTasks();

            setTasks(data);

        } catch (error) {

            setError(
                error.message || "Failed to load tasks"
            );

        } finally {

            setLoading(false);

        }
    };


    // ===============================
    // Toast
    // ===============================

    const showMessage = (text) => {

        setMessage(text);

        setTimeout(() => {

            setMessage("");

        }, 3000);
    };


    // ===============================
    // CREATE
    // ===============================

    const handleCreate = async (event) => {

        event.preventDefault();

        setError("");


        if (!title.trim()) {

            setError("Please enter a task title");

            return;
        }


        if (!description.trim()) {

            setError("Please enter a task description");

            return;
        }


        try {

            setLoading(true);

            const newTask = await createTask({

                title: title.trim(),

                description: description.trim()

            });


            // Update UI using backend response

            setTasks((previousTasks) => [

                newTask,

                ...previousTasks

            ]);


            // Clear form

            setTitle("");

            setDescription("");


            // Toast

            showMessage(
                "Task created successfully"
            );

        } catch (error) {

            setError(
                error.message || "Failed to create task"
            );

        } finally {

            setLoading(false);

        }
    };


    // ===============================
    // UPDATE
    // ===============================

    const handleUpdate = async (task) => {

        try {

            setError("");

            setLoading(true);


            const updatedTask = await updateTask(

                task._id,

                {
                    title: task.title,

                    description: task.description,

                    completed: !task.completed
                }

            );


            // Replace updated task in state

            setTasks((previousTasks) =>

                previousTasks.map((item) =>

                    item._id === updatedTask._id

                        ? updatedTask

                        : item

                )

            );


            showMessage(
                "Task updated successfully"
            );

        } catch (error) {

            setError(
                error.message || "Failed to update task"
            );

        } finally {

            setLoading(false);

        }
    };


    // ===============================
    // DELETE
    // ===============================

    const handleDelete = async (id) => {

        const confirmed = window.confirm(

            "Are you sure you want to delete this task?"

        );


        if (!confirmed) {

            return;
        }


        try {

            setError("");

            setLoading(true);


            await deleteTask(id);


            // Remove task from UI

            setTasks((previousTasks) =>

                previousTasks.filter(

                    (task) => task._id !== id

                )

            );


            showMessage(
                "Task deleted successfully"
            );

        } catch (error) {

            setError(
                error.message || "Failed to delete task"
            );

        } finally {

            setLoading(false);

        }
    };


    // ===============================
    // UI
    // ===============================

    return (

        <div className="container">


            {/* Header */}

            <div className="header">

                <h1>Task Manager</h1>

                <p>
                    React + Node.js + MongoDB
                </p>

            </div>


            {/* Toast */}

            {message && (

                <div className="toast success">

                    {message}

                </div>

            )}


            {/* Error */}

            {error && (

                <div className="toast error">

                    {error}

                </div>

            )}


            {/* Create Form */}

            <div className="card">

                <h2>Create New Task</h2>


                <form onSubmit={handleCreate}>

                    <div className="form-group">

                        <label>
                            Task Title
                        </label>

                        <input
                            type="text"
                            placeholder="Enter task title"
                            value={title}
                            onChange={(event) =>
                                setTitle(event.target.value)
                            }
                        />

                    </div>


                    <div className="form-group">

                        <label>
                            Description
                        </label>

                        <textarea
                            placeholder="Enter task description"
                            value={description}
                            onChange={(event) =>
                                setDescription(event.target.value)
                            }
                        />

                    </div>


                    <button
                        className="primary-button"
                        type="submit"
                        disabled={loading}
                    >

                        {loading
                            ? "Processing..."
                            : "Add Task"
                        }

                    </button>

                </form>

            </div>


            {/* Task List */}

            <div className="card">

                <div className="task-header">

                    <h2>
                        Tasks
                    </h2>

                    <button
                        className="refresh-button"
                        onClick={loadTasks}
                        disabled={loading}
                    >
                        Refresh
                    </button>

                </div>


                {loading && tasks.length === 0 && (

                    <p className="loading">
                        Loading tasks...
                    </p>

                )}


                {!loading && tasks.length === 0 && (

                    <div className="empty">

                        <h3>
                            No tasks found
                        </h3>

                        <p>
                            Create your first task above.
                        </p>

                    </div>

                )}


                <div className="task-list">

                    {tasks.map((task) => (

                        <div
                            className="task"
                            key={task._id}
                        >

                            <div className="task-content">

                                <h3>
                                    {task.title}
                                </h3>

                                <p>
                                    {task.description}
                                </p>


                                <span
                                    className={
                                        task.completed
                                            ? "status completed"
                                            : "status pending"
                                    }
                                >

                                    {task.completed
                                        ? "Completed"
                                        : "Pending"
                                    }

                                </span>

                            </div>


                            <div className="task-actions">

                                <button
                                    className="update-button"
                                    onClick={() =>
                                        handleUpdate(task)
                                    }
                                    disabled={loading}
                                >

                                    {task.completed
                                        ? "Mark Pending"
                                        : "Complete"
                                    }

                                </button>


                                <button
                                    className="delete-button"
                                    onClick={() =>
                                        handleDelete(task._id)
                                    }
                                    disabled={loading}
                                >

                                    Delete

                                </button>

                            </div>

                        </div>

                    ))}

                </div>

            </div>


            {/* Footer */}

            <footer>

                Practical 6 — Full Stack Integration

            </footer>

        </div>

    );
}

export default App;