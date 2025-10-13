import type { UiStatus } from "../types/detail";

export type ApiStatus =
  | "approved"
  | "rejected"
  | "approved override"
  | "rejected override";

/** map string → UiStatus (คงตรรกะเดิมตามไฟล์เก่า) */
export function mapStatus(s?: string | null): UiStatus {
  const t = (s ?? "").toLowerCase();
  if (t.includes("approved override")) return "Approved Override";
  if (t.includes("rejected override")) return "Rejected Override";
  if (t.includes("approved")) return "Approved";
  if (t.includes("rejected")) return "Rejected";
  return "Pending";
}

/** คำนวณสถานะใหม่บน UI จาก action */
export function computeNewStatusForAction(
  kind: "approve" | "reject" | "override",
  current?: UiStatus
): UiStatus {
  if (kind === "approve") return "Approved";
  if (kind === "reject") return "Rejected";
  const cur = (current ?? "").toLowerCase();
  if (cur.includes("approved")) return "Rejected Override";
  if (cur.includes("rejected")) return "Approved Override";
  return "Approved Override";
}

/** map action → สถานะฝั่ง backend */
export function actionToApiStatus(
  kind: "approve" | "reject" | "override",
  current?: UiStatus
): ApiStatus {
  if (kind === "approve") return "approved";
  if (kind === "reject") return "rejected";
  const cur = (current ?? "").toLowerCase();
  if (cur.includes("approved")) return "rejected override";
  if (cur.includes("rejected")) return "approved override";
  return "approved override";
}

/** สี badge สถานะ (คง class เดิมเพื่อไม่เปลี่ยน UI) */
export const STATUS_BADGE_CLASS: Record<UiStatus, string> = {
  Pending: "bg-yellow-100 text-yellow-800",
  Approved: "bg-green-100 text-green-700",
  Rejected: "bg-red-100 text-red-700",
  "Approved Override": "bg-green-100 text-green-700",
  "Rejected Override": "bg-red-100 text-red-700",
};
