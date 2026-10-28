const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// ===============================
// AUTH & TOKEN MANAGEMENT
// ===============================

export const getToken = () => localStorage.getItem("awdf_jwt_token");
export const setToken = (token) => localStorage.setItem("awdf_jwt_token", token);
export const clearToken = () => {
    localStorage.removeItem("awdf_jwt_token");
    localStorage.removeItem("awdf_user");
};

export const getStoredUser = () => {
    try {
        const u = localStorage.getItem("awdf_user");
        return u ? JSON.parse(u) : null;
    } catch {
        return null;
    }
};

export const setStoredUser = (user) => {
    localStorage.setItem("awdf_user", JSON.stringify(user));
};

const getHeaders = (includeAuth = true, additional = {}) => {
    const headers = {
        "Content-Type": "application/json",
        ...additional
    };
    if (includeAuth) {
        const token = getToken();
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }
    }
    return headers;
};

// ===============================
// AUTH API
// ===============================

export const registerUser = async (name, email, password) => {
    const response = await fetch(`${BASE_URL}/register`, {
        method: "POST",
        headers: getHeaders(false),
        body: JSON.stringify({ name, email, password })
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || "Registration failed");
    }

    if (data.token) {
        setToken(data.token);
    }
    if (data.user) {
        setStoredUser(data.user);
    }

    return data;
};

export const loginUser = async (email, password) => {
    const response = await fetch(`${BASE_URL}/login`, {
        method: "POST",
        headers: getHeaders(false),
        body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || "Login failed");
    }

    if (data.token) {
        setToken(data.token);
    }
    if (data.user) {
        setStoredUser(data.user);
    }

    return data;
};

export const getAuthProfile = async () => {
    const token = getToken();
    if (!token) return null;

    const response = await fetch(`${BASE_URL}/auth/me`, {
        headers: getHeaders(true)
    });

    if (!response.ok) {
        if (response.status === 401) {
            clearToken();
            return null;
        }
        throw new Error("Failed to load user profile");
    }

    const user = await response.json();
    setStoredUser(user);
    return user;
};

// ===============================
// DASHBOARD STATISTICS
// ===============================

export const getTaskStats = async () => {
    const response = await fetch(`${BASE_URL}/tasks/stats`, {
        headers: getHeaders(true)
    });

    if (!response.ok) {
        throw new Error("Failed to fetch dashboard statistics");
    }

    return response.json();
};

// ===============================
// GET Tasks (with multi-criteria filters)
// ===============================

export const getTasks = async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status && filters.status !== "all") params.append("status", filters.status);
    if (filters.priority && filters.priority !== "all") params.append("priority", filters.priority);
    if (filters.search && filters.search.trim()) params.append("search", filters.search.trim());
    if (filters.sortBy) params.append("sortBy", filters.sortBy);

    const queryString = params.toString() ? `?${params.toString()}` : "";
    const response = await fetch(`${BASE_URL}/tasks${queryString}`, {
        headers: getHeaders(true)
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Failed to fetch tasks");
    }

    return response.json();
};

// ===============================
// CREATE Task
// ===============================

export const createTask = async (task) => {
    const response = await fetch(`${BASE_URL}/tasks`, {
        method: "POST",
        headers: getHeaders(true),
        body: JSON.stringify(task)
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Failed to create task");
    }

    return response.json();
};

// ===============================
// UPDATE Task
// ===============================

export const updateTask = async (id, task) => {
    const response = await fetch(`${BASE_URL}/tasks/${id}`, {
        method: "PUT",
        headers: getHeaders(true),
        body: JSON.stringify(task)
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Failed to update task");
    }

    return response.json();
};

// ===============================
// DELETE Task
// ===============================

export const deleteTask = async (id) => {
    const response = await fetch(`${BASE_URL}/tasks/${id}`, {
        method: "DELETE",
        headers: getHeaders(true)
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Failed to delete task");
    }

    return response.json();
};

// ===============================
// AI TASK-BREAKDOWN ASSISTANT
// ===============================

export const aiBreakdownTask = async ({ title, description = "", priority = "Medium" }) => {
    const response = await fetch(`${BASE_URL}/api/ai/breakdown`, {
        method: "POST",
        headers: getHeaders(true),
        body: JSON.stringify({ title, description, priority })
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Failed to generate AI breakdown");
    }

    return response.json();
};

// ===============================
// EDA: Asynchronous Bulk Tasks (202 Accepted)
// ===============================

export const createBulkTasksAsync = async (tasks) => {
    const response = await fetch(`${BASE_URL}/tasks/bulk-async`, {
        method: "POST",
        headers: getHeaders(true),
        body: JSON.stringify({ tasks })
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Failed to submit batch job");
    }

    return response.json();
};

// ===============================
// EDA: Get Background Job Status
// ===============================

export const getJobStatus = async (jobId) => {
    const response = await fetch(`${BASE_URL}/tasks/jobs/${jobId}`, {
        headers: getHeaders(true)
    });

    if (!response.ok) {
        throw new Error("Failed to fetch background job status");
    }

    return response.json();
};

// ===============================
// EDA: Get Audit Logs
// ===============================

export const getAuditLogs = async () => {
    const response = await fetch(`${BASE_URL}/audit-logs`, {
        headers: getHeaders(true)
    });

    if (!response.ok) {
        throw new Error("Failed to fetch audit logs");
    }

    return response.json();
};

// ===============================
// EDA: Get Architecture Metrics
// ===============================

export const getEdaMetrics = async () => {
    const response = await fetch(`${BASE_URL}/eda/metrics`, {
        headers: getHeaders(true)
    });

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