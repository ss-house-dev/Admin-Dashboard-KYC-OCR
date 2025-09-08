import { z } from "zod";

const usernameRegex = /^[A-Za-z0-9]{6,50}$/;

export const SignInSchema = z.object({
  username: z
    .string()
    .trim()
    .regex(
      usernameRegex,
      "Username can only contain English letters or numbers, 6-50 characters long."
    ),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long.")
    .max(50),
});

export type SignInValues = z.infer<typeof SignInSchema>;
