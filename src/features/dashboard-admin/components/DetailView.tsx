"use client";

import * as React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Kycrequest } from "../components/column";
import { cn } from "@/lib/utils";
import { X, CheckCircle2, XCircle, AlertCircle, FileClock } from "lucide-react";
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
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm">{value ?? "-"}</p>
    </div>
  );
}

function ImageSlot({
  src,
  alt,
  label,
  height = "h-24",
}: {
  src?: string | null;
  alt: string;
  label: string;
  height?: string;
}) {
  return (
    <div>
      {src ? (
        <img
          src={src}
          alt={alt}
          className={cn("w-full rounded-md border object-cover", height)}
        />
      ) : (
        <div
          className={cn(
            height,
            "rounded-md border flex items-center justify-center text-sm text-muted-foreground"
          )}
        >
          No Image
        </div>
      )}
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function SectionFrame({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-4">
      <h3 className="mb-3 font-medium">{title}</h3>
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
        border: "border-emerald-400",
        bg: "bg-emerald-50",
        textMain: "text-emerald-700",
        textLink: "text-emerald-700",
        Icon: CheckCircle2,
      };
    case "Rejected":
    case "Rejected Override":
      return {
        border: "border-rose-400",
        bg: "bg-rose-50",
        textMain: "text-rose-700",
        textLink: "text-rose-700",
        Icon: XCircle,
      };
    default:
      return {
        border: "border-amber-400",
        bg: "bg-amber-50",
        textMain: "text-amber-700",
        textLink: "text-amber-700",
        Icon: AlertCircle,
      };
  }
}

function VerificationStatusBanner({ status }: { status?: UiStatus }) {
  const T = statusTheme(status);
  const Icon = T.Icon;
  return (
    <div className={cn("mx-4 mt-4 rounded-xl border p-4", T.border, T.bg)}>
      <div className="flex items-center gap-3">
        <div className="shrink-0">
          <Icon className={cn("h-6 w-6", T.textMain)} />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">
            Verification Status
          </p>
          <p className={cn("text-sm", T.textMain)}>
            Status :{" "}
            <span className={cn("font-medium underline-offset-2", T.textLink)}>
              {status ?? "-"}
            </span>
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
        "border-l bg-background h-full overflow-hidden flex flex-col",
        className
      )}
      style={{ width }}
      aria-hidden={!open}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4">
        <h2 className="font-semibold text-xl ">Application Details</h2>
        <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">
          <X className="h-4 w-4 text-[#9CA3AF]" />
        </Button>
      </div>

      {/* NEW: Status banner ABOVE tabs */}
      <VerificationStatusBanner status={visibleStatus} />

      {/* Tabs header */}
      <div className="px-4 pb-2 pt-3">
        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as any)}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="verification" className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Verification
            </TabsTrigger>
            <TabsTrigger value="data-log" className="gap-2">
              <FileClock className="h-4 w-4" />
              Data Log
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Separator />

      {/* Body per tab */}
      <div className="flex-1 overflow-hidden">
        {/* Verification */}
        {tab === "verification" && (
          <ScrollArea className="h-full p-4">
            {!data && !detail ? (
              <p className="text-sm text-muted-foreground">No selection</p>
            ) : (
              <div className="space-y-4 text-sm">
                {/* Transaction card (ย้าย status ออกแล้ว) */}
                <Card className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        Transaction
                      </p>
                      <p className="font-medium">
                        {detail?.transactionNo ?? data?.transactionNo ?? "-"}
                      </p>
                    </div>
                    <StatusBadge status={visibleStatus} />
                  </div>
                </Card>

                {/* ID Card Section */}
                <SectionFrame title="ID Card Verification">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <ImageSlot
                        src={detail?.idcardImageUrl}
                        alt="ID Card"
                        label="ID Card"
                        height="h-32"
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
                </SectionFrame>

                {/* Face Section */}
                <SectionFrame title="Face Verification">
                  <div className="grid grid-cols-2 gap-3">
                    <ImageSlot
                      src={detail?.idPhotoUrl}
                      alt="ID Photo"
                      label="ID Photo"
                    />
                    <ImageSlot
                      src={detail?.selfieUrl}
                      alt="Selfie"
                      label="Selfie"
                    />
                    <div className="col-span-2">
                      {(() => {
                        const pct = detail?.faceMatchPercent ?? null;
                        const grade = gradeConfidence(pct);
                        return (
                          <div className="flex items-center gap-2">
                            <span>
                              Matching Confidence:{" "}
                              <b>{pct != null ? `${Math.round(pct)}%` : "-"}</b>
                            </span>
                            <Badge
                              className={cn(
                                "border-none",
                                grade === "High" &&
                                  "bg-green-100 text-green-700",
                                grade === "Moderate" &&
                                  "bg-yellow-100 text-yellow-800",
                                grade === "Low" && "bg-red-100 text-red-700"
                              )}
                            >
                              {grade}
                            </Badge>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </SectionFrame>

                {/* Bank Section */}
                <SectionFrame title="Bank Verification">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <ImageSlot
                        src={detail?.bankBookImageUrl}
                        alt="Bank book"
                        label="Bank book"
                        height="h-28"
                      />
                    </div>
                    <Field label="Account Name" value={detail?.accountName} />
                    <Field
                      label="Account Number"
                      value={detail?.accountNumber}
                    />
                    <Field label="Bank" value={detail?.bank} />
                    <Field label="Branch" value={detail?.branch} />
                    <div className="col-span-2">
                      <div className="flex items-center gap-2">
                        <span>Name Matching:</span>
                        <Badge
                          className={cn(
                            "border-none",
                            detail?.bankNameMatch
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          )}
                        >
                          {detail?.bankNameMatch ? "Match" : "Not match"}
                        </Badge>
                      </div>
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
