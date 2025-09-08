import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/sign-in");
  return session;
}

// ถ้าอยากเช็ค role:
export async function requireRole(role: string) {
  const session = await requireSession();
  if (session.user?.role !== role) redirect("/");
  return session;
}