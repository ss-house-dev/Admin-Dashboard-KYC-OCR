"use client";

import { useSession } from "next-auth/react";
import Image from "next/image";
import * as React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { KycRequestApi } from "../types/kyc";
import { X } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DetailDataLog, { type DataLogVM } from "./DetailDataLog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
// import { ApiStatus } from "../services/api-kyc";

/* ================= Types ================= */

type ConfirmKind = "approve" | "reject" | "override";

export type UiStatus =
  | "Pending"
  | "Approved"
  | "Rejected"
  | "Approved Override"
  | "Rejected Override";

export type DetailVM = {
  requestId?: string;
  transactionNo?: string;
  status?: UiStatus;

  // ID Card
  idcardImageUrl?: string | null;
  fullNameThai?: string | null;
  fullNameEng?: string | null;
  idNumber?: string | null;
  laserId?: string | null;
  dateOfBirth?: string | null;
  dateOfExpiry?: string | null;

  // Face
  idPhotoUrl?: string | null;
  selfieUrl?: string | null;
  faceMatchPercent?: number | null;

  // Bank
  bankBookImageUrl?: string | null;
  accountName?: string | null;
  accountNumber?: string | null;
  bank?: string | null;
  branch?: string | null;
  bankNameMatch?: boolean | null;

  // Data Log
  dataLog?: DataLogVM | null;
};

/* ============ Safe field readers ============ */
function getStringField(obj: unknown, key: string): string | null {
  if (
    obj &&
    typeof obj === "object" &&
    key in (obj as Record<string, unknown>)
  ) {
    const v = (obj as Record<string, unknown>)[key];
    return typeof v === "string" && v.trim() !== "" ? v : null;
  }
  return null;
}

function getNumberField(obj: unknown, key: string): number | null {
  if (
    obj &&
    typeof obj === "object" &&
    key in (obj as Record<string, unknown>)
  ) {
    const v = (obj as Record<string, unknown>)[key];
    return typeof v === "number" && Number.isFinite(v) ? v : null;
  }
  return null;
}

// เรียกตรงไป backend จริงจาก browser (ต้องเปิด CORS ที่ฝั่ง 3205)
const API_KYC_REQUEST =
  process.env.NEXT_PUBLIC_API_KYC_REQUEST ?? "http://141.11.156.52:3205";

/** ดึง access token จาก session ของ NextAuth แบบ type-safe (ไม่ใช้ any) */
function extractAccessToken(session: unknown): string | null {
  if (!session || typeof session !== "object") return null;
  const root = session as Record<string, unknown>;
  const user =
    typeof root.user === "object" && root.user
      ? (root.user as Record<string, unknown>)
      : undefined;

  const candidates = [
    root["accessToken"],
    root["access_token"],
    root["token"],
    user?.["accessToken"],
  ];

  for (const c of candidates) {
    if (typeof c === "string" && c.trim() !== "") return c;
  }
  return null;
}

/** map action → สถานะฝั่ง backend */
type ApiStatus =
  | "approved"
  | "rejected"
  | "approved override"
  | "rejected override";

function actionToApiStatus(kind: ConfirmKind, current?: UiStatus): ApiStatus {
  if (kind === "approve") return "approved";
  if (kind === "reject") return "rejected";
  const cur = (current ?? "").toLowerCase();
  if (cur.includes("approved")) return "rejected override";
  if (cur.includes("rejected")) return "approved override";
  return "approved override";
}

/* ============ Mapper: KycRequestApi → DetailVM ============ */

function mapStatus(s?: string | null): UiStatus {
  const t = (s ?? "").toLowerCase();
  if (t.includes("approved override")) return "Approved Override";
  if (t.includes("rejected override")) return "Rejected Override";
  if (t.includes("approved")) return "Approved";
  if (t.includes("rejected")) return "Rejected";
  return "Pending";
}

function coalesceName(thFirst?: string | null, thLast?: string | null) {
  const a = [thFirst ?? "", thLast ?? ""].map((x) => x.trim()).filter(Boolean);
  return a.length ? a.join(" ") : null;
}

