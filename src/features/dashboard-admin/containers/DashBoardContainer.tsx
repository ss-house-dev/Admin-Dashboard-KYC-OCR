"use client";

import * as React from "react";
import { toYmd } from "../utils/datetime";
import type { KycRequestApi, CompanyAllData } from "../types/kyc";
import { useKycData } from "../hooks/useKycData";
import { columns } from "../components/column";
import { DataTable } from "../components/DataTable";
import { SearchView } from "../components/SearchView";
import { FilterView } from "../components/FilterView";
import DetailView from "../components/DetailView";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorView } from "@/components/ErrorView";
import { signOut } from "next-auth/react";
import { isAxiosError } from "axios";
import { useKycRequestsSSE } from "../hooks/useKycRequestsSSE";

// ------- helpers (ไม่มี any) -------
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}
function getStringProp(
  obj: Record<string, unknown>,
  key: string
): string | undefined {
  const v = obj[key];
  return typeof v === "string" && v.trim() !== "" ? v : undefined;
}
/** เดิม: ดึง id */
function extractKycId(payload: unknown): string | undefined {
  if (!isRecord(payload)) return undefined;
  const direct = getStringProp(payload, "id");
  if (direct) return direct;
  const data = payload["data"];
  if (isRecord(data)) {
    const nested = getStringProp(data, "id");
    if (nested) return nested;
  }
  return undefined;
}
/** ใหม่: ดึง correlationId (หลัก) */
function extractCorrelationId(payload: unknown): string | undefined {
  if (!isRecord(payload)) return undefined;
  const direct = getStringProp(payload, "correlationId");
  if (direct) return direct;
  const data = payload["data"];
  if (isRecord(data)) {
    const nested = getStringProp(data, "correlationId");
    if (nested) return nested;
  }
  return undefined;
}
// -----------------------------------

