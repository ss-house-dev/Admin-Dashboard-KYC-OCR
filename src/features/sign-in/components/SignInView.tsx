"use client";

import Image from "next/image";
import { useState } from "react";
import type { FieldErrors, UseFormRegister } from "react-hook-form";
import type { SignInValues } from "../containers/SignInContainer";
import TextField from "@/features/sign-up/components/TextField";
import PasswordField from "@/features/sign-up/components/PasswordField";

type Props = {
  register: UseFormRegister<SignInValues>;
  errors: FieldErrors<SignInValues>;
  isSubmitting?: boolean;
  onSubmit: React.FormEventHandler<HTMLFormElement>;
  onGoSignUp: () => void;
};

export default function SignInView({
  register,
  errors,
  isSubmitting,
  onSubmit,
  onGoSignUp,
}: Props) {
  const [showPw, setShowPw] = useState(false);

  return (
    <div className="grid h-full grid-cols-1 overflow-hidden lg:grid-cols-2">
      <div className="flex h-full items-center justify-center bg-gradient-to-b from-white to-gray-50">
        <div
          className="
      w-full
      max-w-[420px] lg:max-w-[480px] xl:max-w-[520px] 2xl:max-w-[560px]
      rounded-2xl border border-gray-200 bg-white shadow-sm
      grid grid-rows-[auto,1fr,auto]
      gap-y-2 lg:gap-y-3
      px-5 pt-5 pb-4
      lg:px-7 lg:pt-6 lg:pb-5
      xl:px-8 xl:pt-7 xl:pb-6
      2xl:px-10 2xl:pt-8 2xl:pb-7
    "
        >
          {/* หัวเรื่อง */}
          <div className="text-center">
            <h1 className="text-xl lg:text-2xl xl:text-[28px] font-semibold leading-6 text-gray-900">
              Sign In
            </h1>
            <p className="mt-2 text-xs lg:text-sm leading-4 text-gray-500">
              Let's verify your identity
            </p>
          </div>

          {/* ฟิลด์ */}
          <form
            onSubmit={onSubmit}
            className="
        min-h-0 overflow-auto pr-1
        space-y-2.5 lg:space-y-3
        mt-[30px]   /* คง 30px ตามที่ขอ */
      "
          >
            <TextField
              label="E-mail or username"
              placeholder="Enter your E-mail or username"
              registration={register("loginId")}
              error={errors.loginId?.message as string | undefined}
              autoComplete="username"
              inputClassName="py-2.5 lg:py-3 xl:py-3.5"
            />

            <PasswordField
              label="Password"
              placeholder="Enter your password"
              registration={register("password")}
              error={errors.password?.message as string | undefined}
              show={showPw}
              onToggleShow={() => setShowPw((s) => !s)}
              autoComplete="current-password"
              inputClassName="py-2.5 lg:py-3 xl:py-3.5"
            />
          </form>

          {/* ปุ่มล่าง */}
          <div className="pt-0">
            <button type="submit" formAction="" className="hidden" />
            <button
              type="submit"
              onClick={(e) => {
                const form = e.currentTarget.closest("div")
                  ?.previousElementSibling as HTMLFormElement | null;
                form?.requestSubmit();
              }}
              disabled={isSubmitting}
              className="
          w-full rounded-lg
          bg-gradient-to-r from-blue-500 to-blue-700
          py-2.5 lg:py-3
          text-white shadow transition-opacity disabled:opacity-60
          text-sm lg:text-base
        "
            >
              {isSubmitting ? "Logging in..." : "Login"}
            </button>

            <p className="mt-2 lg:mt-3 mb-0 text-center text-xs lg:text-sm text-gray-600">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={onGoSignUp}
                className="text-blue-600 hover:underline"
              >
                Sign up
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* ขวา: โลโก้/พื้นหลัง แบบเดียวกับ Sign Up */}
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
