import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import axios from "axios";

const API_BASE_INTERNAL =
  process.env.API_BASE_INTERNAL ?? "http://141.11.156.52:3203";

const API_KYC_REQUEST =
  process.env.API_KYC_REQUEST ?? "http://141.11.156.52:3205";

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // ขอ companyId
    const resMe = await fetch(`${API_BASE_INTERNAL}/auth/me`, {
      headers: { Authorization: `Bearer ${token.accessToken}` },
      cache: "no-store",
    });
    if (!resMe.ok) {
      const text = await resMe.text();
      return NextResponse.json(
        { error: "Failed to fetch companyId", detail: text },
        { status: resMe.status }
      );
    }
    const { companyId } = await resMe.json();

    // ดึงรายการ KYC 
    // กำหนด path ให้ดึงrequestที่ยังทำkycไม่สำเร็จมา (ต้องแก้)
    const resKyc = await fetch(
      `${API_KYC_REQUEST}/kyc/requests?companyId=${companyId}&completedOnly=false&embed=true`,
      {
        headers: { Authorization: `Bearer ${token.accessToken}` },
        cache: "no-store",
      }
    );
    if (!resKyc.ok) {
      const text = await resKyc.text();
      return NextResponse.json(
        { error: "Failed to fetch company data", detail: text },
        { status: resKyc.status }
      );
    }
    const kycData = await resKyc.json();

    return NextResponse.json({ companyId, data: kycData });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Unexpected error", detail: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}
