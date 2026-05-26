import { apiFetch } from "@/lib/api";
import type {
  LoginRequest,
  TokenResponse,
  User,
  UserCreate,
} from "@/types/api";

export function login(data: LoginRequest): Promise<TokenResponse> {
  const body = new URLSearchParams({
    username: data.username,
    password: data.password,
  });
  return apiFetch<TokenResponse>("/users/token", {
    method: "POST",
    body,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
}

export function register(data: UserCreate): Promise<User> {
  return apiFetch<User>("/users/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getMyProfile(): Promise<User> {
  return apiFetch<User>("/admin/main");
}
