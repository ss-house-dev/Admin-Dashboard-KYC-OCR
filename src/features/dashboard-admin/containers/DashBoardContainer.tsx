"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { columns, Kycrequest } from "../components/column";
import { DataTable } from "../components/DataTable";
import { SearchView } from "../components/SearchView";
import { FilterView } from "../components/FilterView";
import DetailView from "../components/DetailView";
import type { KycRequestApi } from "../types/kyc";
import { toYmd, ddmmyyyyToIso, formatFromIso } from "../utils/datetime";
import { apiClient } from "../libs/apiClient";
import { type PaginationState } from "@tanstack/react-table";

type Filters = {
  q: string;
  status: string;
  startDate: string;
  endDate: string;
};

const getRowTs = (row: Kycrequest) => {
  const iso = ddmmyyyyToIso(row.submissionDate);
  const time = row.submissionTime ?? "00:00:00";
  const dt = new Date(`${iso}T${time}`);
  return Number.isNaN(+dt) ? 0 : dt.getTime();
};

type RowStatus = Kycrequest["status"];

const STATUS_MAP: Record<string, RowStatus> = {
  approved: "Approved",
  rejected: "Rejected",
  pending: "Pending",
  "approved override": "Approved Override",
  "rejected override": "Rejected Override",
};

function normalizeStatus(raw?: string | null): RowStatus {
  const key = (raw ?? "").trim().toLowerCase();
  return STATUS_MAP[key] ?? "Pending";
}

