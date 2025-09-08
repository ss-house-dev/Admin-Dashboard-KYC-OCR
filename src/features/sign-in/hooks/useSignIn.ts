"use client";
import { useMutation } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { signIn, type SignInPayload } from "../services/auth";
import { persistTokens } from "@/shared/helpers/auth";
import type { AuthTokens } from "@/shared/types/auth";
import type { ApiErrorResponse } from "@/shared/types/api";

export function useSignIn() {
  return useMutation<AuthTokens, AxiosError<ApiErrorResponse>, SignInPayload>({
    mutationKey: ["auth", "signin"],
    retry: false,
    mutationFn: async (p) => {
      const tokens = await signIn(p);
      persistTokens(tokens);
      return tokens;
    },
  });
}
