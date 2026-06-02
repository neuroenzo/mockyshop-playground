"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getProducts } from "@/lib/queries/products";
import { register } from "@/lib/queries/auth";
import type { Product } from "@/types/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";
import { ProductImagePlaceholder } from "@/components/ui/ProductImagePlaceholder";

type AuthMode = "login" | "register";

export default function HomePage() {
  const { user, loading: authLoading, login } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("buyer");
  const [authError, setAuthError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    getProducts({ page: 1, size: 8 })
      .then((res) => setProducts(res.items))
      .catch((e) => setError(e.message ?? "Failed to load products"))
      .finally(() => setLoading(false));
  }, [user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setSubmitting(true);
    try {
      await register({ email, password, role: role as "buyer" | "seller" });
      setEmail("");
      setPassword("");
      setRole("buyer");
      setAuthMode("login");
      toast("Account created! Log in to continue.", "success");
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div data-testid="home-page" className="flex justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div
        data-testid="home-page"
        className="fixed inset-0 overflow-y-auto"
        style={{ backgroundColor: "#ff0042" }}
      >
        <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 w-full max-w-md mx-auto">
          <div className="text-center text-white mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold" data-testid="welcome-title">Welcome to MockyShop</h1>
            <p className="mt-3 text-lg text-white/80">
              Browse products, add to cart, and place orders — your one-stop mock shop.
            </p>
          </div>

          <div className="w-full bg-white rounded-xl shadow-xl p-6">
            <div className="flex mb-6 bg-gray-lighter rounded-lg p-1">
              <button
                type="button"
                onClick={() => { setAuthMode("login"); setAuthError(null); }}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                  authMode === "login"
                    ? "bg-white text-gray-dark shadow-sm"
                    : "text-gray-txt hover:text-gray-dark"
                }`}
                data-testid="tab-login"
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode("register"); setAuthError(null); }}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                  authMode === "register"
                    ? "bg-white text-gray-dark shadow-sm"
                    : "text-gray-txt hover:text-gray-dark"
                }`}
                data-testid="tab-register"
              >
                Register
              </button>
            </div>

            {authMode === "login" ? (
              <form onSubmit={handleLogin} className="space-y-4">
                {authError && <ErrorMessage message={authError} />}
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                />
                <Input
                  label="Password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                />
                <Button type="submit" loading={submitting} className="w-full" testId="btn-login-submit">
                  Log In
                </Button>
                <p className="text-center text-sm text-gray-txt">
                  Don&apos;t have an account?{" "}
                  <button
                    type="button"
                    onClick={() => { setAuthMode("register"); setAuthError(null); }}
                    className="text-primary hover:underline font-medium"
                  >
                    Register
                  </button>
                </p>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                {authError && <ErrorMessage message={authError} />}
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                />
                <Input
                  label="Password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Minimum 8 characters"
                  minLength={8}
                />
                <Select
                  label="Role"
                  name="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  options={[
                    { value: "buyer", label: "Buyer" },
                    { value: "seller", label: "Seller" },
                  ]}
                />
                <Button type="submit" loading={submitting} className="w-full" testId="btn-register-submit">
                  Create Account
                </Button>
                <p className="text-center text-sm text-gray-txt">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => { setAuthMode("login"); setAuthError(null); }}
                    className="text-primary hover:underline font-medium"
                  >
                    Log in
                  </button>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="home-page">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary to-primary-hover text-white mb-12 px-8 py-12 sm:px-12 sm:py-16">
        <div className="relative z-10">
          <h1 className="text-4xl sm:text-5xl font-bold" data-testid="welcome-title">Welcome to MockyShop</h1>
          <p className="mt-3 text-lg text-white/80 max-w-xl">
            Browse products, add to cart, and place orders — your one-stop mock shop.
          </p>
        </div>
        <div className="absolute -bottom-6 -right-6 h-48 w-48 rounded-full bg-white/10 sm:h-64 sm:w-64" />
        <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-white/10" />
      </div>

      {error && <ErrorMessage message={error} />}

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      )}

      {!loading && !error && products.length === 0 && (
        <p className="text-center text-gray-txt">No products yet.</p>
      )}

      {!loading && products.length > 0 && (
        <>
          <h2 className="text-2xl font-semibold mb-6">Featured Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((p) => (
              <Link key={p.id} href={`/products/${p.id}`} data-testid={`product-card-${p.id}`}>
                <div className="bg-white rounded-lg shadow-sm border border-gray-line hover:shadow-md transition-shadow group h-full">
                  <div className="h-40 bg-gray-lighter rounded-t-lg overflow-hidden">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="h-full w-full object-cover rounded-t-lg group-hover:scale-105 transition-transform" />
                    ) : (
                      <ProductImagePlaceholder />
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-gray-dark truncate">{p.name}</h3>
                    <p className="mt-1 text-lg font-bold text-primary">${p.price}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
