"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createCheckoutSession } from "@/api/cart";
import type { ShippingAddress } from "@/api/cart";
import { createCashOrder } from "@/api/orders";
import { useCart } from "@/context/CartContext";
import AuthGuard from "@/app/_components/auth-guard";

const formatPrice = (value: number) => `${value.toLocaleString("en-US")} EGP`;

function CheckoutContent() {
  const { cartId, cartItems, totalPrice, isLoading, clearCart } = useCart();
  const router = useRouter();
  const [details, setDetails] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"online" | "cash">(
    "online",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submittingRef = useRef(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submittingRef.current) return;

    const shippingAddress: ShippingAddress = {
      details: details.trim(),
      phone: phone.trim(),
      city: city.trim(),
      postalCode: postalCode.trim(),
    };
    if (
      !shippingAddress.details ||
      !shippingAddress.phone ||
      !shippingAddress.city ||
      !shippingAddress.postalCode
    ) {
      setError("Please complete all shipping address fields.");
      return;
    }
    if (cartItems.length === 0) {
      setError("Your cart is empty.");
      return;
    }
    if (!cartId) {
      setError(
        "Your cart ID is unavailable. Please reload your cart and try again.",
      );
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);
    setError(null);
    try {
      if (paymentMethod === "cash") {
        const result = await createCashOrder(cartId, shippingAddress);
        if (!result.ok) {
          setError(result.error ?? "Unable to create your cash order.");
          return;
        }

        const clearResult = await clearCart();
        router.push(
          clearResult.ok ? "/orders" : "/orders?cartClearFailed=1",
        );
        return;
      }

      const result = await createCheckoutSession(cartId, shippingAddress);
      if (!result.ok || !result.data) {
        setError(result.error ?? "Unable to start checkout.");
        return;
      }
      window.location.assign(result.data.session.url);
    } catch {
      setError("Unable to start checkout. Please try again.");
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-20 text-center text-slate-500">
        Loading checkout...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl rounded-2xl bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-3xl font-bold text-slate-900">Checkout</h1>
        <p className="mt-2 text-sm text-slate-500">
          Review your order before completing your purchase.
        </p>
        <div className="mt-8 space-y-4">
          {cartItems.map((item) => (
            <div
              className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4"
              key={item.id}
            >
              <span className="text-sm font-medium text-slate-700">
                {item.title} x {item.quantity}
              </span>
              <span className="font-semibold text-slate-900">
                {formatPrice(item.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-6 flex items-center justify-between text-lg font-bold text-slate-900">
          <span>Total</span>
          <span className="text-emerald-600">{formatPrice(totalPrice)}</span>
        </div>
        {cartItems.length === 0 && (
          <p className="mt-6 text-sm text-slate-500">Your cart is empty.</p>
        )}
        <form
          className="mt-8 space-y-5 border-t border-slate-100 pt-6"
          onSubmit={handleSubmit}
        >
          <h2 className="text-xl font-bold text-slate-900">Shipping address</h2>
          <div>
            <label
              className="mb-2 block text-sm font-medium text-slate-700"
              htmlFor="shipping-details"
            >
              Address details
            </label>
            <textarea
              autoComplete="street-address"
              className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              id="shipping-details"
              onChange={(event) => setDetails(event.target.value)}
              required
              value={details}
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                className="mb-2 block text-sm font-medium text-slate-700"
                htmlFor="shipping-phone"
              >
                Phone
              </label>
              <input
                autoComplete="tel"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                id="shipping-phone"
                onChange={(event) => setPhone(event.target.value)}
                required
                type="tel"
                value={phone}
              />
            </div>
            <div>
              <label
                className="mb-2 block text-sm font-medium text-slate-700"
                htmlFor="shipping-city"
              >
                City
              </label>
              <input
                autoComplete="address-level2"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                id="shipping-city"
                onChange={(event) => setCity(event.target.value)}
                required
                type="text"
                value={city}
              />
            </div>
            <div>
              <label
                className="mb-2 block text-sm font-medium text-slate-700"
                htmlFor="shipping-postal-code"
              >
                Postal code
              </label>
              <input
                autoComplete="postal-code"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                id="shipping-postal-code"
                onChange={(event) => setPostalCode(event.target.value)}
                required
                type="text"
                value={postalCode}
              />
            </div>
          </div>
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-slate-700">
              Payment method
            </legend>
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-4 transition-colors hover:border-emerald-300">
              <input
                checked={paymentMethod === "online"}
                className="mt-0.5 accent-emerald-600"
                name="payment-method"
                onChange={() => setPaymentMethod("online")}
                type="radio"
                value="online"
              />
              <span>
                <span className="block text-sm font-semibold text-slate-800">
                  Pay online
                </span>
                <span className="mt-1 block text-xs text-slate-500">
                  Continue to secure card payment.
                </span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-4 transition-colors hover:border-emerald-300">
              <input
                checked={paymentMethod === "cash"}
                className="mt-0.5 accent-emerald-600"
                name="payment-method"
                onChange={() => setPaymentMethod("cash")}
                type="radio"
                value="cash"
              />
              <span>
                <span className="block text-sm font-semibold text-slate-800">
                  Cash on Delivery
                </span>
                <span className="mt-1 block text-xs text-slate-500">
                  Pay when your order arrives.
                </span>
              </span>
            </label>
          </fieldset>
          {error && (
            <p className="text-sm font-medium text-red-600" role="alert">
              {error}
            </p>
          )}
          <button
            className="inline-flex w-full items-center justify-center rounded-lg bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            disabled={isSubmitting || cartItems.length === 0}
            type="submit"
          >
            {isSubmitting
              ? paymentMethod === "cash"
                ? "Placing order..."
                : "Starting checkout..."
              : paymentMethod === "cash"
                ? "Place cash order"
                : "Continue to payment"}
          </button>
        </form>
        <Link
          className="mt-8 inline-flex rounded-lg bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-700"
          href="/cart"
        >
          Back to cart
        </Link>
      </div>
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <AuthGuard>
      <CheckoutContent />
    </AuthGuard>
  );
}
