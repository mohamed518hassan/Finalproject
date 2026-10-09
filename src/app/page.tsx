import Link from "next/link";
import {
  Headphones,
  RotateCcw,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { getAllProducts } from "@/api/getProducts";
import type { Product } from "@/types/product";
import ProductCard from "./_components/productcard.tsx/page";
const features = [
  {
    title: "Free Shipping",
    subtitle: "On orders over 500 EGP",
    icon: Truck,
    iconClassName: "bg-blue-50 text-blue-600",
  },
  {
    title: "Secure Payment",
    subtitle: "100% secure transactions",
    icon: ShieldCheck,
    iconClassName: "bg-green-50 text-green-600",
  },
  {
    title: "Easy Returns",
    subtitle: "14-day return policy",
    icon: RotateCcw,
    iconClassName: "bg-amber-50 text-amber-600",
  },
  {
    title: "24/7 Support",
    subtitle: "Dedicated support team",
    icon: Headphones,
    iconClassName: "bg-purple-50 text-purple-600",
  },
];

export default async function Home() {
  let data: Product[] = [];
  let productsUnavailable = false;
  try {
    data = await getAllProducts();
  } catch {
    productsUnavailable = true;
  }
  return (
    <main className="bg-slate-50 pb-12">
      <section className="bg-linear-to-br from-emerald-700 via-green-600 to-emerald-500 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-15"
          style={{ backgroundImage: "url('/bg.jpg')" }}
          aria-hidden="true"
        />
        <div className="absolute bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.18),transparent_32%),linear-gradient(90deg,rgba(6,95,70,0.25),transparent)]" />

        <div className="relative mx-auto flex min-h-105 max-w-7xl items-center px-14 py-20 sm:px-20 lg:min-h-115 lg:px-24">
          <div className="max-w-xl text-white">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-100">
              Freshness, delivered
            </p>
            <h1 className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              Fresh Products Delivered to your Door
            </h1>
            <p className="mt-5 text-lg font-medium text-emerald-50 sm:text-xl">
              Get 20% off your first order
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/products"
                className="rounded-full bg-white px-6 py-3 text-sm font-bold text-green-700 shadow-lg shadow-green-950/15 transition hover:bg-emerald-50"
              >
                Shop Now
              </Link>
              <Link
                href="/products"
                className="rounded-full border border-white/60 bg-white/5 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/15"
              >
                View Deals
              </Link>
            </div>
          </div>

        </div>
      </section>

      <section
        className="m-6 mx-auto grid max-w-7xl grid-cols-1 gap-3 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:gap-4 lg:px-8"
        aria-label="Store benefits"
      >
        {features.map(({ title, subtitle, icon: Icon, iconClassName }) => (
          <article
            key={title}
            className="flex items-center gap-4 rounded-xl border border-slate-100 bg-white p-5 shadow-lg shadow-slate-200/70"
          >
            <span
              className={`flex size-12 shrink-0 items-center justify-center rounded-full ${iconClassName}`}
            >
              <Icon className="size-6" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-800">{title}</h2>
              <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="mx-auto max-w-7xl px-4 pt-12 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-2">
          <span className="h-6 w-1 rounded-full bg-emerald-600" />
          <h2 className="text-2xl font-bold text-slate-900">
            Featured Products
          </h2>
        </div>

        {productsUnavailable ? (
          <div
            className="rounded-lg border border-red-100 bg-white px-5 py-8 text-center"
            role="alert"
          >
            <p className="text-sm text-red-700">
              Featured products could not be loaded.
            </p>
            <Link
              href="/products"
              className="mt-3 inline-flex text-sm font-semibold text-green-700 hover:underline"
            >
              Browse all products
            </Link>
          </div>
        ) : data.length === 0 ? (
          <p className="rounded-lg border border-slate-200 bg-white px-5 py-8 text-center text-sm text-slate-500">
            No featured products are available right now.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {data.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
