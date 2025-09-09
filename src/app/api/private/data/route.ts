import { NextResponse } from "next/server";
import { requireSession } from "@/server/auth";

export async function GET() {
  await requireSession();
  return NextResponse.json({ ok: true });
}