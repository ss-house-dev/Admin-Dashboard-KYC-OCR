"use client";

import Image from "next/image";
import { useState } from "react";
import type { FieldErrors, UseFormRegister } from "react-hook-form";
import type { SignInValues } from "../containers/SignInContainer";
import TextField from "@/features/sign-up/components/TextField";
import PasswordField from "@/features/sign-up/components/PasswordField";
import { cn } from "@/lib/utils";

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
    <div className="grid h-full grid-cols-1 overflow-hidden lg:grid-cols-2 bd:[##F8F8F8]">
      <div className="flex h-full items-center justify-center bg-gradient-to-b from-white to-gray-50">
        <div
          className={cn(
            "w-[520px] bg-white border border-gray-200",
            "p-6 rounded-[10px]"
          )}
        >
          {" "}
          {/* หัวเรื่อง */}
          <div className="text-center space-y-2 mb-6">
            <h1 className="text-[24px]  font-semibold leading-6 text-gray-900">
              Sign In
            </h1>
            <p className="mt-2 text-[14px] leading-4 text-gray-500">
              Let's verify your identity
            </p>
          </div>
          {/* ฟิลด์ */}
          <form onSubmit={onSubmit} className=" mb-5 space-y-2">
            <TextField
              label="Username"
              placeholder="Enter your Username"
              registration={register("loginId")}
              error={errors.loginId?.message as string | undefined}
              autoComplete="username"
              inputClassName=""
            />

            <PasswordField
              label="Password"
              placeholder="Enter your password"
              registration={register("password")}
              error={errors.password?.message as string | undefined}
              show={showPw}
              onToggleShow={() => setShowPw((s) => !s)}
              autoComplete="current-password"
              inputClassName="mt-2"
            />
          </form>
          {/* ปุ่มล่าง */}
          <div className="">
            <button type="submit" formAction="" className="hidden" />
            <button
              type="submit"
              onClick={(e) => {
                const form = e.currentTarget.closest("div")
                  ?.previousElementSibling as HTMLFormElement | null;
                form?.requestSubmit();
              }}
              disabled={isSubmitting}
              className={cn(
                " w-full rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 py-3text-white text-base "
              )}
            >
              {isSubmitting ? "Logging in..." : "Login"}
            </button>

            <p className="mt-4 text-center text-xs  text-black">
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
