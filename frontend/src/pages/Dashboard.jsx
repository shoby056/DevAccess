
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import PermissionGate from "../components/PermissionGate";
import api from "../services/api";

// Extract arrays from common API response formats.
const getItems = (response, collectionName) => {
  const data = response?.data ?? response ?? {};

  if (Array.isArray(data)) return data;

  if (collectionName && Array.isArray(data?.[collectionName])) {
    return data[collectionName];
  }

  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.results)) return data.results;

  return [];
};

// Extract total count from paginated API responses.
const getTotalCount = (response, collectionName) => {
  const data = response?.data ?? response ?? {};
  const totalItems = Number(data?.pagination?.totalItems);

  if (
    data?.pagination?.totalItems !== undefined &&
    Number.isFinite(totalItems) &&
    totalItems >= 0
  ) {
    return totalItems;
  }

  return getItems(response, collectionName).length;
};

const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  "Unable to load this information.";

const getActorName = (item) => {
  const actor =
    item?.user ||
    item?.actor ||
    item?.performedBy ||
    item?.createdBy;

  if (typeof actor === "string") return actor;

  return (
    actor?.name ||
    actor?.fullName ||
    item?.userName ||
    item?.actorName ||
    "Workspace member"
  );
};

const getActivityText = (item) =>
  item?.description ||
  item?.message ||
  item?.actionDescription ||
  item?.action ||
  item?.event ||
  "performed a workspace action";

