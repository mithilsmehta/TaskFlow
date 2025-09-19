const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        description: { type: String },
        priority: { type: String, enum: ["Low", "Medium", "High"], default: "Medium" },
        status: { type: String, enum: ["Pending", "In Progress", "Completed"], default: "Pending" },
        startDate: { 
            type: Date,
            set: function(date) {
                return date ? new Date(date) : undefined;
            }
        },
        dueDate: { 
            type: Date,
            set: function(date) {
                return date ? new Date(date) : undefined;
            }
        },
        assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
        attachments: [{ type: String }],
        todoChecklist: [
            {
                text: { type: String },
                done: { type: Boolean, default: false },
            },
        ],
    },
    { timestamps: true }
);

module.exports = mongoose.model("Task", taskSchema);