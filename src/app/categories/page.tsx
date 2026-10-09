"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Grid2X2,
  Headset,
  Layers3,
  RotateCcw,
  ShieldCheck,
  Truck,
} from "lucide-react";
import {
  getCategories,
  getCategoryProducts,
  getCategorySubcategories,
} from "@/api/categories";
import ProductCard from "../_components/productcard.tsx/page";
import type { Category, Product, Subcategory } from "@/types/product";

function secureImageUrl(imageUrl: string) {
  try {
    const url = new URL(imageUrl);
    if (url.protocol === "http:") url.protocol = "https:";
    return url.toString();
  } catch {
    return imageUrl;
  }
}

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [selectedSubcategory, setSelectedSubcategory] =
    useState<Subcategory | null>(null);
  const [categoryProducts, setCategoryProducts] = useState<Product[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoadingSelection, setIsLoadingSelection] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const selectionRequest = useRef(0);
  const pendingCategoryId = useRef<string | null>(null);
  const [visiblePendingCategoryId, setVisiblePendingCategoryId] = useState<
    string | null
  >(null);

  useEffect(() => {
    let isCurrent = true;
    getCategories()
      .then((result) => {
        if (isCurrent) setCategories(result);
      })
      .catch(() => {
        if (isCurrent)
          setError("Categories could not be loaded. Please try again.");
      })
      .finally(() => {
        if (isCurrent) setIsLoadingCategories(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [loadAttempt]);

  const selectCategory = async (category: Category) => {
    if (pendingCategoryId.current === category._id) return;
    const requestId = ++selectionRequest.current;
    pendingCategoryId.current = category._id;
    setVisiblePendingCategoryId(category._id);
    setSelectedCategory(category);
    setSelectedSubcategory(null);
    setSubcategories([]);
    setCategoryProducts([]);
    setError(null);
    setIsLoadingSelection(true);

    try {
      const [nextSubcategories, nextProducts] = await Promise.all([
        getCategorySubcategories(category._id),
        getCategoryProducts(category._id),
      ]);
      if (selectionRequest.current === requestId) {
        setSubcategories(nextSubcategories);
        setCategoryProducts(nextProducts);
      }
    } catch {
      if (selectionRequest.current === requestId) {
        setError(
          "Products for this category could not be loaded. Please try again.",
        );
      }
    } finally {
      if (selectionRequest.current === requestId) {
        pendingCategoryId.current = null;
        setVisiblePendingCategoryId(null);
        setIsLoadingSelection(false);
      }
    }
  };

  const clearSelection = () => {
    selectionRequest.current += 1;
    pendingCategoryId.current = null;
    setVisiblePendingCategoryId(null);
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setSubcategories([]);
    setCategoryProducts([]);
    setError(null);
    setIsLoadingSelection(false);
  };

  const visibleProducts = selectedSubcategory
    ? categoryProducts.filter((product) =>
        product.subcategory?.some(
          (subcategory) => subcategory._id === selectedSubcategory._id,
        ),
      )
    : categoryProducts;

  return (
    <div className="min-h-screen bg-white text-slate-800">
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <nav
          aria-label="Breadcrumb"
          className="mb-6 flex items-center gap-2 text-sm text-slate-500"
        >
          <Link className="transition-colors hover:text-green-600" href="/">
            Home
          </Link>
          <span className="text-slate-300">/</span>
          <span className="font-medium text-slate-700" aria-current="page">
            Categories
          </span>
        </nav>
      </div>

      <header className="relative overflow-hidden bg-linear-to-r from-green-600 via-emerald-600 to-green-700 text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-15"
          aria-hidden="true"
        >
          <div className="absolute -right-16 -top-36 size-96 rounded-full border-42px border-white" />
          <div className="absolute -bottom-52 left-[38%] size-96 rounded-full border-42px border-white" />
        </div>
        <div className="relative mx-auto flex min-h-40 max-w-7xl items-center gap-4 px-4 py-8 sm:min-h-44 sm:px-6 lg:px-8">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white sm:size-14">
            <Grid2X2 className="size-6 sm:size-7" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              All Categories
            </h1>
            <p className="mt-1 text-sm text-green-50 sm:text-base">
              Browse our wide range of product categories
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 sm:pt-8 lg:px-8">
        {error && (
          <div
            className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-100 bg-red-50 px-4 py-3"
            role="alert"
          >
            <p className="text-sm text-red-700">{error}</p>
            {selectedCategory ? (
              <button
                type="button"
                onClick={() => void selectCategory(selectedCategory)}
                className="text-sm font-semibold text-red-800 underline"
              >
                Retry
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setIsLoadingCategories(true);
                  setLoadAttempt((attempt) => attempt + 1);
                }}
                className="text-sm font-semibold text-red-800 underline"
              >
                Retry
              </button>
            )}
          </div>
        )}

        {isLoadingCategories ? (
          <div
            className="py-16 text-center text-sm text-slate-500"
            role="status"
          >
            Loading categories...
          </div>
        ) : categories.length === 0 && !error ? (
          <p className="py-12 text-center text-sm text-slate-500">
            No categories are available right now.
          </p>
        ) : categories.length === 0 ? null : (
          <section aria-label="All categories">
            {selectedCategory && (
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
                    {selectedCategory.name}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Choose a subcategory or browse all products
                  </p>
                  <Link
                    href={`/products?category=${encodeURIComponent(selectedCategory._id)}`}
                    className="mt-2 inline-flex text-sm font-semibold text-green-700 hover:text-green-800 hover:underline"
                  >
                    Browse category products
                  </Link>
                </div>
                <button
                  type="button"
                  onClick={clearSelection}
                  className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-green-700 hover:text-green-800"
                >
                  <ArrowLeft className="size-4" aria-hidden="true" />
                  All categories
                </button>
              </div>
            )}

            <div className="mx-auto grid max-w-6xl grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-5">
              {categories.map((category) => {
                const isActive = selectedCategory?._id === category._id;
                return (
                  <button
                    key={category._id}
                    type="button"
                    onClick={() => void selectCategory(category)}
                    aria-pressed={isActive}
                    aria-busy={visiblePendingCategoryId === category._id}
                    className={`group flex min-w-0 flex-col items-center rounded-lg border bg-white p-3 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-green-200 hover:shadow-md sm:p-4 ${isActive ? "border-green-500 ring-2 ring-green-100" : "border-slate-200"}`}
                  >
                    <span className="relative mb-3 flex aspect-4/3 w-full items-center justify-center overflow-hidden rounded-lg bg-slate-50 p-2 sm:mb-4">
                      <Image
                        src={secureImageUrl(category.image)}
                        alt={category.name}
                        fill
                        sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 20vw"
                        className="object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                      />
                    </span>
                    <span className="line-clamp-2 text-sm font-semibold text-slate-800 group-hover:text-green-700 sm:text-base">
                      {category.name}
                    </span>
                    {category.description && (
                      <span className="mt-1 line-clamp-2 text-xs text-slate-500">
                        {category.description}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {selectedCategory && (
          <section
            className="mt-10 border-t border-slate-100 pt-8"
            aria-label={`${selectedCategory.name} subcategories and products`}
          >
            <div className="mb-5 flex items-center gap-2">
              <Layers3 className="size-5 text-green-600" aria-hidden="true" />
              <h2 className="text-xl font-bold text-slate-900">
                Subcategories
              </h2>
            </div>
            {isLoadingSelection ? (
              <p className="py-8 text-sm text-slate-500" role="status">
                Loading subcategories and products...
              </p>
            ) : subcategories.length === 0 ? (
              <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                No subcategories are available for this category.
              </p>
            ) : (
              <div className="flex gap-2 overflow-x-auto pb-2">
                <button
                  type="button"
                  onClick={() => setSelectedSubcategory(null)}
                  aria-pressed={selectedSubcategory === null}
                  className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${selectedSubcategory === null ? "border-green-600 bg-green-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-green-300 hover:text-green-700"}`}
                >
                  All products
                </button>
                {subcategories.map((subcategory) => (
                  <button
                    key={subcategory._id}
                    type="button"
                    onClick={() => setSelectedSubcategory(subcategory)}
                    aria-pressed={selectedSubcategory?._id === subcategory._id}
                    className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${selectedSubcategory?._id === subcategory._id ? "border-green-600 bg-green-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-green-300 hover:text-green-700"}`}
                  >
                    {subcategory.name}
                  </button>
                ))}
              </div>
            )}

            <div className="mt-8">
              <div className="mb-5 flex items-end justify-between gap-3">
                <h2 className="text-xl font-bold text-slate-900">
                  {selectedSubcategory?.name ??
                    `${selectedCategory.name} Products`}
                </h2>
                {!isLoadingSelection && (
                  <span className="text-sm text-slate-500">
                    {visibleProducts.length} products
                  </span>
                )}
              </div>
              {isLoadingSelection ? null : visibleProducts.length === 0 ? (
                <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                  No products found in this selection.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {visibleProducts.map((product) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      <section
        className="mt-10 border-y border-green-100 bg-green-50"
        aria-label="Shopping benefits"
      >
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 py-5 sm:grid-cols-2 sm:px-6 md:grid-cols-4 lg:px-8">
          <div className="flex items-center gap-3">
            <Truck
              className="size-5 shrink-0 text-green-600"
              aria-hidden="true"
            />
            <span className="text-sm font-semibold text-slate-800">
              Free Shipping
            </span>
          </div>
          <div className="flex items-center gap-3">
            <RotateCcw
              className="size-5 shrink-0 text-green-600"
              aria-hidden="true"
            />
            <span className="text-sm font-semibold text-slate-800">
              Easy Returns
            </span>
          </div>
          <div className="flex items-center gap-3">
            <ShieldCheck
              className="size-5 shrink-0 text-green-600"
              aria-hidden="true"
            />
            <span className="text-sm font-semibold text-slate-800">
              Secure Payment
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Headset
              className="size-5 shrink-0 text-green-600"
              aria-hidden="true"
            />
            <span className="text-sm font-semibold text-slate-800">
              24/7 Support
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
