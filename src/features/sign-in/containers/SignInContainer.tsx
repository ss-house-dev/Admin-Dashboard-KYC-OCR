"use client";

import { useRouter } from "next/navigation";
import { useForm, type SubmitErrorHandler } from "react-hook-form";
import { signIn } from "next-auth/react";
import SignInView from "../components/SignInView";

type FormValues = { username: string; password: string };

export default function SignInContainer() {
  const router = useRouter();

  const form = useForm<FormValues>({
    mode: "onTouched",
    defaultValues: { username: "", password: "" },
  });

  const onValid = async (values: FormValues) => {
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

    form.setError("root", {
      type: "server",
      message: "Invalid username or password.",
    });
  };

  const onInvalid: SubmitErrorHandler<FormValues> = (errors) => {
    const first = Object.keys(errors)[0] as keyof FormValues | undefined;
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
