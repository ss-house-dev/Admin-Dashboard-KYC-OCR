import { requireSession } from "@/server/auth";
import DashBoardContainer from "@/features/dashboard-admin/containers/DashBoardContainer";
import { columns, Kycrequest } from "@/features/dashboard-admin/components/column";
import { DataTable } from "@/features/dashboard-admin/components/data-table";

async function getData(): Promise<Kycrequest[]> {
  // Fetch data from your API here.
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
      submissionDate: "01-01-2025",
      submissionTime: "15:13:49",
      status: "Pending",
    },
    {
      transactionNo: "KR-0000003",
      name: "จุฑัย แก่นแก้ว",
      email: "demi@untitledui.com",
      submissionDate: "01-01-2025",
      submissionTime: "14:23:38",
      status: "Rejected",
    },
  ];
}

export default async function AdminDashboardPage() {
  const data = await getData();
  await requireSession();
  return (
    // <DashBoardContainer/>
        <div className="container mx-auto py-10">
          <DataTable columns={columns} data={data} />
        </div>

    // <div className="grid min-h-dvh place-items-center text-xl">เข้ามาแล้ว</div>
  );
}
