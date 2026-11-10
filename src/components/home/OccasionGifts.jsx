import { useState } from "react";
import { Heart, Gift, ArrowRight } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { GoHeartFill } from "react-icons/go";
import { HiUsers } from "react-icons/hi";
import { MdFamilyRestroom, MdMosque } from "react-icons/md";
import { RiCake2Fill, RiHandHeartFill } from "react-icons/ri";
import { API_URL } from "../../utils/siteConfig";

// ========================================
// FALLBACK ICONS
// ========================================

const occasionIcons = {
  birthday: RiCake2Fill,
  anniversary: GoHeartFill,
  "wedding-nikah": RiHandHeartFill,
  "love-romance": HiUsers,
  islamic: MdMosque,
  "parents-day": MdFamilyRestroom,
  congratulations: RiHandHeartFill,
  surprise: Gift,
};

// ========================================
// FETCH OCCASIONS
// ========================================

const fetchOccasions = async ({ signal }) => {
  const res = await fetch(`${API_URL}/occasions`, {
    signal,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to fetch occasions");
  }

  return data;
};

// ========================================
// OCCASION ICON
// ========================================

const OccasionIcon = ({ occasion }) => {
  const [failedUrl, setFailedUrl] = useState(null);

  const Icon = occasionIcons[occasion.id] || Gift;

  if (occasion.iconUrl && failedUrl !== occasion.iconUrl) {
    return (
      <img
        src={occasion.iconUrl}
        alt={occasion.name}
        loading="lazy"
        className="size-10 object-contain transition duration-300 group-hover:scale-110"
        onError={() => setFailedUrl(occasion.iconUrl)}
      />
    );
  }

  return (
    <Icon
      size={30}
      className="text-primary transition duration-300 group-hover:text-base-100"
    />
  );
};

// ========================================
// MAIN COMPONENT
// ========================================

const OccasionGifts = () => {
  const queryClient = useQueryClient();

  // ========================================
  // REACT QUERY
  // ========================================

  const {
    data: occasionData,
    isPending,
    isError,
  } = useQuery({
    queryKey: ["catalogOccasions"],
    queryFn: fetchOccasions,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const occasions = Array.isArray(occasionData?.occasions)
    ? occasionData.occasions
    : [];

  // ========================================
  // REFRESH DATA
  // ========================================

  const refreshOccasions = () => {
    queryClient.invalidateQueries({
      queryKey: ["catalogOccasions"],
    });
  };

  return (
    <section className="section-bg section-padding sm:pb-16">
      <div className="page-container">
        <div className="rounded-3xl border border-base-300/70 bg-gradient-to-br from-secondary/15 to-secondary/10 p-5 sm:p-8 lg:p-10">
          {/* ================================= */}
          {/* SECTION HEADER */}
          {/* ================================= */}

          <div className="mb-7 text-center">
            <span className="badge-soft">
              <Heart size={13} />
              উপহার দেওয়ার বিশেষ দিন
            </span>

            <h2 className="mt-3 text-2xl font-bold text-primary sm:text-3xl">
              উপলক্ষ অনুযায়ী উপহার বেছে নিন
            </h2>

            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted">
              ছোট্ট একটি উপহারও হয়ে উঠুক প্রিয় মানুষের জীবনের সুন্দর একটি
              স্মৃতি।
            </p>
          </div>

          {/* ================================= */}
          {/* LOADING STATE */}
          {/* ================================= */}

          {isPending ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }, (_, index) => (
                <div
                  key={index}
                  className="flex h-36 animate-pulse flex-col items-center justify-center gap-4 rounded-2xl bg-base-100 p-4"
                >
                  <div className="size-12 rounded-xl bg-base-200" />
                  <div className="h-4 w-24 rounded bg-base-200" />
                </div>
              ))}
            </div>
          ) : isError ? (
            /* ================================= */
            /* ERROR STATE */
            /* ================================= */

            <div className="rounded-2xl bg-base-100 px-5 py-10 text-center">
              <p className="text-sm text-muted">উপলক্ষ লোড করা যায়নি।</p>

              <button
                type="button"
                onClick={refreshOccasions}
                className="btn-outline-brand mt-4"
              >
                আবার চেষ্টা করুন
              </button>
            </div>
          ) : occasions.length > 0 ? (
            /* ================================= */
            /* OCCASION GRID */
            /* ================================= */

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {occasions.map((occasion) => (
                <Link
                  key={occasion.id}
                  to={`/shop?occasions=${encodeURIComponent(occasion.id)}`}
                  className="group flex min-w-0 flex-col items-center justify-center rounded-2xl border border-transparent bg-base-100 px-4 py-6 text-center transition duration-300 hover:-translate-y-1 hover:bg-secondary hover:shadow-md"
                >
                  {/* OCCASION ICON */}

                  <div className=" flex size-14 items-center justify-center">
                    <OccasionIcon occasion={occasion} />
                  </div>

                  {/* OCCASION NAME */}

                  <h3 className="text-sm font-bold leading-5 text-primary transition duration-300 group-hover:text-base-100">
                    {occasion.name}
                  </h3>

                  {/* VIEW LINK */}

                  <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-secondary transition duration-300 group-hover:text-base-100">
                    উপহার দেখুন
                    <ArrowRight size={12} />
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            /* ================================= */
            /* EMPTY STATE */
            /* ================================= */

            <div className="rounded-2xl bg-base-100 px-5 py-10 text-center">
              <Gift size={32} className="mx-auto text-secondary" />

              <p className="mt-3 text-sm text-muted">
                কোনো উপলক্ষ পাওয়া যায়নি।
              </p>
            </div>
          )}

          {/* ================================= */}
          {/* VIEW ALL */}
          {/* ================================= */}

          <div className="mt-7 flex justify-center">
            <Link
              to="/categories#occasions"
              className="inline-flex items-center gap-2 text-sm font-semibold text-secondary transition hover:text-primary"
            >
              সব উপলক্ষ দেখুন
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OccasionGifts;
