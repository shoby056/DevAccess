
import { useEffect, useState } from "react";

import projectService from "../../services/projectService";
import teamService from "../../services/teamService";
import userService from "../../services/userService";

import useAuth from "../../hooks/useAuth";
import PermissionGate from "../../components/PermissionGate";

const DEFAULT_PAGINATION = {
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  itemsPerPage: 10,
};

// Safely extract arrays from different API response formats.
const extractList = (response, key) => {
  const payload = response?.data ?? response;

  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.[key])) {
    return payload[key];
  }

  if (Array.isArray(payload?.data?.[key])) {
    return payload.data[key];
  }

  return [];
};

// Safely get an ID from a string or object.
const getId = (value) => {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (value && typeof value === "object") {
    const id =
      value._id ??
      value.id ??
      value.user?._id ??
      value.user?.id;

    if (id !== undefined && id !== null) {
      return String(id);
    }
  }

  return "";
};

const Projects = () => {
  const { hasPermission } = useAuth();

  const [projects, setProjects] = useState([]);
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [teamFilter, setTeamFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("");

  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState(
    DEFAULT_PAGINATION
  );

  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    team: "",
    projectLead: "",
    status: "PLANNING",
  });

  // Load projects.
  const loadProjects = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await projectService.getProjects({
        search,
        status: statusFilter,
        team: teamFilter,
        isActive: activeFilter,
        page,
        limit: 10,
        sortBy,
        sortOrder,
      });

      const payload = response?.data ?? response;

      setProjects(
        extractList(payload, "projects")
      );

      setPagination({
        ...DEFAULT_PAGINATION,
        ...(payload?.pagination ??
          payload?.data?.pagination ??
          {}),
      });
    } catch (err) {
      console.error("Load projects error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to load projects."
      );
    } finally {
      setLoading(false);
    }
  };

  // Load teams.
  const loadTeams = async () => {
    try {
      const response = await teamService.getTeams({
        page: 1,
        limit: 100,
        isActive: true,
      });

      const teamList = extractList(response, "teams");

      setTeams(teamList);

      console.log("Teams loaded:", teamList);
    } catch (err) {
      console.error("Load teams error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to load teams."
      );
    }
  };

  // Load users.
  const loadUsers = async () => {
    try {
      const response = await userService.getUsers({
        page: 1,
        limit: 100,
        isActive: true,
      });

      const userList = extractList(response, "users");

      setUsers(userList);

      console.log("Users loaded:", userList);
    } catch (err) {
      console.error("Load users error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to load users."
      );
    }
  };

  useEffect(() => {
    loadProjects();
  }, [
    page,
    search,
    statusFilter,
    teamFilter,
    activeFilter,
    sortBy,
    sortOrder,
  ]);

  useEffect(() => {
    loadTeams();
    loadUsers();
  }, []);

  const resetMessages = () => {
    setError("");
    setSuccess("");
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      team: "",
      projectLead: "",
      status: "PLANNING",
    });

    setEditingProject(null);
  };

  const openCreateModal = () => {
    resetMessages();
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (project) => {
    resetMessages();

    setEditingProject(project);

    setFormData({
      name: project.name || "",
      description: project.description || "",
      team: getId(project.team),
      projectLead: getId(project.projectLead),
      status: project.status || "PLANNING",
    });

    setShowModal(true);
  };

  const closeModal = () => {
    if (formLoading) return;

    setShowModal(false);
    resetForm();
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (name === "team") {
      setFormData((previous) => ({
        ...previous,
        team: value,
        projectLead: "",
      }));

      return;
    }

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // Find selected team.
  const selectedTeam = teams.find(
    (team) => getId(team) === String(formData.team)
  );

  // Normalize team member IDs whether members are IDs or objects.
  const teamMemberIds = (
    selectedTeam?.members || []
  )
    .map((member) => getId(member))
    .filter(Boolean);

  // Show only users who belong to the selected team.
  const availableProjectLeads = users.filter((user) =>
    teamMemberIds.includes(getId(user))
  );

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setFormLoading(true);
      resetMessages();

      if (
        !formData.name.trim() ||
        !formData.team ||
        !formData.projectLead
      ) {
        setError(
          "Project name, team and project lead are required."
        );
        return;
      }

      // Ensure the selected lead belongs to the selected team.
      if (
        !availableProjectLeads.some(
          (user) =>
            getId(user) === String(formData.projectLead)
        )
      ) {
        setError(
          "Please select a project lead from the selected team."
        );
        return;
      }

      const projectData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        team: formData.team,
        projectLead: formData.projectLead,
        status: formData.status,
      };

      if (editingProject) {
        await projectService.updateProject(
          editingProject._id,
          projectData
        );

        setSuccess("Project updated successfully.");
      } else {
        await projectService.createProject(projectData);

        setSuccess("Project created successfully.");
      }

      setShowModal(false);
      resetForm();

      await loadProjects();
    } catch (err) {
      console.error("Save project error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to save project."
      );
    } finally {
      setFormLoading(false);
    }
  };

  const handleStatusChange = async (project) => {
    try {
      resetMessages();

      await projectService.updateProjectStatus(
        project._id,
        !project.isActive
      );

      setSuccess(
        `Project ${
          project.isActive ? "deactivated" : "activated"
        } successfully.`
      );

      await loadProjects();
    } catch (err) {
      console.error("Update project status error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to update project status."
      );
    }
  };

  const handleDelete = async (project) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${project.name}"?`
    );

    if (!confirmed) return;

    try {
      resetMessages();

      await projectService.deleteProject(project._id);

      setSuccess("Project deleted successfully.");

      if (projects.length === 1 && page > 1) {
        setPage((previous) => previous - 1);
      } else {
        await loadProjects();
      }
    } catch (err) {
      console.error("Delete project error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to delete project."
      );
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder((previous) =>
        previous === "asc" ? "desc" : "asc"
      );
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setTeamFilter("");
    setActiveFilter("");
    setPage(1);
  };

  const formatStatus = (status) =>
    status?.replaceAll("_", " ") || "—";

  return (
    <div className="dashboard-page projects-page">
      {/* PAGE HEADER */}
      <div className="dashboard-header">
        <div>
          <p className="eyebrow">Workspace Management</p>
          <h1>Projects</h1>

          <p className="dashboard-subtitle">
            Create and manage projects across your development workspace.
          </p>
        </div>

        <PermissionGate permission="projects.create">
          <button
            type="button"
            className="primary-button create-project-button"
            onClick={openCreateModal}
          >
            + Create Project
          </button>
        </PermissionGate>
      </div>

      {/* MESSAGES */}
      {error && (
        <div className="alert alert-error" role="alert">
          <span className="alert-icon">!</span>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert alert-success" role="status">
          <span className="alert-icon">✓</span>
          <span>{success}</span>
        </div>
      )}

      {/* FILTERS */}
      <div className="dashboard-card projects-filter-card">
        <div className="filters-row">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search projects..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </div>

          <select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All Statuses</option>
            <option value="PLANNING">Planning</option>
            <option value="ACTIVE">Active</option>
            <option value="ON_HOLD">On Hold</option>
            <option value="COMPLETED">Completed</option>
          </select>

          <select
            aria-label="Filter by team"
            value={teamFilter}
            onChange={(event) => {
              setTeamFilter(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All Teams</option>

            {teams.map((team) => (
              <option key={team._id} value={team._id}>
                {team.name}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by active status"
            value={activeFilter}
            onChange={(event) => {
              setActiveFilter(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All Projects</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>

          <button
            type="button"
            className="secondary-button"
            onClick={clearFilters}
          >
            Clear
          </button>
        </div>
      </div>

      {/* PROJECT TABLE */}
      <div className="dashboard-card projects-table-card">
        <div className="card-header">
          <div>
            <h2>All Projects</h2>
            <p>
              {pagination.totalItems} project
              {pagination.totalItems !== 1 ? "s" : ""}
            </p>
          </div>

          <span className="count-pill">
            {pagination.totalItems}
          </span>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner" />
            <p>Loading projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">⌁</div>
            <h3>No projects found</h3>

            <p>No projects match your current filters.</p>

            <PermissionGate permission="projects.create">
              <button
                type="button"
                className="primary-button"
                onClick={openCreateModal}
              >
                + Create Project
              </button>
            </PermissionGate>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table projects-table">
              <thead>
                <tr>
                  <th
                    onClick={() => handleSort("name")}
                    className="sortable"
                  >
                    Project
                  </th>

                  <th>Team</th>

                  <th>Project Lead</th>

                  <th
                    onClick={() => handleSort("status")}
                    className="sortable"
                  >
                    Status
                  </th>

                  <th>Access</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {projects.map((project) => (
                  <tr key={project._id}>
                    <td>
                      <div className="table-primary">
                        {project.name}
                      </div>

                      <div className="table-secondary">
                        {project.description || "No description"}
                      </div>
                    </td>

                    <td>
                      <div className="table-primary">
                        {project.team?.name || "—"}
                      </div>
                    </td>

                    <td>
                      <div className="table-primary">
                        {project.projectLead?.name || "—"}
                      </div>

                      <div className="table-secondary">
                        {project.projectLead?.email || ""}
                      </div>
                    </td>

                    <td>
                      <span
                        className={`status-badge status-${project.status?.toLowerCase()}`}
                      >
                        {formatStatus(project.status)}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`status-badge ${
                          project.isActive
                            ? "status-active"
                            : "status-inactive"
                        }`}
                      >
                        <span className="status-dot" />
                        {project.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td>
                      <div className="table-actions">
                        <PermissionGate permission="projects.update">
                          <button
                            type="button"
                            className="action-button"
                            onClick={() => openEditModal(project)}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="action-button"
                            onClick={() => handleStatusChange(project)}
                          >
                            {project.isActive
                              ? "Deactivate"
                              : "Activate"}
                          </button>
                        </PermissionGate>

                        <PermissionGate permission="projects.delete">
                          <button
                            type="button"
                            className="action-button danger"
                            onClick={() => handleDelete(project)}
                          >
                            Delete
                          </button>
                        </PermissionGate>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION */}
        {!loading && pagination.totalPages > 1 && (
          <div className="pagination">
            <button
              type="button"
              className="secondary-button"
              disabled={page <= 1}
              onClick={() =>
                setPage((previous) => Math.max(previous - 1, 1))
              }
            >
              ← Previous
            </button>

            <div className="pagination-info">
              Page <strong>{pagination.currentPage}</strong> of{" "}
              <strong>{pagination.totalPages}</strong>
            </div>

            <button
              type="button"
              className="secondary-button"
              disabled={page >= pagination.totalPages}
              onClick={() =>
                setPage((previous) =>
                  Math.min(previous + 1, pagination.totalPages)
                )
              }
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div
          className="modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div
            className="modal project-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="project-modal-title"
          >
            <div className="modal-header">
              <div className="modal-title-wrapper">
                <div className="modal-title-icon">
                  {editingProject ? "✎" : "+"}
                </div>

                <div>
                  <h2 id="project-modal-title">
                    {editingProject ? "Edit Project" : "Create Project"}
                  </h2>

                  <p>
                    {editingProject
                      ? "Update project information."
                      : "Create a new workspace project."}
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={closeModal}
                disabled={formLoading}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            <form className="modal-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="project-name">Project Name</label>

                <input
                  id="project-name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter project name"
                  disabled={formLoading}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="project-description">Description</label>

                <textarea
                  id="project-description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe the project"
                  rows={4}
                  disabled={formLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="project-team">Team</label>

                <select
                  id="project-team"
                  name="team"
                  value={formData.team}
                  onChange={handleChange}
                  disabled={formLoading}
                  required
                >
                  <option value="">Select team</option>

                  {teams.map((team) => (
                    <option key={team._id} value={team._id}>
                      {team.name}
                    </option>
                  ))}
                </select>

                {teams.length === 0 && (
                  <small>No teams found. Create a team first.</small>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="project-lead">Project Lead</label>

                <select
                  id="project-lead"
                  name="projectLead"
                  value={formData.projectLead}
                  onChange={handleChange}
                  disabled={formLoading || !formData.team}
                  required
                >
                  <option value="">
                    {!formData.team
                      ? "Select team first"
                      : availableProjectLeads.length === 0
                      ? "No team members available"
                      : "Select project lead"}
                  </option>

                  {availableProjectLeads.map((user) => (
                    <option
                      key={getId(user)}
                      value={getId(user)}
                    >
                      {user.name || user.fullName || "Unnamed user"}
                      {user.email ? ` — ${user.email}` : ""}
                    </option>
                  ))}
                </select>

                {formData.team &&
                  selectedTeam &&
                  teamMemberIds.length === 0 && (
                    <small>
                      This team has no members in the API response.
                      Add members to the team first.
                    </small>
                  )}
              </div>

              <div className="form-group">
                <label htmlFor="project-status">Project Status</label>

                <select
                  id="project-status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  disabled={formLoading}
                >
                  <option value="PLANNING">Planning</option>
                  <option value="ACTIVE">Active</option>
                  <option value="ON_HOLD">On Hold</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeModal}
                  disabled={formLoading}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={formLoading}
                >
                  {formLoading
                    ? "Saving..."
                    : editingProject
                    ? "Update Project"
                    : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
