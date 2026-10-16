
import { Navigate, Route, Routes } from "react-router-dom";

// Authentication Pages
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";

// Dashboard
import Dashboard from "../pages/Dashboard";

// Admin Pages
import Users from "../pages/admin/Users";
import Roles from "../pages/admin/Roles";
import Teams from "../pages/admin/Teams";
import Projects from "../pages/admin/Projects";
import Resources from "../pages/admin/Resources";
import AccessRequests from "../pages/admin/AccessRequests";
import AccessGrants from "../pages/admin/AccessGrants";

// Auditor Pages
import AuditLogs from "../pages/auditor/AuditLogs";

// Profile
import Profile from "../pages/profile/Profile";

// Route Protection
import ProtectedRoute from "../components/ProtectedRoute";
import PermissionRoute from "../components/PermissionRoute";
import AppLayout from "../components/AppLayout";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/"
        element={<Navigate to="/dashboard" replace />}
      />

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/register"
        element={<Register />}
      />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          {/* Dashboard */}
          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          {/* Users */}
          <Route element={<PermissionRoute permission="users.read" />}>
            <Route
              path="/users"
              element={<Users />}
            />
          </Route>

          {/* Roles */}
          <Route element={<PermissionRoute permission="roles.read" />}>
            <Route
              path="/roles"
              element={<Roles />}
            />
          </Route>

          {/* Teams */}
          <Route element={<PermissionRoute permission="teams.read" />}>
            <Route
              path="/teams"
              element={<Teams />}
            />
          </Route>

          {/* Projects */}
          <Route element={<PermissionRoute permission="projects.read" />}>
            <Route
              path="/projects"
              element={<Projects />}
            />
          </Route>

          {/* Resources */}
          <Route element={<PermissionRoute permission="resources.read" />}>
            <Route
              path="/resources"
              element={<Resources />}
            />
          </Route>

          {/* Access Requests */}
          <Route element={<PermissionRoute permission="access.read" />}>
            <Route
              path="/access-requests"
              element={<AccessRequests />}
            />
          </Route>

          {/* Access Grants */}
          <Route element={<PermissionRoute permission="access.read" />}>
            <Route
              path="/access-grants"
              element={<AccessGrants />}
            />
          </Route>

          {/* Audit Logs */}
          <Route element={<PermissionRoute permission="audit.read" />}>
            <Route
              path="/audit-logs"
              element={<AuditLogs />}
            />
          </Route>

          {/* Profile */}
          <Route element={<PermissionRoute permission="profile.read" />}>
            <Route
              path="/profile"
              element={<Profile />}
            />
          </Route>
        </Route>
      </Route>

      {/* Unknown Route */}
      <Route
        path="*"
        element={<Navigate to="/dashboard" replace />}
      />
    </Routes>
  );
};

export default AppRoutes;
