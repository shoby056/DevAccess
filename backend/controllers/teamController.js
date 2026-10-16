const Team = require("../models/Team");
const User = require("../models/User");

// Get all teams
const getTeams = async (req, res) => {
  try {
    const {
      search = "",
      status = "",
      teamLead = "",
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const currentPage = Math.max(Number(page) || 1, 1);
    const perPage = Math.min(Math.max(Number(limit) || 10, 1), 100);

    const filter = {};

    // Search by team name
    if (search.trim()) {
      filter.name = {
        $regex: search.trim(),
        $options: "i",
      };
    }

    // Active / inactive filter
    if (status) {
      const normalizedStatus = status.toLowerCase();

      if (!["active", "inactive"].includes(normalizedStatus)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status. Use active or inactive",
        });
      }

      filter.isActive = normalizedStatus === "active";
    }

    // Filter by team lead
    if (teamLead) {
      const leadUser = await User.findById(teamLead).select("_id");

      if (!leadUser) {
        return res.status(200).json({
          success: true,
          teams: [],
          pagination: {
            currentPage,
            totalPages: 0,
            totalTeams: 0,
            perPage,
            hasNextPage: false,
            hasPreviousPage: currentPage > 1,
          },
        });
      }

      filter.teamLead = teamLead;
    }

    // Allowed sorting fields
    const allowedSortFields = [
      "name",
      "createdAt",
      "updatedAt",
      "isActive",
    ];

    if (!allowedSortFields.includes(sortBy)) {
      return res.status(400).json({
        success: false,
        message: `Invalid sortBy. Allowed values: ${allowedSortFields.join(
          ", "
        )}`,
      });
    }

    const sortDirection = sortOrder.toLowerCase() === "asc" ? 1 : -1;

    const skip = (currentPage - 1) * perPage;

    const [teams, totalTeams] = await Promise.all([
      Team.find(filter)
        .populate("teamLead", "name email")
        .populate("members", "name email")
        .sort({ [sortBy]: sortDirection })
        .skip(skip)
        .limit(perPage),

      Team.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalTeams / perPage);

    res.status(200).json({
      success: true,
      teams,
      pagination: {
        currentPage,
        totalPages,
        totalTeams,
        perPage,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1,
      },
    });
  } catch (error) {
    console.error("Get teams error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch teams",
    });
  }
};

// Get single team
const getTeamById = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate("teamLead", "name email")
      .populate("members", "name email");

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    res.status(200).json({
      success: true,
      team,
    });
  } catch (error) {
    console.error("Get team error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch team",
    });
  }
};

// Create team
const createTeam = async (req, res) => {
  try {
    const { name, description, teamLead } = req.body;

    if (!name || !teamLead) {
      return res.status(400).json({
        success: false,
        message: "Team name and team lead are required",
      });
    }

    // Check duplicate team name
    const existingTeam = await Team.findOne({
      name: name.trim(),
    });

    if (existingTeam) {
      return res.status(409).json({
        success: false,
        message: "A team with this name already exists",
      });
    }

    // Check team lead exists
    const leadUser = await User.findById(teamLead);

    if (!leadUser) {
      return res.status(404).json({
        success: false,
        message: "Team lead user not found",
      });
    }

    if (!leadUser.isActive) {
      return res.status(400).json({
        success: false,
        message: "Team lead account is inactive",
      });
    }

    const team = await Team.create({
      name: name.trim(),
      description: description?.trim(),
      teamLead,
      members: [teamLead],
    });

    const populatedTeam = await Team.findById(team._id)
      .populate("teamLead", "name email")
      .populate("members", "name email");

    res.status(201).json({
      success: true,
      message: "Team created successfully",
      team: populatedTeam,
    });
  } catch (error) {
    console.error("Create team error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create team",
    });
  }
};

// Update team
const updateTeam = async (req, res) => {
  try {
    const { name, description, teamLead, isActive } = req.body;

    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    if (name !== undefined) {
      const trimmedName = name.trim();

      const duplicateTeam = await Team.findOne({
        name: trimmedName,
        _id: { $ne: team._id },
      });

      if (duplicateTeam) {
        return res.status(409).json({
          success: false,
          message: "A team with this name already exists",
        });
      }

      team.name = trimmedName;
    }

    if (description !== undefined) {
      team.description = description.trim();
    }

    if (teamLead !== undefined) {
      const leadUser = await User.findById(teamLead);

      if (!leadUser) {
        return res.status(404).json({
          success: false,
          message: "Team lead user not found",
        });
      }

      if (!leadUser.isActive) {
        return res.status(400).json({
          success: false,
          message: "Team lead account is inactive",
        });
      }

      team.teamLead = teamLead;

      // Ensure new team lead is also a member
      if (!team.members.some((member) => member.toString() === teamLead)) {
        team.members.push(teamLead);
      }
    }

    if (isActive !== undefined) {
      if (typeof isActive !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "isActive must be a boolean",
        });
      }

      team.isActive = isActive;
    }

    await team.save();

    const updatedTeam = await Team.findById(team._id)
      .populate("teamLead", "name email")
      .populate("members", "name email");

    res.status(200).json({
      success: true,
      message: "Team updated successfully",
      team: updatedTeam,
    });
  } catch (error) {
    console.error("Update team error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update team",
    });
  }
};

// Delete team
const deleteTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    await Team.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Team deleted successfully",
    });
  } catch (error) {
    console.error("Delete team error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete team",
    });
  }
};

// Add member
const addMember = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }

    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.isActive) {
      return res.status(400).json({
        success: false,
        message: "Cannot add an inactive user",
      });
    }

    const alreadyMember = team.members.some(
      (member) => member.toString() === userId
    );

    if (alreadyMember) {
      return res.status(409).json({
        success: false,
        message: "User is already a team member",
      });
    }

    team.members.push(userId);

    await team.save();

    const updatedTeam = await Team.findById(team._id)
      .populate("teamLead", "name email")
      .populate("members", "name email");

    res.status(200).json({
      success: true,
      message: "Member added successfully",
      team: updatedTeam,
    });
  } catch (error) {
    console.error("Add member error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to add member",
    });
  }
};

// Remove member
const removeMember = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }

    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    // Team lead cannot be removed directly
    if (team.teamLead.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: "Team lead cannot be removed from the team",
      });
    }

    const memberExists = team.members.some(
      (member) => member.toString() === userId
    );

    if (!memberExists) {
      return res.status(404).json({
        success: false,
        message: "User is not a member of this team",
      });
    }

    team.members = team.members.filter(
      (member) => member.toString() !== userId
    );

    await team.save();

    const updatedTeam = await Team.findById(team._id)
      .populate("teamLead", "name email")
      .populate("members", "name email");

    res.status(200).json({
      success: true,
      message: "Member removed successfully",
      team: updatedTeam,
    });
  } catch (error) {
    console.error("Remove member error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to remove member",
    });
  }
};

module.exports = {
  getTeams,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam,
  addMember,
  removeMember,
};