function computeBankNameMatch(api: KycRequestApi): boolean | null {
  const ct = api.crossThaiNameMatchPercent;
  const ce = api.crossEnglishNameMatchPercent;
  if (ct == null && ce == null) return null;
  return (ct ?? 0) === 100 && (ce ?? 0) === 100;
}
function fromApiToDetailVM(api: KycRequestApi): DetailVM {
  const fullNameThai =
    coalesceName(api.idcardEdit?.firstNameThai, api.idcardEdit?.lastNameThai) ??
    coalesceName(
      api.idcardOrigin?.firstNameThai,
      api.idcardOrigin?.lastNameThai
    );

  const fullNameEng =
    coalesceName(api.idcardEdit?.firstNameEng, api.idcardEdit?.lastNameEng) ??
    coalesceName(api.idcardOrigin?.firstNameEng, api.idcardOrigin?.lastNameEng);

  return {
    requestId: api.id,
    transactionNo: api.correlationId ?? undefined,
    status: mapStatus(api.status),

    // ID Card
    idcardImageUrl: getStringField(api, "idcardImageUrl"),
    fullNameThai,
    fullNameEng,
    idNumber: api.idcardEdit?.idNumber ?? null,
    laserId: getStringField(api.idcardEdit, "laserId"),
    dateOfBirth: api.idcardEdit?.dateOfBirth ?? null,
    dateOfExpiry: api.idcardEdit?.dateOfExpiry ?? null,

    // Face
    idPhotoUrl: getStringField(api, "idPhotoUrl"),
    selfieUrl: getStringField(api, "selfieUrl"),
    faceMatchPercent: getNumberField(api, "faceMatchPercent"),

    // Bank
    bankBookImageUrl: getStringField(api, "bankBookImageUrl"),
    accountName:
      api.bookbankEdit?.accountNameThai ??
      api.bookbankOrigin?.accountNameThai ??
      api.bookbankEdit?.accountNameEng ??
      api.bookbankOrigin?.accountNameEng ??
      null,
    accountNumber:
      api.bookbankOrigin?.accountNo ?? api.bookbankEdit?.accountNo ?? null,
    bank: api.bookbankEdit?.bankName ?? null,
    branch: api.bookbankEdit?.branchName ?? null,
    bankNameMatch: computeBankNameMatch(api),

    dataLog: null,
  };
}

/* ============ helpers ============ */
const STATUS_BADGE_CLASS: Record<UiStatus, string> = {
  Pending: "bg-yellow-100 text-yellow-800",
  Approved: "bg-green-100 text-green-700",
  Rejected: "bg-red-100 text-red-700",
  "Approved Override": "bg-green-100 text-green-700",
  "Rejected Override": "bg-red-100 text-red-700",
};

function StatusBadge({ status }: { status?: UiStatus }) {
  if (!status) return null;
  return (
    <Badge
      variant="outline"
      className={cn("border-none", STATUS_BADGE_CLASS[status])}
    >
      {status}
    </Badge>
  );
}

function fmtDate(iso?: string | null) {
  if (!iso) return "-";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "-" : d.toLocaleDateString();
}

function gradeConfidence(
  pct: number | null | undefined
): "High" | "Moderate" | "Low" | "-" {
  if (pct == null) return "-";
  if (pct >= 85) return "High";
  if (pct >= 65) return "Moderate";
  return "Low";
}

function Field({
  label,
  value,
}: {
  label: string;
  value?: React.ReactNode | null;
}) {
  return (
    <div className="flex items-center justify-between w-full ">
      <span className="text-xs font-normal">{label}</span>
      <span className="text-sm font-normal ml-4 text-right truncate max-w-[60%]">
        {value ?? "-"}
      </span>
    </div>
  );
}

