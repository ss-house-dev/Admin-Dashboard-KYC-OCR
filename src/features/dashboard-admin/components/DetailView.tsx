"use client";

import Image from "next/image";
import * as React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Kycrequest } from "../components/column";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DetailDataLog, { type DataLogVM } from "./DetailDataLog";

/* ================= Types ================= */
export type UiStatus =
  | "Pending"
  | "Approved"
  | "Rejected"
  | "Approved Override"
  | "Rejected Override";

export type DetailVM = {
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
  height = "h-24",
  fallback = "doc",
}: {
  src?: string | null;
  alt: string;
  height?: string;
  fallback?: "doc" | "face";
}) {
  const fallbackSrc =
    fallback === "face"
      ? "/detail-view/no-people.jpg"
      : "/detail-view/no-pictures.png";

  const finalSrc = src && src.trim() !== "" ? src : fallbackSrc;

  return (
    <img
      src={finalSrc}
      alt={alt}
      loading="lazy"
      className={cn("w-full rounded-md border object-cover", height)}
    />
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

/* ============ NEW: Status Banner (อยู่เหนือ Tabs) ============ */
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
            Status :{" "}
            <span className={cn("  ", T.textLink)}>{status ?? "-"}</span>
          </p>
        </div>
      </div>
    </div>
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
}: {
  open: boolean;
  onClose: () => void;
  width?: number;
  data: Kycrequest | null;
  detail?: DetailVM | null;
  className?: string;
  footer?: React.ReactNode;
}) {
  const [tab, setTab] = React.useState<"verification" | "data-log">(
    "verification"
  );
  if (!open) return null;

  const visibleStatus: UiStatus | undefined =
    (detail?.status as UiStatus | undefined) ??
    (data?.status as UiStatus | undefined);

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

      {/* NEW: Status banner ABOVE tabs */}
      <VerificationStatusBanner status={visibleStatus} />

      <Separator />

      {/* Body  tab */}
      <div className="flex-1 overflow-hidden">
        {/* Verification */}
        {tab === "verification" && (
          <ScrollArea className="h-full p-4">
            {/* Tabs header */}
            <div className="pb-4">
              <Tabs
                value={tab}
                onValueChange={(v) => setTab(v as any)}
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

            {!data && !detail ? (
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
                          src={detail?.idcardImageUrl}
                          alt="ID Card"
                          height="h-32"
                          fallback="doc"
                        />
                      </div>
                      <Field
                        label="Full Name (TH)"
                        value={detail?.fullNameThai}
                      />
                      <Field
                        label="Full Name (ENG)"
                        value={detail?.fullNameEng}
                      />
                      <Field label="ID Number" value={detail?.idNumber} />
                      <Field label="Laser ID" value={detail?.laserId} />
                      <Field
                        label="Date of Birth"
                        value={fmtDate(detail?.dateOfBirth)}
                      />
                      <Field
                        label="Date of Expiry"
                        value={fmtDate(detail?.dateOfExpiry)}
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
                          {/* กรอบขาวบาง ๆ รอบรูป */}
                          <div className="rounded-xl overflow-hidden bg-white p-1 shadow-sm">
                            <ImageSlot
                              src={detail?.idPhotoUrl}
                              alt="ID Photo"
                              height="h-24"
                              fallback="face"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col items-center gap-3">
                          <span className="text-base font-normal ">Selfie</span>
                          <div className="rounded-xl overflow-hidden bg-white p-1 shadow-sm">
                            <ImageSlot
                              src={detail?.selfieUrl}
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
                          const pct = detail?.faceMatchPercent ?? null;
                          const pctText =
                            pct != null ? `${Math.round(pct)}%` : "-";
                          const grade = gradeConfidence(pct);

                          const pctColor =
                            grade === "High"
                              ? "text-[#10B981]" // เขียว
                              : grade === "Moderate"
                              ? "text-[#D97706]" // เหลือง
                              : grade === "Low"
                              ? "text-[#EF4444]" // แดง
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
                          src={detail?.bankBookImageUrl}
                          alt="Bank book"
                          height="h-28"
                          fallback="doc"
                        />
                      </div>
                      <Field label="Account Name" value={detail?.accountName} />
                      <Field
                        label="Account Number"
                        value={detail?.accountNumber}
                      />
                      <Field label="Bank" value={detail?.bank} />
                      <Field label="Branch" value={detail?.branch} />
                      <Field
                        label="Name Matching"
                        value={
                          <Badge
                            className={cn(
                              "border-none px-2 py-0.5 text-sm font-normal",
                              detail?.bankNameMatch
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            )}
                          >
                            {detail?.bankNameMatch ? "Match" : "Not match"}
                          </Badge>
                        }
                      />
                    </div>
                  </div>
                </SectionFrame>
              </div>
            )}
          </ScrollArea>
        )}

        {/* Data Log */}
        {tab === "data-log" && (
          <ScrollArea className="h-full p-4">
            <DetailDataLog dataLog={detail?.dataLog} />
          </ScrollArea>
        )}
      </div>

      <Separator />
      <div className="p-4">{footer ?? null}</div>
    </aside>
  );
}
