const Role = require("../models/Role");
const Permission = require("../models/Permission");

// Get all roles
const getRoles = async (req, res) => {
  try {
    const roles = await Role.find()
      .populate("permissions")
      .sort({ name: 1 });

    return res.status(200).json({
      success: true,
      count: roles.length,
      data: roles,
    });
  } catch (error) {
    console.error("Get roles error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error while getting roles",
    });
  }
};

// Get single role
const getRoleById = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id).populate("permissions");

    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: role,
    });
  } catch (error) {
    console.error("Get role error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error while getting role",
    });
  }
};

// Create role
const createRole = async (req, res) => {
  try {
    const { name, description, permissions } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Role name is required",
      });
    }

    const existingRole = await Role.findOne({
      name: name.toUpperCase(),
    });

    if (existingRole) {
      return res.status(400).json({
        success: false,
        message: "Role already exists",
      });
    }

    let permissionIds = [];

    if (permissions && Array.isArray(permissions)) {
      const permissionDocuments = await Permission.find({
        name: { $in: permissions },
      });

      if (permissionDocuments.length !== permissions.length) {
        return res.status(400).json({
          success: false,
          message: "One or more permissions are invalid",
        });
      }

      permissionIds = permissionDocuments.map(
        (permission) => permission._id
      );
    }

    const role = await Role.create({
      name: name.toUpperCase(),
      description,
      permissions: permissionIds,
    });

    const populatedRole = await Role.findById(role._id).populate(
      "permissions"
    );

    return res.status(201).json({
      success: true,
      message: "Role created successfully",
      data: populatedRole,
    });
  } catch (error) {
    console.error("Create role error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error while creating role",
    });
  }
};

// Update role
const updateRole = async (req, res) => {
  try {
    const { description, permissions } = req.body;

    const role = await Role.findById(req.params.id);

    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    // Prevent modifying system role name
    // Role names are intentionally fixed.
    if (permissions !== undefined) {
      if (!Array.isArray(permissions)) {
        return res.status(400).json({
          success: false,
          message: "Permissions must be an array",
        });
      }

      const permissionDocuments = await Permission.find({
        name: { $in: permissions },
      });

      if (permissionDocuments.length !== permissions.length) {
        return res.status(400).json({
          success: false,
          message: "One or more permissions are invalid",
        });
      }

      role.permissions = permissionDocuments.map(
        (permission) => permission._id
      );
    }

    if (description !== undefined) {
      role.description = description;
    }

    await role.save();

    const updatedRole = await Role.findById(role._id).populate(
      "permissions"
    );

    return res.status(200).json({
      success: true,
      message: "Role updated successfully",
      data: updatedRole,
    });
  } catch (error) {
    console.error("Update role error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error while updating role",
    });
  }
};

// Delete role
const deleteRole = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);

    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    // System roles should not be deleted.
    const protectedRoles = [
      "SUPER_ADMIN",
      "TEAM_LEAD",
      "DEVELOPER",
      "QA_ENGINEER",
      "AUDITOR",
    ];

    if (protectedRoles.includes(role.name)) {
      return res.status(400).json({
        success: false,
        message: "System roles cannot be deleted",
      });
    }

    await Role.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Role deleted successfully",
    });
  } catch (error) {
    console.error("Delete role error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error while deleting role",
    });
  }
};

module.exports = {
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
};