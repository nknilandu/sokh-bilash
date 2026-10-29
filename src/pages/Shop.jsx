import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Search,
  SlidersHorizontal,
  X,
  Heart,
  Star,
  ChevronDown,
  RotateCcw,
  Gift,
  ArrowUpDown,
  ArrowRight,
  Sparkles,
} from "lucide-react";

const products = [
  {
    id: "gift-1",
    name: "কাপল ফটো ফ্রেম — চিরদিনের স্মৃতি",
    description: "প্রিয় মুহূর্তকে স্মরণীয় করে রাখুন",
    category: "ফটোফ্রেম",
    occasion: "বার্ষিকী",
    giftType: "কাস্টমাইজেবল",
    price: 1200,
    oldPrice: 1500,
    rating: 4.8,
    reviews: 126,
    image:
      "https://images.unsplash.com/photo-1511988617509-a57c8a288659?auto=format&fit=crop&w=700&q=80",
    badges: [{ label: "হট ডিল -২০%", type: "discount" }],
    customizable: true,
  },
  {
    id: "gift-2",
    name: "এলিগ্যান্ট ইসলামিক ক্যালিগ্রাফি",
    description: "ঘরের সাজে নান্দনিক ছোঁয়া",
    category: "ওয়াল ডেকর",
    occasion: "গৃহপ্রবেশ",
    giftType: "প্রিমিয়াম",
    price: 1750,
    oldPrice: 2000,
    rating: 5.0,
    reviews: 82,
    image:
      "https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?auto=format&fit=crop&w=700&q=80",
    badges: [{ label: "বেস্টসেলার", type: "normal" }],
    customizable: false,
  },
  {
    id: "gift-3",
    name: "প্রিমিয়াম চকলেট ও রোজ গিফট বক্স",
    description: "ভালোবাসার মানুষের জন্য বিশেষ উপহার",
    category: "গিফট বক্স",
    occasion: "জন্মদিন",
    giftType: "প্রিমিয়াম",
    price: 1650,
    oldPrice: 1900,
    rating: 4.8,
    reviews: 95,
    image:
      "https://images.unsplash.com/photo-1511381939415-e44015466834?auto=format&fit=crop&w=700&q=80",
    badges: [{ label: "প্রিমিয়াম কালেকশন", type: "normal" }],
    customizable: false,
  },
  {
    id: "gift-4",
    name: "কাপল ওয়াচ — ম্যাচিং সেট",
    description: "দুজনের জন্য মানানসই উপহার",
    category: "ঘড়ি",
    occasion: "বার্ষিকী",
    giftType: "কাপল গিফট",
    price: 2300,
    oldPrice: 2800,
    rating: 4.7,
    reviews: 73,
    image:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=700&q=80",
    badges: [{ label: "কাপল কালেকশন", type: "normal" }],
    customizable: false,
  },
  {
    id: "gift-5",
    name: "ইসলামিক ওয়াল আর্ট",
    description: "রুচিশীল ঘর সাজানোর উপহার",
    category: "ওয়াল ডেকর",
    occasion: "গৃহপ্রবেশ",
    giftType: "হোম ডেকর",
    price: 1450,
    oldPrice: 1700,
    rating: 4.8,
    reviews: 112,
    image:
      "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=700&q=80",
    badges: [{ label: "জনপ্রিয় পছন্দ", type: "normal" }],
    customizable: false,
  },
  {
    id: "gift-6",
    name: "কাস্টম ফটো মগ ও গিফট সেট",
    description: "নিজের ছবিতে তৈরি ব্যক্তিগত উপহার",
    category: "কাস্টমাইজড গিফট",
    occasion: "জন্মদিন",
    giftType: "কাস্টমাইজেবল",
    price: 650,
    oldPrice: 800,
    rating: 4.9,
    reviews: 208,
    image:
      "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=700&q=80",
    badges: [{ label: "কাস্টম গিফট", type: "normal" }],
    customizable: true,
  },
];

const categories = [
  "ফটোফ্রেম",
  "ঘড়ি",
  "গিফট বক্স",
  "ওয়াল ডেকর",
  "কাস্টমাইজড গিফট",
];

