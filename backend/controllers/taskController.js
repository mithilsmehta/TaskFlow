const Task = require('../models/Task');
const User = require('../models/User');
const notificationService = require('../services/notificationService');

// ============================
// Get all tasks (scoped by company)
// ============================
const getTasks = async (req, res) => {
  try {
    const { status } = req.query;
    const statusFilter = status ? { status } : {};
    const baseFilter = { companyId: req.user.companyId, ...statusFilter };

    let tasks;

    if (req.user.role === 'admin') {
      tasks = await Task.find(baseFilter)
        .populate('assignedTo', 'name email profileImageUrl')
        .populate('companyId', 'name')
        .sort({ createdAt: -1 });
    } else {
      tasks = await Task.find({ ...baseFilter, assignedTo: req.user._id })
        .populate('assignedTo', 'name email profileImageUrl')
        .populate('companyId', 'name')
        .sort({ createdAt: -1 });
    }

    // Format tasks with consistent fields
    const formattedTasks = tasks.map((task) => {
      const todoChecklist = task.todoChecklist || [];
      const completedTodos = todoChecklist.filter((todo) => todo.done).length;
      const totalTodos = todoChecklist.length;
      const progress = totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0;

      return {
        ...task._doc,
        companyName: task.companyId?.name,
        progress: task.progress || progress,
        completedTodoCount: completedTodos,
        todoChecklist: todoChecklist,
        attachmentCount: task.attachments?.length || 0,
      };
    });

    // Build status summary
    const all = formattedTasks.length;
    const pendingTasks = formattedTasks.filter((t) => t.status === 'Pending').length;
    const inProgressTasks = formattedTasks.filter((t) => t.status === 'In Progress').length;
    const completedTasks = formattedTasks.filter((t) => t.status === 'Completed').length;

    res.json({
      tasks: formattedTasks,
      statusSummary: {
        all,
        pendingTasks,
        inProgressTasks,
        completedTasks,
      },
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({
      message: 'Failed to fetch tasks',
      error: error.message,
    });
  }
};

// ============================
// Get single task by ID
// ============================
const getTaskById = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, companyId: req.user.companyId })
      .populate('assignedTo', 'name email profileImageUrl')
      .populate('companyId', 'name')
      .lean();

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Calculate progress and completed todos
    const todoChecklist = Array.isArray(task.todoChecklist) ? task.todoChecklist : [];
    const completedTodos = todoChecklist.filter((todo) => todo?.done).length;
    const totalTodos = todoChecklist.length;
    const progress = totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0;

    // Format assignedTo to ensure consistent structure
    const assignedTo = Array.isArray(task.assignedTo)
      ? task.assignedTo.map((user) => ({
          _id: user._id,
          name: user.name || '',
          email: user.email || '',
          profileImageUrl: user.profileImageUrl || '',
        }))
      : [];

    // Format todoChecklist to ensure consistent structure
    const formattedTodoChecklist = todoChecklist.map((item) => ({
      _id: item._id || Math.random().toString(36).substr(2, 9),
      text: item.text || '',
      done: !!item.done,
    }));

    // Prepare the response object with all required fields
    const response = {
      _id: task._id,
      title: task.title || '',
      description: task.description || '',
      priority: task.priority || 'Low',
      status: task.status || 'Pending',
      startDate: task.startDate || null,
      dueDate: task.dueDate || null,
      assignedTo: assignedTo,
      todoChecklist: formattedTodoChecklist,
      attachments: Array.isArray(task.attachments) ? task.attachments : [],
      companyId: task.companyId?._id || task.companyId || null,
      companyName: task.companyId?.name || null,
      progress: typeof task.progress === 'number' ? task.progress : progress,
      completedTodoCount: completedTodos,
      attachmentCount: Array.isArray(task.attachments) ? task.attachments.length : 0,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };

    // Remove unwanted fields
    delete response.__v;
    delete response.companyId;

    res.json(response);
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch task',
      error: error.message,
    });
  }
};

