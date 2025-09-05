"use client";

import * as React from "react";
import { InputHTMLAttributes } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
  helpText?: React.ReactNode;
  error?: string;
  show: boolean;
  onToggleShow: () => void;
  registration?: UseFormRegisterReturn;
  inputClassName?: string;
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
  name,
  ...rest
}: Props) {
  const fieldName = registration?.name ?? name;
  const reactId = React.useId();
  const inputId = id ?? (fieldName ? `pw-${fieldName}` : `pw-${reactId}`);

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
          type={show ? "text" : "password"}
          aria-invalid={!!error}
          aria-errormessage={errId}
          aria-describedby={describedBy}
          className={cn(inputClassName)}
          {...rest}
          {...registration}
          name={fieldName}
        />
        {/* ปุ่มแสดง/ซ่อนเหมือนเดิม */}
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute inset-y-0 right-0 mr-2 grid w-9 place-items-center rounded-lg text-gray-500 hover:text-gray-700"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {/* ...svg เดิม */}
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
