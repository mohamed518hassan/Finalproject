import { handleUnauthorizedResponse } from "@/api/auth";

export interface WishlistRequestResult {
  ok: boolean;
  error?: string;
  data?: unknown;
}

async function requestWishlist(
  method: "GET" | "POST" | "DELETE",
  productId?: string,
): Promise<WishlistRequestResult> {
  if ((method === "POST" || method === "DELETE") && !productId) {
    return { ok: false, error: "A product ID is required" };
  }

  const isAddRequest = method === "POST";
  const url =
    method === "DELETE" && productId
      ? `/api/backend/v1/wishlist/${encodeURIComponent(productId)}`
      : "/api/backend/v1/wishlist";

  try {
    const response = await fetch(url, {
      method,
      headers: {
        ...(isAddRequest ? { "Content-Type": "application/json" } : {}),
      },
      ...(isAddRequest ? { body: JSON.stringify({ productId }) } : {}),
    });
    handleUnauthorizedResponse(response);

    let responseBody: { data?: unknown; message?: string } = {};
    try {
      responseBody = await response.json();
    } catch {
      responseBody = {};
    }

    if (!response.ok) {
      return {
        ok: false,
        error: responseBody.message ?? "Wishlist request failed",
      };
    }

    if (method === "GET" && !Array.isArray(responseBody.data)) {
      return { ok: false, error: "Invalid wishlist response" };
    }

    return { ok: true, data: responseBody.data };
  } catch {
    return { ok: false, error: "Unable to reach the Wishlist API" };
  }
}

export function getWishlist() {
  return requestWishlist("GET");
}

export function addProductToWishlist(productId: string) {
  return requestWishlist("POST", productId);
}

export function removeProductFromWishlist(productId: string) {
  return requestWishlist("DELETE", productId);
}