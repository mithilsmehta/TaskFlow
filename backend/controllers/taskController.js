const Task = require("../models/Task");
const User = require("../models/User");

// ============================
// Get all tasks (scoped by company)
// ============================
const getTasks = async (req, res) => {
    try {
        const { status } = req.query;
        const statusFilter = status ? { status } : {};
        const baseFilter = { companyId: req.user.companyId, ...statusFilter };

        let tasks;

        if (req.user.role === "admin") {
            tasks = await Task.find(baseFilter)
                .populate("assignedTo", "name email profileImageUrl")
                .populate("companyId", "name")
                .sort({ createdAt: -1 });
        } else {
            tasks = await Task.find({ ...baseFilter, assignedTo: req.user._id })
                .populate("assignedTo", "name email profileImageUrl")
                .populate("companyId", "name")
                .sort({ createdAt: -1 });
        }

        // ✅ Build status summary
        const all = tasks.length;
        const pendingTasks = tasks.filter(t => t.status === "Pending").length;
        const inProgressTasks = tasks.filter(t => t.status === "In Progress").length;
        const completedTasks = tasks.filter(t => t.status === "Completed").length;

        res.json({
            tasks: tasks.map(t => ({ ...t._doc, companyName: t.companyId?.name })),
            statusSummary: {
                all,
                pendingTasks,
                inProgressTasks,
                completedTasks,
            },
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch tasks", error: error.message });
    }
};

// ============================
// Get single task by ID
// ============================
const getTaskById = async (req, res) => {
    try {
        const task = await Task.findOne({ _id: req.params.id, companyId: req.user.companyId })
            .populate("assignedTo", "name email profileImageUrl")
            .populate("companyId", "name");

        if (!task) return res.status(404).json({ message: "Task not found" });
        res.json({ ...task._doc, companyName: task.companyId?.name });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch task", error: error.message });
    }
};

// ============================
// Create Task (Admin only)
// ============================
const createTask = async (req, res) => {
    try {
        const { title, description, priority, dueDate, assignedTo = [], attachments, todoChecklist } = req.body;

        if (!Array.isArray(assignedTo)) {
            return res.status(400).json({ message: "assignedTo must be an array of user IDs" });
        }

        // Ensure assignees are in same company
        if (assignedTo.length) {
            const count = await User.countDocuments({ _id: { $in: assignedTo }, companyId: req.user.companyId });
            if (count !== assignedTo.length) {
                return res.status(400).json({ message: "One or more assignees are not in your company" });
            }
        }

        const task = await Task.create({
            title,
            description,
            priority,
            dueDate,
            assignedTo,
            attachments,
            todoChecklist,
            createdBy: req.user._id,
            companyId: req.user.companyId,
            status: "Pending",
        });

        const populated = await Task.findById(task._id)
            .populate("assignedTo", "name email profileImageUrl")
            .populate("companyId", "name");

        res.status(201).json({ ...populated._doc, companyName: populated.companyId?.name });
    } catch (error) {
        res.status(500).json({ message: "Failed to create task", error: error.message });
    }
};

// ============================
// Update Task (Admin: full, Member: status only)
// ============================
const updateTask = async (req, res) => {
    try {
        const task = await Task.findOne({ _id: req.params.id, companyId: req.user.companyId });
        if (!task) return res.status(404).json({ message: "Task not found" });

        if (req.user.role === "admin") {
            // admin can update everything
            task.title = req.body.title ?? task.title;
            task.description = req.body.description ?? task.description;
            task.priority = req.body.priority ?? task.priority;
            task.dueDate = req.body.dueDate ?? task.dueDate;
            task.todoChecklist = req.body.todoChecklist ?? task.todoChecklist;
            task.attachments = req.body.attachments ?? task.attachments;

            if (req.body.assignedTo) {
                if (!Array.isArray(req.body.assignedTo)) {
                    return res.status(400).json({ message: "assignedTo must be an array of user IDs" });
                }
                const count = await User.countDocuments({ _id: { $in: req.body.assignedTo }, companyId: req.user.companyId });
                if (count !== req.body.assignedTo.length) {
                    return res.status(400).json({ message: "One or more assignees are not in your company" });
                }
                task.assignedTo = req.body.assignedTo;
            }
        } else {
            // member → only status
            if (req.body.status) {
                const allowed = ["Pending", "In Progress", "Completed"];
                if (!allowed.includes(req.body.status)) {
                    return res.status(400).json({ message: "Invalid status" });
                }
                task.status = req.body.status;
            }
        }

        await task.save();
        const updated = await Task.findById(task._id)
            .populate("assignedTo", "name email profileImageUrl")
            .populate("companyId", "name");

        res.json({ ...updated._doc, companyName: updated.companyId?.name });
    } catch (error) {
        res.status(500).json({ message: "Failed to update task", error: error.message });
    }
};

// ============================
// Delete Task (Admin only)
// ============================
const deleteTask = async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({ _id: req.params.id, companyId: req.user.companyId });
        if (!task) return res.status(404).json({ message: "Task not found" });
        res.json({ message: "Task deleted" });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete task", error: error.message });
    }
};

