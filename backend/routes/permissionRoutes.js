const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const requirePermission = require("../middleware/permissionMiddleware");

const {
  getPermissions,
  getPermissionById,
} = require("../controllers/permissionController");

const router = express.Router();

// View all permissions
router.get(
  "/",
  authMiddleware,
  requirePermission("roles.read"),
  getPermissions
);

// View single permission
router.get(
  "/:id",
  authMiddleware,
  requirePermission("roles.read"),
  getPermissionById
);

module.exports = router;