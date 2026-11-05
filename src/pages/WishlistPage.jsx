
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import {
  ArrowRight,
  Gift,
  Heart,
  Headphones,
  MessageCircle,
  RotateCcw,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";

import ProductCard from "../components/product/ProductCard";
import { useWishlist } from "../providers/WishlistProvider";

// ==========================================
// CONFIGURATION
// ==========================================

const API_URL = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:3000"
).replace(/\/$/, "");

// ==========================================
// PRICE HELPERS
// Sorting uses actual product/variant prices.
// ==========================================

const validPrice = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) && number > 0
    ? number
    : null;
};

const getPrice = (product) => {
  const variantPrices =
    product.variantsEnabled &&
    Array.isArray(product.variants)
      ? product.variants
          .filter(
            (variant) =>
              variant.available !== false
          )
          .map(
            (variant) =>
              validPrice(variant.price)
          )
          .filter((price) => price !== null)
      : [];

  if (variantPrices.length) {
    return Math.min(...variantPrices);
  }

  if (validPrice(product.price) !== null) {
    return Number(product.price);
  }

  const regular =
    validPrice(product.regularPrice) || 0;

  const sale =
    validPrice(product.salePrice);

  return sale !== null && sale < regular
    ? sale
    : regular;
};

// ==========================================
// LOADING SKELETON
// ==========================================

function Skeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
      {Array.from(
        { length: 8 },
        (_, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-2xl border border-base-300 bg-base-100"
          >
            <div className="aspect-square animate-pulse bg-base-200" />

            <div className="space-y-3 p-4">
              <div className="h-4 w-2/3 animate-pulse rounded bg-base-200" />

              <div className="h-4 animate-pulse rounded bg-base-200" />

              <div className="h-4 w-1/2 animate-pulse rounded bg-base-200" />

              <div className="h-10 animate-pulse rounded-xl bg-base-200" />
            </div>
          </div>
        )
      )}
    </div>
  );
}

// ==========================================
// MAIN WISHLIST PAGE
// ==========================================