function ImageSlot({
  src,
  alt,
  width = 320,
  height = 128, // default เป็น number
  fallback = "doc",
}: {
  src?: string | null;
  alt: string;
  width?: number; // px
  height?: string | number; // รับได้ทั้ง string/number แต่จะถูกแปลงเป็น number ก่อนส่งให้ <Image/>
  fallback?: "doc" | "face";
}) {
  const fallbackSrc =
    fallback === "face"
      ? "/detail-view/no-people.jpg"
      : "/detail-view/no-pictures.png";

  const finalSrc = src && String(src).trim() !== "" ? String(src) : fallbackSrc;
  const isExternal = /^https?:\/\//i.test(finalSrc);

  // แปลง height -> number (รองรับ "128", "h-24", ฯลฯ)
  const heightNum: number =
    typeof height === "number"
      ? height
      : (() => {
          const m = String(height).match(/\d+/);
          return m ? parseInt(m[0], 10) : 128; // fallback
        })();

  return (
    <div className="w-full rounded-md border overflow-hidden">
      <Image
        src={finalSrc}
        alt={alt}
        width={width}
        height={heightNum} // ✅ ส่งเป็น number ตามที่ Next/Image ต้องการ
        style={{ objectFit: "cover", width: "100%", height: "auto" }}
        unoptimized={isExternal}
      />
    </div>
  );
}

function SectionFrame({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("p-4", className)}>
      <h3 className="mb-4 font-semibold text-xl ">{title}</h3>
      {children}
    </Card>
  );
}

/* ============ Status Banner (อยู่เหนือ Tabs) ============ */
function statusTheme(status?: UiStatus) {
  switch (status) {
    case "Approved":
    case "Approved Override":
      return {
        border: "border border-[#008362]",
        bg: "bg-white",
        textMain: "text-emerald-700 text-sm",
        textLink: "text-[#008362] text-sm",
        iconSrc: "/mark/correct-mark.png",
        iconAlt: "Approved",
      };
    case "Rejected":
    case "Rejected Override":
      return {
        border: "border border-[#991B1B]",
        bg: "bg-white",
        textMain: "text-rose-700 text-sm",
        textLink: "text-[#991B1B] text-sm",
        iconSrc: "/mark/wrong-mark.png",
        iconAlt: "Rejected",
      };
    default:
      return {
        border: "border border-[#854D0E]",
        bg: "bg-white",
        textMain: "text-amber-700 text-sm",
        textLink: "text-[#854D0E] text-sm",
        iconSrc: "/mark/exclamation-mark.png",
        iconAlt: "Pending",
      };
  }
}

