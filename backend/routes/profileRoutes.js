const express = require("express");

const {
  getProfile,
  updateProfile,
  changePassword,
} = require("../controllers/profileController");

const authMiddleware = require("../middleware/authMiddleware");
const requirePermission = require("../middleware/permissionMiddleware");

const router = express.Router();

router.use(authMiddleware);

// Get current user's profile
router.get(
  "/",
  requirePermission("profile.read"),
  getProfile
);

// Update current user's profile
router.put(
  "/",
  requirePermission("profile.update"),
  updateProfile
);

// Change current user's password
router.put(
  "/password",
  requirePermission("profile.update"),
  changePassword
);

module.exports = router;