const Task = require('../models/Task');
const User = require('../models/User');

// ============================
// Get all members in my company (Exclude self, allow both admin & member)
// ============================
const getUsers = async (req, res) => {
  try {
    // 🔹 remove the strict "admin only" check
    // Both admin and members can see company users for chat

    const users = await User.find({
      companyId: req.user.companyId,
      _id: { $ne: req.user._id }, // exclude logged-in user
    })
      .select('-password')
      .populate('companyId', 'name');

    // keep task counts for admins, skip for normal members
    const usersWithTaskCounts = await Promise.all(
      users.map(async (user) => {
        if (req.user.role !== 'admin') {
          return {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            companyName: user.companyId?.name || 'Unknown',
          };
        }

        const baseFilter = { companyId: req.user.companyId, assignedTo: user._id };
        const pendingTasks = await Task.countDocuments({ ...baseFilter, status: 'Pending' });
        const inProgressTasks = await Task.countDocuments({ ...baseFilter, status: 'In Progress' });
        const completedTasks = await Task.countDocuments({ ...baseFilter, status: 'Completed' });

        return {
          ...user.toObject(),
          companyName: user.companyId?.name || 'Unknown',
          pendingTasks,
          inProgressTasks,
          completedTasks,
        };
      }),
    );

    res.json(usersWithTaskCounts);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users', error: error.message });
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
      .select('-password')
      .populate('companyId', 'name');

    if (!user) {
      return res.status(404).json({ message: 'User not found or not in your company' });
    }

    // for members: return basic info only
    if (req.user.role !== 'admin') {
      return res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyName: user.companyId?.name || 'Unknown',
      });
    }

    // for admins: also include task counts
    const baseFilter = { companyId: req.user.companyId, assignedTo: user._id };
    const pendingTasks = await Task.countDocuments({ ...baseFilter, status: 'Pending' });
    const inProgressTasks = await Task.countDocuments({ ...baseFilter, status: 'In Progress' });
    const completedTasks = await Task.countDocuments({ ...baseFilter, status: 'Completed' });

    res.json({
      ...user.toObject(),
      companyName: user.companyId?.name || 'Unknown',
      pendingTasks,
      inProgressTasks,
      completedTasks,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user', error: error.message });
  }
};

module.exports = { getUsers, getUserById };
