const express = require('express');
const http = require('http');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const path = require('path');
const cors = require('cors');
const chatRoutes = require('./routes/chatRoutes');
const { initializeSocket } = require('./config/socket');

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
initializeSocket(server);

// --------------------
// Enable CORS
// --------------------
app.use(
  cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }),
);

// --------------------
// Middleware for JSON parsing
// --------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --------------------
// Routes
// --------------------
app.use('/chat', chatRoutes);
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

// --------------------
// Static
// --------------------
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

app.get('/', (req, res) => {
  res.send('API is running...');
});

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.IO initialized and ready`);
});
