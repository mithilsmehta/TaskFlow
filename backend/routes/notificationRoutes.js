const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} = require('../controllers/notificationController');

const router = express.Router();

// Get user notifications
router.get('/', protect, getNotifications);

// Get unread count
router.get('/unread-count', protect, getUnreadCount);

// Mark notification as read
router.put('/:id/read', protect, markAsRead);

// Mark all as read
router.put('/read-all', protect, markAllAsRead);

// Delete notification
router.delete('/:id', protect, deleteNotification);

module.exports = router;
