import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export const runtime = "nodejs"; // ต้องเป็น Node เพื่อ stream

const API_KYC_REQUEST =
  process.env.API_KYC_REQUEST ?? "http://141.11.156.52:3205";

export async function GET(req: NextRequest) {
  // ✅ ดึง accessToken จาก next-auth (cookie ฝั่ง browser จะติดมากับ req เอง)
  const jwt = (await getToken({ req })) as { accessToken?: string } | null;
  const accessToken = jwt?.accessToken;
  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ✅ ส่ง query ทั้งหมดต่อไปยัง upstream (companyId, status, page, ... )
  const upstreamUrl = new URL("/kyc/requests/sse", API_KYC_REQUEST);
  const inQs = req.nextUrl.searchParams;
  inQs.forEach((val, key) => upstreamUrl.searchParams.set(key, val));

  // ✅ ยิงไป upstream พร้อม Authorization
  let upstream: Response;
  try {
    upstream = await fetch(upstreamUrl, {
      method: "GET",
      headers: {
        accept: "text/event-stream",
        authorization: `Bearer ${accessToken}`,
      },
      // ให้ยกเลิกตาม client
      signal: req.signal,
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { error: "Upstream connection failed" },
      { status: 502 }
    );
  }

  if (!upstream.ok || !upstream.body) {
    // โปรยข้อความ error จาก upstream กลับให้เห็นชัด
    const text = await upstream.text().catch(() => "");
    return new NextResponse(text || "Upstream error", {
      status: upstream.status || 502,
      headers: {
        "content-type": upstream.headers.get("content-type") ?? "text/plain",
      },
    });
  }

  // ✅ pipe สตรีม upstream → client แบบดิบ ๆ
  const stream = new ReadableStream({
    async start(controller) {
      const reader = upstream.body!.getReader();
      const encoder = new TextEncoder();

      // ส่งคอมเมนต์บอกว่า proxy พร้อมแล้ว (optional)
      controller.enqueue(encoder.encode(`: proxy connected\n\n`));

      const pump = async () => {
        try {
          for (;;) {
            const { value, done } = await reader.read();
            if (done) break;
            controller.enqueue(value);
          }
        } catch {
          // เงียบ ๆ เวลาโดน abort
        } finally {
          controller.close();
        }
      };

      // ถ้าฝั่ง client ปิด ให้ยกเลิก
      req.signal.addEventListener("abort", () => {
        try {
          reader.cancel();
        } catch {}
      });

      pump();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // ช่วยปิดบัฟเฟอร์ถ้ามี nginx
    },
  });
}
