const express = require("express");

const {
  createAccessRequest,
  getAccessRequests,
  getAccessRequestById,
  approveAccessRequest,
  rejectAccessRequest,
  cancelAccessRequest,
} = require("../controllers/accessRequestController");

const authMiddleware = require("../middleware/authMiddleware");
const requirePermission = require("../middleware/permissionMiddleware");

const router = express.Router();

router.use(authMiddleware);

/*
=========================================================
ACCESS REQUESTS
=========================================================
*/

// Create request
router.post(
  "/",
  requirePermission("access.request"),
  createAccessRequest
);

// Get requests
router.get(
  "/",
  requirePermission("access.read"),
  getAccessRequests
);

// Get single request
router.get(
  "/:id",
  requirePermission("access.read"),
  getAccessRequestById
);

// Approve request
router.patch(
  "/:id/approve",
  requirePermission("access.approve"),
  approveAccessRequest
);

// Reject request
router.patch(
  "/:id/reject",
  requirePermission("access.reject"),
  rejectAccessRequest
);

// Cancel own request
router.patch(
  "/:id/cancel",
  requirePermission("access.request"),
  cancelAccessRequest
);

module.exports = router;