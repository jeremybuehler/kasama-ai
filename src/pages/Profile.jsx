import React from "react";
import ProtectedRoute from "../components/ProtectedRoute";
import { useAuth } from "../hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    const { error } = await logout();
    if (error) {
      console.error("Error during logout:", error);
      return;
    }
    const from = location.state?.from?.pathname || "/login-authentication";
    navigate(from, { replace: true });
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-10">
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>

          <div className="mt-6 rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800">Account</h2>
            <dl className="mt-4 divide-y divide-gray-100">
              <div className="py-3 grid grid-cols-3 gap-4">
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="col-span-2 text-sm text-gray-900">
                  {user?.email}
                </dd>
              </div>
              <div className="py-3 grid grid-cols-3 gap-4">
                <dt className="text-sm font-medium text-gray-500">User ID</dt>
                <dd className="col-span-2 font-mono text-xs text-gray-900 break-all">
                  {user?.id}
                </dd>
              </div>
              <div className="py-3 grid grid-cols-3 gap-4">
                <dt className="text-sm font-medium text-gray-500">Created</dt>
                <dd className="col-span-2 text-sm text-gray-900">
                  {user?.created_at
                    ? new Date(user.created_at).toLocaleString()
                    : "—"}
                </dd>
              </div>
            </dl>

            <div className="mt-6">
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
