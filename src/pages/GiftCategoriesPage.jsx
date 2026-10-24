
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Baby,
  BookOpen,
  Cake,
  Gift,
  Heart,
  HeartHandshake,
  Search,
  Sparkles,
  UsersRound,
  X,
} from "lucide-react";

// ============================================
// CATEGORY DATA
// Replace images with your actual product images
// ============================================

const categories = [
  {
    id: "photo-frame",
    title: "ফটোফ্রেম ও মেমোরি কিপসেক",
    description:
      "স্মৃতি ধরে রাখার জন্য প্রিয় ফটোফ্রেম। ছবি ও ডিজাইন দিয়ে কাস্টমাইজ করুন।",
    image: "/images/categories/photo-frame.jpg",
    productCount: 148,
    startingPrice: 850,
    badges: ["১৪৮+ প্রোডাক্ট", "বেস্টসেলার"],
    tags: [
      "এনগ্রেভড ফ্রেম",
      "ফটো ফ্রেম",
      "কাস্টমাইজড",
      "কাপল গিফট",
    ],
    slug: "photo-frame",
  },
  {
    id: "nikah",
    title: "নিকাহ ও ওয়েডিং কালেকশন",
    description:
      "জীবনের সবচেয়ে সুন্দর বন্ধন। নিকাহ, বিবাহ ও বিশেষ দিনের স্মরণীয় উপহার।",
    image: "/images/categories/nikah.jpg",
    productCount: 82,
    startingPrice: 1450,
    badges: ["৮২+ প্রোডাক্ট", "বেস্টসেলার"],
    tags: [
      "ওয়েডিং গিফট",
      "নিকাহ ফ্রেম",
      "ইসলামিক",
      "কাস্টমাইজড",
    ],
    slug: "nikah-wedding",
  },
  {
    id: "luxury-gift",
    title: "লাক্সারি গিফট হ্যাম্পার",
    description:
      "পছন্দের উপহার সাজিয়ে প্রিয়জনকে চমকে দিন। খাবার, কার্ড ও পার্সোনালাইজড গিফট।",
    image: "/images/categories/luxury-gift.jpg",
    productCount: 56,
    startingPrice: 2200,
    badges: ["৫৬+ প্রোডাক্ট"],
    tags: [
      "চকলেট গিফট",
      "প্রিমিয়াম",
      "কাস্টমাইজড",
      "গিফট বক্স",
    ],
    slug: "luxury-gift",
  },
  {
    id: "couple",
    title: "পার্সোনালাইজড কাপল ও ঘড়ি",
    description:
      "যুগল ও প্রিয়জনের জন্য রোমান্টিক উপহার। নামসহ কাস্টমাইজ ও এনগ্রেভিং।",
    image: "/images/categories/couple-watch.jpg",
    productCount: 78,
    startingPrice: 1200,
    badges: ["৭৮+ প্রোডাক্ট"],
    tags: [
      "কাপল গিফট",
      "ঘড়ি",
      "নাম এনগ্রেভ",
      "কাস্টমাইজড",
    ],
    slug: "couple-gifts",
  },
  {
    id: "islamic",
    title: "ইসলামিক বরকত ও সাজসজ্জা",
    description:
      "পবিত্র স্মৃতি ও সুন্দর উপহার। আয়াতুল কুরসি, তাসবিহ ও ঘরের সাজ।",
    image: "/images/categories/islamic.jpg",
    productCount: 96,
    startingPrice: 950,
    badges: ["৯৬+ প্রোডাক্ট", "জনপ্রিয়"],
    tags: [
      "ইসলামিক ফ্রেম",
      "ক্যালিগ্রাফি",
      "তাসবিহ",
      "হোম ডেকর",
    ],
    slug: "islamic",
  },
  {
    id: "flowers",
    title: "চকলেট, কেক ও ফুল",
    description:
      "ভালোবাসা, রোমান্স ও মিষ্টি মুহূর্তের জন্য ফুল, চকলেট ও বিশেষ উপহার।",
    image: "/images/categories/flowers.jpg",
    productCount: 64,
    startingPrice: 1100,
    badges: ["৬৪+ প্রোডাক্ট"],
    tags: [
      "ফুলের তোড়া",
      "চকলেট",
      "কেক",
      "রোমান্টিক",
    ],
    slug: "flowers-chocolate",
  },
];

// ============================================
// OCCASIONS
// ============================================

