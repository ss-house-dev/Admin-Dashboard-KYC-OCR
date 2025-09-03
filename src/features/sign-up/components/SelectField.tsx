"use client";

import type { UseFormRegisterReturn } from "react-hook-form";

type Option = { value: string; label: string };

export default function SelectField({
  label,
  options,
  error,
  registration,
  className,
  ...rest
}: {
  label: string;
  options: Option[];
  error?: string;
  registration?: UseFormRegisterReturn;
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <select
        {...rest}
        {...registration}
        aria-invalid={!!error}
        className={`w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 focus:outline-none focus:ring-4 focus:ring-blue-100 ${
          className ?? ""
        }`}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
