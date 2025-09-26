"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/** ViewModel สำหรับ Data Log (ยืดหยุ่น/optional) */
export type DataLogVM = {
  idCard?: {
    thaiOriginalName?: string | null;
    thaiEditedName?: string | null;
    thaiSimilarityPercent?: number | null; // 0..100
    engOriginalName?: string | null;
    engEditedName?: string | null;
    engSimilarityPercent?: number | null; // 0..100
  };
  bankBook?: {
    thaiOriginalName?: string | null;
    thaiEditedName?: string | null;
    thaiSimilarityPercent?: number | null; // 0..100
    engOriginalName?: string | null;
    engEditedName?: string | null;
    engSimilarityPercent?: number | null; // 0..100
  };
};

export default function DetailDataLog({
  dataLog,
}: {
  dataLog?: DataLogVM | null;
}) {
  // DEBUG: log ให้ครบเวลาเปิดแท็บ Data Log
  React.useEffect(() => {
    console.groupCollapsed("📘 DetailDataLog mounted");
    console.log("props.dataLog:", dataLog);
    if (dataLog?.idCard) {
      console.groupCollapsed("🪪 ID Card");
      console.table({
        thaiOriginalName: dataLog.idCard.thaiOriginalName ?? null,
        thaiEditedName: dataLog.idCard.thaiEditedName ?? null,
        thaiSimilarityPercent: dataLog.idCard.thaiSimilarityPercent ?? null,
        engOriginalName: dataLog.idCard.engOriginalName ?? null,
        engEditedName: dataLog.idCard.engEditedName ?? null,
        engSimilarityPercent: dataLog.idCard.engSimilarityPercent ?? null,
      });
      console.groupEnd();
    }
    if (dataLog?.bankBook) {
      console.groupCollapsed("🏦 Bank Book");
      console.table({
        thaiOriginalName: dataLog.bankBook.thaiOriginalName ?? null,
        thaiEditedName: dataLog.bankBook.thaiEditedName ?? null,
        thaiSimilarityPercent: dataLog.bankBook.thaiSimilarityPercent ?? null,
        engOriginalName: dataLog.bankBook.engOriginalName ?? null,
        engEditedName: dataLog.bankBook.engEditedName ?? null,
        engSimilarityPercent: dataLog.bankBook.engSimilarityPercent ?? null,
      });
      console.groupEnd();
    }
    console.groupEnd();
  }, [dataLog]);

  if (!dataLog) {
    return (
      <Card className="p-6 text-sm text-muted-foreground">No Data Log</Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* ID Card Data */}
      <SectionFrame title="ID Card Data" className="border-0 p-0 shadow-none">
        <div className="rounded-[12px] bg-[#F9FAFC] px-4 py-6 space-y-4">
          <NameCompareBlock
            title="THAI"
            original={dataLog.idCard?.thaiOriginalName}
            edited={dataLog.idCard?.thaiEditedName}
            percent={dataLog.idCard?.thaiSimilarityPercent}
          />
          <NameCompareBlock
            title="ENG"
            original={dataLog.idCard?.engOriginalName}
            edited={dataLog.idCard?.engEditedName}
            percent={dataLog.idCard?.engSimilarityPercent}
          />
        </div>
      </SectionFrame>

      {/* Book Bank Data */}
      <SectionFrame title="Book Bank Data" className="border-0 p-0 shadow-none">
        <div className="rounded-[12px] bg-[#F9FAFC] px-4 py-6 space-y-4">
          <NameCompareBlock
            title="THAI"
            original={dataLog.bankBook?.thaiOriginalName}
            edited={dataLog.bankBook?.thaiEditedName}
            percent={dataLog.bankBook?.thaiSimilarityPercent}
          />
          <NameCompareBlock
            title="ENG"
            original={dataLog.bankBook?.engOriginalName}
            edited={dataLog.bankBook?.engEditedName}
            percent={dataLog.bankBook?.engSimilarityPercent}
          />
        </div>
      </SectionFrame>
    </div>
  );
}

/* ============ Internal sub-components ============ */

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
      <h3 className="mb-3 font-medium text-lg">{title}</h3>
      {children}
    </Card>
  );
}

function NameCompareBlock({
  title,
  original,
  edited,
  percent,
}: {
  title: "THAI" | "ENG";
  original?: string | null;
  edited?: string | null;
  percent?: number | null;
}) {
  const badge = percentBadge(percent);

  return (
    <div className="rounded-lg bg-white/60 p-3">
      <p className="mb-3 font-medium">{title}</p>

      {/* แถวข้อมูล: label ซ้าย / value ขวา (truncate) */}
      <Row label="Original name" value={original} />
      <Row label="Edited name" value={edited} />

      {/* แถวคะแนนความเหมือน */}
      <div className="mt-2 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Similarity Score</p>
        <Badge
          className={cn(
            "border-none px-2 py-0.5 text-sm font-normal rounded-full",
            badge.className
          )}
        >
          {badge.text}
        </Badge>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="ml-4 max-w-[60%] truncate text-sm">
        {value && value.trim() !== "" ? value : "-"}
      </p>
    </div>
  );
}

/** กำหนดสี/ข้อความของ Badge ตามช่วงเปอร์เซ็นต์ */
function percentBadge(
  pct?: number | null
): { text: string; className: string } {
  if (pct == null || Number.isNaN(pct)) {
    return { text: "-", className: "bg-muted text-muted-foreground" };
  }
  const p = Math.max(0, Math.min(100, Math.round(pct)));
  if (p >= 85) {
    return {
      text: `${p}%`,
      className: "bg-[#E8F7EE] text-[#16A34A]",
    };
  }
  if (p >= 65) {
    return {
      text: `${p}%`,
      className: "bg-[#FFF7E6] text-[#B45309]",
    };
  }
  return {
    text: `${p}%`,
    className: "bg-[#FEE2E2] text-[#B91C1C]",
  };
}
