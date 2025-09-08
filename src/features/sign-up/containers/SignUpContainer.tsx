"use client";

import { useRouter } from "next/navigation";
import { useForm, type SubmitErrorHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { AxiosError } from "axios";
import SignUpView from "../components/SignUpView";              
import { useSignUpAndAutoLogin } from "../hooks";
import { handleSignUpServerError } from "../services/errorMap";
import { SignUpSchema, type SignUpValues } from "../schemas/signUp"; 

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

  const signupMut = useSignUpAndAutoLogin();

  const onValid = async (v: SignUpValues) => {
    form.clearErrors();

    try {
      await signupMut.mutateAsync({
        username: v.username,
        password: v.password,
        company: {
          name: v.companyName,
          contactEmail: v.companyEmail,
          contactPhone: v.companyTel,
        },
      });
      router.replace("/admin-dashboard");
    } catch (e) {
      handleSignUpServerError<SignUpValues>(e as AxiosError, (name, err) => form.setError(name, err));
      const first = Object.keys(form.formState.errors)[0] as keyof SignUpValues | undefined;
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
      isSubmitting={signupMut.isPending}
      onSubmit={form.handleSubmit(onValid, onInvalid)}
      onGoSignIn={() => router.push("/sign-in")}
    />
  );
}
