import { useEffect, useState } from "react";
import accessService from "../../services/accessService";
import PermissionGate from "../../components/PermissionGate";

const STATUS_OPTIONS = [
  "ACTIVE",
  "REVOKED",
  "EXPIRED",
];

const AccessGrants = () => {
  const [grants, setGrants] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [status, setStatus] = useState("ACTIVE");
  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  });

  const [showRevokeModal, setShowRevokeModal] =
    useState(false);

  const [selectedGrant, setSelectedGrant] =
    useState(null);

  const [revokeReason, setRevokeReason] =
    useState("");

  const [formLoading, setFormLoading] =
    useState(false);

  /*
  =========================================================
  FETCH ACCESS GRANTS
  =========================================================
  */

  const fetchGrants = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await accessService.getAccessGrants({
          page,
          limit: 10,
          isActive:
            status === "ACTIVE"
              ? true
              : status === "REVOKED"
              ? false
              : undefined,
        });

      /*
        Backend response:

        {
          success: true,
          accessGrants: [...]
        }
      */

      let filteredGrants =
        response.accessGrants || [];

      /*
        EXPIRED grants are still stored as
        isActive: true in database.

        Backend calculates effectiveStatus,
        so we filter EXPIRED here.
      */

      if (status === "EXPIRED") {
        filteredGrants =
          filteredGrants.filter(
            (grant) =>
              grant.effectiveStatus ===
              "EXPIRED"
          );
      }

      setGrants(filteredGrants);

      setPagination(
        response.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          itemsPerPage: 10,
        }
      );
    } catch (error) {
      console.error(
        "Failed to load access grants:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to load access grants"
      );
    } finally {
      setLoading(false);
    }
  };

  /*
  =========================================================
  LOAD GRANTS
  =========================================================
  */

  useEffect(() => {
    fetchGrants();
  }, [page, status]);

  /*
  =========================================================
  OPEN REVOKE MODAL
  =========================================================
  */

  const openRevokeModal = (grant) => {
    setSelectedGrant(grant);
    setRevokeReason("");
    setShowRevokeModal(true);
  };

  /*
  =========================================================
  REVOKE ACCESS
  =========================================================
  */

  const handleRevoke = async (event) => {
    event.preventDefault();

    if (!selectedGrant) return;

    try {
      setFormLoading(true);
      setError("");

      await accessService.revokeAccessGrant(
        selectedGrant._id,
        revokeReason
      );

      setShowRevokeModal(false);
      setSelectedGrant(null);
      setRevokeReason("");

      await fetchGrants();
    } catch (error) {
      console.error(
        "Failed to revoke access:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to revoke access"
      );
    } finally {
      setFormLoading(false);
    }
  };

  /*
  =========================================================
  FORMAT DATE
  =========================================================
  */

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString(
      "en-PK",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  /*
  =========================================================
  FORMAT DATE + TIME
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
  RENDER
  =========================================================
  */

  return (
    <div className="access-grants-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="dashboard-header">
        <div>
          <span className="eyebrow">
            ACCESS MANAGEMENT
          </span>

          <h1>Access Grants</h1>

          <p className="dashboard-subtitle">
            View and manage granted access to
            workspace resources.
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

      <div className="dashboard-card access-grants-card">

        {/* =================================================
            FILTER
        ================================================= */}

        <div className="filters-row">

          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
          >
            {STATUS_OPTIONS.map(
              (item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              )
            )}
          </select>

        </div>

        {/* =================================================
            LOADING
        ================================================= */}

        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>

            <p>
              Loading access grants...
            </p>
          </div>
        ) : grants.length === 0 ? (
          /* =================================================
             EMPTY
          ================================================= */

          <div className="empty-state">
            <h3>
              No access grants found
            </h3>

            <p>
              There are no grants matching
              the current filter.
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
                    <th>User</th>
                    <th>Resource</th>
                    <th>Project</th>
                    <th>Access</th>
                    <th>Start Date</th>
                    <th>Expires</th>
                    <th>Status</th>
                    <th>Granted By</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {grants.map(
                    (grant) => (
                      <tr
                        key={
                          grant._id
                        }
                      >

                        {/* USER */}

                        <td>
                          <div className="table-primary">
                            {grant.user?.name ||
                              "Unknown User"}
                          </div>

                          {grant.user?.email && (
                            <div className="table-secondary">
                              {
                                grant
                                  .user
                                  .email
                              }
                            </div>
                          )}
                        </td>

                        {/* RESOURCE */}

                        <td>
                          <div className="table-primary">
                            {grant.resource
                              ?.name ||
                              "Unknown Resource"}
                          </div>

                          {grant.resource
                            ?.environment && (
                            <div className="table-secondary">
                              {
                                grant
                                  .resource
                                  .environment
                              }
                            </div>
                          )}
                        </td>

                        {/* PROJECT */}

                        <td>
                          <div className="table-primary">
                            {grant.project
                              ?.name ||
                              "-"}
                          </div>
                        </td>

                        {/* ACCESS LEVEL */}

                        <td>
                          <span
                            className={`grant-access-badge grant-access-${grant.accessLevel?.toLowerCase()}`}
                          >
                            {
                              grant.accessLevel
                            }
                          </span>
                        </td>

                        {/* START DATE */}

                        <td>
                          {formatDate(
                            grant.startDate
                          )}
                        </td>

                        {/* EXPIRY */}

                        <td>
                          {grant.expiresAt
                            ? formatDate(
                                grant.expiresAt
                              )
                            : "No expiry"}
                        </td>

                        {/* STATUS */}

                        <td>
                          <span
                            className={`grant-status-badge grant-status-${grant.effectiveStatus?.toLowerCase()}`}
                          >
                            {
                              grant.effectiveStatus
                            }
                          </span>
                        </td>

                        {/* GRANTED BY */}

                        <td>
                          <div className="table-primary">
                            {grant
                              .grantedBy
                              ?.name ||
                              "-"}
                          </div>
                        </td>

                        {/* ACTIONS */}

                        <td>
                          <div className="table-actions">

                            {grant.effectiveStatus ===
                              "ACTIVE" && (
                              <PermissionGate permission="access.revoke">
                                <button
                                  className="action-button danger"
                                  onClick={() =>
                                    openRevokeModal(
                                      grant
                                    )
                                  }
                                >
                                  Revoke
                                </button>
                              </PermissionGate>
                            )}

                            {grant.effectiveStatus !==
                              "ACTIVE" && (
                              <span className="no-action">
                                No actions
                              </span>
                            )}

                          </div>
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
                  pagination.totalItems
                }{" "}
                grants
              </span>

              <div className="pagination-buttons">

                <button
                  disabled={
                    page <= 1
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

            </div>
          </>
        )}
      </div>

      {/* =================================================
          REVOKE MODAL
      ================================================= */}

      {showRevokeModal &&
        selectedGrant && (
          <div className="modal-overlay">

            <div className="modal access-grant-modal">

              <div className="modal-header">

                <div>
                  <h2>
                    Revoke Access
                  </h2>

                  <p>
                    Remove access from{" "}
                    <strong>
                      {
                        selectedGrant
                          .user
                          ?.name
                      }
                    </strong>
                  </p>
                </div>

                <button
                  className="modal-close"
                  onClick={() =>
                    setShowRevokeModal(
                      false
                    )
                  }
                >
                  ×
                </button>

              </div>

              {/* GRANT INFO */}

              <div className="grant-review-info">

                <div>
                  <span>
                    Resource
                  </span>

                  <strong>
                    {
                      selectedGrant
                        .resource
                        ?.name ||
                      "-"
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Access
                  </span>

                  <strong>
                    {
                      selectedGrant
                        .accessLevel ||
                      "-"
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Granted
                  </span>

                  <strong>
                    {formatDateTime(
                      selectedGrant.createdAt
                    )}
                  </strong>
                </div>

              </div>

              {/* FORM */}

              <form
                onSubmit={
                  handleRevoke
                }
              >

                <div className="form-group">

                  <label>
                    Revoke Reason
                  </label>

                  <textarea
                    value={
                      revokeReason
                    }
                    onChange={(
                      event
                    ) =>
                      setRevokeReason(
                        event.target
                          .value
                      )
                    }
                    placeholder="Why is this access being revoked?"
                  />

                </div>

                <div className="modal-footer">

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() =>
                      setShowRevokeModal(
                        false
                      )
                    }
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="danger-button"
                    disabled={
                      formLoading
                    }
                  >
                    {formLoading
                      ? "Revoking..."
                      : "Revoke Access"}
                  </button>

                </div>

              </form>

            </div>

          </div>
        )}
    </div>
  );
};

export default AccessGrants;