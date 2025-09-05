"use client";

import * as React from "react";
import { InputHTMLAttributes } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

// ...imports เดิม
type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: React.ReactNode;
  helpText?: React.ReactNode;
  error?: string;
  registration?: UseFormRegisterReturn;
  inputClassName?: string;
  labelClassName?: string;
};

export default function TextField({
  label,
  helpText,
  error,
  className,
  registration,
  inputClassName,
  labelClassName,
  id,
  name, // <- เผื่อส่ง name มาตรง ๆ
  ...rest
}: Props) {
  // ใช้ชื่อฟิลด์เป็นฐาน id ที่ deterministic
  const fieldName = registration?.name ?? name;
  const reactId = React.useId(); // fallback เท่านั้น
  const inputId = id ?? (fieldName ? `tf-${fieldName}` : `tf-${reactId}`);

  const descId = helpText ? `${inputId}-desc` : undefined;
  const errId = error ? `${inputId}-err` : undefined;
  const describedBy = [descId, errId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("mt-2 space-y-1", className)}>
      <Label htmlFor={inputId} className={labelClassName}>
        {label}
      </Label>

      {helpText && (
        <p id={descId} className="mb-1 text-[10px] leading-4 text-[#282828]">
          {helpText}
        </p>
      )}

      <Input
        id={inputId}
        aria-invalid={!!error}
        aria-errormessage={errId}
        aria-describedby={describedBy}
        className={cn(inputClassName)}
        {...rest}
        {...registration}
        name={fieldName}
      />

      {error && (
        <p id={errId} className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
