// src/features/sign-in/containers/SignInContainer.tsx
"use client";

import { useRouter } from "next/navigation";
import { useForm, type SubmitErrorHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import SignInView from "../components/SignInView";
import { SignInSchema, type SignInValues } from "../schemas/signIn";

export default function SignInContainer() {
  const router = useRouter();
  const form = useForm<SignInValues>({
    resolver: zodResolver(SignInSchema),
    mode: "onTouched",
    defaultValues: { username: "", password: "" },
  });

  const onValid = async (values: SignInValues) => {
    form.clearErrors();

    const res = await signIn("credentials", {
      username: values.username,
      password: values.password,
      redirect: false,
    });

    if (res?.ok) {
      router.replace("/admin-dashboard");
      return;
    }

    const msg = res?.error ?? "Login failed";
    if (/user/i.test(msg)) {
      form.setError("username", { type: "server", message: "User account not found." });
    } else if (/credential|password/i.test(msg) || /invalid/i.test(msg)) {
      form.setError("password", { type: "server", message: "Username or password is incorrect." });
    } else {
      toast.error("Login failed", { description: msg });
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
      isSubmitting={form.formState.isSubmitting}
      onSubmit={form.handleSubmit(onValid, onInvalid)}
      onGoSignUp={() => router.push("/sign-up")}
    />
  );
}
