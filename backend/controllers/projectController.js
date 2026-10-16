
const Project = require("../models/Project");
const Team = require("../models/Team");
const User = require("../models/User");
const logAudit = require("../utils/auditLog");

// =========================================================
// CREATE PROJECT
// =========================================================
const createProject = async (req, res, next) => {
  try {
    const { name, description, team, projectLead, status } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      !team ||
      !projectLead
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, team and project lead are required",
      });
    }

    const teamExists = await Team.findById(team);

    if (!teamExists) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    const leadExists = await User.findById(projectLead);

    if (!leadExists) {
      return res.status(404).json({
        success: false,
        message: "Project lead not found",
      });
    }

    const isTeamMember = teamExists.members.some(
      (member) => member.toString() === projectLead.toString()
    );

    if (!isTeamMember) {
      return res.status(400).json({
        success: false,
        message: "Project lead must be a member of the selected team",
      });
    }

    const existingProject = await Project.findOne({
      name: name.trim(),
      team,
    });

    if (existingProject) {
      return res.status(409).json({
        success: false,
        message: "A project with this name already exists in this team",
      });
    }

    const project = await Project.create({
      name: name.trim(),
      description:
        typeof description === "string" ? description.trim() : "",
      team,
      projectLead,
      status: status || "PLANNING",
      createdBy: req.currentUser._id,
    });

    const populatedProject = await Project.findById(project._id)
      .populate("team", "name")
      .populate("projectLead", "name email")
      .populate("createdBy", "name email");

    await logAudit({
      req,
      action: "PROJECT_CREATED",
      resource: "Project",
      resourceId: project._id,
      details: `Project "${project.name}" created`,
    });

    return res.status(201).json({
      success: true,
      message: "Project created successfully",
      project: populatedProject,
    });
  } catch (error) {
    next(error);
  }
};

// =========================================================
// GET ALL PROJECTS
// =========================================================
const getProjects = async (req, res, next) => {
  try {
    const {
      search = "",
      status,
      team,
      isActive,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const currentPage = Math.max(1, Number(page) || 1);
    const perPage = Math.min(
      100,
      Math.max(1, Number(limit) || 10)
    );
    const skip = (currentPage - 1) * perPage;

    const filter = {};

    // Search project name and description
    if (typeof search === "string" && search.trim()) {
      const escapedSearch = search.trim().replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

      filter.$or = [
        {
          name: {
            $regex: escapedSearch,
            $options: "i",
          },
        },
        {
          description: {
            $regex: escapedSearch,
            $options: "i",
          },
        },
      ];
    }

    // Filter by project status
    if (status) {
      filter.status = status;
    }

    // Filter by team
    if (team) {
      filter.team = team;
    }

    // IMPORTANT:
    // Empty/undefined means "All Projects".
    // Only filter when the user explicitly chooses true or false.
    if (isActive === "true" || isActive === "false") {
      filter.isActive = isActive === "true";
    }

    const allowedSortFields = [
      "name",
      "status",
      "createdAt",
      "updatedAt",
    ];

    const safeSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";

    const safeSortOrder = sortOrder === "asc" ? 1 : -1;

    const [projects, total] = await Promise.all([
      Project.find(filter)
        .populate("team", "name")
        .populate("projectLead", "name email")
        .populate("createdBy", "name email")
        .sort({ [safeSortBy]: safeSortOrder })
        .skip(skip)
        .limit(perPage),

      Project.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      projects,
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

// =========================================================
// GET SINGLE PROJECT
// =========================================================
const getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("team", "name description")
      .populate("projectLead", "name email role")
      .populate("createdBy", "name email");

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    return res.status(200).json({
      success: true,
      project,
    });
  } catch (error) {
    next(error);
  }
};

// =========================================================
// UPDATE PROJECT
// =========================================================
const updateProject = async (req, res, next) => {
  try {
    const {
      name,
      description,
      team,
      projectLead,
      status,
    } = req.body;

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const finalTeamId = team || project.team;
    const finalProjectLead = projectLead || project.projectLead;

    const teamExists = await Team.findById(finalTeamId);

    if (!teamExists) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    const leadExists = await User.findById(finalProjectLead);

    if (!leadExists) {
      return res.status(404).json({
        success: false,
        message: "Project lead not found",
      });
    }

    const isTeamMember = teamExists.members.some(
      (member) =>
        member.toString() === finalProjectLead.toString()
    );

    if (!isTeamMember) {
      return res.status(400).json({
        success: false,
        message: "Project lead must be a member of the selected team",
      });
    }

    // Prevent duplicate project names within the same team
    const finalName =
      typeof name === "string" ? name.trim() : project.name;

    const duplicateProject = await Project.findOne({
      _id: { $ne: project._id },
      name: finalName,
      team: finalTeamId,
    });

    if (duplicateProject) {
      return res.status(409).json({
        success: false,
        message: "A project with this name already exists in this team",
      });
    }

    project.team = finalTeamId;
    project.projectLead = finalProjectLead;

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Project name cannot be empty",
        });
      }

      project.name = name.trim();
    }

    if (description !== undefined) {
      project.description =
        typeof description === "string" ? description.trim() : "";
    }

    if (status !== undefined) {
      project.status = status;
    }

    await project.save();

    const updatedProject = await Project.findById(project._id)
      .populate("team", "name")
      .populate("projectLead", "name email")
      .populate("createdBy", "name email");

    await logAudit({
      req,
      action: "PROJECT_UPDATED",
      resource: "Project",
      resourceId: project._id,
      details: `Project "${project.name}" updated`,
    });

    return res.status(200).json({
      success: true,
      message: "Project updated successfully",
      project: updatedProject,
    });
  } catch (error) {
    next(error);
  }
};

// =========================================================
// UPDATE PROJECT ACTIVE STATUS
// =========================================================
const updateProjectStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be true or false",
      });
    }

    const existingProject = await Project.findById(req.params.id);

    if (!existingProject) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { isActive },
      {
        new: true,
        runValidators: true,
      }
    )
      .populate("team", "name")
      .populate("projectLead", "name email")
      .populate("createdBy", "name email");

    await logAudit({
      req,
      action: "PROJECT_STATUS_CHANGED",
      resource: "Project",
      resourceId: project._id,
      details: `Project "${project.name}" ${
        isActive ? "activated" : "deactivated"
      }`,
    });

    return res.status(200).json({
      success: true,
      message: `Project ${
        isActive ? "activated" : "deactivated"
      } successfully`,
      project,
    });
  } catch (error) {
    next(error);
  }
};

// =========================================================
// DELETE PROJECT
// =========================================================
const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const projectId = project._id;
    const projectName = project.name;

    await project.deleteOne();

    await logAudit({
      req,
      action: "PROJECT_DELETED",
      resource: "Project",
      resourceId: projectId,
      details: `Project "${projectName}" deleted`,
    });

    return res.status(200).json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// =========================================================
// EXPORT CONTROLLERS
// =========================================================
module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  updateProjectStatus,
  deleteProject,
};
