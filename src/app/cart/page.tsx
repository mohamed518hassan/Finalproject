"use client";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Check,
  LoaderCircle,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Truck,
} from "lucide-react";
import { useState } from "react";
import { useCart } from "@/context/CartContext";

const formatPrice = (value: number) => `${value.toLocaleString("en-US")} EGP`;

export default function Cart() {
  const {
    cartItems,
    cartCount: itemCount,
    totalPrice: subtotal,
    isLoading,
    pendingQuantityIds,
    pendingRemovalIds,
    error,
    reloadCart,
    updateQuantity,
    removeFromCart,
    checkout,
  } = useCart();
  const [quantityActions, setQuantityActions] = useState<
    Record<string, "increase" | "decrease">
  >({});

  const handleQuantityUpdate = async (
    productId: string,
    quantity: number,
    direction: "increase" | "decrease",
  ) => {
    setQuantityActions((current) => ({ ...current, [productId]: direction }));
    try {
      await updateQuantity(productId, quantity);
    } finally {
      setQuantityActions((current) => {
        const next = { ...current };
        delete next[productId];
        return next;
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f9fb] text-[#152238]">
      <section className="mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-6 lg:px-8 lg:pt-10">
        <div className="mb-8 flex items-center gap-2 text-sm text-slate-500">
          <Link className="transition-colors hover:text-green-600" href="/">
            Home
          </Link>
          <span className="text-slate-300">/</span>
          <span className="font-medium text-slate-700">Shopping Cart</span>
        </div>

        <div className="mb-9 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-xl bg-green-600 text-white shadow-lg shadow-green-600/20">
                <ShoppingBag className="size-5" aria-hidden="true" />
              </span>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Shopping Cart
              </h1>
            </div>
            <p className="text-sm text-slate-500">
              You have{" "}
              <span className="font-bold text-green-600">
                {itemCount} items
              </span>{" "}
              in your cart
            </p>
          </div>
          <Link
            href="/products"
            className="flex items-center gap-2 self-start text-sm font-semibold text-green-700 transition-colors hover:text-green-800 sm:self-auto"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Continue shopping
          </Link>
        </div>

        {isLoading ? (
          <div className="rounded-2xl bg-white px-6 py-20 text-center shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Loading your cart...
            </p>
          </div>
        ) : error && cartItems.length === 0 ? (
          <div
            className="rounded-2xl border border-red-100 bg-white px-6 py-12 text-center"
            role="alert"
          >
            <p className="text-sm font-medium text-red-700">{error}</p>
            <button
              type="button"
              onClick={() => void reloadCart()}
              className="mt-5 rounded-lg bg-green-600 px-5 py-3 text-sm font-bold text-white hover:bg-green-700"
            >
              Retry loading cart
            </button>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-20 text-center shadow-sm">
            <ShoppingBag className="mx-auto mb-4 size-10 text-slate-300" />
            <h2 className="text-xl font-bold">Your cart is empty</h2>
            <p className="mt-2 text-sm text-slate-500">
              Discover something fresh for your next order.
            </p>
            <Link
              className="mt-6 inline-flex rounded-lg bg-green-600 px-5 py-3 text-sm font-bold text-white hover:bg-green-700"
              href="/products"
            >
              Start shopping
            </Link>
          </div>
        ) : (
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_390px]">
            <div className="space-y-4">
              {cartItems.map((item) => (
                <article
                  className="group flex min-h-44.5 gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_5px_20px_rgba(21,34,56,0.04)] transition-shadow hover:shadow-[0_12px_30px_rgba(21,34,56,0.08)] sm:gap-6 sm:p-5"
                  key={item.id}
                >
                  <div className="flex size-28 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-50 sm:size-36">
                    <Image
                      className="h-full w-full object-cover"
                      src={item.image}
                      alt={item.title}
                      width={144}
                      height={144}
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col py-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="truncate text-base font-bold text-slate-900 sm:text-lg">
                          {item.title}
                        </h2>
                        <span className="mt-2 inline-flex rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-semibold text-green-700">
                          {item.category ?? "Fresh products"}
                        </span>
                      </div>
                      <button
                        className="rounded-lg p-2 text-slate-300 transition-colors hover:bg-red-50 hover:text-red-500 disabled:cursor-wait disabled:opacity-50"
                        onClick={() => void removeFromCart(item.id)}
                        aria-label={`${pendingRemovalIds.includes(item.id) ? "Removing" : "Remove"} ${item.title}`}
                        aria-busy={pendingRemovalIds.includes(item.id)}
                        disabled={
                          pendingQuantityIds.includes(item.id) ||
                          pendingRemovalIds.includes(item.id)
                        }
                        type="button"
                      >
                        {pendingRemovalIds.includes(item.id) ? (
                          <LoaderCircle
                            className="size-4 animate-spin"
                            aria-hidden="true"
                          />
                        ) : (
                          <Trash2 className="size-4" aria-hidden="true" />
                        )}
                      </button>
                    </div>
                    <div className="mt-auto flex flex-wrap items-end justify-between gap-4">
                      <div>
                        <p className="text-lg font-bold text-green-600">
                          {formatPrice(item.price)}
                        </p>
                        <div
                          className="mt-3 inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 p-1"
                          aria-busy={
                            pendingQuantityIds.includes(item.id) ||
                            pendingRemovalIds.includes(item.id)
                          }
                        >
                          <button
                            className="flex size-7 items-center justify-center rounded-md text-slate-500 hover:bg-white hover:text-green-600 disabled:cursor-wait disabled:opacity-50"
                            onClick={() =>
                              void handleQuantityUpdate(
                                item.id,
                                item.quantity - 1,
                                "decrease",
                              )
                            }
                            aria-label={`Decrease ${item.title} quantity`}
                            aria-busy={quantityActions[item.id] === "decrease"}
                            disabled={
                              item.quantity <= 1 ||
                              pendingQuantityIds.includes(item.id) ||
                              pendingRemovalIds.includes(item.id)
                            }
                            type="button"
                          >
                            {quantityActions[item.id] === "decrease" ? (
                              <LoaderCircle
                                className="size-3.5 animate-spin"
                                aria-hidden="true"
                              />
                            ) : (
                              <Minus className="size-3.5" aria-hidden="true" />
                            )}
                          </button>
                          <span className="flex w-8 items-center justify-center text-sm font-bold text-slate-800">
                            {item.quantity}
                          </span>
                          <button
                            className="flex size-7 items-center justify-center rounded-md bg-green-600 text-white shadow-sm hover:bg-green-700 disabled:cursor-wait disabled:opacity-50"
                            onClick={() =>
                              void handleQuantityUpdate(
                                item.id,
                                item.quantity + 1,
                                "increase",
                              )
                            }
                            aria-label={`Increase ${item.title} quantity`}
                            aria-busy={quantityActions[item.id] === "increase"}
                            disabled={
                              pendingQuantityIds.includes(item.id) ||
                              pendingRemovalIds.includes(item.id)
                            }
                            type="button"
                          >
                            {quantityActions[item.id] === "increase" ? (
                              <LoaderCircle
                                className="size-3.5 animate-spin"
                                aria-hidden="true"
                              />
                            ) : (
                              <Plus className="size-3.5" aria-hidden="true" />
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                          Total
                        </p>
                        <p className="text-xl font-bold text-slate-900">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <aside className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_5px_20px_rgba(21,34,56,0.05)] lg:sticky lg:top-24">
              <div className="bg-[#101a2d] px-6 py-5 text-white">
                <h2 className="text-lg font-bold">Order Summary</h2>
                <p className="mt-1 text-xs text-slate-400">
                  Review your order before checkout
                </p>
              </div>
              <div className="p-6">
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal ({itemCount} items)</span>
                    <span className="font-semibold text-slate-700">
                      {formatPrice(subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Shipping</span>
                    <span className="font-semibold text-green-600">
                      Calculated at checkout
                    </span>
                  </div>
                </div>
                <div className="my-5 border-t border-slate-100" />
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">
                    Estimated Total
                  </span>
                  <span className="text-xl font-bold text-green-600">
                    {formatPrice(subtotal)}
                  </span>
                </div>
                <button
                  type="button"
                  className="mt-6 flex h-12 w-full items-center justify-center rounded-xl bg-green-600 text-sm font-bold text-white shadow-lg shadow-green-600/15 transition-colors hover:bg-green-700"
                  onClick={checkout}
                >
                  Checkout
                </button>
                <p className="mt-3 text-center text-xs text-slate-400">
                  Don&apos;t have an account?{" "}
                  <Link
                    className="font-semibold text-green-600 hover:underline"
                    href="/register"
                  >
                    Sign up
                  </Link>
                </p>
                <div className="mt-6 space-y-3 border-t border-slate-100 pt-5 text-xs text-slate-500">
                  <p className="flex items-center gap-2">
                    <Check className="size-3.5 text-green-600" /> Your cart
                    items will be saved
                  </p>
                  <p className="flex items-center gap-2">
                    <Truck className="size-3.5 text-green-600" /> Track your
                    orders easily
                  </p>
                  <p className="flex items-center gap-2">
                    <ShieldCheck className="size-3.5 text-green-600" /> Secure
                    checkout experience
                  </p>
                </div>
              </div>
            </aside>
          </div>
        )}
        {error && cartItems.length > 0 && (
          <div
            className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-red-50 px-4 py-3"
            role="alert"
          >
            <p className="text-sm font-medium text-red-700">{error}</p>
            <button
              type="button"
              onClick={() => void reloadCart()}
              className="text-sm font-semibold text-red-800 underline"
            >
              Refresh cart
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
