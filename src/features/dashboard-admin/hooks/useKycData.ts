import { useState, useEffect, useCallback } from "react";
import { type PaginationState } from "@tanstack/react-table";
import { isAxiosError } from "axios";
import type { AxiosError } from "axios";
import { toStartOfDayZ, toEndOfDayZ } from "../utils/datetime";
import { Filters, getRowTs, toDisplayRow } from "../utils/kycHelpers";
import { apiClient } from "../libs/apiClient";
import type { CompanyAllData } from "../types/kyc";
import type { Kycrequest } from "../components/column";
import { signOut } from "next-auth/react";

export type FetchDataArg = number | { page?: number; sseBump?: number };

export function useKycData(defaultValues?: Partial<Filters>) {
  // Loading/Error
  const [isLoading, setIsLoading] = useState(true);
  const [isRefetching, setIsRefetching] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Data สำหรับตาราง
  const [items, setItems] = useState<(Kycrequest & { __keys: string })[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [_nextPage, setNextPage] = useState<number>(1);

  // Data เต็มจาก API
  const [rawData, setRawData] = useState<CompanyAllData | null>(null);

  // Pagination
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  // Draft Filters
  const [draftFilters, setDraftFilters] = useState<Filters>({
    q: defaultValues?.q ?? "",
    status: defaultValues?.status ?? "all",
    startDate: defaultValues?.startDate ?? "",
    endDate: defaultValues?.endDate ?? "",
  });

  // Applied Filters
  const [appliedFilters, setAppliedFilters] = useState<Filters>(draftFilters);

  // helpers
  const isEmail = (text: string) => /\S+@\S+\.\S+/.test(text);
  const isTransactionNumber = (text: string) => /^\d{1,10}$/.test(text);
  const isThaiText = (text: string) => /[\u0E00-\u0E7F]/.test(text);

  const buildFilterQuery = useCallback(
    (page: number, limit: number) => {
      const { q, status, startDate, endDate } = appliedFilters;

      const params: Record<string, string> = {
        page: String(page),
        limit: String(limit),
      };
      let specialSingleThai: string | null = null;

      const qTrim = q.trim();
      if (qTrim) {
        if (isEmail(qTrim)) {
          params.email = qTrim;
        } else if (isTransactionNumber(qTrim)) {
          params.correlationId = qTrim;
        } else if (isThaiText(qTrim)) {
          const parts = qTrim.split(/\s+/).filter(Boolean);
          if (parts.length === 1) {
            specialSingleThai = parts[0];
          } else {
            params.firstNameThai = parts[0];
            params.lastNameThai = parts.slice(1).join(" ");
          }
        } else {
          params.correlationId = qTrim;
        }
      }

      if (status && status.toLowerCase() !== "all") {
        params.status = status;
      }

      if (startDate) params.startDate = toStartOfDayZ(new Date(startDate))!;
      if (endDate) params.endDate = toEndOfDayZ(new Date(endDate))!;

      return { params, specialSingleThai };
    },
    [appliedFilters]
  );

  const fetchData = useCallback(
    async (arg?: FetchDataArg, append: boolean = false) => {
      // ✅ รองรับทั้งรูปแบบเดิม (เลขหน้า) และรูปแบบใหม่ (object)
      const page = typeof arg === "number" ? arg : arg?.page ?? 1;
      const sseBump =
        typeof arg === "object" && arg !== null ? arg.sseBump : undefined;

      try {
        if (!append) setIsRefetching(true);

        const { params, specialSingleThai } = buildFilterQuery(
          page,
          Math.max(100, pagination.pageSize)
        );

        // ✅ กัน cache: ถ้ามาจาก SSE ให้ใส่ _ts ลง query
        const finalParams: Record<string, string> = {
          ...params,
          ...(typeof sseBump === "number" ? { _ts: String(sseBump) } : {}),
        };

        let newItems: (Kycrequest & { __keys: string })[] = [];
        let fullResponse: CompanyAllData | null = null;

        if (specialSingleThai) {
          const [firstRes, lastRes] = await Promise.all([
            apiClient.get<CompanyAllData>("/api/company", {
              params: { ...finalParams, firstNameThai: specialSingleThai },
            }),
            apiClient.get<CompanyAllData>("/api/company", {
              params: { ...finalParams, lastNameThai: specialSingleThai },
            }),
          ]);

          const mergedItems = [
            ...(firstRes.data?.data?.items ?? []),
            ...(lastRes.data?.data?.items ?? []),
          ];

          newItems = mergedItems.map(toDisplayRow);

          fullResponse = {
            ...firstRes.data,
            data: {
              ...firstRes.data.data,
              items: mergedItems,
            },
          };
        } else {
          const res = await apiClient.get<CompanyAllData>("/api/company", {
            params: finalParams,
          });
          fullResponse = res.data;
          const rawItems = res.data?.data?.items ?? [];
          newItems = rawItems.map(toDisplayRow);
        }

        const sorted = newItems.sort((a, b) => getRowTs(b) - getRowTs(a));

        if (append) {
          setItems((prev) => {
            const existingIds = new Set(prev.map((i) => i.transactionNo));
            return [
              ...prev,
              ...sorted.filter((i) => !existingIds.has(i.transactionNo)),
            ];
          });
        } else {
          setItems(sorted);
          setPagination((p) => ({ ...p, pageIndex: 0 }));
        }

        setTotal(sorted.length);
        setNextPage(page + 1);
        setRawData(fullResponse);
        setError(null);
      } catch (e: unknown) {
        if (isAxiosError(e)) {
          const axiosErr = e as AxiosError;
          if (axiosErr.response?.status === 401) {
            await signOut({ callbackUrl: "/signin" });
            return;
          }
          setError(new Error(axiosErr.message));
        } else {
          setError(e instanceof Error ? e : new Error(String(e)));
        }
      } finally {
        setIsLoading(false);
        setIsRefetching(false);
      }
    },
    [buildFilterQuery, pagination.pageSize]
  );

  useEffect(() => {
    fetchData(1, false);
  }, [appliedFilters, fetchData]);

  const apply = useCallback(() => {
    setAppliedFilters(draftFilters);
  }, [draftFilters]);

  const clearAll = useCallback(() => {
    const cleared: Filters = {
      q: "",
      status: "all",
      startDate: "",
      endDate: "",
    };
    setDraftFilters(cleared);
    setAppliedFilters(cleared);
  }, []);

  return {
    isLoading,
    isRefetching,
    error,
    items,
    total,
    rawData,
    pagination,
    setPagination,
    fetchData,
    apply,
    clearAll,
    draftFilters,
    setDraftFilters,
    appliedFilters,
  };
}
