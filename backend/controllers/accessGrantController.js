
const AccessGrant = require("../models/AccessGrant");
const createNotification = require("../utils/createNotification");
const logAudit = require("../utils/auditLog");

// GET ACCESS GRANTS
const getAccessGrants = async (req, res, next) => {
  try {
    const {
      user,
      resource,
      project,
      isActive,
      page = 1,
      limit = 10,
    } = req.query;

    const currentPage = Math.max(Number(page) || 1, 1);
    const perPage = Math.min(
      Math.max(Number(limit) || 10, 1),
      100
    );

    const filter = {};

    if (user) filter.user = user;
    if (resource) filter.resource = resource;
    if (project) filter.project = project;

    if (isActive !== undefined) {
      filter.isActive = isActive === "true";
    }

    const [grants, total] = await Promise.all([
      AccessGrant.find(filter)
        .populate("user", "name email")
        .populate("resource", "name type environment sensitivity")
        .populate("project", "name status")
        .populate("grantedBy", "name email")
        .populate("revokedBy", "name email")
        .sort({ createdAt: -1 })
        .skip((currentPage - 1) * perPage)
        .limit(perPage),

      AccessGrant.countDocuments(filter),
    ]);

    const now = new Date();

    const grantsWithStatus = grants.map((grant) => {
      const item = grant.toObject();

      const isExpired =
        grant.expiresAt && grant.expiresAt <= now;

      item.isExpired = Boolean(isExpired);

      if (isExpired && grant.isActive) {
        item.effectiveStatus = "EXPIRED";
      } else if (!grant.isActive) {
        item.effectiveStatus = "REVOKED";
      } else {
        item.effectiveStatus = "ACTIVE";
      }

      return item;
    });

    res.status(200).json({
      success: true,
      accessGrants: grantsWithStatus,
      pagination: {
        currentPage,
        totalPages: Math.ceil(total / perPage),
        totalItems: total,
        itemsPerPage: perPage,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET SINGLE ACCESS GRANT
const getAccessGrantById = async (req, res, next) => {
  try {
    const grant = await AccessGrant.findById(req.params.id)
      .populate("user", "name email")
      .populate("resource", "name type environment sensitivity")
      .populate("project", "name status")
      .populate("grantedBy", "name email")
      .populate("revokedBy", "name email")
      .populate("accessRequest");

    if (!grant) {
      return res.status(404).json({
        success: false,
        message: "Access grant not found",
      });
    }

    const isExpired =
      Boolean(grant.expiresAt) &&
      grant.expiresAt <= new Date();

    let effectiveStatus = "ACTIVE";

    if (!grant.isActive) {
      effectiveStatus = "REVOKED";
    } else if (isExpired) {
      effectiveStatus = "EXPIRED";
    }

    res.status(200).json({
      success: true,
      accessGrant: {
        ...grant.toObject(),
        isExpired,
        effectiveStatus,
      },
    });
  } catch (error) {
    next(error);
  }
};

// REVOKE ACCESS
const revokeAccessGrant = async (req, res, next) => {
  try {
    const { revokeReason } = req.body;

    const grant = await AccessGrant.findById(
      req.params.id
    ).populate("resource", "name");

    if (!grant) {
      return res.status(404).json({
        success: false,
        message: "Access grant not found",
      });
    }

    if (!grant.isActive) {
      return res.status(400).json({
        success: false,
        message: "This access grant has already been revoked",
      });
    }

    grant.isActive = false;
    grant.revokedAt = new Date();
    grant.revokedBy = req.currentUser._id;
    grant.revokeReason = revokeReason?.trim() || "";

    await grant.save();

    await logAudit({
      req,
      action: "ACCESS_REVOKED",
      resource: "AccessGrant",
      resourceId: grant._id,
      details: `Access revoked for resource "${grant.resource.name}"`,
    });

    await createNotification({
      recipient: grant.user,
      title: "Access Revoked",
      message: `Your access to "${grant.resource.name}" has been revoked.`,
      type: "ACCESS_REVOKED",
      relatedResourceType: "AccessGrant",
      relatedResourceId: grant._id,
    });

    res.status(200).json({
      success: true,
      message: "Access revoked successfully",
      accessGrant: grant,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAccessGrants,
  getAccessGrantById,
  revokeAccessGrant,
};
