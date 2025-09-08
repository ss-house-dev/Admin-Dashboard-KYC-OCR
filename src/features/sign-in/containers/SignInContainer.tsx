"use client";

import { useRouter } from "next/navigation";
import { useForm, type SubmitErrorHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import SignInView from "../components/SignInView";
import { useSignIn } from "../hooks";
import { toast } from "sonner";
import { SignInSchema, type SignInValues } from "../schemas/signIn";
import type { ApiErrorResponse } from "@/shared/types/api";

export default function SignInContainer() {
  const router = useRouter();

  const form = useForm<SignInValues>({
    resolver: zodResolver(SignInSchema),
    mode: "onTouched",
    defaultValues: { username: "", password: "" },
  });

  const signInMut = useSignIn();

  const onValid = async (values: SignInValues) => {
    form.clearErrors();

    try {
      await signInMut.mutateAsync({
        username: values.username,
        password: values.password,
      });
      router.replace("/admin-dashboard");
    } catch (e: unknown) {
      if (isAxiosError<ApiErrorResponse>(e)) {
        const status = e.response?.status;
        const msg =
          e.response?.data?.message ??
          (status ? `Login failed (${status})` : "Network error");

        if (status === 401) {
          form.setError("password", {
            type: "server",
            message: "Username or password is incorrect.",
          });
          return;
        }
        if (status === 404) {
          form.setError("username", {
            type: "server",
            message: "User account not found.",
          });
          return;
        }
        if (status === 400) {
          if (/user(name)?/i.test(msg)) {
            form.setError("username", { type: "server", message: msg });
            return;
          }
          if (/password/i.test(msg)) {
            form.setError("password", { type: "server", message: msg });
            return;
          }
        }

        // ข้อผิดพลาดทั่วไป → toast
        toast.error("Login failed", { description: msg });
        return;
      }

      // ไม่ใช่ Axios error
      toast.error("Unexpected error", {
        description: "Something went wrong. Please try again.",
      });
    }
  };

  const onInvalid: SubmitErrorHandler<SignInValues> = (errors) => {
    const first = Object.keys(errors)[0] as keyof SignInValues | undefined;
    if (first) form.setFocus(first);
  };

  return (
    <SignInView
      register={form.register}
      errors={form.formState.errors}
      isSubmitting={signInMut.isPending}
      onSubmit={form.handleSubmit(onValid, onInvalid)}
      onGoSignUp={() => router.push("/sign-up")}
    />
  );
}
