import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { ArrowRight, PackageSearch, RotateCcw, Sparkles } from "lucide-react";

import ProductCard from "../product/ProductCard";

// ========================================
// API CONFIG
// ========================================

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/$/, "");

const MAX_PRODUCTS = 8;

const QUERY_KEY = ["public-featured-products"];

// ========================================
// FETCH FEATURED PRODUCTS
// ========================================

const fetchFeaturedProducts = async ({ signal }) => {
  const params = new URLSearchParams({
    features: "featured",
    sort: "featured",
    page: "1",
  });

  const response = await fetch(`${API_URL}/products?${params.toString()}`, {
    signal,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Featured products load failed");
  }

  return data;
};

// ========================================
// PRODUCT SKELETON
// ========================================

const ProductSkeleton = () => {
  return (
    <div className="overflow-hidden rounded-2xl border border-base-300 bg-base-100">
      <div className="aspect-square animate-pulse bg-base-200" />

      <div className="space-y-3 p-4">
        <div className="h-4 w-24 animate-pulse rounded bg-base-200" />

        <div className="h-4 w-full animate-pulse rounded bg-base-200" />

        <div className="h-4 w-3/4 animate-pulse rounded bg-base-200" />

        <div className="h-5 w-28 animate-pulse rounded bg-base-200" />

        <div className="h-10 animate-pulse rounded-xl bg-base-200" />
      </div>
    </div>
  );
};

// ========================================
// MAIN COMPONENT
// ========================================

const PopularProducts = () => {
  const queryClient = useQueryClient();

  // ======================================
  // FEATURED PRODUCTS QUERY
  // ======================================

  const { data, isPending, isError, isFetching, error } = useQuery({
    queryKey: QUERY_KEY,

    queryFn: fetchFeaturedProducts,

    staleTime: 30 * 1000,

    refetchOnWindowFocus: false,
  });

  // ======================================
  // FEATURED PRODUCTS
  // ======================================

  const products = Array.isArray(data?.products)
    ? data.products
        .filter((product) => product.featured === true)
        .slice(0, MAX_PRODUCTS)
    : [];

  // ======================================
  // REFRESH PRODUCTS
  // ======================================

  const refreshProducts = () => {
    queryClient.invalidateQueries({
      queryKey: QUERY_KEY,
    });
  };

  // ======================================
  // JSX
  // ======================================

  return (
    <section className="section-bg section-padding">
      <div className="page-container">
        {/* ================================= */}
        {/* SECTION HEADER */}
        {/* ================================= */}

        <div className="mb-6 flex items-end justify-between gap-3 sm:mb-8">
          <div>
            <span className="badge-gold">
              <Sparkles size={13} />
              টপ চয়েস
            </span>

            <h2 className="mt-3 text-2xl font-bold leading-tight text-primary sm:text-3xl">
              জনপ্রিয় সেরা উপহার
            </h2>

            <p className="mt-2 text-sm text-muted">
              আপনার প্রিয়জনের জন্য বেছে নিন বিশেষ কিছু।
            </p>
          </div>

          {/* DESKTOP VIEW ALL */}

          <Link
            to="/shop?features=featured"
            className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-secondary transition hover:text-primary sm:inline-flex"
          >
            সব দেখুন
            <ArrowRight size={15} />
          </Link>
        </div>

        {/* ================================= */}
        {/* LOADING STATE */}
        {/* ================================= */}

        {isPending ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
            {Array.from({ length: MAX_PRODUCTS }, (_, index) => (
              <ProductSkeleton key={index} />
            ))}
          </div>
        ) : isError ? (
          /* ================================= */
          /* ERROR STATE */
          /* ================================= */

          <div className="flex min-h-60 flex-col items-center justify-center rounded-2xl border border-base-300 bg-base-100 px-5 py-10 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
              <PackageSearch size={28} />
            </div>

            <h3 className="mt-4 text-lg font-bold text-primary">
              প্রোডাক্ট লোড করা যায়নি
            </h3>

            <p className="mt-2 max-w-sm text-sm text-muted">
              {error?.message || "প্রোডাক্ট লোড করার সময় সমস্যা হয়েছে।"}
            </p>

            <button
              type="button"
              onClick={refreshProducts}
              className="btn-brand mt-5 inline-flex items-center gap-2"
            >
              <RotateCcw size={16} />
              আবার চেষ্টা করুন
            </button>
          </div>
        ) : products.length > 0 ? (
          /* ================================= */
          /* FEATURED PRODUCT GRID */
          /* ================================= */

          <div
            className={`grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-5 ${
              isFetching ? "opacity-70" : ""
            }`}
            aria-busy={isFetching}
          >
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        ) : (
          /* ================================= */
          /* EMPTY STATE */
          /* ================================= */

          <div className="flex min-h-60 flex-col items-center justify-center rounded-2xl border border-base-300 bg-base-100 px-5 py-10 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
              <PackageSearch size={28} />
            </div>

            <h3 className="mt-4 text-lg font-bold text-primary">
              কোনো ফিচার্ড প্রোডাক্ট পাওয়া যায়নি
            </h3>

            <p className="mt-2 max-w-sm text-sm text-muted">
              বর্তমানে কোনো বিশেষ উপহার নির্বাচন করা হয়নি। আমাদের অন্যান্য
              উপহারগুলো দেখতে পারেন।
            </p>

            <Link
              to="/shop"
              className="btn-brand mt-5 inline-flex items-center gap-2"
            >
              সব উপহার দেখুন
              <ArrowRight size={16} />
            </Link>
          </div>
        )}

        {/* ================================= */}
        {/* MOBILE VIEW ALL */}
        {/* ================================= */}

        {!isPending && !isError && products.length > 0 && (
          <div className="mt-6 text-center sm:hidden">
            <Link
              to="/shop?features=featured"
              className="btn-outline-brand w-full"
            >
              সব ফিচার্ড উপহার দেখুন
              <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};

export default PopularProducts;
