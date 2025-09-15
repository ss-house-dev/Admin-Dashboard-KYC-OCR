import { z } from "zod";

const usernameRegex = /^[A-Za-z0-9]{6,50}$/;

export const SignInSchema = z.object({
  username: z.string().trim().regex(usernameRegex),
  password: z.string().min(8).max(50),
});

export type SignInValues = z.infer<typeof SignInSchema>;
