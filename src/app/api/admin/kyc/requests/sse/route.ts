import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { JWT } from "next-auth/jwt";

export const runtime = "nodejs"; // ต้องเป็น Node เพื่อ stream
export const dynamic = "force-dynamic"; // กัน cache/ISR
export const revalidate = 0; // ปิด revalidate

const API_KYC_REQUEST =
  process.env.API_KYC_REQUEST ?? "http://141.11.156.52:3205";

export async function GET(req: NextRequest) {
  // ✅ validate & log พารามิเตอร์
  const companyId = req.nextUrl.searchParams.get("companyId");
  if (!companyId) {
    // console.warn("[SSE Proxy] missing companyId");
    return NextResponse.json({ error: "companyId is required" }, { status: 400 });
  }

  // ✅ ดึง token (เลี่ยง TS2344 ด้วยการขยาย type)
  type AccessTokenJWT = JWT & { accessToken?: string };
  const jwt = (await getToken({ req })) as AccessTokenJWT | null;
  const accessToken = jwt?.accessToken;
  if (!accessToken) {
    // console.warn("[SSE Proxy] Unauthorized (no accessToken)");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ✅ whitelist query เฉพาะที่ upstream รองรับจริง ๆ
  const upstreamUrl = new URL("/kyc/requests/sse", API_KYC_REQUEST);
  const ALLOWED = new Set<string>(["companyId"]);
  req.nextUrl.searchParams.forEach((val, key) => {
    if (ALLOWED.has(key)) upstreamUrl.searchParams.set(key, val);
  });

  // ✅ forward Last-Event-ID (เผื่อ upstream ใช้ resume)
  const lastEventId = req.headers.get("last-event-id") ?? undefined;

  // console.info("[SSE Proxy] connect", {
  //   companyId,
  //   upstream: upstreamUrl.toString(),
  //   hasLastEventId: Boolean(lastEventId),
  // });

  let upstream: Response;
  try {
    upstream = await fetch(upstreamUrl.toString(), {
      method: "GET",
      headers: {
        accept: "text/event-stream",
        authorization: `Bearer ${accessToken}`,
        // ป้องกัน proxy/gzip ทำให้ stream ค้าง
        "accept-encoding": "identity",
        connection: "keep-alive",
        ...(lastEventId ? { "Last-Event-ID": lastEventId } : {}),
      },
      signal: req.signal,
      cache: "no-store",
    });
  } catch (e) {
    // console.error("[SSE Proxy] Upstream connection failed", e);
    return NextResponse.json(
      { error: "Upstream connection failed" },
      { status: 502 }
    );
  }

  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text().catch(() => "");
    // console.error("[SSE Proxy] Upstream error", {
    //   status: upstream.status,
    //   contentType: upstream.headers.get("content-type"),
    //   bodyPreview: text.slice(0, 300),
    // });
    return new NextResponse(text || "Upstream error", {
      status: upstream.status || 502,
      headers: {
        "content-type": upstream.headers.get("content-type") ?? "text/plain",
      },
    });
  }

  // console.info("[SSE Proxy] upstream connected", {
  //   status: upstream.status,
  //   contentType: upstream.headers.get("content-type"),
  // });

  const upstreamBody = upstream.body as ReadableStream<Uint8Array>;

  // ✅ tap logger สำหรับตรวจจับเฟรม event/data จาก upstream โดยไม่บล็อกสตรีม
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const reader: ReadableStreamDefaultReader<Uint8Array> = upstreamBody.getReader();
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();

      // buffer สำหรับ parse บรรทัด
      let partial = "";
      let currentEvent: string | null = null;
      let dataLines: string[] = [];

      // ส่งคอมเมนต์เปิดทาง
      controller.enqueue(encoder.encode(`: proxy connected\n\n`));
      // console.info("[SSE Proxy] piping start");

      // heartbeat กัน timeout
      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch {
          // ถ้า client ปิดไปแล้ว enqueue จะ error — cleanup ตอน finally แทน
        }
      }, 25000);

      const onAbort = () => {
        // console.warn("[SSE Proxy] client aborted");
        clearInterval(keepAlive);
        try {
          reader.cancel();
        } catch {}
        try {
          controller.close();
        } catch {}
      };
      req.signal.addEventListener("abort", onAbort);

      const flushParsed = () => {
        if (dataLines.length > 0) {
          const payload = dataLines.join("\n");
          // พิมพ์พรีวิวเพื่อไม่ให้ log ยาวเกิน
          const preview = payload.length > 200 ? payload.slice(0, 200) + "…" : payload;
          // console.info("[SSE Proxy] recv event", {
          //   event: currentEvent ?? "message",
          //   size: payload.length,
          //   preview,
          // });
          // reset state
          currentEvent = null;
          dataLines = [];
        }
      };

      (async function pump() {
        try {
          for (;;) {
            const { value, done } = await reader.read();
            if (done) break;

            if (value) {
              // forward ให้ client ก่อน (ลด latency)
              controller.enqueue(value);

              // แอบ decode เพื่อทำ log เฉย ๆ (ไม่กระทบการส่งจริง)
              try {
                const text = decoder.decode(value, { stream: true });
                partial += text;
                const lines = partial.split(/\r?\n/);
                partial = lines.pop() ?? "";

                for (const line of lines) {
                  if (line.startsWith("event:")) {
                    currentEvent = line.slice(6).trim() || null;
                  } else if (line.startsWith("data:")) {
                    dataLines.push(line.slice(5));
                  } else if (line === "") {
                    // เส้นว่าง = จบเฟรมหนึ่ง
                    flushParsed();
                  } else {
                    // ฟิลด์อื่น ๆ ของ SSE เช่น id:, retry: — ข้ามการ log
                  }
                }
              } catch {
                // ถ้า decode log ล้มเหลว ไม่ต้องทำอะไรต่อ
              }
            }
          }
        } catch (e) {
          // console.warn("[SSE Proxy] pump error/closed", e);
        } finally {
          // flush กรณีจบแบบไม่มีบรรทัดว่างตามสเปค
          if (partial || dataLines.length) {
            try { flushParsed(); } catch {}
          }
          clearInterval(keepAlive);
          try {
            controller.close();
          } catch {}
          req.signal.removeEventListener("abort", onAbort);
          // console.info("[SSE Proxy] piping closed");
        }
      })();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
