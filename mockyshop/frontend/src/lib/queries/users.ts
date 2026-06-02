import { apiFetch } from "@/lib/api";
import type { User, UserAdminCreate, UserFilter, UserPaginatedResponse, UserUpdate, UserRoleUpdate } from "@/types/api";

function buildQuery(filter: UserFilter): string {
  const params = new URLSearchParams();
  Object.entries(filter).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function getUsers(filter: UserFilter = {}): Promise<UserPaginatedResponse> {
  return apiFetch<UserPaginatedResponse>(`/users/${buildQuery(filter)}`);
}

export function createUser(data: UserAdminCreate): Promise<User> {
  return apiFetch<User>("/admin/users/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateUser(userId: number, data: UserUpdate): Promise<User> {
  return apiFetch<User>(`/users/${userId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function updateUserRole(userId: number, data: UserRoleUpdate): Promise<User> {
  return apiFetch<User>(`/users/${userId}/role`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function makeAdmin(userId: number): Promise<User> {
  return apiFetch<User>(`/admin/users/${userId}/make-admin`, {
    method: "POST",
  });
}

export function removeAdmin(userId: number): Promise<User> {
  return apiFetch<User>(`/admin/users/${userId}/remove-admin`, {
    method: "POST",
  });
}

export function deleteUser(userId: number): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>(`/admin/users/${userId}`, {
    method: "DELETE",
  });
}
