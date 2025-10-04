const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const chatController = require('../controllers/chatController');

const router = express.Router();

// send + history + last + seen
router.post('/send', protect, chatController.sendMessage);
router.get('/history', protect, chatController.getMessages);
router.get('/last-messages', protect, chatController.getLastMessages);
router.post('/seen', protect, chatController.markMessagesSeen);

module.exports = router;
