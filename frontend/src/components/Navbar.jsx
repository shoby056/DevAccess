
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import api from "../services/api";

const POLL_INTERVAL = 30000;

const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [markingAllRead, setMarkingAllRead] = useState(false);

  const dropdownRef = useRef(null);

  // Fetch notifications from backend
  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await api.get("/notifications", {
        params: { page: 1, limit: 10 },
      });

      const data = response.data;

      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error("Fetch notifications error:", err);

      setError(
        err.response?.data?.message ||
          "Could not load notifications."
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initial fetch and polling
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return undefined;
    }

    fetchNotifications();

    const interval = setInterval(() => {
      fetchNotifications();
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [fetchNotifications, user]);

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleProfile = () => {
    navigate("/profile");
  };

  // Mark one notification as read
  const handleMarkRead = async (notification) => {
    if (notification.isRead) {
      return true;
    }

    try {
      setError("");

      const response = await api.patch(
        `/notifications/${notification._id}/read`
      );

      if (!response.data.success) {
        throw new Error("Could not mark notification as read.");
      }

      // Update UI after backend confirms success
      setNotifications((previous) =>
        previous.map((item) =>
          item._id === notification._id
            ? { ...item, ...response.data.notification, isRead: true }
            : item
        )
      );

      // Recalculate unread count from current list
      setUnreadCount((count) => Math.max(0, count - 1));

      return true;
    } catch (err) {
      console.error("Mark notification as read error:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Could not mark notification as read."
      );

      await fetchNotifications();
      return false;
    }
  };

  // Mark all notifications as read
  const handleMarkAllRead = async () => {
    if (unreadCount === 0 || markingAllRead) {
      return;
    }

    try {
      setMarkingAllRead(true);
      setError("");

      const response = await api.patch(
        "/notifications/read-all"
      );

      if (!response.data.success) {
        throw new Error("Could not mark all notifications as read.");
      }

      setNotifications((previous) =>
        previous.map((item) => ({
          ...item,
          isRead: true,
          readAt: item.readAt || new Date().toISOString(),
        }))
      );

      setUnreadCount(0);
    } catch (err) {
      console.error("Mark all notifications as read error:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Could not mark notifications as read."
      );

      await fetchNotifications();
    } finally {
      setMarkingAllRead(false);
    }
  };

  // Handle notification click
  const handleNotificationClick = async (notification) => {
    const success = await handleMarkRead(notification);

    // Don't navigate if marking unread notification failed
    if (!success) {
      return;
    }

    setIsOpen(false);

    if (notification.relatedResourceType === "AccessRequest") {
      navigate("/access-requests");
    } else if (
      notification.relatedResourceType === "AccessGrant"
    ) {
      navigate("/access-grants");
    }
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          type="button"
          className="mobile-menu"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
        >
          ☰
        </button>

        <div className="breadcrumb">
          <span>Workspace</span>
          <b>/</b>
          <strong>Overview</strong>
        </div>
      </div>

      <div className="topbar-right">
        <button
          type="button"
          className="icon-button"
          title="Help"
          aria-label="Help"
        >
          ?
        </button>

        <div className="notification-wrapper" ref={dropdownRef}>
          <button
            type="button"
            className="notification-button"
            onClick={() => {
              const nextOpen = !isOpen;
              setIsOpen(nextOpen);

              if (nextOpen) {
                fetchNotifications();
              }
            }}
            aria-label={`Notifications, ${unreadCount} unread`}
            aria-expanded={isOpen}
            title="Notifications"
          >
            <span className="notification-bell" aria-hidden="true">
              ♧
            </span>

            {unreadCount > 0 && (
              <span className="notification-count">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {isOpen && (
            <section
              className="notification-dropdown"
              aria-label="Notifications"
            >
              <div className="notification-header">
                <div>
                  <h3>Notifications</h3>
                  <p>{unreadCount} unread</p>
                </div>

                {unreadCount > 0 && (
                  <button
                    type="button"
                    className="mark-all-button"
                    onClick={handleMarkAllRead}
                    disabled={markingAllRead}
                  >
                    {markingAllRead
                      ? "Marking..."
                      : "Mark all read"}
                  </button>
                )}
              </div>

              {error && (
                <p className="notification-error" role="alert">
                  {error}
                </p>
              )}

              {loading && notifications.length === 0 ? (
                <p className="notification-empty">
                  Loading notifications...
                </p>
              ) : notifications.length === 0 ? (
                <p className="notification-empty">
                  You're all caught up.
                </p>
              ) : (
                <div className="notification-list">
                  {notifications.map((notification) => (
                    <button
                      type="button"
                      key={notification._id}
                      className={`notification-item ${
                        notification.isRead
                          ? "is-read"
                          : "is-unread"
                      }`}
                      onClick={() =>
                        handleNotificationClick(notification)
                      }
                    >
                      <span className="notification-item-dot" />

                      <span className="notification-item-content">
                        <strong>{notification.title}</strong>

                        <span>{notification.message}</span>

                        <small>
                          {new Date(
                            notification.createdAt
                          ).toLocaleString()}
                        </small>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>

        <button
          type="button"
          className="topbar-user"
          onClick={handleProfile}
          title="Open Profile"
        >
          <span className="topbar-avatar">
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </span>

          <span className="topbar-user-info">
            <strong>{user?.name}</strong>
            <small>{user?.email}</small>
          </span>
        </button>

        <button
          type="button"
          className="logout-button"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </header>
  );
};

export default Navbar;