const occasions = [
  "জন্মদিন",
  "বার্ষিকী",
  "বিবাহবার্ষিকী",
  "বিয়ে",
  "গৃহপ্রবেশ",
  "বাবা-মা",
];

const giftTypes = ["কাস্টমাইজেবল", "প্রিমিয়াম", "কাপল গিফট", "হোম ডেকর"];

const formatPrice = (price) => `৳${Number(price).toLocaleString("en-US")}`;

const initialFilters = {
  categories: [],
  occasions: [],
  giftTypes: [],
  minPrice: 0,
  maxPrice: 5000,
  rating: 0,
};

function FilterSection({ title, children }) {
  const [open, setOpen] = useState(true);

  return (
    <section className="border-b border-base-300/70 py-4 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between text-sm font-bold text-primary"
      >
        {title}
        <ChevronDown
          size={16}
          className={`transition-transform ${open ? "" : "-rotate-90"}`}
        />
      </button>

      {open && <div className="mt-3 space-y-2.5">{children}</div>}
    </section>
  );
}

function FilterCheckbox({ label, checked, onChange, count }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-base-content/80 hover:text-secondary">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="checkbox checkbox-sm checkbox-secondary rounded"
      />
      <span className="min-w-0 flex-1">{label}</span>
      {count !== undefined && (
        <span className="rounded-full bg-secondary/10 px-2 py-0.5 text-[10px] text-secondary">
          {count}
        </span>
      )}
    </label>
  );
}

