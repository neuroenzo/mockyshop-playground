"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";

export function Navbar() {
  const { user, logout, isRole } = useAuth();

  return (
    <nav data-testid="navbar" className="bg-gray-dark shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-bold text-white" data-testid="nav-home">
              MockyShop
            </Link>
            <div className="hidden sm:flex gap-6">
              <Link href="/products" className="text-sm font-medium text-white hover:text-primary" data-testid="nav-products">
                Products
              </Link>
              {user && isRole("buyer") && (
                <Link href="/cart" className="text-sm font-medium text-white hover:text-primary" data-testid="nav-cart">
                  Cart
                </Link>
              )}
              {user && (
                <Link href="/orders" className="text-sm font-medium text-white hover:text-primary" data-testid="nav-orders">
                  Orders
                </Link>
              )}
              {user && isRole("admin") && (
                <div className="flex gap-6">
                  <Link href="/admin/users" className="text-sm font-medium text-white hover:text-primary" data-testid="nav-admin-users">
                    Users
                  </Link>
                  <Link href="/admin/categories" className="text-sm font-medium text-white hover:text-primary" data-testid="nav-admin-categories">
                    Categories
                  </Link>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link href="/profile" className="text-sm text-white hover:text-primary" data-testid="nav-profile">
                  {user.email}
                </Link>
                <Button variant="ghost" size="sm" onClick={logout} testId="btn-logout">
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link href="/login" data-testid="nav-login">
                  <Button variant="secondary" size="sm">Login</Button>
                </Link>
                <Link href="/register" data-testid="nav-register">
                  <Button size="sm">Register</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
