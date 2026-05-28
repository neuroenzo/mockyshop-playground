"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { Navbar } from "@/components/layout/Navbar";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>
        <Navbar />
        <main data-testid="root" className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </ToastProvider>
    </AuthProvider>
  );
}
