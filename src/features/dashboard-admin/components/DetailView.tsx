"use client";

import Image from "next/image";
import * as React from "react";
import { useDetailView } from "../hooks/useDetailView";
import { useDockFooter } from "../hooks/useDockFooter";
import { fmtDate, gradeConfidence } from "../helpers/format";
import { STATUS_BADGE_CLASS } from "../helpers/status";
import type { KycRequestApi } from "../types/kyc";
import type { DetailVM, UiStatus, ConfirmKind } from "../types/detail";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DetailDataLog from "./DetailDataLog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";

/* ================= Types =================
   (คงไว้ที่นี่เพราะเป็นหน้าจอ UI หลัก; ชนิดเพิ่มเติมไปอยู่ที่ features/.../types/detail.ts)
*/
export type { UiStatus, DetailVM, ConfirmKind };

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

  // ---------- START: optimistic status (DO NOT MODIFY OTHER LINES) ----------
  // local optimistic UI state for status  (คงคอมเมนต์เดิมจากไฟล์ก่อน refactor)
  // resolvedDetail is computed below; we reference it in effect so keep order (hooks first)
  // ---------- END: will sync after resolvedDetail declaration ----------

  const {
    session,
    authStatus,
    resolvedDetail,
    visibleStatus,
    confirm,
    setConfirm,
    handleConfirm,
  } = useDetailView(open, detail ?? null, data, onStatusChanged);

  const dockFooter = useDockFooter(open, tab, saRef);

  // debug logs (คงเดิม)
  React.useEffect(() => {
    if (!open) return;
    const tx = resolvedDetail?.transactionNo ?? data?.correlationId ?? "N/A";
    const vis = visibleStatus ?? "N/A";
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
  }, [open, resolvedDetail, data, detail, visibleStatus]);

  // Debug ดู session ตอน mount/เปลี่ยน (คงเดิม)
  React.useEffect(() => {
    console.groupCollapsed("[DetailView] session snapshot");
    console.log("authStatus:", authStatus);
    console.log("has accessToken:", Boolean((session as any)?.accessToken));
    const token: string | undefined = (session as any)?.accessToken;
    if (token) {
      console.log(
        "accessToken preview:",
        token.slice(0, 6) + "…" + token.slice(-4)
      );
    }
    console.log("session.user:", (session as any)?.user);
    console.groupEnd();
  }, [session, authStatus]);

  React.useEffect(() => {
    if (open) {
      try {
        window.dispatchEvent(new CustomEvent("dashboard:detail-opened"));
      } catch {
        /* noop */
      }
    }
  }, [open]);

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

                      {/* ขวา: คะแนน */}
                      <div className="flex-1 ml-2">
                        <div className="rounded-lg bg-white p-3 grid gap-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm">Face Matching</p>
                            {(() => {
                              const pct =
                                resolvedDetail.faceMatchPercent ?? null;
                              const grade = gradeConfidence(pct);
                              const badgeCls =
                                grade === "High"
                                  ? "bg-green-100 text-green-700"
                                  : grade === "Moderate"
                                  ? "bg-[#FFF7E6] text-[#B45309]"
                                  : grade === "Low"
                                  ? "bg-[#FEE2E2] text-[#B91C1C]"
                                  : "bg-muted text-muted-foreground";
                              return (
                                <>
                                  <Badge
                                    className={cn(
                                      "border-none px-2 py-0.5 text-sm font-normal",
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
                            "N/A"
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

/* ============ helpers UI (คงสไตล์เดิมทุกจุด) ============ */
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
        {value ?? "N/A"}
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
            Status : <span className={cn(T.textLink)}>{status ?? "N/A"}</span>
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
      img: "/mark/override-error.png",
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
          the current decision?
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