export default function Shop() {
  const location = useLocation();
  const searchInputRef = useRef(null);

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("featured");
  const [filters, setFilters] = useState(initialFilters);
  const [favorites, setFavorites] = useState([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 12;

  // Focus search input when coming from Navbar
  useEffect(() => {
    if (!location.state?.focusSearch) return;

    const frame = requestAnimationFrame(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus({
          preventScroll: true,
        });

        searchInputRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    });

    return () => cancelAnimationFrame(frame);
  }, [location.key, location.state?.focusSearch]);

  // Keep the rest of your Shop code unchanged

  const updateFilter = (key, value) => {
    setFilters((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const toggleArrayFilter = (key, value) => {
    setFilters((previous) => ({
      ...previous,
      [key]: previous[key].includes(value)
        ? previous[key].filter((item) => item !== value)
        : [...previous[key], value],
    }));
  };

  const clearFilters = () => {
    setFilters(initialFilters);
    setSearch("");
    setSort("featured");
  };

  const activeFilterCount =
    filters.categories.length +
    filters.occasions.length +
    filters.giftTypes.length +
    (filters.rating > 0 ? 1 : 0) +
    (filters.minPrice > 0 || filters.maxPrice < 5000 ? 1 : 0);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    const result = products.filter((product) => {
      const matchesSearch =
        !query ||
        [
          product.name,
          product.description,
          product.category,
          product.occasion,
          product.giftType,
        ].some((value) => value.toLowerCase().includes(query));

      const matchesCategory =
        filters.categories.length === 0 ||
        filters.categories.includes(product.category);

      const matchesOccasion =
        filters.occasions.length === 0 ||
        filters.occasions.includes(product.occasion);

      const matchesGiftType =
        filters.giftTypes.length === 0 ||
        filters.giftTypes.includes(product.giftType);

      const matchesPrice =
        product.price >= filters.minPrice && product.price <= filters.maxPrice;

      const matchesRating = product.rating >= filters.rating;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesOccasion &&
        matchesGiftType &&
        matchesPrice &&
        matchesRating
      );
    });

    if (sort === "price-low") {
      result.sort((a, b) => a.price - b.price);
    } else if (sort === "price-high") {
      result.sort((a, b) => b.price - a.price);
    } else if (sort === "rating") {
      result.sort((a, b) => b.rating - a.rating);
    }

    return result;
  }, [search, filters, sort]);

  const toggleFavorite = (id) => {
    setFavorites((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id],
    );
  };

  const FilterContent = (
    <div className="space-y-0">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-bold text-primary">
          <SlidersHorizontal size={17} />
          ফিল্টারসমূহ
        </h2>

        <button
          type="button"
          onClick={clearFilters}
          className="flex items-center gap-1 text-xs font-medium text-secondary hover:text-primary"
        >
          <RotateCcw size={13} />
          রিসেট
        </button>
      </div>

      <FilterSection title="ক্যাটাগরি">
        {categories.map((category) => (
          <FilterCheckbox
            key={category}
            label={category}
            checked={filters.categories.includes(category)}
            onChange={() => toggleArrayFilter("categories", category)}
            count={products.filter((p) => p.category === category).length}
          />
        ))}
      </FilterSection>

      <FilterSection title="বাজেট (৳)">
        <div className="flex items-center gap-2">
          <label className="min-w-0 flex-1">
            <span className="mb-1 block text-xs text-muted">সর্বনিম্ন</span>
            <input
              type="number"
              min="0"
              max={filters.maxPrice}
              value={filters.minPrice}
              onChange={(event) =>
                updateFilter(
                  "minPrice",
                  Math.max(
                    0,
                    Math.min(Number(event.target.value) || 0, filters.maxPrice),
                  ),
                )
              }
              className="input input-bordered input-sm w-full rounded-lg"
            />
          </label>

          <label className="min-w-0 flex-1">
            <span className="mb-1 block text-xs text-muted">সর্বোচ্চ</span>
            <input
              type="number"
              min={filters.minPrice}
              value={filters.maxPrice}
              onChange={(event) =>
                updateFilter(
                  "maxPrice",
                  Math.max(filters.minPrice, Number(event.target.value) || 0),
                )
              }
              className="input input-bordered input-sm w-full rounded-lg"
            />
          </label>
        </div>

        <input
          type="range"
          min="500"
          max="5000"
          step="100"
          value={Math.min(filters.maxPrice, 5000)}
          onChange={(event) =>
            updateFilter("maxPrice", Number(event.target.value))
          }
          aria-label="সর্বোচ্চ বাজেট"
          className="range range-secondary range-xs mt-2"
        />

        <div className="flex justify-between text-xs text-muted">
          <span>৳৫০০</span>
          <span>৳৫,০০০+</span>
        </div>
      </FilterSection>

      <FilterSection title="উপলক্ষ (Occasion)">
        {occasions.map((occasion) => (
          <FilterCheckbox
            key={occasion}
            label={occasion}
            checked={filters.occasions.includes(occasion)}
            onChange={() => toggleArrayFilter("occasions", occasion)}
          />
        ))}
      </FilterSection>

      <FilterSection title="বিশেষ বৈশিষ্ট্য">
        {giftTypes.map((type) => (
          <FilterCheckbox
            key={type}
            label={type}
            checked={filters.giftTypes.includes(type)}
            onChange={() => toggleArrayFilter("giftTypes", type)}
          />
        ))}
      </FilterSection>

      <FilterSection title="গ্রাহক রেটিং">
        {[4, 3, 2, 1].map((rating) => (
          <label
            key={rating}
            className="flex cursor-pointer items-center gap-2 text-sm"
          >
            <input
              type="radio"
              name="rating"
              checked={filters.rating === rating}
              onChange={() => updateFilter("rating", rating)}
              className="radio radio-secondary radio-sm"
            />
            <span className="flex items-center gap-1 text-amber-500">
              {"★".repeat(rating)}
              <span className="text-muted"> ও তার বেশি</span>
            </span>
          </label>
        ))}

        <button
          type="button"
          onClick={() => updateFilter("rating", 0)}
          className="text-xs text-secondary hover:underline"
        >
          সব রেটিং
        </button>
      </FilterSection>

      <button
        type="button"
        onClick={() => setFilterOpen(false)}
        className="btn-brand mt-4 w-full lg:hidden"
      >
        {filteredProducts.length}টি পণ্য দেখুন
      </button>
    </div>
  );

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * productsPerPage,
    currentPage * productsPerPage,
  );

  return (
    <main className="page-bg min-h-screen">
      <div className="page-container py-6 sm:py-8">
        {/* Breadcrumb */}
        <nav className="mb-5 text-xs text-muted sm:text-sm">
          <Link to="/" className="hover:text-secondary">
            হোম
          </Link>
          <span className="mx-2">/</span>
          <span className="font-semibold text-primary">সব উপহার</span>
        </nav>

        {/* Page heading */}
        <div className="mb-6">
          <span className="badge-soft mb-3">
            <Gift size={13} />
            SokhBilash Gift Collection
          </span>

          <h1 className="text-2xl font-extrabold text-primary sm:text-3xl">
            পছন্দের উপহার খুঁজে নিন
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted sm:text-base">
            প্রিয় মানুষের বিশেষ মুহূর্তকে আরও সুন্দর করে তুলুন আমাদের বাছাই করা
            উপহারের সংগ্রহ দিয়ে।
          </p>
        </div>

        {/* Search */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row">
          <label className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl border border-base-300 bg-base-100 px-4 shadow-sm transition focus-within:border-secondary focus-within:ring-2 focus-within:ring-secondary/10">
            <Search size={19} className="shrink-0 text-secondary" />

            <input
              ref={searchInputRef}
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="উপহারের নাম, ক্যাটাগরি বা উপলক্ষ দিয়ে খুঁজুন..."
              aria-label="উপহার খুঁজুন"
              className="h-12 min-w-0 flex-1 bg-transparent text-sm text-primary outline-none placeholder:text-muted"
            />

            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  searchInputRef.current?.focus();
                }}
                aria-label="সার্চ মুছুন"
                className="rounded-full p-1 text-muted hover:bg-base-200"
              >
                <X size={16} />
              </button>
            )}
          </label>

          <button
            type="button"
            onClick={() => setFilterOpen(true)}
            className="btn-outline-brand relative w-full rounded-2xl px-4 py-3 sm:w-auto lg:hidden"
          >
            <SlidersHorizontal size={17} />
            ফিল্টার
            {activeFilterCount > 0 && (
              <span className="flex size-5 items-center justify-center rounded-full bg-gold-soft text-xs text-primary">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Main layout */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[250px_minmax(0,1fr)] xl:grid-cols-[270px_minmax(0,1fr)]">
          {/* Desktop filters */}
          <aside className="hidden h-fit rounded-2xl border border-base-300/80 bg-base-100 p-4 shadow-sm lg:sticky lg:top-24 lg:block">
            {FilterContent}
          </aside>

          {/* Products area */}
          <section className="min-w-0">
            {/* Result count + sorting */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-primary">
                  সব উপহার
                  <span className="ml-2 font-normal text-muted">
                    ({filteredProducts.length}টি পণ্য)
                  </span>
                </p>

                {search && (
                  <p className="mt-1 text-xs text-muted">“{search}” এর ফলাফল</p>
                )}
              </div>

              <label className="flex items-center gap-2 rounded-xl border border-base-300 bg-base-100 px-3">
                <ArrowUpDown size={15} className="shrink-0 text-secondary" />
                <span className="hidden text-xs text-muted sm:inline">
                  সাজান:
                </span>
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value)}
                  className="select select-ghost select-sm max-w-40 text-xs font-medium text-primary focus:outline-none"
                  aria-label="পণ্য সাজান"
                >
                  <option value="featured">জনপ্রিয়</option>
                  <option value="price-low">দাম: কম থেকে বেশি</option>
                  <option value="price-high">দাম: বেশি থেকে কম</option>
                  <option value="rating">সর্বোচ্চ রেটিং</option>
                </select>
              </label>
            </div>

            {/* Active filter chips */}
            {(activeFilterCount > 0 || search) && (
              <div className="mb-4 flex flex-wrap items-center gap-2">
                {[
                  ...filters.categories,
                  ...filters.occasions,
                  ...filters.giftTypes,
                ].map((item) => (
                  <span key={item} className="badge-soft gap-1.5 py-1.5">
                    {item}
                    <button
                      type="button"
                      onClick={() => {
                        if (filters.categories.includes(item)) {
                          toggleArrayFilter("categories", item);
                        } else if (filters.occasions.includes(item)) {
                          toggleArrayFilter("occasions", item);
                        } else {
                          toggleArrayFilter("giftTypes", item);
                        }
                      }}
                      aria-label={`${item} ফিল্টার সরান`}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}

                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs font-semibold text-secondary hover:underline"
                >
                  সব মুছুন
                </button>
              </div>
            )}

            {/* Product grid */}
            {filteredProducts.length > 0 ? (
              <>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
                  {filteredProducts.map((product) => (
                    <article
                      key={product.id}
                      className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-base-300/80 bg-base-100 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                    >
                      {/* Image */}
                      <div className="relative aspect-square overflow-hidden bg-base-200">
                        <Link
                          to={`/shop/${product.id}`}
                          aria-label={`${product.name} দেখুন`}
                          className="block h-full w-full"
                        >
                          <img
                            src={product.image}
                            alt={product.name}
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            onError={(event) => {
                              event.currentTarget.style.visibility = "hidden";
                            }}
                          />
                        </Link>

                        <div className="absolute left-2 top-2 flex max-w-[78%] flex-wrap gap-1">
                          {product.badges.slice(0, 2).map((badge) => (
                            <span
                              key={badge.label}
                              className={
                                badge.type === "discount"
                                  ? "badge-gold px-2 py-1 text-[9px] shadow-sm sm:text-[10px]"
                                  : "badge-soft bg-secondary px-2 py-1 text-[9px] text-white shadow-sm sm:text-[10px]"
                              }
                            >
                              {badge.label}
                            </span>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleFavorite(product.id)}
                          aria-label={
                            favorites.includes(product.id)
                              ? "পছন্দের তালিকা থেকে সরান"
                              : "পছন্দের তালিকায় যোগ করুন"
                          }
                          aria-pressed={favorites.includes(product.id)}
                          className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-white/95 text-primary shadow-sm transition hover:scale-110"
                        >
                          <Heart
                            size={16}
                            className={
                              favorites.includes(product.id)
                                ? "fill-rose-500 text-rose-500"
                                : ""
                            }
                          />
                        </button>
                      </div>

                      {/* Product info */}
                      <div className="flex flex-1 flex-col p-3 sm:p-4">
                        <div className="flex items-center gap-1 text-xs">
                          <Star
                            size={13}
                            className="fill-amber-400 text-amber-500"
                          />
                          <span className="font-semibold text-primary">
                            {product.rating.toFixed(1)}
                          </span>
                          <span className="truncate text-muted">
                            ({product.reviews})
                          </span>
                        </div>

                        <Link
                          to={`/shop/${product.id}`}
                          className="mt-2 line-clamp-2 text-sm font-bold leading-5 text-primary transition hover:text-secondary sm:text-base"
                        >
                          {product.name}
                        </Link>

                        <p className="mt-1 line-clamp-2 text-xs text-muted">
                          {product.description}
                        </p>

                        <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                          <span className="text-base font-bold text-primary sm:text-lg">
                            {formatPrice(product.price)}
                          </span>
                          {product.oldPrice > product.price && (
                            <span className="text-xs text-muted line-through">
                              {formatPrice(product.oldPrice)}
                            </span>
                          )}
                        </div>

                        <div className="mt-auto flex flex-col gap-2 pt-4">
                          <Link
                            to={`/shop/${product.id}`}
                            className="btn-brand w-full rounded-xl px-2 py-2.5 text-xs sm:text-sm"
                          >
                            বিস্তারিত দেখুন
                          </Link>

                          {product.customizable && (
                            <Link
                              to={`/gift-box?product=${product.id}`}
                              className="btn-outline-brand w-full rounded-xl px-2 py-2 text-xs sm:text-sm"
                            >
                              <Gift size={14} />
                              কাস্টমাইজ করুন
                            </Link>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>

                {/* Pagination */}
                {filteredProducts.length > 0 && (
                  <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-base-300/70 bg-base-100 px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-muted sm:text-sm">
                      {(currentPage - 1) * productsPerPage + 1}–
                      {Math.min(
                        currentPage * productsPerPage,
                        filteredProducts.length,
                      )}{" "}
                      টি পণ্য দেখানো হচ্ছে, মোট {filteredProducts.length} টি
                    </p>

                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((page) => page - 1)}
                        aria-label="আগের পৃষ্ঠা"
                        className="flex size-9 items-center justify-center rounded-lg border border-base-300 text-primary transition hover:bg-secondary hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        ‹
                      </button>

                      {Array.from(
                        { length: totalPages },
                        (_, index) => index + 1,
                      )
                        .filter(
                          (page) =>
                            page === 1 ||
                            page === totalPages ||
                            Math.abs(page - currentPage) <= 1,
                        )
                        .reduce((pages, page, index, array) => {
                          if (index > 0 && page - array[index - 1] > 1) {
                            pages.push("...");
                          }
                          pages.push(page);
                          return pages;
                        }, [])
                        .map((page, index) =>
                          page === "..." ? (
                            <span
                              key={`dots-${index}`}
                              className="px-1 text-muted"
                            >
                              ...
                            </span>
                          ) : (
                            <button
                              key={page}
                              type="button"
                              onClick={() => setCurrentPage(page)}
                              aria-current={
                                currentPage === page ? "page" : undefined
                              }
                              className={`flex size-9 items-center justify-center rounded-lg text-sm font-semibold transition ${
                                currentPage === page
                                  ? "bg-secondary text-white shadow-sm"
                                  : "bg-base-200 text-primary hover:bg-secondary/10"
                              }`}
                            >
                              {page}
                            </button>
                          ),
                        )}

                      <button
                        type="button"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage((page) => page + 1)}
                        aria-label="পরের পৃষ্ঠা"
                        className="flex size-9 items-center justify-center rounded-lg border border-base-300 text-primary transition hover:bg-secondary hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        ›
                      </button>
                    </div>
                  </div>
                )}

                {/* Custom Gift Banner */}
                <section className="relative mt-7 overflow-hidden rounded-2xl bg-gradient-to-r from-[#310039] via-[#76258a] to-[#4b174d] p-5 text-white shadow-md sm:mt-8 sm:p-7">
                  <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
                    {/* Icon */}
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-gold-soft">
                      <Gift size={26} />
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-gold-soft">
                        <Sparkles size={13} />
                        বড় কিছু গিফট করার
                      </span>

                      <h2 className="mt-1 text-lg font-extrabold leading-snug sm:text-xl">
                        আপনার নিজস্ব কোনো বিশেষ ভাবনা বা পরিকল্পনা আছে?
                      </h2>

                      <p className="mt-2 max-w-2xl text-xs leading-5 text-white/80 sm:text-sm">
                        নিজের পছন্দমতো রং নির্বাচন করুন, প্রিয় উপহারগুলো যোগ
                        করুন এবং ভালোবাসায় সাজিয়ে প্রিয় মানুষকে উপহার দিন।
                      </p>
                    </div>

                    {/* CTA */}
                    <Link
                      to="/gift-box"
                      className="btn-gold w-full shrink-0 rounded-full px-5 py-3 text-sm sm:w-auto"
                    >
                      গিফট বক্স ডিজাইন -এ যান
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                </section>
              </>
            ) : (
              <div className="section-card flex min-h-64 flex-col items-center justify-center px-5 py-12 text-center">
                <div className="icon-box mb-4">
                  <Search size={22} />
                </div>
                <h2 className="text-lg font-bold text-primary">
                  কোনো উপহার পাওয়া যায়নি
                </h2>
                <p className="mt-2 max-w-sm text-sm text-muted">
                  অন্য নামে সার্চ করো অথবা ফিল্টার পরিবর্তন করে দেখো।
                </p>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="btn-brand mt-5"
                >
                  <RotateCcw size={16} />
                  সব ফিল্টার মুছুন
                </button>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Mobile filter drawer */}
      {filterOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <button
            type="button"
            aria-label="ফিল্টার বন্ধ করুন"
            onClick={() => setFilterOpen(false)}
            className="absolute inset-0 bg-black/45"
          />

          <aside
            role="dialog"
            aria-modal="true"
            aria-label="পণ্য ফিল্টার"
            className="absolute inset-y-0 left-0 flex w-[min(88%,340px)] flex-col bg-base-100 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-base-300 px-4 py-4">
              <span className="font-bold text-primary">পণ্য ফিল্টার</span>
              <button
                type="button"
                onClick={() => setFilterOpen(false)}
                aria-label="বন্ধ করুন"
                className="rounded-full bg-base-200 p-2 text-primary"
              >
                <X size={19} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3">
              {FilterContent}
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}
