"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  Eye,
  GitCompareArrows,
  Heart,
  LoaderCircle,
  ShoppingCart,
  Star,
} from "lucide-react";
import type { Product } from "@/types/product";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";

interface ProductProps {
  product: Product;
}

export default function ProductCard({ product }: ProductProps) {
  const { addToCart } = useCart();
  const { addToWishlist, isInWishlist, pendingProductIds, removeFromWishlist } =
    useWishlist();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [cartFeedback, setCartFeedback] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);
  const [wishlistFeedback, setWishlistFeedback] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);
  const unitPrice = product.priceAfterDiscount ?? product.price;
  const isWishlisted = isInWishlist(product._id);
  const isWishlistPending = pendingProductIds.includes(product._id);
  const isAvailable = product.quantity == null || product.quantity > 0;

  const handleAddToCart = async () => {
    setIsAddingToCart(true);
    setCartFeedback(null);
    try {
      const result = await addToCart(product._id, {
        id: product._id,
        title: product.title,
        price: unitPrice,
        image: product.imageCover,
        category: product.category?.name,
      });
      setCartFeedback({
        ok: result.ok,
        message: result.ok
          ? "Added to cart."
          : (result.error ?? "Unable to add item to cart."),
      });
    } catch (error) {
      setCartFeedback({
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to add item to cart.",
      });
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleWishlistToggle = async () => {
    setWishlistFeedback(null);
    try {
      const result = isWishlisted
        ? await removeFromWishlist(product._id)
        : await addToWishlist(product);
      setWishlistFeedback({
        ok: result.ok,
        message: result.ok
          ? isWishlisted
            ? "Removed from wishlist."
            : "Added to wishlist."
          : (result.error ?? "Unable to update wishlist."),
      });
    } catch (error) {
      setWishlistFeedback({
        ok: false,
        message:
          error instanceof Error ? error.message : "Unable to update wishlist.",
      });
    }
  };

  return (
    <article className="group relative flex h-full flex-col justify-between overflow-hidden rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl hover:shadow-slate-200/70 sm:p-4">
      <div>
        <div className="relative mb-4 aspect-square w-full overflow-hidden rounded-lg bg-slate-50">
          <Image
            src={product.imageCover}
            alt={product.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            className="object-contain p-3 transition-transform duration-500 group-hover:scale-105"
          />

          <div className="absolute right-3 top-3 flex translate-x-0 flex-col gap-2 opacity-100 transition-all duration-300 sm:translate-x-2 sm:opacity-0 sm:group-hover:translate-x-0 sm:group-hover:opacity-100 sm:group-focus-within:translate-x-0 sm:group-focus-within:opacity-100">
            <button
              type="button"
              onClick={() => void handleWishlistToggle()}
              disabled={isWishlistPending}
              aria-label={`${isWishlisted ? "Remove" : "Add"} ${product.title} ${isWishlisted ? "from" : "to"} wishlist`}
              aria-pressed={isWishlisted}
              aria-busy={isWishlistPending}
              title={wishlistFeedback?.message}
              className={`flex size-9 items-center justify-center rounded-full shadow-md transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-wait disabled:opacity-70 ${isWishlisted ? "bg-emerald-600 text-white" : "bg-white text-slate-500 hover:bg-emerald-600 hover:text-white"}`}
            >
              {isWishlistPending ? (
                <LoaderCircle
                  className="size-4 animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <Heart
                  className="size-4"
                  fill={isWishlisted ? "currentColor" : "none"}
                  aria-hidden="true"
                />
              )}
            </button>
            <button
              type="button"
              className="flex size-9 items-center justify-center rounded-full bg-white text-slate-500 shadow-md transition-colors hover:bg-emerald-600 hover:text-white"
              aria-label={`Compare ${product.title}`}
              title="Compare"
            >
              <GitCompareArrows className="size-4" aria-hidden="true" />
            </button>
            <Link
              href={`/products/${product._id}`}
              className="flex size-9 items-center justify-center rounded-full bg-white text-slate-500 shadow-md transition-colors hover:bg-emerald-600 hover:text-white"
              aria-label={`View ${product.title}`}
            >
              <Eye className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>

        <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">
          {product.category?.name ?? "Fresh products"}
        </span>

        <h3 className="mt-1 line-clamp-2 min-h-10 text-sm font-bold leading-5 text-slate-800 transition-colors hover:text-emerald-600">
          <Link href={`/products/${product._id}`}>{product.title}</Link>
        </h3>

        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 text-amber-500">
            <Star
              className="size-3.5 fill-amber-400 text-amber-400"
              aria-hidden="true"
            />
            <span className="text-xs font-semibold text-slate-700">
              {product.ratingsAverage}
            </span>
            {product.ratingsQuantity != null && (
              <span className="text-[11px] text-slate-400">
                ({product.ratingsQuantity})
              </span>
            )}
          </div>
          <span className="text-base font-extrabold text-slate-900">
            {unitPrice} EGP
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => void handleAddToCart()}
        disabled={isAddingToCart || !isAvailable}
        aria-busy={isAddingToCart}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-emerald-700 active:scale-95 disabled:cursor-wait disabled:opacity-70"
      >
        {isAddingToCart ? (
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <ShoppingCart className="size-4" aria-hidden="true" />
        )}
        {isAddingToCart
          ? "Adding..."
          : isAvailable
            ? "Add To Cart"
            : "Out of Stock"}
      </button>
      <p
        className={`mt-2 min-h-4 text-xs ${cartFeedback?.ok ? "text-emerald-700" : "text-red-600"}`}
        role={cartFeedback?.ok ? "status" : "alert"}
        aria-live="polite"
      >
        {cartFeedback?.message ?? ""}
      </p>
      {wishlistFeedback && (
        <p
          className={`mt-1 text-xs ${wishlistFeedback.ok ? "text-emerald-700" : "text-red-600"}`}
          role={wishlistFeedback.ok ? "status" : "alert"}
          aria-live="polite"
        >
          {wishlistFeedback.message}
        </p>
      )}
    </article>
  );
}