const occasions = [
  {
    id: "birthday",
    title: "জন্মদিন",
    count: "৭২+ বিশেষ উপহার",
    icon: Cake,
    bg: "bg-pink-100",
    color: "text-pink-600",
  },
  {
    id: "anniversary",
    title: "বিবাহবার্ষিকী",
    count: "৪৫+ বিশেষ গিফট",
    icon: Heart,
    bg: "bg-fuchsia-100",
    color: "text-fuchsia-600",
  },
  {
    id: "wedding",
    title: "বিবাহ ও বিয়ে",
    count: "৬৮+ স্মরণীয় উপহার",
    icon: Sparkles,
    bg: "bg-gold-soft",
    color: "text-primary",
  },
  {
    id: "love",
    title: "কাপল ও প্রেম",
    count: "১২৮+ রোমান্টিক গিফট",
    icon: UsersRound,
    bg: "bg-secondary/10",
    color: "text-secondary",
  },
  {
    id: "islamic",
    title: "ইসলামিক বরকত",
    count: "৯৫+ আইটেম",
    icon: BookOpen,
    bg: "bg-fuchsia-100",
    color: "text-fuchsia-600",
  },
  {
    id: "parents",
    title: "বাবা-মা শ্রদ্ধা",
    count: "১০২+ বিশেষ উপহার",
    icon: HeartHandshake,
    bg: "bg-amber-100",
    color: "text-amber-700",
  },
];

const popularSearches = [
  "নিকাহ ফ্রেম",
  "কাপল গিফট",
  "কাস্টমাইজড",
];

const formatPrice = (value) =>
  `৳${Number(value).toLocaleString("bn-BD")}`;

// ============================================
// MAIN COMPONENT
// ============================================

