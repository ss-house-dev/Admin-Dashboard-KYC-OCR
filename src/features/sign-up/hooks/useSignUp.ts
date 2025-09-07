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
  return useMutation<AuthTokens, AxiosError, SignUpPayload>({
    mutationFn: async (p) => {
      await signUp(p);
      try {
        const t = await signIn({ username: p.username, password: p.password });
        persistTokens(t);
        return t;
      } catch (e: any) {
        const email = p.company?.contactEmail;
        const status = e?.response?.status;
        if (email && (status === 400 || status === 401 || status === 404)) {
          const t = await signIn({ username: email, password: p.password });
          persistTokens(t);
          return t;
        }
        throw e;
      }
    },
  });
}
