"use client";

import { useRouter } from "next/navigation";
import { useForm, type SubmitErrorHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import type { AxiosError } from "axios";

import SignUpView from "../components/SignUpView";
import { handleSignUpServerError } from "../services/errorMap";
import { signUp } from "../services";
import { SignUpSchema, type SignUpValues } from "../schemas/signUp";
import type { ApiErrorResponse } from "@/shared/types/api";

export default function SignUpContainer() {
  const router = useRouter();

  const form = useForm<SignUpValues>({
    resolver: zodResolver(SignUpSchema),
    mode: "onTouched",
    defaultValues: {
      companyName: "",
      companyEmail: "",
      companyTel: "",
      username: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onValid = async (v: SignUpValues) => {
    form.clearErrors();

    try {
      // สมัคร
      await signUp({
        username: v.username,
        password: v.password,
        company: {
          name: v.companyName,
          contactEmail: v.companyEmail,
          contactPhone: v.companyTel,
        },
      });

      // auto login ด้วย next-auth
      const res = await signIn("credentials", {
        username: v.username,
        password: v.password,
        redirect: false,
      });

      if (res?.ok) {
        router.replace("/admin-dashboard");
        return;
      }

      const msg = res?.error ?? "Login failed";
      if (/user/i.test(msg)) {
        form.setError("username", {
          type: "server",
          message: "User account not found.",
        });
      } else if (/credential|password/i.test(msg)) {
        form.setError("password", {
          type: "server",
          message: "Username or password is incorrect.",
        });
      } else {
        toast.error("Auto login failed", { description: msg });
      }
    } catch (e) {
      handleSignUpServerError<SignUpValues>(
        e as AxiosError<ApiErrorResponse>,
        (name, err) => form.setError(name, err)
      );
      const first = Object.keys(form.formState.errors)[0] as
        | keyof SignUpValues
        | undefined;
      if (first) form.setFocus(first);
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
      isSubmitting={form.formState.isSubmitting}
      onSubmit={form.handleSubmit(onValid, onInvalid)}
      onGoSignIn={() => router.push("/sign-in")}
    />
  );
}
