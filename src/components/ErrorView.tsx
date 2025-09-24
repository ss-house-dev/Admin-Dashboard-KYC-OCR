"use client";
import { signOut } from "next-auth/react";

export function ErrorView({ error }: { error: Error }) {
  if ((error as any)?.response?.status === 401 || error.message.includes("Unauthorized")) {
    signOut({ callbackUrl: "/signin" });
    return null; 
  }

  return (
    <div className="p-8 text-red-600">
      Error: {String(error.message)}
    </div>
  );
}
