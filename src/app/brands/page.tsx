"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Tags } from "lucide-react";
import { getBrands, getProductsByBrand } from "@/api/brands";
import ProductCard from "../_components/productcard.tsx/page";
import type { Brand, Product } from "@/types/product";

export default function Brands() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingBrands, setIsLoadingBrands] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const selectionRequest = useRef(0);
  const pendingBrandId = useRef<string | null>(null);

  useEffect(() => {
    let isCurrent = true;
    getBrands()
      .then((result) => {
        if (isCurrent) setBrands(result);
      })
      .catch(() => {
        if (isCurrent) {
          setError("Brands could not be loaded. Please try again.");
        }
      })
      .finally(() => {
        if (isCurrent) setIsLoadingBrands(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [loadAttempt]);

  const selectBrand = async (brand: Brand) => {
    if (pendingBrandId.current === brand._id) return;
    const requestId = ++selectionRequest.current;
    pendingBrandId.current = brand._id;
    setSelectedBrand(brand);
    setProducts([]);
    setError(null);
    setIsLoadingProducts(true);

    try {
      const result = await getProductsByBrand(brand._id);
      if (selectionRequest.current === requestId) setProducts(result);
    } catch {
      if (selectionRequest.current === requestId) {
        setError(
          "Products for this brand could not be loaded. Please try again.",
        );
      }
    } finally {
      if (selectionRequest.current === requestId) {
        pendingBrandId.current = null;
        setIsLoadingProducts(false);
      }
    }
  };

  const clearSelection = () => {
    selectionRequest.current += 1;
    pendingBrandId.current = null;
    setSelectedBrand(null);
    setProducts([]);
    setError(null);
    setIsLoadingProducts(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-12 text-slate-800">
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
            Brands
          </span>
        </nav>
      </div>

      <header className="relative overflow-hidden bg-linear-to-r from-violet-700 via-purple-600 to-indigo-700 text-white">
        <div className="mx-auto flex min-h-36 max-w-7xl items-center gap-4 px-4 py-7 sm:min-h-40 sm:px-6 sm:py-8 lg:min-h-44 lg:px-8">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white sm:size-14">
            <Tags className="size-6 sm:size-7" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Top Brands
            </h1>
            <p className="mt-1 text-sm text-violet-50 sm:text-base">
              Shop from your favorite brands
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 sm:pt-10 lg:px-8">
        {error && (
          <div
            className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-100 bg-red-50 px-4 py-3"
            role="alert"
          >
            <p className="text-sm text-red-700">{error}</p>
            {selectedBrand ? (
              <button
                type="button"
                onClick={() => void selectBrand(selectedBrand)}
                className="text-sm font-semibold text-red-800 underline"
              >
                Retry
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setIsLoadingBrands(true);
                  setLoadAttempt((attempt) => attempt + 1);
                }}
                className="text-sm font-semibold text-red-800 underline"
              >
                Retry
              </button>
            )}
          </div>
        )}

        <section aria-label="All brands">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
                {selectedBrand ? selectedBrand.name : "Explore Brands"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {selectedBrand
                  ? "Products from this brand"
                  : `${brands.length} brands to explore`}
              </p>
            </div>
            {selectedBrand && (
              <button
                type="button"
                onClick={clearSelection}
                className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-violet-700 transition-colors hover:text-violet-900"
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
                All brands
              </button>
            )}
          </div>

          {isLoadingBrands ? (
            <p
              className="py-16 text-center text-sm text-slate-500"
              role="status"
            >
              Loading brands...
            </p>
          ) : brands.length === 0 && error ? null : brands.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-500">
              No brands are available right now.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-5 xl:grid-cols-6">
              {brands.map((brand) => {
                const isActive = selectedBrand?._id === brand._id;
                return (
                  <button
                    key={brand._id}
                    type="button"
                    onClick={() => void selectBrand(brand)}
                    aria-pressed={isActive}
                    className={`group flex aspect-square min-w-0 flex-col items-center justify-center gap-2 rounded-lg border bg-white px-3 py-3 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md sm:px-4 ${isActive ? "border-violet-500 ring-2 ring-violet-100" : "border-slate-200"}`}
                  >
                    <span className="relative block h-12 w-full sm:h-14">
                      {brand.image ? (
                        <Image
                          src={brand.image}
                          alt={`${brand.name} logo`}
                          fill
                          sizes="(max-width: 640px) 40vw, (max-width: 1024px) 22vw, 15vw"
                          className="object-contain"
                        />
                      ) : (
                        <span className="flex h-full items-center justify-center text-sm font-bold text-slate-500">
                          {brand.name}
                        </span>
                      )}
                    </span>
                    <span className="line-clamp-1 w-full text-xs font-semibold text-slate-700 transition-colors group-hover:text-violet-700 sm:text-sm">
                      {brand.name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {selectedBrand && (
          <section
            className="mt-10 border-t border-slate-100 pt-8"
            aria-label={`${selectedBrand.name} products`}
          >
            <div className="mb-5 flex items-end justify-between gap-3">
              <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
                {selectedBrand.name} Products
              </h2>
              {!isLoadingProducts && (
                <span className="text-sm text-slate-500">
                  {products.length} products
                </span>
              )}
            </div>
            {isLoadingProducts ? (
              <p
                className="py-10 text-center text-sm text-slate-500"
                role="status"
              >
                Loading products...
              </p>
            ) : products.length === 0 ? (
              <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                No products found for this brand.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
