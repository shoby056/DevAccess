const express = require("express");

const {
  getAccessGrants,
  getAccessGrantById,
  revokeAccessGrant,
} = require("../controllers/accessGrantController");

const authMiddleware = require("../middleware/authMiddleware");
const requirePermission = require("../middleware/permissionMiddleware");

const router = express.Router();

router.use(authMiddleware);

/*
=========================================================
ACCESS GRANTS
=========================================================
*/

// Get all grants
router.get(
  "/",
  requirePermission("access.read"),
  getAccessGrants
);

// Get single grant
router.get(
  "/:id",
  requirePermission("access.read"),
  getAccessGrantById
);

// Revoke grant
router.patch(
  "/:id/revoke",
  requirePermission("access.revoke"),
  revokeAccessGrant
);

module.exports = router;