import { ddmmyyyyToIso, formatFromIso } from "./datetime";
import type { Kycrequest } from "@/features/dashboard-admin/components/column";
import type { KycRequestApi } from "@/features/dashboard-admin/types/kyc";

// ใช้ในการ format วันที่ และยิง API
export type Filters = {
  q: string;
  status: string;
  startDate: string;
  endDate: string;
};

// แปลงวัน+เวลา เป็น timestamp เพื่อไว้ sort
export const getRowTs = (row: Kycrequest) => {
  const iso = ddmmyyyyToIso(row.submissionDate);
  const time = row.submissionTime ?? "00:00:00";
  const dt = new Date(`${iso}T${time}`);
  return Number.isNaN(+dt) ? 0 : dt.getTime();
};

export type RowStatus = Kycrequest["status"];

// normalize ค่า status จาก API ให้เป็น string
const STATUS_MAP: Record<string, RowStatus> = {
  approved: "Approved",
  rejected: "Rejected",
  pending: "Pending",
  "approved override": "Approved Override",
  "rejected override": "Rejected Override",
};

export function normalizeStatus(raw?: string | null): RowStatus {
  const key = (raw ?? "").trim().toLowerCase();
  return STATUS_MAP[key] ?? "Pending";
}

// แปลง object จาก API → เป็นโครงสร้างที่ DataTable ใช้งานได้
export function toDisplayRow(
  r: KycRequestApi
): Kycrequest & { __keys: string } {
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
