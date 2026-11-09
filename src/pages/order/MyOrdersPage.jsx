import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getAuth, onAuthStateChanged } from "firebase/auth";

import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleX,
  Clock3,
  Eye,
  ImageOff,
  ListFilter,
  Loader2,
  LockKeyhole,
  LogIn,
  PackageCheck,
  PackageSearch,
  ReceiptText,
  RefreshCw,
  Search,
  ShoppingBag,
  Truck,
  X,
} from "lucide-react";

import {
  getRecentGuestOrderId,
  getGuestOrderToken,
  orderRequest,
  getOrderPath,
  money,
  PAYMENT_NAMES,
} from "../../utils/orderApi";

import { app } from "../../../firebase/firebase.config";

const auth = getAuth(app);

// ============================================
// STATUS CONFIGURATION
// ============================================

const ORDER_STATUS = {
  pending: {
    label: "পেন্ডিং",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  verified: {
    label: "ভেরিফাইড",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  processing: {
    label: "প্রসেসিং",
    className: "border-blue-200 bg-blue-50 text-blue-700",
  },
  shipped: {
    label: "শিপড",
    className: "border-violet-200 bg-violet-50 text-violet-700",
  },
  delivered: {
    label: "ডেলিভার্ড",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  rejected: {
    label: "রিজেক্টেড",
    className: "border-red-200 bg-red-50 text-red-700",
  },
  cancelled: {
    label: "বাতিল",
    className: "border-red-200 bg-red-50 text-red-700",
  },
};

const PAYMENT_STATUS = {
  pending: {
    label: "Verification Pending",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },

  cod_pending: {
    label: "COD Pending",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },

  // NEW BACKEND PAYMENT STATUS
  cod_collected: {
    label: "COD Collected",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },

  partially_paid: {
    label: "Partially Paid",
    className: "border-blue-200 bg-blue-50 text-blue-700",
  },

  verified: {
    label: "Payment Verified",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },

  rejected: {
    label: "Payment Rejected",
    className: "border-red-200 bg-red-50 text-red-700",
  },
};

// ============================================
// HELPERS
// ============================================

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("bn-BD", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

// ============================================
// STATUS BADGE
// ============================================

function StatusBadge({ status, type = "order" }) {
  const config =
    type === "payment" ? PAYMENT_STATUS[status] : ORDER_STATUS[status];

  return (
    <span
      className={`inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold leading-4 sm:text-[11px] ${
        config?.className || "border-base-300 bg-base-200 text-muted"
      }`}
    >
      <span className="size-1.5 shrink-0 rounded-full bg-current" />

      <span className="break-words">
        {config?.label || status || "Unknown"}
      </span>
    </span>
  );
}

// ============================================
// STATISTIC CARD
// ============================================

function StatisticCard({ icon: Icon, label, value, description }) {
  return (
    <div className="section-card min-w-0 p-3 sm:p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 text-xs font-medium leading-5 text-muted">
          {label}
        </p>

        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
          <Icon size={17} />
        </span>
      </div>

      <p className="mt-2 text-2xl font-bold tabular-nums text-primary">
        {value}
      </p>

      <p className="mt-1 text-[11px] leading-5 text-muted">{description}</p>
    </div>
  );
}

// ============================================
// PRODUCT PREVIEW
// ============================================

function ProductPreview({ order }) {
  const products = Array.isArray(order.previewItems) ? order.previewItems : [];

  const count = Number(order.itemCount) || 0;

  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <div className="flex shrink-0 items-center">
        {products.slice(0, 2).map((product, index) => (
          <div
            key={`${product.name}-${index}`}
            className={`size-10 overflow-hidden rounded-lg border-2 border-base-100 bg-base-200 ${
              index > 0 ? "-ml-2" : ""
            }`}
          >
            {product.image ? (
              <img
                src={product.image}
                alt={product.name || "Product"}
                loading="lazy"
                className="size-full object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center text-muted">
                <ImageOff size={16} />
              </div>
            )}
          </div>
        ))}

        {products.length === 0 && (
          <div className="flex size-10 items-center justify-center rounded-lg bg-base-200 text-secondary">
            <ShoppingBag size={17} />
          </div>
        )}
      </div>

      <div className="min-w-0">
        <p className="max-w-48 truncate text-xs font-semibold text-primary">
          {products[0]?.name || "অর্ডারের পণ্য"}
        </p>

        <p className="mt-1 text-[11px] text-muted">মোট {count} পিস</p>
      </div>
    </div>
  );
}

// ============================================
// MOBILE ORDER CARD
// ============================================

function MobileOrderCard({ order }) {
  const detailPath = getOrderPath(order);

  return (
    <article className="rounded-2xl border-2 border-dashed border-secondary/25 bg-base-100 p-3 sm:p-4">
      {/* ORDER HEADER */}

      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <Link
            to={detailPath}
            className="break-all text-sm font-bold text-primary hover:text-secondary"
          >
            #{order.orderNumber}
          </Link>

          <p className="mt-1 flex items-center gap-1.5 text-[11px] text-muted">
            <CalendarDays size={12} />
            {formatDate(order.createdAt)}
          </p>
        </div>

        <StatusBadge status={order.status} />
      </div>

      {/* PRODUCT PREVIEW */}

      <div className="mt-3 rounded-xl bg-base-200/50 p-3">
        <ProductPreview order={order} />
      </div>

      {/* PAYMENT + TOTAL */}

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="min-w-0">
          <p className="text-[11px] text-muted">সর্বমোট মূল্য</p>

          <p className="mt-1 whitespace-nowrap text-base font-bold text-primary">
            {money(order.total)}
          </p>
        </div>

        <div className="min-w-0">
          <p className="text-[11px] text-muted">পেমেন্ট পদ্ধতি</p>

          <p className="mt-1 break-words text-xs font-semibold text-primary">
            {PAYMENT_NAMES[order.payment?.method] ||
              order.payment?.method ||
              "—"}
          </p>
        </div>
      </div>

      {/* PAYMENT BADGE */}

      <div className="mt-3">
        <StatusBadge status={order.payment?.status} type="payment" />
      </div>

      {/* ACTION */}

      <div className="mt-3 border-t border-base-300/60 pt-3">
        <Link
          to={detailPath}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-primary"
        >
          <Eye size={15} />
          অর্ডার বিস্তারিত দেখুন
          <ArrowRight size={15} />
        </Link>
      </div>
    </article>
  );
}

// ============================================
// MAIN MY ORDERS PAGE
// ============================================

export default function MyOrdersPage() {
  const navigate = useNavigate();

  // ==========================================
  // FIREBASE AUTH STATE
  // ==========================================

  const [authState, setAuthState] = useState({
    ready: false,
    user: null,
  });

  // ==========================================
  // FILTER STATE
  // ==========================================

  const [searchInput, setSearchInput] = useState("");

  const [search, setSearch] = useState("");

  const [status, setStatus] = useState("all");

  const [paymentStatus, setPaymentStatus] = useState("all");

  const [page, setPage] = useState(1);

  // ==========================================
  // AUTH INITIALIZATION
  // ==========================================

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthState({
        ready: true,
        user,
      });
    });

    return unsubscribe;
  }, []);

  const uid = authState.user?.uid;

  // ==========================================
  // GUEST RECENT ORDER REDIRECT
  //
  // Only redirect when a saved guest
  // access token is available.
  // ==========================================

  useEffect(() => {
    if (!authState.ready || authState.user) {
      return;
    }

    const recentOrderId = getRecentGuestOrderId();

    const guestAccessToken = recentOrderId
      ? getGuestOrderToken(recentOrderId)
      : "";

    if (!recentOrderId || !guestAccessToken) {
      return;
    }

    const controller = new AbortController();

    const redirectToRecentOrder = async () => {
      try {
        const response = await orderRequest(
          `/orders/${encodeURIComponent(recentOrderId)}`,
          {
            orderId: recentOrderId,

            accessToken: guestAccessToken,

            signal: controller.signal,
          },
        );

        if (!controller.signal.aborted && response.order) {
          navigate(getOrderPath(response.order), {
            replace: true,

            state: {
              guestAccessToken,
            },
          });
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Recent guest order lookup failed:", error);
        }
      }
    };

    redirectToRecentOrder();

    return () => controller.abort();
  }, [authState.ready, authState.user, navigate]);

  // ==========================================
  // FETCH CUSTOMER ORDERS
  // ==========================================

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: ["my-orders", uid, page, status, paymentStatus, search],

    enabled: authState.ready && Boolean(uid),

    queryFn: async ({ signal }) => {
      const params = new URLSearchParams();

      params.set("page", String(page));

      if (status !== "all") {
        params.set("status", status);
      }

      if (paymentStatus !== "all") {
        params.set("paymentStatus", paymentStatus);
      }

      if (search) {
        params.set("search", search);
      }

      return orderRequest(`/orders/my?${params.toString()}`, { signal });
    },

    staleTime: 15 * 1000,
    refetchOnWindowFocus: true,
    retry: 1,
  });

  // ==========================================
  // NORMALIZE BACKEND RESPONSE
  // ==========================================

  const orders = Array.isArray(data?.orders) ? data.orders : [];

  const pagination = data?.pagination || {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  };

  const stats = data?.stats || {
    total: 0,
    pending: 0,
    verified: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
  };

  const totalPages = Number(pagination.totalPages || 0);

  // ==========================================
  // SEARCH
  // ==========================================

  const handleSearch = (event) => {
    event.preventDefault();

    setPage(1);

    setSearch(searchInput.trim().replace(/^#/, ""));
  };

  const resetFilters = () => {
    setSearchInput("");
    setSearch("");

    setStatus("all");
    setPaymentStatus("all");
    setPage(1);
  };

  const hasFilters =
    search !== "" || status !== "all" || paymentStatus !== "all";

  // ==========================================
  // PAGINATION NUMBERS
  // ==========================================

  const pageNumbers = (() => {
    if (totalPages <= 0) {
      return [];
    }

    const start = Math.max(1, Math.min(page - 2, Math.max(1, totalPages - 4)));

    const end = Math.min(totalPages, start + 4);

    return Array.from(
      {
        length: end - start + 1,
      },
      (_, index) => start + index,
    );
  })();

  // ==========================================
  // AUTH LOADING
  // ==========================================

  if (!authState.ready) {
    return (
      <main className="page-bg flex min-h-[65vh] items-center justify-center">
        <div className="text-center">
          <Loader2 size={28} className="mx-auto animate-spin text-secondary" />

          <p className="mt-3 text-sm text-muted">অ্যাকাউন্ট যাচাই হচ্ছে...</p>
        </div>
      </main>
    );
  }

  // ==========================================
  // GUEST / NOT LOGGED IN
  // ==========================================

  if (!authState.user) {
    return (
      <main className="page-bg flex min-h-[70vh] items-center justify-center px-4">
        <div className="section-card w-full max-w-md p-6 text-center sm:p-8">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-secondary/10 text-secondary">
            <LockKeyhole size={27} />
          </div>

          <h1 className="mt-5 text-xl font-bold text-primary">
            আপনার অর্ডার হিস্ট্রি
          </h1>

          <p className="mt-3 text-sm leading-6 text-muted">
            আপনার অ্যাকাউন্টে করা অর্ডারগুলো দেখতে লগইন করুন। Guest হিসেবে করা
            অর্ডার আলাদাভাবে ট্র্যাক করা যাবে।
          </p>

          <Link to="/login" className="btn-brand mt-5 w-full rounded-xl">
            <LogIn size={16} />
            লগইন করুন
            <ArrowRight size={16} />
          </Link>

          <Link
            to="/track-order"
            className="btn-outline-brand mt-3 w-full rounded-xl"
          >
            <PackageSearch size={16} />
            Guest Order Track করুন
          </Link>
        </div>
      </main>
    );
  }

  // ==========================================
  // MAIN PAGE UI
  // ==========================================

  return (
    <main className="page-bg min-h-screen">
      <div className="page-container pb-12 pt-7 sm:pt-10">
        {/* ====================================
            BREADCRUMB
        ==================================== */}

        <nav
          aria-label="Breadcrumb"
          className="mb-5 flex items-center gap-2 text-xs text-muted"
        >
          <Link to="/" className="hover:text-secondary">
            হোম
          </Link>

          <span>/</span>

          <span className="font-semibold text-secondary">আমার অর্ডারসমূহ</span>
        </nav>

        {/* ====================================
            HEADER
        ==================================== */}

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="badge-soft mb-3">
              <ReceiptText size={13} />
              MY ORDER HISTORY
            </span>

            <h1 className="text-2xl font-bold text-primary sm:text-3xl">
              আমার অর্ডারসমূহ
            </h1>

            <p className="mt-2 text-sm leading-6 text-muted">
              আপনার করা সব অর্ডার, পেমেন্ট ও ডেলিভারি স্ট্যাটাস এক জায়গায় দেখুন।
            </p>
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="btn-outline-brand rounded-xl px-4 py-2.5 text-xs disabled:opacity-50"
          >
            <RefreshCw size={15} className={isFetching ? "animate-spin" : ""} />
            রিফ্রেশ
          </button>
        </div>

        {/* ====================================
            AUTHENTICATED NOTICE
        ==================================== */}

        <div className="mt-5 flex items-start gap-2 rounded-xl border border-secondary/10 bg-secondary/5 p-3">
          <LockKeyhole size={16} className="mt-0.5 shrink-0 text-secondary" />

          <p className="text-xs leading-5 text-muted">
            এখানে শুধু আপনার অ্যাকাউন্টের Order History দেখানো হচ্ছে। অন্য
            Customer-এর Order Data দেখা যাবে না।
          </p>
        </div>

        {/* ====================================
            STATISTICS
        ==================================== */}

        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatisticCard
            icon={ShoppingBag}
            label="মোট অর্ডার"
            value={stats.total}
            description="আপনার সব অর্ডার"
          />

          <StatisticCard
            icon={Clock3}
            label="পেন্ডিং অর্ডার"
            value={stats.pending}
            description="যাচাইয়ের অপেক্ষায়"
          />

          <StatisticCard
            icon={PackageCheck}
            label="ডেলিভার্ড"
            value={stats.delivered}
            description="সফলভাবে ডেলিভারি হয়েছে"
          />

          <StatisticCard
            icon={CircleX}
            label="বাতিল / রিজেক্টেড"
            value={stats.cancelled}
            description="বাতিল বা প্রত্যাখ্যাত"
          />
        </div>

        {/* ====================================
            FILTERS
        ==================================== */}

        <section className="section-card mt-6 p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 font-bold text-primary">
                <ListFilter size={18} className="text-secondary" />
                অর্ডার খুঁজুন
              </h2>

              <p className="mt-1 text-xs text-muted">
                Order Number অথবা Status দিয়ে সার্চ করুন।
              </p>
            </div>

            {hasFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-secondary hover:underline"
              >
                <X size={14} />
                ফিল্টার রিসেট
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
            {/* SEARCH INPUT */}

            <form
              onSubmit={handleSearch}
              className="flex min-w-0 gap-2 md:col-span-5"
            >
              <div className="relative min-w-0 flex-1">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                />

                <input
                  type="search"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  maxLength={60}
                  placeholder="Order Number লিখুন..."
                  className="h-11 w-full min-w-0 rounded-xl border border-base-300 bg-base-200/50 py-2 pl-10 pr-3 text-xs text-primary outline-none focus:border-secondary sm:text-sm"
                />
              </div>

              <button
                type="submit"
                className="flex h-11 shrink-0 items-center justify-center rounded-xl bg-secondary px-4 text-xs font-semibold text-white transition hover:bg-primary"
              >
                সার্চ
              </button>
            </form>

            {/* ORDER STATUS */}

            <div className="md:col-span-4">
              <select
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value);

                  setPage(1);
                }}
                aria-label="Filter by order status"
                className="h-11 w-full rounded-xl border border-base-300 bg-base-200/50 px-3 text-xs text-primary outline-none focus:border-secondary sm:text-sm"
              >
                <option value="all">সব Order Status</option>

                <option value="pending">Pending</option>

                <option value="verified">Verified</option>

                <option value="processing">Processing</option>

                <option value="shipped">Shipped</option>

                <option value="delivered">Delivered</option>

                <option value="rejected">Rejected</option>

                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* PAYMENT STATUS */}

            <div className="md:col-span-3">
              <select
                value={paymentStatus}
                onChange={(event) => {
                  setPaymentStatus(event.target.value);

                  setPage(1);
                }}
                aria-label="Filter by payment status"
                className="h-11 w-full rounded-xl border border-base-300 bg-base-200/50 px-3 text-xs text-primary outline-none focus:border-secondary sm:text-sm"
              >
                <option value="all">সব Payment Status</option>

                <option value="pending">Pending</option>

                <option value="cod_pending">COD Pending</option>

                <option value="cod_collected">COD Collected</option>

                <option value="partially_paid">Partially Paid</option>

                <option value="verified">Verified</option>

                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </section>

        {/* ====================================
            ORDER LIST
        ==================================== */}

        <section className="section-card mt-5 overflow-hidden">
          {/* HEADER */}

          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-base-300/70 bg-base-200/50 px-4 py-4 sm:px-5">
            <div>
              <h2 className="font-bold text-primary">অর্ডার লিস্ট</h2>

              <p className="mt-1 text-xs text-muted">
                মোট {pagination.total}
                টি অর্ডার পাওয়া গেছে
              </p>
            </div>

            {isFetching && (
              <span className="inline-flex items-center gap-2 text-xs text-secondary">
                <Loader2 size={14} className="animate-spin" />
                আপডেট হচ্ছে
              </span>
            )}
          </div>

          {/* ====================================
              LOADING
          ==================================== */}

          {isLoading && (
            <div className="flex min-h-64 flex-col items-center justify-center gap-3">
              <Loader2 size={28} className="animate-spin text-secondary" />

              <p className="text-sm text-muted">
                আপনার অর্ডারগুলো লোড হচ্ছে...
              </p>
            </div>
          )}

          {/* ====================================
              ERROR
          ==================================== */}

          {!isLoading && isError && (
            <div className="px-4 py-14 text-center">
              <CircleX size={32} className="mx-auto text-red-500" />

              <h3 className="mt-4 font-bold text-primary">
                অর্ডার লোড করা যায়নি
              </h3>

              <p className="mt-2 text-sm text-muted">
                {error?.message || "সার্ভারের সঙ্গে যোগাযোগ করা যাচ্ছে না।"}
              </p>

              <button
                type="button"
                onClick={() => refetch()}
                className="btn-brand mt-5"
              >
                <RefreshCw size={16} />
                আবার চেষ্টা করুন
              </button>
            </div>
          )}

          {/* ====================================
              EMPTY STATE
          ==================================== */}

          {!isLoading && !isError && orders.length === 0 && (
            <div className="px-5 py-14 text-center">
              <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                <PackageSearch size={28} />
              </div>

              <h3 className="mt-4 text-lg font-bold text-primary">
                {hasFilters
                  ? "কোনো অর্ডার পাওয়া যায়নি"
                  : "এখনো কোনো অর্ডার করেননি"}
              </h3>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">
                {hasFilters
                  ? "অন্য Order Number বা Status দিয়ে সার্চ করে দেখুন।"
                  : "আপনার প্রথম উপহারটি অর্ডার করুন।"}
              </p>

              {hasFilters ? (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="btn-outline-brand mt-5"
                >
                  <X size={15} />
                  সব অর্ডার দেখুন
                </button>
              ) : (
                <Link to="/shop" className="btn-brand mt-5">
                  <ShoppingBag size={16} />
                  উপহার দেখুন
                  <ArrowRight size={16} />
                </Link>
              )}
            </div>
          )}

          {/* ====================================
              ORDER RESULTS
          ==================================== */}

          {!isLoading && !isError && orders.length > 0 && (
            <>
              {/* ========================
                    DESKTOP TABLE
                ======================== */}

              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[850px] text-left">
                  <thead className="border-b border-base-300/70 bg-base-200/30">
                    <tr className="text-[11px] font-bold uppercase tracking-wide text-muted">
                      <th className="px-4 py-4">Order ID / Date</th>

                      <th className="px-4 py-4">Products</th>

                      <th className="px-4 py-4">Total</th>

                      <th className="px-4 py-4">Payment</th>

                      <th className="px-4 py-4">Order Status</th>

                      <th className="px-4 py-4 text-right">Action</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-base-300/60">
                    {orders.map((order) => (
                      <tr
                        key={order._id}
                        className="transition-colors hover:bg-secondary/5"
                      >
                        {/* ORDER NUMBER */}

                        <td className="px-4 py-4 align-middle">
                          <Link
                            to={getOrderPath(order)}
                            className="block whitespace-nowrap text-xs font-bold text-primary hover:text-secondary"
                          >
                            #{order.orderNumber}
                          </Link>

                          <p className="mt-1.5 flex items-center gap-1.5 whitespace-nowrap text-[11px] text-muted">
                            <CalendarDays size={12} />

                            {formatDate(order.createdAt)}
                          </p>
                        </td>

                        {/* PRODUCTS */}

                        <td className="px-4 py-4 align-middle">
                          <ProductPreview order={order} />
                        </td>

                        {/* TOTAL */}

                        <td className="px-4 py-4 align-middle">
                          <p className="whitespace-nowrap text-sm font-bold tabular-nums text-primary">
                            {money(order.total)}
                          </p>
                        </td>

                        {/* PAYMENT */}

                        <td className="px-4 py-4 align-middle">
                          <div className="space-y-1.5">
                            <p className="text-xs font-semibold text-primary">
                              {PAYMENT_NAMES[order.payment?.method] ||
                                order.payment?.method ||
                                "—"}
                            </p>

                            <StatusBadge
                              status={order.payment?.status}
                              type="payment"
                            />
                          </div>
                        </td>

                        {/* ORDER STATUS */}

                        <td className="px-4 py-4 align-middle">
                          <StatusBadge status={order.status} />
                        </td>

                        {/* ACTION */}

                        <td className="px-4 py-4 text-right align-middle">
                          <Link
                            to={getOrderPath(order)}
                            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-secondary/20 bg-secondary/5 px-3 py-2 text-xs font-semibold text-secondary transition hover:border-secondary hover:bg-secondary hover:text-white"
                          >
                            <Eye size={14} />
                            বিস্তারিত
                            <ArrowRight size={13} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ========================
                    MOBILE / TABLET CARDS
                ======================== */}

              <div className="space-y-3 p-3 lg:hidden">
                {orders.map((order) => (
                  <MobileOrderCard key={order._id} order={order} />
                ))}
              </div>
            </>
          )}

          {/* ====================================
              PAGINATION
          ==================================== */}

          {!isLoading && !isError && totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-base-300/70 bg-base-200/30 px-4 py-4 sm:px-5">
              <p className="text-xs text-muted">
                Page {pagination.page} of {totalPages}
              </p>

              <div className="flex items-center gap-1.5">
                {/* PREVIOUS */}

                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page <= 1 || isFetching}
                  aria-label="Previous page"
                  className="flex size-9 items-center justify-center rounded-lg border border-base-300 bg-base-100 text-primary transition hover:border-secondary hover:text-secondary disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={17} />
                </button>

                {/* PAGE NUMBERS */}

                {pageNumbers.map((number) => (
                  <button
                    key={number}
                    type="button"
                    onClick={() => setPage(number)}
                    disabled={isFetching}
                    aria-label={`Page ${number}`}
                    aria-current={page === number ? "page" : undefined}
                    className={`flex size-9 items-center justify-center rounded-lg border text-xs font-bold transition disabled:opacity-50 ${
                      page === number
                        ? "border-secondary bg-secondary text-white"
                        : "border-base-300 bg-base-100 text-primary hover:border-secondary hover:text-secondary"
                    }`}
                  >
                    {number}
                  </button>
                ))}

                {/* NEXT */}

                <button
                  type="button"
                  onClick={() =>
                    setPage((current) => Math.min(totalPages, current + 1))
                  }
                  disabled={page >= totalPages || isFetching}
                  aria-label="Next page"
                  className="flex size-9 items-center justify-center rounded-lg border border-base-300 bg-base-100 text-primary transition hover:border-secondary hover:text-secondary disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight size={17} />
                </button>
              </div>
            </div>
          )}
        </section>

        {/* ====================================
            FOOTER
        ==================================== */}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 text-sm font-semibold text-secondary hover:underline"
          >
            <ArrowLeft size={16} />
            আরও উপহার দেখুন
          </Link>

          <Link
            to="/track-order"
            className="inline-flex items-center gap-2 text-xs font-semibold text-secondary hover:underline"
          >
            <Truck size={15} />
            Guest Order Tracking
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </main>
  );
}
