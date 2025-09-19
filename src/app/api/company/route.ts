import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import axios, { isAxiosError } from "axios";

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
    const meRes = await axios.get<{ companyId: string }>(
      `${API_BASE_INTERNAL}/auth/me`,
      {
        headers: {
          Authorization: `Bearer ${token.accessToken}`,
          // ถ้าต้องการกัน cache ที่ proxy บางตัว
          "Cache-Control": "no-cache",
        },
      }
    );
    const { companyId } = meRes.data;

    // ดึงรายการ KYC (ยังไม่สำเร็จ)
    const kycRes = await axios.get(
      `${API_KYC_REQUEST}/kyc/requests`,
      {
        headers: {
          Authorization: `Bearer ${token.accessToken}`,
          "Cache-Control": "no-cache",
        },
        params: {
          companyId,
          completedOnly: false,
          embed: true,
        },
      }
    );

    return NextResponse.json({ companyId, data: kycRes.data });
  } catch (e: unknown) {
    if (isAxiosError(e)) {
      const status = e.response?.status ?? 502;
      // พยายามส่งข้อมูล error จากปลายทางกลับไปเพื่อ debug ได้
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
