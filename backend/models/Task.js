const mongoose = require("mongoose");

const subtaskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    completed: {
        type: Boolean,
        default: false
    }
}, { _id: true });

const taskSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            required: true,
            trim: true
        },
        status: {
            type: String,
            enum: ["Pending", "In Progress", "Completed"],
            default: "Pending"
        },
        priority: {
            type: String,
            enum: ["Low", "Medium", "High"],
            default: "Medium"
        },
        dueDate: {
            type: Date,
            default: null
        },
        completed: {
            type: Boolean,
            default: false
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            index: true,
            default: null
        },
        subtasks: [subtaskSchema]
    },
    {
        timestamps: true
    }
);

// Synchronize completed boolean with status enum for backward compatibility
taskSchema.pre("save", function () {
    if (this.isModified("status") && !this.isModified("completed")) {
        this.completed = this.status === "Completed";
    } else if (this.isModified("completed") && !this.isModified("status")) {
        this.status = this.completed ? "Completed" : (this.status === "Completed" ? "Pending" : this.status);
    }
});


// Performance Indexes for frequent dashboard and filtered queries
taskSchema.index({ user: 1, status: 1 });
taskSchema.index({ user: 1, priority: 1 });
taskSchema.index({ user: 1, dueDate: 1 });
taskSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("Task", taskSchema);