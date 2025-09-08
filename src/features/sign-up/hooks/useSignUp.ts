"use client";

import { useMutation } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { signUp, type SignUpPayload } from "../services";
import { signIn } from "@/features/sign-in/services/auth";
import { persistTokens } from "@/shared/helpers/auth";
import type { AuthTokens } from "@/shared/types/auth";

export function useSignUpAndAutoLogin() {
  return useMutation<AuthTokens, AxiosError, SignUpPayload>({
    mutationKey: ["auth", "signup"],
    retry: false,
    mutationFn: async (p) => {
      await signUp(p);
      const t = await signIn({ username: p.username, password: p.password });
      persistTokens(t);
      return t;
    },
  });
}
