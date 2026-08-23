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