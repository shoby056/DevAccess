
const AccessRequest = require("../models/AccessRequest");
const AccessGrant = require("../models/AccessGrant");
const Resource = require("../models/Resource");
const Project = require("../models/Project");
const User = require("../models/User");
const Role = require("../models/Role");

const createNotification = require("../utils/createNotification");
const logAudit = require("../utils/auditLog");

// CREATE ACCESS REQUEST
const createAccessRequest = async (req, res, next) => {
  try {
    const { resource, reason, requestedRole } = req.body;

    if (!req.currentUser?._id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!resource || !reason?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Resource and reason are required",
      });
    }

    const allowedRoles = ["READ", "WRITE", "ADMIN"];

    if (requestedRole && !allowedRoles.includes(requestedRole)) {
      return res.status(400).json({
        success: false,
        message: "Invalid requested role",
      });
    }

    const resourceExists = await Resource.findById(resource);

    if (!resourceExists) {
      return res.status(404).json({
        success: false,
        message: "Resource not found",
      });
    }

    if (!resourceExists.isActive) {
      return res.status(400).json({
        success: false,
        message: "This resource is inactive",
      });
    }

    const projectExists = await Project.findById(
      resourceExists.project
    );

    if (!projectExists) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    if (!projectExists.isActive) {
      return res.status(400).json({
        success: false,
        message: "This project is inactive",
      });
    }

    // Prevent duplicate pending requests
    const existingRequest = await AccessRequest.findOne({
      requester: req.currentUser._id,
      resource: resourceExists._id,
      status: "PENDING",
    });

    if (existingRequest) {
      return res.status(409).json({
        success: false,
        message:
          "You already have a pending request for this resource",
      });
    }

    // Prevent requests when active access already exists
    const existingGrant = await AccessGrant.findOne({
      user: req.currentUser._id,
      resource: resourceExists._id,
      isActive: true,
    });

    if (
      existingGrant &&
      (!existingGrant.expiresAt ||
        existingGrant.expiresAt > new Date())
    ) {
      return res.status(409).json({
        success: false,
        message:
          "You already have active access to this resource",
      });
    }

    // Create the access request
    const accessRequest = await AccessRequest.create({
      requester: req.currentUser._id,
      resource: resourceExists._id,
      project: projectExists._id,
      reason: reason.trim(),
      requestedRole: requestedRole || "READ",
    });

    const recipients = new Set();

    // Find the assigned project lead
    console.log("\n--- ACCESS REQUEST NOTIFICATIONS ---");
    console.log("Project:", projectExists.name);
    console.log("Project ID:", projectExists._id.toString());
    console.log(
      "Project Lead ID:",
      projectExists.projectLead
        ? projectExists.projectLead.toString()
        : "NOT ASSIGNED"
    );

    if (projectExists.projectLead) {
      const projectLead = await User.findOne({
        _id: projectExists.projectLead,
        isActive: true,
      }).select("_id name email");

      if (projectLead) {
        recipients.add(projectLead._id.toString());
        console.log("Assigned lead found:", projectLead.email);
      } else {
        console.warn(
          "Assigned project lead was not found or is inactive."
        );
      }
    }

    // Fallback when the project has no usable assigned lead
    if (recipients.size === 0) {
      const teamLeadRole = await Role.findOne({
        name: "TEAM_LEAD",
      });

      if (!teamLeadRole) {
        console.warn(
          "TEAM_LEAD role not found. Check the Role collection."
        );
      } else {
        const teamLeads = await User.find({
          role: teamLeadRole._id,
          isActive: true,
        }).select("_id name email");

        teamLeads.forEach((lead) => {
          recipients.add(lead._id.toString());
        });

        console.log(
          "Fallback Team Leads:",
          teamLeads.map((lead) => lead.email)
        );
      }
    }

    // Detect critical production access
    const isCriticalProduction =
      String(resourceExists.environment).toUpperCase() ===
        "PRODUCTION" &&
      String(resourceExists.sensitivity).toUpperCase() ===
        "CRITICAL";

    // Notify Super Admins for critical production requests
    if (isCriticalProduction) {
      const superAdminRole = await Role.findOne({
        name: "SUPER_ADMIN",
      });

      if (!superAdminRole) {
        console.warn("SUPER_ADMIN role not found.");
      } else {
        const superAdmins = await User.find({
          role: superAdminRole._id,
          isActive: true,
        }).select("_id name email");

        superAdmins.forEach((admin) => {
          recipients.add(admin._id.toString());
        });

        console.log(
          "Super Admin recipients:",
          superAdmins.map((admin) => admin.email)
        );
      }
    }

    console.log("Final notification recipients:", [...recipients]);

    const notificationMessage =
      `${req.currentUser.name || req.currentUser.email} has requested ` +
      `${accessRequest.requestedRole} access to ` +
      `"${resourceExists.name}" in project ` +
      `"${projectExists.name}".`;

    // Create notifications for all unique recipients
    const notificationResults = await Promise.all(
      [...recipients].map(async (recipientId) => {
        const notification = await createNotification({
          recipient: recipientId,
          title: isCriticalProduction
            ? "Critical Production Access Request"
            : "New Access Request",
          message: notificationMessage,
          type: "ACCESS_REQUEST_SUBMITTED",
          relatedResourceType: "AccessRequest",
          relatedResourceId: accessRequest._id,
        });

        console.log(
          `Notification for ${recipientId}:`,
          notification ? "CREATED" : "FAILED"
        );

        return notification;
      })
    );

    const createdCount = notificationResults.filter(Boolean).length;

    console.log(
      `Notifications created: ${createdCount} of ${recipients.size}`
    );

    if (recipients.size === 0) {
      console.warn(
        "No notification recipients found. Check projectLead and role assignments."
      );
    }

    const populatedRequest = await AccessRequest.findById(
      accessRequest._id
    )
      .populate("requester", "name email")
      .populate("resource", "name type environment sensitivity")
      .populate("project", "name status");

    await logAudit({
      req,
      action: "ACCESS_REQUEST_CREATED",
      resource: "AccessRequest",
      resourceId: accessRequest._id,
      details:
        `Access request created for resource "${resourceExists.name}"`,
    });

    return res.status(201).json({
      success: true,
      message: "Access request created successfully",
      accessRequest: populatedRequest,
    });
  } catch (error) {
    next(error);
  }
};

