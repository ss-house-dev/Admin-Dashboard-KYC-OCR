import { api } from "@/lib/axios";

export type SignUpPayload = {
  username: string;
  password: string;
  company: {
    name: string;
    contactEmail: string;
    contactPhone: string;
  };
};

export type SignInPayload = {
  loginId: string; 
  password: string;
};

export type AuthTokens = {
  accessToken?: string;
  refreshToken?: string;
  [k: string]: unknown; 
};

export async function signUp(payload: SignUpPayload) {
  const { data } = await api.post("/auth/signup", payload);
  return data; // บางระบบคืน user, message ฯลฯ
}

export async function signIn(payload: SignInPayload) {
  const { data } = await api.post("/auth/signin", payload);
  return data as AuthTokens;
}

export function persistTokens(tokens: AuthTokens) {
  if (typeof window === "undefined") return;
  if (tokens.accessToken) localStorage.setItem("accessToken", tokens.accessToken);
  if (tokens.refreshToken) localStorage.setItem("refreshToken", tokens.refreshToken);
}
