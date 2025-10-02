"use client";

import * as React from "react";
import { toYmd } from "../utils/datetime";
import type { KycRequestApi } from "../types/kyc";
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

export default function DashBoardContainer() {
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
    fetchData(); // ดึงข้อมูลด้วยตัวกรองเดิมจาก hook
  }, [fetchData]);

  // เลือก companyId สำหรับ SSE:
  // 1) จาก appliedFilters.companyId (ถ้ามี)
  // 2) จาก ENV NEXT_PUBLIC_COMPANY_ID
  // 3) จากรายการแรกใน rawData (fallback)
  const companyIdForSSE =
    (appliedFilters as any)?.companyId ||
    (process.env.NEXT_PUBLIC_COMPANY_ID as string | undefined) ||
    (rawData?.data?.items?.[0]?.companyId as string | undefined);

  // รวมพารามิเตอร์ที่อยากผูกกับ SSE ตามตัวกรองที่มีจริง
  const sseFilters = React.useMemo(() => {
    if (!companyIdForSSE) return null;
    return {
      companyId: companyIdForSSE,
      status: appliedFilters?.status ?? undefined,
      startDate: appliedFilters?.startDate ?? undefined,
      endDate: appliedFilters?.endDate ?? undefined,
      // เพิ่มเติมพารามิเตอร์อื่นได้ตามที่มีในระบบ
      embed: true,
      completedOnly: false,
    };
  }, [
    companyIdForSSE,
    appliedFilters?.status,
    appliedFilters?.startDate,
    appliedFilters?.endDate,
  ]);

  useKycRequestsSSE<KycRequestApi | { items: KycRequestApi[] }>(sseFilters, {
    onOpen: () => {
      // console.log("SSE connected");
    },
    onEvent: (name) => {
      // มี event มา → refresh รายการ (ปลอดภัย ไม่แตะ UI)
      if (name === "snapshot" || name === "update" || name === "delete") {
        safeRefresh();
      }
    },
    onMessage: () => {
      // กรณี backend ส่ง default message
      safeRefresh();
    },
    onError: () => {
      // ปล่อยว่างได้ EventSource จะ reconnect เอง
    },
  });
  // --- End: SSE live updates ---

  const [detailOpen, setDetailOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<KycRequestApi | null>(null);

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
            start={
              draftFilters.startDate
                ? new Date(draftFilters.startDate)
                : undefined
            }
            end={
              draftFilters.endDate ? new Date(draftFilters.endDate) : undefined
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
