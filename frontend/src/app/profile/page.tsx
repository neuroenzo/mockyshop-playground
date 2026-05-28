"use client";

import { useAuth } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { Badge } from "@/components/ui/Badge";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

function ProfilePage() {
  const { user } = useAuth();

  if (!user) return null;

  const avatarLetter = user.email.charAt(0).toUpperCase();

  return (
    <div data-testid="profile-page" className="max-w-lg mx-auto mt-4">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Profile" }]} />

      <h1 className="text-2xl font-bold mb-6">Profile</h1>

      <div className="bg-white rounded-lg shadow-sm border border-gray-line p-6">
        <div className="flex items-center gap-4 pb-4 mb-4 border-b border-gray-line">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary text-white text-xl font-bold">
            {avatarLetter}
          </div>
          <div>
            <p className="font-semibold text-gray-dark">{user.email}</p>
            <Badge variant={user.role}>{user.role}</Badge>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-gray-txt">ID</span>
            <span className="text-sm text-gray-dark">{user.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-txt">Email</span>
            <span className="text-sm text-gray-dark">{user.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-txt">Role</span>
            <Badge variant={user.role}>{user.role}</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-txt">Status</span>
            <Badge variant={user.is_active ? "active" : "inactive"}>{user.is_active ? "Active" : "Inactive"}</Badge>
          </div>
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
