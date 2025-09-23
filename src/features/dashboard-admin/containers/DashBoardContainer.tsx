"use client";

import * as React from "react";
import { toYmd } from "../utils/datetime";
import { columns, Kycrequest } from "../components/column";
import { DataTable } from "../components/DataTable";
import { SearchView } from "../components/SearchView";
import { FilterView } from "../components/FilterView";
import DetailView from "../components/DetailView";
import { useKycData } from "../hooks/useKycData";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorView } from "@/components/ErrorView";

export default function DashBoardContainer() {
  const {
    isLoading,
    error,
    draftFilters,
    setDraftFilters,
    apply,
    clearAll,
    items,
    pagination,
    setPagination,
  } = useKycData();

  const [detailOpen, setDetailOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<Kycrequest | null>(null);

  if (isLoading) return <LoadingSpinner message="Loading company data…" />;
  if (error) return <ErrorView error={error} />;

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
              setSelected(row);
              setDetailOpen(true);
            })}
            data={items}
            pagination={pagination}
            onPaginationChange={setPagination}
            onView={(row) => {
              setSelected(row);
              setDetailOpen(true);
            }}
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
