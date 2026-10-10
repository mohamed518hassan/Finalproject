"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { signUp } from "@/api/auth";
import { toast } from "react-toastify";
import {
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Phone,
  Sparkles,
  Star,
  User,
  UserRoundPlus,
  Loader2,
} from "lucide-react";

const highlights = [
  {
    icon: Sparkles,
    title: "Fresh Quality Guaranteed",
    description: "Every item is checked for top quality before shipment.",
  },
];

export default function Register() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // تعريف المتغيرات التي كانت ناقصة
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const submittingRef = useRef(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submittingRef.current) return;
    setErrorMessage("");

    const form = new FormData(event.currentTarget);
    const name = form.get("name") as string;
    const email = form.get("email") as string;
    const password = form.get("password") as string;
    const rePassword = form.get("confirmPassword") as string;
    const phone = form.get("phone") as string;

    if (password !== rePassword) {
      setErrorMessage(
        "Passwords do not match. Please check them and try again.",
      );
      return;
    }

    submittingRef.current = true;
    try {
      setIsLoading(true);

      const result = await signUp({ name, email, password, rePassword, phone });
      if (result.ok && result.message === "success") {
        toast.success("تم إنشاء الحساب بنجاح! أهلاً بك 🎉");
        router.push("/login");
      } else {
        setErrorMessage(
          result.message ?? "Registration failed. Please try again.",
        );
      }
    } finally {
      submittingRef.current = false;
      setIsLoading(false);
    }
  };

  return (
    <main className="bg-[#f7faf8] px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
      <div className="mx-auto grid max-w-300 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_16px_50px_rgba(15,23,42,0.08)] xl:grid-cols-[0.9fr_1.1fr]">
        <section className="relative order-2 overflow-hidden border-t border-slate-100 px-6 py-10 sm:px-12 sm:py-14 xl:order-1 xl:border-r xl:border-t-0 xl:px-16 xl:py-18">
          <div className="absolute -right-24 -top-24 size-72 rounded-full border-38 border-emerald-50" />
          <div className="absolute -bottom-40 -left-28 size-96 rounded-full border-50 border-emerald-50/80" />

          <div className="relative mx-auto flex h-full max-w-xl flex-col">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">
              Shop better. Live fresher.
            </p>
            <h1 className="max-w-lg text-3xl font-bold leading-[1.1] tracking-tight text-slate-900 sm:text-4xl xl:text-5xl">
              Welcome to FreshCart
            </h1>
            <p className="mt-5 max-w-md text-sm leading-6 text-slate-500 sm:text-base sm:leading-7">
              Everything you love, delivered to your door. Create an account and
              make every shopping trip feel effortless.
            </p>

            <div className="mt-9 grid gap-5 sm:grid-cols-3 xl:grid-cols-1 xl:gap-6">
              {highlights.map(({ icon: Icon, title, description }) => (
                <div className="flex gap-4" key={title}>
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="font-semibold text-slate-800">{title}</h2>
                    <p className="mt-1 text-sm leading-5 text-slate-500">
                      {description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <figure className="mt-10 hidden rounded-xl border border-emerald-100 bg-emerald-50/60 p-5 xl:block">
              <div className="mb-4 flex gap-1 text-amber-400">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star
                    className="size-4 fill-current"
                    key={index}
                    aria-hidden="true"
                  />
                ))}
              </div>
              <blockquote className="text-base leading-6 text-slate-600">
                &ldquo;FreshCart has made grocery and lifestyle shopping so
                simple. Everything arrives quickly and exactly as
                promised.&rdquo;
              </blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-full bg-emerald-200 font-bold text-emerald-700">
                  AM
                </span>
                <span>
                  <span className="block text-sm font-semibold text-slate-800">
                    Amelia Morgan
                  </span>
                  <span className="block text-xs text-slate-500">
                    Verified FreshCart customer
                  </span>
                </span>
              </figcaption>
            </figure>
          </div>
        </section>

        <section className="order-1 flex items-center bg-white px-5 py-10 sm:px-10 sm:py-14 xl:order-2 xl:px-16 xl:py-18">
          <div className="mx-auto w-full max-w-2xl">
            <div className="mb-8">
              <span className="mb-5 inline-flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <UserRoundPlus className="size-6" aria-hidden="true" />
              </span>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Create Your Account
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-500 sm:text-base">
                Join thousands of shoppers enjoying a fresher way to shop.
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label
                  className="mb-2 block text-sm font-semibold text-slate-700"
                  htmlFor="name"
                >
                  Full Name
                </label>
                <div className="relative">
                  <User
                    className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400"
                    aria-hidden="true"
                  />
                  <input
                    className="h-13 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                    id="name"
                    name="name"
                    placeholder="Enter your full name"
                    required
                    type="text"
                  />
                </div>
              </div>

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

              <div className="grid gap-5 sm:grid-cols-2">
                <PasswordField
                  id="password"
                  label="Password"
                  name="password"
                  placeholder="Create a password"
                  show={showPassword}
                  toggle={() => setShowPassword(!showPassword)}
                />
                <PasswordField
                  id="confirmPassword"
                  label="Confirm Password"
                  name="confirmPassword"
                  placeholder="Repeat your password"
                  show={showConfirmPassword}
                  toggle={() => setShowConfirmPassword(!showConfirmPassword)}
                />
              </div>

              <div>
                <label
                  className="mb-2 block text-sm font-semibold text-slate-700"
                  htmlFor="phone"
                >
                  Phone Number
                </label>
                <div className="relative">
                  <Phone
                    className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400"
                    aria-hidden="true"
                  />
                  <input
                    className="h-13 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                    id="phone"
                    name="phone"
                    placeholder="01000000000"
                    required
                    type="tel"
                  />
                </div>
              </div>

              <label className="flex cursor-pointer items-start gap-3 pt-1 text-sm leading-5 text-slate-500">
                <input
                  className="mt-0.5 size-4 accent-emerald-600"
                  name="terms"
                  required
                  type="checkbox"
                />
                <span>
                  I agree to the{" "}
                  <Link
                    className="font-semibold text-emerald-600 hover:underline"
                    href="#terms"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    className="font-semibold text-emerald-600 hover:underline"
                    href="#privacy"
                  >
                    Privacy Policy
                  </Link>
                  .
                </span>
              </label>

              {errorMessage && (
                <p
                  className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-600"
                  role="alert"
                >
                  {errorMessage}
                </p>
              )}

              <button
                disabled={isLoading}
                className="flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 disabled:opacity-70"
                type="submit"
              >
                {isLoading ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <>
                    <LockKeyhole className="size-4" aria-hidden="true" />
                    Create Account
                  </>
                )}
              </button>
            </form>

            <p className="mt-7 text-center text-sm text-slate-500">
              Already have an account?{" "}
              <Link
                className="font-bold text-emerald-600 hover:underline"
                href="/login"
              >
                Sign in
              </Link>
            </p>
            <p className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400">
              <Check className="size-3.5 text-emerald-600" aria-hidden="true" />{" "}
              Your information is encrypted and secure
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function PasswordField({
  id,
  label,
  name,
  placeholder,
  show,
  toggle,
}: {
  id: string;
  label: string;
  name: string;
  placeholder: string;
  show: boolean;
  toggle: () => void;
}) {
  return (
    <div>
      <label
        className="mb-2 block text-sm font-semibold text-slate-700"
        htmlFor={id}
      >
        {label}
      </label>
      <div className="relative">
        <LockKeyhole
          className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
        <input
          className="h-13 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-11 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
          id={id}
          name={name}
          placeholder={placeholder}
          required
          type={show ? "text" : "password"}
        />
        <button
          className="absolute right-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 hover:text-emerald-600"
          onClick={toggle}
          aria-label={show ? `Hide ${label}` : `Show ${label}`}
          type="button"
        >
          {show ? (
            <EyeOff className="size-4" aria-hidden="true" />
          ) : (
            <Eye className="size-4" aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  );
}