function toDisplayRow(r: KycRequestApi): Kycrequest & { __keys: string } {
  const { date, time } = formatFromIso(r.createdAt);

  const firstNameThai = r.idcardEdit?.firstNameThai?.trim() ?? "";
  const lastNameThai = r.idcardEdit?.lastNameThai?.trim() ?? "";
  const fullNameThai = [firstNameThai, lastNameThai].filter(Boolean).join(" ");

  const correlationId = r.correlationId?.trim() ?? "";
  const idFallback = r.id?.trim() ?? "";
  const email = r.email?.trim() ?? "";

  const searchKeys = [
    correlationId,
    idFallback,
    email,
    firstNameThai,
    lastNameThai,
    fullNameThai,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return {
    transactionNo: correlationId || idFallback,
    name: fullNameThai || "-",
    email: email || "-",
    submissionDate: date,
    submissionTime: time,
    status: normalizeStatus(r.status),
    __keys: searchKeys,
  };
}

function toStartOfDayZ(d?: Date) {
  const ymd = toYmd(d);
  return ymd ? `${ymd}T00:00:00Z` : undefined;
}
function toEndOfDayZ(d?: Date) {
  const ymd = toYmd(d);
  return ymd ? `${ymd}T23:59:59Z` : undefined;
}

export default function DashBoardContainer({
  onApply,
  onClear,
  defaultValues,
}: {
  onApply?: (v: Filters) => void;
  onClear?: () => void;
  defaultValues?: Partial<Filters>;
}) {
  // 1. เก็บสถานะการโหลด
  const [isLoading, setIsLoading] = useState(true);
  const [isRefetching, setIsRefetching] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // 2. เก็บข้อมูล items/total/offset
  const [items, setItems] = useState<(Kycrequest & { __keys: string })[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [nextPage, setNextPage] = useState<number>(1);
  const [initialLimit] = useState<number>(100);

  // 3. Pagination
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  // DRAFT values
  const [q, setQ] = useState(defaultValues?.q ?? "");
  const [status, setStatus] = useState(defaultValues?.status ?? "all");
  const [start, setStart] = useState<Date | undefined>(
    defaultValues?.startDate ? new Date(defaultValues.startDate) : undefined
  );
  const [end, setEnd] = useState<Date | undefined>(
    defaultValues?.endDate ? new Date(defaultValues.endDate) : undefined
  );

  // APPLIED values
  const [aq, setAq] = useState(q);
  const [astatus, setAstatus] = useState(status);
  const [astart, setAstart] = useState<Date | undefined>(start);
  const [aend, setAend] = useState<Date | undefined>(end);

  // Helper functions สำหรับ pattern matching
  const isEmail = (text: string) => /\S+@\S+\.\S+/.test(text);
  const isTransactionNumber = (text: string) => /^\d{1,10}$/.test(text);
  const isThaiText = (text: string) => /[\u0E00-\u0E7F]/.test(text);

  // 4. ฟังก์ชันสร้าง query parameters
  const buildFilterQuery = useCallback(
    (page: number, limit: number) => {
      const params: Record<string, string> = {
        page: String(page),
        limit: String(limit),
      };

      let specialSingleThai: string | null = null; 

      const qTrim = aq.trim();
      if (qTrim) {
        if (isEmail(qTrim)) {
          params.email = qTrim;
          console.log("Search by email:", qTrim);
        } else if (isTransactionNumber(qTrim)) {
          params.correlationId = qTrim;
          console.log("Search by correlationId:", qTrim);
        } else if (isThaiText(qTrim)) {
          const parts = qTrim.split(/\s+/).filter(Boolean);
          if (parts.length === 1) {
            specialSingleThai = parts[0];
            console.log("Search by Thai single name:", parts[0]);
          } else {
            params.firstNameThai = parts[0];
            params.lastNameThai = parts.slice(1).join(" ");
            console.log("Search by Thai names:", {
              firstNameThai: parts[0],
              lastNameThai: parts.slice(1).join(" "),
            });
          }
        } else {
          params.correlationId = qTrim;
          console.log("Search by correlationId (default):", qTrim);
        }
      }

      if (astatus && astatus.toLowerCase() !== "all") {
        params.status = astatus;
      }

      const startIso = toStartOfDayZ(astart);
      const endIso = toEndOfDayZ(aend);
      if (startIso) params.startDate = startIso;
      if (endIso) params.endDate = endIso;

      console.log("Final query params:", params);
      return { params, specialSingleThai }; 
    },
    [aq, astatus, astart, aend]
  );

  // 5. ฟังก์ชันดึงข้อมูลจาก API
  const fetchData = useCallback(
    async (page: number = 1, append: boolean = false) => {
      try {
        if (!append) setIsRefetching(true);

        const { params, specialSingleThai } = buildFilterQuery(
          page,
          Math.max(100, pagination.pageSize * 2)
        );

        let newItems: (Kycrequest & { __keys: string })[] = [];

        if (specialSingleThai) {
          const [firstRes, lastRes] = await Promise.all([
            apiClient.get<{
              companyId: string;
              data: { items: KycRequestApi[]; total: number };
            }>("/api/company", {
              params: { ...params, firstNameThai: specialSingleThai },
            }),
            apiClient.get<{
              companyId: string;
              data: { items: KycRequestApi[]; total: number };
            }>("/api/company", {
              params: { ...params, lastNameThai: specialSingleThai },
            }),
          ]);

          const mergedItems = [
            ...(firstRes.data?.data?.items ?? []),
            ...(lastRes.data?.data?.items ?? []),
          ];
          newItems = mergedItems.map(toDisplayRow);
        } else {
          const res = await apiClient.get<{
            companyId: string;
            data: { items: KycRequestApi[]; total: number };
          }>("/api/company", { params });
          newItems = (res.data?.data?.items ?? []).map(toDisplayRow);
        }

        const sortedItems = newItems.sort((a, b) => getRowTs(b) - getRowTs(a));

        if (append) {
          setItems((prev) => {
            const existingIds = new Set(prev.map((item) => item.transactionNo));
            const uniqueNewItems = sortedItems.filter(
              (item) => !existingIds.has(item.transactionNo)
            );
            return [...prev, ...uniqueNewItems];
          });
        } else {
          setItems(sortedItems);
          setPagination((p) => ({ ...p, pageIndex: 0 }));
        }

        setTotal(sortedItems.length);
        setNextPage(page + 1);
        setError(null);
      } catch (err) {
        console.error("Fetch data error:", err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
        setIsRefetching(false);
      }
    },
    [buildFilterQuery, pagination.pageSize]
  );

  // 6. โหลดข้อมูลครั้งแรกเมื่อ component mount
  useEffect(() => {
    fetchData(1, false);
  }, [aq, astatus, astart, aend]);

  // Detail view states
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<Kycrequest | null>(null);

  const column = columns((row: Kycrequest) => {
    setSelected(row);
    setDetailOpen(true);
  });

  // 7. Apply filters - ป้องกันการ get ซ้ำเมื่อค่าไม่เปลี่ยน
  const apply = useCallback(
    (overrideQ?: string) => {
      const nextQ = (overrideQ ?? q).trim();

      // เช็คว่ามีการเปลี่ยนแปลงจริงๆ หรือไม่
      const hasQueryChange = nextQ !== aq;
      const hasStatusChange = status !== astatus;
      const hasStartDateChange = start?.getTime() !== astart?.getTime();
      const hasEndDateChange = end?.getTime() !== aend?.getTime();

      const hasChanges =
        hasQueryChange ||
        hasStatusChange ||
        hasStartDateChange ||
        hasEndDateChange;

      // ถ้าไม่มี search query และไม่มีการเปลี่ยน filter อื่น ไม่ต้อง get
      if (!nextQ && status === "all" && !start && !end && !hasChanges) {
        console.log("No search query or filters provided, skipping API call");
        return;
      }

      // ถ้าไม่มีการเปลี่ยนแปลงใดๆ ไม่ต้อง get
      if (!hasChanges) {
        console.log("No changes detected, skipping API call");
        return;
      }

      console.log("Applying filters with changes:", {
        query: { old: aq, new: nextQ, changed: hasQueryChange },
        status: { old: astatus, new: status, changed: hasStatusChange },
        startDate: { old: astart, new: start, changed: hasStartDateChange },
        endDate: { old: aend, new: end, changed: hasEndDateChange },
      });

      // Update applied values
      setQ(nextQ);
      setAq(nextQ);
      setAstatus(status);
      setAstart(start);
      setAend(end);

      onApply?.({
        q: nextQ,
        status,
        startDate: toYmd(start),
        endDate: toYmd(end),
      });
    },
    [q, status, start, end, aq, astatus, astart, aend, onApply]
  );

  // 8. เมื่อ applied values เปลี่ยน ให้ fetch ข้อมูลใหม่
  useEffect(() => {
    // เฝ้าดู applied values เท่านั้น และข้าม initial render
    const hasAnyAppliedFilter = aq || astatus !== "all" || astart || aend;

    if (hasAnyAppliedFilter || items.length === 0) {
      fetchData(1, false);
    }
  }, [aq, astatus, astart, aend]);

  // 9. Clear filters
  const clearAll = useCallback(() => {
    setQ("");
    setStatus("all");
    setStart(undefined);
    setEnd(undefined);

    setAq("");
    setAstatus("all");
    setAstart(undefined);
    setAend(undefined);
  }, [onClear]);

  // 10. Load more function - เช็คจากจำนวนข้อมูลจริง vs total
  const loadMore = useCallback(async () => {
    const hasMoreData = items.length < total;

    if (!hasMoreData || isRefetching) {
      console.log("LoadMore blocked:", {
        hasMoreData,
        isRefetching,
        currentItems: items.length,
        total,
      });
      return;
    }

    console.log("Loading more data...", {
      currentPage: nextPage,
      currentItems: items.length,
      total,
      remaining: total - items.length,
    });

    await fetchData(nextPage, true);
  }, [items.length, total, nextPage, isRefetching, fetchData]);

  // 11. Auto load more - เช็คจากจำนวนข้อมูลจริงและตำแหน่งที่ user กำลังดู
  useEffect(() => {
    // คำนวณว่า user กำลังดูหน้าไหนจากข้อมูลที่มีอยู่
    const currentPageCount = Math.max(
      1,
      Math.ceil(items.length / pagination.pageSize)
    );
    const userCurrentPage = pagination.pageIndex + 1; // pageIndex เริ่มจาก 0

    // เช็คว่า user อยู่ในหน้าก่อนสุดท้าย (penultimate) หรือหน้าสุดท้าย
    const isNearLastPage = userCurrentPage >= currentPageCount - 1;

    // เช็คว่ายังมีข้อมูลเหลือใน database หรือไม่
    const hasMoreInDatabase = items.length < total;

    // Debug log
    console.log("Auto load check:", {
      userCurrentPage,
      currentPageCount,
      isNearLastPage,
      hasMoreInDatabase,
      totalItems: items.length,
      totalInDb: total,
      remaining: total - items.length,
      isRefetching,
    });

    // ถ้า user เข้าใกล้หน้าสุดท้ายและยังมีข้อมูลเหลือ ให้โหลดเพิ่ม
    if (isNearLastPage && hasMoreInDatabase && !isRefetching) {
      console.log("Triggering auto load more...");
      loadMore();
    }
  }, [
    pagination.pageIndex,
    pagination.pageSize,
    items.length,
    total,
    isRefetching,
    loadMore,
  ]);

  // 12. Retry function
  const retry = useCallback(() => {
    setError(null);
    fetchData(1, false);
  }, [fetchData]);

  // Loading state
  if (isLoading) {
    return <div className="p-8">Loading company data…</div>;
  }

  // Error state
  if (error) {
    return (
      <div className="p-8 text-red-600">
        Error: {String(error.message)}
        <button
          onClick={retry}
          className="ml-3 underline"
          disabled={isRefetching}
        >
          {isRefetching ? "Retrying…" : "Retry"}
        </button>
      </div>
    );
  }

  return (
    <div className="h-dvh flex flex-col overflow-hidden">
      {/* Search and Filter Header */}
      <header className="shrink-0 border-b p-8 bg-white">
        <div className="w-full space-y-2">
          <SearchView
            className="w-[260px]"
            value={q}
            onChangeValue={setQ}
            onSearch={(val) => apply(val)}
            placeholder="Search..."
          />
          <FilterView
            status={status}
            start={start}
            end={end}
            onChangeStatus={setStatus}
            onChangeStart={(d) => {
              setStart(d);
              if (!d) setEnd(undefined);
              if (d && end && d > end) setEnd(undefined);
            }}
            onChangeEnd={(d) => {
              if (d && start && d < start) setStart(d);
              setEnd(d);
            }}
            onApply={() => apply()}
            onClear={clearAll}
          />
        </div>
      </header>

      {/* Table and Detail Panel */}
      <section
        className={`
          flex-1 min-h-0 grid overflow-hidden
          ${detailOpen ? "grid-cols-[1fr_360px]" : "grid-cols-1"}
        `}
      >
        <div className="min-h-0 overflow-auto p-8 w-full">
          <DataTable
            columns={column}
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
