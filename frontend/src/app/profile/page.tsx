"use client";

import { useAuth } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { Badge } from "@/components/ui/Badge";

function ProfilePage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div data-testid="profile-page" className="max-w-lg mx-auto mt-8">
      <h1 className="text-2xl font-bold mb-6">Profile</h1>
      <div className="bg-white rounded-lg shadow-sm border border-gray-line p-6 space-y-4">
        <div>
          <h3 className="text-sm font-medium text-gray-txt">ID</h3>
          <p className="mt-1 text-gray-dark">{user.id}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-txt">Email</h3>
          <p className="mt-1 text-gray-dark">{user.email}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-txt">Role</h3>
          <div className="mt-1"><Badge variant={user.role}>{user.role}</Badge></div>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-txt">Status</h3>
          <div className="mt-1"><Badge variant={user.is_active ? "delivered" : "cancelled"}>{user.is_active ? "Active" : "Inactive"}</Badge></div>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <AuthGuard>
      <ProfilePage />
    </AuthGuard>
  );
}
