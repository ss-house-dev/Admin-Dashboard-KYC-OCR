import type { AxiosError } from "axios";
import type { FieldValues, Path } from "react-hook-form";

// แม็ปชื่อฟิลด์จาก BE -> ชื่อฟิลด์บนฟอร์มเรา
export function mapServerFieldToForm<T extends FieldValues>(
  rawField?: string | string[]
): Path<T> | null {
  if (!rawField) return null;
  const key = (
    Array.isArray(rawField) ? rawField.join(".") : rawField
  ).toLowerCase();

  // company.*
  if (
    key.endsWith(".contactemail") ||
    key === "companyemail" ||
    key === "email"
  )
    return "companyEmail" as Path<T>;
  if (
    key.endsWith(".contactphone") ||
    key.includes("phone") ||
    key.includes("tel")
  )
    return "companyTel" as Path<T>;
  if (key.endsWith(".name") || key === "companyname")
    return "companyName" as Path<T>;
  if (
    key.includes("business") ||
    key.includes("industry") ||
    key === "businesstype"
  )
    return "businessType" as Path<T>;

  // user / auth
  if (key === "username" || key.endsWith(".username"))
    return "username" as Path<T>;
  if (key === "password" || key.endsWith(".password"))
    return "password" as Path<T>;
  if (key === "confirmpassword" || key.endsWith(".confirmpassword"))
    return "confirmPassword" as Path<T>;

  return null;
}

// ดึงรายการ error ออกมาจาก payload รูปแบบต่าง ๆ
function extractErrorEntries(
  data: any
): Array<{ field?: string | string[]; message: string }> {
  if (!data) return [];
  if (Array.isArray(data.errors)) {
    return data.errors.map((e: any) => ({
      field: e.field ?? e.path,
      message: String(e.message ?? "Invalid"),
    }));
  }
  if (data.errorFields && typeof data.errorFields === "object") {
    return Object.entries<string>(data.errorFields).map(([field, message]) => ({
      field,
      message: String(message ?? "Invalid"),
    }));
  }
  if (Array.isArray(data.details)) {
    return data.details.map((e: any) => ({
      field: e.context?.key,
      message: String(e.message ?? "Invalid"),
    }));
  }
  if (data.message) {
    // 👇 แยกข้อความรวมด้วย comma
    return String(data.message)
      .split(",")
      .map((s: string) => ({ message: s.trim() }))
      .filter((e) => e.message.length > 0);
  }
  return [];
}

export function handleSignUpServerError<T extends FieldValues>(
  err: AxiosError<any>,
  setError: (name: Path<T>, err: { type: string; message: string }) => void
) {
  const status = err.response?.status;
  const data = err.response?.data;

  const entries = extractErrorEntries(data);
  let assigned = false;

  // เคส 409/ซ้ำ: เดาช่องจากข้อความ
  if (status === 409 && entries.length === 0) {
    const msg = String(data?.message ?? "ข้อมูลซ้ำ");
    if (/user\s*name|username/i.test(msg)) {
      setError("username" as Path<T>, {
        type: "server",
        message: "Username นี้ถูกใช้แล้ว",
      });
      return;
    }
    if (/email/i.test(msg)) {
      setError("companyEmail" as Path<T>, {
        type: "server",
        message: "อีเมลนี้ถูกใช้แล้ว",
      });
      return;
    }
    if (/phone|tel/i.test(msg)) {
      setError("companyTel" as Path<T>, {
        type: "server",
        message: "เบอร์นี้ถูกใช้แล้ว",
      });
      return;
    }
    // ไม่รู้ฟิลด์แน่ชัด
    setError("username" as Path<T>, { type: "server", message: msg });
    return;
  }

  // วนตั้ง error ตามรายการที่ได้มา
  for (const e of entries) {
    const field = mapServerFieldToForm<T>(e.field);
    if (field) {
      setError(field, { type: "server", message: e.message });
      assigned = true;
    }
  }

  // ถ้าไม่มีฟิลด์เฉพาะเจาะจง ให้พยายามเดาจากข้อความรวม
  if (!assigned && entries.length > 0) {
    const msg = entries[0].message;
    if (/username/i.test(msg)) {
      setError("username" as Path<T>, { type: "server", message: msg });
      return;
    }
    if (/email/i.test(msg)) {
      setError("companyEmail" as Path<T>, { type: "server", message: msg });
      return;
    }
    if (/phone|tel/i.test(msg)) {
      setError("companyTel" as Path<T>, { type: "server", message: msg });
      return;
    }
    if (/company.*name/i.test(msg)) {
      setError("companyName" as Path<T>, { type: "server", message: msg });
      return;
    }
    if (/business|industry/i.test(msg)) {
      setError("businessType" as Path<T>, { type: "server", message: msg });
      return;
    }
    if (/password/i.test(msg)) {
      // ถ้าเป็นเรื่องความซับซ้อน ให้ใส่ที่ password; ถ้า mismatch ให้ใส่ confirmPassword
      if (/confirm|match/i.test(msg)) {
        setError("confirmPassword" as Path<T>, {
          type: "server",
          message: msg,
        });
      } else {
        setError("password" as Path<T>, { type: "server", message: msg });
      }
      return;
    }
  }

  // ไม่ได้อะไรเลย → แจ้งรวม (แจ้งเตือนกลาง)
  if (!assigned && entries.length === 0) {
    alert(String(data?.message ?? "สมัครไม่สำเร็จ"));
  }
}
