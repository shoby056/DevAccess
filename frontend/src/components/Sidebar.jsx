import { NavLink, Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import PermissionGate from "./PermissionGate";

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  const navItems = [
    {
      label: "Profile",
      path: "/profile",
      icon: "◎",
      permission: "profile.read",
    },
    {
      label: "Dashboard",
      path: "/dashboard",
      icon: "⌂",
    },
    {
      label: "Users",
      path: "/users",
      icon: "♙",
      permission: "users.read",
    },
    {
      label: "Roles",
      path: "/roles",
      icon: "◉",
      permission: "roles.read",
    },
    {
      label: "Teams",
      path: "/teams",
      icon: "♧",
      permission: "teams.read",
    },
    {
      label: "Projects",
      path: "/projects",
      icon: "◫",
      permission: "projects.read",
    },
    {
      label: "Resources",
      path: "/resources",
      icon: "◈",
      permission: "resources.read",
    },
    {
      label: "Access Requests",
      path: "/access-requests",
      icon: "↗",
      permission: "access.read",
    },
    {
      label: "Access Grants",
      path: "/access-grants",
      icon: "✓",
      permission: "access.read",
    },
    {
      label: "Audit Logs",
      path: "/audit-logs",
      icon: "▤",
      permission: "audit.read",
    },
  ];

  return (
    <>
      {/* =================================================
          SIDEBAR OVERLAY
      ================================================= */}

      <div
        className={`sidebar-overlay ${
          isOpen ? "show" : ""
        }`}
        onClick={onClose}
      />

      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside
        className={`sidebar ${
          isOpen ? "open" : ""
        }`}
      >
        {/* =================================================
            BRAND
        ================================================= */}

        <div className="sidebar-brand">
          <div className="brand-mark">
            D
          </div>

          <div>
            <strong>DevAccess</strong>
            <span>Workspace Control</span>
          </div>
        </div>

        {/* =================================================
            MAIN MENU
        ================================================= */}

        <div className="sidebar-section">
          <span className="sidebar-label">
            MAIN MENU
          </span>

          <nav className="sidebar-nav">
            {navItems.map((item) => {
              const link = (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `nav-item ${
                      isActive ? "active" : ""
                    }`
                  }
                >
                  <span className="nav-icon">
                    {item.icon}
                  </span>

                  <span>{item.label}</span>
                </NavLink>
              );

              if (item.permission) {
                return (
                  <PermissionGate
                    key={item.path}
                    permission={item.permission}
                  >
                    {link}
                  </PermissionGate>
                );
              }

              return link;
            })}
          </nav>
        </div>

        {/* =================================================
            SIDEBAR BOTTOM
        ================================================= */}

        <div className="sidebar-bottom">
          {/* Production Workspace → Profile */}
          <Link
            to="/profile"
            onClick={onClose}
            className="workspace-mini"
          >
            <div className="workspace-icon">
              D
            </div>

            <div>
              <strong>DevAccess</strong>
              <span>
                Production Workspace
              </span>
            </div>
          </Link>

          {/* User → Profile */}
          <Link
            to="/profile"
            onClick={onClose}
            className="sidebar-user"
          >
            <div className="user-avatar">
              {user?.name
                ?.charAt(0)
                .toUpperCase()}
            </div>

            <div className="sidebar-user-info">
              <strong>
                {user?.name}
              </strong>

              <span>
                {user?.role?.replaceAll(
                  "_",
                  " "
                )}
              </span>
            </div>
          </Link>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;