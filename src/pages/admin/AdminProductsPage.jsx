import { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";

import {
  Plus,
  Search,
  Package,
  CheckCircle2,
  XCircle,
  Star,
  Pencil,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  ImageOff,
  Layers3,
  ShieldCheck,
  ArrowUpDown,
  AlertTriangle,
  Tag,
} from "lucide-react";

import { AuthContext } from "../../providers/AuthProvider";
import { API_URL } from "../../utils/siteConfig";

// ==========================================
// CONFIGURATION
// ==========================================

const PAGE_SIZE = 10;

const bn = (value) => Number(value || 0).toLocaleString("bn-BD");

const money = (value) =>
  Number.isFinite(Number(value)) && value !== null && value !== ""
    ? `৳${Number(value).toLocaleString("bn-BD", {
        maximumFractionDigits: 2,
      })}`
    : "—";

// ==========================================
// DATE FORMAT
// ==========================================

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("bn-BD", {
    timeZone: "Asia/Dhaka",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ==========================================
// BASE PRODUCT PRICING
//
// Admin list API returns regularPrice
// and salePrice, not variant prices.
// ==========================================

function getBasePrice(product) {
  const regular = Number(product.regularPrice);
  const sale = Number(product.salePrice);

  const hasRegular = Number.isFinite(regular) && regular > 0;

  const hasSale =
    hasRegular &&
    product.salePrice !== null &&
    product.salePrice !== undefined &&
    product.salePrice !== "" &&
    Number.isFinite(sale) &&
    sale > 0 &&
    sale < regular;

  return {
    price: hasRegular ? (hasSale ? sale : regular) : null,

    original: hasSale ? regular : null,

    discount: hasSale ? Math.round(((regular - sale) / regular) * 100) : 0,
  };
}

// ==========================================
// PRODUCT IMAGE URL
// ==========================================

function getMainImage(product) {
  const first = Array.isArray(product?.images) ? product.images[0] : null;

  if (typeof first === "string") {
    return first.trim();
  }

  return typeof first?.url === "string" ? first.url.trim() : "";
}

// ==========================================
// AUTHENTICATED ADMIN API
// ==========================================

async function adminProductRequest(
  user,
  path,
  { method = "GET", body, signal } = {},
) {
  if (!user) {
    throw new Error("Admin login required");
  }

  const token = await user.getIdToken();

  const response = await fetch(`${API_URL}${path}`, {
    method,
    signal,
    cache: "no-store",

    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,

      ...(body === undefined
        ? {}
        : {
            "Content-Type": "application/json",
          }),
    },

    ...(body === undefined
      ? {}
      : {
          body: JSON.stringify(body),
        }),
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok || result.success !== true) {
    throw new Error(result.message || `Request failed (${response.status})`);
  }

  return result;
}

// ==========================================
// NOTIFICATION
// ==========================================

function toast(icon, title) {
  void Swal.fire({
    icon,
    title,
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: icon === "success" ? 1800 : 3000,
    timerProgressBar: true,
  });
}

// ==========================================
// STATISTICS CARD
// ==========================================

function StatCard({ title, value, icon: Icon, iconClass, note }) {
  return (
    <div className="rounded-2xl border border-base-300/80 bg-white p-4 shadow-sm transition hover:shadow-md sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-primary">{title}</p>

          <p className="mt-1 text-xs text-muted">{note}</p>
        </div>

        <span
          className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
        >
          <Icon size={21} />
        </span>
      </div>

      <p className="mt-4 text-xl font-bold text-primary">{bn(value)}</p>
    </div>
  );
}

// ==========================================
// PRODUCT IMAGE
// ==========================================

function ProductImage({ product }) {
  const [failedUrl, setFailedUrl] = useState("");

  const src = getMainImage(product);

  return (
    <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-base-300 bg-base-200">
      {src && failedUrl !== src ? (
        <img
          src={src}
          alt={product.name || "Product"}
          loading="lazy"
          className="size-full object-cover"
          onError={() => setFailedUrl(src)}
        />
      ) : (
        <ImageOff size={21} className="text-muted" />
      )}
    </div>
  );
}

// ==========================================
// AVAILABILITY BADGE
// ==========================================

function AvailabilityBadge({ available }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${
        available
          ? "border-green-200 bg-green-50 text-green-700"
          : "border-red-200 bg-red-50 text-red-700"
      }`}
    >
      {available ? <CheckCircle2 size={14} /> : <XCircle size={14} />}

      {available ? "Available" : "Unavailable"}
    </span>
  );
}

// ==========================================
// PRICE DISPLAY
// ==========================================

function PriceDisplay({ product, compact = false }) {
  const pricing = getBasePrice(product);

  return (
    <div className="min-w-0">
      <p
        className={`whitespace-nowrap font-bold ${
          compact ? "text-sm text-secondary" : "text-sm text-primary"
        }`}
      >
        {money(pricing.price)}
      </p>

      {pricing.original !== null && (
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted line-through">
            {money(pricing.original)}
          </span>

          {pricing.discount > 0 && (
            <span className="rounded-md bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-600">
              -{pricing.discount}%
            </span>
          )}
        </div>
      )}

      {product.variantsEnabled === true && (
        <p className="mt-1 text-[10px] font-medium text-muted">
          Base price · Variants available
        </p>
      )}
    </div>
  );
}

// ==========================================
// PRODUCT LABELS
// ==========================================

function ProductLabels({ product }) {
  return (
    <div className="mt-1.5 flex flex-wrap gap-1">
      {product.customizable === true && (
        <span className="inline-flex rounded-md bg-secondary/10 px-2 py-0.5 text-[10px] font-medium text-secondary">
          Customizable
        </span>
      )}

      {product.variantsEnabled === true && (
        <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">
          <Layers3 size={11} />
          Variants
        </span>
      )}
    </div>
  );
}

// ==========================================
// MAIN ADMIN PRODUCTS PAGE
// ==========================================

export default function AdminProductsPage() {
  const navigate = useNavigate();

  const queryClient = useQueryClient();

  // ========================================
  // AUTHORIZATION
  // ========================================

  const auth = useContext(AuthContext) || {};

  const { user, loading: authLoading } = auth;

  const role = auth.role ?? auth.roleState?.role;

  const accountStatus = auth.accountStatus ?? auth.roleState?.status;

  const roleLoading = auth.roleLoading ?? auth.roleState?.checking ?? false;

  const checking = Boolean(authLoading || (user && roleLoading));

  const isAdmin =
    !checking &&
    Boolean(user) &&
    role === "admin" &&
    accountStatus === "active";

  // ========================================
  // FILTER STATE
  // ========================================

  const [search, setSearch] = useState("");

  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [status, setStatus] = useState("all");

  const [category, setCategory] = useState("all");

  const [sort, setSort] = useState("newest");

  const [page, setPage] = useState(1);

  // ========================================
  // ACTION STATE
  // ========================================

  const [updatingId, setUpdatingId] = useState(null);

  const [deletingId, setDeletingId] = useState(null);

  const busy = Boolean(updatingId || deletingId);

  // ========================================
  // DEBOUNCED SEARCH
  // ========================================

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim().slice(0, 100));
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  // ========================================
  // GET CATEGORIES
  //
  // GET /categories
  // ========================================

  const categoriesQuery = useQuery({
    queryKey: ["catalogCategories"],

    enabled: isAdmin,

    queryFn: async ({ signal }) => {
      const res = await fetch(`${API_URL}/categories`, {
        signal,

        headers: {
          Accept: "application/json",
        },
      });

      const result = await res.json().catch(() => ({}));

      if (
        !res.ok ||
        result.success !== true ||
        !Array.isArray(result.categories)
      ) {
        throw new Error(result.message || "Category list load failed");
      }

      return result.categories;
    },

    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const categories = Array.isArray(categoriesQuery.data)
    ? categoriesQuery.data
    : [];

  const categoryMap = Object.fromEntries(
    categories.map((item) => [item.id, item.name]),
  );

  // ========================================
  // GET ADMIN PRODUCTS
  //
  // GET /admin/products
  // ========================================

  const productQuery = useQuery({
    queryKey: [
      "adminProducts",
      user?.uid,
      debouncedSearch,
      status,
      category,
      sort,
      page,
    ],

    enabled: isAdmin,

    queryFn: ({ signal }) => {
      const params = new URLSearchParams({
        search: debouncedSearch,
        status,
        category,
        sort,
        page: String(page),
        limit: String(PAGE_SIZE),
      });

      return adminProductRequest(user, `/admin/products?${params}`, { signal });
    },

    staleTime: 10_000,
    refetchOnWindowFocus: true,
    retry: 1,
  });

  // ========================================
  // BACKEND RESPONSE
  // ========================================

  const data = productQuery.data || {};

  const products = Array.isArray(data.products) ? data.products : [];

  const stats = data.stats || {};

  const pagination = data.pagination || {};

  const total = Number(pagination.total) || 0;

  const totalPages = Math.max(1, Number(pagination.totalPages) || 1);

  const currentPage = Math.max(1, Number(pagination.page) || page);

  const start = total ? (currentPage - 1) * PAGE_SIZE + 1 : 0;

  const end = Math.min(currentPage * PAGE_SIZE, total);

  // ========================================
  // PAGINATION NUMBERS
  // ========================================

  const pageNumbers = Array.from(
    {
      length: Math.min(5, totalPages),
    },
    (_, index) => {
      const first = Math.max(1, Math.min(page - 2, totalPages - 4));

      return first + index;
    },
  );

  // ========================================
  // INVALIDATE PRODUCT CACHES
  // ========================================

  async function refreshRelated() {
    await Promise.all(
      [
        ["adminProducts"],
        ["products"],
        ["shopProducts"],
        ["featuredProducts"],
      ].map((queryKey) =>
        queryClient.invalidateQueries({
          queryKey,
        }),
      ),
    );
  }

  // ========================================
  // UPDATE AVAILABILITY
  //
  // PATCH /admin/products/:id/availability
  // ========================================

  async function toggleAvailability(product, available) {
    if (busy || !product?._id || product.available === available) {
      return;
    }

    setUpdatingId(product._id);

    try {
      await adminProductRequest(
        user,
        `/admin/products/${encodeURIComponent(product._id)}/availability`,
        {
          method: "PATCH",

          body: {
            available,
          },
        },
      );

      await refreshRelated();

      toast(
        "success",
        available
          ? "প্রোডাক্ট Available করা হয়েছে!"
          : "প্রোডাক্ট Unavailable করা হয়েছে!",
      );
    } catch (error) {
      toast("error", error.message || "Availability update failed");
    } finally {
      setUpdatingId(null);
    }
  }

  // ========================================
  // DELETE PRODUCT
  //
  // DELETE /admin/products/:id
  // ========================================

  async function handleDelete(product) {
    if (busy || !product?._id) {
      return;
    }

    const safeName = String(product.name || "Product")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");

    const answer = await Swal.fire({
      title: "প্রোডাক্ট ডিলিট করবেন?",

      html: `<strong>${safeName}</strong><br/>এই প্রোডাক্ট স্থায়ীভাবে মুছে যাবে।`,

      icon: "warning",

      showCancelButton: true,

      confirmButtonText: "হ্যাঁ, ডিলিট করুন",

      cancelButtonText: "বাতিল",

      confirmButtonColor: "#DC2626",
      cancelButtonColor: "#76258A",
    });

    if (!answer.isConfirmed) {
      return;
    }

    setDeletingId(product._id);

    try {
      await adminProductRequest(
        user,
        `/admin/products/${encodeURIComponent(product._id)}`,
        {
          method: "DELETE",
        },
      );

      // Last product deleted on current page
      if (products.length === 1 && page > 1) {
        setPage((current) => Math.max(1, current - 1));
      }

      await refreshRelated();

      toast("success", "প্রোডাক্ট সফলভাবে ডিলিট হয়েছে!");
    } catch (error) {
      toast("error", error.message || "Product delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  // ========================================
  // RESET FILTERS
  // ========================================

  function resetFilters() {
    setSearch("");
    setDebouncedSearch("");
    setStatus("all");
    setCategory("all");
    setSort("newest");
    setPage(1);
  }

  // ========================================
  // STATUS TABS
  // ========================================

  const tabs = [
    {
      id: "all",
      label: "সব প্রোডাক্ট",
      count: stats.total,
    },
    {
      id: "available",
      label: "Available",
      count: stats.available,
    },
    {
      id: "unavailable",
      label: "Unavailable",
      count: stats.unavailable,
    },
    {
      id: "featured",
      label: "Featured",
      count: stats.featured,
    },
  ];

  // ========================================
  // AUTH LOADING
  // ========================================

  if (checking) {
    return (
      <div className="flex min-h-80 items-center justify-center">
        <LoaderCircle size={30} className="animate-spin text-secondary" />
      </div>
    );
  }

  // ========================================
  // ACCESS DENIED
  // ========================================

  if (!isAdmin) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
        <ShieldCheck size={30} className="mx-auto text-red-500" />

        <p className="mt-3 text-sm font-bold text-red-700">
          এই পেজটি শুধু Active Admin-এর জন্য।
        </p>
      </div>
    );
  }

  // ========================================
  // MAIN PAGE
  // ========================================

  return (
    <div className="mx-auto max-w-[1600px] space-y-5 pb-10">
      {/* ==================================
          ORIGINAL PURPLE / GOLD HEADER
      ================================== */}

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-[#4b1558] to-secondary p-5 text-white shadow-md sm:p-6">
        <div className="absolute -right-10 -top-14 size-44 rounded-full bg-white/5" />

        <div className="absolute bottom-0 right-32 size-24 rounded-full bg-gold-soft/10 blur-xl" />

        <div className="relative flex flex-wrap items-center justify-between gap-5">
          <div>
            <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-gold-soft">
              <Layers3 size={14} />
              Catalog Management
            </span>

            <h1 className="text-xl font-bold sm:text-2xl">
              প্রোডাক্ট ম্যানেজমেন্ট
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-white/80">
              আপনার স্টোরের প্রোডাক্ট, মূল্য, availability এবং featured
              collection পরিচালনা করুন।
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/admin/products/add")}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold-soft px-5 py-3 text-sm font-bold text-primary shadow-sm transition hover:bg-[#ffe990]"
          >
            <Plus size={18} />
            নতুন প্রোডাক্ট যোগ করুন
          </button>
        </div>
      </div>

      {/* ==================================
          FOUR KPI CARDS
      ================================== */}

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard
          title="মোট প্রোডাক্ট"
          note="Total Products"
          value={stats.total}
          icon={Package}
          iconClass="bg-secondary/10 text-secondary"
        />

        <StatCard
          title="Available"
          note="ক্রয়যোগ্য প্রোডাক্ট"
          value={stats.available}
          icon={CheckCircle2}
          iconClass="bg-green-50 text-green-700"
        />

        <StatCard
          title="Unavailable"
          note="ক্রয়যোগ্য নয়"
          value={stats.unavailable}
          icon={XCircle}
          iconClass="bg-red-50 text-red-600"
        />

        <StatCard
          title="Featured"
          note="বিশেষভাবে নির্বাচিত"
          value={stats.featured}
          icon={Star}
          iconClass="bg-amber-50 text-amber-700"
        />
      </div>

      {/* ==================================
          PRODUCT LIST
      ================================== */}

      <section className="overflow-hidden rounded-2xl border border-base-300/80 bg-white shadow-sm">
        {/* SECTION TITLE */}

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-base-300 p-4 sm:p-5">
          <div>
            <h2 className="text-base font-bold text-primary">
              প্রোডাক্ট তালিকা
            </h2>

            <p className="mt-1 text-xs text-muted">
              সার্চ, ফিল্টার ও প্রোডাক্টের তথ্য পরিচালনা
            </p>
          </div>

          <div className="flex items-center gap-3">
            {productQuery.isFetching && (
              <LoaderCircle size={17} className="animate-spin text-secondary" />
            )}

            <button
              type="button"
              onClick={() => productQuery.refetch()}
              disabled={productQuery.isFetching || busy}
              className="inline-flex items-center gap-2 rounded-lg border border-base-300 px-3 py-2 text-sm font-medium text-secondary hover:bg-base-200 disabled:opacity-50"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>

        {/* ==================================
            STATUS TABS
        ================================== */}

        <div className="flex gap-2 overflow-x-auto border-b border-base-300 px-4 py-3 sm:px-5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              aria-pressed={status === tab.id}
              onClick={() => {
                setStatus(tab.id);
                setPage(1);
              }}
              className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                status === tab.id
                  ? "bg-primary text-white"
                  : "bg-base-200 text-primary/70 hover:bg-secondary/10"
              }`}
            >
              {tab.label}

              <span
                className={`rounded-md px-2 py-0.5 text-xs ${
                  status === tab.id
                    ? "bg-white/20 text-white"
                    : "bg-white text-secondary"
                }`}
              >
                {bn(tab.count)}
              </span>
            </button>
          ))}
        </div>

        {/* ==================================
            SEARCH + FILTERS
        ================================== */}

        <div className="grid gap-3 border-b border-base-300 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-[minmax(0,1fr)_220px_190px_auto]">
          {/* SEARCH */}

          <label className="flex h-11 min-w-0 items-center gap-2 rounded-xl border border-base-300 bg-base-200 px-3 focus-within:border-secondary focus-within:bg-white">
            <Search size={19} className="shrink-0 text-secondary" />

            <input
              type="search"
              maxLength={100}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="বাংলা, English, Banglish, SKU..."
              className="min-w-0 flex-1 bg-transparent text-sm text-primary outline-none placeholder:text-muted"
            />
          </label>

          {/* CATEGORY */}

          <select
            aria-label="Product category"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className="h-11 min-w-0 rounded-xl border border-base-300 bg-base-200 px-3 text-sm text-primary outline-none focus:border-secondary"
          >
            <option value="all">সব ক্যাটাগরি</option>

            {categories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>

          {/* SORTING */}

          <label className="flex h-11 items-center gap-2 rounded-xl border border-base-300 bg-base-200 px-3">
            <ArrowUpDown size={16} className="shrink-0 text-secondary" />

            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
              className="w-full min-w-0 bg-transparent text-sm text-primary outline-none"
            >
              <option value="newest">Newest First</option>

              <option value="oldest">Oldest First</option>

              <option value="price_low">Price: Low to High</option>

              <option value="price_high">Price: High to Low</option>

              <option value="name">Name A–Z</option>
            </select>
          </label>

          {/* RESET */}

          <button
            type="button"
            onClick={resetFilters}
            className="flex h-11 items-center justify-center gap-2 rounded-xl border border-secondary/20 bg-secondary/5 px-4 text-sm font-semibold text-secondary transition hover:bg-secondary/10"
          >
            <RefreshCw size={16} />
            Reset
          </button>
        </div>

        {/* ==================================
            RESULTS INFO
        ================================== */}

        <div className="flex flex-wrap items-center justify-between gap-2 bg-[#faf7fc] px-4 py-3 sm:px-5">
          <p className="text-sm text-primary">
            মোট ফলাফল:{" "}
            <span className="font-bold text-secondary">{bn(total)}টি</span>
          </p>

          <span className="text-xs text-muted">
            প্রতি পেজে {bn(PAGE_SIZE)}টি প্রোডাক্ট
          </span>
        </div>

        {/* CATEGORY ERROR */}

        {categoriesQuery.isError && (
          <div className="mx-4 mt-3 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
            <AlertTriangle size={15} className="mt-0.5 shrink-0" />
            Category list লোড হয়নি।
            <button
              type="button"
              onClick={() => categoriesQuery.refetch()}
              className="font-bold underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* ==================================
            LOADING
        ================================== */}

        {productQuery.isPending && (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3">
            <LoaderCircle size={32} className="animate-spin text-secondary" />

            <p className="text-sm text-muted">প্রোডাক্ট লোড হচ্ছে...</p>
          </div>
        )}

        {/* ==================================
            ERROR
        ================================== */}

        {productQuery.isError && !productQuery.isPending && (
          <div
            role="alert"
            className="flex min-h-64 flex-col items-center justify-center gap-3 px-4 text-center"
          >
            <XCircle size={34} className="text-red-500" />

            <p className="text-sm font-semibold text-red-600">
              {productQuery.error?.message || "প্রোডাক্ট লোড করা যায়নি"}
            </p>

            <button
              type="button"
              onClick={() => productQuery.refetch()}
              className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-white"
            >
              আবার চেষ্টা করুন
            </button>
          </div>
        )}

        {/* ==================================
            PRODUCT RESULTS
        ================================== */}

        {!productQuery.isPending && !productQuery.isError && (
          <>
            {/* =============================
                  DESKTOP TABLE
              ============================= */}

            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[1010px] border-collapse text-left">
                <thead className="bg-[#f3ecf6]">
                  <tr className="text-xs font-bold text-primary">
                    <th className="px-4 py-4">প্রোডাক্ট</th>

                    <th className="px-4 py-4">ক্যাটাগরি</th>

                    <th className="px-4 py-4">মূল্য</th>

                    <th className="px-4 py-4">Availability</th>

                    <th className="px-4 py-4">Featured</th>

                    <th className="px-4 py-4">তারিখ</th>

                    <th className="px-4 py-4 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {products.map((product, index) => (
                    <tr
                      key={product._id}
                      className={`border-b border-base-300/60 transition hover:bg-secondary/5 ${
                        index % 2 ? "bg-[#fbf8fc]" : "bg-white"
                      }`}
                    >
                      {/* PRODUCT */}

                      <td className="px-4 py-4">
                        <div className="flex min-w-[230px] items-center gap-3">
                          <ProductImage product={product} />

                          <div className="min-w-0">
                            <p className="line-clamp-2 max-w-64 text-sm font-bold text-primary">
                              {product.name}
                            </p>

                            <p className="mt-1 text-xs text-muted">
                              SKU: {product.sku || "—"}
                            </p>

                            <ProductLabels product={product} />
                          </div>
                        </div>
                      </td>

                      {/* CATEGORY */}

                      <td className="px-4 py-4 text-sm text-primary">
                        {categoryMap[product.categoryId] ||
                          product.categoryId ||
                          "—"}
                      </td>

                      {/* PRICE */}

                      <td className="px-4 py-4">
                        <PriceDisplay product={product} />
                      </td>

                      {/* AVAILABILITY */}

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={product.available === true}
                            disabled={busy}
                            onChange={(e) =>
                              toggleAvailability(product, e.target.checked)
                            }
                            aria-label={`Availability for ${product.name}`}
                            className="toggle toggle-sm toggle-success"
                          />

                          {updatingId === product._id ? (
                            <LoaderCircle
                              size={15}
                              className="animate-spin text-secondary"
                            />
                          ) : (
                            <AvailabilityBadge
                              available={product.available === true}
                            />
                          )}
                        </div>
                      </td>

                      {/* FEATURED */}

                      <td className="px-4 py-4">
                        {product.featured === true ? (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-gold-soft/50 px-2.5 py-1.5 text-xs font-semibold text-primary">
                            <Star size={14} />
                            Featured
                          </span>
                        ) : (
                          <span className="text-sm text-muted">—</span>
                        )}
                      </td>

                      {/* DATE */}

                      <td className="whitespace-nowrap px-4 py-4 text-xs text-muted">
                        {formatDate(product.createdAt)}
                      </td>

                      {/* ACTIONS */}

                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              navigate(
                                `/admin/products/edit/${encodeURIComponent(
                                  product._id,
                                )}`,
                              )
                            }
                            className="inline-flex items-center gap-1.5 rounded-lg bg-secondary/10 px-3 py-2 text-sm font-medium text-secondary transition hover:bg-secondary hover:text-white disabled:opacity-50"
                          >
                            <Pencil size={15} />
                            Edit
                          </button>

                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleDelete(product)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-600 hover:text-white disabled:opacity-50"
                          >
                            {deletingId === product._id ? (
                              <LoaderCircle
                                size={15}
                                className="animate-spin"
                              />
                            ) : (
                              <Trash2 size={15} />
                            )}
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* =============================
                  MOBILE / TABLET CARDS
              ============================= */}

            <div className="space-y-3 p-3 lg:hidden">
              {products.map((product) => (
                <article
                  key={product._id}
                  className="rounded-xl border border-base-300 bg-white p-4 shadow-sm"
                >
                  {/* PRODUCT HEADER */}

                  <div className="flex items-start gap-3">
                    <ProductImage product={product} />

                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-bold text-primary">
                        {product.name}
                      </p>

                      <p className="mt-1 text-xs text-muted">
                        SKU: {product.sku || "—"}
                      </p>

                      <p className="mt-1 text-xs text-muted">
                        {categoryMap[product.categoryId] ||
                          product.categoryId ||
                          "—"}
                      </p>

                      {/* PRICE */}

                      <div className="mt-2">
                        <PriceDisplay product={product} compact />
                      </div>

                      {/* LABELS */}

                      <ProductLabels product={product} />
                    </div>
                  </div>

                  {/* AVAILABILITY */}

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-base-200 p-3">
                    <AvailabilityBadge available={product.available === true} />

                    <input
                      type="checkbox"
                      checked={product.available === true}
                      disabled={busy}
                      onChange={(e) =>
                        toggleAvailability(product, e.target.checked)
                      }
                      className="toggle toggle-sm toggle-success"
                      aria-label={`Availability for ${product.name}`}
                    />
                  </div>

                  {/* FEATURED */}

                  {product.featured === true && (
                    <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-secondary">
                      <Star size={14} />
                      Featured Product
                    </p>
                  )}

                  {/* ACTIONS */}

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        navigate(
                          `/admin/products/edit/${encodeURIComponent(
                            product._id,
                          )}`,
                        )
                      }
                      className="flex items-center justify-center gap-2 rounded-lg bg-secondary/10 px-3 py-2.5 text-sm font-medium text-secondary disabled:opacity-50"
                    >
                      <Pencil size={16} />
                      Edit
                    </button>

                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleDelete(product)}
                      className="flex items-center justify-center gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-600 disabled:opacity-50"
                    >
                      {deletingId === product._id ? (
                        <LoaderCircle size={16} className="animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>

            {/* =============================
                  EMPTY STATE
              ============================= */}

            {products.length === 0 && (
              <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
                <span className="flex size-16 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
                  <Package size={30} />
                </span>

                <p className="mt-4 text-base font-bold text-primary">
                  কোনো প্রোডাক্ট পাওয়া যায়নি
                </p>

                <p className="mt-2 text-sm text-muted">
                  সার্চ বা ফিল্টার পরিবর্তন করে দেখুন।
                </p>

                {page > totalPages ? (
                  <button
                    type="button"
                    onClick={() => setPage(totalPages)}
                    className="mt-4 rounded-lg bg-secondary px-4 py-2.5 text-sm font-medium text-white"
                  >
                    শেষ পেজে যান
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="mt-4 rounded-lg bg-secondary px-4 py-2.5 text-sm font-medium text-white"
                  >
                    ফিল্টার রিসেট করুন
                  </button>
                )}
              </div>
            )}

            {/* =============================
                  PAGINATION
              ============================= */}

            {total > 0 && (
              <div className="flex flex-col gap-3 border-t border-base-300 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <p className="text-sm text-muted">
                  {bn(start)}
                  {" – "}
                  {bn(end)}
                  {" / "}
                  {bn(total)}
                  টি প্রোডাক্ট
                </p>

                <div className="flex flex-wrap items-center gap-1.5">
                  {/* PREVIOUS */}

                  <button
                    type="button"
                    aria-label="Previous page"
                    disabled={page <= 1 || busy || productQuery.isFetching}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="flex size-9 items-center justify-center rounded-lg border border-base-300 text-primary hover:bg-base-200 disabled:opacity-40"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  {/* PAGE NUMBERS */}

                  {pageNumbers.map((number, index) => (
                    <div key={number} className="flex items-center gap-1.5">
                      {index > 0 && number - pageNumbers[index - 1] > 1 && (
                        <span className="px-1 text-sm text-muted">...</span>
                      )}

                      <button
                        type="button"
                        disabled={busy || productQuery.isFetching}
                        onClick={() => setPage(number)}
                        aria-current={page === number ? "page" : undefined}
                        className={`flex size-9 items-center justify-center rounded-lg text-sm font-semibold transition disabled:opacity-50 ${
                          page === number
                            ? "bg-secondary text-white"
                            : "bg-base-200 text-primary hover:bg-secondary/10"
                        }`}
                      >
                        {number}
                      </button>
                    </div>
                  ))}

                  {/* NEXT */}

                  <button
                    type="button"
                    aria-label="Next page"
                    disabled={
                      page >= totalPages || busy || productQuery.isFetching
                    }
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="flex size-9 items-center justify-center rounded-lg border border-base-300 text-primary hover:bg-base-200 disabled:opacity-40"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* ==================================
          PRODUCT VARIANT INFORMATION
      ================================== */}

      <p className="flex items-start gap-2 text-[11px] leading-5 text-muted">
        <Tag size={14} className="mt-0.5 shrink-0" />
        Variant-enabled product-এর এখানে Base Price দেখানো হয়। Variant-এর আলাদা
        Price, Availability এবং Featured সেটিংস Edit Product Page থেকে পরিবর্তন
        করুন।
      </p>
    </div>
  );
}
