import Link from "next/link";
import Image from "next/image";
import { Filter, Layers3, Package, X } from "lucide-react";
import { redirect } from "next/navigation";
import {
  getCategories,
  getCategoryProducts,
} from "@/api/categories";
import { getCompleteProductCatalog } from "@/api/getProducts";
import ProductCard from "@/app/_components/productcard.tsx/page";
import type { Category, Product } from "@/types/product";

type ProductSearchParams = {
  search?: string | string[];
  category?: string | string[];
  brand?: string | string[];
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
  page?: string | string[];
};

const PRODUCTS_PER_PAGE = 20;

function normalizeCategoryValue(value: string) {
  return value.toLocaleLowerCase().replace(/[^a-z0-9]/g, "");
}

function queryHrefWithout(
  params: ProductSearchParams,
  removedKey: keyof ProductSearchParams,
  removedValue?: string,
) {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || key === "page") continue;
    const values = Array.isArray(value) ? value : [value];
    for (const item of values) {
      if (key === removedKey && (removedValue === undefined || item === removedValue)) {
        continue;
      }
      query.append(key, item);
    }
  }

  const serialized = query.toString();
  return serialized ? `/products?${serialized}` : "/products";
}

function pageHref(params: ProductSearchParams, page: number) {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || key === "page") continue;
    const values = Array.isArray(value) ? value : [value];
    for (const item of values) query.append(key, item);
  }
  query.set("page", String(page));

  return `/products?${query.toString()}`;
}

