
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Link,
  useLocation,
} from "react-router-dom";

import { useQuery } from "@tanstack/react-query";

import {
  Search,
  SlidersHorizontal,
  X,
  ChevronDown,
  RotateCcw,
  Gift,
  ArrowUpDown,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import ProductCard from "../components/product/ProductCard";


// Adjust ProductCard import path to your project.

const API_URL = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:3000"
).replace(/\/$/, "");

const PRODUCTS_PER_PAGE = 12;

// =========================================
// FILTER OPTIONS
// =========================================

// Only use features that actually exist
// in the MongoDB product schema.

const featureOptions = [
  {
    id: "customizable",
    name: "কাস্টমাইজেবল",
  },
  {
    id: "featured",
    name: "ফিচার্ড প্রোডাক্ট",
  },
  {
    id: "discounted",
    name: "ছাড়যুক্ত প্রোডাক্ট",
  },
  {
    id: "variants",
    name: "ভ্যারিয়েন্ট আছে",
  },
];

const createInitialFilters = () => ({
  categories: [],
  occasions: [],
  features: [],

  // Empty means no price restriction.
  minPrice: "",
  maxPrice: "",

  rating: 0,
  availability: "all",
});

// =========================================
// FETCH JSON
// =========================================

const fetchJSON = async (url, signal) => {
  const response = await fetch(url, {
    signal,
  });

  const data = await response
    .json()
    .catch(() => ({}));

  if (!response.ok || !data.success) {
    throw new Error(
      data.message || "Data fetch failed"
    );
  }

  return data;
};

// =========================================
// FILTER SECTION
// =========================================

function FilterSection({
  title,
  children,
}) {
  const [open, setOpen] = useState(true);

  return (
    <section className="border-b border-base-300/70 py-4 last:border-b-0">
      <button
        type="button"
        onClick={() =>
          setOpen((value) => !value)
        }
        className="flex w-full items-center justify-between text-sm font-bold text-primary"
        aria-expanded={open}
      >
        {title}

        <ChevronDown
          size={16}
          className={`transition-transform ${
            open ? "" : "-rotate-90"
          }`}
        />
      </button>

      {open && (
        <div className="mt-3 space-y-2.5">
          {children}
        </div>
      )}
    </section>
  );
}

// =========================================
// FILTER CHECKBOX
// =========================================

function FilterCheckbox({
  label,
  checked,
  onChange,
  count,
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-base-content/80 hover:text-secondary">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="checkbox checkbox-sm checkbox-secondary rounded"
      />

      <span className="min-w-0 flex-1">
        {label}
      </span>

      {count !== undefined && (
        <span className="rounded-full bg-secondary/10 px-2 py-0.5 text-[10px] text-secondary">
          {count}
        </span>
      )}
    </label>
  );
}

// =========================================
// PAGINATION NUMBERS
// =========================================

function getPageNumbers(
  currentPage,
  totalPages
) {
  const pages = [];

  for (
    let page = 1;
    page <= totalPages;
    page++
  ) {
    if (
      page === 1 ||
      page === totalPages ||
      Math.abs(page - currentPage) <= 1
    ) {
      if (
        pages.length > 0 &&
        page - pages[pages.length - 1] > 1
      ) {
        pages.push("...");
      }

      pages.push(page);
    }
  }

  return pages;
}

// =========================================
// MAIN SHOP PAGE
// =========================================

