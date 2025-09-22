"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/** โครงข้อมูลสำหรับ Data Log (ยืดหยุ่น/optional) */
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
  if (!dataLog) {
    return (
      <Card className="p-6 text-sm text-muted-foreground">No Data Log</Card>
    );
  }

  return (
    <div className="space-y-4">
      <DataLogSection
        heading="ID Card Data"
        thaiOriginal={dataLog.idCard?.thaiOriginalName}
        thaiEdited={dataLog.idCard?.thaiEditedName}
        thaiPercent={dataLog.idCard?.thaiSimilarityPercent}
        engOriginal={dataLog.idCard?.engOriginalName}
        engEdited={dataLog.idCard?.engEditedName}
        engPercent={dataLog.idCard?.engSimilarityPercent}
      />

      <DataLogSection
        heading="Book Bank Data"
        thaiOriginal={dataLog.bankBook?.thaiOriginalName}
        thaiEdited={dataLog.bankBook?.thaiEditedName}
        thaiPercent={dataLog.bankBook?.thaiSimilarityPercent}
        engOriginal={dataLog.bankBook?.engOriginalName}
        engEdited={dataLog.bankBook?.engEditedName}
        engPercent={dataLog.bankBook?.engSimilarityPercent}
      />
    </div>
  );
}

/* ============ Internal sub-components ============ */

function DataLogSection({
  heading,
  thaiOriginal,
  thaiEdited,
  thaiPercent,
  engOriginal,
  engEdited,
  engPercent,
}: {
  heading: string;
  thaiOriginal?: string | null;
  thaiEdited?: string | null;
  thaiPercent?: number | null;
  engOriginal?: string | null;
  engEdited?: string | null;
  engPercent?: number | null;
}) {
  return (
    <SectionFrame title={heading}>
      <div className="space-y-3">
        <NameCompareBlock
          title="THAI"
          original={thaiOriginal}
          edited={thaiEdited}
          percent={thaiPercent}
        />
        <NameCompareBlock
          title="ENG"
          original={engOriginal}
          edited={engEdited}
          percent={engPercent}
        />
      </div>
    </SectionFrame>
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
  const pctText = percent == null ? "-" : `${Math.round(percent)}%`;
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <p className="mb-2 font-medium">{title}</p>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Original name" value={original ?? "-"} />
        <div className="flex items-start justify-between">
          <Field label="Edited name" value={edited ?? "-"} />
          <Badge className="ml-2 bg-emerald-100 text-emerald-700 border-none self-start">
            {pctText}
          </Badge>
        </div>
      </div>
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
