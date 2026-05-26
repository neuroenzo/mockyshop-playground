"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { getUsers, createUser, updateUserRole, makeAdmin, removeAdmin, deleteUser } from "@/lib/queries/users";
import type { User, UserAdminCreate, UserFilter } from "@/types/api";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

const ROLE_OPTIONS = [
  { value: "buyer", label: "Buyer" },
  { value: "seller", label: "Seller" },
  { value: "admin", label: "Admin" },
];

function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const size = 20;

  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createRole, setCreateRole] = useState<"buyer" | "seller" | "admin">("buyer");
  const [saving, setSaving] = useState(false);

  const buildFilter = useCallback((): UserFilter => {
    const filter: UserFilter = { page, size };
    if (search) filter.search = search;
    return filter;
  }, [page, size, search]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getUsers(buildFilter());
      setUsers(res.items);
      setTotal(res.total);
      setPages(res.pages);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [buildFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { setPage(1); }, [search]);

  useEffect(() => {
    if (openMenuId === null) { setMenuPos(null); return; }
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
        setMenuPos(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openMenuId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createEmail.trim() || !createPassword.trim()) return;
    setSaving(true);
    try {
      const data: UserAdminCreate = { email: createEmail.trim(), password: createPassword, role: createRole };
      await createUser(data);
      setCreateEmail("");
      setCreatePassword("");
      setCreateRole("buyer");
      fetchUsers();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setSaving(false);
    }
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    setActionLoading(userId);
    try {
      await updateUserRole(userId, { role: newRole as "buyer" | "seller" | "admin" });
      fetchUsers();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update role");
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleAdmin = async (user: User) => {
    setActionLoading(user.id);
    try {
      if (user.role === "admin") {
        await removeAdmin(user.id);
      } else {
        await makeAdmin(user.id);
      }
      fetchUsers();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to toggle admin");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (userId: number) => {
    if (!confirm("Deactivate this user?")) return;
    try {
      await deleteUser(userId);
      fetchUsers();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete user");
    }
  };

  return (
    <div data-testid="admin-users-page">
      <h1 className="text-2xl font-bold mb-6">User Management</h1>

      <form onSubmit={handleCreate} className="bg-white rounded-lg shadow-sm border border-gray-line p-4 mb-6 flex flex-wrap gap-4 items-end max-w-2xl">
        <div className="flex-1 min-w-[200px]">
          <Input
            name="new-email"
            label="Email"
            type="email"
            placeholder="user@example.com"
            value={createEmail}
            onChange={(e) => setCreateEmail(e.target.value)}
            required
          />
        </div>
        <div className="flex-1 min-w-[160px]">
          <Input
            name="new-password"
            label="Password"
            type="password"
            placeholder="Enter password"
            value={createPassword}
            onChange={(e) => setCreatePassword(e.target.value)}
            required
          />
        </div>
        <div className="min-w-[140px]">
          <Select
            label="Role"
            name="new-role"
            value={createRole}
            onChange={(e) => setCreateRole(e.target.value as "buyer" | "seller" | "admin")}
            options={ROLE_OPTIONS}
          />
        </div>
        <Button type="submit" loading={saving} testId="btn-create-user">Add User</Button>
      </form>

      <div className="mb-4 max-w-sm">
        <Input
          name="search"
          placeholder="Search by email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading && <Spinner />}
      {error && <ErrorMessage message={error} onRetry={fetchUsers} />}

      {!loading && !error && users.length === 0 && (
        <EmptyState title="No users found" />
      )}

      {!loading && users.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-line overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-line" data-testid="users-table">
            <thead className="bg-gray-lighter">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-txt uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-txt uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-txt uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-txt uppercase">Active</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-txt uppercase">Change Role</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-txt uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-line">
              {users.map((u) => (
                <tr key={u.id} data-testid={`user-row-${u.id}`} className="hover:bg-gray-lighter">
                  <td className="px-6 py-4 text-sm text-gray-txt">{u.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-dark">{u.email}</td>
                  <td className="px-6 py-4"><Badge variant={u.role}>{u.role}</Badge></td>
                  <td className="px-6 py-4"><Badge variant={u.is_active ? "delivered" : "cancelled"}>{u.is_active ? "Yes" : "No"}</Badge></td>
                  <td className="px-6 py-4">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      disabled={actionLoading === u.id}
                      className="rounded border border-gray-line px-2 py-1 text-sm"
                      data-testid={`user-role-select-${u.id}`}
                    >
                      <option value="buyer">Buyer</option>
                      <option value="seller">Seller</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={(e) => {
                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                        setMenuPos({ top: rect.bottom + 4, left: rect.left });
                        setOpenMenuId(openMenuId === u.id ? null : u.id);
                      }}
                      className="inline-flex items-center justify-center rounded-md px-2 py-1 text-sm font-medium text-gray-txt hover:bg-gray-lighter focus:outline-none"
                      data-testid={`btn-actions-${u.id}`}
                    >
                      ⋯
                    </button>
                    {openMenuId === u.id && menuPos && (
                      <div
                        ref={menuRef}
                        style={{ position: "fixed", top: menuPos.top, left: menuPos.left, zIndex: 50 }}
                        className="rounded-md bg-white shadow-lg border border-gray-line py-1 flex flex-col"
                        data-testid={`actions-menu-${u.id}`}
                      >
                        <button
                          onClick={() => { setOpenMenuId(null); setMenuPos(null); handleToggleAdmin(u); }}
                          disabled={actionLoading === u.id}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-txt hover:bg-gray-lighter disabled:opacity-50"
                          data-testid={`user-toggle-admin-${u.id}`}
                        >
                          {u.role === "admin" ? "Remove Admin" : "Make Admin"}
                        </button>
                        <button
                          onClick={() => { setOpenMenuId(null); setMenuPos(null); handleDelete(u.id); }}
                          disabled={!u.is_active || actionLoading === u.id}
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-lighter disabled:opacity-50"
                          data-testid={`btn-delete-user-${u.id}`}
                        >
                          {u.is_active ? "Deactivate" : "Deleted"}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={page} pages={pages} total={total} size={size} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <AuthGuard roles={["admin"]}>
      <AdminUsersPage />
    </AuthGuard>
  );
}