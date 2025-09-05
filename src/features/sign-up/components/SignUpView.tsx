"use client";

import Image from "next/image";
import { useState } from "react";
import type { FieldErrors, UseFormRegister } from "react-hook-form";
import type { SignUpValues } from "../containers/SignUpContainer";
import TextField from "./TextField";
import PasswordField from "./PasswordField";
import { cn } from "@/lib/utils";

type Props = {
  register: UseFormRegister<SignUpValues>;
  errors: FieldErrors<SignUpValues>;
  isSubmitting?: boolean;
  onSubmit: React.FormEventHandler<HTMLFormElement>;
  onGoSignIn: () => void;
};

export default function SignUpView({
  register,
  errors,
  isSubmitting,
  onSubmit,
  onGoSignIn,
}: Props) {
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const formId = "sign-up-form";

  return (
    <div className="grid h-dvh grid-cols-1 lg:grid-cols-2 bg-[#F8F8F8]">
      {/* ซ้าย: การ์ดแบ่ง 3 แถว */}
      <div className="flex items-center justify-center bg-gradient-to-b from-white to-gray-50">
        <div
          className={cn(
            "w-full max-w-[420px] rounded-2xl border border-gray-200 bg-white shadow-sm p-5 sm:p-6 grid grid-rows-[auto,1fr,auto] h-[min(92dvh,700px)] min-h-[560px]"
          )}
        >
          {/* แถว 1: หัวเรื่อง */}
          <div className="mb-2 text-center">
            <h1 className="text-xl font-semibold text-gray-900">Sign Up</h1>
            <p className="mt-0.5 text-xs text-gray-500">
              Enter details to create your account
            </p>
          </div>

          {/* แถว 2: ฟอร์ม (เลื่อนเฉพาะภายในถ้าจำเป็น) */}
          <form
            id={formId}
            onSubmit={onSubmit}
            className="min-h-0 overflow-auto space-y-3 pr-1"
          >
            <TextField
              label="Company Name"
              placeholder="Enter your company Name"
              registration={register("companyName")}
              error={errors.companyName?.message as string | undefined}
              autoComplete="organization"
              inputClassName="py-2.5"
            />
            <TextField
              label="Company email"
              type="email"
              placeholder="Enter your company email"
              registration={register("companyEmail")}
              error={errors.companyEmail?.message as string | undefined}
              autoComplete="email"
              inputClassName="py-2.5"
            />
            <TextField
              label="Company Tel."
              type="tel"
              placeholder="Enter your company tel."
              registration={register("companyTel")}
              error={errors.companyTel?.message as string | undefined}
              autoComplete="tel"
              inputClassName="py-2.5"
            />
            <TextField
              label="Business type/Industry"
              placeholder="Enter your business type/industry"
              registration={register("businessType")}
              error={errors.businessType?.message as string | undefined}
              inputClassName="py-2.5"
            />
            <TextField
              label="Username"
              placeholder="Creat your username"
              helpText="(3–20 characters, letters and numbers only, no spaces or special symbols.) "
              registration={register("username")}
              error={errors.username?.message as string | undefined}
              autoComplete="username"
              inputClassName="py-2.5"
              labelClassName="pb-0 mb-1"
            />
            <PasswordField
              label="Password"
              placeholder="Enter your password"
              helpText="(8–50 chars, 1 uppercase, 1 special, English only.) "
              registration={register("password")}
              error={errors.password?.message as string | undefined}
              show={showPw}
              onToggleShow={() => setShowPw((s) => !s)}
              autoComplete="new-password"
              inputClassName="py-2.5"
              labelClassName="pb-0 mb-1"
            />
            <PasswordField
              label="Confirm Password"
              placeholder="Enter your password"
              registration={register("confirmPassword")}
              error={errors.confirmPassword?.message as string | undefined}
              show={showPw2}
              onToggleShow={() => setShowPw2((s) => !s)}
              autoComplete="new-password"
              inputClassName="py-2.5"
            />
          </form>

          {/* แถว 3: ปุ่ม + ลิงก์ (ติดล่างเสมอ) */}
          <div className="pt-2">
            <button
              type="submit"
              form={formId}
              disabled={isSubmitting}
              className="w-full rounded-lg bg-gradient-to-r from-blue-500 to-blue-700 py-2.5 text-white shadow transition-opacity disabled:opacity-60"
            >
              {isSubmitting ? "Submitting..." : "Sign up"}
            </button>
            <p className="mt-2 text-center text-xs text-gray-600">
              Already have an account?{" "}
              <button
                type="button"
                onClick={onGoSignIn}
                className="text-blue-600 hover:underline"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* ขวา: โลโก้เหมือนเดิม */}
      <div className="relative hidden items-center justify-center lg:flex">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500  to-blue-950" />
        <div className="relative z-10 flex w-full items-center justify-center">
          <Image
            src="/sign-up/logo-kyra-full.svg"
            alt="Kyra"
            width={376}
            height={150}
            className="h-auto w-[clamp(220px,28vw,520px)] xl:w-[clamp(280px,30vw,640px)] 2xl:w-[clamp(320px,28vw,720px)] object-contain"
            sizes="(min-width:1536px) 28vw, (min-width:1280px) 30vw, (min-width:1024px) 28vw, 0px"
            priority
          />
        </div>
        <div className="pointer-events-none absolute -bottom-24 -right-24 size-[240px] rounded-full border border-white" />
      </div>
    </div>
  );
}