export default function WishlistPage() {
  const {
    productIds,
    products,
    missingIds,

    canWishlist,
    isGuest,
    authPending,
    ready,
    loading,
    isError,
    error,
    savingId,

    clearWishlist,
    removeMissing,
    refetch,
  } = useWishlist();

  // ========================================
  // FILTER STATES
  // ========================================

  const [category, setCategory] =
    useState("all");

  const [sortBy, setSortBy] =
    useState("newest");

  const [search, setSearch] =
    useState("");

  const [showSearch, setShowSearch] =
    useState(false);

  const [actionError, setActionError] =
    useState("");

  // ========================================
  // CATEGORY QUERY
  // ========================================

  const { data: categoryData } = useQuery({
    queryKey: ["catalogCategories"],

    enabled:
      canWishlist &&
      products.length > 0,

    queryFn: async ({ signal }) => {
      const response = await fetch(
        `${API_URL}/categories`,
        { signal }
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          "Category load failed"
        );
      }

      return data;
    },

    staleTime: 5 * 60 * 1000,
  });

  // ========================================
  // CATEGORY NAME MAP
  // ========================================

  const categoryNames = useMemo(
    () =>
      new Map(
        (
          categoryData?.categories || []
        ).map((item) => [
          item.id,
          item.name,
        ])
      ),
    [categoryData]
  );

  // ========================================
  // DYNAMIC CATEGORY FILTER OPTIONS
  // ========================================

  const categoryOptions = useMemo(() => {
    const counts = new Map();

    for (const product of products) {
      if (!product.categoryId) continue;

      counts.set(
        product.categoryId,
        (
          counts.get(product.categoryId) || 0
        ) + 1
      );
    }

    return [
      {
        value: "all",
        label: "সব পছন্দ",
        count: products.length,
      },

      ...[...counts.entries()].map(
        ([id, count]) => ({
          value: id,
          label:
            categoryNames.get(id) || id,
          count,
        })
      ),
    ];
  }, [products, categoryNames]);

  // ========================================
  // SEARCH + CATEGORY FILTER + SORT
  // ========================================

  const filteredProducts = useMemo(() => {
    const keyword = search
      .normalize("NFKC")
      .trim()
      .toLowerCase();

    const positions = new Map(
      productIds.map((id, index) => [
        id,
        index,
      ])
    );

    const result = products.filter(
      (product) => {
        if (
          category !== "all" &&
          product.categoryId !== category
        ) {
          return false;
        }

        if (!keyword) {
          return true;
        }

        const searchableText = [
          product.name,
          product.description,
          product.sku,
          product.categoryId,
          categoryNames.get(
            product.categoryId
          ),

          ...(product.occasionIds || []),
        ]
          .filter(Boolean)
          .join(" ")
          .normalize("NFKC")
          .toLowerCase();

        return searchableText.includes(keyword);
      }
    );

    // ====================================
    // SORTING
    // ====================================

    result.sort((a, b) => {
      if (sortBy === "price-low") {
        return getPrice(a) - getPrice(b);
      }

      if (sortBy === "price-high") {
        return getPrice(b) - getPrice(a);
      }

      const aIndex =
        positions.get(a._id) ?? 0;

      const bIndex =
        positions.get(b._id) ?? 0;

      return sortBy === "oldest"
        ? aIndex - bIndex
        : bIndex - aIndex;
    });

    return result;
  }, [
    products,
    productIds,
    category,
    search,
    sortBy,
    categoryNames,
  ]);

  // ========================================
  // RESET FILTERS
  // ========================================

  const resetFilters = () => {
    setCategory("all");
    setSortBy("newest");
    setSearch("");
    setShowSearch(false);
  };

  // ========================================
  // CLEAR WISHLIST
  // ========================================

  const handleClear = async () => {
    if (
      !window.confirm(
        "পছন্দের তালিকার সব উপহার সরিয়ে দিতে চান?"
      )
    ) {
      return;
    }

    setActionError("");

    try {
      await clearWishlist();
      resetFilters();
    } catch (error) {
      setActionError(
        error.message ||
          "Wishlist খালি করা যায়নি"
      );
    }
  };

  // ========================================
  // REMOVE MISSING PRODUCTS
  // ========================================

  const handleRemoveMissing = async () => {
    setActionError("");

    try {
      await removeMissing();
    } catch (error) {
      setActionError(
        error.message ||
          "প্রোডাক্ট সরানো যায়নি"
      );
    }
  };

  // ========================================
  // JSX
  // ========================================

  return (
    <main className="min-h-screen bg-base-200/60 py-6 text-base-content sm:py-10">
      <div className="page-container">

        {/* ================================= */}
        {/* BREADCRUMB */}
        {/* ================================= */}

        <nav className="mb-5 flex items-center gap-2 text-xs text-muted sm:text-sm">

          <Link
            to="/"
            className="hover:text-secondary"
          >
            হোম
          </Link>

          <span>›</span>

          <span className="font-semibold text-primary">
            আমার পছন্দের তালিকা
          </span>
        </nav>

        {/* ================================= */}
        {/* WISHLIST HERO */}
        {/* ================================= */}

        <section className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-secondary to-secondary/70 p-5 text-white sm:p-7">

          <div className="pointer-events-none absolute -right-10 -top-16 size-52 rounded-full bg-white/10 blur-2xl" />

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

            <div className="max-w-xl">

              <div className="flex flex-wrap items-center gap-2">

                <h1 className="text-2xl font-bold sm:text-3xl">
                  আমার পছন্দের তালিকা
                </h1>

                <span className="badge-gold flex items-center gap-1">

                  <Heart size={12} />

                  {productIds.length.toLocaleString(
                    "bn-BD"
                  )}{" "}
                  টি উপহার
                </span>
              </div>

              <p className="mt-3 text-xs leading-6 text-white/80 sm:text-sm">
                পছন্দের উপহারগুলো এক জায়গায়
                রাখুন। যখন ইচ্ছা বিস্তারিত
                দেখুন ও অর্ডার করুন।
                {isGuest
                  ? " গেস্ট হিসেবে এই ব্রাউজারে সেভ থাকবে।"
                  : " আপনার অ্যাকাউন্টে সেভ থাকবে।"}
              </p>
            </div>

            {/* HERO BUTTONS */}

            <div className="flex flex-wrap gap-2">

              <Link
                to="/shop"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-primary transition hover:bg-base-200 sm:text-sm"
              >
                <Gift size={15} />
                আরও উপহার দেখুন
              </Link>

              <Link
                to="/cart"
                className="btn-gold rounded-xl px-4 py-2.5 text-xs sm:text-sm"
              >
                <ShoppingBag size={15} />
                শপিং কার্ট
              </Link>
            </div>
          </div>
        </section>

        {/* ================================= */}
        {/* NOT ALLOWED */}
        {/* ================================= */}

        {!canWishlist && !authPending ? (

          <div className="section-card py-14 text-center">

            <Heart
              size={30}
              className="mx-auto text-secondary"
            />

            <h2 className="mt-4 text-lg font-bold text-primary">
              এই অ্যাকাউন্টের জন্য Wishlist উপলব্ধ নয়
            </h2>

            <p className="mt-2 text-sm text-muted">
              শুধু Guest ও Active Customer
              wishlist ব্যবহার করতে পারবেন।
            </p>
          </div>

        ) : (

          <>
            {/* ============================= */}
            {/* FILTER BAR */}
            {/* ============================= */}

            {ready && productIds.length > 0 && (

              <section className="section-card mb-5 p-3 sm:p-4">

                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

                  {/* CATEGORY FILTER */}

                  <div className="flex min-w-0 items-center gap-2 overflow-x-auto pb-1 lg:pb-0">

                    {categoryOptions.map(
                      (item) => (

                        <button
                          key={item.value}
                          type="button"
                          onClick={() =>
                            setCategory(
                              item.value
                            )
                          }
                          className={`shrink-0 rounded-full px-3 py-2 text-xs font-semibold transition ${
                            category === item.value
                              ? "bg-primary text-white"
                              : "bg-base-200 text-muted hover:bg-secondary/10 hover:text-secondary"
                          }`}
                        >
                          {item.label} (
                          {item.count.toLocaleString(
                            "bn-BD"
                          )}
                          )
                        </button>
                      )
                    )}
                  </div>

                  {/* FILTER TOOLS */}

                  <div className="flex items-center gap-2">

                    <button
                      type="button"
                      onClick={() => {
                        setShowSearch(
                          (value) => !value
                        );

                        setSearch("");
                      }}
                      className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-base-300 bg-white text-secondary"
                      aria-label="সার্চ করুন"
                    >
                      {showSearch ? (
                        <X size={17} />
                      ) : (
                        <Search size={17} />
                      )}
                    </button>

                    {/* SORT */}

                    <div className="relative min-w-0 flex-1 lg:w-48">

                      <SlidersHorizontal
                        size={15}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-secondary"
                      />

                      <select
                        value={sortBy}
                        onChange={(event) =>
                          setSortBy(
                            event.target.value
                          )
                        }
                        className="select h-10 w-full rounded-xl border-base-300 bg-white pl-9 text-xs text-primary focus:outline-none"
                        aria-label="উপহার সাজান"
                      >
                        <option value="newest">
                          সম্প্রতি যুক্ত করা
                        </option>

                        <option value="oldest">
                          আগে যুক্ত করা
                        </option>

                        <option value="price-low">
                          দাম: কম থেকে বেশি
                        </option>

                        <option value="price-high">
                          দাম: বেশি থেকে কম
                        </option>
                      </select>
                    </div>

                    {/* CLEAR ALL */}

                    <button
                      type="button"
                      onClick={handleClear}
                      disabled={Boolean(savingId)}
                      className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-rose-200 bg-white text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                      aria-label="সব পছন্দ মুছুন"
                      title="সব পছন্দ মুছুন"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>

                {/* SEARCH FIELD */}

                {showSearch && (

                  <div className="relative mt-3">

                    <Search
                      size={17}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary"
                    />

                    <input
                      type="search"
                      value={search}
                      onChange={(event) =>
                        setSearch(
                          event.target.value
                        )
                      }
                      placeholder="পছন্দের উপহার খুঁজুন..."
                      className="input h-11 w-full rounded-xl border-base-300 bg-base-200/50 pl-10 text-sm focus:outline-none"
                    />
                  </div>
                )}
              </section>
            )}

            {/* ============================= */}
            {/* ACTION ERROR */}
            {/* ============================= */}

            {actionError && (

              <p
                role="alert"
                className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700"
              >
                {actionError}
              </p>
            )}

            {/* ============================= */}
            {/* DELETED / UNPUBLISHED PRODUCTS */}
            {/* ============================= */}

            {ready && missingIds.length > 0 && (

              <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-base-300 bg-white p-4">

                <p className="text-xs text-muted">
                  {missingIds.length}টি সংরক্ষিত
                  উপহার এখন আর প্রকাশিত নেই।
                </p>

                <button
                  type="button"
                  onClick={handleRemoveMissing}
                  disabled={Boolean(savingId)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 disabled:opacity-50"
                >
                  <Trash2 size={14} />
                  তালিকা থেকে সরান
                </button>
              </div>
            )}

            {/* ============================= */}
            {/* PRODUCT DISPLAY */}
            {/* ============================= */}

            {loading ||
            (!ready && !isError) ? (

              <Skeleton />

            ) : isError ? (

              <div className="section-card py-14 text-center">

                <h2 className="text-lg font-bold text-primary">
                  Wishlist লোড করা যায়নি
                </h2>

                <p className="mt-2 text-sm text-muted">
                  {error?.message}
                </p>

                <button
                  type="button"
                  onClick={() => refetch()}
                  className="btn-brand mt-5"
                >
                  <RotateCcw size={16} />
                  আবার চেষ্টা করুন
                </button>
              </div>

            ) : productIds.length === 0 ? (

              /* =========================== */
              /* EMPTY WISHLIST */
              /* =========================== */

              <div className="section-card py-16 text-center">

                <Heart
                  size={34}
                  className="mx-auto text-secondary"
                />

                <h2 className="mt-4 text-lg font-bold text-primary">
                  আপনার পছন্দের তালিকা খালি
                </h2>

                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">
                  Shop থেকে উপহারের Heart আইকনে
                  ক্লিক করলে এখানে সেভ হবে।
                </p>

                <Link
                  to="/shop"
                  className="btn-brand mt-5 inline-flex items-center gap-2"
                >
                  উপহার দেখুন
                  <ArrowRight size={16} />
                </Link>
              </div>

            ) : filteredProducts.length > 0 ? (

              /* =========================== */
              /* REAL PRODUCT CARDS */
              /* =========================== */

              <>
                <p className="mb-4 text-sm font-semibold text-primary">

                  পছন্দের উপহার

                  <span className="ml-2 font-normal text-muted">
                    ({" "}
                    {filteredProducts.length.toLocaleString(
                      "bn-BD"
                    )}
                    টি )
                  </span>
                </p>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">

                  {filteredProducts.map(
                    (product) => (

                      <ProductCard
                        key={product._id}
                        product={product}
                      />
                    )
                  )}
                </div>
              </>

            ) : (

              /* =========================== */
              /* FILTER EMPTY */
              /* =========================== */

              <div className="section-card py-14 text-center">

                <Search
                  size={30}
                  className="mx-auto text-secondary"
                />

                <h2 className="mt-4 text-lg font-bold text-primary">
                  কোনো উপহার পাওয়া যায়নি
                </h2>

                <button
                  type="button"
                  onClick={resetFilters}
                  className="btn-brand mt-5"
                >
                  <RotateCcw size={16} />
                  ফিল্টার রিসেট করুন
                </button>
              </div>
            )}
          </>
        )}

        {/* ================================= */}
        {/* SUPPORT BANNER */}
        {/* ================================= */}

        <section className="mt-8 flex flex-col gap-4 rounded-2xl bg-primary p-5 text-white sm:flex-row sm:items-center sm:justify-between sm:p-6">

          <div className="flex items-start gap-3">

            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-gold-soft">
              <Headphones size={20} />
            </span>

            <div>

              <p className="text-xs font-semibold text-gold-soft">
                পছন্দের উপহার নিয়ে সাহায্য?
              </p>

              <h3 className="mt-1 text-base font-bold">
                উপহার নির্বাচন নিয়ে দ্বিধায় ভুগছেন?
              </h3>

              <p className="mt-2 max-w-xl text-xs leading-6 text-white/70">
                আপনার বাজেট ও উপলক্ষ অনুযায়ী
                উপহার বেছে নিতে আমাদের সঙ্গে
                যোগাযোগ করুন।
              </p>
            </div>
          </div>

          <Link
            to="/contact"
            className="btn-gold shrink-0 rounded-xl px-5 py-3 text-xs sm:text-sm"
          >
            <MessageCircle size={16} />
            যোগাযোগ করুন
          </Link>
        </section>
      </div>
    </main>
  );
}
