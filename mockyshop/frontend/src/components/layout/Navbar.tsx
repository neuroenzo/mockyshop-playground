"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";

export function Navbar() {
  const { user, logout, isRole } = useAuth();
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/register";
  const [menuOpen, setMenuOpen] = useState(false);

  if (!user && pathname === "/") return null;

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav data-testid="navbar" className="bg-gray-dark shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-bold text-white" data-testid="nav-home">
              MockyShop
            </Link>
            {!isAuthPage && (
              <div className="hidden sm:flex gap-6">
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
            )}
          </div>
          {!isAuthPage && (
            <>
              <div className="hidden sm:flex items-center gap-4">
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
              <button
                className="sm:hidden inline-flex items-center justify-center rounded-md p-2 text-white hover:text-primary focus:outline-none"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Toggle navigation menu"
                data-testid="btn-mobile-menu"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {menuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </>
          )}
        </div>
        {!isAuthPage && menuOpen && (
          <div className="sm:hidden border-t border-gray-light pb-3 pt-2 space-y-1" data-testid="mobile-menu">
            {user ? (
              <>
                <Link href="/profile" onClick={closeMenu} className="block px-3 py-2 text-sm font-medium text-white hover:text-primary" data-testid="mobile-nav-profile">
                  {user.email}
                </Link>
                {isRole("buyer") && (
                  <Link href="/cart" onClick={closeMenu} className="block px-3 py-2 text-sm font-medium text-white hover:text-primary" data-testid="mobile-nav-cart">
                    Cart
                  </Link>
                )}
                <Link href="/orders" onClick={closeMenu} className="block px-3 py-2 text-sm font-medium text-white hover:text-primary" data-testid="mobile-nav-orders">
                  Orders
                </Link>
                {isRole("admin") && (
                  <>
                    <Link href="/admin/users" onClick={closeMenu} className="block px-3 py-2 text-sm font-medium text-white hover:text-primary" data-testid="mobile-nav-admin-users">
                      Users
                    </Link>
                    <Link href="/admin/categories" onClick={closeMenu} className="block px-3 py-2 text-sm font-medium text-white hover:text-primary" data-testid="mobile-nav-admin-categories">
                      Categories
                    </Link>
                  </>
                )}
                <button
                  onClick={() => { closeMenu(); logout(); }}
                  className="block w-full text-left px-3 py-2 text-sm font-medium text-white hover:text-primary"
                  data-testid="mobile-nav-logout"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={closeMenu} className="block px-3 py-2 text-sm font-medium text-white hover:text-primary" data-testid="mobile-nav-login">
                  Login
                </Link>
                <Link href="/register" onClick={closeMenu} className="block px-3 py-2 text-sm font-medium text-white hover:text-primary" data-testid="mobile-nav-register">
                  Register
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
