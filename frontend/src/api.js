const BASE_URL = "http://localhost:5000";


// ===============================
// GET Tasks
// ===============================

export const getTasks = async () => {
    const response = await fetch(`${BASE_URL}/tasks`);

    if (!response.ok) {
        throw new Error("Failed to fetch tasks");
    }

    return response.json();
};


// ===============================
// CREATE Task
// ===============================

export const createTask = async (task) => {
    const response = await fetch(`${BASE_URL}/tasks`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(task)
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(
            error.message || "Failed to create task"
        );
    }

    return response.json();
};


// ===============================
// UPDATE Task
// ===============================

export const updateTask = async (id, task) => {
    const response = await fetch(
        `${BASE_URL}/tasks/${id}`,
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(task)
        }
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(
            error.message || "Failed to update task"
        );
    }

    return response.json();
};


// ===============================
// DELETE Task
// ===============================

export const deleteTask = async (id) => {
    const response = await fetch(
        `${BASE_URL}/tasks/${id}`,
        {
            method: "DELETE"
        }
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(
            error.message || "Failed to delete task"
        );
    }

    return response.json();
};


// ===============================
// EDA: Asynchronous Bulk Tasks (202 Accepted)
// ===============================

export const createBulkTasksAsync = async (tasks) => {
    const response = await fetch(`${BASE_URL}/tasks/bulk-async`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ tasks })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to submit batch job");
    }

    return response.json();
};


// ===============================
// EDA: Get Background Job Status
// ===============================

export const getJobStatus = async (jobId) => {
    const response = await fetch(`${BASE_URL}/tasks/jobs/${jobId}`);

    if (!response.ok) {
        throw new Error("Failed to fetch background job status");
    }

    return response.json();
};


// ===============================
// EDA: Get Audit Logs
// ===============================

export const getAuditLogs = async () => {
    const response = await fetch(`${BASE_URL}/audit-logs`);

    if (!response.ok) {
        throw new Error("Failed to fetch audit logs");
    }

    return response.json();
};


// ===============================
// EDA: Get Architecture Metrics
// ===============================

export const getEdaMetrics = async () => {
    const response = await fetch(`${BASE_URL}/eda/metrics`);

    if (!response.ok) {
        throw new Error("Failed to fetch EDA metrics");
    }

    return response.json();
};


// ===============================
// EDA: Server-Sent Events (SSE) Stream
// ===============================

export const subscribeToEventStream = (onEvent, onError) => {
    if (typeof EventSource === "undefined") {
        console.warn("EventSource is not supported by this browser.");
        return () => {};
    }

    const eventSource = new EventSource(`${BASE_URL}/api/events/stream`);

    eventSource.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            if (onEvent) onEvent(data);
        } catch (err) {
            console.error("SSE parse error:", err);
        }
    };

    eventSource.onerror = (err) => {
        if (onError) onError(err);
    };

    return () => {
        eventSource.close();
    };
};