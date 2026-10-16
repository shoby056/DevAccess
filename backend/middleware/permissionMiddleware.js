const User = require("../models/User");

const requirePermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      // Authentication middleware must run first
      if (!req.user || !req.user.userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      // Get current user with role and permissions
      const user = await User.findById(req.user.userId).populate({
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

      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: "Your account is inactive",
        });
      }

      if (!user.role) {
        return res.status(403).json({
          success: false,
          message: "No role assigned to this user",
        });
      }

      const hasPermission = user.role.permissions.some(
        (permission) => permission.name === requiredPermission
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: `Permission denied: ${requiredPermission}`,
        });
      }

      // Store current user for controllers
      req.currentUser = user;

      next();
    } catch (error) {
      console.error("Permission middleware error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Server error while checking permission",
      });
    }
  };
};

module.exports = requirePermission;