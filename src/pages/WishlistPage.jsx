
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Gift,
  Heart,
  Headphones,
  MessageCircle,
  Package,
  Plus,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Star,
  Trash2,
  X,
} from "lucide-react";

// ============================================
// DEMO PRODUCTS
// Replace with actual wishlist / product data
// ============================================

const initialProducts = [
  {
    id: "gift-101",
    name: "রোমান্টিক কাঠের এনগ্রেভড ফটো ফ্রেম",
    description: "প্রিয় মুহূর্তকে স্মরণীয় করে রাখুন",
    image: "",
    category: "custom",
    categoryName: "কাস্টমাইজড",
    price: 1200,
    oldPrice: 1500,
    rating: 4.8,
    reviews: 86,
    customizable: true,
    badges: [
      { label: "বেস্টসেলার", type: "secondary" },
      { label: "২০% ছাড়", type: "discount" },
    ],
    addedAt: "2026-10-24",
  },
  {
    id: "gift-102",
    name: "গোল্ডেন ইসলামিক মিরর ও ক্যালিগ্রাফি ফ্রেম",
    description: "ঘরের সৌন্দর্যে ইসলামিক ঐতিহ্য",
    image: "",
    category: "islamic",
    categoryName: "ইসলামিক",
    price: 1750,
    oldPrice: 2000,
    rating: 4.9,
    reviews: 103,
    customizable: true,
    badges: [
      { label: "বিশেষ সংগ্রহ", type: "secondary" },
      { label: "১২% ছাড়", type: "discount" },
    ],
    addedAt: "2026-10-23",
  },
  {
    id: "gift-103",
    name: "চকলেট সারপ্রাইজ গিফট বক্স ও গোলাপ",
    description: "প্রিয়জনের জন্য মিষ্টি সারপ্রাইজ",
    image: "",
    category: "gift-box",
    categoryName: "গিফট বক্স",
    price: 2650,
    oldPrice: 3000,
    rating: 4.8,
    reviews: 142,
    customizable: false,
    badges: [
      { label: "প্রিমিয়াম উপহার", type: "secondary" },
    ],
    addedAt: "2026-10-22",
  },
  {
    id: "gift-104",
    name: "রয়েল পার্পল পার্সোনালাইজড গিফট বক্স",
    description: "আপনার পছন্দমতো নাম ও ডিজাইন",
    image: "",
    category: "gift-box",
    categoryName: "গিফট বক্স",
    price: 1850,
    oldPrice: 2200,
    rating: 4.9,
    reviews: 78,
    customizable: true,
    badges: [
      { label: "কাস্টম ডিজাইন", type: "secondary" },
    ],
    addedAt: "2026-10-21",
  },
];

// ============================================
// HELPERS
// ============================================

const formatPrice = (amount) =>
  `৳${Number(amount || 0).toLocaleString("bn-BD")}`;

const categories = [
  { value: "all", label: "সব পছন্দ" },
  { value: "custom", label: "কাস্টমাইজড" },
  { value: "islamic", label: "ইসলামিক" },
  { value: "gift-box", label: "গিফট বক্স" },
];

const collections = [
  {
    id: "anniversary",
    name: "আমার বিবাহবার্ষিকী ২০২৫",
    description: "পছন্দের বিশেষ উপহার",
    icon: Heart,
    count: 12,
    type: "pink",
  },
  {
    id: "birthday",
    name: "বাবার ৬০তম জন্মদিন",
    description: "বাবার জন্য উপহারের পরিকল্পনা",
    icon: Gift,
    count: 8,
    type: "gold",
  },
];

// ============================================
// MAIN COMPONENT
// ============================================

