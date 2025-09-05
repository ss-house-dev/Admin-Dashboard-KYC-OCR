"use client";

import * as React from "react";
import { InputHTMLAttributes } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
  /** ข้อความช่วยใต้ label */
  helpText?: React.ReactNode;
  error?: string;
  show: boolean;
  onToggleShow: () => void;
  registration?: UseFormRegisterReturn;
  inputClassName?: string;
  /** ใส่คลาสเฉพาะกับ Label ตัวนี้ */
  labelClassName?: string;
};

export default function PasswordField({
  label,
  helpText,
  error,
  show,
  onToggleShow,
  className,
  registration,
  inputClassName,
  labelClassName,
  id,
  ...rest
}: Props) {
  const reactId = React.useId();
  const inputId = id ?? `pw-${reactId}`;
  const descId = helpText ? `${inputId}-desc` : undefined;
  const errId = error ? `${inputId}-err` : undefined;
  const describedBy = [descId, errId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("mt-2 space-y-1", className)}>
      <Label htmlFor={inputId} className={labelClassName}>
        {label}
      </Label>

      {helpText && (
        <p id={descId} className="mb-1 text-[10px] leading-4 text-black">
          {helpText}
        </p>
      )}

      <div className="relative">
        <Input
          id={inputId}
          {...rest}
          {...registration}
          type={show ? "text" : "password"}
          aria-invalid={!!error}
          aria-errormessage={errId}
          aria-describedby={describedBy}
          className={cn(inputClassName)}
        />

        <button
          type="button"
          onClick={onToggleShow}
          className="absolute inset-y-0 right-0 mr-2 grid w-9 place-items-center rounded-lg text-gray-500 hover:text-gray-700"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? (
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" />
              <circle cx="12" cy="12" r="3" />
              <line x1="3" y1="3" x2="21" y2="21" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M1 12s5-8 11-8 11 8 11 8-5 8-11 8S1 12 1 12Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>

      {error && (
        <p id={errId} className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
