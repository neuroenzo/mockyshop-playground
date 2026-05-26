"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Spinner } from "@/components/ui/Spinner";

export function AuthGuard({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
    } else if (roles && !roles.includes(user.role)) {
      router.push("/");
    }
  }, [user, loading, roles, router]);

  if (loading) return <Spinner />;
  if (!user) return null;
  if (roles && !roles.includes(user.role)) return null;

  return <>{children}</>;
}
