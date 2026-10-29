
import { useContext } from "react";
import { Navigate, useLocation } from "react-router";
import { AuthContext } from "../providers/AuthProvider";
import { LoaderCircle } from "lucide-react";

const AdminProtectedRoute = ({ children }) => {
  const { user, loading, role, roleLoading, accountStatus } =
    useContext(AuthContext);

  const location = useLocation();

  // Wait for Firebase authentication and MongoDB role
  if (loading || roleLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-base-100">
        <LoaderCircle
          size={36}
          className="animate-spin text-secondary"
        />
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname + location.search }}
        replace
      />
    );
  }

  // Only active admins are allowed
  if (role !== "admin" || accountStatus !== "active") {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminProtectedRoute;
