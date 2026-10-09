"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  ClipboardList,
  Headset,
  Heart,
  LogOut,
  MapPin,
  Menu,
  Search,
  Settings,
  ShoppingCart,
  ShoppingCartPlus,
  Sparkles,
  Truck,
  UserPlus,
  UserRound,
  X,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { getMyProfile } from "@/api/profile";
import { useAuth } from "@/context/AuthContext";
import { signOut } from "next-auth/react";

export default function Navbar() {
  const { cartCount } = useCart();
  const { items: wishlistItems } = useWishlist();
  const { status: authStatus } = useAuth();
  const isLoggedIn = authStatus === "authenticated";
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [accountName, setAccountName] = useState("");
  const [accountNameError, setAccountNameError] = useState<string | null>(null);
  const [isLoadingAccountName, setIsLoadingAccountName] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const accountProfileRequestId = useRef(0);

  useEffect(() => {
    if (!isAccountMenuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !accountMenuRef.current?.contains(event.target)
      ) {
        setIsAccountMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsAccountMenuOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isAccountMenuOpen]);

  const handleAccountMenuToggle = () => {
    if (isAccountMenuOpen) {
      setIsAccountMenuOpen(false);
      return;
    }

    setIsAccountMenuOpen(true);
    if (!accountName && !accountNameError && !isLoadingAccountName) {
      const requestId = ++accountProfileRequestId.current;
      setIsLoadingAccountName(true);
      void getMyProfile()
        .then((result) => {
          if (accountProfileRequestId.current !== requestId) return;
          if (result.ok && result.data) {
            setAccountName(result.data.name);
          } else {
            setAccountNameError(
              result.error ?? "Unable to load your account name.",
            );
          }
        })
        .catch((error: unknown) => {
          if (accountProfileRequestId.current !== requestId) return;
          setAccountNameError(
            error instanceof Error
              ? error.message
              : "Unable to load your account name.",
          );
        })
        .finally(() => {
          if (accountProfileRequestId.current === requestId) {
            setIsLoadingAccountName(false);
          }
        });
    }
  };

  const handleLogout = () => {
    accountProfileRequestId.current += 1;
    setIsAccountMenuOpen(false);
    setAccountName("");
    setAccountNameError(null);
    setIsLoadingAccountName(false);
    void signOut({ redirectTo: "/login" });
  };

  return (
    <>
      <div className="border-b border-slate-100 bg-white">
        <div className="mx-auto flex max-w-9xl items-center justify-between gap-3 px-4 py-2 text-xs font-medium text-slate-500 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 sm:gap-6">
            <span className="flex items-center gap-1.5 whitespace-nowrap">
              <Truck className="size-3.5 text-green-600" aria-hidden="true" />
              Free Shipping on Orders 500 EGP
            </span>
            <span className="hidden items-center gap-1.5 whitespace-nowrap md:flex">
              <Sparkles
                className="size-3.5 text-green-600"
                aria-hidden="true"
              />
              New Arrivals Daily
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-2 whitespace-nowrap sm:gap-4">
            <span className="hidden whitespace-nowrap text-slate-500 xl:inline">
              Contact details available upon request
            </span>
            {isLoggedIn ? (
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 border-l border-slate-200 pl-3 text-slate-600 transition-colors hover:text-green-700 sm:pl-4"
              >
                <LogOut className="size-3.5" aria-hidden="true" />
                Sign Out
              </button>
            ) : (
              <>
                <Link
                  className="flex items-center gap-1.5 border-l border-slate-200 pl-3 transition-colors hover:text-green-700 sm:pl-4"
                  href="/login"
                >
                  <UserRound className="size-3.5" aria-hidden="true" />
                  Sign In
                </Link>
                <Link
                  className="hidden items-center gap-1.5 transition-colors hover:text-green-700 xl:flex"
                  href="/register"
                >
                  <UserPlus className="size-3.5" aria-hidden="true" />
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-9xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6 lg:flex-nowrap lg:gap-5 lg:px-8">
          <Link
            className="flex shrink-0 items-center gap-2 text-slate-800"
            href="/"
          >
            <ShoppingCart
              className="size-7 text-green-600"
              strokeWidth={2}
              aria-hidden="true"
            />
            <span className="text-xl font-bold tracking-tight sm:text-2xl">
              FreshCart
            </span>
          </Link>

          <form
            action="/products"
            method="get"
            className="order-3 flex min-w-full flex-1 lg:order-0 lg:min-w-0"
            role="search"
          >
            <label className="sr-only" htmlFor="product-search">
              Search products
            </label>
            <div className="flex w-full items-center rounded-full border border-slate-200 bg-white p-1 pl-4 transition-colors focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-100">
              <input
                className="min-w-0 flex-1 bg-transparent py-2 text-sm text-slate-700 outline-none placeholder:text-slate-400"
                id="product-search"
                name="search"
                placeholder="Search for products, brands and more..."
                type="search"
              />
              <button
                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-green-600 text-white transition-colors hover:bg-green-700"
                type="submit"
                aria-label="Search"
              >
                <Search className="size-4" aria-hidden="true" />
              </button>
            </div>
          </form>

          <nav
            className="hidden shrink-0 items-center gap-4 text-sm font-medium lg:flex xl:gap-5"
            aria-label="Main navigation"
          >
            <Link
              aria-current={pathname === "/" ? "page" : undefined}
              className={`transition-colors hover:text-green-600 ${pathname === "/" ? "text-green-700" : "text-slate-700"}`}
              href="/"
            >
              Home
            </Link>
            <Link
              aria-current={
                pathname.startsWith("/products") ? "page" : undefined
              }
              className={`transition-colors hover:text-green-600 ${pathname.startsWith("/products") ? "text-green-700" : "text-slate-700"}`}
              href="/products"
            >
              Shop
            </Link>
            <div className="relative group py-2">
              <Link
                aria-current={
                  pathname.startsWith("/categories") ? "page" : undefined
                }
                className={`flex items-center gap-1 transition-colors hover:text-green-600 group-hover:text-green-600 ${pathname.startsWith("/categories") ? "text-green-700" : "text-slate-700"}`}
                href="/categories"
              >
                Categories
                <ChevronDown
                  className="size-3.5 transition-transform duration-200 group-hover:rotate-180"
                  aria-hidden="true"
                />
              </Link>

              <div className="absolute left-0 top-full z-50 hidden w-56 flex-col rounded-xl border border-slate-100 bg-white py-2 shadow-xl shadow-slate-900/10 group-hover:flex group-focus-within:flex">
                <Link
                  href="/categories"
                  className="px-4 py-2.5 text-sm text-slate-600 transition-colors hover:bg-green-50 hover:text-green-700"
                >
                  All Categories
                </Link>
                <Link
                  href="/categories/electronics"
                  className="px-4 py-2.5 text-sm text-slate-600 transition-colors hover:bg-green-50 hover:text-green-700"
                >
                  Electronics
                </Link>
                <Link
                  href="/categories/womens-fashion"
                  className="px-4 py-2.5 text-sm text-slate-600 transition-colors hover:bg-green-50 hover:text-green-700"
                >
                  Women&apos;s Fashion
                </Link>
                <Link
                  href="/categories/mens-fashion"
                  className="px-4 py-2.5 text-sm text-slate-600 transition-colors hover:bg-green-50 hover:text-green-700"
                >
                  Men&apos;s Fashion
                </Link>
                <Link
                  href="/categories/beauty-and-health"
                  className="px-4 py-2.5 text-sm text-slate-600 transition-colors hover:bg-green-50 hover:text-green-700"
                >
                  Beauty &amp; Health
                </Link>
              </div>
            </div>
            <Link
              aria-current={pathname === "/brands" ? "page" : undefined}
              className={`transition-colors hover:text-green-600 ${pathname === "/brands" ? "text-green-700" : "text-slate-700"}`}
              href="/brands"
            >
              Brands
            </Link>
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
            <div className="hidden items-center gap-2 border-r border-slate-200 pr-3 xl:flex">
              <span className="flex size-9 items-center justify-center rounded-full bg-green-50 text-green-600">
                <Headset className="size-4" aria-hidden="true" />
              </span>
              <span className="leading-tight">
                <span className="block text-[11px] text-slate-400">
                  Support
                </span>
                <span className="block text-[11px] font-semibold text-slate-700">
                  24/7 Help
                </span>
              </span>
            </div>
            <button
              type="button"
              className="flex size-9 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-green-600 lg:hidden"
              aria-label={
                isMobileMenuOpen ? "Close navigation" : "Open navigation"
              }
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-navigation"
              onClick={() => setIsMobileMenuOpen((open) => !open)}
            >
              {isMobileMenuOpen ? (
                <X className="size-5" aria-hidden="true" />
              ) : (
                <Menu className="size-5" aria-hidden="true" />
              )}
            </button>
            <Link
              className="relative hidden size-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-50 hover:text-green-600 focus-visible:outline-2 focus-visible:outline-green-600 sm:flex"
              href="/wishlist"
              aria-label="Wishlist"
            >
              <Heart className="size-5" aria-hidden="true" />
              {wishlistItems.length > 0 && (
                <span className="absolute right-0 top-0 flex min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold leading-4 text-white">
                  {wishlistItems.length > 99 ? "99+" : wishlistItems.length}
                </span>
              )}
            </Link>
            <Link
              className="relative flex size-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-50 hover:text-green-600 focus-visible:outline-2 focus-visible:outline-green-600"
              href="/cart"
              aria-label="Shopping cart"
            >
              <ShoppingCartPlus className="size-5" aria-hidden="true" />
              {cartCount > 0 && (
                <span className="absolute right-0 top-0 flex min-w-4 items-center justify-center rounded-full bg-green-600 px-1 text-[9px] font-bold leading-4 text-white">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>

            {isLoggedIn ? (
              <div className="relative" ref={accountMenuRef}>
                <button
                  type="button"
                  aria-label="My Account"
                  aria-expanded={isAccountMenuOpen}
                  aria-haspopup="true"
                  aria-controls="account-menu"
                  className="flex size-9 items-center justify-center rounded-full bg-green-50 text-green-700 transition-colors hover:bg-green-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
                  onClick={handleAccountMenuToggle}
                >
                  <UserRound className="size-5" aria-hidden="true" />
                </button>
                {isAccountMenuOpen && (
                  <div
                    id="account-menu"
                    className="absolute right-0 top-full z-[60] mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-xl bg-white p-2 shadow-xl shadow-slate-900/15 ring-1 ring-slate-900/5"
                    aria-label="Account menu"
                  >
                    <div className="flex items-center gap-3 px-3 py-3">
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-700">
                        <UserRound className="size-5" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {accountName ||
                            (isLoadingAccountName
                              ? "Loading account..."
                              : "My Account")}
                        </p>
                        {accountNameError && (
                          <p className="mt-0.5 text-xs text-red-600" role="alert">
                            {accountNameError}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-0.5 border-t border-slate-100 pt-2">
                      <Link
                        href="/profile"
                        onClick={() => setIsAccountMenuOpen(false)}
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-green-50 hover:text-green-700"
                      >
                        <UserRound className="size-4" aria-hidden="true" />
                        My Profile
                      </Link>
                      <Link
                        href="/wishlist"
                        onClick={() => setIsAccountMenuOpen(false)}
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-green-50 hover:text-green-700"
                      >
                        <Heart className="size-4" aria-hidden="true" />
                        My Wishlist
                      </Link>
                      <Link
                        href="/orders"
                        onClick={() => setIsAccountMenuOpen(false)}
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-green-50 hover:text-green-700"
                      >
                        <ClipboardList className="size-4" aria-hidden="true" />
                        My Orders
                      </Link>
                      <Link
                        href="/profile?tab=addresses"
                        onClick={() => setIsAccountMenuOpen(false)}
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-green-50 hover:text-green-700"
                      >
                        <MapPin className="size-4" aria-hidden="true" />
                        Addresses
                      </Link>
                      <Link
                        href="/profile?tab=settings"
                        onClick={() => setIsAccountMenuOpen(false)}
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-green-50 hover:text-green-700"
                      >
                        <Settings className="size-4" aria-hidden="true" />
                        Settings
                      </Link>
                    </div>

                    <div className="mt-2 border-t border-slate-100 pt-2">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
                      >
                        <LogOut className="size-4" aria-hidden="true" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                aria-label="Sign In"
                className="flex size-9 items-center justify-center rounded-full border border-slate-300 text-slate-600 transition-colors hover:border-green-600 hover:text-green-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
                href="/login"
              >
                <UserRound className="size-5" aria-hidden="true" />
              </Link>
            )}
          </div>
        </div>
        {isMobileMenuOpen && (
          <nav
            id="mobile-navigation"
            className="absolute right-4 top-full z-50 flex min-w-52 flex-col rounded-xl border border-slate-200 bg-white p-2 shadow-xl lg:hidden"
            aria-label="Mobile navigation"
          >
            {[
              ["Home", "/"],
              ["Shop", "/products"],
              ["Categories", "/categories"],
              ["All Categories", "/categories"],
              ["Electronics", "/categories/electronics"],
              ["Women's Fashion", "/categories/womens-fashion"],
              ["Men's Fashion", "/categories/mens-fashion"],
              ["Beauty & Health", "/categories/beauty-and-health"],
              ["Brands", "/brands"],
              ["Wishlist", "/wishlist"],
              ["Shopping Cart", "/cart"],
              ...(isLoggedIn
                ? [
                    ["My Account", "/profile"],
                    ["My Orders", "/orders"],
                  ]
                : []),
            ].map(([label, href]) => (
              <Link
                key={label}
                href={href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2.5 text-sm text-slate-700 hover:bg-green-50 hover:text-green-700"
              >
                {label}
              </Link>
            ))}
          </nav>
        )}
      </header>
    </>
  );
}
