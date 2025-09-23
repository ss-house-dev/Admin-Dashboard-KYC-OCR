"use client";

import { signOut } from "next-auth/react";

export function ErrorView({ error }: { error: Error | null }) {
  if (!error) return null;

  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="flex flex-col items-center gap-4">
        <p className="text-red-600 font-medium">Error: {error.message}</p>
        <button
          onClick={() => signOut({ callbackUrl: "/sign-in" })}
          className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
