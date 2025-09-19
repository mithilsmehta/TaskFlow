const Task = require("../models/Task");
const User = require("../models/User");
const excelJS = require("exceljs");

// @desc    Export all tasks for my company as an Excel file
// @route   GET /api/reports/export/tasks
// @access  Private (Admin)
const exportTasksReport = async (req, res) => {
    try {
        const tasks = await Task.find({ companyId: req.user.companyId }).populate("assignedTo", "name email");

        const workbook = new excelJS.Workbook();
        const worksheet = workbook.addWorksheet("Tasks Report");

        worksheet.columns = [
            { header: "Task ID", key: "_id", width: 25 },
            { header: "Title", key: "title", width: 30 },
            { header: "Description", key: "description", width: 40 },
            { header: "Priority", key: "priority", width: 12 },
            { header: "Status", key: "status", width: 15 },
            { header: "Due Date", key: "dueDate", width: 20 },
            { header: "Assigned To", key: "assignedTo", width: 30 }
        ];

        tasks.forEach((task) => {
            worksheet.addRow({
                _id: task._id.toString(),
                title: task.title,
                description: task.description || "",
                priority: task.priority,
                status: task.status,
                dueDate: task.dueDate ? new Date(task.dueDate).toISOString() : "",
                assignedTo: (task.assignedTo || []).map(u => u.name).join(", ")
            });
        });

        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", 'attachment; filename="tasks_report.xlsx"');
        res.status(200);
        await workbook.xlsx.write(res);
        return res.end();
    } catch (error) {
        res.status(500).json({ message: "Error exporting tasks", error: error.message });
    }
};

// @desc    Export users for my company as an Excel file
// @route   GET /api/reports/export/users
// @access  Private (Admin)
const exportUsersReport = async (req, res) => {
    try {
        const users = await User.find({ companyId: req.user.companyId }).select("name email role");

        const workbook = new excelJS.Workbook();
        const worksheet = workbook.addWorksheet("Users Report");

        worksheet.columns = [
            { header: "User ID", key: "_id", width: 25 },
            { header: "Name", key: "name", width: 25 },
            { header: "Email", key: "email", width: 30 },
            { header: "Role", key: "role", width: 12 }
        ];

        users.forEach((u) => {
            worksheet.addRow({
                _id: u._id.toString(),
                name: u.name,
                email: u.email,
                role: u.role
            });
        });

        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", 'attachment; filename="users_report.xlsx"');
        res.status(200);
        await workbook.xlsx.write(res);
        return res.end();
    } catch (error) {
        res.status(500).json({ message: "Error exporting users", error: error.message });
    }
};

module.exports = { exportTasksReport, exportUsersReport };