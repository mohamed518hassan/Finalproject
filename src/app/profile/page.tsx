"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Check,
  CirclePlus,
  Home,
  KeyRound,
  LoaderCircle,
  MapPin,
  ShieldCheck,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import {
  createAddress,
  deleteAddress,
  getAddresses,
  type NewUserAddress,
  type UserAddress,
} from "@/api/addresses";
import {
  changeMyPassword,
  updateMyProfile,
  type PasswordChange,
  type UserProfile,
} from "@/api/profile";
import AuthGuard from "@/app/_components/auth-guard";

type Notice = { kind: "success" | "error"; text: string } | null;

const fieldClassName =
  "mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";

function ProfilePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab =
    searchParams.get("tab") === "addresses" ? "addresses" : "settings";
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [addressNotice, setAddressNotice] = useState<string | null>(null);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isCreatingAddress, setIsCreatingAddress] = useState(false);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([]);
  const [newAddress, setNewAddress] = useState<NewUserAddress>({
    name: "",
    details: "",
    phone: "",
    city: "",
  });
  const [addressFormError, setAddressFormError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile>({
    name: "",
    email: "",
    phone: "",
  });
  const [passwords, setPasswords] = useState<PasswordChange>({
    currentPassword: "",
    password: "",
    rePassword: "",
  });
  const [profileNotice, setProfileNotice] = useState<Notice>(null);
  const [passwordNotice, setPasswordNotice] = useState<Notice>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const loadAddresses = useCallback(async () => {
    setIsLoadingAddresses(true);
    setAddressError(null);
    const result = await getAddresses();
    if (!result.ok || !result.data) {
      setAddressError(
        result.error ?? `Unable to load addresses (HTTP ${result.status}).`,
      );
      setIsLoadingAddresses(false);
      return false;
    }
    setAddresses(result.data);
    setIsLoadingAddresses(false);
    return true;
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadAddresses(), 0);
    return () => window.clearTimeout(timer);
  }, [loadAddresses]);

  const submitNewAddress = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAddressFormError(null);
    setAddressNotice(null);
    setIsCreatingAddress(true);
    const address = {
      name: newAddress.name.trim(),
      details: newAddress.details.trim(),
      phone: newAddress.phone.trim(),
      city: newAddress.city.trim(),
    };

    if (!address.name || !address.details || !address.phone || !address.city) {
      setAddressFormError("Complete all address fields before saving.");
      setIsCreatingAddress(false);
      return;
    }

    const result = await createAddress(address);
    if (!result.ok) {
      setAddressFormError(
        result.error ?? `Unable to save address (HTTP ${result.status}).`,
      );
      setIsCreatingAddress(false);
      return;
    }

    setNewAddress({ name: "", details: "", phone: "", city: "" });
    setIsAddressModalOpen(false);
    setAddressNotice("Address added.");
    const refreshed = await loadAddresses();
    if (!refreshed)
      setAddressNotice(
        "Address was added, but the list could not be refreshed.",
      );
    setIsCreatingAddress(false);
  };

  const handleDeleteAddress = async (addressId: string) => {
    setAddressError(null);
    setAddressNotice(null);
    setPendingDeleteIds((current) => [...current, addressId]);

    const result = await deleteAddress(addressId);
    if (!result.ok) {
      setAddressError(
        result.error ?? `Unable to delete address (HTTP ${result.status}).`,
      );
      setPendingDeleteIds((current) =>
        current.filter((id) => id !== addressId),
      );
      return;
    }

    setAddresses((current) =>
      current.filter((address) => address._id !== addressId),
    );
    setAddressNotice("Address deleted.");
    const refreshed = await loadAddresses();
    if (!refreshed)
      setAddressNotice(
        "Address was deleted, but the list could not be refreshed.",
      );
    setPendingDeleteIds((current) => current.filter((id) => id !== addressId));
  };

  const submitProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfileNotice(null);
    if (
      !profile.name.trim() ||
      !profile.email.trim() ||
      !profile.phone.trim()
    ) {
      setProfileNotice({
        kind: "error",
        text: "Enter your name, email, and phone number before saving.",
      });
      return;
    }
    setIsSavingProfile(true);

    try {
      const result = await updateMyProfile({
        name: profile.name.trim(),
        email: profile.email.trim(),
        phone: profile.phone.trim(),
      });
      if (!result.ok) {
        setProfileNotice({
          kind: "error",
          text:
            result.message ??
            `Unable to update profile (HTTP ${result.status}).`,
        });
        return;
      }
      setProfileNotice({
        kind: "success",
        text: "Your profile has been updated.",
      });
    } catch {
      setProfileNotice({
        kind: "error",
        text: "Unable to update your profile. Please try again.",
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const submitPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordNotice(null);

    if (passwords.password !== passwords.rePassword) {
      setPasswordNotice({
        kind: "error",
        text: "The new passwords do not match.",
      });
      return;
    }
    if (
      !passwords.currentPassword ||
      !passwords.password ||
      !passwords.rePassword
    ) {
      setPasswordNotice({
        kind: "error",
        text: "Complete all password fields.",
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      const result = await changeMyPassword(passwords);
      if (!result.ok) {
        setPasswordNotice({
          kind: "error",
          text:
            result.message ??
            `Unable to change password (HTTP ${result.status}).`,
        });
        return;
      }
      setPasswords({ currentPassword: "", password: "", rePassword: "" });
      setPasswordNotice({
        kind: "success",
        text: "Your password has been changed.",
      });
    } catch {
      setPasswordNotice({
        kind: "error",
        text: "Unable to change your password. Please try again.",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f9fb] pb-12 text-slate-800">
      <section className="bg-gradient-to-r from-emerald-600 to-green-500 text-white">
        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
          <p className="text-sm font-medium text-emerald-50">
            <Link href="/" className="hover:underline">
              Home
            </Link>
            <span className="mx-2 text-emerald-100/70">/</span>
            My Account
          </p>
          <div className="mt-5 flex items-center gap-4">
            <span className="flex size-12 items-center justify-center rounded-xl bg-white/20">
              <UserRound className="size-6" aria-hidden="true" />
            </span>
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">My Account</h1>
              <p className="mt-1 text-sm text-emerald-50">
                Manage your profile and account security.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-7 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:px-8 lg:py-9">
        <aside className="h-fit rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <h2 className="mb-3 px-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            My Account
          </h2>
          <nav
            aria-label="Account navigation"
            className="flex gap-2 lg:flex-col"
          >
            <button
              aria-current={activeTab === "addresses" ? "page" : undefined}
              className={`flex flex-1 items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold lg:flex-none ${activeTab === "addresses" ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:bg-slate-50"}`}
              onClick={() => router.push("/profile?tab=addresses")}
              type="button"
            >
              <MapPin className="size-4" aria-hidden="true" />
              My Addresses
            </button>
            <button
              aria-current={activeTab === "settings" ? "page" : undefined}
              className={`flex flex-1 items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold lg:flex-none ${activeTab === "settings" ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:bg-slate-50"}`}
              onClick={() => router.push("/profile?tab=settings")}
              type="button"
            >
              <UserRound className="size-4" aria-hidden="true" />
              Settings
            </button>
          </nav>
        </aside>

        {activeTab === "addresses" ? (
          <section className="h-fit rounded-xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-6 flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <Home className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    My Addresses
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Manage your saved delivery addresses.
                  </p>
                </div>
              </div>
              <button
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 sm:w-auto"
                onClick={() => {
                  setAddressFormError(null);
                  setIsAddressModalOpen(true);
                }}
                type="button"
              >
                <CirclePlus className="size-4" aria-hidden="true" />
                Add New Address
              </button>
            </div>

            {addressError && (
              <div
                className="mb-5 flex flex-col gap-3 rounded-lg border border-red-100 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                role="alert"
              >
                <p className="text-sm text-red-700">{addressError}</p>
                <button
                  className="self-start text-sm font-semibold text-red-800 underline sm:self-auto"
                  onClick={() => void loadAddresses()}
                  type="button"
                >
                  Try again
                </button>
              </div>
            )}
            {addressNotice && (
              <p
                className="mb-5 text-sm font-medium text-emerald-700"
                role="status"
              >
                {addressNotice}
              </p>
            )}
            {isLoadingAddresses && addresses.length === 0 ? (
              <div
                className="flex min-h-40 items-center justify-center gap-3 text-sm text-slate-500"
                role="status"
              >
                <LoaderCircle
                  className="size-5 animate-spin text-emerald-600"
                  aria-hidden="true"
                />
                Loading your addresses...
              </div>
            ) : addresses.length === 0 && !addressError ? (
              <div className="rounded-xl border border-dashed border-slate-200 px-5 py-12 text-center">
                <MapPin
                  className="mx-auto size-8 text-slate-300"
                  aria-hidden="true"
                />
                <h3 className="mt-3 font-bold text-slate-800">
                  No saved addresses yet
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Add an address to make delivery details easier to manage.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {addresses.map((address) => (
                  <article
                    className="rounded-xl border border-slate-200 p-4 transition hover:border-emerald-200 hover:shadow-sm"
                    key={address._id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                          <MapPin className="size-4" aria-hidden="true" />
                        </span>
                        <h3 className="truncate font-bold text-slate-900">
                          {address.name}
                        </h3>
                      </div>
                      <button
                        aria-label={`Delete ${address.name} address`}
                        className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-wait disabled:opacity-50"
                        disabled={pendingDeleteIds.includes(address._id)}
                        onClick={() => void handleDeleteAddress(address._id)}
                        type="button"
                      >
                        {pendingDeleteIds.includes(address._id) ? (
                          <LoaderCircle
                            className="size-3.5 animate-spin"
                            aria-hidden="true"
                          />
                        ) : (
                          <Trash2 className="size-3.5" aria-hidden="true" />
                        )}
                        Delete
                      </button>
                    </div>
                    <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-sm text-slate-600">
                      <p className="break-words">{address.details}</p>
                      <p>{address.phone}</p>
                      <p>{address.city}</p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        ) : (
          <div className="space-y-6">
            <section className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7">
              <div className="mb-6 flex items-start gap-3 border-b border-slate-100 pb-5">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <UserRound className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Profile Information
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Update the name and contact details associated with your
                    account.
                  </p>
                  <p className="mt-2 text-xs text-amber-700">
                    Current account details cannot be prefilled from the
                    documented API. Enter all three values before saving.
                  </p>
                </div>
              </div>

              <form className="space-y-4" onSubmit={submitProfile}>
                <div>
                  <label
                    className="text-sm font-semibold text-slate-700"
                    htmlFor="profile-name"
                  >
                    Full name
                  </label>
                  <input
                    autoComplete="name"
                    className={fieldClassName}
                    id="profile-name"
                    onChange={(event) =>
                      setProfile((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    required
                    value={profile.name}
                  />
                </div>
                <div>
                  <label
                    className="text-sm font-semibold text-slate-700"
                    htmlFor="profile-email"
                  >
                    Email address
                  </label>
                  <input
                    autoComplete="email"
                    className={fieldClassName}
                    id="profile-email"
                    onChange={(event) =>
                      setProfile((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    required
                    type="email"
                    value={profile.email}
                  />
                </div>
                <div>
                  <label
                    className="text-sm font-semibold text-slate-700"
                    htmlFor="profile-phone"
                  >
                    Phone number
                  </label>
                  <input
                    autoComplete="tel"
                    className={fieldClassName}
                    id="profile-phone"
                    onChange={(event) =>
                      setProfile((current) => ({
                        ...current,
                        phone: event.target.value,
                      }))
                    }
                    required
                    type="tel"
                    value={profile.phone}
                  />
                </div>
                {profileNotice && (
                  <p
                    className={`text-sm ${profileNotice.kind === "error" ? "text-red-600" : "text-emerald-700"}`}
                    role={profileNotice.kind === "error" ? "alert" : "status"}
                  >
                    {profileNotice.text}
                  </p>
                )}
                <button
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-60"
                  disabled={isSavingProfile}
                  type="submit"
                >
                  {isSavingProfile ? (
                    "Saving..."
                  ) : (
                    <>
                      <Check className="size-4" aria-hidden="true" /> Save
                      Changes
                    </>
                  )}
                </button>
              </form>
            </section>

            <section className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7">
              <div className="mb-6 flex items-start gap-3 border-b border-slate-100 pb-5">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <ShieldCheck className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Change Password
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Use a strong password you do not use on other sites.
                  </p>
                </div>
              </div>

              <form className="space-y-4" onSubmit={submitPassword}>
                {(
                  [
                    ["currentPassword", "Current password", "current-password"],
                    ["password", "New password", "new-password"],
                    ["rePassword", "Confirm new password", "new-password"],
                  ] as const
                ).map(([name, label, autoComplete]) => (
                  <div key={name}>
                    <label
                      className="text-sm font-semibold text-slate-700"
                      htmlFor={name}
                    >
                      {label}
                    </label>
                    <input
                      autoComplete={autoComplete}
                      className={fieldClassName}
                      id={name}
                      onChange={(event) =>
                        setPasswords((current) => ({
                          ...current,
                          [name]: event.target.value,
                        }))
                      }
                      required
                      type="password"
                      value={passwords[name]}
                    />
                  </div>
                ))}
                {passwordNotice && (
                  <p
                    className={`text-sm ${passwordNotice.kind === "error" ? "text-red-600" : "text-emerald-700"}`}
                    role={passwordNotice.kind === "error" ? "alert" : "status"}
                  >
                    {passwordNotice.text}
                  </p>
                )}
                <button
                  className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-amber-600 disabled:cursor-wait disabled:opacity-60"
                  disabled={isChangingPassword}
                  type="submit"
                >
                  <KeyRound className="size-4" aria-hidden="true" />
                  {isChangingPassword ? "Changing..." : "Change Password"}
                </button>
              </form>
            </section>
          </div>
        )}
      </div>
      {isAddressModalOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/50 p-0 sm:items-center sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isCreatingAddress) {
              setIsAddressModalOpen(false);
            }
          }}
        >
          <section
            aria-labelledby="new-address-title"
            aria-modal="true"
            className="max-h-[90vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl sm:max-w-lg sm:rounded-2xl sm:p-7"
            role="dialog"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2
                  className="text-xl font-bold text-slate-900"
                  id="new-address-title"
                >
                  Add New Address
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Enter the details for your delivery address.
                </p>
              </div>
              <button
                aria-label="Close address form"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
                disabled={isCreatingAddress}
                onClick={() => setIsAddressModalOpen(false)}
                type="button"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>
            <form className="space-y-4" onSubmit={submitNewAddress}>
              {(
                [
                  ["name", "Address name", "text"],
                  ["details", "Address details", "text"],
                  ["phone", "Phone number", "tel"],
                  ["city", "City", "text"],
                ] as const
              ).map(([name, label, type]) => (
                <div key={name}>
                  <label
                    className="text-sm font-semibold text-slate-700"
                    htmlFor={`address-${name}`}
                  >
                    {label}
                  </label>
                  <input
                    autoComplete={name === "phone" ? "tel" : undefined}
                    className={fieldClassName}
                    id={`address-${name}`}
                    onChange={(event) =>
                      setNewAddress((current) => ({
                        ...current,
                        [name]: event.target.value,
                      }))
                    }
                    required
                    type={type}
                    value={newAddress[name]}
                  />
                </div>
              ))}
              {addressFormError && (
                <p className="text-sm text-red-600" role="alert">
                  {addressFormError}
                </p>
              )}
              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  disabled={isCreatingAddress}
                  onClick={() => setIsAddressModalOpen(false)}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-60"
                  disabled={isCreatingAddress}
                  type="submit"
                >
                  {isCreatingAddress && (
                    <LoaderCircle
                      className="size-4 animate-spin"
                      aria-hidden="true"
                    />
                  )}
                  {isCreatingAddress ? "Saving address..." : "Save Address"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={null}>
      <AuthGuard>
        <ProfilePageContent />
      </AuthGuard>
    </Suspense>
  );
}
