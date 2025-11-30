const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

// Store user socket connections
const userSockets = new Map(); // userId -> socketId
const socketUsers = new Map(); // socketId -> userId

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Socket.IO authentication middleware
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.companyId = decoded.companyId;

      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    const companyId = socket.companyId;

    console.log(`User connected: ${userId} (Socket: ${socket.id})`);

    // Store user-socket mapping
    userSockets.set(userId, socket.id);
    socketUsers.set(socket.id, userId);

    // Join user's personal room
    socket.join(`user:${userId}`);

    // Join company room for company-wide notifications
    socket.join(`company:${companyId}`);

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${userId} (Socket: ${socket.id})`);
      userSockets.delete(userId);
      socketUsers.delete(socket.id);
    });

    // Handle mark notification as read
    socket.on('notification:read', (notificationId) => {
      console.log(`Notification ${notificationId} marked as read by user ${userId}`);
    });

    // Handle mark all as read
    socket.on('notifications:read_all', () => {
      console.log(`All notifications marked as read by user ${userId}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

// Helper function to emit notification to specific user
const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

// Helper function to emit notification to company
const emitToCompany = (companyId, event, data) => {
  if (io) {
    io.to(`company:${companyId}`).emit(event, data);
  }
};

// Check if user is online
const isUserOnline = (userId) => {
  return userSockets.has(userId);
};

module.exports = {
  initializeSocket,
  getIO,
  emitToUser,
  emitToCompany,
  isUserOnline,
  userSockets,
  socketUsers,
};
