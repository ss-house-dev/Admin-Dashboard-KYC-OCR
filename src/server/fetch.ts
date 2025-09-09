import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function fetchWithAuth(
  input: RequestInfo,
  init: RequestInit = {}
) {
  const session = await getServerSession(authOptions);
  const token = (session as any)?.accessToken as string | undefined;

  return fetch(input, {
    ...init,
    headers: {
      ...(init.headers || {}),
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}
