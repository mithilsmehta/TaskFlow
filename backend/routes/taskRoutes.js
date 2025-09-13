const express = require("express");
const { protect, adminOnly } = require("../middlewares/authMiddleware");
const {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  updateTaskChecklist,
  getDashboardData,
  getUserDashboardData,
} = require("../controllers/taskController");

const router = express.Router();

// Dashboard data (User only)
router.get("/user-dashboard-data", protect, getUserDashboardData);

// Dashboard data (Admin only)
router.get("/dashboard-data", protect, adminOnly, getDashboardData);

// Get all tasks (Admin = all company tasks, Member = only assigned tasks)
router.get("/", protect, getTasks);

// Get task by ID
router.get("/:id", protect, getTaskById);

// Create task (Admin only)
router.post("/", protect, adminOnly, createTask);

// Update task
router.put("/:id", protect, updateTask);

// Delete task (Admin only)
router.delete("/:id", protect, adminOnly, deleteTask);

// Update task status
router.put("/:id/status", protect, updateTaskStatus);

// Update task checklist
router.put("/:id/todo", protect, updateTaskChecklist);

module.exports = router;