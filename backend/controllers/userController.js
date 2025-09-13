const Task = require("../models/Task");
const User = require("../models/User");

// ============================
// Get all members in my company (Admin only)
// ============================
const getUsers = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Only admins can view company users" });
        }

        const users = await User.find({ role: "member", companyId: req.user.companyId })
            .select("-password")
            .populate("companyId", "name");

        const usersWithTaskCounts = await Promise.all(
            users.map(async (user) => {
                const baseFilter = { companyId: req.user.companyId, assignedTo: user._id };
                const pendingTasks = await Task.countDocuments({ ...baseFilter, status: "Pending" });
                const inProgressTasks = await Task.countDocuments({ ...baseFilter, status: "In Progress" });
                const completedTasks = await Task.countDocuments({ ...baseFilter, status: "Completed" });

                return {
                    ...user.toObject(),
                    companyName: user.companyId?.name || "Unknown",
                    pendingTasks,
                    inProgressTasks,
                    completedTasks,
                };
            })
        );

        res.json(usersWithTaskCounts);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch users", error: error.message });
    }
};

// ============================
// Get user by ID (must belong to same company)
// ============================
const getUserById = async (req, res) => {
    try {
        const user = await User.findOne({
            _id: req.params.id,
            companyId: req.user.companyId,
        })
            .select("-password")
            .populate("companyId", "name");

        if (!user) {
            return res.status(404).json({ message: "User not found or not in your company" });
        }

        // also include task counts for this user
        const baseFilter = { companyId: req.user.companyId, assignedTo: user._id };
        const pendingTasks = await Task.countDocuments({ ...baseFilter, status: "Pending" });
        const inProgressTasks = await Task.countDocuments({ ...baseFilter, status: "In Progress" });
        const completedTasks = await Task.countDocuments({ ...baseFilter, status: "Completed" });

        res.json({
            ...user.toObject(),
            companyName: user.companyId?.name || "Unknown",
            pendingTasks,
            inProgressTasks,
            completedTasks,
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch user", error: error.message });
    }
};

module.exports = { getUsers, getUserById };