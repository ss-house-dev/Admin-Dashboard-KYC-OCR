"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import SignInView from "../components/SignInView";

// อีเมลหรือยูสเซอร์เนมก็ได้
const usernameRegex = /^[A-Za-z0-9]{6,50}$/; // อังกฤษ/ตัวเลข 6–50
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // อีเมลพื้นฐาน

const SignInSchema = z.object({
  loginId: z
    .string()
    .trim()
    .min(1, "กรุณากรอกอีเมลหรือชื่อผู้ใช้")
    .refine((v) => emailRegex.test(v) || usernameRegex.test(v), {
      message: "ใส่อีเมลที่ถูกต้อง หรือชื่อผู้ใช้ 6–50 ตัว (อังกฤษ/ตัวเลข)",
    }),
  password: z.string().min(8, "รหัสผ่านอย่างน้อย 8 ตัว").max(50),
});

export type SignInValues = z.infer<typeof SignInSchema>;

export default function SignInContainer() {
  const router = useRouter();

  const form = useForm<SignInValues>({
    resolver: zodResolver(SignInSchema),
    mode: "onTouched",
    defaultValues: { loginId: "", password: "" },
  });

  const onValid = async (values: SignInValues) => {
    // เรียก API เข้าสู่ระบบ
    // await api.signIn(values);
    await new Promise((r) => setTimeout(r, 500)); // mock
    router.push("/"); // แดชบอร์ด
  };

  return (
    <SignInView
      register={form.register}
      errors={form.formState.errors}
      isSubmitting={form.formState.isSubmitting}
      onSubmit={form.handleSubmit(onValid)}
      onGoSignUp={() => router.push("/sign-up")}
    />
  );
}
