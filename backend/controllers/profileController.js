const bcrypt = require("bcryptjs");
const User = require("../models/User");
const logAudit = require("../utils/auditLog");

/*
GET MY PROFILE
*/
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.currentUser._id).populate(
      "role",
      "name"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      profile: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role?.name || null,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/*
UPDATE MY PROFILE
*/
const updateProfile = async (req, res, next) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }

    const trimmedName = name.trim();

    if (trimmedName.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Name must be at least 2 characters",
      });
    }

    if (trimmedName.length > 50) {
      return res.status(400).json({
        success: false,
        message: "Name cannot exceed 50 characters",
      });
    }

    const user = await User.findById(req.currentUser._id).populate(
      "role",
      "name"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const oldName = user.name;

    user.name = trimmedName;

    await user.save();

    await logAudit({
      req,
      action: "PROFILE_UPDATED",
      resource: "User",
      resourceId: user._id,
      details: `Profile name updated from "${oldName}" to "${user.name}"`,
    });

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      profile: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role?.name || null,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/*
CHANGE PASSWORD
*/
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters",
      });
    }

    const user = await User.findById(req.currentUser._id).select(
      "+password"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    const isSamePassword = await bcrypt.compare(
      newPassword,
      user.password
    );

    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from current password",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    user.password = hashedPassword;

    await user.save();

    await logAudit({
      req,
      action: "PASSWORD_CHANGED",
      resource: "User",
      resourceId: user._id,
      details: "User changed their account password",
    });

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
};