export default function GiftCategoriesPage() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");

  const filteredCategories = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return categories;

    return categories.filter((category) => {
      const searchableText = [
        category.title,
        category.description,
        ...category.tags,
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(keyword);
    });
  }, [search]);

  const handleSearch = (event) => {
    event.preventDefault();

    const keyword = search.trim();

    if (!keyword) return;

    navigate(
      `/shop?search=${encodeURIComponent(keyword)}`
    );
  };

  const handlePopularSearch = (keyword) => {
    setSearch(keyword);

    navigate(
      `/shop?search=${encodeURIComponent(keyword)}`
    );
  };

  return (
    <main className="min-h-screen bg-base-100 text-base-content">

      {/* ===================================== */}
      {/* HERO SECTION */}
      {/* ===================================== */}

      <section className="relative overflow-hidden bg-gradient-to-r from-primary via-primary to-[#471333] text-white">

        {/* Decorative Effects */}
        <div className="pointer-events-none absolute -right-20 -top-24 size-80 rounded-full bg-secondary/20 blur-3xl" />

        <div className="pointer-events-none absolute bottom-0 left-1/3 size-52 rounded-full bg-secondary/10 blur-3xl" />

        <div className="page-container relative py-12 sm:py-16 lg:py-20">

          <div className="grid items-center gap-8 lg:grid-cols-[1.4fr_0.8fr] lg:gap-14">

            {/* LEFT CONTENT */}
            <div>

              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-gold-soft">
                <Sparkles size={13} />
                ৬টি উপহার কালেকশন
              </span>

              <h1 className="mt-4 max-w-2xl text-3xl font-extrabold leading-tight sm:text-4xl lg:text-5xl">
                ক্যাটাগরি অনুযায়ী{" "}
                <span className="text-gold-soft">
                  অনন্য উপহার খুঁজুন
                </span>
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/80 sm:text-base">
                প্রতিটি সম্পর্কের অনুভূতি ও প্রতিটি বিশেষ
                মুহূর্তের জন্য আমাদের যত্নে নির্বাচিত
                উপহার। আপনার প্রিয়জনের জন্য উপযুক্ত
                ক্যাটাগরি বেছে নিন।
              </p>
            </div>

            {/* RIGHT SEARCH */}
            <div className="w-full">

              <label className="mb-3 block text-sm font-bold text-gold-soft">
                ক্যাটাগরি বা উপহার নির্বাচন করুন
              </label>

              <form
                onSubmit={handleSearch}
                className="flex items-center gap-2 rounded-full bg-white p-1.5 shadow-lg"
              >

                <input
                  type="search"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="যেমন: ফ্রেম, নিকাহ গিফট, চকলেট..."
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

              {/* Popular Search */}
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-white/70">

                <span>জনপ্রিয়:</span>

                {popularSearches.map((keyword) => (
                  <button
                    key={keyword}
                    type="button"
                    onClick={() =>
                      handlePopularSearch(keyword)
                    }
                    className="underline underline-offset-2 transition hover:text-gold-soft"
                  >
                    {keyword}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================== */}
      {/* FEATURED CATEGORIES */}
      {/* ===================================== */}

      <section className="page-container section-padding">

        {/* Section Header */}
        <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

          <div>

            <p className="text-xs font-bold tracking-wide text-secondary">
              ক্যাটাগরি পছন্দ করুন
            </p>

            <h2 className="mt-1 text-2xl font-extrabold text-primary sm:text-3xl">
              মূল ক্যাটাগরি সমূহ
            </h2>
          </div>

          <p className="max-w-md text-xs leading-6 text-muted sm:text-sm">
            কাস্টমাইজড হাতে বানানো উপহার থেকে তৈরি
            গিফট কম্বো—সবই পাবেন আমাদের বিশেষ
            কালেকশনে।
          </p>
        </div>

        {/* Category Grid */}
        {filteredCategories.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

            {filteredCategories.map((category) => (
              <article
                key={category.id}
                className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-base-300/70 bg-base-100 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
              >

                {/* IMAGE */}
                <Link
                  to={`/shop?category=${encodeURIComponent(category.slug)}`}
                  className="relative block aspect-[1.55] overflow-hidden bg-base-200"
                >

                  <img
                    src={category.image}
                    alt={category.title}
                    loading="lazy"
                    className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(event) => {
                      event.currentTarget.style.display =
                        "none";
                    }}
                  />

                  {/* Badges */}
                  <div className="absolute left-3 top-3 flex max-w-[85%] flex-wrap gap-2">

                    {category.badges.map((badge, index) => (
                      <span
                        key={badge}
                        className={
                          index === 0
                            ? "badge-soft bg-secondary px-3 py-1 text-[10px] text-white shadow-sm"
                            : "badge-gold px-3 py-1 text-[10px] shadow-sm"
                        }
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                </Link>

                {/* CONTENT */}
                <div className="flex flex-1 flex-col p-4 sm:p-5">

                  <Link
                    to={`/shop?category=${encodeURIComponent(category.slug)}`}
                    className="flex items-start justify-between gap-3"
                  >

                    <h3 className="text-base font-extrabold leading-6 text-primary transition group-hover:text-secondary sm:text-lg">
                      {category.title}
                    </h3>

                    <ArrowRight
                      size={18}
                      className="mt-1 shrink-0 text-secondary transition-transform group-hover:translate-x-1"
                    />
                  </Link>

                  <p className="mt-2 line-clamp-2 text-xs leading-6 text-muted sm:text-sm">
                    {category.description}
                  </p>

                  {/* TAGS */}
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
                </div>

                {/* FOOTER */}
                <div className="mt-auto flex flex-wrap items-center justify-between gap-2 bg-secondary/5 px-4 py-3 sm:px-5">

                  <span className="text-xs text-muted">
                    শুরু:{" "}
                    <strong className="text-secondary">
                      {formatPrice(category.startingPrice)}
                      {" "}থেকে
                    </strong>
                  </span>

                  <Link
                    to={`/shop?category=${encodeURIComponent(category.slug)}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-secondary hover:text-primary"
                  >
                    উপহার দেখুন
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-base-300 bg-base-200/50 px-5 py-14 text-center">

            <Search
              size={32}
              className="mx-auto text-secondary"
            />

            <h3 className="mt-4 text-lg font-bold text-primary">
              কোনো ক্যাটাগরি পাওয়া যায়নি
            </h3>

            <p className="mt-2 text-sm text-muted">
              অন্য নামে সার্চ করে দেখতে পারেন।
            </p>

            <button
              type="button"
              onClick={() => setSearch("")}
              className="btn-outline-brand mt-5"
            >
              সব ক্যাটাগরি দেখুন
            </button>
          </div>
        )}
      </section>

      {/* ===================================== */}
      {/* OCCASION CATEGORIES */}
      {/* ===================================== */}

      <section className="section-bg py-12 sm:py-16">

        <div className="page-container">

          {/* Header */}
          <div className="mb-8 text-center">

            <p className="text-xs font-bold text-secondary">
              উপলক্ষ অনুযায়ী
            </p>

            <h2 className="mt-2 text-2xl font-extrabold text-primary sm:text-3xl">
              উপলক্ষ অনুযায়ী উপহার
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-xs leading-6 text-muted sm:text-sm">
              প্রতিটি উপলক্ষের জন্য রয়েছে সুন্দর
              ও স্মরণীয় উপহারের বিশেষ কালেকশন।
            </p>
          </div>

          {/* Occasion Grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">

            {occasions.map((occasion) => {
              const Icon = occasion.icon;

              return (
                <Link
                  key={occasion.id}
                  to={`/shop?occasion=${encodeURIComponent(occasion.id)}`}
                  className="group flex flex-col items-center rounded-2xl border border-base-300/60 bg-white p-4 text-center shadow-sm transition duration-300 hover:-translate-y-1 hover:border-secondary/30 hover:shadow-md sm:p-5"
                >

                  <div
                    className={`flex size-12 items-center justify-center rounded-2xl ${occasion.bg} ${occasion.color}`}
                  >
                    <Icon size={22} />
                  </div>

                  <h3 className="mt-4 text-sm font-bold text-primary group-hover:text-secondary">
                    {occasion.title}
                  </h3>

                  <p className="mt-1 text-[11px] text-muted">
                    {occasion.count}
                  </p>

                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-secondary">
                    কালেকশন দেখুন
                    <ArrowRight size={13} />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
