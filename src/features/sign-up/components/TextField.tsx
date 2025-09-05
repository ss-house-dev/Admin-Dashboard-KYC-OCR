"use client";

import * as React from "react";
import { InputHTMLAttributes } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: React.ReactNode;
  /** ข้อความช่วยอธิบายใต้ label */
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
  ...rest
}: Props) {
  // ให้มี id เสมอเพื่อผูกกับ label/description ได้
  const reactId = React.useId();
  const inputId = id ?? `tf-${reactId}`;
  const descId = helpText ? `${inputId}-desc` : undefined;
  const errId = error ? `${inputId}-err` : undefined;

  // รวม aria-describedby จากทั้ง help และ error
  const describedBy = [descId, errId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("mt-2 space-y-1", className)}>
      <Label htmlFor={inputId} className={labelClassName}>
        {" "}
        {label}
      </Label>

      {helpText && (
        <p id={descId} className="text-[10px]  text[#282828] mb-1">
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
      />

      {error && (
        <p id={errId} className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
