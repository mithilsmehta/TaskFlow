import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect(token) {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    this.socket = io('http://localhost:8000', {
      auth: {
        token: token,
      },
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
    });

    // Listen for new notifications
    this.socket.on('notification:new', (data) => {
      console.log('New notification received:', data);
      this.emit('notification:new', data);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log('Socket disconnected manually');
    }
  }

  // Event emitter pattern for components to listen
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  emit(event, data) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(data));
    }
  }

  // Mark notification as read
  markAsRead(notificationId) {
    if (this.socket) {
      this.socket.emit('notification:read', notificationId);
    }
  }

  // Mark all notifications as read
  markAllAsRead() {
    if (this.socket) {
      this.socket.emit('notifications:read_all');
    }
  }

  isConnected() {
    return this.socket?.connected || false;
  }
}

// Export singleton instance
const socketService = new SocketService();
export default socketService;
