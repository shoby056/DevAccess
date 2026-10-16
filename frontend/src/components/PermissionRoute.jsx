import { Navigate, Outlet } from "react-router-dom";
import useAuth from "../hooks/useAuth";

const PermissionRoute = ({ permission }) => {
  const { user, loading, hasPermission } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading DevAccess...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!hasPermission(permission)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default PermissionRoute;