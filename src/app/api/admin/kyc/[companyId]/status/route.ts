import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

type ApiStatus =
  | "approved"
  | "rejected"
  | "approved override"
  | "rejected override";
type PatchBody = { _id: string; status: ApiStatus };

const API_KYC_REQUEST =
  process.env.API_KYC_REQUEST ?? "http://141.11.156.52:3205";

export async function PATCH(
  req: NextRequest,
  ctx: { params: { companyId: string } }
) {
  const { companyId } = ctx.params;

  let body: PatchBody | null = null;
  try {
    body = (await req.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body?._id || !body.status) {
    return NextResponse.json(
      { error: "Missing _id or status" },
      { status: 400 }
    );
  }

  // ดึง token จาก NextAuth ฝั่ง server (ไม่โชว์ให้ client)
  const jwt = (await getToken({ req })) as { accessToken?: string } | null;
  const accessToken = jwt?.accessToken;
  if (!accessToken) {
    return NextResponse.json(
      { error: "Missing Authorization token" },
      { status: 401 }
    );
  }

  const upstreamUrl = `${API_KYC_REQUEST}/kyc/requests/${encodeURIComponent(
    companyId
  )}`;

  try {
    const upstream = await fetch(upstreamUrl, {
      method: "PATCH",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ _id: body._id, status: body.status }),
      cache: "no-store",
    });

    const text = await upstream.text();
    return new NextResponse(text, {
      status: upstream.status,
      headers: {
        "content-type":
          upstream.headers.get("content-type") ?? "application/json",
      },
    });
  } catch (e) {
    return NextResponse.json({ error: "Upstream error" }, { status: 502 });
  }
}
