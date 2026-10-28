import React, { useState } from "react";
import { generateAiDescription } from "../api";

function TaskForm({ onTaskCreated, loading, onError }) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiFeedback, setAiFeedback] = useState(null);

    const handleGenerateDescription = async () => {
        const cleanTitle = title.trim();
        if (!cleanTitle) {
            setAiFeedback({
                type: "warning",
                text: "Please enter a task title first before generating a description."
            });
            return;
        }

        try {
            setAiLoading(true);
            setAiFeedback(null);

            const res = await generateAiDescription(cleanTitle);

            if (res && res.description) {
                // Populate description field with editable AI suggestion
                setDescription(res.description);

                if (res.fallback) {
                    setAiFeedback({
                        type: "info",
                        text: `💡 Generated suggestion: ${res.reason || "Review and edit before saving."}`
                    });
                } else {
                    setAiFeedback({
                        type: "success",
                        text: "✨ AI description generated! You can review and edit it before adding the task."
                    });
                }
            } else if (res && res.reason) {
                setAiFeedback({
                    type: "info",
                    text: res.reason
                });
            }
        } catch (err) {
            console.error("AI Generation error:", err.message);
            const isNetworkError = err.message && (
                err.message.includes("Failed to fetch") ||
                err.message.includes("NetworkError") ||
                err.message.includes("Load failed")
            );

            setAiFeedback({
                type: "warning",
                text: isNetworkError
                    ? "⚠️ Cannot reach backend server at http://localhost:5000. Please start the backend (`npm run dev` in backend folder). You can still enter a description manually."
                    : (err.message || "AI service is currently unavailable. You can enter a description manually.")
            });
        } finally {
            setAiLoading(false);
        }
    };

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
            setAiFeedback(null);
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
                        placeholder="Enter task title (e.g. Prepare database practical)"
                        value={title}
                        onChange={(e) => {
                            setTitle(e.target.value);
                            if (aiFeedback?.type === "warning") setAiFeedback(null);
                        }}
                        disabled={isBusy || aiLoading}
                        required
                        aria-required="true"
                    />
                </div>

                <div className="form-group">
                    <div className="ai-desc-header">
                        <label htmlFor="task-desc-input">Description</label>
                        <button
                            type="button"
                            className="ai-generate-btn"
                            onClick={handleGenerateDescription}
                            disabled={isBusy || aiLoading || !title.trim()}
                            title="Generate an AI-powered description from the title"
                            aria-label="Generate task description using AI"
                        >
                            {aiLoading ? "✨ Generating..." : "✨ Generate Description"}
                        </button>
                    </div>

                    <p className="ai-disclaimer">
                        <em>AI-generated suggestions may be inaccurate. Review and edit before saving.</em>
                    </p>

                    {aiFeedback && (
                        <div
                            className={`ai-feedback-banner ${aiFeedback.type}`}
                            role="status"
                            aria-live="polite"
                        >
                            {aiFeedback.type === "success" ? "✅ " : "ℹ️ "}
                            {aiFeedback.text}
                        </div>
                    )}

                    <textarea
                        id="task-desc-input"
                        name="description"
                        placeholder="Enter task description or click 'Generate Description'..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        disabled={isBusy}
                        required
                        aria-required="true"
                        rows={3}
                    />
                </div>

                <button
                    className="primary-button"
                    type="submit"
                    disabled={isBusy || aiLoading}
                    aria-label="Add new task"
                >
                    {isBusy ? "Processing..." : "Add Task"}
                </button>
            </form>
        </section>
    );
}

export default React.memo(TaskForm);
