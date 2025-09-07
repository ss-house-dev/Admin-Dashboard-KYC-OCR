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
  username: string;
  password: string;
};

export type AuthTokens = {
  accessToken?: string;
  refreshToken?: string;
  [k: string]: unknown;
};

export async function signUp(payload: SignUpPayload) {
  const clean: SignUpPayload = {
    username: payload.username.trim(),
    password: payload.password,
    company: {
      name: payload.company.name.trim(),
      contactEmail: payload.company.contactEmail.trim(),
      contactPhone: payload.company.contactPhone.trim(),
    },
  };
  const { data } = await api.post("/auth/signup", clean);
  return data;
}
export async function signIn(body: SignInPayload) {
  const { data } = await api.post("/auth/signin", {
    username: body.username,
    password: body.password,
  });
  return data;
}

export function persistTokens(tokens: AuthTokens) {
  if (typeof window === "undefined") return;
  if (tokens.accessToken)
    localStorage.setItem("accessToken", tokens.accessToken);
  if (tokens.refreshToken)
    localStorage.setItem("refreshToken", tokens.refreshToken);
}
