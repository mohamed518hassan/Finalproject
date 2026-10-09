const AUTH_API_URL = "https://ecommerce.routemisr.com/api/v1/auth";

export interface PasswordRecoveryResult {
  ok: boolean;
  status: number;
  message?: string;
}

function readStringProperty(body: unknown, property: string): string | undefined {
  if (
    typeof body === "object" &&
    body !== null &&
    property in body &&
    typeof body[property as keyof typeof body] === "string"
  ) {
    return body[property as keyof typeof body] as string;
  }
  return undefined;
}

async function sendRecoveryRequest(
  endpoint: "forgotPasswords" | "verifyResetCode" | "resetPassword",
  body: Record<string, string>,
  method: "POST" | "PUT" = "POST",
): Promise<PasswordRecoveryResult> {
  try {
    const response = await fetch(`${AUTH_API_URL}/${endpoint}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    let responseBody: unknown;
    try {
      responseBody = await response.json();
    } catch {
      responseBody = undefined;
    }

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        message:
          readStringProperty(responseBody, "message") ??
          `Password recovery request failed (HTTP ${response.status}).`,
      };
    }

    return {
      ok: true,
      status: response.status,
      message: readStringProperty(responseBody, "message"),
    };
  } catch {
    return {
      ok: false,
      status: 0,
      message: "Unable to reach the account service. Check your connection.",
    };
  }
}

export function requestPasswordReset(email: string) {
  return sendRecoveryRequest("forgotPasswords", { email });
}

export function verifyPasswordResetCode(resetCode: string) {
  return sendRecoveryRequest("verifyResetCode", { resetCode });
}

export function resetPassword(email: string, newPassword: string) {
  return sendRecoveryRequest(
    "resetPassword",
    { email, newPassword },
    "PUT",
  );
}
