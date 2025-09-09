// src/features/sign-up/services/errorMap.ts
import type { AxiosError } from "axios";
import type { FieldError } from "react-hook-form";
import type { ApiErrorResponse } from "@/shared/types/api"; // ใช้ type เดียวจาก shared

type SetErrorFn<T> = (name: keyof T, err: FieldError) => void;

export function handleSignUpServerError<TFields extends Record<string, unknown>>(
  error: AxiosError<ApiErrorResponse>,
  setError: SetErrorFn<TFields>
) {
  const status = error.response?.status;
  const data = error.response?.data;

  // 1) กรณี backend ส่ง errors เป็น array
  if (data?.errors?.length) {
    for (const e of data.errors) {
      const msg = e.message ?? "Invalid";

      // field เป็น string[]
      if (Array.isArray(e.field)) {
        for (const f of e.field) {
          setError(f as keyof TFields, { type: "server", message: msg });
        }
        continue;
      }

      // field เป็น string เดียว
      if (typeof e.field === "string" && e.field) {
        setError(e.field as keyof TFields, { type: "server", message: msg });
      }
    }
    return;
  }

  // 2) กรณีไม่มี errors array → map จาก status/message
  const msg = data?.message ?? (status ? `HTTP ${status}` : "Unknown error");

  // Conflict ซ้ำชื่อผู้ใช้
  if (status === 409 && /user/i.test(msg)) {
    setError("username" as keyof TFields, { type: "server", message: "Username already exists" });
    return;
  }

  // ไม่ระบุช่อง → ยิงใส่ช่องแรกที่คาดเดาได้ (เช่น username) หรือให้ caller ไป toast เอง
  setError("username" as keyof TFields, { type: "server", message: msg });
}
