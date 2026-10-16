const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const requirePermission = require("../middleware/permissionMiddleware");

const {
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
} = require("../controllers/roleController");

const router = express.Router();

// Get all roles
router.get(
  "/",
  authMiddleware,
  requirePermission("roles.read"),
  getRoles
);

// Get single role
router.get(
  "/:id",
  authMiddleware,
  requirePermission("roles.read"),
  getRoleById
);

// Create role
router.post(
  "/",
  authMiddleware,
  requirePermission("roles.update"),
  createRole
);

// Update role
router.put(
  "/:id",
  authMiddleware,
  requirePermission("roles.update"),
  updateRole
);

// Delete role
router.delete(
  "/:id",
  authMiddleware,
  requirePermission("roles.update"),
  deleteRole
);

module.exports = router;