// ============================
// Create Task (Admin only)
// ============================
const createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      priority,
      startDate,
      dueDate,
      assignedTo = [],
      attachments,
      todoChecklist: taskTodoChecklist = [],
    } = req.body;

    // Validate required fields
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    // Format dates
    const formattedStartDate = startDate ? new Date(startDate) : null;
    const formattedDueDate = dueDate ? new Date(dueDate) : null;

    if (!Array.isArray(assignedTo)) {
      return res.status(400).json({ message: 'assignedTo must be an array of user IDs' });
    }

    // Ensure assignees are in same company
    if (assignedTo.length) {
      const count = await User.countDocuments({ _id: { $in: assignedTo }, companyId: req.user.companyId });
      if (count !== assignedTo.length) {
        return res.status(400).json({ message: 'One or more assignees are not in your company' });
      }
    }

    // Create new task with all required fields
    const task = new Task({
      title,
      description: description || '',
      priority: priority || 'Medium',
      status: 'Pending',
      startDate: formattedStartDate,
      dueDate: formattedDueDate,
      assignedTo,
      todoChecklist: taskTodoChecklist,
      attachments,
      createdBy: req.user._id,
      companyId: req.user.companyId,
    });

    await task.save();

    // Populate the created task with user and company info
    const createdTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email profileImageUrl')
      .populate('companyId', 'name')
      .lean();

    // Send notifications to assigned users
    if (assignedTo.length > 0) {
      try {
        const assignedUsers = await User.find({ _id: { $in: assignedTo } }).select('_id name');
        await notificationService.notifyTaskAssigned({
          taskId: createdTask._id,
          taskTitle: createdTask.title,
          assignedUsers: assignedUsers,
          assignedBy: { _id: req.user._id, name: req.user.name },
          companyId: req.user.companyId,
        });
      } catch (notifError) {
        console.error('Error sending task assignment notifications:', notifError);
      }
    }

    // Calculate progress and completed todos
    const todoChecklist = Array.isArray(createdTask.todoChecklist) ? createdTask.todoChecklist : [];
    const completedTodoCount = todoChecklist.filter((todo) => todo?.done).length;
    const totalTodos = todoChecklist.length;
    const progress = totalTodos > 0 ? Math.round((completedTodoCount / totalTodos) * 100) : 0;

    // Format assignedTo for consistent response
    const formattedAssignedTo = Array.isArray(createdTask.assignedTo)
      ? createdTask.assignedTo.map((user) => ({
          _id: user._id || user,
          name: user.name || '',
          email: user.email || '',
          profileImageUrl: user.profileImageUrl || '',
        }))
      : [];

    // Format todoChecklist for consistent response
    const formattedTodoChecklist = todoChecklist.map((item) => ({
      _id: item._id || Math.random().toString(36).substr(2, 9),
      text: item.text || '',
      done: !!item.done,
    }));

    // Prepare the response object with all required fields
    const response = {
      _id: createdTask._id,
      title: createdTask.title || '',
      description: createdTask.description || '',
      priority: createdTask.priority || 'Medium',
      status: createdTask.status || 'Pending',
      startDate: createdTask.startDate || null,
      dueDate: createdTask.dueDate || null,
      assignedTo: assignedTo,
      todoChecklist: formattedTodoChecklist,
      attachments: Array.isArray(createdTask.attachments) ? createdTask.attachments : [],
      companyId: createdTask.companyId?._id || createdTask.companyId || null,
      companyName: createdTask.companyId?.name || null,
      progress: progress,
      completedTodoCount: completedTodoCount,
      attachmentCount: Array.isArray(createdTask.attachments) ? createdTask.attachments.length : 0,
      createdAt: createdTask.createdAt,
      updatedAt: createdTask.updatedAt,
    };

    res.status(201).json(response);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create task', error: error.message });
  }
};

