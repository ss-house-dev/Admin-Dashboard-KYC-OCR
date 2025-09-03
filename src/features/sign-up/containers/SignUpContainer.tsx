"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import SignUpView from "../components/SignUpView";

// Username: อังกฤษ/ตัวเลข 6–50
const usernameRegex = /^[A-Za-z0-9]{6,50}$/;

// Password: ASCII ไม่มีช่องว่าง, ≥1 ตัวพิมพ์ใหญ่, ≥1 อักขระพิเศษ, 8–50
const asciiNoSpace = /^[\x21-\x7E]+$/;
const hasUpper = /[A-Z]/;
const hasSpecial = /[^A-Za-z0-9]/;

const SignUpSchema = z
  .object({
    companyName: z.string().trim().min(1, "กรุณากรอกชื่อบริษัท"),
    companyEmail: z.string().email("อีเมลบริษัทไม่ถูกต้อง"),
    companyTel: z
      .string()
      .trim()
      .min(1, "กรุณากรอกเบอร์บริษัท")
      .regex(/^[0-9+()\-\s]+$/, "ใช้ได้เฉพาะตัวเลข + ( ) - และช่องว่าง")
      .refine(
        (v) => {
          const d = v.replace(/\D/g, ""); // เอาเฉพาะตัวเลข
          return d.length >= 8 && d.length <= 15;
        },
        { message: "ความยาวเบอร์ควรมี 8–15 หลัก" }
      ),
    businessType: z.string().trim().min(1, "กรุณาระบุประเภทธุรกิจ/อุตสาหกรรม"),
    username: z
      .string()
      .regex(
        usernameRegex,
        "Username ใช้ได้เฉพาะตัวอักษรอังกฤษ/ตัวเลข 6–50 ตัว"
      ),
    password: z
      .string()
      .min(8, "รหัสผ่านอย่างน้อย 8 ตัว")
      .max(50, "รหัสผ่านสูงสุด 50 ตัว")
      .regex(
        asciiNoSpace,
        "ใช้ได้เฉพาะตัวอักษร/สัญลักษณ์ภาษาอังกฤษ (ไม่เว้นวรรค)"
      )
      .refine((v) => hasUpper.test(v), {
        message: "ต้องมีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว",
      })
      .refine((v) => hasSpecial.test(v), {
        message: "ต้องมีอักขระพิเศษอย่างน้อย 1 ตัว",
      }),
    confirmPassword: z.string().min(1, "กรุณายืนยันรหัสผ่าน"),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "รหัสผ่านไม่ตรงกัน",
  });

export type SignUpValues = z.infer<typeof SignUpSchema>;

export default function SignUpContainer() {
  const router = useRouter();

  const form = useForm<SignUpValues>({
    resolver: zodResolver(SignUpSchema),
    mode: "onTouched",
    defaultValues: {
      companyName: "",
      companyEmail: "",
      companyTel: "",
      businessType: "",
      username: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onValid = async (values: SignUpValues) => {
    // เรียก API สมัคร + ส่งอีเมลยืนยัน (AC2)
    await new Promise((r) => setTimeout(r, 600)); // mock
    router.push("/sign-up/check-email");
  };

  return (
    <SignUpView
      register={form.register}
      errors={form.formState.errors}
      isSubmitting={form.formState.isSubmitting}
      onSubmit={form.handleSubmit(onValid)}
      onGoSignIn={() => router.push("/sign-in")}
    />
  );
}
