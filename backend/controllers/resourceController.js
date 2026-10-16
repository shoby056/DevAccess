const Resource = require("../models/Resource");
const Project = require("../models/Project");
const logAudit = require("../utils/auditLog");

/*
=========================================================
CREATE RESOURCE
=========================================================
*/

const createResource = async (req, res, next) => {
  try {
    const {
      name,
      type,
      description,
      project,
      environment,
      url,
      sensitivity,
    } = req.body;

    // Validate required fields
    if (!name || !project) {
      return res.status(400).json({
        success: false,
        message: "Name and project are required",
      });
    }

    // Check project
    const projectExists = await Project.findById(project);

    if (!projectExists) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Check duplicate resource inside same project
    const existingResource = await Resource.findOne({
      name: name.trim(),
      project,
    });

    if (existingResource) {
      return res.status(409).json({
        success: false,
        message: "A resource with this name already exists in this project",
      });
    }

    const resource = await Resource.create({
      name: name.trim(),
      type: type || "OTHER",
      description: description?.trim() || "",
      project,
      environment: environment || "DEVELOPMENT",
      url: url?.trim() || "",
      sensitivity: sensitivity || "MEDIUM",
      createdBy: req.currentUser._id,
    });

    const populatedResource = await Resource.findById(resource._id)
      .populate("project", "name status")
      .populate("createdBy", "name email");

    // Audit
    await logAudit({
      req,
      action: "RESOURCE_CREATED",
      resource: "Resource",
      resourceId: resource._id,
      details: `Resource "${resource.name}" created`,
    });

    res.status(201).json({
      success: true,
      message: "Resource created successfully",
      resource: populatedResource,
    });
  } catch (error) {
    next(error);
  }
};

/*
=========================================================
GET ALL RESOURCES
=========================================================
*/

const getResources = async (req, res, next) => {
  try {
    const {
      search = "",
      type,
      environment,
      sensitivity,
      project,
      isActive,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const currentPage = Math.max(Number(page), 1);

    const perPage = Math.min(
      Math.max(Number(limit), 1),
      100
    );

    const skip = (currentPage - 1) * perPage;

    const filter = {};

    // Search
    if (search.trim()) {
      filter.$or = [
        {
          name: {
            $regex: search.trim(),
            $options: "i",
          },
        },
        {
          description: {
            $regex: search.trim(),
            $options: "i",
          },
        },
      ];
    }

    // Filters
    if (type) {
      filter.type = type;
    }

    if (environment) {
      filter.environment = environment;
    }

    if (sensitivity) {
      filter.sensitivity = sensitivity;
    }

    if (project) {
      filter.project = project;
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === "true";
    }

    // Safe sorting
    const allowedSortFields = [
      "name",
      "type",
      "environment",
      "sensitivity",
      "createdAt",
      "updatedAt",
    ];

    const safeSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";

    const safeSortOrder =
      sortOrder === "asc" ? 1 : -1;

    const [resources, total] = await Promise.all([
      Resource.find(filter)
        .populate("project", "name status")
        .populate("createdBy", "name email")
        .sort({
          [safeSortBy]: safeSortOrder,
        })
        .skip(skip)
        .limit(perPage),

      Resource.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / perPage);

    res.status(200).json({
      success: true,
      resources,

      pagination: {
        currentPage,
        totalPages,
        totalItems: total,
        itemsPerPage: perPage,
      },
    });
  } catch (error) {
    next(error);
  }
};

/*
=========================================================
GET SINGLE RESOURCE
=========================================================
*/

const getResourceById = async (req, res, next) => {
  try {
    const resource = await Resource.findById(req.params.id)
      .populate("project", "name description status")
      .populate("createdBy", "name email");

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: "Resource not found",
      });
    }

    res.status(200).json({
      success: true,
      resource,
    });
  } catch (error) {
    next(error);
  }
};

/*
=========================================================
UPDATE RESOURCE
=========================================================
*/

const updateResource = async (req, res, next) => {
  try {
    const {
      name,
      type,
      description,
      project,
      environment,
      url,
      sensitivity,
    } = req.body;

    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: "Resource not found",
      });
    }

    const finalProjectId = project || resource.project;

    const projectExists = await Project.findById(finalProjectId);

    if (!projectExists) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const finalName = name !== undefined
      ? name.trim()
      : resource.name;

    // Check duplicate name in project
    const duplicateResource = await Resource.findOne({
      _id: { $ne: resource._id },
      name: finalName,
      project: finalProjectId,
    });

    if (duplicateResource) {
      return res.status(409).json({
        success: false,
        message: "A resource with this name already exists in this project",
      });
    }

    resource.name = finalName;
    resource.project = finalProjectId;

    if (type !== undefined) {
      resource.type = type;
    }

    if (description !== undefined) {
      resource.description = description.trim();
    }

    if (environment !== undefined) {
      resource.environment = environment;
    }

    if (url !== undefined) {
      resource.url = url.trim();
    }

    if (sensitivity !== undefined) {
      resource.sensitivity = sensitivity;
    }

    await resource.save();

    const updatedResource = await Resource.findById(resource._id)
      .populate("project", "name status")
      .populate("createdBy", "name email");

    // Audit
    await logAudit({
      req,
      action: "RESOURCE_UPDATED",
      resource: "Resource",
      resourceId: resource._id,
      details: `Resource "${resource.name}" updated`,
    });

    res.status(200).json({
      success: true,
      message: "Resource updated successfully",
      resource: updatedResource,
    });
  } catch (error) {
    next(error);
  }
};

/*
=========================================================
UPDATE RESOURCE ACTIVE STATUS
=========================================================
*/

const updateResourceStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be true or false",
      });
    }

    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: "Resource not found",
      });
    }

    resource.isActive = isActive;

    await resource.save();

    const updatedResource = await Resource.findById(resource._id)
      .populate("project", "name status")
      .populate("createdBy", "name email");

    // Audit
    await logAudit({
      req,
      action: "RESOURCE_STATUS_CHANGED",
      resource: "Resource",
      resourceId: resource._id,
      details: `Resource "${resource.name}" ${
        isActive ? "activated" : "deactivated"
      }`,
    });

    res.status(200).json({
      success: true,
      message: `Resource ${
        isActive ? "activated" : "deactivated"
      } successfully`,
      resource: updatedResource,
    });
  } catch (error) {
    next(error);
  }
};

/*
=========================================================
DELETE RESOURCE
=========================================================
*/

const deleteResource = async (req, res, next) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: "Resource not found",
      });
    }

    const resourceId = resource._id;
    const resourceName = resource.name;

    await resource.deleteOne();

    // Audit
    await logAudit({
      req,
      action: "RESOURCE_DELETED",
      resource: "Resource",
      resourceId,
      details: `Resource "${resourceName}" deleted`,
    });

    res.status(200).json({
      success: true,
      message: "Resource deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createResource,
  getResources,
  getResourceById,
  updateResource,
  updateResourceStatus,
  deleteResource,
};