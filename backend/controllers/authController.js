const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Role = require("../models/Role");
const Permission = require("../models/Permission");
const generateToken = require("../utils/generateToken");

// Register a new user
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    // Check whether email already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Find the default role
    const developerRole = await Role.findOne({
      name: "DEVELOPER",
    });

    if (!developerRole) {
      return res.status(500).json({
        success: false,
        message: "Default DEVELOPER role not found",
      });
    }

    // Hash password before saving
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: developerRole._id,
    });

    // Generate JWT
    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: developerRole.name,
          isActive: user.isActive,
        },
      },
    });
  } catch (error) {
    console.error("Register error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error during registration",
    });
  }
};

// Login existing user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find user and include password
    const user = await User.findOne({ email })
      .select("+password")
      .populate("role");

    // Invalid credentials
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check account status
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive",
      });
    }

    // Compare password
    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Generate JWT
    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role.name,
          isActive: user.isActive,
        },
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
};

// Get currently logged-in user
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .populate({
        path: "role",
        populate: {
          path: "permissions",
          model: "Permission",
        },
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role.name,
          permissions: user.role.permissions.map(
            (permission) => permission.name
          ),
          isActive: user.isActive,
        },
      },
    });
  } catch (error) {
    console.error("Get user error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error while getting user",
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
};