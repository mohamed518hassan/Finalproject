export type AuthRequestResult = {
  ok: boolean;
  status: number;
  message?: string;
};

function readMessage(body: unknown): string | undefined {
  if (
    typeof body === "object" &&
    body !== null &&
    "message" in body &&
    typeof body.message === "string"
  ) {
    return body.message;
  }
  return undefined;
}

export async function signUp(details: {
  name: string;
  email: string;
  password: string;
  rePassword: string;
  phone: string;
}): Promise<AuthRequestResult> {
  try {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(details),
    });

    let responseBody: unknown;
    try {
      responseBody = await response.json();
    } catch {
      responseBody = undefined;
    }

    return {
      ok: response.ok,
      status: response.status,
      message:
        readMessage(responseBody) ??
        (!response.ok
          ? `Authentication request failed (HTTP ${response.status}).`
          : undefined),
    };
  } catch {
    return {
      ok: false,
      status: 0,
      message: "Unable to reach the account service. Check your connection.",
    };
  }
}

export function getSafeInternalPath(
  value: string | null | undefined,
  fallback = "/",
): string {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\")
  ) {
    return fallback;
  }

  try {
    decodeURIComponent(value);
    if (/[\u0000-\u001f\u007f]/.test(value)) return fallback;
    const destination = new URL(value, "https://freshcart.invalid");
    if (destination.origin !== "https://freshcart.invalid") return fallback;
    return `${destination.pathname}${destination.search}${destination.hash}`;
  } catch {
    return fallback;
  }
}

export function getSafeLoginUrl(returnPath: string): string {
  const safePath = getSafeInternalPath(returnPath);
  return `/login?redirect=${encodeURIComponent(safePath)}`;
}

export function handleUnauthorizedResponse(response: Response): boolean {
  if (response.status !== 401) return false;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("auth-session-expired"));
    void import("next-auth/react").then(({ signOut }) =>
      signOut({ redirect: false }).catch(() => undefined),
    );
  }
  return true;
}
