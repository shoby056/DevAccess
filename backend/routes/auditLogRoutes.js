const express = require("express");

const {
  getAuditLogs,
  getAuditLogById,
} = require("../controllers/auditLogController");

const authMiddleware = require("../middleware/authMiddleware");
const requirePermission = require("../middleware/permissionMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.get(
  "/",
  requirePermission("audit.read"),
  getAuditLogs
);

router.get(
  "/:id",
  requirePermission("audit.read"),
  getAuditLogById
);

module.exports = router;