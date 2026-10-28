const validateTask = (req, res, next) => {
    const { title, description, priority, status, dueDate } = req.body;

    if (typeof title !== "string" || !title.trim()) {
        return res.status(400).json({
            message: "Title is required and must be non-empty"
        });
    }

    if (typeof description !== "string" || !description.trim()) {
        return res.status(400).json({
            message: "Description is required and must be non-empty"
        });
    }

    if (priority && !["Low", "Medium", "High"].includes(priority)) {
        return res.status(400).json({
            message: "Priority must be one of: Low, Medium, High"
        });
    }

    if (status && !["Pending", "In Progress", "Completed"].includes(status)) {
        return res.status(400).json({
            message: "Status must be one of: Pending, In Progress, Completed"
        });
    }

    if (dueDate && isNaN(Date.parse(dueDate))) {
        return res.status(400).json({
            message: "Invalid due date format"
        });
    }

    next();
};

module.exports = validateTask;