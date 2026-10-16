const express = require("express");

const {
  createResource,
  getResources,
  getResourceById,
  updateResource,
  updateResourceStatus,
  deleteResource,
} = require("../controllers/resourceController");

const authMiddleware = require("../middleware/authMiddleware");
const requirePermission = require("../middleware/permissionMiddleware");

const router = express.Router();

router.use(authMiddleware);

// Read resources
router.get(
  "/",
  requirePermission("resources.read"),
  getResources
);

router.get(
  "/:id",
  requirePermission("resources.read"),
  getResourceById
);

// Create resource
router.post(
  "/",
  requirePermission("resources.create"),
  createResource
);

// Update resource
router.put(
  "/:id",
  requirePermission("resources.update"),
  updateResource
);

// Activate / deactivate
router.patch(
  "/:id/status",
  requirePermission("resources.update"),
  updateResourceStatus
);

// Delete resource
router.delete(
  "/:id",
  requirePermission("resources.delete"),
  deleteResource
);

module.exports = router;