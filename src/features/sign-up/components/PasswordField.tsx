"use client";

import { InputHTMLAttributes } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
  error?: string;
  show: boolean;
  onToggleShow: () => void;
  registration?: UseFormRegisterReturn;
  inputClassName?: string;
};

export default function PasswordField({
  label,
  error,
  show,
  onToggleShow,
  className,
  registration,
  inputClassName,
  ...rest
}: Props) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-gray-700">{label}</label>
      <div className="relative">
        <input
          {...rest}
          {...registration}
          type={show ? "text" : "password"}
          aria-invalid={!!error}
          className={`w-full rounded-xl border border-gray-200 bg-white px-4 py-3 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-100 ${inputClassName ?? ""} ${className ?? ""}`}
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute inset-y-0 right-0 mr-2 grid w-9 place-items-center rounded-lg text-gray-500 hover:text-gray-700"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? (
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" />
              <circle cx="12" cy="12" r="3" />
              <line x1="3" y1="3" x2="21" y2="21" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s5-8 11-8 11 8 11 8-5 8-11 8S1 12 1 12Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
