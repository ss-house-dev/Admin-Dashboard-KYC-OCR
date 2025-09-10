// src/features/sign-up/services/errorMap.ts
import type { AxiosError } from "axios";
import type { FieldError } from "react-hook-form";
import type { ApiErrorResponse } from "@/shared/types/api";

type SetErrorFn<T> = (name: keyof T, err: FieldError) => void;

/** แปลงชื่อฟิลด์จาก API -> ชื่อฟิลด์ในฟอร์ม */
function mapApiFieldToFormField<T>(field: string): keyof T {
  const f = field.toLowerCase();
  if (f === "username" || f.endsWith(".username")) {
    return "username" as keyof T;
  }
  if (
    f === "companyname" ||
    f === "company.name" ||
    /\bcompany\s*name\b/.test(f) ||
    /\bcompany.*name\b/.test(f)
  ) {
    return "companyName" as keyof T;
  }
  return field as keyof T;
}

/** เดาช่องฟอร์มจากข้อความ message ของ backend */
function inferFieldFromMessage<T>(msg: string): keyof T | undefined {
  const m = msg.toLowerCase();
  if (/\buser(name)?\b/.test(m)) return "username" as keyof T;
  if (
    /\bcompany\s*name\b/.test(m) ||
    /\bcompanyname\b/.test(m) ||
    /\bcompany\.name\b/.test(m) ||
    (m.includes("company") && m.includes("name"))
  ) {
    return "companyName" as keyof T;
  }
  return undefined;
}

export function handleSignUpServerError<
  TFields extends Record<string, unknown>
>(error: AxiosError<ApiErrorResponse>, setError: SetErrorFn<TFields>) {
  const status = error.response?.status;
  const data = error.response?.data;

  // 1) backend ส่ง errors เป็น array
  if (data?.errors?.length) {
    for (const e of data.errors) {
      const msg = e.message ?? "Invalid";

      // field เป็น string[]
      if (Array.isArray(e.field)) {
        for (const f of e.field) {
          setError(mapApiFieldToFormField<TFields>(f), {
            type: "server",
            message: msg,
          });
        }
        continue;
      }

      // field เป็น string เดียว
      if (typeof e.field === "string" && e.field) {
        setError(mapApiFieldToFormField<TFields>(e.field), {
          type: "server",
          message: msg,
        });
      }
    }
    return;
  }

  // 2) ไม่มี errors array → ใช้ status/message
  const msg = data?.message ?? (status ? `HTTP ${status}` : "Unknown error");

  // 400: ผูกข้อความเข้ากับช่องที่ถูกต้อง
  if (status === 400) {
    const field = inferFieldFromMessage<TFields>(msg);
    if (field) {
      setError(field, { type: "server", message: msg });
      return;
    }
    // เดาไม่ได้ → ยิงเข้า username ไว้ก่อน
    setError("username" as keyof TFields, { type: "server", message: msg });
    return;
  }

  // 409: ซ้ำ username
  if (status === 409 && /user/i.test(msg)) {
    setError("username" as keyof TFields, {
      type: "server",
      message: "Username already exists",
    });
    return;
  }

  // อื่น ๆ → ยิงใส่ช่องที่คาดเดาได้
  setError("username" as keyof TFields, { type: "server", message: msg });
}
