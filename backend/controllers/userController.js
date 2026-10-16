
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const Role = require("../models/Role");

// ==========================================
// GET ALL USERS
// ==========================================
const getUsers = async (req, res) => {
  try {
    const {
      search = "",
      role = "",
      status = "",
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Convert pagination values to numbers
    const currentPage = Math.max(Number(page), 1);
    const perPage = Math.min(Math.max(Number(limit), 1), 100);

    const skip = (currentPage - 1) * perPage;

    // Build filter
    const filter = {};

    // Search by name or email
    if (search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");

      filter.$or = [
        { name: searchRegex },
        { email: searchRegex },
      ];
    }

    // Filter by role
    if (role.trim()) {
      const selectedRole = await Role.findOne({
        name: role.trim().toUpperCase(),
      });

      if (!selectedRole) {
        return res.status(200).json({
          success: true,
          count: 0,
          pagination: {
            currentPage,
            totalPages: 0,
            totalUsers: 0,
            perPage,
            hasNextPage: false,
            hasPreviousPage: currentPage > 1,
          },
          data: {
            users: [],
          },
        });
      }

      filter.role = selectedRole._id;
    }

    // Filter by active/inactive status
    if (status.trim()) {
      const normalizedStatus = status.trim().toLowerCase();

      if (
        normalizedStatus !== "active" &&
        normalizedStatus !== "inactive"
      ) {
        return res.status(400).json({
          success: false,
          message: "Status must be active or inactive",
        });
      }

      filter.isActive = normalizedStatus === "active";
    }

    // Allowed sorting fields
    const allowedSortFields = [
      "name",
      "email",
      "createdAt",
      "updatedAt",
    ];

    const safeSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";

    const safeSortOrder = sortOrder === "asc" ? 1 : -1;

    // Get total matching users
    const totalUsers = await User.countDocuments(filter);

    // Get users
    const users = await User.find(filter)
      .populate("role", "name description")
      .select("-password")
      .sort({ [safeSortBy]: safeSortOrder })
      .skip(skip)
      .limit(perPage);

    // Calculate total pages
    const totalPages = Math.ceil(totalUsers / perPage);

    return res.status(200).json({
      success: true,
      count: users.length,

      pagination: {
        currentPage,
        totalPages,
        totalUsers,
        perPage,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1,
      },

      filters: {
        search,
        role,
        status,
        sortBy: safeSortBy,
        sortOrder: sortOrder === "asc" ? "asc" : "desc",
      },

      data: {
        users,
      },
    });
  } catch (error) {
    console.error("Get users error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error while getting users",
    });
  }
};

// ==========================================
// GET SINGLE USER
// ==========================================
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate("role", "name description")
      .select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    console.error("Get user error:", error.message);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error while getting user",
    });
  }
};

// ==========================================
// CREATE USER
// ==========================================
const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Basic validation
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email, password and role are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    // Check duplicate email
    const existingUser = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Find selected role
    const selectedRole = await Role.findOne({
      name: role.trim().toUpperCase(),
    });

    if (!selectedRole) {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: selectedRole._id,
      isActive: true,
    });

    const createdUser = await User.findById(user._id)
      .populate("role", "name description")
      .select("-password");

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      data: {
        user: createdUser,
      },
    });
  } catch (error) {
    console.error("Create user error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error while creating user",
    });
  }
};

// ==========================================
// UPDATE USER
// ==========================================
const updateUser = async (req, res) => {
  try {
    const { name, email } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update name
    if (name !== undefined) {
      if (name.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: "Name must be at least 2 characters",
        });
      }

      user.name = name.trim();
    }

    // Update email
    if (email !== undefined) {
      const normalizedEmail = email.toLowerCase().trim();

      const existingUser = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: user._id },
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Another user already has this email",
        });
      }

      user.email = normalizedEmail;
    }

    await user.save();

    const updatedUser = await User.findById(user._id)
      .populate("role", "name description")
      .select("-password");

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    console.error("Update user error:", error.message);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error while updating user",
    });
  }
};

// ==========================================
// DELETE USER
// ==========================================
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Prevent deleting yourself
    if (user._id.toString() === req.user.userId) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account",
      });
    }

    await User.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error.message);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error while deleting user",
    });
  }
};

// ==========================================
// CHANGE USER STATUS
// ==========================================
const updateUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be true or false",
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Prevent deactivating yourself
    if (
      user._id.toString() === req.user.userId &&
      isActive === false
    ) {
      return res.status(400).json({
        success: false,
        message: "You cannot deactivate your own account",
      });
    }

    user.isActive = isActive;

    await user.save();

    const updatedUser = await User.findById(user._id)
      .populate("role", "name description")
      .select("-password");

    return res.status(200).json({
      success: true,
      message: isActive
        ? "User activated successfully"
        : "User deactivated successfully",
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    console.error("Update user status error:", error.message);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error while updating user status",
    });
  }
};

// ==========================================
// CHANGE USER ROLE
// ==========================================
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({
        success: false,
        message: "Role is required",
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Find requested role
    const selectedRole = await Role.findOne({
      name: role.toUpperCase(),
    });

    if (!selectedRole) {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    // Prevent admin from changing their own role
    if (user._id.toString() === req.user.userId) {
      return res.status(400).json({
        success: false,
        message: "You cannot change your own role",
      });
    }

    user.role = selectedRole._id;

    await user.save();

    const updatedUser = await User.findById(user._id)
      .populate("role", "name description")
      .select("-password");

    return res.status(200).json({
      success: true,
      message: "User role updated successfully",
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    console.error("Update user role error:", error.message);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error while updating user role",
    });
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateUserStatus,
  updateUserRole,
};




