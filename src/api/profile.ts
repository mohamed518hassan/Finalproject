import { handleUnauthorizedResponse } from "@/api/auth";

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
}

export interface PasswordChange {
  currentPassword: string;
  password: string;
  rePassword: string;
}

export interface ProfileRequestResult {
  ok: boolean;
  status: number;
  message?: string;
}

export interface UserProfileReadResult {
  ok: boolean;
  status: number;
  data?: Pick<UserProfile, "name"> & { userId?: string };
  error?: string;
}

function getResponseMessage(body: unknown): string | undefined {
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

function hasProfileName(
  value: unknown,
): value is Pick<UserProfile, "name"> {
  return (
    typeof value === "object" &&
    value !== null &&
    "name" in value &&
    typeof value.name === "string" &&
    value.name.trim().length > 0
  );
}

export async function getMyProfile(): Promise<UserProfileReadResult> {
  try {
    const response = await fetch("/api/backend/v1/users/getMe");
    handleUnauthorizedResponse(response);

    let responseBody: unknown;
    try {
      responseBody = await response.json();
    } catch {
      return {
        ok: false,
        status: response.status,
        error: "The account service returned invalid profile data.",
      };
    }

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error:
          getResponseMessage(responseBody) ??
          `Unable to load account name (HTTP ${response.status}).`,
      };
    }

    const profileData =
      typeof responseBody === "object" && responseBody !== null
        ? "data" in responseBody
          ? responseBody.data
          : "user" in responseBody
            ? responseBody.user
            : undefined
        : undefined;

    if (hasProfileName(profileData)) {
      return {
        ok: true,
        status: response.status,
        data: {
          name: profileData.name,
          ...("_id" in profileData && typeof profileData._id === "string"
            ? { userId: profileData._id }
            : "id" in profileData && typeof profileData.id === "string"
              ? { userId: profileData.id }
              : {}),
        },
      };
    }

    return {
      ok: false,
      status: response.status,
      error: "The account service returned invalid profile data.",
    };
  } catch {
    return {
      ok: false,
      status: 0,
      error: "Unable to reach the account service. Check your connection.",
    };
  }
}

async function updateUser(
  endpoint: "updateMe" | "changeMyPassword",
  body: UserProfile | PasswordChange,
): Promise<ProfileRequestResult> {
  try {
    const response = await fetch(`/api/backend/v1/users/${endpoint}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    handleUnauthorizedResponse(response);

    let responseBody: unknown;
    try {
      responseBody = await response.json();
    } catch {
      if (response.ok) return { ok: true, status: response.status };
    }

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        message: getResponseMessage(responseBody) ?? "The request could not be completed.",
      };
    }

    return {
      ok: true,
      status: response.status,
      message: getResponseMessage(responseBody),
    };
  } catch {
    return {
      ok: false,
      status: 0,
      message: "Unable to reach the account service. Check your connection.",
    };
  }
}

export function updateMyProfile(profile: UserProfile) {
  return updateUser("updateMe", profile);
}

export function changeMyPassword(passwordChange: PasswordChange) {
  return updateUser("changeMyPassword", passwordChange);
}