export default function DashBoardContainer() {
  // ===== Hydration guard: กัน SSR/Client คิดค่าไม่ตรงกัน (เช่น Date/timezone) =====
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
    console.info("[HYDRATE] client mounted");
  }, []);

  const {
    isLoading,
    error,
    draftFilters,
    setDraftFilters,
    apply,
    clearAll,
    items,
    rawData,
    pagination,
    setPagination,
    fetchData,
    appliedFilters,
  } = useKycData();

  // --- Begin: SSE live updates (ไม่เปลี่ยน UI) ---
  const refreshLockRef = React.useRef<number | null>(null);
  const safeRefresh = React.useCallback(() => {
    // กันยิงถี่: รีเฟรชได้ทุก ~500ms
    if (refreshLockRef.current) return;
    refreshLockRef.current = window.setTimeout(() => {
      if (refreshLockRef.current) window.clearTimeout(refreshLockRef.current);
      refreshLockRef.current = null;
    }, 500);
    console.debug("[SSE] safeRefresh(): call fetchData()");
    fetchData({ sseBump: Date.now() }); // ดึงข้อมูลด้วยตัวกรองเดิมจาก hook
  }, [fetchData]);

  // 1) จาก appliedFilters.companyId (ถ้ามี) → 2) จาก ENV → 3) จากรายการแรกใน rawData
  const companyIdForSSE: string | undefined = React.useMemo(() => {
    if (appliedFilters && "companyId" in appliedFilters) {
      const v = (appliedFilters as Record<string, unknown>)["companyId"];
      if (typeof v === "string" && v.trim() !== "") return v;
    }
    if (
      typeof process.env.NEXT_PUBLIC_COMPANY_ID === "string" &&
      process.env.NEXT_PUBLIC_COMPANY_ID.trim() !== ""
    ) {
      return process.env.NEXT_PUBLIC_COMPANY_ID;
    }
    const v = rawData?.data?.items?.[0]?.companyId;
    if (typeof v === "string" && v.trim() !== "") return v;
    return undefined;
  }, [appliedFilters, rawData?.data?.items]);

  const statusParam =
    appliedFilters?.status && appliedFilters.status !== "all"
      ? appliedFilters.status
      : undefined;

  const startDateParam =
    appliedFilters?.startDate && appliedFilters.startDate.trim() !== ""
      ? appliedFilters.startDate
      : undefined;

  const endDateParam =
    appliedFilters?.endDate && appliedFilters.endDate.trim() !== ""
      ? appliedFilters.endDate
      : undefined;

  const sseFilters = React.useMemo(() => {
    // ✅ สร้างหลัง mount เพื่อตัดโอกาสค่าไม่ตรงตอน hydrate
    if (!mounted || !companyIdForSSE) return null;
    const filters = {
      companyId: companyIdForSSE,
      status: statusParam, // ไม่ส่ง 'all'
      startDate: startDateParam, // ไม่ส่งค่าว่าง
      endDate: endDateParam, // ไม่ส่งค่าว่าง
      completedOnly: false,
      // embed/debug จะไม่ถูกส่งต่อไป upstream (proxy whitelist แค่ companyId)
      embed: true,
      debug: true, // ทดสอบเสร็จค่อยเอาออก
    } as const;
    console.info("[SSE] use filters", filters);
    return filters;
  }, [mounted, companyIdForSSE, statusParam, startDateParam, endDateParam]);

  const [detailOpen, setDetailOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<KycRequestApi | null>(null);

  useKycRequestsSSE(sseFilters, {
    onOpen: () => {
      console.log("[SSE] connected", sseFilters);
    },

    // ✅ รองรับทุกอีเวนต์ของ "รายการใหม่/อัปเดต" รวมทั้ง 'initial' และ 'updated'
    onEvent: async (name, payload) => {
      console.groupCollapsed(`[SSE] event: ${name}`);
      console.log("raw payload:", payload);

      const kycId = extractKycId(payload);
      console.log("derived kycId:", kycId);

      // กรณี completed: คง logic เดิม = ดึง 1 ตัวแล้วเปิด DetailView
      if (name === "completed") {
        if (kycId) {
          try {
            console.debug("[SSE] fetch by id (completed):", kycId);
            const res = await fetch(
              `/api/admin/kyc/requests/${encodeURIComponent(kycId)}`,
              { cache: "no-store" }
            );
            if (!res.ok) throw new Error("fetch by id failed");
            const kyc: KycRequestApi = await res.json();

            console.table({
              id: kyc.id,
              correlationId: kyc.correlationId,
              status: kyc.status,
              requestedAt: kyc.requestedAt,
              updatedAt: kyc.updatedAt,
            });

            const corr = kyc?.correlationId ?? null;

            console.debug("[SSE] safeRefresh() after completed");
            safeRefresh();

            if (corr) {
              console.debug(
                `[SSE] open DetailView for correlationId=${corr} (id=${kyc.id})`
              );
              setSelected(kyc);
              setDetailOpen(true);
            }
          } catch (e) {
            console.warn("[SSE] fetch by id error:", e);
            safeRefresh();
          }
        } else {
          console.debug("[SSE] no kycId in completed → safeRefresh()");
          safeRefresh();
        }
        console.groupEnd();
        return;
      }

      // กรณีอีเวนต์อื่น ๆ ของ "รายการใหม่/อัปเดต"
      if (
        name === "created" ||
        name === "insert" ||
        name === "pending" ||
        name === "update" ||
        name === "updated" ||
        name === "initial" // สแน็ปช็อตตอนเชื่อมครั้งแรก → รีเฟรช
      ) {
        if (kycId && name !== "initial") {
          // initial มักเป็นลิสต์ ไม่ต้องยิง /{id} ก็ได้
          try {
            console.debug("[SSE] fetch by id (non-completed):", kycId);
            const res = await fetch(
              `/api/admin/kyc/requests/${encodeURIComponent(kycId)}`,
              { cache: "no-store" }
            );
            if (res.ok) {
              const kyc: KycRequestApi = await res.json();
              console.table({
                id: kyc.id,
                correlationId: kyc.correlationId,
                status: kyc.status,
                requestedAt: kyc.requestedAt,
              });
            }
          } catch (e) {
            console.warn("[SSE] fetch by id (non-completed) error:", e);
          }
        }
        console.debug("[SSE] safeRefresh() after", name);
        safeRefresh();
        console.groupEnd();
        return;
      }

      // อีเวนต์อื่น ๆ ที่ไม่รู้จัก → รีเฟรชเบา ๆ
      console.debug("[SSE] unknown event → safeRefresh()");
      safeRefresh();
      console.groupEnd();
    },

    // กรณี backend ส่ง default message ที่ไม่มีชื่ออีเวนต์
    onMessage: async (payload) => {
      console.groupCollapsed("[SSE] default message");
      console.log("raw payload:", payload);
      const kycId = extractKycId(payload);
      console.log("derived kycId:", kycId);

      if (kycId) {
        try {
          console.debug("[SSE] onMessage fetch by id:", kycId);
          const res = await fetch(
            `/api/admin/kyc/requests/${encodeURIComponent(kycId)}`,
            {
              cache: "no-store",
            }
          );
          if (res.ok) {
            const kyc: KycRequestApi = await res.json();
            console.table({
              id: kyc.id,
              correlationId: kyc.correlationId,
              status: kyc.status,
            });
          }
        } catch (e) {
          console.warn("[SSE] onMessage fetch by id error:", e);
        }
      }
      console.debug("[SSE] safeRefresh() after default message");
      safeRefresh();
      console.groupEnd();
    },

    onError: (err) => {
      // ปกติ EventSource จะพยายาม reconnect เอง
      try {
        const es = (err as unknown as Event)?.target as EventSource | undefined;
        console.warn(
          "[SSE] error (auto-reconnect):",
          err,
          es ? { readyState: es.readyState, url: es.url } : {}
        );
      } catch {
        console.warn("[SSE] error (auto-reconnect):", err);
      }
    },
  });

  // เพิ่ม log ตอนรายการ/ดิบเปลี่ยน เพื่อดูว่าตารางจะอัปเดตหรือยัง
  React.useEffect(() => {
    console.log("[DATA] items updated:", items.length);
    if (items.length > 0) {
      console.log("[DATA] first row (preview):", items[0]);
    }
  }, [items]);

  React.useEffect(() => {
    const cnt = rawData?.data?.items?.length ?? 0;
    console.log(
      "[DATA] rawData changed. items:",
      cnt,
      "total:",
      rawData?.data?.total
    );
  }, [rawData]);
  // --- End: SSE live updates ---

  console.log("DataTable items:", items);

  if (isLoading) return <LoadingSpinner message="Loading…" />;

  if (error) {
    if (
      (isAxiosError(error) && error.response?.status === 401) ||
      error.message.includes("Unauthorized")
    ) {
      void signOut({ callbackUrl: "/signin" });
      return null;
    }

    return <ErrorView error={error} />;
  }

  return (
    <div className="h-dvh flex flex-col overflow-hidden">
      {/* Search + Filter */}
      <header className="shrink-0 border-b p-8 bg-white">
        <div className="w-full space-y-2">
          <SearchView
            className="w-[260px]"
            value={draftFilters.q}
            onChangeValue={(val) => setDraftFilters((f) => ({ ...f, q: val }))}
            onSearch={() => apply()}
          />
          <FilterView
            status={draftFilters.status}
            // ✅ คำนวณ Date หลัง mount เท่านั้น เพื่อลดโอกาส timezone/format ไม่ตรง SSR
            start={
              mounted && draftFilters.startDate
                ? new Date(draftFilters.startDate)
                : undefined
            }
            end={
              mounted && draftFilters.endDate
                ? new Date(draftFilters.endDate)
                : undefined
            }
            onChangeStatus={(s) =>
              setDraftFilters((f) => ({ ...f, status: s }))
            }
            onChangeStart={(d) =>
              setDraftFilters((f) => ({ ...f, startDate: d ? toYmd(d) : "" }))
            }
            onChangeEnd={(d) =>
              setDraftFilters((f) => ({ ...f, endDate: d ? toYmd(d) : "" }))
            }
            onApply={apply}
            onClear={clearAll}
          />
        </div>
      </header>

      {/* Table + Detail Panel */}
      <section
        className={`flex-1 min-h-0 grid overflow-hidden ${
          detailOpen ? "grid-cols-[1fr_360px]" : "grid-cols-1"
        }`}
      >
        <div className="min-h-0 overflow-auto p-8 w-full">
          <DataTable
            columns={columns((row) => {
              const found = rawData?.data.items.find(
                (i) =>
                  i.correlationId === row.transactionNo ||
                  i.id === row.transactionNo
              );
              setSelected(found ?? null);
              setDetailOpen(true);
            })}
            data={items}
            pagination={pagination}
            onPaginationChange={setPagination}
          />
        </div>

        <DetailView
          open={detailOpen}
          width={360}
          data={selected}
          onClose={() => setDetailOpen(false)}
        />
      </section>
    </div>
  );
}
