import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { JWT } from "next-auth/jwt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const API_KYC_REQUEST =
  process.env.API_KYC_REQUEST ?? "http://141.11.156.52:3205";

/* ---------- helpers: no any ---------- */
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}
function readItemsArray(obj: unknown): readonly unknown[] {
  if (!isRecord(obj)) return [];
  const data = obj["data"];
  if (!isRecord(data)) return [];
  const items = data["items"];
  return Array.isArray(items) ? items : [];
}
function pickItemById(items: readonly unknown[], id: string): unknown | null {
  for (const it of items) {
    if (isRecord(it) && typeof it["id"] === "string" && it["id"] === id) {
      return it;
    }
  }
  return null;
}
/* ------------------------------------ */

/**
 * ⚠️ Next.js 15: context.params เป็น Promise → ต้อง await
 */
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  // ใช้สำหรับ fallback และ debug
  const companyId = req.nextUrl.searchParams.get("companyId") ?? undefined;
  const debug =
    req.nextUrl.searchParams.get("debug") === "1" ||
    req.nextUrl.searchParams.get("debug") === "true";

  type AccessTokenJWT = JWT & { accessToken?: string };
  const jwt = (await getToken({ req })) as AccessTokenJWT | null;
  const accessToken = jwt?.accessToken;
  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 1) พยายามเรียก detail ตรง ๆ: GET /kyc/requests/{id}
  const detailUrl = `${API_KYC_REQUEST}/kyc/requests/${encodeURIComponent(id)}`;
  let tryDetail: Response | null = null;
  try {
    tryDetail = await fetch(detailUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
        "accept-encoding": "identity",
      },
      cache: "no-store",
      signal: req.signal,
    });
  } catch {
    tryDetail = null;
  }

  if (tryDetail && tryDetail.ok && tryDetail.body) {
    const contentType =
      tryDetail.headers.get("content-type") ?? "application/json";
    if (debug) console.info("[KYC detail] using /{id}");
    const headers = new Headers({
      "content-type": contentType,
      "Cache-Control": "no-store",
      "X-KYC-Detail-Mode": "detail",
    });
    return new NextResponse(tryDetail.body, { status: 200, headers });
  }

  // 2) ถ้าไม่มี /{id} หรือ error → fallback หาใน list (ต้องมี companyId)
  if (!companyId) {
    const status = tryDetail?.status ?? 404;
    return NextResponse.json(
      {
        error:
          "Detail endpoint unavailable; provide companyId for list fallback.",
      },
      { status }
    );
  }

  // fallback: ไล่ page ทีละชุดจนเจอ id
  const limit = 100;
  let page = 1;

  for (;;) {
    const listUrl = new URL(`${API_KYC_REQUEST}/kyc/requests`);
    listUrl.searchParams.set("companyId", companyId);
    listUrl.searchParams.set("limit", String(limit));
    listUrl.searchParams.set("page", String(page));
    listUrl.searchParams.set("embed", "true");

    let listResp: Response | null = null;
    try {
      listResp = await fetch(listUrl.toString(), {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
          "accept-encoding": "identity",
        },
        cache: "no-store",
        signal: req.signal,
      });
    } catch {
      listResp = null;
    }

    if (!listResp || !listResp.ok) {
      const status = listResp?.status ?? 502;
      const text = listResp ? await listResp.text().catch(() => "") : "";
      return new NextResponse(text || "Upstream list error", {
        status,
        headers: {
          "content-type":
            listResp?.headers.get("content-type") ?? "text/plain",
        },
      });
    }

    const json = (await listResp.json().catch(() => null)) as unknown;
    const items = readItemsArray(json);
    const found = pickItemById(items, id);
    if (found) {
      if (debug) console.info("[KYC detail] fallback hit on page", page);
      return NextResponse.json(found, {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
          "X-KYC-Detail-Mode": `fallback:page=${page}`,
        },
      });
    }

    // หมดหน้าแล้วหยุด
    if (items.length < limit) break;

    page += 1;
    // safety cap กันลูปเกินเหตุ
    if (page > 20) break;
  }

  if (debug) console.warn("[KYC detail] not found via fallback");
  return NextResponse.json(
    { error: "Not found" },
    { status: 404, headers: { "X-KYC-Detail-Mode": "miss" } }
  );
}
