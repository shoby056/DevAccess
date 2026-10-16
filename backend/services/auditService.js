const AuditLog = require("../models/AuditLog");

const createAuditLog = async ({
  user,
  action,
  resource,
  resourceId,
  details = "",
  ipAddress = "",
  userAgent = "",
}) => {
  try {
    const auditLog = await AuditLog.create({
      user,
      action,
      resource,
      resourceId,
      details,
      ipAddress,
      userAgent,
    });

    return auditLog;
  } catch (error) {
    console.error("Audit log error:", error.message);

    // Audit failure should not break the main operation
    return null;
  }
};

module.exports = {
  createAuditLog,
};