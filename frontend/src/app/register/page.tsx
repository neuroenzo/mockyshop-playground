"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { register } from "@/lib/queries/auth";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("buyer");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register({ email, password, role: role as "buyer" | "seller" });
      router.push("/login");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-testid="register-page" className="max-w-md mx-auto mt-12">
      <h1 className="text-2xl font-bold text-center mb-6">Create Account</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-line p-6 space-y-4">
        {error && <ErrorMessage message={error} />}
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
        <Button type="submit" loading={loading} className="w-full" testId="btn-register-submit">
          Create Account
        </Button>
      </form>
    </div>
  );
}