// ============================
// Update Task (Admin: full, Member: status only)
// ============================
const updateTask = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, companyId: req.user.companyId });
    if (!task) return res.status(404).json({ message: 'Task not found' });

    if (req.user.role === 'admin') {
      // admin can update everything
      task.title = req.body.title ?? task.title;
      task.description = req.body.description ?? task.description;
      task.priority = req.body.priority ?? task.priority;
      task.startDate = req.body.startDate ? new Date(req.body.startDate) : task.startDate;
      task.dueDate = req.body.dueDate ? new Date(req.body.dueDate) : task.dueDate;
      // normalize checklist to expected shape
      if (Array.isArray(req.body.todoChecklist)) {
        task.todoChecklist = req.body.todoChecklist.map((it) => ({
          text: typeof it === 'string' ? it : it?.text || '',
          done: !!(typeof it === 'object' && it?.done),
        }));
      }
      // attachments: force array of strings
      if (Array.isArray(req.body.attachments)) {
        task.attachments = req.body.attachments.map(String);
      }

      if (req.body.assignedTo) {
        if (!Array.isArray(req.body.assignedTo)) {
          return res.status(400).json({ message: 'assignedTo must be an array of user IDs' });
        }
        const count = await User.countDocuments({ _id: { $in: req.body.assignedTo }, companyId: req.user.companyId });
        if (count !== req.body.assignedTo.length) {
          return res.status(400).json({ message: 'One or more assignees are not in your company' });
        }
        task.assignedTo = req.body.assignedTo;
      }
    } else {
      // member → only status
      if (req.body.status) {
        const allowed = ['Pending', 'In Progress', 'Completed'];
        if (!allowed.includes(req.body.status)) {
          return res.status(400).json({ message: 'Invalid status' });
        }
        task.status = req.body.status;
      }
    }

    const oldStatus = task.status;
    await task.save();

    // Get the updated task with populated fields
    const updatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email profileImageUrl')
      .populate('companyId', 'name');

    // Send notifications for task updates
    if (req.user.role === 'admin' && updatedTask.assignedTo.length > 0) {
      try {
        let updateType = 'Task details updated';

        if (req.body.status && req.body.status !== oldStatus) {
          updateType = `Status changed to ${req.body.status}`;

          // Special notification for task completion
          if (req.body.status === 'Completed') {
            await notificationService.notifyTaskCompleted({
              taskId: updatedTask._id,
              taskTitle: updatedTask.title,
              completedBy: { _id: req.user._id, name: req.user.name },
              assignedUsers: updatedTask.assignedTo,
              companyId: req.user.companyId,
            });
          } else {
            await notificationService.notifyTaskUpdated({
              taskId: updatedTask._id,
              taskTitle: updatedTask.title,
              updatedBy: { _id: req.user._id, name: req.user.name },
              assignedUsers: updatedTask.assignedTo,
              companyId: req.user.companyId,
              updateType,
            });
          }
        } else if (req.body.priority || req.body.dueDate || req.body.title) {
          if (req.body.priority) updateType = `Priority changed to ${req.body.priority}`;
          if (req.body.dueDate) updateType = 'Due date updated';
          if (req.body.title) updateType = 'Task title updated';

          await notificationService.notifyTaskUpdated({
            taskId: updatedTask._id,
            taskTitle: updatedTask.title,
            updatedBy: { _id: req.user._id, name: req.user.name },
            assignedUsers: updatedTask.assignedTo,
            companyId: req.user.companyId,
            updateType,
          });
        }
      } catch (notifError) {
        console.error('Error sending task update notifications:', notifError);
      }
    }

    // Calculate progress and completed todos
    const todoChecklist = Array.isArray(updatedTask.todoChecklist) ? updatedTask.todoChecklist : [];
    const completedTodoCount = todoChecklist.filter((todo) => todo?.done).length;
    const totalTodos = todoChecklist.length;
    const progress = totalTodos > 0 ? Math.round((completedTodoCount / totalTodos) * 100) : 0;

    // Format assignedTo for consistent response
    const assignedTo = Array.isArray(updatedTask.assignedTo)
      ? updatedTask.assignedTo.map((user) => ({
          _id: user._id || user,
          name: user.name || '',
          email: user.email || '',
          profileImageUrl: user.profileImageUrl || '',
        }))
      : [];

    // Format todoChecklist for consistent response
    const formattedTodoChecklist = todoChecklist.map((item) => ({
      _id: item._id || Math.random().toString(36).substr(2, 9),
      text: item.text || '',
      done: !!item.done,
    }));

    // Prepare the response object with all required fields
    const response = {
      _id: updatedTask._id,
      title: updatedTask.title || '',
      description: updatedTask.description || '',
      priority: updatedTask.priority || 'Medium',
      status: updatedTask.status || 'Pending',
      startDate: updatedTask.startDate || null,
      dueDate: updatedTask.dueDate || null,
      assignedTo: assignedTo,
      todoChecklist: formattedTodoChecklist,
      attachments: Array.isArray(updatedTask.attachments) ? updatedTask.attachments : [],
      companyId: updatedTask.companyId?._id || updatedTask.companyId || null,
      companyName: updatedTask.companyId?.name || null,
      progress: typeof updatedTask.progress === 'number' ? updatedTask.progress : progress,
      completedTodoCount: completedTodoCount,
      attachmentCount: Array.isArray(updatedTask.attachments) ? updatedTask.attachments.length : 0,
      createdAt: updatedTask.createdAt,
      updatedAt: updatedTask.updatedAt,
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update task', error: error.message });
  }
};

// ============================
// Delete Task (Admin only)
// ============================
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, companyId: req.user.companyId });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete task', error: error.message });
  }
};

// ============================
// Update Task Status (Member/Admin)
// ============================
const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const task = await Task.findOne({ _id: req.params.id, companyId: req.user.companyId });
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const isAssignee = task.assignedTo.map((id) => String(id)).includes(String(req.user._id));
    if (!isAssignee && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not allowed to update this task' });
    }

    if (status) {
      const allowed = ['Pending', 'In Progress', 'Completed'];
      if (!allowed.includes(status)) return res.status(400).json({ message: 'Invalid status' });
      task.status = status;
    }

    await task.save();
    const updated = await Task.findById(task._id)
      .populate('assignedTo', 'name email profileImageUrl')
      .populate('companyId', 'name');
    res.json({ ...updated._doc, companyName: updated.companyId?.name });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update task status', error: error.message });
  }
};

