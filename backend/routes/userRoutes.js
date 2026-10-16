const express = require("express");

const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateUserStatus,
  updateUserRole,
} = require("../controllers/userController");

const authMiddleware = require("../middleware/authMiddleware");
const requirePermission = require("../middleware/permissionMiddleware");

const router = express.Router();

// Get all users
router.get(
  "/",
  authMiddleware,
  requirePermission("users.read"),
  getUsers
);

// Get single user
router.get(
  "/:id",
  authMiddleware,
  requirePermission("users.read"),
  getUserById
);

// Create user
router.post(
  "/",
  authMiddleware,
  requirePermission("users.create"),
  createUser
);

// Update user
router.put(
  "/:id",
  authMiddleware,
  requirePermission("users.update"),
  updateUser
);

// Delete user
router.delete(
  "/:id",
  authMiddleware,
  requirePermission("users.delete"),
  deleteUser
);

// Activate / deactivate user
router.patch(
  "/:id/status",
  authMiddleware,
  requirePermission("users.update"),
  updateUserStatus
);

// Change user role
router.patch(
  "/:id/role",
  authMiddleware,
  requirePermission("roles.update"),
  updateUserRole
);

module.exports = router;