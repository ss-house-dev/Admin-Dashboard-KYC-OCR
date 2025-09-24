"use client";
import { signOut } from "next-auth/react";
import { isAxiosError } from "axios";

export function ErrorView({ error }: { error: Error }) {
  if (isAxiosError(error)) {
    if (error.response?.status === 401) {
      void signOut({ callbackUrl: "/signin" });
      return null;
    }
  }

  if (error.message.includes("Unauthorized")) {
    void signOut({ callbackUrl: "/signin" });
    return null;
  }

  return <div className="p-8 text-red-600">Error: {String(error.message)}</div>;
}