export default function WishlistPage() {
  const [products, setProducts] = useState(initialProducts);

  const [category, setCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [addingId, setAddingId] = useState(null);

  // ===========================================
  // FILTER & SORT
  // ===========================================

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (category !== "all") {
      result = result.filter(
        (product) => product.category === category
      );
    }

    if (search.trim()) {
      const keyword = search.trim().toLowerCase();

      result = result.filter(
        (product) =>
          product.name.toLowerCase().includes(keyword) ||
          product.description
            .toLowerCase()
            .includes(keyword)
      );
    }

    if (sortBy === "newest") {
      result.sort(
        (a, b) =>
          new Date(b.addedAt) - new Date(a.addedAt)
      );
    }

    if (sortBy === "oldest") {
      result.sort(
        (a, b) =>
          new Date(a.addedAt) - new Date(b.addedAt)
      );
    }

    if (sortBy === "price-low") {
      result.sort((a, b) => a.price - b.price);
    }

    if (sortBy === "price-high") {
      result.sort((a, b) => b.price - a.price);
    }

    if (sortBy === "rating") {
      result.sort((a, b) => b.rating - a.rating);
    }

    return result;
  }, [products, category, search, sortBy]);

  // ===========================================
  // REMOVE FAVORITE
  // ===========================================

  const removeFavorite = (id) => {
    setProducts((prev) =>
      prev.filter((product) => product.id !== id)
    );
  };

  // ===========================================
  // ADD TO CART
  // ===========================================

  const handleAddToCart = async (product) => {
    setAddingId(product.id);

    try {
      // Replace with actual Cart Context / API
      console.log("Add to cart:", product);

      // Demo only - no real cart persistence yet.
    } finally {
      setAddingId(null);
    }
  };

  // ===========================================
  // UI
  // ===========================================

  return (
    <main className="min-h-screen bg-base-200/60 py-6 text-base-content sm:py-10">
      <div className="page-container">

        {/* ===================================== */}
        {/* BREADCRUMB */}
        {/* ===================================== */}

        <nav className="mb-5 flex flex-wrap items-center gap-2 text-xs text-muted">
          <Link to="/" className="hover:text-secondary">
            হোম
          </Link>

          <span>›</span>

          <span className="font-semibold text-primary">
            আমার পছন্দের তালিকা
          </span>
        </nav>

        {/* ===================================== */}
        {/* WISHLIST HERO */}
        {/* ===================================== */}

        <section className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-secondary to-secondary/70 p-5 text-white sm:p-7">

          {/* Decorative Blob */}
          <div className="pointer-events-none absolute -right-10 -top-16 size-52 rounded-full bg-white/10 blur-2xl" />

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

            <div className="max-w-xl">

              <div className="flex flex-wrap items-center gap-2">

                <h1 className="text-2xl font-extrabold sm:text-3xl">
                  আমার পছন্দের তালিকা
                </h1>

                <span className="badge-gold">
                  <Heart size={12} />
                  {products.length} টি উপহার সংরক্ষিত
                </span>
              </div>

              <p className="mt-3 text-xs leading-6 text-white/80 sm:text-sm">
                আপনার প্রিয় উপহারগুলো এক জায়গায় রাখুন।
                যেকোনো সময় কার্টে যোগ করুন অথবা
                প্রিয়জনের জন্য নতুন পরিকল্পনা তৈরি করুন।
              </p>
            </div>

            <div className="flex flex-wrap gap-2">

              <Link
                to="/shop"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white px-4 py-2.5 text-xs font-semibold text-primary transition hover:bg-base-200 sm:text-sm"
              >
                <ArrowRight size={15} />
                আরও উপহার দেখুন
              </Link>

              <Link
                to="/cart"
                className="btn-gold rounded-xl px-4 py-2.5 text-xs sm:text-sm"
              >
                <ShoppingBag size={15} />
                শপিং কার্টে যান
              </Link>
            </div>
          </div>
        </section>

        {/* ===================================== */}
        {/* FILTER BAR */}
        {/* ===================================== */}

        <section className="section-card mb-5 p-3 sm:p-4">

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

            {/* Categories */}
            <div className="flex min-w-0 items-center gap-2 overflow-x-auto pb-1 lg:pb-0">

              {categories.map((item) => {
                const count =
                  item.value === "all"
                    ? products.length
                    : products.filter(
                        (p) =>
                          p.category === item.value
                      ).length;

                const active =
                  category === item.value;

                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setCategory(item.value)}
                    className={`shrink-0 rounded-full px-3 py-2 text-xs font-semibold transition ${
                      active
                        ? "bg-primary text-white"
                        : "bg-base-200 text-muted hover:bg-secondary/10 hover:text-secondary"
                    }`}
                  >
                    {item.label} ({count})
                  </button>
                );
              })}
            </div>

            {/* Tools */}
            <div className="flex items-center gap-2">

              {/* Search Toggle */}
              <button
                type="button"
                onClick={() =>
                  setShowSearch(!showSearch)
                }
                aria-label="উপহার খুঁজুন"
                className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-base-300 bg-white text-secondary transition hover:bg-secondary/5"
              >
                {showSearch ? (
                  <X size={17} />
                ) : (
                  <Search size={17} />
                )}
              </button>

              {/* Sort */}
              <div className="relative flex-1 lg:w-48">

                <SlidersHorizontal
                  size={15}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-secondary"
                />

                <select
                  value={sortBy}
                  onChange={(event) =>
                    setSortBy(event.target.value)
                  }
                  className="select h-10 w-full rounded-xl border-base-300 bg-white pl-9 text-xs text-primary focus:border-secondary focus:outline-none"
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

                  <option value="rating">
                    সর্বোচ্চ রেটিং
                  </option>
                </select>
              </div>
            </div>
          </div>

          {/* Search Field */}
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
                  setSearch(event.target.value)
                }
                placeholder="পছন্দের উপহার খুঁজুন..."
                className="input h-11 w-full rounded-xl border-base-300 bg-base-200/50 pl-10 text-sm focus:border-secondary focus:outline-none"
              />
            </div>
          )}
        </section>

        {/* ===================================== */}
        {/* PRODUCT GRID */}
        {/* ===================================== */}

        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">

            {filteredProducts.map((product) => (
              <article
                key={product.id}
                className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-base-300/80 bg-base-100 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
              >

                {/* Product Image */}
                <div className="relative aspect-square overflow-hidden bg-base-200">

                  <Link
                    to={`/shop/${product.id}`}
                    className="block h-full w-full"
                    aria-label={`${product.name} দেখুন`}
                  >
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-secondary/40">
                        <Gift size={42} />
                      </div>
                    )}
                  </Link>

                  {/* Badges */}
                  <div className="absolute left-2 top-2 flex max-w-[75%] flex-wrap gap-1">

                    {product.badges
                      .slice(0, 2)
                      .map((badge) => (
                        <span
                          key={badge.label}
                          className={
                            badge.type ===
                            "discount"
                              ? "badge-gold px-2 py-1 text-[10px] shadow-sm sm:text-xs"
                              : "badge-soft bg-secondary px-2 py-1 text-[10px] text-white shadow-sm sm:text-xs"
                          }
                        >
                          {badge.label}
                        </span>
                      ))}
                  </div>

                  {/* Remove Favorite */}
                  <button
                    type="button"
                    onClick={() =>
                      removeFavorite(product.id)
                    }
                    aria-label="পছন্দের তালিকা থেকে সরান"
                    className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-white/95 text-rose-500 shadow-sm transition hover:scale-110"
                  >
                    <Heart
                      size={16}
                      className="fill-rose-500"
                    />
                  </button>
                </div>

                {/* Product Details */}
                <div className="flex flex-1 flex-col p-3 sm:p-4">

                  {/* Rating */}
                  <div className="flex items-center gap-1 text-xs">
                    <Star
                      size={13}
                      className="fill-amber-400 text-amber-500"
                    />

                    <span className="font-semibold text-primary">
                      {product.rating.toFixed(1)}
                    </span>

                    <span className="truncate text-muted">
                      ({product.reviews} রিভিউ)
                    </span>
                  </div>

                  {/* Name */}
                  <Link
                    to={`/shop/${product.id}`}
                    className="mt-2 line-clamp-2 text-sm font-bold leading-5 text-primary transition hover:text-secondary sm:text-base"
                  >
                    {product.name}
                  </Link>

                  {/* Description */}
                  <p className="mt-1 line-clamp-1 text-xs text-muted">
                    {product.description}
                  </p>

                  {/* Price */}
                  <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">

                    <span className="text-base font-bold text-primary sm:text-lg">
                      {formatPrice(product.price)}
                    </span>

                    {product.oldPrice >
                      product.price && (
                      <span className="text-xs text-muted line-through">
                        {formatPrice(
                          product.oldPrice
                        )}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-auto flex flex-col gap-2 pt-4">

                    <button
                      type="button"
                      onClick={() =>
                        handleAddToCart(product)
                      }
                      disabled={
                        addingId === product.id
                      }
                      className="btn-brand w-full rounded-xl px-2 py-2.5 text-xs sm:text-sm"
                    >
                      <ShoppingBag size={15} />

                      {addingId === product.id
                        ? "যোগ হচ্ছে..."
                        : "কার্টে যোগ করুন"}
                    </button>

                    {product.customizable && (
                      <Link
                        to={`/gift-box?product=${product.id}`}
                        className="btn-outline-brand w-full rounded-xl px-2 py-2 text-xs sm:text-sm"
                      >
                        <Sparkles size={14} />
                        কাস্টমাইজ অর্ডার
                      </Link>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          /* =================================== */
          /* EMPTY STATE */
          /* =================================== */

          <div className="section-card py-16 text-center">

            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-secondary/10 text-secondary">
              <Heart size={30} />
            </div>

            <h2 className="mt-4 text-lg font-bold text-primary">
              কোনো পছন্দের উপহার পাওয়া যায়নি
            </h2>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">
              নতুন উপহার পছন্দের তালিকায় যোগ করুন
              অথবা আপনার ফিল্টার পরিবর্তন করুন।
            </p>

            <Link
              to="/shop"
              className="btn-brand mt-5 rounded-xl"
            >
              উপহার দেখুন
              <ArrowRight size={16} />
            </Link>
          </div>
        )}

        {/* ===================================== */}
        {/* COLLECTIONS */}
        {/* ===================================== */}

        <section className="mt-10 hidden">

          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">

            <div>
              <h2 className="text-lg font-extrabold text-primary sm:text-xl">
                আপনার নিজস্ব কালেকশন ও ইভেন্ট
              </h2>

              <p className="mt-1 text-xs text-muted">
                আপনার পছন্দের উপহারগুলো আলাদা
                ইভেন্ট অনুযায়ী সাজিয়ে রাখুন।
              </p>
            </div>

            <button
              type="button"
              className="badge-soft"
              onClick={() =>
                alert(
                  "Collection creation feature coming soon."
                )
              }
            >
              <Plus size={14} />
              নতুন কালেকশন
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

            {collections.map((collection) => {
              const Icon = collection.icon;

              return (
                <div
                  key={collection.id}
                  className="section-card p-5"
                >

                  <div className="flex items-start justify-between gap-3">

                    <span
                      className={`flex size-11 items-center justify-center rounded-xl ${
                        collection.type === "pink"
                          ? "bg-pink-100 text-pink-600"
                          : "bg-gold-soft/40 text-primary"
                      }`}
                    >
                      <Icon size={20} />
                    </span>

                    <span className="badge-soft">
                      {collection.count} টি উপহার
                    </span>
                  </div>

                  <h3 className="mt-4 text-sm font-bold text-primary">
                    {collection.name}
                  </h3>

                  <p className="mt-1 text-xs text-muted">
                    {collection.description}
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      alert(
                        "Collection details feature coming soon."
                      )
                    }
                    className="mt-5 flex w-full items-center justify-between border-t border-base-300 pt-3 text-xs font-semibold text-secondary"
                  >
                    কালেকশন দেখুন
                    <ArrowRight size={15} />
                  </button>
                </div>
              );
            })}

            {/* New Collection Card */}
            <button
              type="button"
              onClick={() =>
                alert(
                  "Collection creation feature coming soon."
                )
              }
              className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-secondary/30 bg-secondary/5 p-5 text-center transition hover:bg-secondary/10"
            >
              <span className="flex size-11 items-center justify-center rounded-full bg-white text-secondary shadow-sm">
                <Plus size={22} />
              </span>

              <h3 className="mt-4 text-sm font-bold text-primary">
                নতুন কালেকশন তৈরি করুন
              </h3>

              <p className="mt-1 text-xs text-muted">
                জন্মদিন, বিয়ে কিংবা যেকোনো বিশেষ দিন
              </p>
            </button>
          </div>
        </section>

        {/* ===================================== */}
        {/* SUPPORT BANNER */}
        {/* ===================================== */}

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
                উপহার নির্বাচনে নিয়ে দ্বিধায় ভুগছেন?
              </h3>

              <p className="mt-2 max-w-xl text-xs leading-6 text-white/70">
                আপনার বাজেট, পছন্দ ও উপলক্ষ অনুযায়ী
                সেরা উপহার বেছে নিতে আমাদের সঙ্গে
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
