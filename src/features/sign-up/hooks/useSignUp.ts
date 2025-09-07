"use client";

import { useMutation } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import {
  signUp,
  signIn,
  persistTokens,
  type SignUpPayload,
  type AuthTokens,
} from "../services";

type MutationInput = SignUpPayload;
type MutationOutput = AuthTokens;

export function useSignUpAndAutoLogin() {
  return useMutation({
    mutationFn: async (p: SignUpPayload) => {
      await signUp(p);
      const tokens = await signIn({
        loginId: p.username,
        password: p.password,
      });
      persistTokens(tokens);
      return tokens;
    },
  });
}
