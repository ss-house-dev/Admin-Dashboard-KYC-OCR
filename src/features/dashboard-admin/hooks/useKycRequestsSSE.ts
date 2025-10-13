"use client";
import * as React from "react";

export type KycSseFilters = {
  companyId: string; // *required*
  debug?: boolean; // เปิด log เฉพาะตอนดีบัก
  // ตัวเลือกอื่น ๆ (คง type ไว้เพื่อเข้ากันย้อนหลัง)
  correlationId?: string;
  email?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  embed?: boolean;
  completedOnly?: boolean; // ✅ ค่าเริ่มต้น = true (ฟังเฉพาะ completed)
};

type Handlers<TMsg = unknown> = {
  onMessage?: (payload: TMsg) => void;
  onEvent?: (eventName: string, payload: unknown) => void;
  onOpen?: () => void;
  onError?: (err: Event) => void;
};

/** Payload ที่ normalize แล้ว: ดึง id/correlationId/ts ออกมา + เก็บ raw ไว้ */
export type SseNormalized = {
  event?: string;
  id?: string;
  correlationId?: string;
  ts?: string;
  raw: unknown;
};

// ---------- helpers ----------
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}
function getString(
  obj: Record<string, unknown>,
  key: string
): string | undefined {
  const v = obj[key];
  return typeof v === "string" && v.trim() !== "" ? v : undefined;
}
/** ดึงค่า string ได้ทั้งจาก root และ data.{key} */
function extractStringDeep(obj: unknown, key: string): string | undefined {
  if (!isRecord(obj)) return undefined;
  const root = getString(obj, key);
  if (root) return root;
  const data = obj["data"];
  if (isRecord(data)) {
    const nested = getString(data, key);
    if (nested) return nested;
  }
  return undefined;
}
/** normalize payload: ยก correlationId/id/ts ข้างนอก พร้อมแนบ raw */
function normalizePayload(raw: unknown, eventName?: string): SseNormalized {
  const id = extractStringDeep(raw, "id");
  const correlationId = extractStringDeep(raw, "correlationId");
  const ts = extractStringDeep(raw, "ts");
  return { event: eventName, id, correlationId, ts, raw };
}
// ---------------------------------

export function useKycRequestsSSE<TMsg = unknown>(
  filters: KycSseFilters | null | undefined,
  handlers: Handlers<TMsg> = {}
) {
  // เก็บ handlers ปัจจุบันไว้ใน ref เพื่อตัดออกจาก dependency ของ useEffect
  const handlersRef = React.useRef(handlers);
  React.useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  // debug flag (ไม่ทำให้ reconnect)
  const debugRef = React.useRef<boolean>(Boolean(filters?.debug));
  React.useEffect(() => {
    debugRef.current = Boolean(filters?.debug);
  }, [filters?.debug]);

  React.useEffect(() => {
    if (!filters?.companyId) return;

    // ✅ ค่าเริ่มต้น: ฟังเฉพาะ completed (เว้นแต่ส่ง completedOnly=false)
    const onlyCompleted = filters.completedOnly !== false;

    // ต่อ proxy ด้วยค่าที่จำเป็นจริง ๆ
    const qs = new URLSearchParams({ companyId: filters.companyId });
    if (onlyCompleted) qs.set("completedOnly", "true"); // เผื่อ proxy/BE รองรับ
    if (debugRef.current) qs.set("debug", "true");

    const url = `/api/admin/kyc/requests/sse?${qs.toString()}`;
    const es = new EventSource(url, { withCredentials: true });

    es.onopen = () => {
      if (debugRef.current) console.info("[SSE] open", { url, onlyCompleted });
      handlersRef.current.onOpen?.();
    };

    // อีเวนต์ดีฟอลต์ (ไม่มีชื่อ)
    // หากตั้ง onlyCompleted = true ⇒ เพิกเฉยข้อความ default เพื่อลดสัญญาณรบกวน
    es.onmessage = (e: MessageEvent<string>) => {
      if (onlyCompleted) {
        if (debugRef.current) {
          const p = e.data.length > 120 ? e.data.slice(0, 120) + "…" : e.data;
          console.info("[SSE] message ignored (onlyCompleted)", p);
        }
        return;
      }
      let parsed: unknown = e.data;
      try {
        parsed = JSON.parse(e.data) as unknown;
      } catch {
        /* keep as string */
      }
      const enriched = normalizePayload(parsed);
      if (debugRef.current) {
        const preview =
          typeof e.data === "string"
            ? e.data.slice(0, 200) + (e.data.length > 200 ? "…" : "")
            : String(e.data);
        console.info("[SSE] message", {
          preview,
          id: enriched.id,
          correlationId: enriched.correlationId,
        });
      }
      handlersRef.current.onMessage?.(enriched as unknown as TMsg);
    };

    // อีเวนต์แบบมีชื่อ
    const EVENT_NAMES: ReadonlyArray<string> = onlyCompleted
      ? ["completed"]
      : [
          "initial",
          "created",
          "update",
          "updated",
          "completed",
          "init",
          "snapshot",
          "delete",
          "tick",
        ];

    const named = (name: string) => (e: MessageEvent<string>) => {
      // ถ้าไม่ใช่ completed และเปิด onlyCompleted ก็ข้าม
      if (onlyCompleted && name !== "completed") {
        if (debugRef.current)
          console.info("[SSE] event ignored (onlyCompleted)", name);
        return;
      }
      let parsed: unknown = e.data;
      try {
        parsed = JSON.parse(e.data) as unknown;
      } catch {
        /* keep as string */
      }
      const enriched = normalizePayload(parsed, name);
      if (debugRef.current) {
        const raw = typeof e.data === "string" ? e.data : String(e.data);
        const preview = raw.length > 200 ? `${raw.slice(0, 200)}…` : raw;
        console.info("[SSE] event:", name, {
          preview,
          id: enriched.id,
          correlationId: enriched.correlationId,
        });
      }
      handlersRef.current.onEvent?.(name, enriched);
    };

    EVENT_NAMES.forEach((ev) => es.addEventListener(ev, named(ev)));

    es.onerror = (err) => {
      if (debugRef.current) console.warn("[SSE] error (auto-reconnect)", err);
      handlersRef.current.onError?.(err);
      // EventSource จะพยายาม reconnect เอง
    };

    return () => {
      if (debugRef.current) console.info("[SSE] close");
      es.close();
    };

    // เชื่อมใหม่เฉพาะเมื่อ companyId เปลี่ยน
  }, [filters?.companyId, filters?.completedOnly]);
}
