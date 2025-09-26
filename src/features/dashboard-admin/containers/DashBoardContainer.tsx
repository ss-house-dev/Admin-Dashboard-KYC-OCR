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
  } = useKycData();

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
