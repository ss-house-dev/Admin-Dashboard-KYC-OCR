// src/features/sign-up/services/errorMap.ts
import type { AxiosError } from "axios";
import type { FieldError } from "react-hook-form";
import type { ApiErrorResponse } from "@/shared/types/api";

type SetErrorFn<T> = (name: keyof T, err: FieldError) => void;

type ApiErrorItem = { field?: string | string[]; message?: string };
function isApiErrorArray(v: unknown): v is ApiErrorItem[] {
  return Array.isArray(v) && v.every(it => typeof it === "object" && it !== null);
}

/** แปลงชื่อฟิลด์จาก API -> ชื่อฟิลด์ในฟอร์ม */
function mapApiFieldToFormField<T>(field: string): keyof T {
  const f = field.toLowerCase();

  // --- Company Tel / Phone ---
  if (
    f === "contactphone" ||
    f === "companyphone" ||
    f === "companytel" ||
    f === "company.telephone" ||
    f === "company.phone" ||
    /company.*(phone|tel|telephone|mobile)/.test(f) ||
    /(contact|contact_)?phone/.test(f)
  ) {
    return "companyTel" as keyof T; // ชื่อฟิลด์ในฟอร์ม: Company Tel
  }

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

  // จับเคส company phone
  if (
    m.includes("company phone") ||
    (/company/.test(m) && /(phone|tel|telephone)/.test(m)) ||
    /phone.*already exists/.test(m)
  ) {
    return "companyTel" as keyof T;
  }

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
  const data = error.response?.data as unknown;

  // 1) backend ส่ง errors เป็น array
  if (data && typeof data === "object") {
    const maybeErrors = (data as { errors?: unknown }).errors;
    if (isApiErrorArray(maybeErrors)) {
      for (const e of maybeErrors) {
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
  }

  // 1.5) backend ส่งเป็น object key:value เช่น { contactPhone: "Company phone already exists" }
  if (status === 400 && data && typeof data === "object" && !Array.isArray(data)) {
    let matched = false;
    for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
      if (v == null) continue;
      const msg = Array.isArray(v) ? String(v[0]) : String(v);
      const field = mapApiFieldToFormField<TFields>(k);
      setError(field, { type: "server", message: msg });
      matched = true;
    }
    if (matched) return;
  }

  // 2) ไม่มี errors array → ใช้ status/message
  const serverMessage =
    data && typeof data === "object" && "message" in (data as Record<string, unknown>)
      ? (data as { message?: unknown }).message
      : undefined;
  const msg = serverMessage ?? (status ? `HTTP ${status}` : "Unknown error");

  // 400: ผูกข้อความเข้ากับช่องที่ถูกต้อง
  if (status === 400) {
    const field = typeof msg === "string" ? inferFieldFromMessage<TFields>(msg) : undefined;
    if (field) {
      setError(field, { type: "server", message: String(msg) });
      return;
    }
    // เดาไม่ได้ → ยิงเข้า username ไว้ก่อน (กันตก)
    setError("username" as keyof TFields, { type: "server", message: String(msg) });
    return;
  }

  // 409: ซ้ำ username
  if (status === 409 && typeof msg === "string" && /user/i.test(msg)) {
    setError("username" as keyof TFields, {
      type: "server",
      message: "Username already exists",
    });
    return;
  }

  // อื่น ๆ → ยิงใส่ช่องที่คาดเดาได้
  setError("username" as keyof TFields, { type: "server", message: String(msg) });
}
