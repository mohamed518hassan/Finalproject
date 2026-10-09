import { handleUnauthorizedResponse } from "@/api/auth";

const CART_API_URL = "/api/backend/v1/cart";

export interface CartData {
  numOfCartItems?: number;
  cartId?: string;
  _id?: string;
  products?: CartApiProduct[];
}

export interface CartApiProduct {
  count?: number;
  price?: number;
  product?: {
    _id?: string;
    title?: string;
    price?: number;
    imageCover?: string;
    category?: { name?: string };
  };
}

export interface CartRequestResult<T = CartData> {
  ok: boolean;
  status: number;
  data?: T;
  cartId?: string;
  error?: string;
}

export interface ShippingAddress {
  details: string;
  phone: string;
  city: string;
  postalCode: string;
}

export interface CheckoutSessionResponse {
  status: "success";
  session: {
    url: string;
  };
}

async function requestCart<T = CartData>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  body?: Record<string, unknown>,
  url = CART_API_URL,
): Promise<CartRequestResult<T>> {
  try {
    const response = await fetch(url, {
      method,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    handleUnauthorizedResponse(response);

    let responseBody: { data?: T; cartId?: string; message?: string } = {};
    try {
      responseBody = await response.json();
    } catch {
      if (response.ok) {
        return {
          ok: false,
          status: response.status,
          error: "Cart API returned an invalid response",
        };
      }
    }

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: responseBody.message ?? "Cart request failed",
      };
    }

    return {
      ok: true,
      status: response.status,
      data: responseBody.data,
      ...(typeof responseBody.cartId === "string"
        ? { cartId: responseBody.cartId }
        : {}),
    };
  } catch {
    return { ok: false, status: 0, error: "Unable to reach the Cart API" };
  }
}

export function getCart() {
  return requestCart<CartData>("GET");
}

export function addProductToCart(productId: string) {
  return requestCart<CartData>("POST", { productId });
}

export function updateCartItem(productId: string, count: number) {
  return requestCart<CartData>(
    "PUT",
    { count },
    `/api/backend/v2/cart/${encodeURIComponent(productId)}`,
  );
}

export function removeCartItem(productId: string) {
  return requestCart<CartData>(
    "DELETE",
    undefined,
    `${CART_API_URL}/${encodeURIComponent(productId)}`,
  );
}

export function clearUserCart() {
  return requestCart<CartData>("DELETE");
}

export async function createCheckoutSession(
  cartId: string,
  shippingAddress: ShippingAddress,
): Promise<CartRequestResult<CheckoutSessionResponse>> {
  if (!cartId.trim()) {
    return { ok: false, status: 400, error: "A cart ID is required" };
  }

  const url = new URL(
    `/api/backend/v1/orders/checkout-session/${encodeURIComponent(cartId)}`,
    window.location.origin,
  );
  url.searchParams.set("url", window.location.origin);

  try {
    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ shippingAddress }),
    });
    handleUnauthorizedResponse(response);

    let responseBody: unknown;
    try {
      responseBody = await response.json();
    } catch {
      return {
        ok: false,
        status: response.status,
        error: "Checkout API returned an invalid response",
      };
    }

    if (!response.ok) {
      const message =
        typeof responseBody === "object" &&
          responseBody !== null &&
          "message" in responseBody &&
          typeof responseBody.message === "string"
          ? responseBody.message
          : "Checkout request failed";
      return { ok: false, status: response.status, error: message };
    }

    if (
      typeof responseBody !== "object" ||
      responseBody === null ||
      !("status" in responseBody) ||
      responseBody.status !== "success" ||
      !("session" in responseBody) ||
      typeof responseBody.session !== "object" ||
      responseBody.session === null ||
      !("url" in responseBody.session) ||
      typeof responseBody.session.url !== "string"
    ) {
      return {
        ok: false,
        status: response.status,
        error: "Checkout API returned an invalid session",
      };
    }

    let checkoutUrl: URL;
    try {
      checkoutUrl = new URL(responseBody.session.url);
    } catch {
      return {
        ok: false,
        status: response.status,
        error: "Checkout API returned an invalid payment URL",
      };
    }

    if (checkoutUrl.protocol !== "https:" && checkoutUrl.protocol !== "http:") {
      return {
        ok: false,
        status: response.status,
        error: "Checkout API returned an unsupported payment URL",
      };
    }

    return {
      ok: true,
      status: response.status,
      data: {
        status: "success",
        session: { url: responseBody.session.url },
      },
    };
  } catch {
    return { ok: false, status: 0, error: "Unable to reach the Checkout API" };
  }
}