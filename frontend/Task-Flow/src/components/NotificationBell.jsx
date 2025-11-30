import React, { useState, useEffect, useRef } from 'react';
import { LuBell } from 'react-icons/lu';
import { notificationApi } from '../services/notificationApi';
import socketService from '../services/socketService';
import NotificationDropdown from './NotificationDropdown';
import toast from 'react-hot-toast';

const NotificationBell = () => {
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);

    // Fetch initial unread count
    useEffect(() => {
        fetchUnreadCount();
        fetchNotifications();
    }, []);

    // Listen for new notifications via Socket.IO
    useEffect(() => {
        const unsubscribe = socketService.on('notification:new', (data) => {
            console.log('New notification in bell:', data);

            // Add new notification to the list
            setNotifications(prev => [data.notification, ...prev]);

            // Increment unread count
            setUnreadCount(prev => prev + 1);

            // Show toast notification
            toast.success(data.notification.title, {
                duration: 3000,
                icon: '🔔'
            });
        });

        return () => unsubscribe();
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const fetchUnreadCount = async () => {
        try {
            const data = await notificationApi.getUnreadCount();
            setUnreadCount(data.count);
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    };

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const data = await notificationApi.getNotifications({ limit: 20 });
            setNotifications(data.notifications);
            setUnreadCount(data.unreadCount);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            fetchNotifications();
        }
    };

    const handleMarkAsRead = async (notificationId) => {
        try {
            await notificationApi.markAsRead(notificationId);

            // Update local state
            setNotifications(prev =>
                prev.map(notif =>
                    notif._id === notificationId ? { ...notif, read: true } : notif
                )
            );

            // Decrement unread count
            setUnreadCount(prev => Math.max(0, prev - 1));

            socketService.markAsRead(notificationId);
        } catch (error) {
            console.error('Error marking notification as read:', error);
            toast.error('Failed to mark as read');
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationApi.markAllAsRead();

            // Update local state
            setNotifications(prev =>
                prev.map(notif => ({ ...notif, read: true }))
            );

            setUnreadCount(0);
            socketService.markAllAsRead();
            toast.success('All notifications marked as read');
        } catch (error) {
            console.error('Error marking all as read:', error);
            toast.error('Failed to mark all as read');
        }
    };

    const handleDelete = async (notificationId) => {
        try {
            await notificationApi.deleteNotification(notificationId);

            // Remove from local state
            const deletedNotif = notifications.find(n => n._id === notificationId);
            setNotifications(prev => prev.filter(notif => notif._id !== notificationId));

            // Decrement unread count if it was unread
            if (deletedNotif && !deletedNotif.read) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }

            toast.success('Notification deleted');
        } catch (error) {
            console.error('Error deleting notification:', error);
            toast.error('Failed to delete notification');
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={handleToggle}
                className="relative p-2 text-gray-600 hover:text-primary transition-colors rounded-full hover:bg-gray-100"
                aria-label="Notifications"
            >
                <LuBell className="text-2xl" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full min-w-[20px]">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <NotificationDropdown
                    notifications={notifications}
                    loading={loading}
                    onMarkAsRead={handleMarkAsRead}
                    onMarkAllAsRead={handleMarkAllAsRead}
                    onDelete={handleDelete}
                    onClose={() => setIsOpen(false)}
                />
            )}
        </div>
    );
};

export default NotificationBell;
