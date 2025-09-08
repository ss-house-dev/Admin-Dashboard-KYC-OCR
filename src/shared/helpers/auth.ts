import type { AuthTokens } from "@/shared/types/auth";

export function persistTokens(tokens: AuthTokens) {
  if (typeof window === "undefined") return;
  if (tokens.accessToken)
    localStorage.setItem("accessToken", tokens.accessToken);
  if (tokens.refreshToken)
    localStorage.setItem("refreshToken", tokens.refreshToken);
}

export function clearTokens() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
}
