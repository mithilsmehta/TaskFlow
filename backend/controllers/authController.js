const User = require("../models/User");
const Company = require("../models/Company");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

// Generate JWT Token
const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// Generate default avatar from user name
const getDefaultAvatar = (name) => {
    const base = "https://ui-avatars.com/api/";
    return `${base}?name=${encodeURIComponent(name)}&background=random&color=fff`;
};

// @desc    Register user (Admin with MASTER_ADMIN_TOKEN, Members with company invite token)
const registerUser = async (req, res) => {
    try {
        const { name, email, password, companyName, adminInviteToken } = req.body;

        // check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: "User already exists" });
        }

        // if creating a company + admin
        if (companyName && adminInviteToken === process.env.MASTER_ADMIN_TOKEN) {
            const companyToken = crypto.randomBytes(10).toString("hex");

            const company = await Company.create({
                name: companyName,
                adminInviteToken: companyToken,
            });

            const hashedPassword = await bcrypt.hash(password, 10);

            const admin = await User.create({
                name,
                email,
                password: hashedPassword,
                profileImageUrl: req.body.profileImageUrl || getDefaultAvatar(name),
                role: "admin",
                companyId: company._id,
            });

            return res.status(201).json({
                message: "Company and Admin created successfully",
                company: {
                    id: company._id,
                    name: company.name,
                    adminInviteToken: company.adminInviteToken,
                },
                user: {
                    _id: admin._id,
                    name: admin.name,
                    email: admin.email,
                    role: admin.role,
                    companyName: company.name,
                    profileImageUrl: admin.profileImageUrl,
                },
                token: generateToken(admin._id),
            });
        }

        // otherwise → registering a member
        const company = await Company.findOne({ adminInviteToken });
        if (!company) {
            return res.status(400).json({ message: "Invalid company invite token" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            profileImageUrl: req.body.profileImageUrl || getDefaultAvatar(name),
            role: "member",
            companyId: company._id,
        });

        res.status(201).json({
            message: "Member registered successfully",
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                companyName: company.name,
                profileImageUrl: user.profileImageUrl,
            },
            token: generateToken(user._id),
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Login
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email }).populate("companyId", "name");
        if (!user) return res.status(401).json({ message: "Invalid email or password" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: "Invalid email or password" });

        res.json({
            message: "Login successful",
            token: generateToken(user._id),
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                companyName: user.companyId?.name || null,
                profileImageUrl: user.profileImageUrl || null,
            },
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Get Profile
const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .populate("companyId", "name")
            .select("-password");

        if (!user) return res.status(404).json({ message: "User not found" });

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            companyName: user.companyId?.name || null,
            profileImageUrl: user.profileImageUrl || null,
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Update Profile
const updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: "User not found" });

        user.name = req.body.name || user.name;
        user.profileImageUrl = req.body.profileImageUrl || user.profileImageUrl;

        if (req.body.password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(req.body.password, salt);
        }

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            companyName: req.user.companyId?.name || null,
            profileImageUrl: updatedUser.profileImageUrl,
            token: generateToken(updatedUser._id),
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

module.exports = {
    registerUser,
    loginUser,
    getUserProfile,
    updateUserProfile,
};