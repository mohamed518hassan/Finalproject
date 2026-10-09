import { handleUnauthorizedResponse } from "@/api/auth";

export interface UserAddress {
  _id: string;
  name: string;
  details: string;
  phone: string;
  city: string;
}

export interface NewUserAddress {
  name: string;
  details: string;
  phone: string;
  city: string;
}

export interface AddressRequestResult {
  ok: boolean;
  status: number;
  data?: UserAddress[];
  error?: string;
}

function readErrorMessage(body: unknown): string | undefined {
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

function isUserAddress(value: unknown): value is UserAddress {
  if (typeof value !== "object" || value === null) return false;
  return (
    "_id" in value &&
    typeof value._id === "string" &&
    "name" in value &&
    typeof value.name === "string" &&
    "details" in value &&
    typeof value.details === "string" &&
    "phone" in value &&
    typeof value.phone === "string" &&
    "city" in value &&
    typeof value.city === "string"
  );
}

async function requestAddresses(
  method: "GET" | "POST" | "DELETE",
  body?: NewUserAddress,
  addressId?: string,
): Promise<AddressRequestResult> {
  const url = addressId
    ? `/api/backend/v1/addresses/${encodeURIComponent(addressId)}`
    : "/api/backend/v1/addresses";

  try {
    const response = await fetch(url, {
      method,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    handleUnauthorizedResponse(response);

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
        error: readErrorMessage(responseBody) ?? `Address request failed (HTTP ${response.status}).`,
      };
    }

    if (method === "GET") {
      if (
        typeof responseBody !== "object" ||
        responseBody === null ||
        !("data" in responseBody) ||
        !Array.isArray(responseBody.data) ||
        !responseBody.data.every(isUserAddress)
      ) {
        return {
          ok: false,
          status: response.status,
          error: "The address service returned an invalid address list.",
        };
      }
      return { ok: true, status: response.status, data: responseBody.data };
    }

    return { ok: true, status: response.status };
  } catch {
    return {
      ok: false,
      status: 0,
      error: "Unable to reach the address service. Check your connection.",
    };
  }
}

export function getAddresses() {
  return requestAddresses("GET");
}

export function createAddress(address: NewUserAddress) {
  return requestAddresses("POST", address);
}

export function deleteAddress(addressId: string) {
  return requestAddresses("DELETE", undefined, addressId);
}
