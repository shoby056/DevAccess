const express = require("express");

const {
  getTeams,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam,
  addMember,
  removeMember,
} = require("../controllers/teamController");

const authMiddleware = require("../middleware/authMiddleware");
const requirePermission = require("../middleware/permissionMiddleware");

const router = express.Router();

// Get all teams
router.get(
  "/",
  authMiddleware,
  requirePermission("teams.read"),
  getTeams
);

// Get single team
router.get(
  "/:id",
  authMiddleware,
  requirePermission("teams.read"),
  getTeamById
);

// Create team
router.post(
  "/",
  authMiddleware,
  requirePermission("teams.create"),
  createTeam
);

// Update team
router.put(
  "/:id",
  authMiddleware,
  requirePermission("teams.update"),
  updateTeam
);

// Delete team
router.delete(
  "/:id",
  authMiddleware,
  requirePermission("teams.delete"),
  deleteTeam
);

// Add member
router.post(
  "/:id/members",
  authMiddleware,
  requirePermission("teams.update"),
  addMember
);

// Remove member
router.delete(
  "/:id/members",
  authMiddleware,
  requirePermission("teams.update"),
  removeMember
);

module.exports = router;