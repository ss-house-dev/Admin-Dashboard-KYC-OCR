"use client";
import * as React from "react";

export type KycSseFilters = {
  companyId: string; // *required*
  correlationId?: string;
  email?: string;
  status?: string;
  startDate?: string; // YYYY-MM-DD หรือ ISO
  endDate?: string; // YYYY-MM-DD หรือ ISO
  page?: number;
  limit?: number; // <= 100
  embed?: boolean;
  completedOnly?: boolean; // default=true
  debug?: boolean; // ส่ง 3 event แล้วปิด (ทดสอบ)
};

type Handlers<TMsg = unknown> = {
  onMessage?: (payload: TMsg) => void;
  onEvent?: (eventName: string, payload: unknown) => void;
  onOpen?: () => void;
  onError?: (err: Event) => void;
};

export function useKycRequestsSSE<TMsg = unknown>(
  filters: KycSseFilters | null | undefined,
  handlers: Handlers<TMsg> = {}
) {
  React.useEffect(() => {
    if (!filters?.companyId) return;

    // สร้าง query ไปหา proxy route ของเรา
    const qs = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v === undefined || v === null) return;
      qs.set(k, String(v));
    });

    const url = `/api/admin/kyc/requests/sse?${qs.toString()}`;

    const es = new EventSource(url, { withCredentials: true });

    es.onopen = () => handlers.onOpen?.();

    // อีเวนต์ดีฟอลต์ (ไม่มีชื่อ event)
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data) as TMsg;
        handlers.onMessage?.(data);
      } catch {
        // ข้อมูลไม่ใช่ JSON ก็ข้ามได้
      }
    };

    // รองรับอีเวนต์แบบมีชื่อ (ถ้าแบ็กเอนด์ส่งมา เช่น "init", "update")
    const named = (name: string) => (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        handlers.onEvent?.(name, data);
      } catch {
        handlers.onEvent?.(name, e.data);
      }
    };

    // ตัวอย่างชื่ออีเวนต์ที่มักเจอ (เพิ่ม/ลดได้ตามจริง)
    ["init", "snapshot", "update", "delete", "tick"].forEach((ev) => {
      es.addEventListener(ev, named(ev));
    });

    es.onerror = (err) => {
      handlers.onError?.(err);
      // EventSource จะ auto-reconnect ให้เอง
    };

    return () => es.close();
  }, [
    filters?.companyId,
    filters?.correlationId,
    filters?.email,
    filters?.status,
    filters?.startDate,
    filters?.endDate,
    filters?.page,
    filters?.limit,
    filters?.embed,
    filters?.completedOnly,
    filters?.debug,
  ]);
}
