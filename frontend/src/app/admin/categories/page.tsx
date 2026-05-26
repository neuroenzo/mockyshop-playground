"use client";

import { useEffect, useState } from "react";
import { getCategories, createCategory, updateCategory, deleteCategory } from "@/lib/queries/categories";
import type { Category } from "@/types/api";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");

  const fetchCategories = () => {
    setLoading(true);
    getCategories()
      .then(setCategories)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await createCategory({ name: name.trim() });
      setName("");
      fetchCategories();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create category");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: number) => {
    if (!editName.trim()) return;
    setSaving(true);
    try {
      await updateCategory(id, { name: editName.trim() });
      setEditingId(null);
      fetchCategories();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update category");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this category?")) return;
    try {
      await deleteCategory(id);
      fetchCategories();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete category");
    }
  };

  return (
    <div data-testid="admin-categories-page">
      <h1 className="text-2xl font-bold mb-6">Category Management</h1>

      {/* Create form */}
      <form onSubmit={handleCreate} className="bg-white rounded-lg shadow-sm border border-gray-line p-4 mb-6 flex gap-4 items-end max-w-lg">
        <div className="flex-1">
          <Input
            name="name"
            placeholder="New category name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <Button type="submit" loading={saving} testId="btn-create-category">Add Category</Button>
      </form>

      {error && <ErrorMessage message={error} />}
      {loading && <Spinner />}

      {!loading && categories.length === 0 && <EmptyState title="No categories" />}

      {!loading && categories.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-line overflow-hidden">
          <table className="min-w-full divide-y divide-gray-line" data-testid="categories-table">
            <thead className="bg-gray-lighter">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-txt uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-txt uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-txt uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-txt uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-line">
              {categories.map((cat) => (
                <tr key={cat.id} data-testid={`category-row-${cat.id}`} className="hover:bg-gray-lighter">
                  <td className="px-6 py-4 text-sm text-gray-txt">{cat.id}</td>
                  <td className="px-6 py-4">
                    {editingId === cat.id ? (
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="rounded border border-gray-line px-2 py-1 text-sm"
                          data-testid="input-edit-category-name"
                        />
                        <Button size="sm" onClick={() => handleUpdate(cat.id)} loading={saving} testId="btn-save-category">Save</Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-dark">{cat.name}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={cat.is_active ? "delivered" : "cancelled"}>
                      {cat.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => { setEditingId(cat.id); setEditName(cat.name); }}
                      testId={`btn-edit-category-${cat.id}`}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(cat.id)}
                      testId={`btn-delete-category-${cat.id}`}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <AuthGuard roles={["admin"]}>
      <AdminCategoriesPage />
    </AuthGuard>
  );
}