// ============================
// Update Task Checklist (Member/Admin)
// ============================
const updateTaskChecklist = async (req, res) => {
  try {
    const { todoChecklist: updateTodoChecklist } = req.body;
    const task = await Task.findOne({ _id: req.params.id, companyId: req.user.companyId });
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const isAssignee = task.assignedTo.map((id) => String(id)).includes(String(req.user._id));
    if (!isAssignee && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not allowed to update this task' });
    }

    // Update the todo checklist
    task.todoChecklist = Array.isArray(updateTodoChecklist) ? updateTodoChecklist : task.todoChecklist || [];

    // Calculate completed todos
    const completedTodos = task.todoChecklist.filter((todo) => todo.done).length;
    const totalTodos = task.todoChecklist.length;
    const progress = totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0;

    // Update task status based on todo completion
    if (totalTodos > 0) {
      if (completedTodos === totalTodos) {
        task.status = 'Completed';
      } else if (completedTodos > 0) {
        task.status = 'In Progress';
      } else {
        task.status = 'Pending';
      }
    }

    // Update task progress
    task.progress = progress;

    await task.save();

    // Get the updated task with populated fields
    const updatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email profileImageUrl')
      .populate('companyId', 'name')
      .lean();

    // Format assignedTo for consistent response
    const formattedAssignedTo = Array.isArray(updatedTask.assignedTo)
      ? updatedTask.assignedTo.map((user) => ({
          _id: user._id || user,
          name: user.name || '',
          email: user.email || '',
          profileImageUrl: user.profileImageUrl || '',
        }))
      : [];

    // Format todoChecklist for consistent response
    const formattedTodoChecklist = Array.isArray(updatedTask.todoChecklist)
      ? updatedTask.todoChecklist.map((item) => ({
          _id: item._id || Math.random().toString(36).substr(2, 9),
          text: item.text || '',
          done: !!item.done,
        }))
      : [];

    const formatted = {
      _id: updatedTask._id,
      title: updatedTask.title || '',
      description: updatedTask.description || '',
      priority: updatedTask.priority || 'Medium',
      status: updatedTask.status || 'Pending',
      startDate: updatedTask.startDate || null,
      dueDate: updatedTask.dueDate || null,
      assignedTo: formattedAssignedTo,
      todoChecklist: formattedTodoChecklist,
      attachments: Array.isArray(updatedTask.attachments) ? updatedTask.attachments : [],
      companyId: updatedTask.companyId?._id || updatedTask.companyId || null,
      companyName: updatedTask.companyId?.name || null,
      progress: progress,
      completedTodoCount: completedTodos,
      attachmentCount: Array.isArray(updatedTask.attachments) ? updatedTask.attachments.length : 0,
      createdAt: updatedTask.createdAt,
      updatedAt: updatedTask.updatedAt,
    };

    // Return wrapped for frontend expectations
    res.json({ task: formatted });
  } catch (error) {
    console.error('Error updating task checklist:', error);
    res.status(500).json({
      message: 'Failed to update checklist',
      error: error.message,
    });
  }
};

// ============================
// Dashboard Data (Admin)
// ============================
const getDashboardData = async (req, res, extraFilter = {}) => {
  try {
    const filter = { companyId: req.user.companyId, ...extraFilter };
    const totalTasks = await Task.countDocuments(filter);
    const pendingTasks = await Task.countDocuments({ ...filter, status: 'Pending' });
    const completedTasks = await Task.countDocuments({ ...filter, status: 'Completed' });
    const overdueTasks = await Task.countDocuments({
      ...filter,
      status: { $ne: 'Completed' },
      dueDate: { $lt: new Date() },
    });

    const taskStatuses = ['Pending', 'In Progress', 'Completed'];
    const taskDistributionRaw = await Task.aggregate([
      { $match: filter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const taskDistribution = taskStatuses.reduce((acc, status) => {
      const key = status.replace(/\s+/g, '');
      acc[key] = taskDistributionRaw.find((x) => x._id === status)?.count || 0;
      return acc;
    }, {});
    taskDistribution.All = totalTasks;

    const priorities = ['Low', 'Medium', 'High'];
    const priorityRaw = await Task.aggregate([
      { $match: filter },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
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
    res.status(500).json({ message: 'Failed to fetch dashboard data', error: error.message });
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