function parsePage(value: string | string[] | undefined) {
  const pageValue = Array.isArray(value) ? value[0] : value;
  if (!pageValue || !/^\d+$/.test(pageValue)) return 1;

  const page = Number(pageValue);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

function hasValidPage(value: string | string[] | undefined) {
  const pageValue = Array.isArray(value) ? value[0] : value;
  if (!pageValue || !/^\d+$/.test(pageValue)) return false;

  const page = Number(pageValue);
  return Number.isSafeInteger(page) && page > 0;
}

function ProductPagination({
  params,
  currentPage,
  pageCount,
}: {
  params: ProductSearchParams;
  currentPage: number;
  pageCount: number;
}) {
  if (pageCount <= 1) return null;

  return (
    <nav
      className="mt-8 flex flex-wrap items-center justify-center gap-2"
      aria-label="Product pages"
    >
      {currentPage > 1 ? (
        <Link
          href={pageHref(params, currentPage - 1)}
          className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-green-300 hover:text-green-700"
          rel="prev"
        >
          Previous
        </Link>
      ) : (
        <span className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400">
          Previous
        </span>
      )}
      {Array.from({ length: pageCount }, (_, index) => index + 1).map(
        (page) => (
          <Link
            key={page}
            href={pageHref(params, page)}
            aria-current={page === currentPage ? "page" : undefined}
            className={`flex size-9 items-center justify-center rounded-md border text-sm font-semibold transition-colors ${
              page === currentPage
                ? "border-green-600 bg-green-600 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:border-green-300 hover:text-green-700"
            }`}
          >
            {page}
          </Link>
        ),
      )}
      {currentPage < pageCount ? (
        <Link
          href={pageHref(params, currentPage + 1)}
          className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-green-300 hover:text-green-700"
          rel="next"
        >
          Next
        </Link>
      ) : (
        <span className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400">
          Next
        </span>
      )}
    </nav>
  );
}

function secureImageUrl(imageUrl: string) {
  try {
    const url = new URL(imageUrl);
    if (url.protocol === "http:") url.protocol = "https:";
    return url.toString();
  } catch {
    return imageUrl;
  }
}

function CategoryLanding({
  category,
  params,
  products,
}: {
  category: Category;
  params: ProductSearchParams;
  products: Product[];
}) {
  const searchTerm =
    typeof params.search === "string" ? params.search.trim() : "";
  const selectedBrands = params.brand
    ? Array.isArray(params.brand)
      ? params.brand
      : [params.brand]
    : [];
  const minPrice = Number(params.minPrice) || 0;
  const maxPrice = Number(params.maxPrice) || Number.POSITIVE_INFINITY;
  const normalizedSearch = searchTerm.toLocaleLowerCase();
  const visibleProducts = products
    .filter((product) => {
      const searchMatches =
        !normalizedSearch ||
        [product.title, product.category?.name, product.brand?.name]
          .filter(Boolean)
          .some((value) =>
            value?.toLocaleLowerCase().includes(normalizedSearch),
          );
      const brandMatches =
        selectedBrands.length === 0 ||
        selectedBrands.includes(product.brand?.name ?? "");
      const price = product.priceAfterDiscount ?? product.price;
      return (
        searchMatches &&
        brandMatches &&
        price >= minPrice &&
        price <= maxPrice
      );
    })
    .sort((first, second) => {
      if (params.sort === "price-asc")
        return (
          (first.priceAfterDiscount ?? first.price) -
          (second.priceAfterDiscount ?? second.price)
        );
      if (params.sort === "price-desc")
        return (
          (second.priceAfterDiscount ?? second.price) -
          (first.priceAfterDiscount ?? first.price)
        );
      if (params.sort === "rating-desc")
        return second.ratingsAverage - first.ratingsAverage;
      return 0;
    });
  const requestedPage = parsePage(params.page);
  const pageCount = Math.max(
    1,
    Math.ceil(visibleProducts.length / PRODUCTS_PER_PAGE),
  );
  const currentPage = Math.min(requestedPage, pageCount);

  if (
    params.page !== undefined &&
    (!hasValidPage(params.page) || currentPage !== requestedPage)
  ) {
    redirect(pageHref(params, currentPage));
  }

  const pageProducts = visibleProducts.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE,
  );

  return (
    <main className="min-h-screen bg-slate-50 pb-12">
      <header className="bg-linear-to-r from-green-600 via-green-500 to-green-400 px-4 py-8 text-white sm:py-10">
        <div className="mx-auto max-w-7xl">
          <nav
            aria-label="Breadcrumb"
            className="mb-6 flex flex-wrap items-center gap-2 text-sm text-white/90"
          >
            <Link href="/" className="transition-opacity hover:opacity-80">
              Home
            </Link>
            <span aria-hidden="true">/</span>
            <Link
              href="/categories"
              className="transition-opacity hover:opacity-80"
            >
              Categories
            </Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page" className="font-semibold text-white">
              {category.name}
            </span>
          </nav>

          <div className="flex items-center gap-4">
            <span className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/20 bg-white/20 p-2">
              {category.image ? (
                <Image
                  src={secureImageUrl(category.image)}
                  alt=""
                  fill
                  sizes="56px"
                  className="object-contain p-2"
                />
              ) : (
                <Layers3 className="size-7" aria-hidden="true" />
              )}
            </span>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {category.name}
              </h1>
              <p className="mt-1 text-sm text-white/90 sm:text-base">
                Browse products in {category.name}
              </p>
            </div>
          </div>
        </div>
      </header>

      <section
        className="mx-auto max-w-7xl px-4 pt-7 sm:px-6 lg:px-8"
        aria-label="Filtered products"
      >
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-600">
            <Filter className="size-4" aria-hidden="true" />
            Active Filters:
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={queryHrefWithout(params, "category")}
              className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1.5 text-sm font-medium text-green-800 transition-colors hover:bg-green-200"
              aria-label={`Remove ${category.name} category filter`}
            >
              <Layers3 className="size-3.5" aria-hidden="true" />
              {category.name}
              <X className="size-3.5" aria-hidden="true" />
            </Link>
            {selectedBrands.map((brand) => (
              <Link
                key={brand}
                href={queryHrefWithout(params, "brand", brand)}
                className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1.5 text-sm font-medium text-green-800 transition-colors hover:bg-green-200"
                aria-label={`Remove ${brand} brand filter`}
              >
                {brand}
                <X className="size-3.5" aria-hidden="true" />
              </Link>
            ))}
            {searchTerm && (
              <Link
                href={queryHrefWithout(params, "search")}
                className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1.5 text-sm font-medium text-green-800 transition-colors hover:bg-green-200"
                aria-label={`Remove search filter ${searchTerm}`}
              >
                Search: {searchTerm}
                <X className="size-3.5" aria-hidden="true" />
              </Link>
            )}
            {params.minPrice && (
              <Link
                href={queryHrefWithout(params, "minPrice")}
                className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1.5 text-sm font-medium text-green-800 transition-colors hover:bg-green-200"
              >
                Min: {params.minPrice} EGP
                <X className="size-3.5" aria-hidden="true" />
              </Link>
            )}
            {params.maxPrice && (
              <Link
                href={queryHrefWithout(params, "maxPrice")}
                className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1.5 text-sm font-medium text-green-800 transition-colors hover:bg-green-200"
              >
                Max: {params.maxPrice} EGP
                <X className="size-3.5" aria-hidden="true" />
              </Link>
            )}
          </div>
          <Link
            href="/products"
            className="text-sm text-slate-600 underline underline-offset-2 transition-colors hover:text-green-700"
          >
            Clear all
          </Link>
        </div>

        <p className="mb-5 text-sm text-slate-500" aria-live="polite">
          Showing {visibleProducts.length} products
        </p>

        {visibleProducts.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white px-5 py-12 text-center">
            <h2 className="text-lg font-semibold text-slate-900">
              No products found in {category.name}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Try removing a filter or browse another category.
            </p>
            <Link
              className="mt-4 inline-flex font-semibold text-green-700 hover:underline"
              href="/products"
            >
              Clear filters
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
            {pageProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
        <ProductPagination
          params={params}
          currentPage={currentPage}
          pageCount={pageCount}
        />
      </section>
    </main>
  );
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<ProductSearchParams>;
}) {
  const params = await searchParams;
  const categoryValue =
    typeof params.category === "string" ? params.category.trim() : "";

  if (categoryValue) {
    let categories: Category[] = [];
    let categoryLoadError = false;
    try {
      categories = await getCategories();
    } catch {
      categoryLoadError = true;
    }

    if (categoryLoadError) {
      return (
        <main className="min-h-[50vh] px-4 py-16 text-center">
          <p className="text-sm text-red-700" role="alert">
            The category could not be loaded. Please try again.
          </p>
          <Link
            href={`/products?category=${encodeURIComponent(categoryValue)}`}
            className="mt-3 inline-flex font-semibold text-green-700 hover:underline"
          >
            Retry
          </Link>
        </main>
      );
    }

    const category = categories.find(
      (item) =>
        item._id === categoryValue ||
        normalizeCategoryValue(item.slug) ===
          normalizeCategoryValue(categoryValue) ||
        normalizeCategoryValue(item.name) ===
          normalizeCategoryValue(categoryValue),
    );
    if (category) {
      let categoryProducts: Product[] = [];
      let productsLoadError = false;
      try {
        categoryProducts = await getCategoryProducts(category._id);
      } catch {
        productsLoadError = true;
      }

      if (productsLoadError) {
        return (
          <main className="min-h-[50vh] px-4 py-16 text-center">
            <p className="text-sm text-red-700" role="alert">
              Products in {category.name} could not be loaded. Please try again.
            </p>
            <Link
              href={`/products?category=${encodeURIComponent(categoryValue)}`}
              className="mt-3 inline-flex font-semibold text-green-700 hover:underline"
            >
              Retry
            </Link>
          </main>
        );
      }

      return (
        <CategoryLanding
          category={category}
          params={params}
          products={categoryProducts}
        />
      );
    }
  }

  const searchTerm =
    typeof params.search === "string" ? params.search.trim() : "";
  const selectedCategories = params.category
    ? Array.isArray(params.category)
      ? params.category
      : [params.category]
    : [];
  const selectedBrands = params.brand
    ? Array.isArray(params.brand)
      ? params.brand
      : [params.brand]
    : [];
  const hasActiveFilters =
    selectedCategories.length > 0 ||
    selectedBrands.length > 0 ||
    Boolean(params.minPrice) ||
    Boolean(params.maxPrice) ||
    Boolean(params.sort && params.sort !== "recommended");
  const isSearchView = searchTerm.length > 0 || hasActiveFilters;
  const minPrice = Number(params.minPrice) || 0;
  const maxPrice = Number(params.maxPrice) || Number.POSITIVE_INFINITY;
  let products: Product[] = [];
  let loadError = false;

  try {
    products = await getCompleteProductCatalog();
  } catch {
    products = [];
    loadError = true;
  }

  const normalizedSearch = searchTerm.toLocaleLowerCase();
  const visibleProducts = products
    .filter((product) => {
      const searchMatches =
        !normalizedSearch ||
        [product.title, product.category?.name, product.brand?.name]
          .filter(Boolean)
          .some((value) =>
            value?.toLocaleLowerCase().includes(normalizedSearch),
          );
      const categoryMatches =
        selectedCategories.length === 0 ||
        selectedCategories.includes(product.category?.name ?? "");
      const brandMatches =
        selectedBrands.length === 0 ||
        selectedBrands.includes(product.brand?.name ?? "");
      const price = product.priceAfterDiscount ?? product.price;
      return (
        searchMatches &&
        categoryMatches &&
        brandMatches &&
        price >= minPrice &&
        price <= maxPrice
      );
    })
    .sort((first, second) => {
      if (params.sort === "price-asc")
        return (
          (first.priceAfterDiscount ?? first.price) -
          (second.priceAfterDiscount ?? second.price)
        );
      if (params.sort === "price-desc")
        return (
          (second.priceAfterDiscount ?? second.price) -
          (first.priceAfterDiscount ?? first.price)
        );
      if (params.sort === "rating-desc")
        return second.ratingsAverage - first.ratingsAverage;
      return 0;
    });
  const categories = [
    ...new Set(
      products
        .map((product) => product.category?.name)
        .filter((name): name is string => Boolean(name)),
    ),
  ].sort();
  const brands = [
    ...new Set(
      products
        .map((product) => product.brand?.name)
        .filter((name): name is string => Boolean(name)),
    ),
  ].sort();
  const requestedPage = parsePage(params.page);
  const pageCount = Math.max(
    1,
    Math.ceil(visibleProducts.length / PRODUCTS_PER_PAGE),
  );
  const currentPage = Math.min(requestedPage, pageCount);

  if (
    params.page !== undefined &&
    (!hasValidPage(params.page) || currentPage !== requestedPage)
  ) {
    redirect(pageHref(params, currentPage));
  }

  const pageProducts = visibleProducts.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE,
  );

  return (
    <main className="min-h-screen bg-slate-50 pb-12">
      <header className="bg-linear-to-r from-green-600 to-green-400 px-4 py-8 text-white">
        <div className="mx-auto max-w-7xl">
          <nav
            aria-label="Breadcrumb"
            className="mb-6 flex items-center gap-2 text-sm"
          >
            <Link href="/" className="transition-opacity hover:opacity-80">
              Home
            </Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page" className="font-bold">
              All Products
            </span>
          </nav>
          <div className="flex items-center gap-5">
            <span
              className="flex size-14 items-center justify-center rounded-xl border border-white/20 bg-white/20"
              aria-hidden="true"
            >
              <Package className="size-7" />
            </span>
            <div>
              <h1 className="text-3xl font-bold">
                {searchTerm ? "Search Results" : "All Products"}
              </h1>
              <p className="mt-2 text-sm text-white/90">
                {searchTerm
                  ? `Results for “${searchTerm}”`
                  : "Explore our complete product collection"}
              </p>
            </div>
          </div>
        </div>
      </header>

      <section
        className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8"
        aria-label="Products"
      >
        {loadError ? (
          <div className="py-12 text-center" role="alert">
            <p className="text-sm text-red-700">
              Products could not be loaded. Please try again.
            </p>
            <Link
              className="mt-4 inline-flex font-semibold text-green-700 hover:underline"
              href="/products"
            >
              Retry
            </Link>
          </div>
        ) : (
          <form
            action="/products"
            method="get"
            className={
              isSearchView
                ? "grid items-start gap-6 lg:grid-cols-[230px_minmax(0,1fr)]"
                : "block"
            }
          >
            <input type="hidden" name="page" value="1" />
            {isSearchView && (
              <aside className="rounded-lg border border-slate-200 bg-white p-4">
                <details open>
                  <summary className="cursor-pointer list-none text-base font-bold text-slate-900">
                    Filters
                  </summary>
                  <div className="mt-4 space-y-5">
                    <label
                      className="block text-sm font-medium text-slate-700"
                      htmlFor="catalog-search"
                    >
                      Search Products
                      <input
                        id="catalog-search"
                        name="search"
                        type="search"
                        defaultValue={searchTerm}
                        placeholder="Search products..."
                        className="mt-2 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                      />
                    </label>
                    <fieldset>
                      <legend className="mb-2 text-sm font-semibold text-slate-800">
                        Categories
                      </legend>
                      <div className="max-h-44 space-y-2 overflow-y-auto">
                        {categories.map((category) => (
                          <label
                            key={category}
                            className="flex items-center gap-2 text-sm text-slate-600"
                          >
                            <input
                              type="checkbox"
                              name="category"
                              value={category}
                              defaultChecked={selectedCategories.includes(
                                category,
                              )}
                              className="size-4 accent-green-600"
                            />
                            <span>{category}</span>
                          </label>
                        ))}
                      </div>
                    </fieldset>
                    <fieldset>
                      <legend className="mb-2 text-sm font-semibold text-slate-800">
                        Brands
                      </legend>
                      <div className="max-h-44 space-y-2 overflow-y-auto">
                        {brands.map((brand) => (
                          <label
                            key={brand}
                            className="flex items-center gap-2 text-sm text-slate-600"
                          >
                            <input
                              type="checkbox"
                              name="brand"
                              value={brand}
                              defaultChecked={selectedBrands.includes(brand)}
                              className="size-4 accent-green-600"
                            />
                            <span>{brand}</span>
                          </label>
                        ))}
                      </div>
                    </fieldset>
                    <fieldset>
                      <legend className="mb-2 text-sm font-semibold text-slate-800">
                        Price Range (EGP)
                      </legend>
                      <div className="grid grid-cols-2 gap-2">
                        <label className="sr-only" htmlFor="min-price">
                          Minimum price
                        </label>
                        <input
                          id="min-price"
                          name="minPrice"
                          type="number"
                          min="0"
                          defaultValue={params.minPrice ?? ""}
                          placeholder="Min"
                          className="h-9 min-w-0 rounded-md border border-slate-200 px-2 text-sm"
                        />
                        <label className="sr-only" htmlFor="max-price">
                          Maximum price
                        </label>
                        <input
                          id="max-price"
                          name="maxPrice"
                          type="number"
                          min="0"
                          defaultValue={params.maxPrice ?? ""}
                          placeholder="Max"
                          className="h-9 min-w-0 rounded-md border border-slate-200 px-2 text-sm"
                        />
                      </div>
                    </fieldset>
                    <label
                      className="block text-sm font-semibold text-slate-800"
                      htmlFor="product-sort"
                    >
                      Sort By
                      <select
                        id="product-sort"
                        name="sort"
                        defaultValue={params.sort ?? "recommended"}
                        className="mt-2 h-10 w-full rounded-md border border-slate-200 bg-white px-2 text-sm font-normal text-slate-700"
                      >
                        <option value="recommended">Recommended</option>
                        <option value="price-asc">Price: Low to High</option>
                        <option value="price-desc">Price: High to Low</option>
                        <option value="rating-desc">Top Rated</option>
                      </select>
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        type="submit"
                        className="h-10 flex-1 rounded-md bg-green-600 px-3 text-sm font-semibold text-white hover:bg-green-700"
                      >
                        Apply Filters
                      </button>
                      <Link
                        href="/products"
                        className="text-sm font-semibold text-green-700 hover:underline"
                      >
                        Reset
                      </Link>
                    </div>
                  </div>
                </details>
              </aside>
            )}

            <div>
              {isSearchView && (
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-slate-600" aria-live="polite">
                    {visibleProducts.length} products found
                  </p>
                  {searchTerm && (
                    <p className="text-sm text-slate-500">
                      Search:{" "}
                      <span className="font-semibold text-slate-800">
                        {searchTerm}
                      </span>
                    </p>
                  )}
                </div>
              )}
              {visibleProducts.length === 0 ? (
                <div className="rounded-lg border border-slate-200 bg-white px-5 py-12 text-center">
                  <h2 className="text-lg font-semibold text-slate-900">
                    No products match these filters
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Try changing your search or clearing one of the filters.
                  </p>
                  <Link
                    className="mt-4 inline-flex font-semibold text-green-700 hover:underline"
                    href="/products"
                  >
                    Clear filters
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4 2xl:grid-cols-5">
                  {pageProducts.map((product) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>
              )}
              <ProductPagination
                params={params}
                currentPage={currentPage}
                pageCount={pageCount}
              />
            </div>
          </form>
        )}
      </section>
    </main>
  );
}
