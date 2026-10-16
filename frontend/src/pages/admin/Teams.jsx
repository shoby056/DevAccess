import { useEffect, useState } from "react";
import teamService from "../../services/teamService";
import userService from "../../services/userService";
import PermissionGate from "../../components/PermissionGate";
import useAuth from "../../hooks/useAuth";

const Teams = () => {
  const { hasPermission } = useAuth();

  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [memberLoading, setMemberLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalTeams: 0,
    perPage: 10,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const [showModal, setShowModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);

  const [editingTeam, setEditingTeam] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);

  const [selectedMember, setSelectedMember] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    teamLead: "",
    isActive: true,
  });

  const fetchTeams = async (
    targetPage = page,
    searchValue = search,
    statusValue = status
  ) => {
    try {
      setLoading(true);
      setError("");

      const response = await teamService.getTeams({
        page: targetPage,
        limit: 10,
        search: searchValue,
        status: statusValue,
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      const payload = response?.data ?? response;

      setTeams(Array.isArray(payload?.teams) ? payload.teams : []);

      const paginationData = payload?.pagination;

      setPagination({
        currentPage: Number(paginationData?.currentPage) || targetPage,
        totalPages: Number(paginationData?.totalPages) || 1,
        totalTeams: Number(paginationData?.totalTeams) || 0,
        perPage: Number(paginationData?.perPage) || 10,
        hasNextPage: Boolean(paginationData?.hasNextPage),
        hasPreviousPage: Boolean(paginationData?.hasPreviousPage),
      });
    } catch (err) {
      setTeams([]);

      setError(
        err.response?.data?.message ||
          "Failed to load teams. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await userService.getUsers({
        page: 1,
        limit: 100,
        status: "active",
      });

      const payload = response?.data ?? response;

      setUsers(Array.isArray(payload?.users) ? payload.users : []);
    } catch (err) {
      console.error("Failed to load users:", err);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, [page, status]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSearchSubmit = (event) => {
    event.preventDefault();

    if (page === 1) {
      fetchTeams(1, search, status);
    } else {
      setPage(1);
    }
  };

  const handleClearFilters = () => {
    const hasOtherFilters = Boolean(status) || page !== 1;

    setSearch("");
    setStatus("");
    setPage(1);

    if (!hasOtherFilters) {
      fetchTeams(1, "", "");
    }
  };

  const openCreateModal = () => {
    setEditingTeam(null);

    setFormData({
      name: "",
      description: "",
      teamLead: "",
      isActive: true,
    });

    setError("");
    setSuccess("");
    setShowModal(true);
  };

  const openEditModal = (team) => {
    setEditingTeam(team);

    setFormData({
      name: team.name || "",
      description: team.description || "",
      teamLead: team.teamLead?._id || "",
      isActive: team.isActive ?? true,
    });

    setError("");
    setSuccess("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (formLoading) return;

    setShowModal(false);
    setEditingTeam(null);

    setFormData({
      name: "",
      description: "",
      teamLead: "",
      isActive: true,
    });
  };

  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.name.trim()) {
      setError("Team name is required.");
      return;
    }

    if (!formData.teamLead) {
      setError("Please select a team lead.");
      return;
    }

    try {
      setFormLoading(true);
      setError("");
      setSuccess("");

      if (editingTeam) {
        await teamService.updateTeam(editingTeam._id, {
          name: formData.name.trim(),
          description: formData.description.trim(),
          teamLead: formData.teamLead,
          isActive: formData.isActive,
        });

        setSuccess("Team updated successfully.");
      } else {
        await teamService.createTeam({
          name: formData.name.trim(),
          description: formData.description.trim(),
          teamLead: formData.teamLead,
        });

        setSuccess("Team created successfully.");
      }

      setFormLoading(false);
      setShowModal(false);
      setEditingTeam(null);

      setFormData({
        name: "",
        description: "",
        teamLead: "",
        isActive: true,
      });

      await fetchTeams(page, search, status);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to save team. Please try again."
      );
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (team) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${team.name}"?`
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      await teamService.deleteTeam(team._id);

      setSuccess("Team deleted successfully.");

      if (teams.length === 1 && page > 1) {
        setPage((previous) => previous - 1);
      } else {
        await fetchTeams(page, search, status);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to delete team. Please try again."
      );
    }
  };

  const openMembersModal = (team) => {
    setSelectedTeam(team);
    setSelectedMember("");
    setError("");
    setSuccess("");
    setShowMembersModal(true);
  };

  const closeMembersModal = () => {
    if (memberLoading) return;

    setShowMembersModal(false);
    setSelectedTeam(null);
    setSelectedMember("");
  };

  const handleAddMember = async () => {
    if (!selectedTeam) return;

    if (!selectedMember) {
      setError("Please select a user.");
      return;
    }

    try {
      setMemberLoading(true);
      setError("");
      setSuccess("");

      const response = await teamService.addMember(
        selectedTeam._id,
        selectedMember
      );

      const updatedTeam = response?.team;

      if (updatedTeam) {
        setSelectedTeam(updatedTeam);

        setTeams((previousTeams) =>
          previousTeams.map((team) =>
            team._id === updatedTeam._id ? updatedTeam : team
          )
        );
      }

      setSelectedMember("");
      setSuccess("Member added successfully.");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to add member. Please try again."
      );
    } finally {
      setMemberLoading(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!selectedTeam) return;

    const member = selectedTeam.members?.find(
      (item) => item._id === userId
    );

    if (!member) return;

    if (selectedTeam.teamLead?._id === userId) {
      setError(
        "Team lead cannot be removed. Assign another team lead first."
      );
      return;
    }

    const confirmed = window.confirm(
      `Remove ${member.name} from ${selectedTeam.name}?`
    );

    if (!confirmed) return;

    try {
      setMemberLoading(true);
      setError("");
      setSuccess("");

      const response = await teamService.removeMember(
        selectedTeam._id,
        userId
      );

      const updatedTeam = response?.team;

      if (updatedTeam) {
        setSelectedTeam(updatedTeam);

        setTeams((previousTeams) =>
          previousTeams.map((team) =>
            team._id === updatedTeam._id ? updatedTeam : team
          )
        );
      }

      setSuccess("Member removed successfully.");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to remove member. Please try again."
      );
    } finally {
      setMemberLoading(false);
    }
  };

  const availableUsers =
    selectedTeam?.members?.length > 0
      ? users.filter(
          (user) =>
            !selectedTeam.members.some(
              (member) => member._id === user._id
            )
        )
      : users;

  return (
    <div className="page-container teams-page">
      {/* PAGE HEADER */}
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Workspace Management</div>

          <h1>Teams</h1>

          <p className="page-description">
            Manage teams, team leads, members, and team access.
          </p>
        </div>

        <PermissionGate permission="teams.create">
          <button
            type="button"
            className="primary-button create-team-button"
            onClick={openCreateModal}
          >
            <span className="button-icon">+</span>
            Create Team
          </button>
        </PermissionGate>
      </div>

      {/* ALERTS */}
      {success && (
        <div className="alert alert-success">
          <span className="alert-icon">✓</span>
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">!</span>
          <span>{error}</span>
        </div>
      )}

      {/* FILTERS */}
      <div className="card teams-filter-card">
        <form
          className="teams-filters-form"
          onSubmit={handleSearchSubmit}
        >
          <div className="filter-field search-field">
            <label htmlFor="team-search">Search teams</label>

            <div className="input-with-icon">
              <span className="input-icon">⌕</span>

              <input
                id="team-search"
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by team name..."
              />
            </div>
          </div>

          <div className="filter-field">
            <label htmlFor="team-status">Status</label>

            <select
              id="team-status"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="filter-actions">
            <button type="submit" className="primary-button">
              Search
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={handleClearFilters}
            >
              Clear
            </button>
          </div>
        </form>
      </div>

      {/* TEAMS TABLE */}
      <div className="card teams-table-card">
        <div className="table-header">
          <div>
            <div className="table-title-row">
              <h2>All Teams</h2>

              <span className="count-pill">
                {pagination?.totalTeams ?? 0}
              </span>
            </div>

            <span className="table-subtitle">
              Your organization's development teams
            </span>
          </div>
        </div>

        {loading ? (
          <div className="loading-state teams-loading">
            <div className="loading-spinner" />
            <span>Loading teams...</span>
          </div>
        ) : teams.length === 0 ? (
          <div className="empty-state teams-empty">
            <div className="empty-icon">⌁</div>

            <h3>No teams found</h3>

            <p>
              Try changing your search or filter, or create a new team.
            </p>

            <PermissionGate permission="teams.create">
              <button
                type="button"
                className="primary-button"
                onClick={openCreateModal}
              >
                + Create Team
              </button>
            </PermissionGate>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table teams-table">
              <thead>
                <tr>
                  <th>Team</th>
                  <th>Team Lead</th>
                  <th>Members</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {teams.map((team) => (
                  <tr key={team._id}>
                    <td>
                      <div className="team-name-cell">
                        <div className="team-avatar">
                          {team.name?.charAt(0)?.toUpperCase() || "T"}
                        </div>

                        <div className="team-info">
                          <div className="table-primary">
                            {team.name}
                          </div>

                          <div className="table-secondary">
                            {team.description || "No description provided"}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="person-cell">
                        <div className="person-avatar">
                          {team.teamLead?.name
                            ?.charAt(0)
                            ?.toUpperCase() || "?"}
                        </div>

                        <div>
                          <div className="table-primary">
                            {team.teamLead?.name || "N/A"}
                          </div>

                          <div className="table-secondary">
                            {team.teamLead?.email || ""}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <button
                        type="button"
                        className="member-count-button"
                        onClick={() => openMembersModal(team)}
                        title="View team members"
                      >
                        <span className="member-count-icon">👥</span>
                        <span>{team.members?.length ?? 0}</span>
                      </button>
                    </td>

                    <td>
                      <span
                        className={`status-badge ${
                          team.isActive
                            ? "status-active"
                            : "status-inactive"
                        }`}
                      >
                        <span className="status-dot" />

                        {team.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td>
                      <span className="date-text">
                        {team.createdAt
                          ? new Date(team.createdAt).toLocaleDateString()
                          : "N/A"}
                      </span>
                    </td>

                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          className="action-button"
                          onClick={() => openMembersModal(team)}
                        >
                          Members
                        </button>

                        <PermissionGate permission="teams.update">
                          <button
                            type="button"
                            className="action-button edit"
                            onClick={() => openEditModal(team)}
                          >
                            Edit
                          </button>
                        </PermissionGate>

                        <PermissionGate permission="teams.delete">
                          <button
                            type="button"
                            className="action-button delete"
                            onClick={() => handleDelete(team)}
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

        {!loading && teams.length > 0 && (
          <div className="pagination">
            <button
              type="button"
              className="secondary-button"
              disabled={!pagination?.hasPreviousPage}
              onClick={() => setPage((previous) => previous - 1)}
            >
              ← Previous
            </button>

            <div className="pagination-info">
              <span>
                Page <strong>{pagination?.currentPage ?? page}</strong> of{" "}
                <strong>{pagination?.totalPages ?? 1}</strong>
              </span>
            </div>

            <button
              type="button"
              className="secondary-button"
              disabled={!pagination?.hasNextPage}
              onClick={() => setPage((previous) => previous + 1)}
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* CREATE / EDIT TEAM MODAL */}
      {showModal && (
        <div
          className="modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="modal" role="dialog" aria-modal="true">
            <div className="modal-header">
              <div className="modal-title-wrapper">
                <div className="modal-title-icon">
                  {editingTeam ? "✎" : "+"}
                </div>

                <div>
                  <h2>{editingTeam ? "Edit Team" : "Create Team"}</h2>

                  <p>
                    {editingTeam
                      ? "Update your team information and settings."
                      : "Create a new development team and assign a team lead."}
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
                <label htmlFor="name">Team Name</label>

                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Backend Engineering"
                  disabled={formLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>

                <textarea
                  id="description"
                  name="description"
                  rows="4"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe the team's responsibilities..."
                  disabled={formLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="teamLead">Team Lead</label>

                <select
                  id="teamLead"
                  name="teamLead"
                  value={formData.teamLead}
                  onChange={handleInputChange}
                  disabled={formLoading}
                >
                  <option value="">Select team lead</option>

                  {users.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name} — {user.email}
                    </option>
                  ))}
                </select>
              </div>

              {editingTeam && (
                <label className="checkbox-field">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    disabled={formLoading}
                  />

                  <span>
                    <strong>Team is active</strong>

                    <small>
                      Active teams can be used for workspace operations.
                    </small>
                  </span>
                </label>
              )}

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
                  {formLoading ? (
                    <>
                      <span className="button-spinner" />
                      Saving...
                    </>
                  ) : editingTeam ? (
                    "Update Team"
                  ) : (
                    "Create Team"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MEMBERS MODAL */}
      {showMembersModal && selectedTeam && (
        <div
          className="modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeMembersModal();
            }
          }}
        >
          <div
            className="modal members-modal"
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header">
              <div className="modal-title-wrapper">
                <div className="modal-title-icon">👥</div>

                <div>
                  <h2>{selectedTeam.name}</h2>

                  <p>
                    Manage team members and view the current team lead.
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={closeMembersModal}
                disabled={memberLoading}
                aria-label="Close members modal"
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="team-lead-section">
                <div className="section-heading">
                  <div>
                    <span className="section-label">Team Lead</span>

                    <h3>Primary team owner</h3>
                  </div>
                </div>

                <div className="member-card team-lead-card">
                  <div className="member-main">
                    <div className="member-avatar">
                      {selectedTeam.teamLead?.name
                        ?.charAt(0)
                        ?.toUpperCase() || "?"}
                    </div>

                    <div>
                      <strong>
                        {selectedTeam.teamLead?.name || "N/A"}
                      </strong>

                      <span>{selectedTeam.teamLead?.email || ""}</span>
                    </div>
                  </div>

                  <span className="status-badge status-active">
                    <span className="status-dot" />
                    Team Lead
                  </span>
                </div>
              </div>

              <div className="members-section">
                <div className="section-heading">
                  <div>
                    <span className="section-label">Team Members</span>

                    <h3>
                      {selectedTeam.members?.length ?? 0} members
                    </h3>
                  </div>
                </div>

                {selectedTeam.members?.length > 0 ? (
                  <div className="members-list">
                    {selectedTeam.members.map((member) => {
                      const isTeamLead =
                        selectedTeam.teamLead?._id === member._id;

                      return (
                        <div className="member-card" key={member._id}>
                          <div className="member-main">
                            <div className="member-avatar">
                              {member.name?.charAt(0)?.toUpperCase() || "?"}
                            </div>

                            <div>
                              <strong>{member.name}</strong>
                              <span>{member.email}</span>
                            </div>
                          </div>

                          <div className="member-actions">
                            {isTeamLead ? (
                              <span className="status-badge status-active">
                                <span className="status-dot" />
                                Team Lead
                              </span>
                            ) : (
                              <PermissionGate permission="teams.update">
                                <button
                                  type="button"
                                  className="action-button delete"
                                  onClick={() =>
                                    handleRemoveMember(member._id)
                                  }
                                  disabled={memberLoading}
                                >
                                  Remove
                                </button>
                              </PermissionGate>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="empty-state member-empty">
                    <div className="empty-icon">👤</div>

                    <h3>No members yet</h3>

                    <p>
                      Add users to this team using the form below.
                    </p>
                  </div>
                )}
              </div>

              <PermissionGate permission="teams.update">
                <div className="add-member-section">
                  <div className="add-member-header">
                    <div>
                      <span className="section-label">Team Access</span>

                      <h3>Add a member</h3>
                    </div>
                  </div>

                  <div className="add-member-form">
                    <div className="form-group">
                      <label htmlFor="new-member">Select User</label>

                      <select
                        id="new-member"
                        value={selectedMember}
                        onChange={(event) =>
                          setSelectedMember(event.target.value)
                        }
                        disabled={memberLoading}
                      >
                        <option value="">Select a user to add</option>

                        {availableUsers.map((user) => (
                          <option key={user._id} value={user._id}>
                            {user.name} — {user.email}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      className="primary-button add-member-button"
                      onClick={handleAddMember}
                      disabled={memberLoading || !selectedMember}
                    >
                      {memberLoading ? "Processing..." : "+ Add Member"}
                    </button>
                  </div>
                </div>
              </PermissionGate>
            </div>

            <div className="modal-actions members-modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={closeMembersModal}
                disabled={memberLoading}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Teams;