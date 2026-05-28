"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { getUsers, createUser, updateUserRole, makeAdmin, removeAdmin, deleteUser } from "@/lib/queries/users";
import type { User, UserAdminCreate, UserFilter } from "@/types/api";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { useToast } from "@/contexts/ToastContext";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { TableSkeleton } from "@/components/ui/Skeleton";

const ROLE_OPTIONS = [
  { value: "buyer", label: "Buyer" },
  { value: "seller", label: "Seller" },
  { value: "admin", label: "Admin" },
];

function AdminUsersPage() {
  const { toast } = useToast();
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

  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  const handleDelete = async () => {
    if (deleteTarget === null) return;
    try {
      await deleteUser(deleteTarget);
      toast("User deactivated", "success");
      fetchUsers();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Failed to delete user", "error");
    } finally {
      setDeleteTarget(null);
    }
  };

  const [confirmToggleAdmin, setConfirmToggleAdmin] = useState<User | null>(null);

  const handleToggleAdminWrapped = async () => {
    if (!confirmToggleAdmin) return;
    setActionLoading(confirmToggleAdmin.id);
    try {
      if (confirmToggleAdmin.role === "admin") {
        await removeAdmin(confirmToggleAdmin.id);
        toast("Admin role removed", "success");
      } else {
        await makeAdmin(confirmToggleAdmin.id);
        toast("User promoted to admin", "success");
      }
      fetchUsers();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Failed to toggle admin", "error");
    } finally {
      setActionLoading(null);
      setConfirmToggleAdmin(null);
    }
  };

  return (
    <div data-testid="admin-users-page">
      <Breadcrumbs items={[
        { label: "Home", href: "/" },
        { label: "Admin" },
        { label: "Users" },
      ]} />

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

      {loading && <TableSkeleton rows={5} />}
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
                  <td className="px-6 py-4"><Badge variant={u.is_active ? "active" : "inactive"}>{u.is_active ? "Yes" : "No"}</Badge></td>
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
                          onClick={() => { setOpenMenuId(null); setMenuPos(null); setConfirmToggleAdmin(u); }}
                          disabled={actionLoading === u.id}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-txt hover:bg-gray-lighter disabled:opacity-50"
                          data-testid={`user-toggle-admin-${u.id}`}
                        >
                          {u.role === "admin" ? "Remove Admin" : "Make Admin"}
                        </button>
                        <button
                          onClick={() => { setOpenMenuId(null); setMenuPos(null); setDeleteTarget(u.id); }}
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

      <ConfirmationModal
        open={deleteTarget !== null}
        title="Deactivate User"
        message="Are you sure you want to deactivate this user?"
        confirmLabel="Deactivate"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmationModal
        open={confirmToggleAdmin !== null}
        title={confirmToggleAdmin?.role === "admin" ? "Remove Admin" : "Make Admin"}
        message={confirmToggleAdmin?.role === "admin"
          ? `Remove admin role from ${confirmToggleAdmin?.email}?`
          : `Promote ${confirmToggleAdmin?.email} to admin?`}
        confirmLabel={confirmToggleAdmin?.role === "admin" ? "Remove Admin" : "Make Admin"}
        variant="primary"
        loading={actionLoading === confirmToggleAdmin?.id}
        onConfirm={handleToggleAdminWrapped}
        onCancel={() => setConfirmToggleAdmin(null)}
      />
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