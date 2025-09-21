import "server-only";
import axios from "axios";

const API_BASE_INTERNAL =
  process.env.API_BASE_INTERNAL ?? "http://141.11.156.52:3203";
const API_KYC_REQUEST =
  process.env.API_KYC_REQUEST ?? "http://141.11.156.52:3205";

export type MeResponse = { companyId: string };

export async function fetchCompanyId(accessToken: string): Promise<string> {
  const res = await axios.get<MeResponse>(`${API_BASE_INTERNAL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Cache-Control": "no-cache",
    },
  });
  return res.data.companyId;
}

export async function fetchKycRequests(params: {
  accessToken: string;
  companyId: string;
  completedOnly?: boolean;
  limit?: number;
  embed?: boolean;
}) {
  const {
    accessToken,
    companyId,
    completedOnly = false,
    limit = 100,
    embed = true,
  } = params;

  const res = await axios.get(`${API_KYC_REQUEST}/kyc/requests`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Cache-Control": "no-cache",
    },
    params: {
      companyId,
      completedOnly,
      limit,
      embed,
    },
  });

  return res.data;
}

/*get companyId + ดึง KYC requests */
export async function fetchDashboardKyc(accessToken: string) {
  const companyId = await fetchCompanyId(accessToken);
  const data = await fetchKycRequests({ accessToken, companyId, limit: 100 });
  return { companyId, data };
}
