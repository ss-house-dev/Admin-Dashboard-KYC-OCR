"use client";

import * as React from "react";
import { useState } from "react";
import { columns, Kycrequest } from "../components/column";
import { DataTable } from "../components/DataTable";
import { SearchView } from "../components/SearchView";
import { FilterView } from "../components/FilterView";
import DetailView from "../components/DetailView";
import { useSidebar } from "@/components/ui/sidebar";
import { useKycRequest } from "../hooks/useKycRequest";
import type { KycRequestApi, CompanyAllData } from "../types/kyc";
import { toYmd, ddmmyyyyToIso, formatFromIso } from "../utils/datetime";

type Filters = {
  q: string;
  status: string;
  startDate: string;
  endDate: string;
};

const getRowTs = (row: Kycrequest) => {
  const iso = ddmmyyyyToIso(row.submissionDate);
  const time = row.submissionTime ?? "00:00:00";
  const dt = new Date(`${iso}T${time}`);
  return Number.isNaN(+dt) ? 0 : dt.getTime();
};

// ให้ตรงกับ union ของ Kycrequest.status
type RowStatus = Kycrequest["status"];

const STATUS_MAP: Record<string, RowStatus> = {
  approved: "Approved",
  rejected: "Rejected",
  pending: "Pending",
  "approved override": "Approved Override",
  "rejected override": "Rejected Override",
};

function normalizeStatus(raw?: string | null): RowStatus {
  const key = (raw ?? "").trim().toLowerCase();
  // ถ้าไม่รู้จัก ให้ default เป็น "Pending"
  return STATUS_MAP[key] ?? "Pending";
}

// ---------- (ใหม่) Adapter: API -> Kycrequest ----------
function toDisplayRow(r: KycRequestApi): Kycrequest {
  const { date, time } = formatFromIso(r.createdAt);

  return {
    transactionNo: r.correlationId?.trim() ? r.correlationId : r.id,
    name: r.idcardEdit?.firstNameThai ?? "-",
    email: r.email || "-",
    submissionDate: date,
    submissionTime: time,
    status: normalizeStatus(r.status),
  };
}

