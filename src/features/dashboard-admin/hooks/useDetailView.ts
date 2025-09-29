"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import type { KycRequestApi } from "../types/kyc";
import type { DetailVM, UiStatus, ConfirmKind } from "../types/detail";
import { fromApiToDetailVM } from "../helpers/mappers";
import {
  actionToApiStatus,
  computeNewStatusForAction,
  mapStatus,
  type ApiStatus,
} from "../helpers/status";

/** แจ้ง global (ถ้ามีหน้ารายการฟัง event อยู่ ก็จะอัปเดตตาม) */
function emitKycStatusUpdated(detail: {
  companyId: string;
  requestId: string;
  correlationId: string;
  newStatus: UiStatus;
  apiStatus: ApiStatus;
}) {
  try {
    window.dispatchEvent(new CustomEvent("kyc:status-updated", { detail }));
  } catch {
    /* noop */
  }
}

export function useDetailView(
  open: boolean,
  detail: DetailVM | null | undefined,
  data: KycRequestApi | null,
  onStatusChanged?: (s: UiStatus) => void
) {
  // ---------- START: optimistic status (DO NOT MODIFY OTHER LINES) ----------
  // local optimistic UI state for status
  const [localStatus, setLocalStatus] = React.useState<UiStatus | undefined>(
    undefined
  );
  // resolvedDetail is computed below; we reference it in effect so keep order (hooks first)
  // ---------- END: will sync after resolvedDetail declaration ----------

  const resolvedDetail: DetailVM | null = React.useMemo(
    () => detail ?? (data ? fromApiToDetailVM(data) : null),
    [detail, data]
  );

  const { data: session, status: authStatus } = useSession();

  // sync localStatus when modal opens or data changes
  React.useEffect(() => {
    if (!open) return;
    const base =
      resolvedDetail?.status ?? (data ? mapStatus(data.status) : undefined);
    setLocalStatus(base);
  }, [open, resolvedDetail, data]);

  const [confirm, setConfirm] = React.useState<ConfirmKind | null>(null);

  // visibleStatus prefers localStatus (optimistic)
  const visibleStatus: UiStatus | undefined =
    localStatus ??
    resolvedDetail?.status ??
    (data ? mapStatus(data.status) : undefined);

  const handleConfirm = React.useCallback(async () => {
    if (!confirm) return;

    const kind = confirm;

    // ✅ ใช้สถานะที่มองเห็นจริงบน UI (รวม optimistic ผ่าน localStatus แล้ว)
    const currentStatus =
      localStatus ??
      resolvedDetail?.status ??
      (data ? mapStatus(data.status) : undefined);

    // ใช้ _id สำหรับ body และ companyId สำหรับ path
    const requestId = resolvedDetail?.requestId ?? data?.id ?? "";
    const companyId = data?.companyId ?? "";
    const tx = resolvedDetail?.transactionNo ?? data?.correlationId ?? "N/A";

    // แปลง action → สถานะ backend + คำนวณสถานะใหม่บน UI
    const apiStatus = actionToApiStatus(kind, currentStatus);
    const optimistic = computeNewStatusForAction(kind, currentStatus);

    // กัน override ตอนยังไม่ Approved/Rejected
    if (
      kind === "override" &&
      !(
        String(currentStatus ?? "")
          .toLowerCase()
          .includes("approved") ||
        String(currentStatus ?? "")
          .toLowerCase()
          .includes("rejected")
      )
    ) {
      alert("Override ได้เฉพาะเมื่อสถานะเป็น Approved หรือ Rejected เท่านั้น");
      return;
    }

    const proxyUrl = `/api/admin/kyc/${encodeURIComponent(companyId)}/status`;

    console.groupCollapsed("[DetailView] ▶ PATCH via proxy (optimistic)");
    console.table({
      proxyUrl,
      companyId,
      body__id: requestId,
      apiStatus,
      uiCurrent: currentStatus ?? null,
      uiOptimistic: optimistic,
      tx,
    });
    console.groupEnd();

    if (!companyId || !requestId) {
      alert("ข้อมูลไม่ครบ (companyId/_id)");
      return;
    }

    setConfirm(null);
    setLocalStatus(optimistic);

    try {
      const res = await fetch(proxyUrl, {
        method: "PATCH",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ _id: requestId, status: apiStatus }),
      });

      const ctype = res.headers.get("content-type") ?? "";
      const bodyPreview = ctype.includes("application/json")
        ? await res.clone().json()
        : await res.clone().text();

      console.groupCollapsed("[DetailView] ◀ PATCH result (proxy)");
      console.table({ ok: res.ok, status: res.status, proxyUrl });
      console.log("response:", bodyPreview);
      console.groupEnd();

      if (!res.ok) {
        setLocalStatus(currentStatus);
        throw new Error(
          `PATCH failed ${res.status} ${
            typeof bodyPreview === "string"
              ? bodyPreview
              : JSON.stringify(bodyPreview)
          }`
        );
      }

      // ③ แจ้งผู้ฟังภายนอก (DataTable จะอัปเดตเอง)
      emitKycStatusUpdated({
        companyId,
        requestId,
        correlationId: String(tx),
        newStatus: optimistic,
        apiStatus,
      });

      // ④ แจ้ง parent ผ่าน prop ถ้ามี
      try {
        onStatusChanged?.(optimistic);
      } catch {
        /* noop */
      }
    } catch (err) {
      console.error("[DetailView] ❌ PATCH failed; rollback", err);
      setLocalStatus(currentStatus);
      alert("Update status failed. โปรดลองใหม่");
    }
    // ⬇️ อัปเดต dependencies ให้ถูกต้อง (ไม่ต้องใส่ visibleStatus แล้ว)
  }, [confirm, localStatus, resolvedDetail, data, onStatusChanged]);

  return {
    session,
    authStatus,
    resolvedDetail,
    localStatus,
    setLocalStatus,
    visibleStatus,
    confirm,
    setConfirm,
    handleConfirm,
  };
}
