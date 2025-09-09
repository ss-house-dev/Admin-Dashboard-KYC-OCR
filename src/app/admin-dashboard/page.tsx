import { requireSession } from "@/server/auth";

export default async function AdminDashboardPage() {
  await requireSession();
  return (
    <div className="grid min-h-dvh place-items-center text-xl">เข้ามาแล้ว</div>
  );
}
