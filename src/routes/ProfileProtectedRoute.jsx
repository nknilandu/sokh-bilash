
import { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { Loader2 } from "lucide-react";

import { AuthContext } from "../providers/AuthProvider";

export default function ProfileProtectedRoute({
  children,
}) {
  const {
    user,
    loading,
    role,
    roleLoading,
    accountStatus,
  } = useContext(AuthContext);

  if (loading || (user && roleLoading)) {
    return (
      <main className="page-bg flex min-h-[65vh] items-center justify-center">
        <div className="text-center">
          <Loader2
            size={28}
            className="mx-auto animate-spin text-secondary"
          />

          <p className="mt-3 text-sm text-muted">
            অ্যাকাউন্ট যাচাই হচ্ছে...
          </p>
        </div>
      </main>
    );
  }

  if (
    !user ||
    accountStatus !== "active" ||
    !["customer", "admin"].includes(role)
  ) {
    return <Navigate to="/" replace />;
  }

  return children || <Outlet />;
}
