import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { isAxiosError } from "axios";
import { fetchDashboardKyc } from "@/features/dashboard-admin/services/api-kyc";

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { companyId, data } = await fetchDashboardKyc(token.accessToken);
    return NextResponse.json({ companyId, data });
  } catch (e: unknown) {
    if (isAxiosError(e)) {
      const status = e.response?.status ?? 502;
      const detail = e.response?.data ?? e.message;
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
