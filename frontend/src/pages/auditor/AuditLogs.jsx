import { useEffect, useState } from "react";
import api from "../../services/api";

const ACTION_OPTIONS = [
  "USER_CREATED",
  "USER_UPDATED",
  "USER_DELETED",
  "USER_ACTIVATED",
  "USER_DEACTIVATED",
  "PROJECT_CREATED",
  "PROJECT_UPDATED",
  "PROJECT_DELETED",
  "RESOURCE_CREATED",
  "RESOURCE_UPDATED",
  "RESOURCE_DELETED",
  "ACCESS_REQUEST_CREATED",
  "ACCESS_REQUEST_APPROVED",
  "ACCESS_REQUEST_REJECTED",
  "ACCESS_REQUEST_CANCELLED",
  "ACCESS_GRANTED",
  "ACCESS_REVOKED",
];

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [action, setAction] =
    useState("");

  const [user, setUser] =
    useState("");

  const [resource, setResource] =
    useState("");

  const [sortOrder, setSortOrder] =
    useState("desc");

  const [page, setPage] =
    useState(1);

  const [pagination, setPagination] =
    useState({
      currentPage: 1,
      totalPages: 1,
      totalLogs: 0,
      perPage: 10,
      hasNextPage: false,
      hasPreviousPage: false,
    });

  const [selectedLog, setSelectedLog] =
    useState(null);

  const [showDetailsModal, setShowDetailsModal] =
    useState(false);

  /*
  =========================================================
  FETCH AUDIT LOGS
  =========================================================
  */

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        "/audit-logs",
        {
          params: {
            action:
              action || undefined,

            user:
              user.trim() || undefined,

            resource:
              resource.trim() ||
              undefined,

            page,
            limit: 10,
            sortOrder,
          },
        }
      );

      /*
        IMPORTANT:

        Backend returns:

        response.auditLogs

        NOT:

        response.logs
      */

      setLogs(
        response.data.auditLogs || []
      );

      setPagination(
        response.data.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalLogs: 0,
          perPage: 10,
          hasNextPage: false,
          hasPreviousPage: false,
        }
      );
    } catch (error) {
      console.error(
        "Failed to load audit logs:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to load audit logs"
      );
    } finally {
      setLoading(false);
    }
  };

  /*
  =========================================================
  LOAD LOGS
  =========================================================
  */

  useEffect(() => {
    fetchLogs();
  }, [
    page,
    action,
    sortOrder,
  ]);

  /*
  =========================================================
  APPLY SEARCH/FILTER
  =========================================================
  */

  const handleFilterSubmit = (
    event
  ) => {
    event.preventDefault();

    setPage(1);
    fetchLogs();
  };

  /*
  =========================================================
  CLEAR FILTERS
  =========================================================
  */

  const handleClearFilters = () => {
    setAction("");
    setUser("");
    setResource("");
    setSortOrder("desc");
    setPage(1);
  };

  /*
  =========================================================
  OPEN DETAILS
  =========================================================
  */

  const openDetails = (log) => {
    setSelectedLog(log);
    setShowDetailsModal(true);
  };

  /*
  =========================================================
  FORMAT DATE
  =========================================================
  */

  const formatDateTime = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleString(
      "en-PK",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  /*
  =========================================================
  FORMAT ACTION
  =========================================================
  */

  const formatAction = (value) => {
    if (!value) return "-";

    return value
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (char) =>
        char.toUpperCase()
      );
  };

  /*
  =========================================================
  ACTION CLASS
  =========================================================
  */

  const getActionClass = (value) => {
    if (!value) return "";

    if (
      value.includes("DELETE") ||
      value.includes("REVOKED") ||
      value.includes("REJECTED")
    ) {
      return "audit-action-danger";
    }

    if (
      value.includes("CREATED") ||
      value.includes("GRANTED") ||
      value.includes("APPROVED")
    ) {
      return "audit-action-success";
    }

    if (
      value.includes("UPDATED") ||
      value.includes("CANCELLED")
    ) {
      return "audit-action-warning";
    }

    return "audit-action-default";
  };

  return (
    <div className="audit-logs-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="dashboard-header">

        <div>
          <span className="eyebrow">
            SECURITY
          </span>

          <h1>Audit Logs</h1>

          <p className="dashboard-subtitle">
            Track important activity and
            security events across DevAccess.
          </p>
        </div>

      </div>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {/* =================================================
          MAIN CARD
      ================================================= */}

      <div className="dashboard-card audit-logs-card">

        {/* =================================================
            FILTERS
        ================================================= */}

        <form
          className="audit-filters"
          onSubmit={
            handleFilterSubmit
          }
        >

          <div className="audit-filter-group">
            <label>
              Action
            </label>

            <select
              value={action}
              onChange={(event) => {
                setAction(
                  event.target.value
                );
                setPage(1);
              }}
            >
              <option value="">
                All Actions
              </option>

              {ACTION_OPTIONS.map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {formatAction(item)}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="audit-filter-group">
            <label>
              User ID
            </label>

            <input
              type="text"
              value={user}
              onChange={(event) =>
                setUser(
                  event.target.value
                )
              }
              placeholder="Enter user ID"
            />
          </div>

          <div className="audit-filter-group">
            <label>
              Resource
            </label>

            <input
              type="text"
              value={resource}
              onChange={(event) =>
                setResource(
                  event.target.value
                )
              }
              placeholder="Resource ID"
            />
          </div>

          <div className="audit-filter-group">
            <label>
              Sort
            </label>

            <select
              value={sortOrder}
              onChange={(event) => {
                setSortOrder(
                  event.target.value
                );
                setPage(1);
              }}
            >
              <option value="desc">
                Newest First
              </option>

              <option value="asc">
                Oldest First
              </option>
            </select>
          </div>

          <div className="audit-filter-actions">

            <button
              type="submit"
              className="primary-button"
            >
              Apply
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={
                handleClearFilters
              }
            >
              Clear
            </button>

          </div>

        </form>

        {/* =================================================
            CONTENT
        ================================================= */}

        {loading ? (
          <div className="loading-state">

            <div className="loading-spinner"></div>

            <p>
              Loading audit logs...
            </p>

          </div>
        ) : logs.length === 0 ? (
          <div className="empty-state">

            <h3>
              No audit logs found
            </h3>

            <p>
              No activity matches the
              current filters.
            </p>

          </div>
        ) : (
          <>

            {/* =================================================
                TABLE
            ================================================= */}

            <div className="data-table">

              <table>

                <thead>
                  <tr>
                    <th>
                      Date & Time
                    </th>

                    <th>
                      User
                    </th>

                    <th>
                      Action
                    </th>

                    <th>
                      Resource
                    </th>

                    <th>
                      Details
                    </th>

                    <th>
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {logs.map(
                    (log) => (
                      <tr
                        key={
                          log._id
                        }
                      >

                        {/* DATE */}

                        <td>
                          <div className="table-primary">
                            {formatDateTime(
                              log.createdAt
                            )}
                          </div>
                        </td>

                        {/* USER */}

                        <td>
                          <div className="table-primary">
                            {log.user?.name ||
                              "System"}
                          </div>

                          {log.user
                            ?.email && (
                            <div className="table-secondary">
                              {
                                log
                                  .user
                                  .email
                              }
                            </div>
                          )}
                        </td>

                        {/* ACTION */}

                        <td>
                          <span
                            className={`audit-action-badge ${getActionClass(
                              log.action
                            )}`}
                          >
                            {formatAction(
                              log.action
                            )}
                          </span>
                        </td>

                        {/* RESOURCE */}

                        <td>
                          <div className="table-primary">
                            {log.resource ||
                              "-"}
                          </div>

                          {log.resourceId && (
                            <div className="table-secondary">
                              {
                                log.resourceId
                              }
                            </div>
                          )}
                        </td>

                        {/* DETAILS */}

                        <td>
                          <div className="audit-details-preview">
                            {log.details ||
                              "-"}
                          </div>
                        </td>

                        {/* VIEW */}

                        <td>
                          <button
                            className="action-button"
                            onClick={() =>
                              openDetails(
                                log
                              )
                            }
                          >
                            View
                          </button>
                        </td>

                      </tr>
                    )
                  )}
                </tbody>

              </table>

            </div>

            {/* =================================================
                PAGINATION
            ================================================= */}

            <div className="pagination">

              <span className="pagination-info">
                Page{" "}
                {
                  pagination.currentPage
                }{" "}
                of{" "}
                {
                  pagination.totalPages
                }{" "}
                —{" "}
                {
                  pagination.totalLogs
                }{" "}
                logs
              </span>

              <div className="pagination-buttons">

                <button
                  disabled={
                    !pagination.hasPreviousPage
                  }
                  onClick={() =>
                    setPage(
                      (previous) =>
                        previous - 1
                    )
                  }
                >
                  Previous
                </button>

                <button
                  className="active"
                  disabled
                >
                  {
                    pagination.currentPage
                  }
                </button>

                <button
                  disabled={
                    !pagination.hasNextPage
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

            </div>

          </>
        )}

      </div>

      {/* =================================================
          DETAILS MODAL
      ================================================= */}

      {showDetailsModal &&
        selectedLog && (
          <div className="modal-overlay">

            <div className="modal audit-log-modal">

              <div className="modal-header">

                <div>
                  <h2>
                    Audit Log Details
                  </h2>

                  <p>
                    Complete security
                    event information.
                  </p>
                </div>

                <button
                  className="modal-close"
                  onClick={() =>
                    setShowDetailsModal(
                      false
                    )
                  }
                >
                  ×
                </button>

              </div>

              <div className="audit-log-details">

                <div className="audit-detail-item">
                  <span>
                    Action
                  </span>

                  <strong>
                    {formatAction(
                      selectedLog.action
                    )}
                  </strong>
                </div>

                <div className="audit-detail-item">
                  <span>
                    User
                  </span>

                  <strong>
                    {selectedLog.user
                      ?.name ||
                      "System"}
                  </strong>
                </div>

                <div className="audit-detail-item">
                  <span>
                    Email
                  </span>

                  <strong>
                    {selectedLog.user
                      ?.email ||
                      "-"}
                  </strong>
                </div>

                <div className="audit-detail-item">
                  <span>
                    Resource
                  </span>

                  <strong>
                    {selectedLog.resource ||
                      "-"}
                  </strong>
                </div>

                <div className="audit-detail-item">
                  <span>
                    Resource ID
                  </span>

                  <strong>
                    {selectedLog.resourceId ||
                      "-"}
                  </strong>
                </div>

                <div className="audit-detail-item">
                  <span>
                    Date & Time
                  </span>

                  <strong>
                    {formatDateTime(
                      selectedLog.createdAt
                    )}
                  </strong>
                </div>

                <div className="audit-detail-full">
                  <span>
                    Details
                  </span>

                  <p>
                    {selectedLog.details ||
                      "No details available."}
                  </p>
                </div>

              </div>

              <div className="modal-footer">

                <button
                  className="secondary-button"
                  onClick={() =>
                    setShowDetailsModal(
                      false
                    )
                  }
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

export default AuditLogs;