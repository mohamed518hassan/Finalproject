"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getSafeLoginUrl } from "@/api/auth";
import { useAuth } from "@/context/AuthContext";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      const returnPath =
        typeof window === "undefined"
          ? pathname
          : `${window.location.pathname}${window.location.search}`;
      router.replace(getSafeLoginUrl(returnPath));
    }
  }, [pathname, router, status]);

  if (status === "authenticated") return children;

  return (
    <main className="flex min-h-[50vh] items-center justify-center px-4">
      <p className="text-sm text-slate-500" role="status">
        Checking your session...
      </p>
    </main>
  );
}
