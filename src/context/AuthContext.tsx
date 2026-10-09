"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { SessionProvider, useSession } from "next-auth/react";

interface AuthContextValue {
  status: "loading" | "authenticated" | "unauthenticated";
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AuthSessionState>{children}</AuthSessionState>
    </SessionProvider>
  );
}

function AuthSessionState({ children }: { children: ReactNode }) {
  const { status: sessionStatus, update } = useSession();
  const [sessionInvalidated, setSessionInvalidated] = useState(false);
  const status = sessionInvalidated ? "unauthenticated" : sessionStatus;
  useEffect(() => {
    const invalidateSession = () => setSessionInvalidated(true);
    window.addEventListener("auth-session-expired", invalidateSession);
    return () =>
      window.removeEventListener("auth-session-expired", invalidateSession);
  }, []);
  const refreshSession = useCallback(async () => {
    await update();
    setSessionInvalidated(false);
  }, [update]);
  const value = useMemo(
    () => ({ status, refreshSession }),
    [refreshSession, status],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }
  return context;
}
