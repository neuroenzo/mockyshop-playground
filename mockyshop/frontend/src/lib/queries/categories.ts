import { apiFetch } from "@/lib/api";
import type { Category, CategoryCreate } from "@/types/api";

export function getCategories(): Promise<Category[]> {
  return apiFetch<Category[]>("/categories/");
}

export function createCategory(data: CategoryCreate): Promise<Category> {
  return apiFetch<Category>("/categories/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateCategory(id: number, data: CategoryCreate): Promise<Category> {
  return apiFetch<Category>(`/categories/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteCategory(id: number): Promise<Category> {
  return apiFetch<Category>(`/categories/${id}`, {
    method: "DELETE",
  });
}
