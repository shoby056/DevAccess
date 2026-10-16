
import { useEffect, useMemo, useState } from "react";

import resourceService from "../../services/resourceService";
import projectService from "../../services/projectService";
import PermissionGate from "../../components/PermissionGate";

const RESOURCE_TYPES = [
  "REPOSITORY",
  "DATABASE",
  "API",
  "SERVER",
  "CLOUD_SERVICE",
  "STORAGE",
  "OTHER",
];

const ENVIRONMENTS = [
  "DEVELOPMENT",
  "STAGING",
  "PRODUCTION",
];

const SENSITIVITIES = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
];

const initialForm = {
  name: "",
  type: "OTHER",
  description: "",
  project: "",
  environment: "DEVELOPMENT",
  url: "",
  sensitivity: "MEDIUM",
};

const Resources = () => {
  const [resources, setResources] = useState([]);
  const [projects, setProjects] = useState([]);

  const [loading, setLoading] = useState(true);
  const [projectsLoading, setProjectsLoading] = useState(true);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [environmentFilter, setEnvironmentFilter] = useState("");
  const [sensitivityFilter, setSensitivityFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("");

  // Pagination
  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  });

  // Sorting
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingResource, setEditingResource] = useState(null);

  const [formData, setFormData] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);

  /*
  =========================================================
  FETCH PROJECTS
  =========================================================
  */

  const fetchProjects = async () => {
    try {
      setProjectsLoading(true);

      const response = await projectService.getProjects({
        page: 1,
        limit: 100,
      });

      setProjects(response.projects || []);
    } catch (err) {
      console.error("Failed to fetch projects:", err);

      setError(
        err.response?.data?.message ||
          "Failed to load projects"
      );
    } finally {
      setProjectsLoading(false);
    }
  };

  /*
  =========================================================
  FETCH RESOURCES
  =========================================================
  */

  const fetchResources = async () => {
    try {
      setLoading(true);
      setError("");

      const params = {
        page,
        limit: 10,
        sortBy,
        sortOrder,
      };

      if (search.trim()) {
        params.search = search.trim();
      }

      if (typeFilter) {
        params.type = typeFilter;
      }

      if (environmentFilter) {
        params.environment = environmentFilter;
      }

      if (sensitivityFilter) {
        params.sensitivity = sensitivityFilter;
      }

      if (projectFilter) {
        params.project = projectFilter;
      }

      if (activeFilter !== "") {
        params.isActive = activeFilter;
      }

      const response =
        await resourceService.getResources(params);

      setResources(response.resources || []);

      setPagination(
        response.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          itemsPerPage: 10,
        }
      );
    } catch (err) {
      console.error("Failed to fetch resources:", err);

      setError(
        err.response?.data?.message ||
          "Failed to load resources"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    fetchResources();
  }, [
    page,
    sortBy,
    sortOrder,
    typeFilter,
    environmentFilter,
    sensitivityFilter,
    projectFilter,
    activeFilter,
  ]);

  /*
  =========================================================
  SEARCH
  =========================================================
  */

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchResources();
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  /*
  =========================================================
  CLEAR SUCCESS
  =========================================================
  */

  useEffect(() => {
    if (!success) return;

    const timer = setTimeout(() => {
      setSuccess("");
    }, 3000);

    return () => clearTimeout(timer);
  }, [success]);

  /*
  =========================================================
  FORM HANDLER
  =========================================================
  */

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  /*
  =========================================================
  CREATE MODAL
  =========================================================
  */

  const openCreateModal = () => {
    setEditingResource(null);
    setFormData(initialForm);
    setError("");
    setShowModal(true);
  };

  /*
  =========================================================
  EDIT MODAL
  =========================================================
  */

  const openEditModal = (resource) => {
    setEditingResource(resource);

    setFormData({
      name: resource.name || "",
      type: resource.type || "OTHER",
      description: resource.description || "",
      project:
        resource.project?._id ||
        resource.project ||
        "",
      environment:
        resource.environment || "DEVELOPMENT",
      url: resource.url || "",
      sensitivity:
        resource.sensitivity || "MEDIUM",
    });

    setError("");
    setShowModal(true);
  };

  /*
  =========================================================
  CLOSE MODAL
  =========================================================
  */

  const closeModal = () => {
    if (submitting) return;

    setShowModal(false);
    setEditingResource(null);
    setFormData(initialForm);
  };

  /*
  =========================================================
  SUBMIT
  =========================================================
  */

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.name.trim()) {
      setError("Resource name is required");
      return;
    }

    if (!formData.project) {
      setError("Please select a project");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      if (editingResource) {
        const response =
          await resourceService.updateResource(
            editingResource._id,
            formData
          );

        setSuccess(
          response.message ||
            "Resource updated successfully"
        );
      } else {
        const response =
          await resourceService.createResource(
            formData
          );

        setSuccess(
          response.message ||
            "Resource created successfully"
        );
      }

      closeModal();
      await fetchResources();
    } catch (err) {
      console.error("Resource save error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to save resource"
      );
    } finally {
      setSubmitting(false);
    }
  };

  /*
  =========================================================
  STATUS CHANGE
  =========================================================
  */

  const handleStatusChange = async (resource) => {
    const action = resource.isActive
      ? "deactivate"
      : "activate";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} "${resource.name}"?`
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      const response =
        await resourceService.updateResourceStatus(
          resource._id,
          !resource.isActive
        );

      setSuccess(
        response.message ||
          "Resource status updated successfully"
      );

      await fetchResources();
    } catch (err) {
      console.error(
        "Resource status error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to update resource status"
      );
    }
  };

  /*
  =========================================================
  DELETE
  =========================================================
  */

  const handleDelete = async (resource) => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete "${resource.name}"?`
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      const response =
        await resourceService.deleteResource(
          resource._id
        );

      setSuccess(
        response.message ||
          "Resource deleted successfully"
      );

      if (
        resources.length === 1 &&
        page > 1
      ) {
        setPage((previous) => previous - 1);
      } else {
        await fetchResources();
      }
    } catch (err) {
      console.error(
        "Resource delete error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to delete resource"
      );
    }
  };

  /*
  =========================================================
  SORT
  =========================================================
  */

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder((previous) =>
        previous === "asc"
          ? "desc"
          : "asc"
      );
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }

    setPage(1);
  };

  /*
  =========================================================
  CLEAR FILTERS
  =========================================================
  */

  const clearFilters = () => {
    setSearch("");
    setTypeFilter("");
    setEnvironmentFilter("");
    setSensitivityFilter("");
    setProjectFilter("");
    setActiveFilter("");
    setPage(1);
  };

  /*
  =========================================================
  DISPLAY HELPERS
  =========================================================
  */

  const formatLabel = (value) => {
    if (!value) return "-";

    return value
      .toLowerCase()
      .split("_")
      .map(
        (word) =>
          word.charAt(0).toUpperCase() +
          word.slice(1)
      )
      .join(" ");
  };

  const getSensitivityClass = (sensitivity) => {
    return `sensitivity-${sensitivity
      ?.toLowerCase()
      .replace("_", "-")}`;
  };

  const getEnvironmentClass = (environment) => {
    return `environment-${environment
      ?.toLowerCase()
      .replace("_", "-")}`;
  };

  const hasActiveFilters = useMemo(() => {
    return Boolean(
      search ||
        typeFilter ||
        environmentFilter ||
        sensitivityFilter ||
        projectFilter ||
        activeFilter !== ""
    );
  }, [
    search,
    typeFilter,
    environmentFilter,
    sensitivityFilter,
    projectFilter,
    activeFilter,
  ]);

  /*
  =========================================================
  RENDER
  =========================================================
  */

  return (
    <div className="resources-page">

      {/* HEADER */}

      <div className="page-header">

        <div>
          <p className="page-eyebrow">
            Workspace Management
          </p>

          <h1>Resources</h1>

          <p>
            Manage repositories, databases, APIs,
            servers and other project resources.
          </p>
        </div>

        <PermissionGate permission="resources.create">
          <button
            className="add-user-button"
            onClick={openCreateModal}
          >
            + Add Resource
          </button>
        </PermissionGate>

      </div>

      {/* ALERTS */}

      {error && (
        <div className="alert alert-error">

          <span>{error}</span>

          <button
            onClick={() => setError("")}
            className="alert-close"
          >
            ×
          </button>

        </div>
      )}

      {success && (
        <div className="alert alert-success">
          {success}
        </div>
      )}

      {/* TOOLBAR */}

      <div className="users-toolbar resources-toolbar">

        <div className="search-form">

          <div className="search-input-wrapper">

            <input
              type="text"
              placeholder="Search resources..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />

          </div>

        </div>

        <select
          value={typeFilter}
          onChange={(event) => {
            setTypeFilter(event.target.value);
            setPage(1);
          }}
        >
          <option value="">All Types</option>

          {RESOURCE_TYPES.map((type) => (
            <option key={type} value={type}>
              {formatLabel(type)}
            </option>
          ))}
        </select>

        <select
          value={environmentFilter}
          onChange={(event) => {
            setEnvironmentFilter(
              event.target.value
            );
            setPage(1);
          }}
        >
          <option value="">
            All Environments
          </option>

          {ENVIRONMENTS.map((environment) => (
            <option
              key={environment}
              value={environment}
            >
              {formatLabel(environment)}
            </option>
          ))}
        </select>

        <select
          value={sensitivityFilter}
          onChange={(event) => {
            setSensitivityFilter(
              event.target.value
            );
            setPage(1);
          }}
        >
          <option value="">
            All Sensitivities
          </option>

          {SENSITIVITIES.map((sensitivity) => (
            <option
              key={sensitivity}
              value={sensitivity}
            >
              {formatLabel(sensitivity)}
            </option>
          ))}
        </select>

        <select
          value={projectFilter}
          onChange={(event) => {
            setProjectFilter(event.target.value);
            setPage(1);
          }}
        >
          <option value="">All Projects</option>

          {projects.map((project) => (
            <option
              key={project._id}
              value={project._id}
            >
              {project.name}
            </option>
          ))}
        </select>

        <select
          value={activeFilter}
          onChange={(event) => {
            setActiveFilter(event.target.value);
            setPage(1);
          }}
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>

        {hasActiveFilters && (
          <button
            className="clear-filter-button"
            onClick={clearFilters}
          >
            Clear
          </button>
        )}

      </div>

      {/* TABLE */}

      <div className="table-card">

        <div className="table-card-header">

          <div>
            <h2>Resource Directory</h2>

            <p>
              {pagination.totalItems} resource
              {pagination.totalItems !== 1
                ? "s"
                : ""}{" "}
              found
            </p>
          </div>

          <span className="table-count">
            {pagination.totalItems}
          </span>

        </div>

        {loading ? (
          <div className="table-loading">

            <div className="loading-spinner"></div>

            <span>
              Loading resources...
            </span>

          </div>
        ) : resources.length === 0 ? (
          <div className="empty-state">

            <h3>No resources found</h3>

            <p>
              {hasActiveFilters
                ? "Try changing or clearing your filters."
                : "Create your first resource to get started."}
            </p>

            {!hasActiveFilters && (
              <PermissionGate permission="resources.create">

                <button
                  className="primary-button"
                  onClick={openCreateModal}
                >
                  + Add Resource
                </button>

              </PermissionGate>
            )}

          </div>
        ) : (
          <>

            <div className="table-wrapper">

              <table className="data-table">

                <thead>

                  <tr>

                    <th
                      onClick={() =>
                        handleSort("name")
                      }
                    >
                      Resource
                      {sortBy === "name" &&
                        (sortOrder === "asc"
                          ? " ↑"
                          : " ↓")}
                    </th>

                    <th>
                      Type
                    </th>

                    <th>
                      Project
                    </th>

                    <th
                      onClick={() =>
                        handleSort("environment")
                      }
                    >
                      Environment
                      {sortBy === "environment" &&
                        (sortOrder === "asc"
                          ? " ↑"
                          : " ↓")}
                    </th>

                    <th
                      onClick={() =>
                        handleSort("sensitivity")
                      }
                    >
                      Sensitivity
                      {sortBy === "sensitivity" &&
                        (sortOrder === "asc"
                          ? " ↑"
                          : " ↓")}
                    </th>

                    <th>
                      Status
                    </th>

                    <th className="actions-column">
                      Actions
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {resources.map((resource) => (

                    <tr key={resource._id}>

                      {/* RESOURCE */}

                      <td>

                        <div className="user-cell">

                          <div className="user-avatar">
                            {resource.name
                              ?.charAt(0)
                              ?.toUpperCase()}
                          </div>

                          <div className="user-info">

                            <strong>
                              {resource.name}
                            </strong>

                            {resource.description && (
                              <span className="resource-description">
                                {resource.description}
                              </span>
                            )}

                          </div>

                        </div>

                      </td>

                      {/* TYPE */}

                      <td>

                        <span className="role-badge resource-type-badge">
                          {formatLabel(
                            resource.type
                          )}
                        </span>

                      </td>

                      {/* PROJECT */}

                      <td>

                        <div className="table-project">

                          <strong>
                            {resource.project?.name ||
                              "Unknown Project"}
                          </strong>

                          {resource.project?.status && (
                            <span>
                              {formatLabel(
                                resource.project.status
                              )}
                            </span>
                          )}

                        </div>

                      </td>

                      {/* ENVIRONMENT */}

                      <td>

                        <span
                          className={`resource-badge ${getEnvironmentClass(
                            resource.environment
                          )}`}
                        >
                          {formatLabel(
                            resource.environment
                          )}
                        </span>

                      </td>

                      {/* SENSITIVITY */}

                      <td>

                        <span
                          className={`resource-badge ${getSensitivityClass(
                            resource.sensitivity
                          )}`}
                        >
                          {formatLabel(
                            resource.sensitivity
                          )}
                        </span>

                      </td>

                      {/* STATUS */}

                      <td>

                        <span
                          className={`status-badge ${
                            resource.isActive
                              ? "status-active"
                              : "status-inactive"
                          }`}
                        >

                          <span className="status-dot"></span>

                          {resource.isActive
                            ? "Active"
                            : "Inactive"}

                        </span>

                      </td>

                      {/* ACTIONS */}

                      <td className="actions-column">

                        <div className="action-buttons">

                          <PermissionGate permission="resources.update">

                            <button
                              className="table-action"
                              onClick={() =>
                                openEditModal(
                                  resource
                                )
                              }
                            >
                              Edit
                            </button>

                            <button
                              className="table-action"
                              onClick={() =>
                                handleStatusChange(
                                  resource
                                )
                              }
                            >
                              {resource.isActive
                                ? "Deactivate"
                                : "Activate"}
                            </button>

                          </PermissionGate>

                          <PermissionGate permission="resources.delete">

                            <button
                              className="table-action danger"
                              onClick={() =>
                                handleDelete(
                                  resource
                                )
                              }
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

            {/* PAGINATION */}

            {pagination.totalPages > 1 && (

              <div className="pagination">

                <button
                  disabled={page <= 1}
                  onClick={() =>
                    setPage(
                      (previous) =>
                        previous - 1
                    )
                  }
                >
                  Previous
                </button>

                <div className="pagination-pages">

                  <button className="active">
                    {pagination.currentPage}
                  </button>

                </div>

                <button
                  disabled={
                    page >=
                    pagination.totalPages
                  }
                  onClick={() =>
                    setPage(
                      (previous) =>
                        previous + 1
                    )
                  }
                >
                  Next
                </button>

              </div>

            )}

          </>
        )}

      </div>

      {/* CREATE / EDIT MODAL */}

      {showModal && (

        <div className="modal-overlay">

          <div className="modal-card resource-modal">

            <div className="modal-header">

              <div>

                <h2>
                  {editingResource
                    ? "Edit Resource"
                    : "Create Resource"}
                </h2>

                <p>
                  {editingResource
                    ? "Update resource information."
                    : "Add a new project resource."}
                </p>

              </div>

              <button
                className="modal-close"
                onClick={closeModal}
                disabled={submitting}
              >
                ×
              </button>

            </div>

            <form
              className="modal-form"
              onSubmit={handleSubmit}
            >

              <div className="form-group">

                <label>
                  Resource Name *
                </label>

                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Production MongoDB"
                  required
                />

              </div>

              <div className="form-group">

                <label>
                  Resource Type *
                </label>

                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                >
                  {RESOURCE_TYPES.map((type) => (
                    <option
                      key={type}
                      value={type}
                    >
                      {formatLabel(type)}
                    </option>
                  ))}
                </select>

              </div>

              <div className="form-group">

                <label>
                  Project *
                </label>

                <select
                  name="project"
                  value={formData.project}
                  onChange={handleInputChange}
                  required
                  disabled={projectsLoading}
                >
                  <option value="">
                    {projectsLoading
                      ? "Loading projects..."
                      : "Select Project"}
                  </option>

                  {projects.map((project) => (
                    <option
                      key={project._id}
                      value={project._id}
                    >
                      {project.name}
                    </option>
                  ))}

                </select>

              </div>

              <div className="form-group">

                <label>
                  Environment
                </label>

                <select
                  name="environment"
                  value={formData.environment}
                  onChange={handleInputChange}
                >
                  {ENVIRONMENTS.map(
                    (environment) => (
                      <option
                        key={environment}
                        value={environment}
                      >
                        {formatLabel(
                          environment
                        )}
                      </option>
                    )
                  )}
                </select>

              </div>

              <div className="form-group">

                <label>
                  Sensitivity
                </label>

                <select
                  name="sensitivity"
                  value={formData.sensitivity}
                  onChange={handleInputChange}
                >
                  {SENSITIVITIES.map(
                    (sensitivity) => (
                      <option
                        key={sensitivity}
                        value={sensitivity}
                      >
                        {formatLabel(
                          sensitivity
                        )}
                      </option>
                    )
                  )}
                </select>

              </div>

              <div className="form-group">

                <label>
                  Resource URL
                </label>

                <input
                  type="text"
                  name="url"
                  value={formData.url}
                  onChange={handleInputChange}
                  placeholder="https://..."
                />

              </div>

              <div className="form-group">

                <label>
                  Description
                </label>

                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe this resource..."
                  rows="4"
                />

              </div>

              <div className="modal-actions">

                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeModal}
                  disabled={submitting}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={submitting}
                >
                  {submitting
                    ? "Saving..."
                    : editingResource
                    ? "Update Resource"
                    : "Create Resource"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
};

export default Resources;