function VerificationStatusBanner({ status }: { status?: UiStatus }) {
  const T = statusTheme(status);
  return (
    <div className={cn("m-4 rounded-xl border p-4", T.border, T.bg)}>
      <div className="flex items-center gap-4">
        <div className="shrink-0">
          <Image
            src={T.iconSrc}
            alt={T.iconAlt}
            width={24}
            height={24}
            className="size-[52px]"
            priority
          />
        </div>
        <div>
          <p className="text-sm font-normal text-semibold">
            Verification Status
          </p>
          <p className={cn("text-sm text-normal text-black")}>
            Status : <span className={cn(T.textLink)}>{status ?? "-"}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

/* ============ Action Footer & Confirm Dialog ============ */

function ActionFooter({
  status,
  onAskApprove,
  onAskReject,
  onAskOverride,
}: {
  status?: UiStatus;
  onAskApprove: () => void;
  onAskReject: () => void;
  onAskOverride: () => void;
}) {
  if (!status) return null;

  if (status === "Rejected Override" || status === "Approved Override") {
    return (
      <div className="flex flex-1 justify-between items-center p-4 gap-2 rounded-[8px] text-black bg-[var(--Primary-Alert,_#FFB201)]">
        <Image
          src="/mark/warning.svg"
          alt="Notice"
          width={24}
          height={24}
          className="size-[24px]"
        />
        <p className="text-xs font-normal">
          This KYC verification has been overrided and no further actions are
          requires
        </p>
      </div>
    );
  }

  if (status === "Pending") {
    return (
      <div className="flex items-center justify-center gap-2">
        <Button
          onClick={onAskApprove}
          className="flex-1 p-2 rounded-[12px] bg-[#17B26A] text-lg font-normal text-white hover:bg-[#067647]"
        >
          Approve
        </Button>
        <Button
          onClick={onAskReject}
          className="flex-1 p-2 rounded-[12px] bg-[#D92D20] text-lg font-normal text-white hover:bg-[#912018]"
        >
          Reject
        </Button>
      </div>
    );
  }

  if (status === "Approved") {
    return (
      <Button
        onClick={onAskOverride}
        className="w-full rounded-[12px] bg-[#D92D20] p-2 text-lg font-normal text-white hover:bg-[#912018]"
      >
        Override & Rejected
      </Button>
    );
  }

  if (status === "Rejected") {
    return (
      <Button
        onClick={onAskOverride}
        className="w-full rounded-[12px] bg-[#17B26A] p-2 text-lg font-normal text-white hover:bg-[#067647]"
      >
        Override & Approve
      </Button>
    );
  }

  return null;
}

function ConfirmDialog({
  open,
  kind,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  kind: ConfirmKind;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const config = {
    approve: {
      title: "Approve",
      desc: (
        <>
          Are you sure you want to approve
          <br />
          this applicant?
        </>
      ),
      img: "/mark/correct-mark.png",
      btnClass:
        "rounded-[12px] bg-[#1C55D9] text-white hover:bg-[#0F2D73] px-5 py-2",
      btnText: "Approve",
    },
    reject: {
      title: "Reject",
      desc: (
        <>
          Are you sure you want to reject
          <br />
          this applicant?
        </>
      ),
      img: "/mark/wrong-mark.png",
      btnClass:
        "rounded-[12px] bg-[#1C55D9] text-white hover:bg-[#0F2D73] px-5 py-2",
      btnText: "Reject",
    },
    override: {
      title: "Override",
      desc: (
        <>
          Are you sure you want to override
          <br />
          this applicant?
        </>
      ),
      img: "/mark/override-error.png",
      btnClass:
        "rounded-[12px] bg-[#1C55D9] text-white hover:bg-[#0F2D73] px-5 py-2",
      btnText: "Override",
    },
  }[kind];

  // id สำหรับ aria-describedby (unique per kind)
  const descId = `confirm-dialog-desc-${kind}`;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent
        aria-describedby={descId}
        className="inline-grid grid-cols-[max-content] auto-rows-auto gap-y-4 p-4"
        overlayClassName="bg-black/60"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">{config.title}</DialogTitle>

        <div id={descId} className="sr-only">
          {config.desc}
        </div>

        <div className="flex flex-col items-center text-center">
          <Image
            src={config.img}
            alt={config.title}
            width={120}
            height={120}
            priority
          />
          <h3 className="text-xl font-semibold mt-3 mb-1">{config.title}</h3>
          <p className="mt-1 mx-auto px-12 inline-block w-fit text-center text-[#4B5563] text-sm leading-5 font-normal">
            {config.desc}
          </p>
        </div>

        <DialogFooter className="w-full flex-row items-stretch gap-2 sm:justify-center">
          <Button
            variant="ghost"
            onClick={onCancel}
            className="flex-1 h-12 rounded-[12px] border border-[#1C55D9] text-[#1C55D9] hover:bg-[#EFF7FF] hover:text-[#1C55D9]"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className={cn("flex-1 h-12 rounded-[12px]", config.btnClass)}
          >
            {config.btnText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ============ Main ============ */
export default function DetailView({
  open,
  onClose,
  width = 360,
  data,
  detail,
  className,
  footer,
  showFooterDivider = false,
  onStatusChanged,
}: {
  open: boolean;
  onClose: () => void;
  width?: number;
  data: KycRequestApi | null;
  detail?: DetailVM | null;
  className?: string;
  footer?: React.ReactNode;
  showFooterDivider?: boolean;
  onStatusChanged?: (newStatus: UiStatus) => void;
}) {
  const [tab, setTab] = React.useState<"verification" | "data-log">(
    "verification"
  );
  const saRef = React.useRef<HTMLDivElement>(null);
  const [dockFooter, setDockFooter] = React.useState(false);
  const [confirm, setConfirm] = React.useState<ConfirmKind | null>(null);

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

  function computeNewStatusForAction(
    kind: ConfirmKind,
    current?: UiStatus
  ): UiStatus {
    if (kind === "approve") return "Approved";
    if (kind === "reject") return "Rejected";
    // override: สลับไปฝั่งตรงข้ามพร้อมติดป้าย Override
    const cur = (current ?? "").toLowerCase();
    if (cur.includes("approved")) return "Rejected Override";
    if (cur.includes("rejected")) return "Approved Override";
    return "Approved Override";
  }

  function actionToApiStatus(kind: ConfirmKind, current?: UiStatus): ApiStatus {
    if (kind === "approve") return "approved";
    if (kind === "reject") return "rejected";
    const cur = (current ?? "").toLowerCase();
    if (cur.includes("approved")) return "rejected override";
    if (cur.includes("rejected")) return "approved override";
    return "approved override";
  }

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
    const tx = resolvedDetail?.transactionNo ?? data?.correlationId ?? "-";

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

  // visibleStatus prefers localStatus (optimistic)
  const visibleStatus: UiStatus | undefined =
    localStatus ??
    resolvedDetail?.status ??
    (data ? mapStatus(data.status) : undefined);

  // scroll handling (dock footer)
  React.useEffect(() => {
    const root = saRef.current;
    if (!root) return;
    const viewport = root.querySelector(
      "[data-radix-scroll-area-viewport]"
    ) as HTMLElement | null;
    if (!viewport) return;

    const onScroll = () =>
      setDockFooter((prev) => prev || viewport.scrollTop > 0);
    viewport.addEventListener("scroll", onScroll, { passive: true });
    return () => viewport.removeEventListener("scroll", onScroll);
  }, [open, tab]);

  // reset dockFooter when open/tab changes
  React.useEffect(() => {
    if (open) setDockFooter(false);
  }, [open, tab]);

  // debug logs
  React.useEffect(() => {
    if (!open) return;

    const tx = resolvedDetail?.transactionNo ?? data?.correlationId ?? "-";
    const vis = visibleStatus ?? "-";

    // ==== กลุ่มสรุปสถานะโดยรวม ====
    console.groupCollapsed(`🔎 DetailView opened: tx=${tx} status=${vis}`);
    console.log("props.detail (UI VM):", detail);
    console.log("props.data (API KycRequestApi):", data);
    console.log("resolvedDetail (UI VM):", resolvedDetail);
    console.table({
      transactionNo: resolvedDetail?.transactionNo ?? null,
      status: resolvedDetail?.status ?? null,
      fullNameThai: resolvedDetail?.fullNameThai ?? null,
      fullNameEng: resolvedDetail?.fullNameEng ?? null,
      idNumber: resolvedDetail?.idNumber ?? null,
      bank: resolvedDetail?.bank ?? null,
      branch: resolvedDetail?.branch ?? null,
      accountName: resolvedDetail?.accountName ?? null,
      accountNumber: resolvedDetail?.accountNumber ?? null,
      faceMatchPercent: resolvedDetail?.faceMatchPercent ?? null,
      bankNameMatch__strictCross100: resolvedDetail?.bankNameMatch ?? null,
    });
    console.groupEnd();

    // ==== กลุ่ม percents แบบละเอียดจาก API ====
    if (data) {
      console.groupCollapsed("📊 Match Percents (API raw)");
      console.table({
        idcardThaiNameMatchPercent: data.idcardThaiNameMatchPercent,
        idcardEnglishNameMatchPercent: data.idcardEnglishNameMatchPercent,
        bookbankThaiNameMatchPercent: data.bookbankThaiNameMatchPercent,
        bookbankEnglishNameMatchPercent: data.bookbankEnglishNameMatchPercent,
        crossThaiNameMatchPercent: data.crossThaiNameMatchPercent,
        crossEnglishNameMatchPercent: data.crossEnglishNameMatchPercent,
      });

      const crossThai = data.crossThaiNameMatchPercent ?? null;
      const crossEng = data.crossEnglishNameMatchPercent ?? null;
      const strictCross100 =
        (crossThai ?? 0) === 100 && (crossEng ?? 0) === 100;

      console.log(
        `✅ bankNameMatch (strict by cross*===100%):`,
        strictCross100,
        { crossThai, crossEng }
      );
      console.groupEnd();

      // ==== กลุ่มข้อมูลชื่อ-บัญชี / เอกสาร ====
      console.groupCollapsed("🧾 Identity & Bank (API raw)");
      console.table({
        idcardEdit_fullNameTH: `${data.idcardEdit?.titleNameThai ?? ""} ${
          data.idcardEdit?.firstNameThai ?? ""
        } ${data.idcardEdit?.lastNameThai ?? ""}`.trim(),
        idcardEdit_fullNameEN: `${data.idcardEdit?.titleNameEng ?? ""} ${
          data.idcardEdit?.firstNameEng ?? ""
        } ${data.idcardEdit?.lastNameEng ?? ""}`.trim(),
        idcardOrigin_fullNameTH: `${data.idcardOrigin?.titleNameThai ?? ""} ${
          data.idcardOrigin?.firstNameThai ?? ""
        } ${data.idcardOrigin?.lastNameThai ?? ""}`.trim(),
        idcardOrigin_fullNameEN: `${data.idcardOrigin?.titleNameEng ?? ""} ${
          data.idcardOrigin?.firstNameEng ?? ""
        } ${data.idcardOrigin?.lastNameEng ?? ""}`.trim(),
        bookbankEdit_accountNameTH: data.bookbankEdit?.accountNameThai ?? null,
        bookbankEdit_accountNameEN: data.bookbankEdit?.accountNameEng ?? null,
        bookbankEdit_accountNo: data.bookbankEdit?.accountNo ?? null,
        bookbankEdit_bank: data.bookbankEdit?.bankName ?? null,
        bookbankEdit_branch: data.bookbankEdit?.branchName ?? null,
        bookbankOrigin_accountNameTH:
          data.bookbankOrigin?.accountNameThai ?? null,
        bookbankOrigin_accountNameEN:
          data.bookbankOrigin?.accountNameEng ?? null,
        bookbankOrigin_accountNo: data.bookbankOrigin?.accountNo ?? null,
        bookbankOrigin_bank: data.bookbankOrigin?.bankName ?? null,
        bookbankOrigin_branch: data.bookbankOrigin?.branchName ?? null,
      });
      console.groupEnd();

      // ==== กลุ่ม timestamps/status ====
      console.groupCollapsed("⏱️ Timeline & Status (API raw)");
      console.table({
        status: data.status,
        requestedAt: data.requestedAt,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        companyId: data.companyId,
        email: data.email,
        id: data.id,
        correlationId: data.correlationId,
        images_count: Array.isArray(data.images) ? data.images.length : 0,
      });
      if (Array.isArray(data.images) && data.images.length) {
        console.log("images:", data.images);
      }
      console.groupEnd();
    }
  }, [open, resolvedDetail, detail, data, visibleStatus]);

  React.useEffect(() => {
    if (!confirm) return;
    const tx = resolvedDetail?.transactionNo ?? data?.correlationId ?? "-";
    console.log(`🧾 ConfirmDialog: kind=${confirm} tx=${tx}`);
  }, [confirm, resolvedDetail, data]);

  // Debug ดู session ตอน mount/เปลี่ยน
  React.useEffect(() => {
    console.groupCollapsed("[DetailView] session snapshot");
    console.log("authStatus:", authStatus);
    console.log("has accessToken:", Boolean(session?.accessToken));
    if (session?.accessToken) {
      console.log(
        "accessToken preview:",
        session.accessToken.slice(0, 6) + "…" + session.accessToken.slice(-4)
      );
    }
    console.log("session.user:", session?.user);
    console.groupEnd();
  }, [session, authStatus]);

  if (!open) return null;

  return (
    <aside
      className={cn(
        " bg-background h-full overflow-hidden flex flex-col",
        className
      )}
      style={{ width }}
      aria-hidden={!open}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4">
        <h2 className="font-semibold text-xl ">Application Details</h2>
        <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">
          <X className="h-6 w-6 text-[#9CA3AF] size-6" />
        </Button>
      </div>

      {/* Status banner ABOVE tabs */}
      <VerificationStatusBanner status={visibleStatus} />
      <Separator />

      {/* Body & Tabs */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea ref={saRef} className="h-full p-4">
          {/* Tabs header — เลื่อนไปพร้อม Body */}
          <div className="pb-4">
            <Tabs
              value={tab}
              onValueChange={(v) => setTab(v as "verification" | "data-log")}
              className="w-full"
            >
              {(() => {
                const tabsListCls = cn(
                  "flex w-full max-w-[352px] p-1 justify-center rounded-[50px] bg-[#ECECF0]/80",
                  "gap-2"
                );
                const triggerCls = cn(
                  "flex-none font-normal text-sm",
                  "data-[state=active]:bg-white",
                  "data-[state=active]:rounded-[50px]",
                  "data-[state=active]:px-3 data-[state=active]:py-1",
                  "data-[state=active]:shadow-none",
                  "data-[state=active]:outline-none data-[state=active]:ring-0"
                );
                return (
                  <TabsList className={tabsListCls}>
                    <TabsTrigger value="verification" className={triggerCls}>
                      <Image
                        src="/mark/check-circle.svg"
                        alt="Verification"
                        width={16}
                        height={16}
                        className="inline-block"
                        priority
                      />
                      <span className="pl-6 pr-6">Verification</span>
                    </TabsTrigger>
                    <TabsTrigger value="data-log" className={triggerCls}>
                      <Image
                        src="/mark/hard-drive.svg"
                        alt="Data Log"
                        width={16}
                        height={16}
                        className="inline-block"
                        priority
                      />
                      <span className="pl-6 pr-6">Data Log</span>
                    </TabsTrigger>
                  </TabsList>
                );
              })()}
            </Tabs>
          </div>

          {/* เนื้อหาแต่ละแท็บ */}
          {tab === "verification" ? (
            !resolvedDetail ? (
              <p className="text-sm text-muted-foreground">No selection</p>
            ) : (
              <div className="space-y-4 text-sm">
                {/* ID Card Section */}
                <SectionFrame
                  title="ID Card Verification"
                  className="border-0 p-0 gap-0 shadow-none ring-0 "
                >
                  <div className="bg-[#F9FAFC] rounded-[12px]">
                    <div className="py-6 px-4 space-y-4">
                      <div className="col-span-2">
                        <ImageSlot
                          src={resolvedDetail.idcardImageUrl ?? undefined}
                          alt="ID Card"
                          height="h-32"
                          fallback="doc"
                        />
                      </div>
                      <Field
                        label="Full Name (TH)"
                        value={resolvedDetail.fullNameThai}
                      />
                      <Field
                        label="Full Name (ENG)"
                        value={resolvedDetail.fullNameEng}
                      />
                      <Field
                        label="ID Number"
                        value={resolvedDetail.idNumber}
                      />
                      <Field label="Laser ID" value={resolvedDetail.laserId} />
                      <Field
                        label="Date of Birth"
                        value={fmtDate(resolvedDetail.dateOfBirth)}
                      />
                      <Field
                        label="Date of Expiry"
                        value={fmtDate(resolvedDetail.dateOfExpiry)}
                      />
                    </div>
                  </div>
                </SectionFrame>

                {/* Face Section */}
                <SectionFrame
                  title="Face Verification"
                  className="border-0 p-0 gap-0 shadow-none ring-0 "
                >
                  <div className="bg-[#F9FAFC] rounded-[12px]">
                    <div className="p-4 flex items-center gap-2">
                      {/* ซ้าย: ID Photo / Selfie */}
                      <div className="flex gap-2">
                        <div className="flex flex-col items-center gap-3">
                          <span className="text-base font-normal">
                            ID Photo
                          </span>
                          <div className="rounded-xl overflow-hidden bg-white p-1 shadow-sm">
                            <ImageSlot
                              src={resolvedDetail.idPhotoUrl ?? undefined}
                              alt="ID Photo"
                              height="h-24"
                              fallback="face"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col items-center gap-3">
                          <span className="text-base font-normal">Selfie</span>
                          <div className="rounded-xl overflow-hidden bg-white p-1 shadow-sm">
                            <ImageSlot
                              src={resolvedDetail.selfieUrl ?? undefined}
                              alt="Selfie"
                              height="h-24"
                              fallback="face"
                            />
                          </div>
                        </div>
                      </div>

                      {/* ขวา: % + ข้อความ + Badge ระดับ */}
                      <div className="ml-auto flex flex-col items-center">
                        {(() => {
                          const pct = resolvedDetail.faceMatchPercent ?? null;
                          const pctText =
                            pct != null ? `${Math.round(pct)}%` : "-";
                          const grade = gradeConfidence(pct);

                          const pctColor =
                            grade === "High"
                              ? "text-[#10B981]"
                              : grade === "Moderate"
                              ? "text-[#D97706]"
                              : grade === "Low"
                              ? "text-[#EF4444]"
                              : "text-foreground";

                          const badgeCls =
                            grade === "High"
                              ? "bg-[#E8F7EE] text-[#16A34A] border border-[#A7F3D0]"
                              : grade === "Moderate"
                              ? "bg-[#FFF7E6] text-[#B45309] border border-[#FCD34D]"
                              : grade === "Low"
                              ? "bg-[#FEE2E2] text-[#B91C1C] border border-[#FCA5A5]"
                              : "bg-muted text-muted-foreground";

                          return (
                            <>
                              <div
                                className={cn(
                                  "font-semibold leading-none text-5xl",
                                  pctColor
                                )}
                              >
                                {pctText}
                              </div>
                              <div className="mt-3 text-[13px] font-normal items-center whitespace-nowrap">
                                Match confidence
                              </div>
                              <Badge
                                className={cn(
                                  "mt-2 rounded-full px-3 py-1 text-sm",
                                  badgeCls
                                )}
                              >
                                {grade}
                              </Badge>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </SectionFrame>

                {/* Bank Section */}
                <SectionFrame
                  title="Bank Verification"
                  className="border-0 p-0 gap-0 shadow-none ring-0 "
                >
                  <div className="bg-[#F9FAFC] rounded-[12px]">
                    <div className="py-6 px-4 space-y-4">
                      <div className="col-span-2">
                        <ImageSlot
                          src={resolvedDetail.bankBookImageUrl ?? undefined}
                          alt="Bank book"
                          height="h-28"
                          fallback="doc"
                        />
                      </div>
                      <Field
                        label="Account Name"
                        value={resolvedDetail.accountName}
                      />
                      <Field
                        label="Account Number"
                        value={resolvedDetail.accountNumber}
                      />
                      <Field label="Bank" value={resolvedDetail.bank} />
                      <Field label="Branch" value={resolvedDetail.branch} />
                      <Field
                        label="Name Matching"
                        value={
                          resolvedDetail.bankNameMatch == null ? (
                            "-"
                          ) : (
                            <Badge
                              className={cn(
                                "border-none px-2 py-0.5 text-sm font-normal",
                                resolvedDetail.bankNameMatch
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              )}
                            >
                              {resolvedDetail.bankNameMatch
                                ? "Match"
                                : "Not match"}
                            </Badge>
                          )
                        }
                      />
                    </div>
                  </div>
                </SectionFrame>
              </div>
            )
          ) : (
            <DetailDataLog dataLog={resolvedDetail?.dataLog} />
          )}

          {/* Footer — ใช้ร่วมกันทั้งสองแท็บ */}
          <div
            className={cn(
              dockFooter
                ? "p-4"
                : "sticky bottom-0 -mx-4 px-6 pb-4 pt-2 bg-background"
            )}
          >
            {footer ?? (
              <ActionFooter
                status={visibleStatus}
                onAskApprove={() => setConfirm("approve")}
                onAskReject={() => setConfirm("reject")}
                onAskOverride={() => setConfirm("override")}
              />
            )}
          </div>
        </ScrollArea>
      </div>

      {showFooterDivider ? <Separator /> : null}

      {/* Confirm Modals */}
      {confirm && (
        <ConfirmDialog
          open={true}
          kind={confirm}
          onCancel={() => setConfirm(null)}
          onConfirm={handleConfirm}
        />
      )}
    </aside>
  );
}
