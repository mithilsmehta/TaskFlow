const Notification = require('../models/Notification');
const { emitToUser } = require('../config/socket');

class NotificationService {
  // Create and emit a notification
  async createNotification({ userId, companyId, type, title, message, taskId, actionBy }) {
    try {
      const notification = await Notification.create({
        userId,
        companyId,
        type,
        title,
        message,
        taskId,
        actionBy,
      });

      // Populate actionBy user details
      await notification.populate('actionBy', 'name profileImageUrl');

      // Emit real-time notification to user
      emitToUser(userId.toString(), 'notification:new', {
        notification: notification.toObject(),
      });

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Notify user about task assignment
  async notifyTaskAssigned({ taskId, taskTitle, assignedUsers, assignedBy, companyId }) {
    const notifications = [];

    for (const user of assignedUsers) {
      // Don't notify if user assigned themselves
      if (user._id.toString() === assignedBy._id.toString()) {
        continue;
      }

      const notification = await this.createNotification({
        userId: user._id,
        companyId,
        type: 'task_assigned',
        title: 'New Task Assigned',
        message: `${assignedBy.name} assigned you to "${taskTitle}"`,
        taskId,
        actionBy: assignedBy._id,
      });

      notifications.push(notification);
    }

    return notifications;
  }

  // Notify users about task update
  async notifyTaskUpdated({ taskId, taskTitle, updatedBy, assignedUsers, companyId, updateType }) {
    const notifications = [];

    for (const user of assignedUsers) {
      // Don't notify the user who made the update
      if (user._id.toString() === updatedBy._id.toString()) {
        continue;
      }

      const notification = await this.createNotification({
        userId: user._id,
        companyId,
        type: 'task_updated',
        title: 'Task Updated',
        message: `${updatedBy.name} updated "${taskTitle}" - ${updateType}`,
        taskId,
        actionBy: updatedBy._id,
      });

      notifications.push(notification);
    }

    return notifications;
  }

  // Notify users about task completion
  async notifyTaskCompleted({ taskId, taskTitle, completedBy, assignedUsers, companyId }) {
    const User = require('../models/User');
    const notifications = [];

    // Notify assigned users
    for (const user of assignedUsers) {
      // Don't notify the user who completed it
      if (user._id.toString() === completedBy._id.toString()) {
        continue;
      }

      const notification = await this.createNotification({
        userId: user._id,
        companyId,
        type: 'task_completed',
        title: 'Task Completed',
        message: `${completedBy.name} completed "${taskTitle}"`,
        taskId,
        actionBy: completedBy._id,
      });

      notifications.push(notification);
    }

    // Notify all admins in the company
    try {
      const admins = await User.find({ companyId, role: 'admin' });

      for (const admin of admins) {
        // Don't notify if admin is the one who completed it
        if (admin._id.toString() === completedBy._id.toString()) {
          continue;
        }

        const adminNotification = await this.createNotification({
          userId: admin._id,
          companyId,
          type: 'task_completed',
          title: 'Task Completed',
          message: `${completedBy.name} has completed their task "${taskTitle}"`,
          taskId,
          actionBy: completedBy._id,
        });

        notifications.push(adminNotification);
      }
    } catch (error) {
      console.error('Error notifying admins:', error);
    }

    return notifications;
  }

  // Notify about mentions in comments (future feature)
  async notifyMention({ taskId, taskTitle, mentionedUsers, mentionedBy, companyId, comment }) {
    const notifications = [];

    for (const user of mentionedUsers) {
      // Don't notify if user mentioned themselves
      if (user._id.toString() === mentionedBy._id.toString()) {
        continue;
      }

      const notification = await this.createNotification({
        userId: user._id,
        companyId,
        type: 'task_mention',
        title: 'You were mentioned',
        message: `${mentionedBy.name} mentioned you in "${taskTitle}"`,
        taskId,
        actionBy: mentionedBy._id,
      });

      notifications.push(notification);
    }

    return notifications;
  }

  // Get user notifications
  async getUserNotifications(userId, { limit = 20, skip = 0, unreadOnly = false }) {
    const query = { userId };

    if (unreadOnly) {
      query.read = false;
    }

    const notifications = await Notification.find(query)
      .populate('actionBy', 'name profileImageUrl')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const unreadCount = await Notification.countDocuments({ userId, read: false });

    return {
      notifications,
      unreadCount,
    };
  }

  // Mark notification as read
  async markAsRead(notificationId, userId) {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { read: true, readAt: new Date() },
      { new: true },
    );

    return notification;
  }

  // Mark all notifications as read
  async markAllAsRead(userId) {
    await Notification.updateMany({ userId, read: false }, { read: true, readAt: new Date() });

    return { success: true };
  }

  // Delete notification
  async deleteNotification(notificationId, userId) {
    await Notification.findOneAndDelete({ _id: notificationId, userId });
    return { success: true };
  }

  // Get unread count
  async getUnreadCount(userId) {
    const count = await Notification.countDocuments({ userId, read: false });
    return count;
  }
}

module.exports = new NotificationService();
