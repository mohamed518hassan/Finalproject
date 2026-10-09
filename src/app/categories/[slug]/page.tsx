import Link from "next/link";
import { notFound } from "next/navigation";
import { Grid2X2 } from "lucide-react";
import { getCategories, getCategoryProducts } from "@/api/categories";
import ProductCard from "@/app/_components/productcard.tsx/page";
import type { Category, Product } from "@/types/product";

function normalizeRouteSegment(value: string) {
  return value.toLocaleLowerCase().replace(/[^a-z0-9]/g, "");
}

function CategoryError({
  categoryName,
  message,
  retryHref,
}: {
  categoryName: string;
  message: string;
  retryHref: string;
}) {
  return (
    <main className="mx-auto min-h-[50vh] max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-slate-900">{categoryName}</h1>
      <p className="mt-4 text-sm text-red-700" role="alert">
        {message}
      </p>
      <Link
        href={retryHref}
        className="mt-3 inline-flex font-semibold text-green-700 hover:underline"
      >
        Retry
      </Link>
    </main>
  );
}

function CategoryProducts({
  category,
  products,
}: {
  category: Category;
  products: Product[];
}) {
  return (
    <div className="min-h-screen bg-slate-50 pb-12">
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
            <span className="flex size-14 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/20">
              <Grid2X2 className="size-7" aria-hidden="true" />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {category.name}
              </h1>
              <p className="mt-1 text-sm text-white/90 sm:text-base">
                Browse products in {category.name}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main
        className="mx-auto max-w-7xl px-4 pt-7 sm:px-6 lg:px-8"
        aria-label={`${category.name} products`}
      >
        <div className="mb-5 flex items-end justify-between gap-3">
          <h2 className="text-xl font-bold text-slate-900">
            {category.name} Products
          </h2>
          <span className="text-sm text-slate-500">
            {products.length} products
          </span>
        </div>

        {products.length === 0 ? (
          <p className="rounded-lg border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
            No products found in this category.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let categories: Category[];

  try {
    categories = await getCategories();
  } catch {
    return (
      <CategoryError
        categoryName={slug}
        message="Categories could not be loaded. Please try again."
        retryHref={`/categories/${encodeURIComponent(slug)}`}
      />
    );
  }

  const category = categories.find(
    (item) =>
      item._id === slug ||
      normalizeRouteSegment(item.slug) === normalizeRouteSegment(slug) ||
      normalizeRouteSegment(item.name) === normalizeRouteSegment(slug),
  );
  if (!category) notFound();

  const retryHref = `/categories/${encodeURIComponent(category._id)}`;
  let categoryProducts: Product[];
  try {
    categoryProducts = await getCategoryProducts(category._id);
  } catch {
    return (
      <CategoryError
        categoryName={category.name}
        message={`Products for ${category.name} could not be loaded. Please try again.`}
        retryHref={retryHref}
      />
    );
  }

  return <CategoryProducts category={category} products={categoryProducts} />;
}
