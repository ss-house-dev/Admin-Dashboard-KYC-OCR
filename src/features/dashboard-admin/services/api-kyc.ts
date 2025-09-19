import axios from "axios";

export type KycStatus = "pending" | "approved" | "rejected";

export type FiltersApplied = {
  companyId: "68ba8e8bb9d343d98dd97a99";
  correlationId: boolean;
  email: boolean;
  firstNameThai: boolean;
  lastNameThai: boolean;
  status: KycStatus | null; // ไม่มีค่า = null
  startDate: string | null; // แนะนำเก็บเป็น ISO string เช่น "2025-09-18"
  endDate: string | null; // เช่นเดียวกัน
  embed: boolean;
  completedOnly: boolean;
};

export type KycRequest = {
  total: string;
  id: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  items: string[];
};

type KycRequestGetArgs = {
  id?: string;
};

export async function kycRequestGet({
  id,
}: KycRequestGetArgs): Promise<KycRequest | KycRequest[]> {
  const url = id ? `/kyc/requests/${id}` : `/kyc/requests`;
  const { data } = await axios.get(url);
  return data;
}
