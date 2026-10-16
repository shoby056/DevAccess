import { useEffect, useState } from "react";
import userService from "../../services/userService";
import useAuth from "../../hooks/useAuth";

const DEFAULT_PAGINATION = {
  currentPage: 1,
  totalPages: 1,
  totalUsers: 0,
  perPage: 10,
  hasNextPage: false,
  hasPreviousPage: false,
};

const Users = () => {
  const { user: currentUser, hasPermission } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  const [formLoading, setFormLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "DEVELOPER",
  });

  const [selectedRole, setSelectedRole] = useState("DEVELOPER");

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const params = {
        page,
        limit: 10,
      };

      if (search.trim()) {
        params.search = search.trim();
      }

      if (roleFilter) {
        params.role = roleFilter;
      }

      if (statusFilter) {
        params.status = statusFilter;
      }

      const response = await userService.getUsers(params);

      // Supports both:
      // response.data
      // and already-unwrapped response
      const responseData = response?.data ?? response;

      setUsers(
        Array.isArray(responseData?.users)
          ? responseData.users
          : []
      );

      setPagination(
        responseData?.pagination || DEFAULT_PAGINATION
      );
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Failed to load users."
      );

      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter, statusFilter]);

  const handleSearch = (e) => {
    e.preventDefault();

    if (page !== 1) {
      setPage(1);
    } else {
      fetchUsers();
    }
  };

  const clearFilters = () => {
    setSearch("");
    setRoleFilter("");
    setStatusFilter("");
    setPage(1);
  };

  const openAddModal = () => {
    setEditingUser(null);

    setFormData({
      name: "",
      email: "",
      password: "",
      role: "DEVELOPER",
    });

    setError("");
    setSuccess("");
    setShowModal(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);

    setFormData({
      name: user.name || "",
      email: user.email || "",
      password: "",
      role: user.role?.name || user.role || "DEVELOPER",
    });

    setError("");
    setSuccess("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (formLoading) return;

    setShowModal(false);
    setEditingUser(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setFormLoading(true);
      setError("");
      setSuccess("");

      if (editingUser) {
        const updateData = {
          name: formData.name,
          email: formData.email,
        };

        await userService.updateUser(
          editingUser._id,
          updateData
        );

        setSuccess("User updated successfully.");
      } else {
        await userService.createUser(formData);

        setSuccess("User created successfully.");
      }

      setFormLoading(false);
      setShowModal(false);
      setEditingUser(null);

      setFormData({
        name: "",
        email: "",
        password: "",
        role: "DEVELOPER",
      });

      await fetchUsers();
    } catch (err) {
      setFormLoading(false);

      setError(
        err?.response?.data?.message ||
          "Failed to save user."
      );
    }
  };

  const openRoleModal = (user) => {
    setSelectedUser(user);
    setSelectedRole(
      user.role?.name || user.role || "DEVELOPER"
    );
    setError("");
    setShowRoleModal(true);
  };

  const closeRoleModal = () => {
    if (formLoading) return;

    setShowRoleModal(false);
    setSelectedUser(null);
  };

  const handleRoleUpdate = async () => {
    if (!selectedUser) return;

    try {
      setFormLoading(true);
      setError("");
      setSuccess("");

      await userService.updateUserRole(
        selectedUser._id,
        selectedRole
      );

      setFormLoading(false);
      setShowRoleModal(false);
      setSelectedUser(null);

      setSuccess("User role updated successfully.");

      await fetchUsers();
    } catch (err) {
      setFormLoading(false);

      setError(
        err?.response?.data?.message ||
          "Failed to update user role."
      );
    }
  };

  const openConfirmModal = (action, user) => {
    setSelectedUser(user);
    setConfirmAction(action);
    setError("");
    setShowConfirmModal(true);
  };

  const closeConfirmModal = () => {
    if (formLoading) return;

    setShowConfirmModal(false);
    setSelectedUser(null);
    setConfirmAction(null);
  };

  const handleConfirmAction = async () => {
    if (!selectedUser || !confirmAction) return;

    try {
      setFormLoading(true);
      setError("");
      setSuccess("");

      if (confirmAction === "delete") {
        await userService.deleteUser(selectedUser._id);

        setSuccess("User deleted successfully.");
      }

      if (confirmAction === "deactivate") {
        await userService.updateUserStatus(
          selectedUser._id,
          false
        );

        setSuccess("User deactivated successfully.");
      }

      if (confirmAction === "activate") {
        await userService.updateUserStatus(
          selectedUser._id,
          true
        );

        setSuccess("User activated successfully.");
      }

      setFormLoading(false);
      setShowConfirmModal(false);
      setSelectedUser(null);
      setConfirmAction(null);

      await fetchUsers();
    } catch (err) {
      setFormLoading(false);

      setError(
        err?.response?.data?.message ||
          "Action failed."
      );
    }
  };

  const getRoleName = (user) => {
    return user?.role?.name || user?.role || "DEVELOPER";
  };

  const getRoleClass = (role) => {
    return role
      .toLowerCase()
      .replaceAll("_", "-");
  };

  const getConfirmTitle = () => {
    if (confirmAction === "delete") {
      return "Delete User";
    }

    if (confirmAction === "deactivate") {
      return "Deactivate User";
    }

    return "Activate User";
  };

  const getConfirmMessage = () => {
    if (!selectedUser) return "";

    if (confirmAction === "delete") {
      return `Are you sure you want to permanently delete ${selectedUser.name}?`;
    }

    if (confirmAction === "deactivate") {
      return `Are you sure you want to deactivate ${selectedUser.name}?`;
    }

    return `Are you sure you want to activate ${selectedUser.name}?`;
  };

  return (
    <div className="page-container users-page">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <div className="page-eyebrow">
            Administration
          </div>

          <h1>Users</h1>

          <p>
            Manage users, roles, account status and access.
          </p>
        </div>

        {hasPermission("users.create") && (
          <button
            className="primary-button add-user-button"
            onClick={openAddModal}
          >
            <span className="button-icon">+</span>
            Add User
          </button>
        )}
      </div>

      {/* Alerts */}
      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">!</span>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <span className="alert-icon">✓</span>
          <span>{success}</span>
        </div>
      )}

      {/* Filters */}
      <div className="users-toolbar">
        <form
          className="search-form"
          onSubmit={handleSearch}
        >
          <div className="search-input-wrapper">
            <span className="search-icon">⌕</span>

            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />
          </div>

          <button
            type="submit"
            className="secondary-button"
          >
            Search
          </button>
        </form>

        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Roles</option>
          <option value="SUPER_ADMIN">
            Super Admin
          </option>
          <option value="TEAM_LEAD">
            Team Lead
          </option>
          <option value="DEVELOPER">
            Developer
          </option>
          <option value="QA_ENGINEER">
            QA Engineer
          </option>
          <option value="AUDITOR">
            Auditor
          </option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">
            Inactive
          </option>
        </select>

        {(search || roleFilter || statusFilter) && (
          <button
            type="button"
            className="clear-filter-button"
            onClick={clearFilters}
          >
            Clear
          </button>
        )}
      </div>

      {/* Users Table */}
      <div className="table-card">
        <div className="table-card-header">
          <div>
            <h2>All Users</h2>

            <p>
              {pagination.totalUsers || 0}{" "}
              users found
            </p>
          </div>

          <div className="table-count">
            {pagination.totalUsers || 0}
          </div>
        </div>

        {loading ? (
          <div className="table-loading">
            <div className="loading-spinner"></div>
            <p>Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              👤
            </div>

            <h3>No users found</h3>

            <p>
              Try changing your search or filter
              options.
            </p>

            {hasPermission("users.create") && (
              <button
                className="primary-button"
                onClick={openAddModal}
              >
                Add User
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th className="actions-column">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {users.map((user) => {
                    const role = getRoleName(user);
                    const isCurrentUser =
                      currentUser?.id ===
                      user._id;

                    return (
                      <tr key={user._id}>
                        <td>
                          <div className="user-cell">
                            <div className="user-avatar">
                              {user.name
                                ?.charAt(0)
                                ?.toUpperCase() || "U"}
                            </div>

                            <div className="user-info">
                              <strong>
                                {user.name}
                              </strong>

                              {isCurrentUser && (
                                <span className="current-user-label">
                                  You
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="email-cell">
                          {user.email}
                        </td>

                        <td>
                          <span
                            className={`role-badge ${getRoleClass(
                              role
                            )}`}
                          >
                            {role.replaceAll(
                              "_",
                              " "
                            )}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`status-badge ${
                              user.isActive
                                ? "status-active"
                                : "status-inactive"
                            }`}
                          >
                            <span className="status-dot"></span>
                            {user.isActive
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </td>

                        <td>
                          {user.createdAt
                            ? new Date(
                                user.createdAt
                              ).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                }
                              )
                            : "-"}
                        </td>

                        <td>
                          <div className="action-buttons">
                            {hasPermission(
                              "users.update"
                            ) && (
                              <button
                                className="table-action"
                                title="Edit user"
                                onClick={() =>
                                  openEditModal(
                                    user
                                  )
                                }
                              >
                                Edit
                              </button>
                            )}

                            {hasPermission(
                              "roles.update"
                            ) &&
                              !isCurrentUser && (
                                <button
                                  className="table-action"
                                  title="Change role"
                                  onClick={() =>
                                    openRoleModal(
                                      user
                                    )
                                  }
                                >
                                  Role
                                </button>
                              )}

                            {hasPermission(
                              "users.update"
                            ) &&
                              !isCurrentUser && (
                                <button
                                  className="table-action"
                                  title={
                                    user.isActive
                                      ? "Deactivate user"
                                      : "Activate user"
                                  }
                                  onClick={() =>
                                    openConfirmModal(
                                      user.isActive
                                        ? "deactivate"
                                        : "activate",
                                      user
                                    )
                                  }
                                >
                                  {user.isActive
                                    ? "Disable"
                                    : "Enable"}
                                </button>
                              )}

                            {hasPermission(
                              "users.delete"
                            ) &&
                              !isCurrentUser && (
                                <button
                                  className="table-action danger"
                                  title="Delete user"
                                  onClick={() =>
                                    openConfirmModal(
                                      "delete",
                                      user
                                    )
                                  }
                                >
                                  Delete
                                </button>
                              )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="pagination">
                <button
                  disabled={
                    !pagination.hasPreviousPage
                  }
                  onClick={() =>
                    setPage((prev) =>
                      Math.max(prev - 1, 1)
                    )
                  }
                >
                  ← Previous
                </button>

                <div className="pagination-pages">
                  {Array.from(
                    {
                      length:
                        pagination.totalPages,
                    },
                    (_, index) => index + 1
                  ).map((pageNumber) => (
                    <button
                      key={pageNumber}
                      className={
                        pageNumber === page
                          ? "active"
                          : ""
                      }
                      onClick={() =>
                        setPage(pageNumber)
                      }
                    >
                      {pageNumber}
                    </button>
                  ))}
                </div>

                <button
                  disabled={
                    !pagination.hasNextPage
                  }
                  onClick={() =>
                    setPage((prev) =>
                      Math.min(
                        prev + 1,
                        pagination.totalPages
                      )
                    )
                  }
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add/Edit User Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <span className="modal-eyebrow">
                  User Management
                </span>

                <h2>
                  {editingUser
                    ? "Edit User"
                    : "Add New User"}
                </h2>

                <p>
                  {editingUser
                    ? "Update user account information."
                    : "Create a new DevAccess user account."}
                </p>
              </div>

              <button
                className="modal-close"
                onClick={closeModal}
              >
                ×
              </button>
            </div>

            <form
              className="modal-form"
              onSubmit={handleSubmit}
            >
              <div className="form-group">
                <label htmlFor="name">
                  Full Name
                </label>

                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">
                  Email Address
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="user@example.com"
                  required
                />
              </div>

              {!editingUser && (
                <>
                  <div className="form-group">
                    <label htmlFor="password">
                      Password
                    </label>

                    <input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Minimum 6 characters"
                      minLength={6}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="role">
                      Initial Role
                    </label>

                    <select
                      id="role"
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                    >
                      <option value="DEVELOPER">
                        Developer
                      </option>

                      <option value="TEAM_LEAD">
                        Team Lead
                      </option>

                      <option value="QA_ENGINEER">
                        QA Engineer
                      </option>

                      <option value="AUDITOR">
                        Auditor
                      </option>

                      <option value="SUPER_ADMIN">
                        Super Admin
                      </option>
                    </select>
                  </div>
                </>
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
                  {formLoading
                    ? "Saving..."
                    : editingUser
                    ? "Save Changes"
                    : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Role Modal */}
      {showRoleModal && selectedUser && (
        <div className="modal-overlay">
          <div className="modal-card modal-small">
            <div className="modal-header">
              <div>
                <span className="modal-eyebrow">
                  Access Control
                </span>

                <h2>Change Role</h2>

                <p>
                  Update role for{" "}
                  <strong>
                    {selectedUser.name}
                  </strong>
                  .
                </p>
              </div>

              <button
                className="modal-close"
                onClick={closeRoleModal}
              >
                ×
              </button>
            </div>

            <div className="modal-form">
              <div className="role-warning">
                <strong>
                  Permission Warning
                </strong>

                <span>
                  Changing a user's role changes
                  the permissions available to
                  that account.
                </span>
              </div>

              <div className="form-group">
                <label htmlFor="selectedRole">
                  Select Role
                </label>

                <select
                  id="selectedRole"
                  value={selectedRole}
                  onChange={(e) =>
                    setSelectedRole(
                      e.target.value
                    )
                  }
                >
                  <option value="DEVELOPER">
                    Developer
                  </option>

                  <option value="TEAM_LEAD">
                    Team Lead
                  </option>

                  <option value="QA_ENGINEER">
                    QA Engineer
                  </option>

                  <option value="AUDITOR">
                    Auditor
                  </option>

                  <option value="SUPER_ADMIN">
                    Super Admin
                  </option>
                </select>
              </div>

              <div className="modal-actions">
                <button
                  className="secondary-button"
                  onClick={closeRoleModal}
                  disabled={formLoading}
                >
                  Cancel
                </button>

                <button
                  className="primary-button"
                  onClick={handleRoleUpdate}
                  disabled={formLoading}
                >
                  {formLoading
                    ? "Updating..."
                    : "Update Role"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && selectedUser && (
        <div className="modal-overlay">
          <div className="modal-card modal-small confirmation-modal">
            <div className="confirmation-content">
              <div className="confirmation-icon">
                {confirmAction === "delete"
                  ? "!"
                  : confirmAction ===
                    "deactivate"
                  ? "!"
                  : "✓"}
              </div>

              <span className="modal-eyebrow">
                Confirmation Required
              </span>

              <h2>
                {getConfirmTitle()}
              </h2>

              <p>
                {getConfirmMessage()}
              </p>

              <div className="modal-actions">
                <button
                  className="secondary-button"
                  onClick={closeConfirmModal}
                  disabled={formLoading}
                >
                  Cancel
                </button>

                <button
                  className={
                    confirmAction === "delete" ||
                    confirmAction ===
                      "deactivate"
                      ? "danger-button"
                      : "primary-button"
                  }
                  onClick={handleConfirmAction}
                  disabled={formLoading}
                >
                  {formLoading
                    ? "Processing..."
                    : confirmAction ===
                      "delete"
                    ? "Delete User"
                    : confirmAction ===
                      "deactivate"
                    ? "Deactivate"
                    : "Activate"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;