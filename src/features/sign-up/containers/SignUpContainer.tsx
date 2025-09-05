"use client";

import { useRouter } from "next/navigation";
import { useForm, type SubmitErrorHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { AxiosError } from "axios";
import SignUpView from "../components/SignUpView";
import { useSignUpAndAutoLogin } from "../hooks";

/* ===== Regex / Schemas ===== */
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

/* ===== Container ===== */
export default function SignUpContainer() {
  const router = useRouter();
  const signupMut = useSignUpAndAutoLogin();

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

  // สมัคร → ล็อกอินอัตโนมัติ  → ไปหน้า /
  const onValid = async (values: SignUpValues) => {
    try {
      await signupMut.mutateAsync({
        username: values.username,
        password: values.password,
        company: {
          name: values.companyName,
          contactEmail: values.companyEmail,
          contactPhone: values.companyTel,
        },
      });
      router.push("/admin-dashboard");
    } catch (e) {
      const err = e as AxiosError<any>;
      const status = err.response?.status;
      const msg = (err.response?.data as any)?.message ?? "สมัครไม่สำเร็จ";

      // แม็ป error ที่พบบ่อยให้ชี้ฟิลด์ถูกต้อง
      if (status === 409) {
        form.setError("username", {
          type: "server",
          message: "Username นี้ถูกใช้แล้ว",
        });
        return;
      }
      if (status === 400) {
        // ข้อมูลไม่ครบหรือรูปแบบไม่ถูก
        form.setError("companyEmail", { type: "server", message: msg });
        return;
      }
      // เผื่อกรณีอื่น ๆ
      alert(msg);
    }
  };

  const onInvalid: SubmitErrorHandler<SignUpValues> = (errors) => {
    const first = Object.keys(errors)[0] as keyof SignUpValues | undefined;
    if (first) form.setFocus(first);
  };

  return (
    <SignUpView
      register={form.register}
      errors={form.formState.errors}
      isSubmitting={signupMut.isPending}
      onSubmit={form.handleSubmit(onValid, onInvalid)}
      onGoSignIn={() => router.push("/sign-in")}
    />
  );
}
