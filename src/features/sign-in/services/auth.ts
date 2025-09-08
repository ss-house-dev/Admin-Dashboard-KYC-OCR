import { api } from "@/lib/axios";
import type { AuthTokens } from "@/shared/types/auth";

export type SignInPayload = {
  username: string;  
  password: string;
};

export async function signIn(payload: SignInPayload) {
  const { data } = await api.post("/auth/signin", {
    username: payload.username,
    password: payload.password,
  });
  return data as AuthTokens;
}
