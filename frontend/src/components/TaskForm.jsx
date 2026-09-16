import React, { useState } from "react";

function TaskForm({ onTaskCreated, loading, onError }) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        
        if (!title.trim()) {
            onError("Please enter a task title");
            return;
        }

        if (!description.trim()) {
            onError("Please enter a task description");
            return;
        }

        try {
            setSubmitting(true);
            await onTaskCreated({
                title: title.trim(),
                description: description.trim()
            });
            setTitle("");
            setDescription("");
        } catch (err) {
            onError(err.message || "Failed to create task");
        } finally {
            setSubmitting(false);
        }
    };

    const isBusy = loading || submitting;

    return (
        <section className="card" aria-labelledby="form-heading">
            <h2 id="form-heading">Create New Task</h2>
            <form onSubmit={handleSubmit} noValidate>
                <div className="form-group">
                    <label htmlFor="task-title-input">Task Title</label>
                    <input
                        id="task-title-input"
                        name="title"
                        type="text"
                        placeholder="Enter task title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        disabled={isBusy}
                        required
                        aria-required="true"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="task-desc-input">Description</label>
                    <textarea
                        id="task-desc-input"
                        name="description"
                        placeholder="Enter task description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        disabled={isBusy}
                        required
                        aria-required="true"
                    />
                </div>

                <button
                    className="primary-button"
                    type="submit"
                    disabled={isBusy}
                    aria-label="Add new task"
                >
                    {isBusy ? "Processing..." : "Add Task"}
                </button>
            </form>
        </section>
    );
}

export default React.memo(TaskForm);
