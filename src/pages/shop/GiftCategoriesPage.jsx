import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import {
  ArrowRight,
  BookOpen,
  Cake,
  Gift,
  Heart,
  HeartHandshake,
  PartyPopper,
  Search,
  Sparkles,
  X,
  RotateCcw,
} from "lucide-react";

import { API_URL } from "../../utils/siteConfig";

// ==========================================
// OCCASION ICON FALLBACK
// ==========================================

const occasionIcons = {
  birthday: Cake,
  anniversary: Heart,
  "wedding-nikah": Sparkles,
  "love-romance": Heart,
  islamic: BookOpen,
  "parents-day": HeartHandshake,
  congratulations: PartyPopper,
  surprise: Gift,
};

const occasionColors = [
  "bg-pink-100 text-pink-600",
  "bg-fuchsia-100 text-fuchsia-600",
  "bg-amber-100 text-amber-700",
  "bg-secondary/10 text-secondary",
  "bg-violet-100 text-violet-600",
  "bg-orange-100 text-orange-700",
  "bg-emerald-100 text-emerald-700",
  "bg-rose-100 text-rose-600",
];

const popularSearches = [
  "ফটো ফ্রেম ও স্মৃতির উপহার",
  "গিফট কম্বো ও হ্যাম্পার",
  "ফুল ও বুকেট",
];

// ==========================================
// PUBLIC API FETCH FUNCTION
// ==========================================

const fetchPublicData = async (endpoint, signal) => {
  const response = await fetch(`${API_URL}${endpoint}`, {
    signal,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data.success) {
    throw new Error(data.message || "তথ্য লোড করা যায়নি");
  }

  return data;
};

// ==========================================
// SEARCH MATCHING FUNCTION
// ==========================================

const normalizeSearch = (value) =>
  String(value ?? "")
    .normalize("NFKC")
    .toLowerCase()
    .trim();

const matchesTaxonomy = (item, keyword) => {
  if (!keyword) return true;

  const searchValues = [
    item.id,
    item.name,
    item.description,
    ...(Array.isArray(item.searchKeywords) ? item.searchKeywords : []),
  ];

  return searchValues.some((value) => normalizeSearch(value).includes(keyword));
};

// ==========================================
// PRODUCT COUNT FORMATTER
// ==========================================

const hasProductCount = (item) =>
  typeof item.productCount === "number" && Number.isFinite(item.productCount);

const formatProductCount = (count) => Number(count).toLocaleString("bn-BD");

// ==========================================
// TAXONOMY ICON
// Uses MongoDB iconUrl when available.
// Falls back to Lucide icon.
// ==========================================

function TaxonomyIcon({ iconUrl, FallbackIcon = Gift, className = "size-6" }) {
  const [failedUrl, setFailedUrl] = useState(null);

  if (iconUrl && failedUrl !== iconUrl) {
    return (
      <img
        src={iconUrl}
        alt=""
        loading="lazy"
        className={`${className} object-contain`}
        onError={() => setFailedUrl(iconUrl)}
      />
    );
  }

  return <FallbackIcon className={className} />;
}

// ==========================================
// LOADING SKELETON
// ==========================================

function CategorySkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }, (_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-2xl border border-base-300 bg-base-100"
        >
          <div className="aspect-[1.55] animate-pulse bg-base-200" />

          <div className="space-y-3 p-5">
            <div className="h-5 w-3/4 animate-pulse rounded bg-base-200" />
            <div className="h-3 w-full animate-pulse rounded bg-base-200" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-base-200" />
          </div>

          <div className="h-12 animate-pulse bg-base-200/70" />
        </div>
      ))}
    </div>
  );
}

function OccasionSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      {Array.from({ length: 8 }, (_, index) => (
        <div
          key={index}
          className="h-40 animate-pulse rounded-2xl bg-base-200"
        />
      ))}
    </div>
  );
}

// ==========================================
// EMPTY / ERROR STATE
// ==========================================

function EmptyState({
  title,
  description,
  onRetry,
  buttonText = "আবার চেষ্টা করুন",
}) {
  return (
    <div className="rounded-2xl border border-base-300 bg-base-200/50 px-5 py-14 text-center">
      <Search size={32} className="mx-auto text-secondary" />

      <h3 className="mt-4 text-lg font-bold text-primary">{title}</h3>

      <p className="mt-2 text-sm text-muted">{description}</p>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="btn-outline-brand mt-5 inline-flex items-center gap-2"
        >
          <RotateCcw size={15} />
          {buttonText}
        </button>
      )}
    </div>
  );
}

