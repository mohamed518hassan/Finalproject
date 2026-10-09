"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSafeInternalPath } from "@/api/auth";
import { signIn as authSignIn } from "next-auth/react";
import {
  Check,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  MapPinCheck,
  PackageSearch,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Star,
  Loader2,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

const benefits = [
  {
    icon: PackageSearch,
    title: "Easy Order Tracking",
    description: "Follow every delivery from checkout to your doorstep.",
  },
  {
    icon: Sparkles,
    title: "Exclusive Deals",
    description: "Get early access to fresh finds and member-only prices.",
  },
  {
    icon: MapPinCheck,
    title: "Express Checkout",
    description: "Save your details and finish your next order in seconds.",
  },
];

function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const { syncGuestCart } = useCart();
  const { refreshSession } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const loginMessage = sessionStorage.getItem("loginMessage");
    if (loginMessage) {
      sessionStorage.removeItem("loginMessage");
      const timer = window.setTimeout(() => {
        setMessage(loginMessage);
        setIsError(false);
      }, 0);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    setMessage("");
    setIsError(false);
    setIsSubmitting(true);

    const form = new FormData(event.currentTarget);

    try {
      const returnPath = getSafeInternalPath(searchParams.get("redirect"));
      const result = await authSignIn("credentials", {
        email: String(form.get("email") ?? ""),
        password: String(form.get("password") ?? ""),
        redirect: false,
        redirectTo: returnPath,
      });
      if (!result.ok || result.error) {
        throw new Error("Incorrect email or password. Please try again.");
      }
      await refreshSession();

      const syncResult = await syncGuestCart();
      if (!syncResult.ok) {
        setMessage(
          syncResult.error ??
            "Signed in, but your guest cart could not be synced.",
        );
        setIsError(true);
        return;
      }

      router.replace(returnPath);
    } catch (error) {
      setIsError(true);
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to sign in. Please try again.",
      );
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <main className="overflow-hidden bg-[#f5f8f7]">
      <div className="mx-auto grid min-h-199 max-w-360 lg:grid-cols-[minmax(0,0.92fr)_minmax(520px,1.08fr)]">
        <section className="relative order-2 overflow-hidden bg-[#0d6b4e] px-6 py-14 text-white sm:px-12 lg:order-1 lg:px-16 lg:py-20 xl:px-24">
          <div className="absolute -right-24 -top-24 size-72 rounded-full border-38 border-white/5" />
          <div className="absolute -bottom-40 -left-28 size-96 rounded-full border-50 border-emerald-300/10" />
          <div className="relative mx-auto flex h-full max-w-xl flex-col">
            <Link href="/" className="mb-14 flex items-center gap-3 text-white">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-white text-[#0d6b4e] shadow-lg">
                <ShoppingCart className="size-6" aria-hidden="true" />
              </span>
              <span className="text-2xl font-bold tracking-tight">
                FreshCart
              </span>
            </Link>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-emerald-200">
              Your cart is waiting
            </p>
            <h1 className="max-w-lg text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl xl:text-6xl">
              Welcome Back to FreshCart
            </h1>
            <p className="mt-6 max-w-md text-base leading-7 text-emerald-50/80 sm:text-lg">
              Pick up where you left off and enjoy a faster, fresher way to
              shop.
            </p>
            <div className="mt-12 grid gap-5 sm:grid-cols-3 lg:grid-cols-1 lg:gap-6">
              {benefits.map(({ icon: Icon, title, description }) => (
                <div className="flex gap-4" key={title}>
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/15 text-emerald-100">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="font-semibold">{title}</h2>
                    <p className="mt-1 text-sm leading-5 text-emerald-50/70">
                      {description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <figure className="mt-auto hidden rounded-2xl border border-white/10 bg-[#07563f] p-6 lg:block">
              <div className="mb-4 flex gap-1 text-amber-300">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star
                    className="size-4 fill-current"
                    key={index}
                    aria-hidden="true"
                  />
                ))}
              </div>
              <blockquote className="text-lg leading-7 text-white/90">
                &ldquo;I can find exactly what I need, check my delivery, and
                reorder in a few clicks. FreshCart makes shopping feel
                easy.&rdquo;
              </blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-full bg-emerald-200 font-bold text-[#0d6b4e]">
                  OM
                </span>
                <span>
                  <span className="block text-sm font-semibold">
                    Omar Mitchell
                  </span>
                  <span className="block text-xs text-emerald-100/60">
                    Verified FreshCart customer
                  </span>
                </span>
              </figcaption>
            </figure>
          </div>
        </section>

        <section className="order-1 flex items-center bg-white px-5 py-12 sm:px-10 lg:order-2 lg:px-14 xl:px-24">
          <div className="mx-auto w-full max-w-xl">
            <div className="mb-8">
              <span className="mb-5 inline-flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <KeyRound className="size-6" aria-hidden="true" />
              </span>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Sign In to Your Account
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-500 sm:text-base">
                Welcome back. Enter your details to continue shopping.
              </p>
            </div>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label
                  className="mb-2 block text-sm font-semibold text-slate-700"
                  htmlFor="email"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail
                    className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400"
                    aria-hidden="true"
                  />
                  <input
                    className="h-13 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                    id="email"
                    name="email"
                    placeholder="you@example.com"
                    required
                    type="email"
                  />
                </div>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label
                    className="block text-sm font-semibold text-slate-700"
                    htmlFor="password"
                  >
                    Password
                  </label>
                  <Link
                    className="text-xs font-semibold text-emerald-600 hover:underline sm:text-sm"
                    href="/forgot-password"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <KeyRound
                    className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400"
                    aria-hidden="true"
                  />
                  <input
                    className="h-13 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-12 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                    id="password"
                    name="password"
                    placeholder="Enter your password"
                    required
                    type={showPassword ? "text" : "password"}
                  />
                  <button
                    className="absolute right-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 hover:text-emerald-600"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    type="button"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" aria-hidden="true" />
                    ) : (
                      <Eye className="size-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>
              <label className="flex cursor-pointer items-center gap-3 pt-1 text-sm text-slate-500">
                <input
                  className="size-4 accent-emerald-600"
                  disabled
                  name="remember"
                  type="checkbox"
                />
                <span>
                  Remember Me
                  <span className="mt-1 block text-xs text-slate-400">
                    Session duration is server-managed; the backend does not
                    document token refresh.
                  </span>
                </span>
              </label>

              {/* عرض الرسالة بلون مختلف بناءً على الحالة (خطأ أو نجاح) */}
              {message && (
                <p
                  className={`rounded-lg px-4 py-3 text-sm font-medium ${isError ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-700"}`}
                  role={isError ? "alert" : "status"}
                >
                  {message}
                </p>
              )}

              <button
                className="flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="size-4" aria-hidden="true" /> Sign
                    In
                  </>
                )}
              </button>
            </form>
            <div className="my-8 flex items-center gap-4 text-xs text-slate-300">
              <span className="h-px flex-1 bg-slate-200" />
              <span>New to FreshCart?</span>
              <span className="h-px flex-1 bg-slate-200" />
            </div>
            <Link
              className="flex h-13 w-full items-center justify-center rounded-xl border border-emerald-200 text-sm font-bold text-emerald-700 transition hover:bg-emerald-50"
              href="/register"
            >
              Create a New Account
            </Link>
            <p className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400">
              <Check className="size-3.5 text-emerald-600" aria-hidden="true" />
              Your information is encrypted and secure
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function Login() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-[60vh] items-center justify-center bg-[#f5f8f7]">
          <p className="text-sm text-slate-500" role="status">
            Loading sign in...
          </p>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
