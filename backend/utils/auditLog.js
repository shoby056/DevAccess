const { createAuditLog } = require("../services/auditService");

const logAudit = async ({
  req,
  action,
  resource,
  resourceId,
  details = "",
}) => {
  if (!req.currentUser) {
    return;
  }

  await createAuditLog({
    user: req.currentUser._id,
    action,
    resource,
    resourceId,
    details,
    ipAddress: req.ip,
    userAgent: req.get("user-agent") || "",
  });
};

module.exports = logAudit;