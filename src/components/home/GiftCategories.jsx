import { Gift, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { API_URL } from "../../utils/siteConfig";


// ========================================
// FETCH CATEGORIES
// ========================================

const fetchCategories = async ({ signal }) => {
  const res = await fetch(`${API_URL}/categories`, {
    signal,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to fetch categories");
  }

  return data;
};

// ========================================
// MAIN COMPONENT
// ========================================

const GiftCategories = () => {
  const {
    data: categoryData,
    isPending,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["catalogCategories"],
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000,
  });

  // Maximum 6 categories
  // Backend already sorts by sortOrder

  const categories = Array.isArray(categoryData?.categories)
    ? categoryData.categories.slice(0, 6)
    : [];

  return (
    <section className="section-bg section-padding bg-secondary/5">
      <div className="page-container">
        {/* SECTION HEADER */}

        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <span className="badge-soft bg-secondary/10">
              <Gift size={13} />
              উপহার সম্ভার
            </span>

            <h2 className="mt-3 text-2xl font-bold text-primary sm:text-3xl">
              ক্যাটাগরি অনুযায়ী উপহার
            </h2>

            <p className="mt-2 text-sm text-muted">
              প্রতিটি বিশেষ মুহূর্তের জন্য পছন্দের উপহার খুঁজে নিন।
            </p>
          </div>

          <Link
            to="/categories"
            className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-secondary transition hover:text-primary sm:inline-flex"
          >
            সব ক্যাটাগরি দেখুন
            <ArrowRight size={15} />
          </Link>
        </div>

        {/* LOADING STATE */}

        {isPending ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: 6 }, (_, index) => (
              <div
                key={index}
                className="flex h-36 animate-pulse flex-col items-center justify-center gap-3 rounded-2xl border border-base-300 bg-base-100 p-4"
              >
                <div className="size-16 rounded-full bg-base-200" />
                <div className="h-4 w-24 rounded bg-base-200" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="rounded-2xl border border-base-300 bg-base-100 px-5 py-10 text-center">
            <p className="text-sm text-muted">ক্যাটাগরি লোড করা যায়নি।</p>

            <button
              type="button"
              onClick={() => refetch()}
              className="btn-outline-brand mt-4"
            >
              আবার চেষ্টা করুন
            </button>
          </div>
        ) : categories.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/shop?categories=${encodeURIComponent(category.id)}`}
                className="group flex min-w-0 flex-col items-center rounded-2xl border border-base-300 bg-base-100 p-4 text-center shadow-sm transition duration-300 hover:-translate-y-1 hover:border-secondary/40 hover:shadow-md"
              >
                {/* CATEGORY ICON */}

                <div className="mx-auto mb-3 flex size-16 items-center justify-center transition duration-300 group-hover:scale-110">
                  {category.iconUrl ? (
                    <img
                      src={category.iconUrl}
                      alt={category.name}
                      loading="lazy"
                      className="size-full object-contain"
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <Gift size={38} className="text-secondary" />
                  )}
                </div>

                {/* CATEGORY NAME */}

                <h3 className="text-sm font-bold leading-5 text-primary transition group-hover:text-secondary">
                  {category.name}
                </h3>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-base-300 bg-base-100 px-5 py-10 text-center">
            <p className="text-sm text-muted">কোনো ক্যাটাগরি পাওয়া যায়নি।</p>
          </div>
        )}

        {/* MOBILE VIEW ALL */}

        <Link
          to="/categories"
          className="btn-outline-brand mt-5 w-full sm:hidden"
        >
          সব ক্যাটাগরি দেখুন
          <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  );
};

export default GiftCategories;