export default function Shop() {
  const location = useLocation();

  const searchInputRef = useRef(null);

  // =====================================
  // STATES
  // =====================================

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] =
    useState("");

  const [sort, setSort] = useState("featured");

  const [filters, setFilters] = useState(
    createInitialFilters
  );

  const [filterOpen, setFilterOpen] =
    useState(false);

  const [currentPage, setCurrentPage] =
    useState(1);

  // =====================================
  // NAVBAR SEARCH FOCUS
  // =====================================

  useEffect(() => {
    if (!location.state?.focusSearch) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      if (!searchInputRef.current) return;

      searchInputRef.current.focus({
        preventScroll: true,
      });

      searchInputRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [
    location.key,
    location.state?.focusSearch,
  ]);

  // =====================================
  // SEARCH DEBOUNCE
  // =====================================

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(
        search.trim()
      );
    }, 350);

    return () => clearTimeout(timeout);
  }, [search]);

  // =====================================
  // CATEGORY API
  // =====================================

  const {
    data: categories = [],
  } = useQuery({
    queryKey: ["public-categories"],

    queryFn: async ({ signal }) => {
      const data = await fetchJSON(
        `${API_URL}/categories`,
        signal
      );

      return data.categories || [];
    },

    staleTime: 5 * 60 * 1000,
  });

  // =====================================
  // OCCASION API
  // =====================================

  const {
    data: occasions = [],
  } = useQuery({
    queryKey: ["public-occasions"],

    queryFn: async ({ signal }) => {
      const data = await fetchJSON(
        `${API_URL}/occasions`,
        signal
      );

      return data.occasions || [];
    },

    staleTime: 5 * 60 * 1000,
  });

  // =====================================
  // BUILD API QUERY
  // =====================================

  const queryString = useMemo(() => {
    const params = new URLSearchParams();

    if (debouncedSearch) {
      params.set(
        "search",
        debouncedSearch
      );
    }

    if (filters.categories.length) {
      params.set(
        "categories",
        filters.categories.join(",")
      );
    }

    if (filters.occasions.length) {
      params.set(
        "occasions",
        filters.occasions.join(",")
      );
    }

    if (filters.features.length) {
      params.set(
        "features",
        filters.features.join(",")
      );
    }

    if (filters.minPrice !== "") {
      params.set(
        "minPrice",
        String(filters.minPrice)
      );
    }

    if (filters.maxPrice !== "") {
      params.set(
        "maxPrice",
        String(filters.maxPrice)
      );
    }

    if (filters.rating > 0) {
      params.set(
        "rating",
        String(filters.rating)
      );
    }

    if (
      filters.availability !== "all"
    ) {
      params.set(
        "availability",
        filters.availability
      );
    }

    params.set("sort", sort);

    params.set(
      "page",
      String(currentPage)
    );

    return params.toString();
  }, [
    debouncedSearch,
    filters,
    sort,
    currentPage,
  ]);

  // =====================================
  // FETCH PRODUCTS FROM BACKEND
  // =====================================

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      "public-shop-products",
      queryString,
    ],

    queryFn: async ({ signal }) => {
      return fetchJSON(
        `${API_URL}/products?${queryString}`,
        signal
      );
    },

    staleTime: 30 * 1000,

    placeholderData: (previousData) =>
      previousData,
  });

  // =====================================
  // BACKEND RESPONSE
  // =====================================

  const products = data?.products || [];

  const pagination = data?.pagination || {
    page: currentPage,
    limit: PRODUCTS_PER_PAGE,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  };

  const categoryCounts =
    data?.categoryCounts || {};

  const totalProducts = pagination.total;

  const totalPages = pagination.totalPages;

  // =====================================
  // RESET INVALID PAGE
  // =====================================

  useEffect(() => {
    if (
      !isFetching &&
      totalPages > 0 &&
      currentPage > totalPages
    ) {
      setCurrentPage(totalPages);
    }
  }, [
    isFetching,
    totalPages,
    currentPage,
  ]);

  // =====================================
  // UPDATE FILTER
  // =====================================

  const updateFilter = (key, value) => {
    setFilters((previous) => ({
      ...previous,
      [key]: value,
    }));

    // Every filter change starts from page 1.
    setCurrentPage(1);
  };

  // =====================================
  // MULTI SELECT FILTER
  // =====================================

  const toggleArrayFilter = (key, value) => {
    setFilters((previous) => ({
      ...previous,

      [key]: previous[key].includes(value)
        ? previous[key].filter(
            (item) => item !== value
          )
        : [...previous[key], value],
    }));

    setCurrentPage(1);
  };

  // =====================================
  // RESET ALL FILTERS
  // =====================================

  const clearFilters = () => {
    setFilters(createInitialFilters());

    setSearch("");
    setDebouncedSearch("");

    setSort("featured");
    setCurrentPage(1);
  };

  // =====================================
  // ACTIVE FILTER COUNT
  // =====================================

  const activeFilterCount =
    filters.categories.length +
    filters.occasions.length +
    filters.features.length +
    (filters.rating > 0 ? 1 : 0) +
    (filters.minPrice !== "" ||
    filters.maxPrice !== ""
      ? 1
      : 0) +
    (filters.availability !== "all"
      ? 1
      : 0);

  // =====================================
  // FILTER LABELS
  // =====================================

  const getCategoryName = (id) =>
    categories.find(
      (category) => category.id === id
    )?.name || id;

  const getOccasionName = (id) =>
    occasions.find(
      (occasion) => occasion.id === id
    )?.name || id;

  const getFeatureName = (id) =>
    featureOptions.find(
      (feature) => feature.id === id
    )?.name || id;

  // =====================================
  // FILTER CONTENT
  // SAME DESIGN AS BEFORE
  // =====================================

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

      {/* ================= CATEGORY ================= */}

      <FilterSection title="ক্যাটাগরি">
        {categories.map((category) => (
          <FilterCheckbox
            key={category.id}
            label={category.name}
            checked={filters.categories.includes(
              category.id
            )}
            onChange={() =>
              toggleArrayFilter(
                "categories",
                category.id
              )
            }
            count={
              categoryCounts[category.id] || 0
            }
          />
        ))}

        {!categories.length && (
          <p className="text-xs text-muted">
            কোনো ক্যাটাগরি পাওয়া যায়নি।
          </p>
        )}
      </FilterSection>

      {/* ================= PRICE ================= */}

      <FilterSection title="বাজেট (৳)">
        <div className="flex items-center gap-2">
          <label className="min-w-0 flex-1">
            <span className="mb-1 block text-xs text-muted">
              সর্বনিম্ন
            </span>

            <input
              type="number"
              min="0"
              value={filters.minPrice}
              placeholder="যেকোনো"
              onChange={(event) =>
                updateFilter(
                  "minPrice",
                  event.target.value === ""
                    ? ""
                    : Math.max(
                        0,
                        Number(
                          event.target.value
                        ) || 0
                      )
                )
              }
              className="input input-bordered input-sm w-full rounded-lg"
            />
          </label>

          <label className="min-w-0 flex-1">
            <span className="mb-1 block text-xs text-muted">
              সর্বোচ্চ
            </span>

            <input
              type="number"
              min="0"
              value={filters.maxPrice}
              placeholder="যেকোনো"
              onChange={(event) =>
                updateFilter(
                  "maxPrice",
                  event.target.value === ""
                    ? ""
                    : Math.max(
                        0,
                        Number(
                          event.target.value
                        ) || 0
                      )
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
          value={
            filters.maxPrice === ""
              ? 5000
              : Math.max(
                  500,
                  Math.min(
                    Number(filters.maxPrice),
                    5000
                  )
                )
          }
          onChange={(event) =>
            updateFilter(
              "maxPrice",
              Number(event.target.value)
            )
          }
          aria-label="সর্বোচ্চ বাজেট"
          className="range range-secondary range-xs mt-2"
        />

        <div className="flex justify-between text-xs text-muted">
          <span>৳৫০০</span>
          <span>৳৫,০০০+</span>
        </div>

        <p className="text-xs leading-5 text-muted">
          খালি রাখলে মূল্য অনুযায়ী কোনো সীমা
          থাকবে না।
        </p>
      </FilterSection>

      {/* ================= OCCASIONS ================= */}

      <FilterSection title="উপলক্ষ (Occasion)">
        {occasions.map((occasion) => (
          <FilterCheckbox
            key={occasion.id}
            label={occasion.name}
            checked={filters.occasions.includes(
              occasion.id
            )}
            onChange={() =>
              toggleArrayFilter(
                "occasions",
                occasion.id
              )
            }
          />
        ))}

        {!occasions.length && (
          <p className="text-xs text-muted">
            কোনো উপলক্ষ পাওয়া যায়নি।
          </p>
        )}
      </FilterSection>

      {/* ================= FEATURES ================= */}

      <FilterSection title="বিশেষ বৈশিষ্ট্য">
        {featureOptions.map((feature) => (
          <FilterCheckbox
            key={feature.id}
            label={feature.name}
            checked={filters.features.includes(
              feature.id
            )}
            onChange={() =>
              toggleArrayFilter(
                "features",
                feature.id
              )
            }
          />
        ))}
      </FilterSection>

      {/* ================= AVAILABILITY ================= */}

      <FilterSection title="উপলব্ধতা">
        {[
          {
            id: "all",
            name: "সব প্রোডাক্ট",
          },
          {
            id: "available",
            name: "ক্রয়যোগ্য",
          },
          {
            id: "unavailable",
            name: "অনুপলব্ধ",
          },
        ].map((option) => (
          <label
            key={option.id}
            className="flex cursor-pointer items-center gap-2 text-sm text-base-content/80"
          >
            <input
              type="radio"
              name="availability"
              checked={
                filters.availability ===
                option.id
              }
              onChange={() =>
                updateFilter(
                  "availability",
                  option.id
                )
              }
              className="radio radio-secondary radio-sm"
            />

            {option.name}
          </label>
        ))}
      </FilterSection>

      {/* ================= RATING ================= */}

      <FilterSection title="গ্রাহক রেটিং">
        {[4, 3, 2, 1].map((rating) => (
          <label
            key={rating}
            className="flex cursor-pointer items-center gap-2 text-sm"
          >
            <input
              type="radio"
              name="rating"
              checked={
                filters.rating === rating
              }
              onChange={() =>
                updateFilter(
                  "rating",
                  rating
                )
              }
              className="radio radio-secondary radio-sm"
            />

            <span className="flex items-center gap-1 text-amber-500">
              {"★".repeat(rating)}

              <span className="text-muted">
                {" "}
                ও তার বেশি
              </span>
            </span>
          </label>
        ))}

        <button
          type="button"
          onClick={() =>
            updateFilter("rating", 0)
          }
          className="text-xs text-secondary hover:underline"
        >
          সব রেটিং
        </button>
      </FilterSection>

      {/* MOBILE SHOW PRODUCTS BUTTON */}

      <button
        type="button"
        onClick={() =>
          setFilterOpen(false)
        }
        className="btn-brand mt-4 w-full lg:hidden"
      >
        {totalProducts}টি পণ্য দেখুন
      </button>
    </div>
  );

  // =====================================
  // PAGINATION
  // =====================================

  const pageNumbers = getPageNumbers(
    currentPage,
    totalPages
  );

  const startItem =
    totalProducts > 0
      ? (currentPage - 1) *
          PRODUCTS_PER_PAGE +
        1
      : 0;

  const endItem = Math.min(
    currentPage * PRODUCTS_PER_PAGE,
    totalProducts
  );

  const changePage = (nextPage) => {
    if (
      nextPage < 1 ||
      nextPage > totalPages
    ) {
      return;
    }

    setCurrentPage(nextPage);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =====================================
  // JSX
  // =====================================

  return (
    <main className="page-bg min-h-screen">
      <div className="page-container py-6 sm:py-8">

        {/* BREADCRUMB */}

        <nav className="mb-5 text-xs text-muted sm:text-sm">
          <Link
            to="/"
            className="hover:text-secondary"
          >
            হোম
          </Link>

          <span className="mx-2">
            /
          </span>

          <span className="font-semibold text-primary">
            সব উপহার
          </span>
        </nav>

        {/* PAGE HEADING */}

        <div className="mb-6">
          <span className="badge-soft mb-3">
            <Gift size={13} />
            SokhBilash Gift Collection
          </span>

          <h1 className="text-2xl font-extrabold text-primary sm:text-3xl">
            পছন্দের উপহার খুঁজে নিন
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted sm:text-base">
            প্রিয় মানুষের বিশেষ মুহূর্তকে আরও
            সুন্দর করে তুলুন আমাদের বাছাই
            করা উপহারের সংগ্রহ দিয়ে।
          </p>
        </div>

        {/* SEARCH BAR */}

        <div className="mb-5 flex flex-col gap-3 sm:flex-row">
          <label className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl border border-base-300 bg-base-100 px-4 shadow-sm transition focus-within:border-secondary focus-within:ring-2 focus-within:ring-secondary/10">
            <Search
              size={19}
              className="shrink-0 text-secondary"
            />

            <input
              ref={searchInputRef}
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(
                  event.target.value
                );

                setCurrentPage(1);
              }}
              placeholder="উপহারের নাম, ক্যাটাগরি বা উপলক্ষ দিয়ে খুঁজুন..."
              aria-label="উপহার খুঁজুন"
              className="h-12 min-w-0 flex-1 bg-transparent text-sm text-primary outline-none placeholder:text-muted"
            />

            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setDebouncedSearch("");

                  setCurrentPage(1);

                  searchInputRef.current?.focus();
                }}
                aria-label="সার্চ মুছুন"
                className="rounded-full p-1 text-muted hover:bg-base-200"
              >
                <X size={16} />
              </button>
            )}
          </label>

          {/* MOBILE FILTER BUTTON */}

          <button
            type="button"
            onClick={() =>
              setFilterOpen(true)
            }
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

        {/* MAIN LAYOUT */}

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[250px_minmax(0,1fr)] xl:grid-cols-[270px_minmax(0,1fr)]">

          {/* DESKTOP FILTER SIDEBAR */}

          <aside className="hidden h-fit rounded-2xl border border-base-300/80 bg-base-100 p-4 shadow-sm lg:sticky lg:top-24 lg:block">
            {FilterContent}
          </aside>

          {/* PRODUCT AREA */}

          <section className="min-w-0">

            {/* RESULT COUNT AND SORT */}

            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-primary">
                  সব উপহার

                  <span className="ml-2 font-normal text-muted">
                    ({totalProducts}টি পণ্য)
                  </span>
                </p>

                {search && (
                  <p className="mt-1 text-xs text-muted">
                    “{search}” এর ফলাফল
                  </p>
                )}
              </div>

              <label className="flex items-center gap-2 rounded-xl border border-base-300 bg-base-100 px-3">
                <ArrowUpDown
                  size={15}
                  className="shrink-0 text-secondary"
                />

                <span className="hidden text-xs text-muted sm:inline">
                  সাজান:
                </span>

                <select
                  value={sort}
                  onChange={(event) => {
                    setSort(
                      event.target.value
                    );

                    setCurrentPage(1);
                  }}
                  className="select select-ghost select-sm max-w-40 text-xs font-medium text-primary focus:outline-none"
                  aria-label="পণ্য সাজান"
                >
                  <option value="featured">
                    ফিচার্ড
                  </option>

                  <option value="newest">
                    নতুন প্রোডাক্ট
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
              </label>
            </div>

            {/* ACTIVE FILTER CHIPS */}

            {(activeFilterCount > 0 ||
              search) && (
              <div className="mb-4 flex flex-wrap items-center gap-2">

                {/* CATEGORY CHIPS */}

                {filters.categories.map(
                  (id) => (
                    <span
                      key={`category-${id}`}
                      className="badge-soft gap-1.5 py-1.5"
                    >
                      {getCategoryName(id)}

                      <button
                        type="button"
                        onClick={() =>
                          toggleArrayFilter(
                            "categories",
                            id
                          )
                        }
                        aria-label="ক্যাটাগরি ফিল্টার সরান"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  )
                )}

                {/* OCCASION CHIPS */}

                {filters.occasions.map(
                  (id) => (
                    <span
                      key={`occasion-${id}`}
                      className="badge-soft gap-1.5 py-1.5"
                    >
                      {getOccasionName(id)}

                      <button
                        type="button"
                        onClick={() =>
                          toggleArrayFilter(
                            "occasions",
                            id
                          )
                        }
                        aria-label="উপলক্ষ ফিল্টার সরান"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  )
                )}

                {/* FEATURE CHIPS */}

                {filters.features.map(
                  (id) => (
                    <span
                      key={`feature-${id}`}
                      className="badge-soft gap-1.5 py-1.5"
                    >
                      {getFeatureName(id)}

                      <button
                        type="button"
                        onClick={() =>
                          toggleArrayFilter(
                            "features",
                            id
                          )
                        }
                        aria-label="ফিচার ফিল্টার সরান"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  )
                )}

                {/* PRICE CHIP */}

                {(filters.minPrice !== "" ||
                  filters.maxPrice !== "") && (
                  <span className="badge-soft gap-1.5 py-1.5">
                    ৳{filters.minPrice || 0}
                    –
                    {filters.maxPrice === ""
                      ? "যেকোনো"
                      : `৳${filters.maxPrice}`}

                    <button
                      type="button"
                      onClick={() => {
                        setFilters(
                          (previous) => ({
                            ...previous,
                            minPrice: "",
                            maxPrice: "",
                          })
                        );

                        setCurrentPage(1);
                      }}
                      aria-label="মূল্য ফিল্টার সরান"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}

                {/* RATING CHIP */}

                {filters.rating > 0 && (
                  <span className="badge-soft gap-1.5 py-1.5">
                    {filters.rating}★+

                    <button
                      type="button"
                      onClick={() =>
                        updateFilter(
                          "rating",
                          0
                        )
                      }
                      aria-label="রেটিং ফিল্টার সরান"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}

                {/* AVAILABILITY CHIP */}

                {filters.availability !== "all" && (
                  <span className="badge-soft gap-1.5 py-1.5">
                    {filters.availability === "available"
                      ? "ক্রয়যোগ্য"
                      : "অনুপলব্ধ"}

                    <button
                      type="button"
                      onClick={() =>
                        updateFilter(
                          "availability",
                          "all"
                        )
                      }
                      aria-label="উপলব্ধতা ফিল্টার সরান"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}

                {/* CLEAR ALL */}

                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs font-semibold text-secondary hover:underline"
                >
                  সব মুছুন
                </button>
              </div>
            )}

            {/* ========================= */}
            {/* LOADING STATE           */}
            {/* ========================= */}

            {isLoading ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
                {Array.from(
                  { length: PRODUCTS_PER_PAGE },
                  (_, index) => (
                    <div
                      key={index}
                      className="overflow-hidden rounded-2xl border border-base-300 bg-base-100"
                    >
                      <div className="aspect-square animate-pulse bg-base-200" />

                      <div className="space-y-3 p-4">
                        <div className="h-3 w-20 animate-pulse rounded bg-base-200" />
                        <div className="h-4 w-full animate-pulse rounded bg-base-200" />
                        <div className="h-4 w-3/4 animate-pulse rounded bg-base-200" />
                        <div className="h-9 animate-pulse rounded-xl bg-base-200" />
                      </div>
                    </div>
                  )
                )}
              </div>
            ) : isError ? (
              /* ========================= */
              /* ERROR STATE             */
              /* ========================= */

              <div className="section-card flex min-h-64 flex-col items-center justify-center px-5 py-12 text-center">
                <div className="icon-box mb-4">
                  <Search size={22} />
                </div>

                <h2 className="text-lg font-bold text-primary">
                  প্রোডাক্ট লোড করা যায়নি
                </h2>

                <p className="mt-2 max-w-sm text-sm text-muted">
                  {error?.message ||
                    "পণ্য লোড করার সময় সমস্যা হয়েছে।"}
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
            ) : products.length > 0 ? (
              <>
                {/* ========================= */}
                {/* PRODUCT GRID            */}
                {/* ========================= */}

                <div
                  className={`grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3 ${
                    isFetching
                      ? "opacity-70"
                      : ""
                  }`}
                  aria-busy={isFetching}
                >
                  {products.map(
                    (product) => (
                      <ProductCard
                        key={product._id}
                        product={product}
                      />
                    )
                  )}
                </div>

                {/* ========================= */}
                {/* SERVER PAGINATION       */}
                {/* ========================= */}

                {totalPages > 1 && (
                  <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-base-300/70 bg-base-100 px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-muted sm:text-sm">
                      {startItem}–{endItem} টি
                      পণ্য দেখানো হচ্ছে, মোট{" "}
                      {totalProducts} টি
                    </p>

                    <div className="flex items-center justify-center gap-1.5">

                      {/* PREVIOUS */}

                      <button
                        type="button"
                        disabled={
                          currentPage <= 1
                        }
                        onClick={() =>
                          changePage(
                            currentPage - 1
                          )
                        }
                        aria-label="আগের পৃষ্ঠা"
                        className="flex size-9 items-center justify-center rounded-lg border border-base-300 text-primary transition hover:bg-secondary hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        ‹
                      </button>

                      {/* PAGE NUMBERS */}

                      {pageNumbers.map(
                        (page, index) =>
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
                              onClick={() =>
                                changePage(page)
                              }
                              aria-current={
                                currentPage === page
                                  ? "page"
                                  : undefined
                              }
                              className={`flex size-9 items-center justify-center rounded-lg text-sm font-semibold transition ${
                                currentPage === page
                                  ? "bg-secondary text-white shadow-sm"
                                  : "bg-base-200 text-primary hover:bg-secondary/10"
                              }`}
                            >
                              {page}
                            </button>
                          )
                      )}

                      {/* NEXT */}

                      <button
                        type="button"
                        disabled={
                          currentPage >= totalPages
                        }
                        onClick={() =>
                          changePage(
                            currentPage + 1
                          )
                        }
                        aria-label="পরের পৃষ্ঠা"
                        className="flex size-9 items-center justify-center rounded-lg border border-base-300 text-primary transition hover:bg-secondary hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        ›
                      </button>
                    </div>
                  </div>
                )}

                {/* ========================= */}
                {/* CUSTOM GIFT BANNER      */}
                {/* ========================= */}

                <section className="relative mt-7 overflow-hidden rounded-2xl bg-gradient-to-r from-[#310039] via-[#76258a] to-[#4b174d] p-5 text-white shadow-md sm:mt-8 sm:p-7">
                  <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">

                    {/* ICON */}

                    <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-gold-soft">
                      <Gift size={26} />
                    </div>

                    {/* CONTENT */}

                    <div className="min-w-0 flex-1">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-gold-soft">
                        <Sparkles size={13} />
                        বড় কিছু গিফট করার
                      </span>

                      <h2 className="mt-1 text-lg font-extrabold leading-snug sm:text-xl">
                        আপনার নিজস্ব কোনো বিশেষ ভাবনা
                        বা পরিকল্পনা আছে?
                      </h2>

                      <p className="mt-2 max-w-2xl text-xs leading-5 text-white/80 sm:text-sm">
                        নিজের পছন্দমতো রং নির্বাচন
                        করুন, প্রিয় উপহারগুলো যোগ
                        করুন এবং ভালোবাসায় সাজিয়ে
                        প্রিয় মানুষকে উপহার দিন।
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
              /* ========================= */
              /* EMPTY STATE             */
              /* ========================= */

              <div className="section-card flex min-h-64 flex-col items-center justify-center px-5 py-12 text-center">
                <div className="icon-box mb-4">
                  <Search size={22} />
                </div>

                <h2 className="text-lg font-bold text-primary">
                  কোনো উপহার পাওয়া যায়নি
                </h2>

                <p className="mt-2 max-w-sm text-sm text-muted">
                  অন্য নামে সার্চ করো অথবা ফিল্টার
                  পরিবর্তন করে দেখো।
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

      {/* ==================================== */}
      {/* MOBILE FILTER DRAWER                */}
      {/* ==================================== */}

      {filterOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">

          {/* BACKDROP */}

          <button
            type="button"
            aria-label="ফিল্টার বন্ধ করুন"
            onClick={() =>
              setFilterOpen(false)
            }
            className="absolute inset-0 bg-black/45"
          />

          {/* DRAWER */}

          <aside
            role="dialog"
            aria-modal="true"
            aria-label="পণ্য ফিল্টার"
            className="absolute inset-y-0 left-0 flex w-[min(88%,340px)] flex-col bg-base-100 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-base-300 px-4 py-4">
              <span className="font-bold text-primary">
                পণ্য ফিল্টার
              </span>

              <button
                type="button"
                onClick={() =>
                  setFilterOpen(false)
                }
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
