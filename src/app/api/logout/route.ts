import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { JWT } from "next-auth/jwt";

type TokenPayload = JWT & {
  accessToken?: string;
  token?: string;
  jwt?: string;
};

export async function POST(req: NextRequest) {
  const token = (await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  })) as TokenPayload | null;

  const accessToken =
    token?.accessToken ?? token?.token ?? token?.jwt ?? "";

  const API_BASE =
    process.env.API_BASE_INTERNAL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "http://141.11.156.52:3203";

  try {
    if (accessToken) {
      await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        headers: {
          accept: "*/*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ accessToken }),
      });
    }
  } catch {
    // backend ล่มก็ไม่เป็นไร เราแค่คืน ok: true
  }

  return NextResponse.json({ ok: true });
}
