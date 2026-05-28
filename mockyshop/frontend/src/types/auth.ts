import type { User } from "./api";

export interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
}

export interface LoginCredentials {
  username: string;
  password: string;
}