// ==========================================
// CATEGORY CARD
// ==========================================

function CategoryCard({ category }) {
  const shopLink = `/shop?categories=${encodeURIComponent(category.id)}`;

  return (
    <article className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-base-300/70 bg-base-100 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
      {/* IMAGE */}
      <Link
        to={shopLink}
        className="relative block aspect-[1.55] overflow-hidden bg-base-200"
        aria-label={`${category.name} কালেকশন দেখুন`}
      >
        <div className="absolute inset-0 flex items-center justify-center text-secondary/25">
          <Gift size={48} />
        </div>

        {category.imageUrl && (
          <img
            src={category.imageUrl}
            alt={category.name}
            loading="lazy"
            className="relative size-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        )}

        {/* PRODUCT COUNT */}
        {hasProductCount(category) && (
          <span className="absolute left-3 top-3 rounded-full bg-secondary px-3 py-1 text-[11px] font-semibold text-white shadow-sm">
            {formatProductCount(category.productCount)}টি প্রোডাক্ট
          </span>
        )}

        {/* CATEGORY ICON */}
        <div className="absolute bottom-3 right-3 flex size-11 items-center justify-center rounded-xl border border-white/70 bg-white/95 p-2 shadow-md">
          <TaxonomyIcon
            iconUrl={category.iconUrl}
            FallbackIcon={Gift}
            className="size-6 text-secondary"
          />
        </div>
      </Link>

      {/* CONTENT */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <Link to={shopLink} className="flex items-start justify-between gap-3">
          <h3 className="text-base font-bold leading-6 text-primary transition group-hover:text-secondary sm:text-lg">
            {category.name}
          </h3>

          <ArrowRight
            size={18}
            className="mt-1 shrink-0 text-secondary transition-transform group-hover:translate-x-1"
          />
        </Link>

        <p className="mt-2 line-clamp-2 text-xs leading-6 text-muted sm:text-sm">
          {category.description ||
            "পছন্দের উপহার বেছে নিতে আমাদের এই কালেকশনটি ঘুরে দেখুন।"}
        </p>

        {/* OPTIONAL CATEGORY TAGS */}
        {Array.isArray(category.tags) && category.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {category.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-secondary/5 px-2.5 py-1 text-[11px] font-medium text-secondary"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 bg-secondary/5 px-4 py-3 sm:px-5">
        <span className="text-xs text-muted">
          {hasProductCount(category)
            ? `${formatProductCount(category.productCount)}টি উপহার`
            : "বিশেষ উপহার কালেকশন"}
        </span>

        <Link
          to={shopLink}
          className="inline-flex items-center gap-1 text-xs font-bold text-secondary hover:text-primary"
        >
          উপহার দেখুন
          <ArrowRight size={13} />
        </Link>
      </div>
    </article>
  );
}

// ==========================================
// OCCASION CARD
// ==========================================

function OccasionCard({ occasion, index }) {
  const Icon = occasionIcons[occasion.id] || Gift;

  const color = occasionColors[index % occasionColors.length];

  const shopLink = `/shop?occasions=${encodeURIComponent(occasion.id)}`;

  return (
    <Link
      to={shopLink}
      className="group flex flex-col items-center rounded-2xl border border-base-300/60 bg-base-100 p-4 text-center shadow-sm transition duration-300 hover:-translate-y-1 hover:border-secondary/30 hover:shadow-md sm:p-5"
    >
      {/* OCCASION ICON */}
      <div
        className={`flex size-14 items-center justify-center rounded-2xl ${color}`}
      >
        <TaxonomyIcon
          iconUrl={occasion.iconUrl}
          FallbackIcon={Icon}
          className="size-7"
        />
      </div>

      <h3 className="mt-4 text-sm font-bold leading-6 text-primary transition group-hover:text-secondary">
        {occasion.name}
      </h3>

      <p className="mt-1 text-[11px] text-muted">
        {hasProductCount(occasion)
          ? `${formatProductCount(occasion.productCount)}টি বিশেষ উপহার`
          : "বিশেষ উপহার কালেকশন"}
      </p>

      <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-secondary">
        কালেকশন দেখুন
        <ArrowRight size={13} />
      </span>
    </Link>
  );
}

// ==========================================
// MAIN GIFT CATEGORIES PAGE
// ==========================================

export default function GiftCategoriesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");

  // ========================================
  // CATEGORY QUERY
  // PUBLIC: Guest / Customer / Admin
  // ========================================

  const {
    data: categoryData,
    isPending: loadingCategories,
    isError: categoryError,
  } = useQuery({
    queryKey: ["catalogCategories"],

    queryFn: ({ signal }) => fetchPublicData("/categories", signal),

    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const categories = useMemo(
    () =>
      Array.isArray(categoryData?.categories) ? categoryData.categories : [],
    [categoryData],
  );

  // ========================================
  // OCCASION QUERY
  // PUBLIC: Guest / Customer / Admin
  // ========================================

  const {
    data: occasionData,
    isPending: loadingOccasions,
    isError: occasionError,
  } = useQuery({
    queryKey: ["catalogOccasions"],

    queryFn: ({ signal }) => fetchPublicData("/occasions", signal),

    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const occasions = useMemo(
    () =>
      Array.isArray(occasionData?.occasions) ? occasionData.occasions : [],
    [occasionData],
  );

  // ========================================
  // SEARCH FILTER
  // Bangla + English + Banglish keywords
  // ========================================

  const keyword = normalizeSearch(search);

  const filteredCategories = useMemo(() => {
    if (!keyword) return categories;

    return categories.filter((category) => matchesTaxonomy(category, keyword));
  }, [categories, keyword]);

  const filteredOccasions = useMemo(() => {
    if (!keyword) return occasions;

    return occasions.filter((occasion) => matchesTaxonomy(occasion, keyword));
  }, [occasions, keyword]);

  // ========================================
  // QUERY CLIENT REFRESH
  // ========================================

  const refreshCategories = () => {
    queryClient.invalidateQueries({
      queryKey: ["catalogCategories"],
    });
  };

  const refreshOccasions = () => {
    queryClient.invalidateQueries({
      queryKey: ["catalogOccasions"],
    });
  };

  // ========================================
  // SEARCH NAVIGATION TO SHOP
  // ========================================

  const searchShop = (event) => {
    event.preventDefault();

    const value = search.trim();

    if (!value) {
      navigate("/shop");
      return;
    }

    navigate(`/shop?search=${encodeURIComponent(value)}`);
  };

  const handlePopularSearch = (value) => {
    setSearch(value);

    navigate(`/shop?search=${encodeURIComponent(value)}`);
  };

  // ========================================
  // JSX
  // ========================================

  return (
    <main className="min-h-screen bg-base-100 text-base-content">
      {/* ==================================== */}
      {/* HERO SECTION */}
      {/* ==================================== */}

      <section className="relative overflow-hidden bg-gradient-to-r from-primary via-primary to-[#471333] text-white">
        <div className="pointer-events-none absolute -right-20 -top-24 size-80 rounded-full bg-secondary/20 blur-3xl" />

        <div className="pointer-events-none absolute bottom-0 left-1/3 size-52 rounded-full bg-secondary/10 blur-3xl" />

        <div className="page-container relative py-12 sm:py-16 lg:py-20">
          <div className="grid items-center gap-8 lg:grid-cols-[1.4fr_0.8fr] lg:gap-14">
            {/* LEFT CONTENT */}
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-gold-soft">
                <Sparkles size={13} />

                {loadingCategories
                  ? "উপহার কালেকশন লোড হচ্ছে"
                  : `${formatProductCount(categories.length)}টি উপহার কালেকশন`}
              </span>

              <h1 className="mt-4 max-w-2xl text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
                ক্যাটাগরি অনুযায়ী{" "}
                <span className="text-gold-soft">অনন্য উপহার খুঁজুন</span>
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/80 sm:text-base">
                প্রতিটি সম্পর্কের অনুভূতি ও প্রতিটি বিশেষ মুহূর্তের জন্য আমাদের
                যত্নে নির্বাচিত উপহার। আপনার প্রিয়জনের জন্য উপযুক্ত ক্যাটাগরি
                বেছে নিন।
              </p>
            </div>

            {/* RIGHT SEARCH */}
            <div className="w-full">
              <label
                htmlFor="gift-category-search"
                className="mb-3 block text-sm font-bold text-gold-soft"
              >
                ক্যাটাগরি বা উপহার নির্বাচন করুন
              </label>

              <form
                onSubmit={searchShop}
                className="flex items-center gap-2 rounded-full bg-white p-1.5 shadow-lg"
              >
                <input
                  id="gift-category-search"
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="যেমন: photo, jonmodin, চকলেট..."
                  className="min-w-0 flex-1 bg-transparent px-4 py-2 text-sm text-primary outline-none placeholder:text-muted"
                />

                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    aria-label="সার্চ মুছুন"
                    className="text-muted hover:text-primary"
                  >
                    <X size={16} />
                  </button>
                )}

                <button
                  type="submit"
                  aria-label="উপহার খুঁজুন"
                  className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-gold-soft transition hover:bg-secondary"
                >
                  <Search size={18} />
                </button>
              </form>

              {/* POPULAR SEARCHES */}
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-white/70">
                <span>জনপ্রিয়:</span>

                {popularSearches.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handlePopularSearch(value)}
                    className="underline underline-offset-2 transition hover:text-gold-soft"
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================== */}
      {/* CATEGORY SECTION */}
      {/* ==================================== */}

      <section className="page-container section-padding">
        {/* HEADER */}
        <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold tracking-wide text-secondary">
              ক্যাটাগরি পছন্দ করুন
            </p>

            <h2 className="mt-1 text-2xl font-bold text-primary sm:text-3xl">
              মূল ক্যাটাগরি সমূহ
            </h2>
          </div>

          <p className="max-w-md text-xs leading-6 text-muted sm:text-sm">
            কাস্টমাইজড হাতে বানানো উপহার থেকে তৈরি গিফট কম্বো—সবই পাবেন আমাদের
            বিশেষ কালেকশনে।
          </p>
        </div>

        {/* CATEGORY CONTENT */}

        {loadingCategories ? (
          <CategorySkeleton />
        ) : categoryError ? (
          <EmptyState
            title="ক্যাটাগরি লোড করা যায়নি"
            description="সার্ভারের সাথে সংযোগে সমস্যা হয়েছে।"
            onRetry={refreshCategories}
          />
        ) : filteredCategories.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCategories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="কোনো ক্যাটাগরি পাওয়া যায়নি"
            description="অন্য নামে সার্চ করে দেখতে পারেন।"
            onRetry={search ? () => setSearch("") : undefined}
            buttonText="সব ক্যাটাগরি দেখুন"
          />
        )}
      </section>

      {/* ==================================== */}
      {/* OCCASION SECTION */}
      {/* ==================================== */}

      <section className="section-bg py-12 sm:py-16">
        <div className="page-container">
          {/* HEADER */}
          <div className="mb-8 text-center">
            <p className="text-xs font-bold text-secondary">উপলক্ষ অনুযায়ী</p>

            <h2 className="mt-2 text-2xl font-bold text-primary sm:text-3xl">
              উপলক্ষ অনুযায়ী উপহার
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-xs leading-6 text-muted sm:text-sm">
              প্রতিটি উপলক্ষের জন্য রয়েছে সুন্দর ও স্মরণীয় উপহারের বিশেষ
              কালেকশন।
            </p>
          </div>

          {/* OCCASION CONTENT */}

          {loadingOccasions ? (
            <OccasionSkeleton />
          ) : occasionError ? (
            <EmptyState
              title="উপলক্ষ লোড করা যায়নি"
              description="সার্ভারের সাথে সংযোগে সমস্যা হয়েছে।"
              onRetry={refreshOccasions}
            />
          ) : filteredOccasions.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
              {filteredOccasions.map((occasion, index) => (
                <OccasionCard
                  key={occasion.id}
                  occasion={occasion}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="কোনো উপলক্ষ পাওয়া যায়নি"
              description="অন্য নামে সার্চ করে দেখতে পারেন।"
              onRetry={search ? () => setSearch("") : undefined}
              buttonText="সব উপলক্ষ দেখুন"
            />
          )}
        </div>
      </section>
    </main>
  );
}
