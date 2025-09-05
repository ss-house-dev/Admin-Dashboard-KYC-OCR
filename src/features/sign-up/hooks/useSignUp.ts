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
  return useMutation<MutationOutput, AxiosError, MutationInput>({
    mutationFn: async (payload) => {
      await signUp(payload);
      const tokens = await signIn({
        loginId: payload.username, 
        password: payload.password,
      });
      persistTokens(tokens);
      return tokens;
    },
  });
}
