"use client";

import { InputHTMLAttributes } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  registration?: UseFormRegisterReturn;
  inputClassName?: string; 
};

export default function TextField({
  label,
  error,
  className,
  registration,
  inputClassName,
  ...rest
}: Props) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-gray-700">{label}</label>
      <input
        {...rest}
        {...registration}
        aria-invalid={!!error}
        className={`w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-100 ${inputClassName ?? ""} ${className ?? ""}`}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
