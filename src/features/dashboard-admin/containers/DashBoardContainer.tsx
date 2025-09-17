"use client";

import * as React from "react";
import { columns, Kycrequest } from "../components/column";
import { DataTable } from "../components/data-table";
import { SearchView } from "../components/SearchView";
import { FilterView } from "../components/FilterView";

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
  const iso = ddmmyyyyToIso(row.submissionDate)
  const time = row.submissionTime ?? "00:00:00"
  const dt = new Date(`${iso}T${time}`)
  return Number.isNaN(+dt) ? 0 : dt.getTime()
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
  // ====== ดึงข้อมูลด้วย useEffect  ======
const [data, setData] = React.useState<Kycrequest[]>([])

React.useEffect(() => {
  let alive = true
  getData().then((rows) => {
    if (!alive) return
    const sorted = [...rows].sort((a, b) => getRowTs(b) - getRowTs(a)) // ✅ ใหม่→เก่า
    setData(sorted)
  })
  return () => { alive = false }
}, [])

  // ====== state ของ filters ======
  const [q, setQ] = React.useState(defaultValues?.q ?? "");
  const [status, setStatus] = React.useState(defaultValues?.status ?? "all");
  const [start, setStart] = React.useState<Date | undefined>(
    defaultValues?.startDate ? new Date(defaultValues.startDate) : undefined
  );
  const [end, setEnd] = React.useState<Date | undefined>(
    defaultValues?.endDate ? new Date(defaultValues.endDate) : undefined
  );

  // (ทางเลือก) ส่งค่า filter ออกไปให้คนเรียกใช้
  const apply = (overrideQ?: string) => {
    const payload: Filters = {
      q: (overrideQ ?? q).trim(),
      status,
      startDate: toYmd(start),
      endDate: toYmd(end),
    };
    onApply?.(payload);
  };

  const clearAll = () => {
    setQ("");
    setStatus("all");
    setStart(undefined);
    setEnd(undefined);
    onClear?.();
  };

  // ====== กรองข้อมูลตาม filters ======
  const filtered = React.useMemo(() => {
    const qLower = q.trim().toLowerCase();

    return data.filter((row) => {
      const matchQ =
        !qLower ||
        row.transactionNo.toLowerCase().includes(qLower) ||
        row.name.toLowerCase().includes(qLower) ||
        row.email.toLowerCase().includes(qLower);

      const matchStatus =
        status === "all" || row.status.toLowerCase() === status.toLowerCase();

      // แปลงวันที่ให้เป็น ISO ก่อนค่อย new Date()
      const iso = ddmmyyyyToIso(row.submissionDate);
      const d = new Date(iso); // ถ้าได้ Invalid Date จะไม่ผ่านช่วงวันที่
      const matchStart =
        !start ||
        (d instanceof Date &&
          !isNaN(+d) &&
          d >= new Date(start.toDateString()));
      const matchEnd =
        !end ||
        (d instanceof Date && !isNaN(+d) && d <= new Date(end.toDateString()));

      return matchQ && matchStatus && matchStart && matchEnd;
    });
  }, [data, q, status, start, end]);

  return (
    <div className="h-dvh flex flex-col overflow-hidden">
      {/* แถบค้นหา + ฟิลเตอร์ */}
        <div className="border-b border-solid p-8 shrink-0 ">
          <div className="w-full space-y-2">
            <SearchView
            className="w-[260px]"
            defaultValue={q}
            onSearch={(val) => {
              setQ(val);
              apply(val); // ถ้าต้องการแจ้งคนเรียกใช้
            }}
          />

          <FilterView
            status={status}
            start={start}
            end={end}
            onChangeStatus={setStatus}
            onChangeStart={(d) => {
              setStart(d);
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
        </div>

      {/* ตาราง */}
      <div className="flex-1 min-h-0 overflow-auto p-8 w-full">
        <DataTable columns={columns} data={filtered} />
      </div>
    </div>
  );
}
