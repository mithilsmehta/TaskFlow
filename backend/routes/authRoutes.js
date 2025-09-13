const express = require("express");
const {
    registerUser,
    loginUser,
    getUserProfile,
    updateUserProfile,
} = require("../controllers/authController");
const { protect } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMiddleware");

const router = express.Router();

// ==============================
// REGISTER (with optional profile image)
// ==============================
router.post("/register", upload.single("image"), registerUser);

// LOGIN
router.post("/login", loginUser);

// GET USER PROFILE
router.get("/profile", protect, getUserProfile);

// UPDATE USER PROFILE (with optional new image)
router.put("/profile", protect, upload.single("image"), updateUserProfile);

module.exports = router;