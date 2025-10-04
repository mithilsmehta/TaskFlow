const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const { getUsers, getUserById } = require('../controllers/userController');

const router = express.Router();

// ==============================
// User Management Routes
// ==============================

// Get all users in my company (exclude myself)
router.get('/', protect, getUsers);

// Get a specific user (must belong to same company)
router.get('/:id', protect, getUserById);

module.exports = router;