// GET ACCESS REQUESTS
const getAccessRequests = async (req, res, next) => {
  try {
    const {
      status,
      resource,
      project,
      requester,
      page = 1,
      limit = 10,
      sortOrder = "desc",
    } = req.query;

    const currentPage = Math.max(Number(page) || 1, 1);
    const perPage = Math.min(
      Math.max(Number(limit) || 10, 1),
      100
    );

    const filter = {};

    if (status) filter.status = status;
    if (resource) filter.resource = resource;
    if (project) filter.project = project;
    if (requester) filter.requester = requester;

    const sort = {
      createdAt: sortOrder === "asc" ? 1 : -1,
    };

    const [requests, total] = await Promise.all([
      AccessRequest.find(filter)
        .populate("requester", "name email")
        .populate("resource", "name type environment sensitivity")
        .populate("project", "name status")
        .populate("reviewedBy", "name email")
        .sort(sort)
        .skip((currentPage - 1) * perPage)
        .limit(perPage),

      AccessRequest.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      accessRequests: requests,
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

// GET SINGLE ACCESS REQUEST
const getAccessRequestById = async (req, res, next) => {
  try {
    const accessRequest = await AccessRequest.findById(
      req.params.id
    )
      .populate("requester", "name email")
      .populate("resource", "name type environment sensitivity")
      .populate("project", "name status")
      .populate("reviewedBy", "name email");

    if (!accessRequest) {
      return res.status(404).json({
        success: false,
        message: "Access request not found",
      });
    }

    return res.status(200).json({
      success: true,
      accessRequest,
    });
  } catch (error) {
    next(error);
  }
};

// APPROVE ACCESS REQUEST
const approveAccessRequest = async (req, res, next) => {
  try {
    const { reviewComment, expiresAt } = req.body;

    const accessRequest = await AccessRequest.findById(
      req.params.id
    );

    if (!accessRequest) {
      return res.status(404).json({
        success: false,
        message: "Access request not found",
      });
    }

    if (accessRequest.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "Only pending access requests can be approved",
      });
    }

    const resource = await Resource.findById(
      accessRequest.resource
    );

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: "Resource not found",
      });
    }

    if (!resource.isActive) {
      return res.status(400).json({
        success: false,
        message: "Resource is inactive",
      });
    }

    let expiryDate = null;

    if (expiresAt) {
      expiryDate = new Date(expiresAt);

      if (Number.isNaN(expiryDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid expiry date",
        });
      }

      if (expiryDate <= new Date()) {
        return res.status(400).json({
          success: false,
          message: "Expiry date must be in the future",
        });
      }
    }

    accessRequest.status = "APPROVED";
    accessRequest.reviewedBy = req.currentUser._id;
    accessRequest.reviewedAt = new Date();
    accessRequest.reviewComment = reviewComment?.trim() || "";

    await accessRequest.save();

    const accessGrant = await AccessGrant.create({
      user: accessRequest.requester,
      resource: accessRequest.resource,
      project: accessRequest.project,
      accessRequest: accessRequest._id,
      accessLevel: accessRequest.requestedRole,
      grantedBy: req.currentUser._id,
      startDate: new Date(),
      expiresAt: expiryDate,
    });

    const populatedGrant = await AccessGrant.findById(
      accessGrant._id
    )
      .populate("user", "name email")
      .populate("resource", "name type environment sensitivity")
      .populate("project", "name status")
      .populate("grantedBy", "name email")
      .populate("accessRequest");

    await logAudit({
      req,
      action: "ACCESS_REQUEST_APPROVED",
      resource: "AccessRequest",
      resourceId: accessRequest._id,
      details: `Access request approved for resource "${resource.name}"`,
    });

    await logAudit({
      req,
      action: "ACCESS_GRANTED",
      resource: "AccessGrant",
      resourceId: accessGrant._id,
      details: `Access granted to "${resource.name}"`,
    });

    await createNotification({
      recipient: accessRequest.requester,
      title: "Access Request Approved",
      message:
        `Your access request for "${resource.name}" has been approved.`,
      type: "ACCESS_REQUEST_APPROVED",
      relatedResourceType: "AccessRequest",
      relatedResourceId: accessRequest._id,
    });

    return res.status(200).json({
      success: true,
      message: "Access request approved and access granted successfully",
      accessRequest,
      accessGrant: populatedGrant,
    });
  } catch (error) {
    next(error);
  }
};

