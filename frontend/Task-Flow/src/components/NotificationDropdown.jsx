import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LuTrash2, LuCheck, LuCheckCheck } from 'react-icons/lu';
import moment from 'moment';

const NotificationDropdown = ({
    notifications,
    loading,
    onMarkAsRead,
    onMarkAllAsRead,
    onDelete,
    onClose
}) => {
    const navigate = useNavigate();

    const handleNotificationClick = (notification) => {
        // Mark as read if unread
        if (!notification.read) {
            onMarkAsRead(notification._id);
        }

        // Navigate to task if taskId exists
        if (notification.taskId) {
            onClose();
            navigate(`/admin/update-task/${notification.taskId}`);
        }
    };

    const getNotificationIcon = (type) => {
        const icons = {
            task_assigned: '📋',
            task_updated: '✏️',
            task_completed: '✅',
            task_comment: '💬',
            task_mention: '@',
            task_due_soon: '⏰',
            task_deleted: '🗑️'
        };
        return icons[type] || '🔔';
    };

    return (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-[600px] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
                {notifications.length > 0 && (
                    <button
                        onClick={onMarkAllAsRead}
                        className="text-sm text-primary hover:text-primary-dark flex items-center gap-1"
                        title="Mark all as read"
                    >
                        <LuCheckCheck className="text-base" />
                        Mark all read
                    </button>
                )}
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto flex-1">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-2">Loading notifications...</p>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <LuCheck className="text-4xl mx-auto mb-2 text-gray-300" />
                        <p>No notifications</p>
                        <p className="text-sm mt-1">You're all caught up!</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {notifications.map((notification) => (
                            <div
                                key={notification._id}
                                className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer relative group ${!notification.read ? 'bg-blue-50' : ''
                                    }`}
                                onClick={() => handleNotificationClick(notification)}
                            >
                                <div className="flex items-start gap-3">
                                    {/* Icon */}
                                    <div className="flex-shrink-0 text-2xl">
                                        {getNotificationIcon(notification.type)}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1">
                                                <p className="text-sm font-semibold text-gray-800">
                                                    {notification.title}
                                                </p>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {notification.message}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {moment(notification.createdAt).fromNow()}
                                                </p>
                                            </div>

                                            {/* Unread indicator */}
                                            {!notification.read && (
                                                <div className="flex-shrink-0">
                                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Action by user */}
                                        {notification.actionBy && (
                                            <div className="flex items-center gap-2 mt-2">
                                                {notification.actionBy.profileImageUrl && (
                                                    <img
                                                        src={notification.actionBy.profileImageUrl}
                                                        alt={notification.actionBy.name}
                                                        className="w-5 h-5 rounded-full object-cover"
                                                    />
                                                )}
                                                <span className="text-xs text-gray-500">
                                                    {notification.actionBy.name}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Delete button */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDelete(notification._id);
                                        }}
                                        className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded text-red-600"
                                        title="Delete notification"
                                    >
                                        <LuTrash2 className="text-sm" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
                <div className="p-3 border-t border-gray-200 text-center">
                    <button
                        onClick={onClose}
                        className="text-sm text-primary hover:text-primary-dark font-medium"
                    >
                        Close
                    </button>
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;
