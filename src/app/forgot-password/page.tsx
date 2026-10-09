"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  ArrowLeft,
  Check,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";
import {
  requestPasswordReset,
  resetPassword,
  verifyPasswordResetCode,
} from "@/api/passwordRecovery";

type RecoveryStep = 1 | 2 | 3;
type Feedback = { kind: "success" | "error"; text: string } | null;

const inputClassName =
  "h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10";

const steps = [
  { number: 1, label: "Email Address" },
  { number: 2, label: "Verify Code" },
  { number: 3, label: "New Password" },
];

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<RecoveryStep>(1);
  const [email, setEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const submitEmail = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);
    setIsSubmitting(true);
    const result = await requestPasswordReset(email.trim());
    setIsSubmitting(false);
    if (!result.ok) {
      setFeedback({
        kind: "error",
        text: result.message ?? "Could not send the reset code.",
      });
      return;
    }
    setStep(2);
    setFeedback({
      kind: "success",
      text:
        result.message ??
        "If an account matches that email, a verification code has been sent.",
    });
  };

  const submitCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);
    if (resetCode.length !== 6) {
      setFeedback({
        kind: "error",
        text: "Enter the 6-digit verification code.",
      });
      return;
    }
    setIsSubmitting(true);
    const result = await verifyPasswordResetCode(resetCode.trim());
    setIsSubmitting(false);
    if (!result.ok) {
      setFeedback({
        kind: "error",
        text: result.message ?? "The verification code could not be verified.",
      });
      return;
    }
    setStep(3);
    setFeedback({
      kind: "success",
      text: result.message ?? "Email verified. Choose a new password.",
    });
  };

  const resendCode = async () => {
    setFeedback(null);
    setIsResending(true);
    const result = await requestPasswordReset(email.trim());
    setIsResending(false);
    setFeedback({
      kind: result.ok ? "success" : "error",
      text:
        result.message ??
        (result.ok
          ? "A new code has been sent."
          : "Could not resend the reset code."),
    });
  };

  const submitNewPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);
    if (newPassword !== confirmPassword) {
      setFeedback({ kind: "error", text: "The passwords do not match." });
      return;
    }
    setIsSubmitting(true);
    const result = await resetPassword(email.trim(), newPassword);
    setIsSubmitting(false);
    if (!result.ok) {
      setFeedback({
        kind: "error",
        text: result.message ?? "Your password could not be reset.",
      });
      return;
    }

    setIsComplete(true);
    setFeedback({
      kind: "success",
      text:
        result.message ??
        "Password reset successfully. Redirecting to sign in...",
    });
    window.setTimeout(() => router.push("/login"), 900);
  };

  const goBack = () => {
    setFeedback(null);
    setStep((current) => (current === 3 ? 2 : 1));
  };

  return (
    <main className="min-h-[calc(100vh-160px)] bg-[#f5f8f7] px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
      <div className="mx-auto grid max-w-6xl overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_16px_50px_rgba(15,23,42,0.08)] lg:min-h-[560px] lg:grid-cols-2">
        <section className="order-2 flex flex-col justify-center bg-emerald-50/70 px-6 py-10 sm:px-10 lg:order-1 lg:px-14">
          <div className="relative mx-auto flex aspect-[4/2.5] w-full max-w-md items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-100 to-green-50">
            <span className="absolute left-[15%] top-[20%] size-12 rounded-full bg-white/80" />
            <span className="absolute right-[18%] top-[18%] size-8 rounded-full bg-emerald-200/60" />
            <span className="absolute bottom-[14%] left-[25%] size-6 rounded-full bg-white/80" />
            <span className="relative flex size-28 items-center justify-center rounded-[2rem] bg-white text-emerald-600 shadow-xl shadow-emerald-900/10 sm:size-32">
              <LockKeyhole
                className="size-14 sm:size-16"
                strokeWidth={1.5}
                aria-hidden="true"
              />
            </span>
            <span className="absolute bottom-7 flex gap-2">
              {steps.map(({ number }) => (
                <span
                  className={`size-2 rounded-full ${step >= number ? "bg-emerald-600" : "bg-emerald-200"}`}
                  key={number}
                />
              ))}
            </span>
          </div>
          <div className="mx-auto mt-7 max-w-md text-center">
            <h2 className="text-xl font-bold text-slate-900">
              Reset Your Password
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Don&apos;t worry, it happens. Follow a few simple steps to
              securely access your account again.
            </p>
            <p className="mt-4 inline-flex items-center gap-2 text-xs font-medium text-slate-400">
              <ShieldCheck
                className="size-4 text-emerald-600"
                aria-hidden="true"
              />
              Secure account recovery
            </p>
          </div>
        </section>

        <section className="order-1 flex items-center px-5 py-10 sm:px-10 lg:order-2 lg:px-14">
          <div className="mx-auto w-full max-w-md">
            <Link
              className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-emerald-700"
              href="/login"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back to Sign In
            </Link>
            <div className="mb-7">
              <span className="mb-4 inline-flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                {step === 1 ? (
                  <Mail className="size-6" aria-hidden="true" />
                ) : step === 2 ? (
                  <ShieldCheck className="size-6" aria-hidden="true" />
                ) : (
                  <KeyRound className="size-6" aria-hidden="true" />
                )}
              </span>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">
                Step {step} of 3
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                {step === 1
                  ? "Forgot Password?"
                  : step === 2
                    ? "Verify Your Email"
                    : "Create New Password"}
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {step === 1
                  ? "Enter the email address associated with your account."
                  : step === 2
                    ? `Enter the reset code sent to ${email}.`
                    : "Choose a new password for your FreshCart account."}
              </p>
            </div>

            <ol
              aria-label="Password reset steps"
              className="mb-7 grid grid-cols-3 gap-2"
            >
              {steps.map(({ number, label }) => (
                <li className="min-w-0" key={number}>
                  <span
                    className={`mb-2 block h-1 rounded-full ${step >= number ? "bg-emerald-600" : "bg-slate-100"}`}
                  />
                  <span
                    className={`text-[10px] font-semibold sm:text-xs ${step === number ? "text-emerald-700" : "text-slate-400"}`}
                  >
                    {label}
                  </span>
                </li>
              ))}
            </ol>

            {feedback && (
              <p
                className={`mb-5 rounded-lg px-4 py-3 text-sm font-medium ${feedback.kind === "error" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}
                role={feedback.kind === "error" ? "alert" : "status"}
              >
                {feedback.text}
              </p>
            )}

            <div
              key={step}
              className="animate-in fade-in slide-in-from-bottom-2 duration-300"
            >
              {step === 1 && (
                <form className="space-y-5" onSubmit={submitEmail}>
                  <div>
                    <label
                      className="mb-2 block text-sm font-semibold text-slate-700"
                      htmlFor="recovery-email"
                    >
                      Email Address
                    </label>
                    <input
                      autoComplete="email"
                      className={inputClassName}
                      id="recovery-email"
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@example.com"
                      required
                      type="email"
                      value={email}
                    />
                  </div>
                  <button
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={isSubmitting}
                    type="submit"
                  >
                    {isSubmitting ? (
                      <LoaderCircle
                        className="size-5 animate-spin"
                        aria-hidden="true"
                      />
                    ) : null}
                    {isSubmitting ? "Sending reset code..." : "Send Reset Code"}
                  </button>
                </form>
              )}

              {step === 2 && (
                <form className="space-y-6" onSubmit={submitCode}>
                  <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)] sm:p-6">
                    <label
                      className="mb-3 block text-sm font-semibold text-slate-700"
                      htmlFor="reset-code-0"
                    >
                      Verification Code
                    </label>
                    <p className="mb-5 text-xs leading-5 text-slate-500">
                      Enter the 6-digit code sent to your email address.
                    </p>
                    <div
                      className="relative grid grid-cols-6 gap-2 rounded-xl transition-shadow has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-emerald-500/30 has-[:focus-visible]:ring-offset-2 sm:gap-3"
                      dir="ltr"
                    >
                      {Array.from({ length: 6 }, (_, index) => (
                        <span
                          className={`flex aspect-[0.82] max-h-14 items-center justify-center rounded-lg border bg-slate-50 text-lg font-bold text-slate-800 transition sm:rounded-xl sm:text-xl ${resetCode[index] ? "border-emerald-500 bg-emerald-50/50" : "border-slate-200"} ${index === Math.min(resetCode.length, 5) ? "ring-2 ring-emerald-500/15" : ""}`}
                          key={index}
                        >
                          {resetCode[index] ?? ""}
                        </span>
                      ))}
                      <input
                        aria-label="6-digit verification code"
                        autoComplete="one-time-code"
                        className="absolute inset-0 h-full w-full cursor-text opacity-0"
                        id="reset-code-0"
                        inputMode="numeric"
                        maxLength={6}
                        onChange={(event) => {
                          const value = event.target.value
                            .replace(/\D/g, "")
                            .slice(0, 6);
                          setResetCode(value);
                        }}
                        required
                        value={resetCode}
                      />
                    </div>
                    <p className="mt-4 text-center text-xs text-slate-400">
                      Didn&apos;t receive the code? Check your spam folder.
                    </p>
                  </div>
                  <button
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={isSubmitting}
                    type="submit"
                  >
                    {isSubmitting ? (
                      <LoaderCircle
                        className="size-5 animate-spin"
                        aria-hidden="true"
                      />
                    ) : null}
                    {isSubmitting ? "Verifying code..." : "Verify Code"}
                  </button>
                  <div className="flex flex-col items-center justify-between gap-3 text-sm sm:flex-row">
                    <button
                      className="font-semibold text-emerald-700 transition hover:text-emerald-800 hover:underline"
                      onClick={goBack}
                      type="button"
                    >
                      Change email address
                    </button>
                    <button
                      className="font-medium text-slate-500 transition hover:text-emerald-700 hover:underline disabled:cursor-wait disabled:opacity-60"
                      disabled={isResending}
                      onClick={() => void resendCode()}
                      type="button"
                    >
                      {isResending ? "Resending..." : "Resend code"}
                    </button>
                  </div>
                </form>
              )}

              {step === 3 && (
                <form
                  className="space-y-5 rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)] sm:p-6"
                  onSubmit={submitNewPassword}
                >
                  <div>
                    <label
                      className="mb-2 block text-sm font-semibold text-slate-700"
                      htmlFor="new-password"
                    >
                      New Password
                    </label>
                    <input
                      autoComplete="new-password"
                      className={inputClassName}
                      id="new-password"
                      minLength={6}
                      onChange={(event) => setNewPassword(event.target.value)}
                      placeholder="Enter your new password"
                      required
                      type="password"
                      value={newPassword}
                    />
                  </div>
                  <div>
                    <label
                      className="mb-2 block text-sm font-semibold text-slate-700"
                      htmlFor="confirm-new-password"
                    >
                      Confirm New Password
                    </label>
                    <input
                      autoComplete="new-password"
                      className={inputClassName}
                      id="confirm-new-password"
                      minLength={6}
                      onChange={(event) =>
                        setConfirmPassword(event.target.value)
                      }
                      placeholder="Re-enter your new password"
                      required
                      type="password"
                      value={confirmPassword}
                    />
                  </div>
                  <p className="text-xs leading-5 text-slate-500">
                    Use at least 6 characters. Choose a password you
                    haven&apos;t used before.
                  </p>
                  <button
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={isSubmitting || isComplete}
                    type="submit"
                  >
                    {isSubmitting ? (
                      <LoaderCircle
                        className="size-5 animate-spin"
                        aria-hidden="true"
                      />
                    ) : (
                      <Check className="size-4" aria-hidden="true" />
                    )}
                    {isSubmitting ? "Resetting password..." : "Reset Password"}
                  </button>
                  <button
                    className="flex w-full items-center justify-center text-sm font-semibold text-slate-500 transition hover:text-emerald-700 hover:underline"
                    onClick={goBack}
                    type="button"
                  >
                    Back to verification code
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
