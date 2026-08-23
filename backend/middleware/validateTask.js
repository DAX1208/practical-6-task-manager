const validateTask = (req, res, next) => {
    const { title, description } = req.body;

    if (
        typeof title !== "string" ||
        !title.trim()
    ) {
        return res.status(400).json({
            message: "Title is required"
        });
    }

    if (
        typeof description !== "string" ||
        !description.trim()
    ) {
        return res.status(400).json({
            message: "Description is required"
        });
    }

    next();
};

module.exports = validateTask;