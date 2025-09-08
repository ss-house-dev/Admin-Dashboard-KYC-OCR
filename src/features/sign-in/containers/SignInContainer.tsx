"use client";

import { useRouter } from "next/navigation";
import { useForm, type SubmitErrorHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { AxiosError } from "axios";
import SignInView from "../components/SignInView";
import { useSignIn } from "../hooks";
import { SignInSchema, type SignInValues } from "../schemas/signIn";

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
    } catch (e) {
      const err = e as AxiosError<any>;
      const status = err.response?.status;
      const message = String(err.response?.data?.message ?? "Login failed");

      // แม็ปให้ลงช่องถูกต้อง (ใช้เฉพาะ username)
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
          message: "User account not found",
        });
        return;
      }
      if (status === 400) {
        if (/user(name)?/i.test(message)) {
          form.setError("username", { type: "server", message });
          return;
        }
        if (/password/i.test(message)) {
          form.setError("password", { type: "server", message });
          return;
        }
      }

      alert(message);
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
