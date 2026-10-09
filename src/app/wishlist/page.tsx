"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Heart, Home, ShoppingCart, Trash2 } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import AuthGuard from "@/app/_components/auth-guard";

const formatPrice = (price: number) => `${price.toLocaleString("en-US")} EGP`;

function WishlistContent() {
  const { error, isLoading, items, pendingProductIds, removeFromWishlist } =
    useWishlist();
  const { addToCart } = useCart();
  const [pendingCartIds, setPendingCartIds] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<{
    productId: string;
    message: string;
    ok: boolean;
  } | null>(null);

  const handleAddToCart = async (product: (typeof items)[number]) => {
    setPendingCartIds((current) => [...current, product._id]);
    setFeedback(null);
    try {
      const result = await addToCart(product._id, {
        id: product._id,
        title: product.title,
        price: product.priceAfterDiscount ?? product.price,
        image: product.imageCover,
        category: product.category?.name,
      });
      setFeedback({
        productId: product._id,
        message: result.ok
          ? "Added to cart."
          : (result.error ?? "Unable to add item to cart."),
        ok: result.ok,
      });
    } catch (requestError) {
      setFeedback({
        productId: product._id,
        message:
          requestError instanceof Error
            ? requestError.message
            : "Unable to add item to cart.",
        ok: false,
      });
    } finally {
      setPendingCartIds((current) =>
        current.filter((id) => id !== product._id),
      );
    }

  };

  const handleRemove = async (productId: string) => {
    setFeedback(null);
    const result = await removeFromWishlist(productId);
    if (!result.ok) {
      setFeedback({
        productId,
        message: result.error ?? "Unable to remove item from wishlist.",
        ok: false,
      });
    }
  };

  return (
    <section className="min-h-screen bg-white text-[#152238]">
      <div className="mx-auto max-w-9xl px-4 pb-12 pt-7 sm:px-6 lg:px-8">
        <nav
          aria-label="Breadcrumb"
          className="mb-7 flex items-center gap-2 text-sm text-slate-500"
        >
          <Link
            className="inline-flex items-center gap-1.5 transition-colors hover:text-green-600"
            href="/"
          >
            <Home className="size-3.5" aria-hidden="true" />
            Home
          </Link>
          <span className="text-slate-300">/</span>
          <span className="font-medium text-slate-700" aria-current="page">
            Wishlist
          </span>
        </nav>

        <header className="mb-8 flex items-center gap-4 border-b border-slate-100 pb-7">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
            <Heart className="size-5 fill-current" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#152238] sm:text-3xl">
              My Wishlist
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">
              {items.length} {items.length === 1 ? "item" : "items"} saved
            </p>
          </div>
        </header>

        {error && (
          <p
            className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {error}
          </p>
        )}

        {isLoading ? (
          <div
            className="rounded-xl border border-slate-200 bg-white px-6 py-20 text-center text-sm text-slate-500"
            role="status"
          >
            Loading wishlist...
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white px-6 py-20 text-center">
            <Heart
              className="mx-auto mb-4 size-10 text-slate-300"
              aria-hidden="true"
            />
            <h2 className="text-xl font-bold text-slate-900">
              Your wishlist is empty
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Save products you would like to revisit.
            </p>
            <Link
              className="mt-6 inline-flex rounded-lg bg-green-600 px-5 py-3 text-sm font-bold text-white hover:bg-green-700"
              href="/products"
            >
              Browse products
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div
              role="row"
              className="hidden grid-cols-[minmax(0,1fr)_150px_140px_180px] items-center border-b border-slate-200 bg-slate-50/70 px-5 py-4 text-sm font-medium text-slate-500 sm:grid sm:px-6"
            >
              <span role="columnheader">Product</span>
              <span role="columnheader">Price</span>
              <span role="columnheader">Status</span>
              <span role="columnheader" className="text-center">
                Actions
              </span>
            </div>

            {items.map((product) => {
              const stockQuantity = (
                product as typeof product & { quantity?: unknown }
              ).quantity;
              const hasStockData = typeof stockQuantity === "number";
              const isAvailable = hasStockData && stockQuantity > 0;
              const isRemoving = pendingProductIds.includes(product._id);
              const isAdding = pendingCartIds.includes(product._id);
              const rowFeedback =
                feedback?.productId === product._id ? feedback : null;

              return (
                <article
                  key={product._id}
                  role="row"
                  className="grid grid-cols-2 items-center gap-x-4 gap-y-4 border-b border-slate-100 px-4 py-5 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_150px_140px_180px] sm:gap-0 sm:px-6 sm:py-4"
                >
                  <div
                    role="cell"
                    className="col-span-2 flex min-w-0 items-center gap-4 sm:col-span-1 sm:pr-6"
                  >
                    <Link
                      href={`/products/${product._id}`}
                      className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-slate-50 sm:size-18"
                      aria-label={`View ${product.title}`}
                    >
                      <Image
                        src={product.imageCover}
                        alt={product.title}
                        width={72}
                        height={72}
                        className="h-full w-full object-contain p-2"
                      />
                    </Link>
                    <div className="min-w-0">
                      <Link
                        className="block truncate text-sm font-semibold text-slate-800 hover:text-green-700 sm:text-base"
                        href={`/products/${product._id}`}
                      >
                        {product.title}
                      </Link>
                      <p className="mt-1 truncate text-sm text-slate-400">
                        {product.category?.name ?? ""}
                      </p>
                      {rowFeedback && (
                        <p
                          className={`mt-1 text-xs ${rowFeedback.ok ? "text-green-700" : "text-red-600"}`}
                          role={rowFeedback.ok ? "status" : "alert"}
                        >
                          {rowFeedback.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div role="cell" className="pl-1 sm:pl-0">
                    <span className="mb-1 block text-xs text-slate-400 sm:hidden">
                      Price
                    </span>
                    <span className="text-sm font-semibold text-slate-800">
                      {formatPrice(product.priceAfterDiscount ?? product.price)}
                    </span>
                  </div>

                  <div
                    role="cell"
                    className="justify-self-end sm:justify-self-start"
                  >
                    <span className="mb-1 block text-right text-xs text-slate-400 sm:hidden">
                      Status
                    </span>
                    {hasStockData ? (
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${isAvailable ? "bg-green-50 text-green-700" : "bg-rose-50 text-rose-700"}`}
                      >
                        <span
                          className={`size-1.5 rounded-full ${isAvailable ? "bg-green-500" : "bg-rose-500"}`}
                          aria-hidden="true"
                        />
                        {isAvailable ? "In Stock" : "Out of Stock"}
                      </span>
                    ) : (
                      <span
                        className="text-sm text-slate-400"
                        aria-label="Stock status unavailable"
                      >
                        —
                      </span>
                    )}
                  </div>

                  <div
                    role="cell"
                    className="col-span-2 flex items-center justify-end gap-2 sm:col-span-1 sm:justify-center"
                  >
                    <button
                      type="button"
                      onClick={() => void handleAddToCart(product)}
                      disabled={isAdding || (hasStockData && !isAvailable)}
                      className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-green-600 px-3 text-xs font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60 sm:px-4"
                    >
                      <ShoppingCart className="size-4" aria-hidden="true" />
                      {isAdding ? "Adding..." : "Add to Cart"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleRemove(product._id)}
                      disabled={isRemoving}
                      className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-rose-100 hover:border hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 hover:transition-colors hover:bg-rose-100 disabled:cursor-wait disabled:opacity-60"
                      aria-label={`Remove ${product.title} from wishlist`}
                      title="Remove from wishlist"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export default function Wishlist() {
  return (
    <AuthGuard>
      <WishlistContent />
    </AuthGuard>
  );
}
