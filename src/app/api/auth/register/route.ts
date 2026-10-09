const SIGN_UP_URL = "https://ecommerce.routemisr.com/api/v1/auth/signup";

const REQUIRED_FIELDS = ["name", "email", "password", "rePassword", "phone"] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  return origin !== null && origin === new URL(request.url).origin;
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return Response.json({ message: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ message: "Invalid request body" }, { status: 400 });
  }

  if (
    !isRecord(body) ||
    !REQUIRED_FIELDS.every(
      (field) => field in body && typeof body[field] === "string",
    )
  ) {
    return Response.json({ message: "Invalid registration details" }, { status: 400 });
  }

  try {
    const response = await fetch(SIGN_UP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    let responseBody: unknown;
    try {
      responseBody = await response.json();
    } catch {
      responseBody = undefined;
    }

    const message =
      typeof responseBody === "object" &&
      responseBody !== null &&
      "message" in responseBody &&
      typeof responseBody.message === "string"
        ? responseBody.message
        : undefined;

    return Response.json(
      message ? { message } : {},
      { status: response.status },
    );
  } catch {
    return Response.json(
      { message: "Unable to reach the account service. Check your connection." },
      { status: 502 },
    );
  }
}
