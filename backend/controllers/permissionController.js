const Permission = require("../models/Permission");

// Get all permissions
const getPermissions = async (req, res) => {
  try {
    const permissions = await Permission.find().sort({ name: 1 });

    return res.status(200).json({
      success: true,
      count: permissions.length,
      data: permissions,
    });
  } catch (error) {
    console.error("Get permissions error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error while getting permissions",
    });
  }
};

// Get single permission
const getPermissionById = async (req, res) => {
  try {
    const permission = await Permission.findById(req.params.id);

    if (!permission) {
      return res.status(404).json({
        success: false,
        message: "Permission not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: permission,
    });
  } catch (error) {
    console.error("Get permission error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error while getting permission",
    });
  }
};

module.exports = {
  getPermissions,
  getPermissionById,
};