export default function DashBoardContainer({
  onApply,
  onClear,
  defaultValues,
}: {
  onApply?: (v: Filters) => void;
  onClear?: () => void;
  defaultValues?: Partial<Filters>;
}) {
  // ---------- (ใหม่) ดึงข้อมูลจริง ----------
  const {
    data: companyResp,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useKycRequest<CompanyAllData>();
  // companyResp?.data.requests คือ array ของ KycRequestApi

  // ---------- (ใหม่) แปลงข้อมูล API -> Kycrequest[] + sort ใหม่->เก่า ----------
  const data: Kycrequest[] = React.useMemo(() => {
    const list = companyResp?.data?.items ?? []; // <- เปลี่ยน requests -> items
    const rows = list.map(toDisplayRow);
    rows.sort((a, b) => getRowTs(b) - getRowTs(a)); // ใหม่ -> เก่า ตามเดิม
    return rows;
  }, [companyResp]);

  // DRAFT (ค่าที่ผู้ใช้กำลังแก้ใน UI)
  const [q, setQ] = React.useState(defaultValues?.q ?? "");
  const [status, setStatus] = React.useState(defaultValues?.status ?? "all");
  const [start, setStart] = React.useState<Date | undefined>(
    defaultValues?.startDate ? new Date(defaultValues.startDate) : undefined
  );
  const [end, setEnd] = React.useState<Date | undefined>(
    defaultValues?.endDate ? new Date(defaultValues.endDate) : undefined
  );

  // APPLIED (ค่าที่ใช้กรองจริง จะเปลี่ยนเมื่อกด Apply เท่านั้น)
  const [aq, setAq] = React.useState(q);
  const [astatus, setAstatus] = React.useState(status);
  const [astart, setAstart] = React.useState<Date | undefined>(start);
  const [aend, setAend] = React.useState<Date | undefined>(end);

  //Detail
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<Kycrequest | null>(null);
  const { setOpen: setSidebarOpen } = useSidebar();

  const column = columns((row: Kycrequest) => {
    setSelected(row);
    setDetailOpen(true);
  });

  // กด Apply -> ย้าย draft -> applied แล้วค่อยยิง onApply
  const apply = (overrideQ?: string) => {
    const nextQ = (overrideQ ?? q).trim();
    setAq(nextQ);
    setAstatus(status);
    setAstart(start);
    setAend(end);

    onApply?.({
      q: nextQ,
      status,
      startDate: toYmd(start),
      endDate: toYmd(end),
    });
  };

  const clearAll = () => {
    // ล้าง draft
    setQ("");
    setStatus("all");
    setStart(undefined);
    setEnd(undefined);
    // ล้าง applied ด้วย (ให้ตารางกลับเป็นค่าเริ่มต้นทันที)
    setAq("");
    setAstatus("all");
    setAstart(undefined);
    setAend(undefined);
    onClear?.();
  };

  // กรองด้วย "applied" เท่านั้น
  const filtered = React.useMemo(() => {
    const qLower = aq.trim().toLowerCase();
    const rows = data.filter((row) => {
      const matchQ =
        !qLower ||
        row.transactionNo.toLowerCase().includes(qLower) ||
        row.name.toLowerCase().includes(qLower) ||
        row.email.toLowerCase().includes(qLower);

      const matchStatus =
        astatus === "all" || row.status.toLowerCase() === astatus.toLowerCase();

      const iso = ddmmyyyyToIso(row.submissionDate);
      const d = new Date(iso);
      const okDate = d instanceof Date && !isNaN(+d);
      const matchStart =
        !astart || (okDate && d >= new Date(astart.toDateString()));
      const matchEnd = !aend || (okDate && d <= new Date(aend.toDateString()));

      return matchQ && matchStatus && matchStart && matchEnd;
    });
    // คงลำดับใหม่->เก่า (สำรอง ถ้าต้องแน่ใจ)
    rows.sort((a, b) => getRowTs(b) - getRowTs(a));
    return rows;
  }, [data, aq, astatus, astart, aend]);

  // ---------- UI Loading / Error ----------
  if (isLoading) {
    return <div className="p-8">Loading company data…</div>;
  }
  if (error) {
    return (
      <div className="p-8 text-red-600">
        Error: {String(error.message)}
        <button
          onClick={() => refetch()}
          className="ml-3 underline"
          disabled={isFetching}
        >
          {isFetching ? "Retrying…" : "Retry"}
        </button>
      </div>
    );
  }

  return (
    <div className="h-dvh flex flex-col overflow-hidden">
      {/* แถบค้นหา + ฟิลเตอร์ */}
      <header className="shrink-0 border-b p-8 bg-white">
        <div className="w-full space-y-2">
          <SearchView
            className="w-[260px]"
            defaultValue={q}
            onSearch={(val) => setQ(val)}
          />
          <FilterView
            status={status}
            start={start}
            end={end}
            onChangeStatus={setStatus}
            onChangeStart={(d) => {
              setStart(d);
              if (!d) setEnd(undefined);
              if (d && end && d > end) setEnd(undefined);
            }}
            onChangeEnd={(d) => {
              if (d && start && d < start) setStart(d);
              setEnd(d);
            }}
            onApply={() => apply()}
            onClear={clearAll}
          />
        </div>
      </header>

      {/* ตาราง + แผงรายละเอียด  */}
      <section
        className={`
    flex-1 min-h-0 grid overflow-hidden
    ${detailOpen ? "grid-cols-[1fr_360px]" : "grid-cols-1"}
  `}
      >
        <div className="min-h-0 overflow-auto p-8 w-full">
          <DataTable columns={column} data={filtered} />
        </div>

        <DetailView
          open={detailOpen}
          width={360}
          data={selected}
          onClose={() => setDetailOpen(false)}
        />
      </section>
    </div>
  );
}