// ============================
// Update Task Status (Member/Admin)
// ============================
const updateTaskStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const task = await Task.findOne({ _id: req.params.id, companyId: req.user.companyId });
        if (!task) return res.status(404).json({ message: "Task not found" });

        const isAssignee = task.assignedTo.map(id => String(id)).includes(String(req.user._id));
        if (!isAssignee && req.user.role !== "admin") {
            return res.status(403).json({ message: "Not allowed to update this task" });
        }

        if (status) {
            const allowed = ["Pending", "In Progress", "Completed"];
            if (!allowed.includes(status)) return res.status(400).json({ message: "Invalid status" });
            task.status = status;
        }

        await task.save();
        const updated = await Task.findById(task._id)
            .populate("assignedTo", "name email profileImageUrl")
            .populate("companyId", "name");
        res.json({ ...updated._doc, companyName: updated.companyId?.name });
    } catch (error) {
        res.status(500).json({ message: "Failed to update task status", error: error.message });
    }
};

// ============================
// Update Task Checklist (Member/Admin)
// ============================
const updateTaskChecklist = async (req, res) => {
    try {
        const { todoChecklist } = req.body;
        const task = await Task.findOne({ _id: req.params.id, companyId: req.user.companyId });
        if (!task) return res.status(404).json({ message: "Task not found" });

        const isAssignee = task.assignedTo.map(id => String(id)).includes(String(req.user._id));
        if (!isAssignee && req.user.role !== "admin") {
            return res.status(403).json({ message: "Not allowed to update this task" });
        }

        task.todoChecklist = todoChecklist ?? task.todoChecklist;
        await task.save();

        const updated = await Task.findById(task._id)
            .populate("assignedTo", "name email profileImageUrl")
            .populate("companyId", "name");

        res.json({ message: "Checklist updated", task: { ...updated._doc, companyName: updated.companyId?.name } });
    } catch (error) {
        res.status(500).json({ message: "Failed to update checklist", error: error.message });
    }
};

// ============================
// Dashboard Data (Admin)
// ============================
const getDashboardData = async (req, res, extraFilter = {}) => {
    try {
        const filter = { companyId: req.user.companyId, ...extraFilter };
        const totalTasks = await Task.countDocuments(filter);
        const pendingTasks = await Task.countDocuments({ ...filter, status: "Pending" });
        const completedTasks = await Task.countDocuments({ ...filter, status: "Completed" });
        const overdueTasks = await Task.countDocuments({
            ...filter,
            status: { $ne: "Completed" },
            dueDate: { $lt: new Date() },
        });

        const taskStatuses = ["Pending", "In Progress", "Completed"];
        const taskDistributionRaw = await Task.aggregate([
            { $match: filter },
            { $group: { _id: "$status", count: { $sum: 1 } } },
        ]);

        const taskDistribution = taskStatuses.reduce((acc, status) => {
            const key = status.replace(/\s+/g, "");
            acc[key] = taskDistributionRaw.find((x) => x._id === status)?.count || 0;
            return acc;
        }, {});
        taskDistribution.All = totalTasks;

        const priorities = ["Low", "Medium", "High"];
        const priorityRaw = await Task.aggregate([
            { $match: filter },
            { $group: { _id: "$priority", count: { $sum: 1 } } },
        ]);
        const taskPriorityLevels = priorities.reduce((acc, p) => {
            acc[p] = priorityRaw.find((x) => x._id === p)?.count || 0;
            return acc;
        }, {});

        const recentTasks = await Task.find(filter).sort({ createdAt: -1 }).limit(10);

        res.json({
            totalTasks,
            pendingTasks,
            completedTasks,
            overdueTasks,
            taskDistribution,
            taskPriorityLevels,
            recentTasks,
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch dashboard data", error: error.message });
    }
};

// ============================
// Dashboard Data (Member)
// ============================
const getUserDashboardData = async (req, res) => {
    getDashboardData(req, res, { assignedTo: req.user._id });
};

module.exports = {
    getTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    updateTaskChecklist,
    getDashboardData,
    getUserDashboardData,
};