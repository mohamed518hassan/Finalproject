import { getToken } from "next-auth/jwt";

const BACKEND_API_URL = "https://ecommerce.routemisr.com/api";
const SAFE_ID = /^[A-Za-z0-9_-]+$/;

function isAllowedOperation(path: string, method: string): boolean {
  if (path === "v1/cart") {
    return ["GET", "POST", "DELETE"].includes(method);
  }
  if (path === "v1/addresses") {
    return ["GET", "POST"].includes(method);
  }
  if (path === "v1/users/getMe") return method === "GET";
  if (path === "v1/users/updateMe") return method === "PUT";
  if (path === "v1/users/changeMyPassword") return method === "PUT";

  const parts = path.split("/");
  if (
    parts[0] === "v1" &&
    parts[1] === "cart" &&
    parts.length === 3 &&
    SAFE_ID.test(parts[2])
  ) {
    return method === "DELETE";
  }
  if (
    parts[0] === "v2" &&
    parts[1] === "cart" &&
    parts.length === 3 &&
    SAFE_ID.test(parts[2])
  ) {
    return method === "PUT";
  }
  if (
    parts[0] === "v1" &&
    parts[1] === "wishlist" &&
    (parts.length === 2 || (parts.length === 3 && SAFE_ID.test(parts[2])))
  ) {
    return parts.length === 2
      ? ["GET", "POST"].includes(method)
      : method === "DELETE";
  }
  if (
    parts[0] === "v1" &&
    parts[1] === "orders" &&
    parts[2] === "user" &&
    parts.length === 4 &&
    SAFE_ID.test(parts[3])
  ) {
    return method === "GET";
  }
  if (
    parts[0] === "v1" &&
    parts[1] === "orders" &&
    parts[2] === "checkout-session" &&
    parts.length === 4 &&
    SAFE_ID.test(parts[3])
  ) {
    return method === "POST";
  }
  if (
    parts[0] === "v2" &&
    parts[1] === "orders" &&
    parts.length === 3 &&
    SAFE_ID.test(parts[2])
  ) {
    return method === "POST";
  }
  if (
    parts[0] === "v1" &&
    parts[1] === "addresses" &&
    parts.length === 3 &&
    SAFE_ID.test(parts[2])
  ) {
    return method === "DELETE";
  }
  return false;
}

function hasValidMutationOrigin(request: Request): boolean {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) return true;
  const origin = request.headers.get("origin");
  return origin !== null && origin === new URL(request.url).origin;
}

async function proxyBackendRequest(
  request: Request,
  context: { params: Promise<{ segments: string[] }> },
) {
  const { segments } = await context.params;
  const path = segments.join("/");
  if (!isAllowedOperation(path, request.method)) {
    return Response.json({ message: "Unsupported backend operation" }, { status: 404 });
  }
  if (!hasValidMutationOrigin(request)) {
    return Response.json({ message: "Forbidden" }, { status: 403 });
  }

  const authToken = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
  });
  const backendToken =
    authToken && typeof authToken.backendToken === "string"
      ? authToken.backendToken
      : undefined;
  if (!backendToken) {
    return Response.json({ message: "Authentication required" }, { status: 401 });
  }

  const targetUrl = new URL(
    `${BACKEND_API_URL}/${segments.map(encodeURIComponent).join("/")}`,
  );
  if (path.includes("/checkout-session/")) {
    const returnUrl = new URL(request.url).searchParams.get("url");
    if (!returnUrl) {
      return Response.json({ message: "Checkout return URL is required" }, { status: 400 });
    }
    try {
      const parsedReturnUrl = new URL(returnUrl);
      if (parsedReturnUrl.origin !== new URL(request.url).origin) {
        return Response.json({ message: "Invalid checkout return URL" }, { status: 400 });
      }
      targetUrl.searchParams.set("url", returnUrl);
    } catch {
      return Response.json({ message: "Invalid checkout return URL" }, { status: 400 });
    }
  }

  let body: string | undefined;
  if (["POST", "PUT", "PATCH"].includes(request.method)) {
    body = await request.text();
    if (body.length > 1_000_000) {
      return Response.json({ message: "Request body is too large" }, { status: 413 });
    }
  }

  let backendResponse: Response;
  try {
    backendResponse = await fetch(targetUrl, {
      method: request.method,
      headers: {
        token: backendToken,
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      ...(body !== undefined ? { body } : {}),
      cache: "no-store",
    });
  } catch {
    return Response.json(
      { message: "Unable to reach the backend service." },
      { status: 502 },
    );
  }

  const responseHeaders = new Headers();
  const contentType = backendResponse.headers.get("content-type");
  if (contentType) responseHeaders.set("content-type", contentType);
  responseHeaders.set("Cache-Control", "no-store");
  return new Response(backendResponse.body, {
    status: backendResponse.status,
    headers: responseHeaders,
  });
}

export const GET = proxyBackendRequest;
export const POST = proxyBackendRequest;
export const PUT = proxyBackendRequest;
export const DELETE = proxyBackendRequest;
