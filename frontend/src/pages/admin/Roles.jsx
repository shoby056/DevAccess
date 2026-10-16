
import { useCallback, useEffect, useState } from "react";
import api from "../../services/api";

const Roles = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/roles");
      const data = response.data;

      const rolesData = Array.isArray(data)
        ? data
        : data?.roles || data?.data || [];

      setRoles(Array.isArray(rolesData) ? rolesData : []);
    } catch (err) {
      console.error("Fetch roles error:", err);

      setError(
        err.response?.data?.message ||
          "Could not load roles. Check your API endpoint and permissions."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleCreateRole = async (event) => {
    event.preventDefault();

    const name = formData.name.trim();
    const description = formData.description.trim();

    if (!name) {
      setError("Role name is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await api.post("/roles", {
        name: name.toUpperCase().replace(/\s+/g, "_"),
        description,
      });

      setFormData({
        name: "",
        description: "",
      });

      setShowForm(false);
      setSuccess("Role created successfully.");

      await fetchRoles();
    } catch (err) {
      console.error("Create role error:", err);

      setError(
        err.response?.data?.message ||
          "Could not create role. Check your backend API."
      );
    } finally {
      setSaving(false);
    }
  };

  const formatRoleName = (name = "") =>
    name
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (character) => character.toUpperCase());

  return (
    <main className="roles-page">
      <section className="page-header">
        <div>
          <span className="page-eyebrow">ACCESS CONTROL</span>
          <h1>Roles Management</h1>
          <p>
            Manage roles and review access permissions in your DevAccess
            workspace.
          </p>
        </div>

        <button
          type="button"
          className="add-role-button"
          onClick={() => {
            setShowForm((previous) => !previous);
            setError("");
            setSuccess("");
          }}
        >
          {showForm ? "Cancel" : "+ Create Role"}
        </button>
      </section>

      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success" role="status">
          {success}
        </div>
      )}

      {showForm && (
        <section className="role-form-card">
          <div className="role-form-header">
            <div>
              <h2>Create a Role</h2>
              <p>Enter a name and description for the new role.</p>
            </div>
          </div>

          <form className="role-form" onSubmit={handleCreateRole}>
            <div className="form-group">
              <label htmlFor="role-name">Role name</label>
              <input
                id="role-name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. SUPPORT_ENGINEER"
                required
                maxLength={50}
              />
              <small>
                Spaces will be converted to underscores automatically.
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="role-description">Description</label>
              <textarea
                id="role-description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the purpose of this role"
                rows={3}
                maxLength={250}
              />
            </div>

            <button
              type="submit"
              className="add-role-button"
              disabled={saving}
            >
              {saving ? "Creating..." : "Save Role"}
            </button>
          </form>
        </section>
      )}

      <section className="roles-stats">
        <div className="stat-card">
          <span className="stat-label">Total Roles</span>
          <strong className="stat-value">{roles.length}</strong>
        </div>

        <div className="stat-card">
          <span className="stat-label">Access Control</span>
          <strong className="stat-value">RBAC</strong>
        </div>
      </section>

      <section className="table-card">
        <div className="table-card-header">
          <div>
            <h2>Workspace Roles</h2>
            <p>Review the roles returned by your backend API.</p>
          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={fetchRoles}
            disabled={loading}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {loading ? (
          <div className="table-loading">
            <span className="loading-spinner" />
            <p>Loading roles...</p>
          </div>
        ) : roles.length === 0 ? (
          <div className="empty-state">
            <h3>No roles found</h3>
            <p>
              {error
                ? "Check the error message above and verify your API."
                : "No roles were returned by the backend."}
            </p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Role</th>
                  <th>Description</th>
                  <th>Permissions</th>
                </tr>
              </thead>

              <tbody>
                {roles.map((role) => (
                  <tr key={role._id || role.id || role.name}>
                    <td>
                      <div className="role-name">
                        <span className="role-icon">
                          {formatRoleName(role.name).charAt(0) || "R"}
                        </span>

                        <div>
                          <strong>
                            {formatRoleName(role.name || "Unnamed Role")}
                          </strong>
                          <span className="role-badge">
                            {role.name || "CUSTOM"}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="role-description">
                        {role.description || "No description provided"}
                      </span>
                    </td>

                    <td>
                      <span className="permission-count">
                        {Array.isArray(role.permissions)
                          ? role.permissions.length
                          : 0}{" "}
                        permissions
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
};

export default Roles;