const getTimestamp = (item) => {
  const value =
    item?.createdAt ||
    item?.timestamp ||
    item?.updatedAt;

  if (!value) return 0;

  const timestamp = new Date(value).getTime();

  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const getTimeAgo = (dateValue) => {
  if (!dateValue) return "Recently";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return "Recently";

  const seconds = Math.max(
    0,
    Math.floor((Date.now() - date.getTime()) / 1000)
  );

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return date.toLocaleDateString();
};

const getInitials = (name) =>
  String(name || "WM")
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    projects: null,
    resources: null,
    accessRequests: null,
    activeAccess: null,
  });

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activityError, setActivityError] = useState("");
  const [statsError, setStatsError] = useState("");
  const [apiStatus, setApiStatus] = useState("checking");

  const permissions = user?.permissions;

  const canReadProjects = permissions?.includes("projects.read");
  const canReadResources = permissions?.includes("resources.read");
  const canReadAccess = permissions?.includes("access.read");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setStatsError("");
    setActivityError("");
    setApiStatus("checking");

    setStats({
      projects: null,
      resources: null,
      accessRequests: null,
      activeAccess: null,
    });

    const jobs = [
      {
        key: "projects",
        endpoint: "/projects",
        permission: "projects.read",
        collection: "projects",
      },
      {
        key: "resources",
        endpoint: "/resources",
        permission: "resources.read",
        collection: "resources",
      },
      {
        key: "accessRequests",
        endpoint: "/access-requests",
        permission: "access.read",
        collection: "accessRequests",
      },
      {
        key: "activeAccess",
        endpoint: "/access-grants",
        permission: "access.read",
        collection: "accessGrants",
      },
    ];

    const allowedJobs = jobs.filter((job) => {
      if (!Array.isArray(permissions)) return true;

      return permissions.includes(job.permission);
    });

    try {
      // Notifications API is intentionally not called.
      const results = await Promise.allSettled([
        ...allowedJobs.map((job) => api.get(job.endpoint)),
        api.get("/audit-logs"),
      ]);

      const nextStats = {
        projects: null,
        resources: null,
        accessRequests: null,
        activeAccess: null,
      };

      const failedStats = [];

      allowedJobs.forEach((job, index) => {
        const result = results[index];

        if (result.status !== "fulfilled") {
          failedStats.push(job.key);

          console.error(
            `Dashboard ${job.key} error:`,
            result.reason
          );

          return;
        }

        const items = getItems(
          result.value,
          job.collection
        );

        if (job.key === "projects") {
          nextStats.projects = getTotalCount(
            result.value,
            "projects"
          );
        } else if (job.key === "resources") {
          nextStats.resources = getTotalCount(
            result.value,
            "resources"
          );
        } else if (job.key === "accessRequests") {
          nextStats.accessRequests = items.filter((item) =>
            ["pending", "requested"].includes(
              String(item?.status || "").toLowerCase()
            )
          ).length;
        } else if (job.key === "activeAccess") {
          nextStats.activeAccess = items.filter((item) => {
            const status = String(
              item?.status || ""
            ).toLowerCase();

            if (
              ["revoked", "expired", "rejected"].includes(status)
            ) {
              return false;
            }

            if (item?.isActive === false) {
              return false;
            }

            if (item?.expiresAt) {
              const expiryTime = new Date(
                item.expiresAt
              ).getTime();

              if (
                !Number.isNaN(expiryTime) &&
                expiryTime <= Date.now()
              ) {
                return false;
              }
            }

            return ["active", "approved", "granted"].includes(
              status
            );
          }).length;
        }
      });

      setStats(nextStats);

      // Audit logs are requested after the permitted stat requests.
      const activityResult = results[allowedJobs.length];

      if (activityResult.status === "fulfilled") {
        const items = getItems(
          activityResult.value,
          "auditLogs"
        );

        setActivities(
          [...items]
            .sort(
              (a, b) => getTimestamp(b) - getTimestamp(a)
            )
            .slice(0, 5)
        );
      } else {
        setActivities([]);
        setActivityError(
          getErrorMessage(activityResult.reason)
        );
      }

      setStatsError(
        failedStats.length
          ? `Could not load: ${failedStats.join(", ")}.`
          : ""
      );

      setApiStatus(
        allowedJobs.length > 0 &&
          failedStats.length === allowedJobs.length
          ? "error"
          : "online"
      );
    } catch (error) {
      console.error("Dashboard error:", error);

      setStatsError("Unable to load dashboard data.");
      setApiStatus("error");
    } finally {
      setLoading(false);
    }
  }, [permissions]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const formatRole = (role) =>
    String(role || "Member")
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());

  const statCards = [
    {
      title: "Projects",
      value: canReadProjects === false ? "—" : stats.projects,
      icon: "◫",
      permission: "projects.read",
      path: "/projects",
    },
    {
      title: "Resources",
      value: canReadResources === false ? "—" : stats.resources,
      icon: "◈",
      permission: "resources.read",
      path: "/resources",
    },
    {
      title: "Pending Requests",
      value: canReadAccess === false ? "—" : stats.accessRequests,
      icon: "↗",
      permission: "access.read",
      path: "/access-requests",
    },
    {
      title: "Active Access",
      value: canReadAccess === false ? "—" : stats.activeAccess,
      icon: "✓",
      permission: "access.read",
      path: "/access-grants",
    },
  ];

  const quickActions = [
    {
      title: "View Projects",
      description: "Explore workspace projects",
      icon: "◫",
      permission: "projects.read",
      path: "/projects",
    },
    {
      title: "View Resources",
      description: "Manage workspace resources",
      icon: "◈",
      permission: "resources.read",
      path: "/resources",
    },
    {
      title: "Request Access",
      description: "Request access to a resource",
      icon: "↗",
      permission: "access.request",
      path: "/access-requests",
    },
    {
      title: "Manage Users",
      description: "View workspace members",
      icon: "♙",
      permission: "users.read",
      path: "/users",
    },
  ];

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <p className="eyebrow">Workspace Overview</p>

          <h1>
            Welcome back, {user?.name?.split(" ")[0] || "User"} 👋
          </h1>

          <p className="dashboard-subtitle">
            Here is what is happening across your developer workspace.
          </p>
        </div>

        <div className="role-pill">
          {formatRole(user?.role)}
        </div>
      </div>

      <div className="dashboard-toolbar">
        <span>
          {loading ? "Updating dashboard..." : "Dashboard overview"}
        </span>

        <button
          type="button"
          className="text-button"
          onClick={loadDashboard}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "↻ Refresh"}
        </button>
      </div>

      {statsError && (
        <div className="dashboard-error" role="alert">
          {statsError}
        </div>
      )}

      <div className="stats-grid">
        {statCards.map((stat) => (
          <PermissionGate
            key={stat.title}
            permission={stat.permission}
          >
            <button
              type="button"
              className="stat-card dashboard-stat-button"
              onClick={() => navigate(stat.path)}
              aria-label={`Open ${stat.title}`}
            >
              <div className="stat-top">
                <div className="stat-icon">{stat.icon}</div>
                <span className="stat-change">
                  View details ↗
                </span>
              </div>

              <div className="stat-value">
                {loading && stat.value === null
                  ? "..."
                  : stat.value ?? "—"}
              </div>

              <div className="stat-title">
                {stat.title}
              </div>
            </button>
          </PermissionGate>
        ))}
      </div>

      <div className="dashboard-grid">
        <section className="dashboard-card activity-card">
          <div className="card-header">
            <div>
              <h2>Recent Activity</h2>
              <p>Latest recorded workspace events</p>
            </div>

            <PermissionGate permission="audit.read">
              <button
                type="button"
                className="text-button"
                onClick={() => navigate("/audit-logs")}
              >
                View all →
              </button>
            </PermissionGate>
          </div>

          {loading ? (
            <div className="dashboard-empty">
              Loading activity...
            </div>
          ) : activityError ? (
            <div className="dashboard-empty">
              <p>{activityError}</p>

              <button
                type="button"
                className="text-button"
                onClick={loadDashboard}
              >
                Try again
              </button>
            </div>
          ) : activities.length === 0 ? (
            <div className="dashboard-empty">
              No activity has been recorded yet.
            </div>
          ) : (
            <div className="activity-list">
              {activities.map((activity, index) => {
                const actor = getActorName(activity);

                return (
                  <div
                    className="activity-item"
                    key={
                      activity?._id ||
                      activity?.id ||
                      `${actor}-${index}`
                    }
                  >
                    <div className="activity-avatar">
                      {getInitials(actor)}
                    </div>

                    <div className="activity-content">
                      <strong>{actor}</strong>
                      <span>{getActivityText(activity)}</span>

                      {activity?.resourceName && (
                        <small>{activity.resourceName}</small>
                      )}
                    </div>

                    <time>
                      {getTimeAgo(
                        activity?.createdAt ||
                          activity?.timestamp ||
                          activity?.updatedAt
                      )}
                    </time>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="dashboard-card quick-card">
          <div className="card-header">
            <div>
              <h2>Quick Actions</h2>
              <p>Navigate to frequently used pages</p>
            </div>
          </div>

          <div className="quick-actions">
            {quickActions.map((action) => (
              <PermissionGate
                key={action.title}
                permission={action.permission}
              >
                <button
                  type="button"
                  className="quick-action"
                  onClick={() => navigate(action.path)}
                >
                  <span>{action.icon}</span>

                  <div>
                    <strong>{action.title}</strong>
                    <small>{action.description}</small>
                  </div>
                </button>
              </PermissionGate>
            ))}
          </div>
        </section>
      </div>

      <section className="dashboard-card workspace-card">
        <div className="card-header">
          <div>
            <h2>Workspace Status</h2>
            <p>Dashboard API connectivity</p>
          </div>

          <span
            className={`online-status ${
              apiStatus === "error" ? "status-error" : ""
            }`}
          >
            <span />

            {apiStatus === "checking"
              ? "Checking connection..."
              : apiStatus === "error"
                ? "Some API requests failed"
                : "Dashboard API responding"}
          </span>
        </div>

        <div className="status-grid">
          <div className="status-item">
            <span>Projects API</span>
            <strong>
              {stats.projects === null
                ? "Not verified"
                : "Responding"}
            </strong>
          </div>

          <div className="status-item">
            <span>Resources API</span>
            <strong>
              {stats.resources === null
                ? "Not verified"
                : "Responding"}
            </strong>
          </div>

          <div className="status-item">
            <span>Activity API</span>
            <strong>
              {activityError
                ? "Unavailable"
                : loading
                  ? "Checking"
                  : "Checked"}
            </strong>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
