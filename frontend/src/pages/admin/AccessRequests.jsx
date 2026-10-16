import { useEffect, useState } from "react";
import accessService from "../../services/accessService";
import resourceService from "../../services/resourceService";
import PermissionGate from "../../components/PermissionGate";

const REQUESTED_ROLES = ["READ", "WRITE", "ADMIN"];

const STATUS_OPTIONS = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
];

const AccessRequests = () => {
  const [requests, setRequests] = useState([]);
  const [resources, setResources] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [reviewAction, setReviewAction] = useState("");
  const [reviewComment, setReviewComment] = useState("");

  const [form, setForm] = useState({
    resource: "",
    reason: "",
    requestedRole: "READ",
  });

  const [formLoading, setFormLoading] = useState(false);

  const fetchResources = async () => {
    try {
      const response = await resourceService.getResources({
        page: 1,
        limit: 100,
        isActive: true,
      });

      setResources(response.resources || []);
    } catch (error) {
      console.error("Failed to load resources:", error);
    }
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await accessService.getAccessRequests({
        page,
        limit: 10,
        status: status || undefined,
      });

      setRequests(response.accessRequests || []);

      setPagination(
        response.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          itemsPerPage: 10,
        }
      );
    } catch (error) {
      console.error("Failed to load access requests:", error);

      setError(
        error.response?.data?.message ||
          "Failed to load access requests"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [page, status]);

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleCreateRequest = async (event) => {
    event.preventDefault();

    try {
      setFormLoading(true);
      setError("");

      await accessService.createAccessRequest({
        resource: form.resource,
        reason: form.reason,
        requestedRole: form.requestedRole,
      });

      setShowCreateModal(false);

      setForm({
        resource: "",
        reason: "",
        requestedRole: "READ",
      });

      setPage(1);
      await fetchRequests();
    } catch (error) {
      console.error("Failed to create request:", error);

      setError(
        error.response?.data?.message ||
          "Failed to create access request"
      );
    } finally {
      setFormLoading(false);
    }
  };

  const openReviewModal = (request, action) => {
    setSelectedRequest(request);
    setReviewAction(action);
    setReviewComment("");
    setShowReviewModal(true);
  };

  const handleReview = async (event) => {
    event.preventDefault();

    if (!selectedRequest) return;

    try {
      setFormLoading(true);
      setError("");

      if (reviewAction === "APPROVE") {
        await accessService.approveAccessRequest(
          selectedRequest._id,
          reviewComment
        );
      }

      if (reviewAction === "REJECT") {
        await accessService.rejectAccessRequest(
          selectedRequest._id,
          reviewComment
        );
      }

      setShowReviewModal(false);
      setSelectedRequest(null);
      setReviewAction("");
      setReviewComment("");

      await fetchRequests();
    } catch (error) {
      console.error("Failed to review request:", error);

      setError(
        error.response?.data?.message ||
          "Failed to process access request"
      );
    } finally {
      setFormLoading(false);
    }
  };

  const handleCancel = async (request) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this request?"
    );

    if (!confirmed) return;

    try {
      setError("");

      await accessService.cancelAccessRequest(request._id);

      await fetchRequests();
    } catch (error) {
      console.error("Failed to cancel request:", error);

      setError(
        error.response?.data?.message ||
          "Failed to cancel access request"
      );
    }
  };

  const getResourceName = (request) => {
    if (!request.resource) {
      return "Unknown Resource";
    }

    if (typeof request.resource === "object") {
      return request.resource.name || "Unknown Resource";
    }

    const resource = resources.find(
      (item) => item._id === request.resource
    );

    return resource?.name || "Unknown Resource";
  };

  const getUserName = (request) => {
    if (!request.requester) {
      return "Unknown User";
    }

    if (typeof request.requester === "object") {
      return (
        request.requester.name ||
        request.requester.email ||
        "Unknown User"
      );
    }

    return request.requester;
  };

  const getProjectName = (request) => {
    if (!request.project) return "";

    if (typeof request.project === "object") {
      return request.project.name || "";
    }

    return "";
  };

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-PK", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="access-requests-page">
      <div className="dashboard-header">
        <div>
          <span className="eyebrow">ACCESS MANAGEMENT</span>

          <h1>Access Requests</h1>

          <p className="dashboard-subtitle">
            Manage developer requests for workspace resources.
          </p>
        </div>

        <PermissionGate permission="access.request">
          <button
            type="button"
            className="primary-button"
            onClick={() => setShowCreateModal(true)}
          >
            + Request Access
          </button>
        </PermissionGate>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <div className="dashboard-card access-requests-card">
        <div className="filters-row">
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All Statuses</option>

            {STATUS_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading access requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="empty-state">
            <h3>No access requests found</h3>

            <p>
              There are no requests matching the current filter.
            </p>
          </div>
        ) : (
          <>
            <div className="data-table">
              <table>
                <thead>
                  <tr>
                    <th className="requester-column">
                      Requester
                    </th>

                    <th className="resource-column">
                      Resource
                    </th>

                    <th className="access-column">
                      Access
                    </th>

                    <th className="reason-column">
                      Reason
                    </th>

                    <th className="status-column">
                      Status
                    </th>

                    <th className="date-column">
                      Requested
                    </th>

                    <th className="actions-column">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {requests.map((request) => (
                    <tr key={request._id}>
                      <td>
                        <div className="table-primary">
                          {getUserName(request)}
                        </div>

                        {request.requester?.email && (
                          <div className="table-secondary">
                            {request.requester.email}
                          </div>
                        )}
                      </td>

                      <td>
                        <div className="table-primary">
                          {getResourceName(request)}
                        </div>

                        {getProjectName(request) && (
                          <div className="table-secondary">
                            {getProjectName(request)}
                          </div>
                        )}
                      </td>

                      <td>
                        <span
                          className={`access-level-badge access-level-${request.requestedRole?.toLowerCase()}`}
                        >
                          {request.requestedRole}
                        </span>
                      </td>

                      <td>
                        <div className="request-reason">
                          {request.reason || "-"}
                        </div>
                      </td>

                      <td>
                        <span
                          className={`status-badge request-status-${request.status?.toLowerCase()}`}
                        >
                          {request.status}
                        </span>
                      </td>

                      <td>
                        <span className="date-text">
                          {formatDate(request.createdAt)}
                        </span>
                      </td>

                      <td className="actions-cell">
                        <div className="actions-container">
                          {request.status === "PENDING" ? (
                            <>
                              <PermissionGate permission="access.approve">
                                <button
                                  type="button"
                                  className="action-button"
                                  onClick={() =>
                                    openReviewModal(
                                      request,
                                      "APPROVE"
                                    )
                                  }
                                >
                                  Approve
                                </button>
                              </PermissionGate>

                              <PermissionGate permission="access.reject">
                                <button
                                  type="button"
                                  className="action-button danger"
                                  onClick={() =>
                                    openReviewModal(
                                      request,
                                      "REJECT"
                                    )
                                  }
                                >
                                  Reject
                                </button>
                              </PermissionGate>

                              <PermissionGate permission="access.request">
                                <button
                                  type="button"
                                  className="action-button"
                                  onClick={() =>
                                    handleCancel(request)
                                  }
                                >
                                  Cancel
                                </button>
                              </PermissionGate>
                            </>
                          ) : (
                            <span className="no-action">
                              No actions
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pagination">
              <span className="pagination-info">
                Page {pagination.currentPage} of{" "}
                {pagination.totalPages} —{" "}
                {pagination.totalItems} requests
              </span>

              <div className="pagination-buttons">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() =>
                    setPage(
                      (previous) => previous - 1
                    )
                  }
                >
                  Previous
                </button>

                <button
                  type="button"
                  className="active"
                  disabled
                >
                  {pagination.currentPage}
                </button>

                <button
                  type="button"
                  disabled={
                    page >= pagination.totalPages
                  }
                  onClick={() =>
                    setPage(
                      (previous) => previous + 1
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

      {/* CREATE REQUEST MODAL */}

      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal access-request-modal">
            <div className="modal-header">
              <div>
                <h2>Request Resource Access</h2>

                <p>
                  Submit a request for access to a workspace resource.
                </p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={() =>
                  setShowCreateModal(false)
                }
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateRequest}>
              <div className="form-group">
                <label>Resource</label>

                <select
                  name="resource"
                  value={form.resource}
                  onChange={handleFormChange}
                  required
                >
                  <option value="">
                    Select a resource
                  </option>

                  {resources.map((resource) => (
                    <option
                      key={resource._id}
                      value={resource._id}
                    >
                      {resource.name} —{" "}
                      {resource.environment}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Requested Access</label>

                <select
                  name="requestedRole"
                  value={form.requestedRole}
                  onChange={handleFormChange}
                  required
                >
                  {REQUESTED_ROLES.map((role) => (
                    <option
                      key={role}
                      value={role}
                    >
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Reason</label>

                <textarea
                  name="reason"
                  value={form.reason}
                  onChange={handleFormChange}
                  placeholder="Why do you need this access?"
                  required
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    setShowCreateModal(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={formLoading}
                >
                  {formLoading
                    ? "Submitting..."
                    : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* APPROVE / REJECT MODAL */}

      {showReviewModal && selectedRequest && (
        <div className="modal-overlay">
          <div className="modal access-request-modal">
            <div className="modal-header">
              <div>
                <h2>
                  {reviewAction === "APPROVE"
                    ? "Approve Access Request"
                    : "Reject Access Request"}
                </h2>

                <p>
                  {getResourceName(selectedRequest)}
                </p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={() =>
                  setShowReviewModal(false)
                }
              >
                ×
              </button>
            </div>

            <form onSubmit={handleReview}>
              <div className="form-group">
                <label>
                  {reviewAction === "APPROVE"
                    ? "Approval Comment"
                    : "Rejection Reason"}
                </label>

                <textarea
                  value={reviewComment}
                  onChange={(event) =>
                    setReviewComment(
                      event.target.value
                    )
                  }
                  placeholder={
                    reviewAction === "APPROVE"
                      ? "Optional approval comment..."
                      : "Explain why this request is being rejected..."
                  }
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    setShowReviewModal(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className={
                    reviewAction === "APPROVE"
                      ? "primary-button"
                      : "danger-button"
                  }
                  disabled={formLoading}
                >
                  {formLoading
                    ? "Processing..."
                    : reviewAction === "APPROVE"
                    ? "Approve Request"
                    : "Reject Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccessRequests;