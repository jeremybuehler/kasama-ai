import React from "react";
import ProtectedRoute from "../components/ProtectedRoute";
import { useAuth } from "../contexts/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-10">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>

          <div className="mt-6 rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800">Welcome</h2>
            <p className="mt-2 text-gray-600">
              You are signed in as{" "}
              <span className="font-medium text-gray-900">
                {user?.email ?? "Unknown user"}
              </span>
            </p>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-md border p-4">
                <div className="text-sm text-gray-500">User ID</div>
                <div className="mt-1 font-mono text-sm text-gray-900 break-all">
                  {user?.id}
                </div>
              </div>
              <div className="rounded-md border p-4">
                <div className="text-sm text-gray-500">Email confirmed</div>
                <div className="mt-1 text-sm text-gray-900">
                  {String(user?.email_confirmed_at ? true : false)}
                </div>
              </div>
            </div>

            <div className="mt-6 text-sm text-gray-500">
              This is a protected page. If you sign out, you will be redirected
              to the login page.
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
