// useKycQuery.ts
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { apiClient } from "../libs/apiClient";

type KycQueryParams = {
  page: number;      // 1-based
  limit: number;
  filters: Record<string, unknown>; // ใส่ status/startDate/endDate/ค้นหา
};

export function useKycQuery({ page, limit, filters }: KycQueryParams) {
  const filtersHash = JSON.stringify(filters); // ทำให้ key สั้นและเสถียร

  return useQuery({
    queryKey: ["kyc", { page, limit, filtersHash }],
    queryFn: async () => {
      const res = await apiClient.get("/api/company", {
        params: { page, limit, ...filters },
      });
      return res.data as {
        companyId: string;
        data: {
          items: any[];
          total: number;
          page: number;   // from API
          pages: number;  // from API
          limit: number;  // from API
        };
      };
    },

    // 🔑 ทำให้เวลาย้อนกลับไปหน้าที่เคยโหลดแล้ว "ไม่ยิงใหม่"
    staleTime: 5 * 60 * 1000,            // 5 นาทีถือว่ายังสด => กลับหน้าเดิมจะไม่ยิงใหม่
    gcTime: 30 * 60 * 1000,              // เก็บ cache ไว้ 30 นาที
    refetchOnWindowFocus: false,         // ไม่รีเวลาสลับแท็บกลับมา
    refetchOnReconnect: false,           // ไม่รีเวลาเน็ตหลุดกลับมา
    refetchOnMount: false,               // แม้ stale ก็ไม่รีตอน mount (เพราะเราตั้ง staleTime ไว้อยู่แล้ว)
    placeholderData: keepPreviousData,   // เปลี่ยนหน้าแล้วค้างข้อมูลหน้าเดิมไว้ระหว่างโหลด
  });
}
