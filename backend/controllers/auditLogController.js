const AuditLog = require("../models/AuditLog");

// Get audit logs
const getAuditLogs = async (req, res) => {
  try {
    const {
      action = "",
      user = "",
      resource = "",
      page = 1,
      limit = 10,
      sortOrder = "desc",
    } = req.query;

    const currentPage = Math.max(Number(page) || 1, 1);
    const perPage = Math.min(Math.max(Number(limit) || 10, 1), 100);

    const filter = {};

    if (action.trim()) {
      filter.action = action.trim();
    }

    if (user.trim()) {
      filter.user = user.trim();
    }

    if (resource.trim()) {
      filter.resource = resource.trim();
    }

    const sortDirection =
      sortOrder.toLowerCase() === "asc" ? 1 : -1;

    const skip = (currentPage - 1) * perPage;

    const [logs, totalLogs] = await Promise.all([
      AuditLog.find(filter)
        .populate("user", "name email")
        .sort({ createdAt: sortDirection })
        .skip(skip)
        .limit(perPage),

      AuditLog.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalLogs / perPage);

    return res.status(200).json({
      success: true,
      auditLogs: logs,
      pagination: {
        currentPage,
        totalPages,
        totalLogs,
        perPage,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1,
      },
    });
  } catch (error) {
    console.error("Get audit logs error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch audit logs",
    });
  }
};

// Get single audit log
const getAuditLogById = async (req, res) => {
  try {
    const auditLog = await AuditLog.findById(req.params.id).populate(
      "user",
      "name email"
    );

    if (!auditLog) {
      return res.status(404).json({
        success: false,
        message: "Audit log not found",
      });
    }

    return res.status(200).json({
      success: true,
      auditLog,
    });
  } catch (error) {
    console.error("Get audit log error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch audit log",
    });
  }
};

module.exports = {
  getAuditLogs,
  getAuditLogById,
};