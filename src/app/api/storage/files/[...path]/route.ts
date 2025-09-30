import "server-only";
import { NextRequest, NextResponse } from "next/server";

// ปรับเป็น env ก็ได้ถ้าต้องสลับปลายทางในอนาคต
const UPSTREAM_BASE =
  process.env.STORAGE_UPSTREAM_BASE ??
  "http://141.11.156.52:3208/storage/files/";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> } // Next.js 15: params เป็น Promise
) {
  const { path } = await params;
  // path ที่ได้จะเป็น ["68da2b...","face","verify","xxx.jpg"] เพราะ Next decode %2F ให้แล้ว
  const rawPath = path.join("/");

  // เข้ารหัสอีกครั้งสำหรับ upstream ที่ต้องการ %2F
  const encoded = encodeURIComponent(rawPath);

  const upstreamUrl = `${UPSTREAM_BASE.replace(/\/+$/, "")}/${encoded}`;

  try {
    const upstream = await fetch(upstreamUrl, {
      // forward เฉพาะที่จำเป็น
      headers: { accept: "*/*" },
      cache: "no-store",
    });

    // ถ้า upstream ไม่โอเค ก็ส่งสเตตัสกลับไปตรงๆ
    if (!upstream.ok) {
      const text = await upstream.text().catch(() => "");
      return new NextResponse(text || "Upstream error", {
        status: upstream.status,
        headers: { "content-type": upstream.headers.get("content-type") || "text/plain" },
      });
    }

    // สตรีมบอดี้รูปกลับ พร้อม content-type เดิม
    const contentType = upstream.headers.get("content-type") || "application/octet-stream";
    const body = upstream.body; // ReadableStream
    return new NextResponse(body, {
      status: 200,
      headers: {
        "content-type": contentType,
        // ให้ cache ฝั่ง browser สั้นๆ ได้บ้าง (ปรับได้)
        "cache-control": "public, max-age=60",
      },
    });
  } catch {
    return NextResponse.json({ error: "Proxy upstream failed" }, { status: 502 });
  }
}
