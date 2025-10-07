import "server-only";
import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import type { JWT } from "next-auth/jwt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const API_BASE = process.env.API_KYC_REQUEST ?? "http://141.11.156.52:3205";

// ✅ พิมพ์ type param ให้ตรง Next 15 App Router
type RouteParams = { params: { id: string } };

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: "id is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  type AccessTokenJWT = JWT & { accessToken?: string };
  const token = await getToken({ req });
  const accessToken = (token as AccessTokenJWT | null)?.accessToken;
  if (!accessToken) {
    return new Response("Unauthorized", { status: 401 });
  }

  const upstream = await fetch(
    `${API_BASE}/kyc/requests/${encodeURIComponent(id)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
      cache: "no-store",
    }
  );

  if (!upstream.ok) {
    return new Response(
      JSON.stringify({ error: "Upstream error", status: upstream.status }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }

  // ✅ โปร่งใส ไม่ปรับโครงสร้าง
  return new Response(upstream.body, {
    headers: { "Content-Type": "application/json" },
  });
}
