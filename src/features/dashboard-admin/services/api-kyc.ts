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
  page?: number;
  embed?: boolean;
  status?: string;
  startDate?: string;
  endDate?: string;

  correlationId?: string;
  email?: string;
  firstNameThai?: string;
  lastNameThai?: string;
}) {
  const {
    accessToken,
    companyId,
    completedOnly, //= false เอาอันที่่ไม่เสร็จ
    limit ,
    page ,
    embed = true,
    status,
    startDate,
    endDate,
    correlationId,
    email,
    firstNameThai,
    lastNameThai,
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
      page,
      embed,
      status,
      startDate,
      endDate,

      ...(correlationId ? { correlationId } : {}),
      ...(email ? { email } : {}),
      ...(firstNameThai ? { firstNameThai } : {}),
      ...(lastNameThai ? { lastNameThai } : {}),
    },
  });

  return res.data;
}

/** get companyId + ดึง KYC requests */
export async function fetchDashboardKyc(
  accessToken: string,
  opts?: {
    limit?: number;
    page?: number;
    status?: string;
    startDate?: string;
    endDate?: string;

    correlationId?: string;
    email?: string;
    firstNameThai?: string;
    lastNameThai?: string;
  }
) {
  const companyId = await fetchCompanyId(accessToken);
  const data = await fetchKycRequests({
    accessToken,
    companyId,
    limit: opts?.limit,
    page: opts?.page,
    status: opts?.status,
    startDate: opts?.startDate,
    endDate: opts?.endDate,

    correlationId: opts?.correlationId,
    email: opts?.email,
    firstNameThai: opts?.firstNameThai,
    lastNameThai: opts?.lastNameThai,
  });
  return { companyId, data };
}

// ====== UPDATE STATUS (PATCH) - ใช้กับ Proxy API ======

export type ApiStatus =
  | "approved"
  | "rejected"
  | "approved override"
  | "rejected override";

export type UpdateKycStatusPayload = {
  id: string; // = KycRequestApi.id
  status: ApiStatus; // ค่าต้องตรงตาม backend
};

function maskToken(token: string | null | undefined): string {
  if (!token) return "none";
  if (token.length <= 12) return token.replace(/.(?=.{4})/g, "*");
  return `${token.slice(0, 6)}…${token.slice(-4)}`;
}

/** PATCH: /kyc/requests/:id  { _id, status } */
export async function updateKycRequestStatus(
  accessToken: string,
  payload: UpdateKycStatusPayload
): Promise<unknown> {
  const { id, status } = payload;
  const url = `${API_KYC_REQUEST}/kyc/requests/${encodeURIComponent(id)}`;
  const body = { _id: id, status };

  console.groupCollapsed("[server] updateKycRequestStatus");
  console.table({
    url,
    id,
    status,
    API_KYC_REQUEST,
    token: maskToken(accessToken),
  });
  const t0 = Date.now();

  try {
    const res = await axios.patch(url, body, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
      },
      // validateStatus: () => true, // (ถ้าต้องการให้ไม่ throw เมื่อ !2xx)
    });

    const dt = Date.now() - t0;
    // ตัด response เป็นสตริงสั้น ๆ กันล็อกยาวไป
    const preview =
      typeof res.data === "string"
        ? res.data.slice(0, 500)
        : JSON.stringify(res.data).slice(0, 500);

    console.table({
      status: res.status,
      duration_ms: dt,
      ok: res.status >= 200 && res.status < 300,
      resp_preview: preview,
    });
    console.groupEnd();
    return res.data as unknown;
  } catch (err) {
    const dt = Date.now() - t0;
    console.error("[server] updateKycRequestStatus ERROR in", dt, "ms");
    if (axios.isAxiosError(err)) {
      console.error("status:", err.response?.status);
      console.error(
        "data:",
        typeof err.response?.data === "string"
          ? err.response?.data
          : JSON.stringify(err.response?.data)
      );
    } else {
      console.error("error:", err);
    }
    console.groupEnd();
    throw err;
  }
}
