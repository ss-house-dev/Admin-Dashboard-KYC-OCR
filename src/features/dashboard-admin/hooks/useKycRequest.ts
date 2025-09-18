"use client";

import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { apiClient } from "../libs/apiClient";

export type CompanyBootstrapResponse<T = unknown> = {
  companyId: string;
  data: T; // โครงสร้างภายในปรับตาม API ของคุณ
};

async function fetchCompany<T = unknown>() {
  const res = await apiClient.get<CompanyBootstrapResponse<T>>("/api/company");
  return res.data;
}

export function useKycRequest<T = unknown>(
  options?: Omit<
    UseQueryOptions<CompanyBootstrapResponse<T>, Error, CompanyBootstrapResponse<T>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery<CompanyBootstrapResponse<T>, Error>({
    queryKey: ["company", "bootstrap"],
    queryFn: () => fetchCompany<T>(),
    staleTime: 60_000,           // แคช 1 นาที (ปรับได้)
    refetchOnWindowFocus: false, // ไม่ดึงซ้ำเมื่อสลับแท็บกลับมา (ปรับได้)
    ...options,
  });
}
