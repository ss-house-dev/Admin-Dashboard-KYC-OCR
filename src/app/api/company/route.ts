import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { isAxiosError } from "axios";
import { fetchDashboardKyc } from "@/features/dashboard-admin/services/api-kyc";

function toStartOfDayZ(dateStr?: string | null) {
  if (!dateStr) return undefined;
  const d = dateStr.slice(0, 10);
  return `${d}T00:00:00Z`;
}
function toEndOfDayZ(dateStr?: string | null) {
  if (!dateStr) return undefined;
  const d = dateStr.slice(0, 10);
  return `${d}T23:59:59Z`;
}

function isEmail(s: string) {
  return /\S+@\S+\.\S+/.test(s);
}
function looksLikeTransactionId(s: string) {
  return /^\d{1,10}$/.test(s);
}

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sp = new URL(req.url).searchParams;
  const limit = Number(sp.get("limit") ?? "100");
  const page = Number(sp.get("page") ?? "1");

  const statusRaw = sp.get("status");
  const startRaw = sp.get("startDate");
  const endRaw = sp.get("endDate");

  const status =
    statusRaw && statusRaw.toLowerCase() !== "all" ? statusRaw : undefined;
  const startDate = toStartOfDayZ(startRaw ?? undefined);
  const endDate = toEndOfDayZ(endRaw ?? undefined);

  // ตรวจสอบว่ามีการระบุ field เฉพาะหรือไม่
  let correlationId = sp.get("correlationId") ?? undefined;
  let email = sp.get("email") ?? undefined;
  let firstNameThai = sp.get("firstNameThai") ?? undefined;
  let lastNameThai = sp.get("lastNameThai") ?? undefined;

  // ถ้าไม่มีการระบุ field เฉพาะ แต่มี q → ใช้ logic เดิมสำหรับ backward compatibility
  const q = (sp.get("q") ?? "").trim();
  const hasExplicitField =
    (correlationId && correlationId.length > 0) ||
    (email && email.length > 0) ||
    (firstNameThai && firstNameThai.length > 0) ||
    (lastNameThai && lastNameThai.length > 0);

  if (!hasExplicitField && q) {
    console.log("Using auto-detection for search query:", q);
    if (isEmail(q)) {
      email = q;
    } else if (looksLikeTransactionId(q)) {
      correlationId = q;
    } else {
      // สำหรับชื่อ: แยกคำแรกเป็น firstNameThai และที่เหลือเป็น lastNameThai
      const parts = q.split(/\s+/).filter(Boolean);
      if (parts.length === 1) {
        firstNameThai = parts[0];
      } else {
        firstNameThai = parts[0];
        lastNameThai = parts.slice(1).join(" ");
      }
    }
  } else {
    console.log("Using explicit search fields:", {
      correlationId,
      email,
      firstNameThai,
      lastNameThai,
    });
  }

  try {
    const { companyId, data } = await fetchDashboardKyc(token.accessToken, {
      limit,
      page,
      status,
      startDate,
      endDate,
      correlationId,
      email,
      firstNameThai,
      lastNameThai,
    });

    console.log("API Response:", {
      companyId,
      totalItems: data?.total,
      returnedItems: data?.items?.length,
      searchParams: { correlationId, email, firstNameThai, lastNameThai },
    });

    return NextResponse.json({ companyId, data });
  } catch (e: unknown) {
    console.error("API Error:", e);
    if (isAxiosError(e)) {
      const status = e.response?.status ?? 502;
      const detail = e.response?.data ?? e.message;

      if (status === 401) {
        // ถ้าเป็น Unauthorized → ส่ง 401 กลับไปให้ client
        return NextResponse.json(
          { error: "Unauthorized", detail },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { error: "Upstream request failed", detail },
        { status }
      );
    }
    return NextResponse.json(
      { error: "Unexpected error", detail: String(e) },
      { status: 500 }
    );
  }
}
