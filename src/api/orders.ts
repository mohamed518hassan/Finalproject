import { handleUnauthorizedResponse } from "@/api/auth";
import type { ShippingAddress } from "@/api/cart";

const ORDERS_API_URL = "/api/backend/v1/orders";

export interface UserOrderItem {
  title: string;
  quantity: number;
  price: number;
}

export interface UserOrder {
  id: string;
  createdAt: string;
  totalPrice: number;
  paymentMethod: string;
  isPaid: boolean;
  isDelivered: boolean;
  shippingAddress: Partial<ShippingAddress>;
  items: UserOrderItem[];
}

export interface OrderRequestResult<T = undefined> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
}

function readMessage(body: unknown): string | undefined {
  return typeof body === "object" &&
    body !== null &&
    "message" in body &&
    typeof body.message === "string"
    ? body.message
    : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function createCashOrder(
  cartId: string,
  shippingAddress: ShippingAddress,
): Promise<OrderRequestResult> {
  if (!cartId.trim()) {
    return { ok: false, status: 400, error: "A cart ID is required." };
  }

  try {
    const response = await fetch(
      `${ORDERS_API_URL.replace("/v1/", "/v2/")}/${encodeURIComponent(cartId)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ shippingAddress }),
      },
    );
    handleUnauthorizedResponse(response);

    let body: unknown;
    try {
      body = await response.json();
    } catch {
      return {
        ok: false,
        status: response.status,
        error: "The order service returned an invalid response.",
      };
    }

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: readMessage(body) ?? "Unable to create your cash order.",
      };
    }

    if (!isRecord(body) || body.status !== "success") {
      return {
        ok: false,
        status: response.status,
        error: "The order service did not confirm your order.",
      };
    }

    return { ok: true, status: response.status };
  } catch {
    return {
      ok: false,
      status: 0,
      error: "Unable to reach the order service. Check your connection.",
    };
  }
}

function parseOrder(value: unknown): UserOrder | null {
  if (
    !isRecord(value) ||
    typeof value._id !== "string" ||
    typeof value.createdAt !== "string" ||
    typeof value.totalOrderPrice !== "number" ||
    !Array.isArray(value.cartItems)
  ) {
    return null;
  }

  const items: UserOrderItem[] = [];
  for (const item of value.cartItems) {
    if (
      !isRecord(item) ||
      typeof item.count !== "number" ||
      typeof item.price !== "number"
    ) {
      return null;
    }
    const product = isRecord(item.product) ? item.product : null;
    items.push({
      title:
        product && typeof product.title === "string"
          ? product.title
          : "Product unavailable",
      quantity: item.count,
      price: item.price,
    });
  }

  const address = isRecord(value.shippingAddress)
    ? value.shippingAddress
    : {};
  const shippingAddress: Partial<ShippingAddress> = {};
  for (const key of ["details", "phone", "city", "postalCode"] as const) {
    if (typeof address[key] === "string") {
      shippingAddress[key] = address[key];
    }
  }

  return {
    id: value._id,
    createdAt: value.createdAt,
    totalPrice: value.totalOrderPrice,
    paymentMethod:
      typeof value.paymentMethodType === "string"
        ? value.paymentMethodType
        : "Payment method unavailable",
    isPaid: value.isPaid === true,
    isDelivered: value.isDelivered === true,
    shippingAddress,
    items,
  };
}

export async function getUserOrders(
  userId: string,
): Promise<OrderRequestResult<UserOrder[]>> {
  if (!userId.trim()) {
    return { ok: false, status: 400, error: "A user ID is required." };
  }

  try {
    const response = await fetch(
      `${ORDERS_API_URL}/user/${encodeURIComponent(userId)}`,
    );
    handleUnauthorizedResponse(response);

    let body: unknown;
    try {
      body = await response.json();
    } catch {
      return {
        ok: false,
        status: response.status,
        error: "The order service returned invalid order data.",
      };
    }

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: readMessage(body) ?? "Unable to load your orders.",
      };
    }

    const orderData =
      Array.isArray(body)
        ? body
        : isRecord(body) && Array.isArray(body.data)
          ? body.data
          : null;
    if (!orderData) {
      return {
        ok: false,
        status: response.status,
        error: "The order service returned invalid order data.",
      };
    }

    const orders = orderData.map(parseOrder);
    if (orders.some((order) => order === null)) {
      return {
        ok: false,
        status: response.status,
        error: "The order service returned an incomplete order.",
      };
    }

    return {
      ok: true,
      status: response.status,
      data: orders.filter((order): order is UserOrder => order !== null),
    };
  } catch {
    return {
      ok: false,
      status: 0,
      error: "Unable to reach the order service. Check your connection.",
    };
  }
}
