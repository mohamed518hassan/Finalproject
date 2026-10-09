"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Box, MapPin, PackageCheck, Truck } from "lucide-react";
import { getUserOrders, type UserOrder } from "@/api/orders";
import { getMyProfile } from "@/api/profile";
import AuthGuard from "@/app/_components/auth-guard";

const formatPrice = (value: number) => `${value.toLocaleString("en-US")} EGP`;

function OrdersContent() {
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;
    void (async () => {
      const profile = await getMyProfile();
      if (!isCurrent) return;
      if (!profile.ok || !profile.data) {
        setError(profile.error ?? "Unable to load your account.");
        setIsLoading(false);
        return;
      }
      if (!profile.data.userId) {
        setError("Your account service did not return a user ID.");
        setIsLoading(false);
        return;
      }

      const result = await getUserOrders(profile.data.userId);
      if (!isCurrent) return;
      if (!result.ok || !result.data) {
        setError(result.error ?? "Unable to load your orders.");
      } else {
        setOrders(result.data);
      }
      setIsLoading(false);
    })().catch((requestError: unknown) => {
      if (!isCurrent) return;
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load your orders.",
      );
      setIsLoading(false);
    });

    return () => {
      isCurrent = false;
    };
  }, []);

  const cartClearFailed = searchParams.get("cartClearFailed") === "1";

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <Link
          className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 transition-colors hover:text-emerald-800"
          href="/"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Continue shopping
        </Link>
        <div className="mt-5 flex items-center gap-3">
          <span className="flex size-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <PackageCheck className="size-6" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              My Orders
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Review your order history and delivery details.
            </p>
          </div>
        </div>

        {cartClearFailed && (
          <p
            className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
            role="status"
          >
            Your order was placed, but the cart could not be cleared on the
            server. Please review your cart before placing another order.
          </p>
        )}

        {isLoading ? (
          <p className="mt-8 rounded-xl bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
            Loading your orders...
          </p>
        ) : error ? (
          <section
            className="mt-8 rounded-xl border border-red-100 bg-white p-6 text-center shadow-sm"
            role="alert"
          >
            <p className="text-sm text-red-700">{error}</p>
            <Link
              className="mt-4 inline-flex rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700"
              href="/login?redirect=%2Forders"
            >
              Sign in to view orders
            </Link>
          </section>
        ) : orders.length === 0 ? (
          <section className="mt-8 rounded-xl bg-white px-6 py-12 text-center shadow-sm">
            <Box
              className="mx-auto size-10 text-slate-300"
              aria-hidden="true"
            />
            <h2 className="mt-4 text-lg font-bold text-slate-800">
              No orders yet
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Your completed purchases will appear here.
            </p>
            <Link
              className="mt-5 inline-flex rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700"
              href="/products"
            >
              Browse products
            </Link>
          </section>
        ) : (
          <div className="mt-8 space-y-5">
            {orders.map((order) => (
              <article
                className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm"
                key={order.id}
              >
                <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Order
                    </p>
                    <p className="mt-1 break-all text-sm font-semibold text-slate-800">
                      #{order.id}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${order.isDelivered ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
                    >
                      {order.isDelivered ? "Delivered" : "Processing"}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-600">
                      {order.paymentMethod}
                    </span>
                  </div>
                </div>

                <div className="grid gap-6 px-5 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_260px]">
                  <section>
                    <h2 className="text-sm font-bold text-slate-800">
                      Items
                    </h2>
                    <ul className="mt-3 divide-y divide-slate-100">
                      {order.items.map((item, index) => (
                        <li
                          className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                          key={`${item.title}-${index}`}
                        >
                          <span className="text-sm text-slate-600">
                            {item.title}{" "}
                            <span className="text-slate-400">
                              x {item.quantity}
                            </span>
                          </span>
                          <span className="shrink-0 text-sm font-semibold text-slate-800">
                            {formatPrice(item.price * item.quantity)}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-4 border-t border-slate-100 pt-4 text-sm text-slate-600">
                      Payment status:{" "}
                      <span className="font-semibold text-slate-800">
                        {order.isPaid ? "Paid" : "Awaiting payment"}
                      </span>
                    </p>
                  </section>

                  <section className="h-fit rounded-lg bg-slate-50 p-4">
                    <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800">
                      <Truck
                        className="size-4 text-emerald-600"
                        aria-hidden="true"
                      />
                      Delivery
                    </h2>
                    <div className="mt-3 flex items-start gap-2 text-sm text-slate-600">
                      <MapPin
                        className="mt-0.5 size-4 shrink-0 text-slate-400"
                        aria-hidden="true"
                      />
                      <div className="space-y-1">
                        {order.shippingAddress.details && (
                          <p>{order.shippingAddress.details}</p>
                        )}
                        {(order.shippingAddress.city ||
                          order.shippingAddress.postalCode) && (
                          <p>
                            {[
                              order.shippingAddress.city,
                              order.shippingAddress.postalCode,
                            ]
                              .filter(Boolean)
                              .join(", ")}
                          </p>
                        )}
                        {order.shippingAddress.phone && (
                          <p>{order.shippingAddress.phone}</p>
                        )}
                        {!order.shippingAddress.details &&
                          !order.shippingAddress.city &&
                          !order.shippingAddress.phone && (
                            <p>Address details unavailable</p>
                          )}
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3">
                      <span className="text-sm font-semibold text-slate-700">
                        Total
                      </span>
                      <span className="text-base font-bold text-emerald-700">
                        {formatPrice(order.totalPrice)}
                      </span>
                    </div>
                  </section>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={null}>
      <AuthGuard>
        <OrdersContent />
      </AuthGuard>
    </Suspense>
  );
}
