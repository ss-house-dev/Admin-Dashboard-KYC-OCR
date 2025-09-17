"use client";

import * as React from "react";
import { useState } from "react";
import { columns, Kycrequest } from "../components/column";
import { DataTable } from "../components/data-table";
import { SearchView } from "../components/SearchView";
import { FilterView } from "../components/FilterView";
import DetailView from "../components/DetailView";
import { useSidebar } from "@/components/ui/sidebar";

async function getData(): Promise<Kycrequest[]> {
  return [
    {
      transactionNo: "KR-0000001",
      name: "วิญญ์พัฒน์ เฮาว์เบรนาท",
      email: "olivia@untitledui.com",
      submissionDate: "01-01-2025",
      submissionTime: "16:03:50",
      status: "Approved",
    },
    {
      transactionNo: "KR-0000002",
      name: "อัจฉรา แก่นแก้ว",
      email: "lana@untitledui.com",
      submissionDate: "01-09-2025",
      submissionTime: "15:13:49",
      status: "Pending",
    },
    {
      transactionNo: "KR-0000003",
      name: "จุฑัย แก่นแก้ว",
      email: "demi@untitledui.com",
      submissionDate: "01-02-2025",
      submissionTime: "14:23:38",
      status: "Rejected",
    },
    {
      transactionNo: "KR-0000004",
      name: "วิญญ์พัฒน์ เฮาว์เบรนาท",
      email: "olivia@untitledui.com",
      submissionDate: "01-03-2025",
      submissionTime: "16:03:50",
      status: "Approved",
    },
    {
      transactionNo: "KR-0000005",
      name: "อัจฉรา แก่นแก้ว",
      email: "lana@untitledui.com",
      submissionDate: "01-09-2025",
      submissionTime: "15:13:49",
      status: "Pending",
    },
    {
      transactionNo: "KR-0000006",
      name: "จุฑัย แก่นแก้ว",
      email: "demi@untitledui.com",
      submissionDate: "01-01-2025",
      submissionTime: "14:23:38",
      status: "Rejected",
    },
    {
      transactionNo: "KR-0000007",
      name: "วิญญ์พัฒน์ เฮาว์เบรนาท",
      email: "olivia@untitledui.com",
      submissionDate: "01-01-2025",
      submissionTime: "16:03:50",
      status: "Approved",
    },
    {
      transactionNo: "KR-0000008",
      name: "อัจฉรา แก่นแก้ว",
      email: "lana@untitledui.com",
      submissionDate: "01-09-2025",
      submissionTime: "15:13:49",
      status: "Pending",
    },
    {
      transactionNo: "KR-0000009",
      name: "จุฑัย แก่นแก้ว",
      email: "demi@untitledui.com",
      submissionDate: "01-01-2025",
      submissionTime: "14:23:38",
      status: "Rejected",
    },
    {
      transactionNo: "KR-0000010",
      name: "จุฑัย แก่นแก้ว",
      email: "demi@untitledui.com",
      submissionDate: "01-01-2025",
      submissionTime: "14:23:38",
      status: "Rejected",
    },
    {
      transactionNo: "KR-0000056",
      name: "จุฑัย แก่นแก้ว",
      email: "demi@untitledui.com",
      submissionDate: "01-01-2025",
      submissionTime: "14:23:38",
      status: "Rejected",
    },
    {
      transactionNo: "KR-0000546",
      name: "จุฑัย แก่นแก้ว",
      email: "demi@untitledui.com",
      submissionDate: "01-01-2025",
      submissionTime: "14:23:38",
      status: "Approved",
    },
  ];
}

type Filters = {
  q: string;
  status: string;
  startDate: string;
  endDate: string;
};

// ป้องกัน timezone เพี้ยน (คืน YYYY-MM-DD)
const toYmd = (d?: Date) =>
  d
    ? new Date(d.getTime() - d.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 10)
    : "";

// แปลง dd-mm-yyyy -> yyyy-mm-dd (ถ้าไม่ใช่ฟอร์แมตนี้ จะคืนค่าเดิม)
const ddmmyyyyToIso = (s: string) => {
  const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(s);
  if (!m) return s;
  const [, dd, mm, yyyy] = m;
  return `${yyyy}-${mm}-${dd}`;
};

const getRowTs = (row: Kycrequest) => {
  const iso = ddmmyyyyToIso(row.submissionDate);
  const time = row.submissionTime ?? "00:00:00";
  const dt = new Date(`${iso}T${time}`);
  return Number.isNaN(+dt) ? 0 : dt.getTime();
};

export default function DashBoardContainer({
  onApply,
  onClear,
  defaultValues,
}: {
  onApply?: (v: Filters) => void;
  onClear?: () => void;
  defaultValues?: Partial<Filters>;
}) {
  // โหลดและ sort ใหม่->เก่า
  const [data, setData] = React.useState<Kycrequest[]>([]);
  React.useEffect(() => {
    let alive = true;
    getData().then((rows) => {
      if (!alive) return;
      const sorted = [...rows].sort((a, b) => getRowTs(b) - getRowTs(a)); // ✅ ใหม่→เก่า
      setData(sorted);
    });
    return () => {
      alive = false;
    };
  }, []);

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
  const [selected, setSelected] = useState<any | null>(null);
  const { setOpen: setSidebarOpen } = useSidebar();

  const column = columns((row) => {
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

  return (
    <div className="h-dvh flex flex-col overflow-hidden">
      {/* แถบค้นหา + ฟิลเตอร์ (คงที่ด้านบน) */}
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

      {/* โซนล่าง: ตาราง + แผงรายละเอียด (อยู่แถวเดียวกัน) */}
      <section
        className={`
    flex-1 min-h-0 grid overflow-hidden
    ${detailOpen ? "grid-cols-[1fr_360px]" : "grid-cols-1"}
  `}
      >
        {/* ตาราง (ให้เลื่อนเฉพาะส่วนนี้) */}
        <div className="min-h-0 overflow-auto p-8 w-full">
          <DataTable columns={column} data={filtered} />
        </div>

        {/* คอลัมน์ขวาจะถูก mount ก็ต่อเมื่อ open = true */}
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