// REJECT ACCESS REQUEST
const rejectAccessRequest = async (req, res, next) => {
  try {
    const { reviewComment } = req.body;

    const accessRequest = await AccessRequest.findById(
      req.params.id
    ).populate("resource", "name");

    if (!accessRequest) {
      return res.status(404).json({
        success: false,
        message: "Access request not found",
      });
    }

    if (accessRequest.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "Only pending access requests can be rejected",
      });
    }

    accessRequest.status = "REJECTED";
    accessRequest.reviewedBy = req.currentUser._id;
    accessRequest.reviewedAt = new Date();
    accessRequest.reviewComment = reviewComment?.trim() || "";

    await accessRequest.save();

    await logAudit({
      req,
      action: "ACCESS_REQUEST_REJECTED",
      resource: "AccessRequest",
      resourceId: accessRequest._id,
      details:
        `Access request rejected for resource "${accessRequest.resource.name}"`,
    });

    await createNotification({
      recipient: accessRequest.requester,
      title: "Access Request Rejected",
      message:
        `Your access request for "${accessRequest.resource.name}" has been rejected.`,
      type: "ACCESS_REQUEST_REJECTED",
      relatedResourceType: "AccessRequest",
      relatedResourceId: accessRequest._id,
    });

    return res.status(200).json({
      success: true,
      message: "Access request rejected successfully",
      accessRequest,
    });
  } catch (error) {
    next(error);
  }
};

// CANCEL ACCESS REQUEST
const cancelAccessRequest = async (req, res, next) => {
  try {
    const accessRequest = await AccessRequest.findById(
      req.params.id
    ).populate("resource", "name");

    if (!accessRequest) {
      return res.status(404).json({
        success: false,
        message: "Access request not found",
      });
    }

    if (
      accessRequest.requester.toString() !==
      req.currentUser._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only cancel your own access request",
      });
    }

    if (accessRequest.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "Only pending requests can be cancelled",
      });
    }

    accessRequest.status = "CANCELLED";
    await accessRequest.save();

    await logAudit({
      req,
      action: "ACCESS_REQUEST_CANCELLED",
      resource: "AccessRequest",
      resourceId: accessRequest._id,
      details:
        `Access request cancelled for resource "${accessRequest.resource.name}"`,
    });

    return res.status(200).json({
      success: true,
      message: "Access request cancelled successfully",
      accessRequest,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAccessRequest,
  getAccessRequests,
  getAccessRequestById,
  approveAccessRequest,
  rejectAccessRequest,
  cancelAccessRequest,
};
