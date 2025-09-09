import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import type { Session } from "next-auth";

export async function fetchWithAuth(input: RequestInfo | URL, init: RequestInit = {}) {
  const session = (await getServerSession(authOptions)) as (Session & { accessToken?: string }) | null;
  const token = session?.accessToken;

  return fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}
