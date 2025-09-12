import { z } from "zod";

// Username: อังกฤษ/ตัวเลข 6–50
const usernameRegex = /^[A-Za-z0-9]{6,50}$/;

// Password: ASCII ไม่มีช่องว่าง, ≥1 ตัวพิมพ์ใหญ่, ≥1 ตัวพิเศษ, 8–50
const asciiNoSpace = /^[\x21-\x7E]+$/;
const hasUpper = /[A-Z]/;
const hasSpecial = /[^A-Za-z0-9]/;

export const SignUpSchema = z
  .object({
    companyName: z.string().trim().min(1, "Please enter the company name."),
    companyEmail: z.string().email("Invalid company email."),
    companyTel: z
      .string()
      .trim()
      .regex(/^\d{8,15}$/, "Phone number must be digits only (8-15 digits)."),
    username: z
      .string()
      .regex(
        usernameRegex,
        "Username can only contain English letters or numbers, 6-50 characters long."
      ),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long.")
      .max(50, "Password can be up to 50 characters long.")
      .regex(asciiNoSpace, "English letters only, no spaces allowed.")
      .refine((v) => hasUpper.test(v), {
        message: "Must contain at least one uppercase letter.",
      })
      .refine((v) => hasSpecial.test(v), {
        message: "Must contain at least one special character.",
      }),
    confirmPassword: z.string().min(1, "Please confirm your password."),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export type SignUpValues = z.infer<typeof SignUpSchema>;
