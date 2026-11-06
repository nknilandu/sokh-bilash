import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import {
  Search,
  ShoppingBag,
  ClipboardClock,
  Paintbrush,
  Truck,
  Eye,
  CalendarDays,
  RefreshCcw,
  ChevronLeft,
  ChevronRight,
  UserRound,
  ArrowRight,
  AlertCircle,
  ImageOff,
  Loader2,
} from "lucide-react";

import { AuthContext } from "../../providers/AuthProvider";

// ========================================
// CONFIG
// ========================================

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/$/, "");

const PER_PAGE = 10;

const STATUS_MAP = {
  pending: {
    label: "পেন্ডিং",
    color: "bg-amber-50 text-amber-700",
  },
  verified: {
    label: "যাচাইকৃত",
    color: "bg-blue-50 text-blue-700",
  },
  processing: {
    label: "প্রসেসিং",
    color: "bg-purple-50 text-purple-700",
  },
  shipped: {
    label: "শিপড",
    color: "bg-indigo-50 text-indigo-700",
  },
  delivered: {
    label: "ডেলিভার্ড",
    color: "bg-green-50 text-green-700",
  },
  rejected: {
    label: "রিজেক্টেড",
    color: "bg-red-50 text-red-700",
  },
  cancelled: {
    label: "বাতিল",
    color: "bg-red-50 text-red-700",
  },
};

const PAYMENT_MAP = {
  pending: {
    label: "যাচাই বাকি",
    color: "bg-amber-50 text-amber-700",
  },
  partially_paid: {
    label: "আংশিক পরিশোধিত",
    color: "bg-blue-50 text-blue-700",
  },
  verified: {
    label: "ভেরিফাইড",
    color: "bg-green-50 text-green-700",
  },
  rejected: {
    label: "রিজেক্টেড",
    color: "bg-red-50 text-red-700",
  },
  cod_pending: {
    label: "COD বাকি",
    color: "bg-purple-50 text-purple-700",
  },
  cod_collected: {
    label: "COD সংগৃহীত",
    color: "bg-green-50 text-green-700",
  },
};

const METHOD_NAMES = {
  bkash: "bKash",
  nagad: "Nagad",
  rocket: "Rocket",
  cod: "Cash on Delivery",
};

const STATUS_TABS = [
  ["all", "সব অর্ডার"],
  ["pending", "পেন্ডিং"],
  ["verified", "যাচাইকৃত"],
  ["processing", "প্রসেসিং"],
  ["shipped", "শিপড"],
  ["delivered", "ডেলিভার্ড"],
  ["rejected", "রিজেক্টেড"],
  ["cancelled", "বাতিল"],
];

// ========================================
// HELPERS
// ========================================

const money = (value) =>
  `৳${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

function dateText(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("bn-BD", {
    timeZone: "Asia/Dhaka",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getQuantity(order) {
  if (order.itemCount !== undefined && order.itemCount !== null) {
    return Number(order.itemCount) || 0;
  }

  return (order.items || []).reduce(
    (total, item) => total + (Number(item.quantity) || 0),
    0,
  );
}

function getDue(order) {
  return Math.max(
    0,
    Number(
      order.payment?.dueAmount ??
        Number(order.total || 0) - Number(order.payment?.verifiedAmount || 0),
    ) || 0,
  );
}

// ========================================
// AUTHENTICATED API
// ========================================

async function adminRequest(user, path, signal) {
  if (!user) {
    throw new Error("Admin login required");
  }

  const token = await user.getIdToken();

  const response = await fetch(`${API_URL}${path}`, {
    method: "GET",
    signal,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.success !== true) {
    throw new Error(data.message || `Request failed (${response.status})`);
  }

  return data;
}

// ========================================
// STATUS BADGE
// ========================================

function Badge({ value, type = "order" }) {
  const meta = type === "payment" ? PAYMENT_MAP[value] : STATUS_MAP[value];

  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-bold ${
        meta?.color || "bg-base-200 text-muted"
      }`}
      style={{
        borderColor: "color-mix(in srgb, currentColor 10%, transparent)",
      }}
    >
      {meta?.label || value || "—"}
    </span>
  );
}

// ========================================
// PRODUCT THUMBNAIL
// ========================================

function ProductThumb({ product, size = "md" }) {
  const [failedUrl, setFailedUrl] = useState("");

  const image = product?.image || "";

  const sizeClass =
    size === "sm" ? "size-10" : size === "lg" ? "size-16" : "size-12";

  return (
    <div
      className={`flex ${sizeClass} shrink-0 items-center justify-center overflow-hidden rounded-lg border border-base-300 bg-base-200`}
    >
      {image && failedUrl !== image ? (
        <img
          src={image}
          alt={product?.name || "Product"}
          loading="lazy"
          onError={() => setFailedUrl(image)}
          className="h-full w-full object-cover"
        />
      ) : (
        <ImageOff size={size === "sm" ? 16 : 20} className="text-muted" />
      )}
    </div>
  );
}

// ========================================
// CUSTOMER PROFILE AVATAR
// ========================================

function CustomerAvatar({ name, photoUrl }) {
  const [failedUrl, setFailedUrl] = useState("");

  const showPhoto = Boolean(photoUrl) && failedUrl !== photoUrl;

  return (
    <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-secondary/15 bg-secondary/10 text-secondary">
      {showPhoto ? (
        <img
          src={photoUrl}
          alt={name || "Customer"}
          loading="lazy"
          onError={() => setFailedUrl(photoUrl)}
          className="h-full w-full object-cover"
        />
      ) : (
        <UserRound size={19} strokeWidth={1.8} />
      )}
    </div>
  );
}

// ========================================
// PRODUCT PREVIEW
// MY ORDERS STYLE
// ========================================

function OrderProductPreview({ order }) {
  const items = Array.isArray(order.items) ? order.items : [];

  const products = items.slice(0, 2);

  const quantity = getQuantity(order);

  return (
    <div className="flex min-w-0 items-center gap-2.5">
      {/* OVERLAPPING PRODUCT IMAGES */}

      <div className="flex shrink-0 items-center">
        {products.map((product, index) => (
          <div
            key={product.cartId || `${product.productId}-${index}`}
            className={`rounded-lg border-2 border-white ${
              index > 0 ? "-ml-2" : ""
            }`}
          >
            <ProductThumb product={product} size="sm" />
          </div>
        ))}

        {products.length === 0 && (
          <div className="flex size-10 items-center justify-center rounded-lg bg-base-200 text-secondary">
            <ShoppingBag size={17} />
          </div>
        )}
      </div>

      {/* PRODUCT INFORMATION */}

      <div className="min-w-0 flex-1">
        <p
          title={products[0]?.name || ""}
          className="w-[145px] truncate text-xs font-semibold text-primary"
        >
          {products[0]?.name || "অর্ডারের পণ্য"}
        </p>

        <p className="mt-1 text-[11px] text-muted">
          মোট {quantity.toLocaleString("bn-BD")} পিস
        </p>
      </div>
    </div>
  );
}

// ========================================
// STAT CARD
// ========================================

function StatCard({ title, subtitle, value, icon: Icon, iconClass }) {
  return (
    <div className="rounded-xl border border-base-300/70 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-xs font-bold text-primary sm:text-sm">{title}</h3>

          <p className="mt-1 text-[11px] text-muted">{subtitle}</p>
        </div>

        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
        >
          <Icon size={20} />
        </div>
      </div>

      <p className="mt-4 text-2xl font-bold text-primary sm:text-3xl">
        {Number(value || 0).toLocaleString("bn-BD")}
      </p>
    </div>
  );
}

// ========================================
// MAIN ADMIN ORDERS PAGE
// ========================================

export default function AdminOrdersPage() {
  const { user, loading, role, roleLoading, accountStatus } =
    useContext(AuthContext);

  // ========================================
  // FILTER STATES
  // ========================================

  const [activeTab, setActiveTab] = useState("all");

  const [search, setSearch] = useState("");

  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [paymentFilter, setPaymentFilter] = useState("all");

  const [dateFilter, setDateFilter] = useState("all");

  const [page, setPage] = useState(1);

  // ========================================
  // AUTHORIZATION
  // ========================================

  const checking = loading || (Boolean(user) && roleLoading);

  const allowed =
    !checking &&
    Boolean(user) &&
    role === "admin" &&
    accountStatus === "active";

  // ========================================
  // DEBOUNCED SEARCH
  // ========================================

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 350);

    return () => clearTimeout(timeout);
  }, [search]);

  // ========================================
  // ORDER LIST QUERY
  // ========================================

  const ordersQuery = useQuery({
    queryKey: [
      "admin-orders",
      user?.uid,
      page,
      activeTab,
      paymentFilter,
      dateFilter,
      debouncedSearch,
    ],

    enabled: allowed,

    queryFn: ({ signal }) => {
      const params = new URLSearchParams({
        page: String(page),
        status: activeTab,
        method: paymentFilter,
        date: dateFilter,
      });

      if (debouncedSearch) {
        params.set("search", debouncedSearch);
      }

      return adminRequest(user, `/admin/orders?${params.toString()}`, signal);
    },

    staleTime: 10000,
    refetchOnWindowFocus: true,
  });

  // ========================================
  // API DATA
  // ========================================

  const data = ordersQuery.data || {};

  const orders = Array.isArray(data.orders) ? data.orders : [];

  const stats = data.stats || {};

  const counts = data.counts || {};

  const pagination = data.pagination || {};

  const totalPages = Math.max(1, Number(pagination.totalPages) || 1);

  // ========================================
  // RESET FILTERS
  // ========================================

  const resetFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setActiveTab("all");
    setPaymentFilter("all");
    setDateFilter("all");
    setPage(1);
  };

  // ========================================
  // AUTH LOADING
  // ========================================

  if (checking) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <Loader2 size={28} className="animate-spin text-secondary" />

        <p className="mt-3 text-sm text-muted">Admin Account যাচাই হচ্ছে...</p>
      </div>
    );
  }

  // ========================================
  // ACCESS DENIED
  // ========================================

  if (!allowed) {
    return (
      <div className="rounded-2xl bg-white px-5 py-16 text-center">
        <AlertCircle size={36} className="mx-auto text-secondary" />

        <h2 className="mt-4 text-lg font-bold text-primary">Access Denied</h2>

        <p className="mt-2 text-sm text-muted">
          শুধুমাত্র Active Admin অর্ডার ম্যানেজ করতে পারবেন।
        </p>
      </div>
    );
  }

  // ========================================
  // MAIN UI
  // ========================================

  return (
    <div className="mx-auto max-w-[1600px] space-y-5 pb-10">
      {/* ================================== */}
      {/* PAGE HEADER */}
      {/* ================================== */}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-primary sm:text-2xl">
            অর্ডার ম্যানেজমেন্ট
          </h1>

          <p className="mt-1 text-xs text-muted">
            Guest ও Registered Customer-এর অর্ডার, পেমেন্ট এবং ডেলিভারি এক
            জায়গায় পরিচালনা করুন।
          </p>
        </div>

        <button
          type="button"
          onClick={() => ordersQuery.refetch()}
          disabled={ordersQuery.isFetching}
          className="inline-flex items-center gap-2 rounded-xl border border-base-300 bg-white px-4 py-2.5 text-xs font-bold text-secondary hover:bg-secondary/5 disabled:opacity-50"
        >
          <RefreshCcw
            size={16}
            className={ordersQuery.isFetching ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {/* ================================== */}
      {/* KPI CARDS */}
      {/* ================================== */}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="মোট সক্রিয় অর্ডার"
          subtitle="Pending to Shipped"
          value={stats.active}
          icon={ShoppingBag}
          iconClass="bg-purple-100 text-primary"
        />

        <StatCard
          title="নতুন / পেন্ডিং অর্ডার"
          subtitle="Awaiting Confirmation"
          value={stats.pending}
          icon={ClipboardClock}
          iconClass="bg-amber-100 text-amber-800"
        />

        <StatCard
          title="কাস্টমাইজড প্রস্তুত কাজ"
          subtitle="Custom Orders in Progress"
          value={stats.custom}
          icon={Paintbrush}
          iconClass="bg-fuchsia-100 text-fuchsia-700"
        />

        <StatCard
          title="কুরিয়ারে / পথে আছে"
          subtitle="Shipped Orders"
          value={stats.transit}
          icon={Truck}
          iconClass="bg-indigo-100 text-indigo-700"
        />
      </div>

      {/* ================================== */}
      {/* ORDER MANAGEMENT SECTION */}
      {/* ================================== */}

      <section className="overflow-hidden rounded-2xl border border-base-300/70 bg-white shadow-sm">
        {/* TABLE TITLE */}

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-base-300 p-4 sm:p-5">
          <div>
            <h2 className="text-base font-bold text-primary">সকল অর্ডার</h2>

            <p className="mt-1 text-xs text-muted">Order List & Management</p>
          </div>

          <span className="rounded-full bg-secondary/10 px-3 py-1.5 text-xs font-bold text-secondary">
            {Number(pagination.total || 0).toLocaleString("bn-BD")} Results
          </span>
        </div>

        {/* ================================== */}
        {/* STATUS TABS */}
        {/* ================================== */}

        <div className="flex gap-2 overflow-x-auto border-b border-base-300 px-4 py-3 sm:px-5">
          {STATUS_TABS.map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setActiveTab(value);
                setPage(1);
              }}
              className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                activeTab === value
                  ? "bg-primary text-white"
                  : "bg-base-200 text-muted hover:bg-secondary/10 hover:text-secondary"
              }`}
            >
              {label}

              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                  activeTab === value ? "bg-white/20" : "bg-white"
                }`}
              >
                {Number(counts[value] || 0).toLocaleString("bn-BD")}
              </span>
            </button>
          ))}
        </div>

        {/* ================================== */}
        {/* SEARCH + FILTERS */}
        {/* ================================== */}

        <div className="grid gap-3 border-b border-base-300 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-[minmax(0,1fr)_170px_150px_auto]">
          {/* SEARCH */}

          <label className="flex h-11 items-center gap-2 rounded-xl border border-base-300 bg-base-200 px-3 focus-within:border-secondary">
            <Search size={17} className="shrink-0 text-muted" />

            <input
              value={search}
              maxLength={100}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Order ID, Customer, Phone, Product..."
              className="w-full min-w-0 bg-transparent text-xs text-primary outline-none"
            />
          </label>

          {/* PAYMENT FILTER */}

          <select
            value={paymentFilter}
            onChange={(event) => {
              setPaymentFilter(event.target.value);
              setPage(1);
            }}
            className="h-11 w-full rounded-xl border border-base-300 bg-base-200 px-3 text-xs font-semibold text-primary outline-none"
          >
            <option value="all">সব পেমেন্ট মাধ্যম</option>
            <option value="bkash">bKash</option>
            <option value="nagad">Nagad</option>
            <option value="rocket">Rocket</option>
            <option value="cod">Cash on Delivery</option>
          </select>

          {/* DATE FILTER */}

          <select
            value={dateFilter}
            onChange={(event) => {
              setDateFilter(event.target.value);
              setPage(1);
            }}
            className="h-11 w-full rounded-xl border border-base-300 bg-base-200 px-3 text-xs font-semibold text-primary outline-none"
          >
            <option value="all">সব তারিখ</option>
            <option value="today">আজ</option>
            <option value="week">শেষ ৭ দিন</option>
            <option value="month">এই মাস</option>
          </select>

          {/* RESET */}

          <button
            type="button"
            onClick={resetFilters}
            className="flex h-11 items-center justify-center gap-2 rounded-xl border border-base-300 px-4 text-xs font-bold text-secondary hover:bg-base-200"
          >
            <RefreshCcw size={15} />
            Reset
          </button>
        </div>

        {/* ================================== */}
        {/* ERROR STATE */}
        {/* ================================== */}

        {ordersQuery.isError && (
          <div
            role="alert"
            className="m-4 rounded-xl border border-red-200 bg-red-50 p-4"
          >
            <p className="text-sm text-red-700">
              {ordersQuery.error?.message || "Order list load failed"}
            </p>

            <button
              type="button"
              onClick={() => ordersQuery.refetch()}
              className="mt-3 text-xs font-bold text-red-700 underline"
            >
              Try Again
            </button>
          </div>
        )}

        {/* ================================== */}
        {/* ORDER LIST */}
        {/* ================================== */}

        {ordersQuery.isPending ? (
          <div className="flex min-h-64 flex-col items-center justify-center">
            <Loader2 size={28} className="animate-spin text-secondary" />

            <p className="mt-3 text-sm text-muted">Orders লোড হচ্ছে...</p>
          </div>
        ) : !ordersQuery.isError ? (
          <>
            {/* ================================== */}
            {/* DESKTOP TABLE */}
            {/* ================================== */}

            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[1180px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-base-300 bg-secondary/5 text-sm font-bold text-primary/60">
                    <th className="px-5 py-3">Order / Date</th>

                    <th className="px-5 py-3">Customer</th>

                    <th className="px-5 py-3">Products</th>

                    <th className="px-5 py-3">Amount</th>

                    <th className="px-5 py-3">Payment</th>

                    <th className="px-5 py-3">Delivery</th>

                    <th className="px-5 py-3">Status</th>

                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-base-300/60">
                  {orders.map((order, index) => {
                    const payment = order.payment || {};
                    const courier = order.courier || {};

                    const customerName =
                      order.customer?.name || "Unknown Customer";

                    const customerPhone =
                      order.customer?.phone || order.shipping?.phone || "—";

                    const customerPhoto = order.guest
                      ? ""
                      : order.customerPhotoUrl ||
                        order.customer?.photoUrl ||
                        order.customer?.photoURL ||
                        "";

                    const detailsUrl = `/admin/orders/${encodeURIComponent(
                      order._id,
                    )}`;

                    return (
                      <tr
                        key={order._id}
                        className={`transition-colors hover:bg-secondary/5 ${
                          index % 2 === 0 ? "bg-white" : "bg-[#faf7fb]"
                        }`}
                      >
                        {/* ORDER + DATE */}

                        <td className="px-5 py-2.5 align-middle">
                          <p
                            title={order.orderNumber}
                            className="max-w-[190px] truncate whitespace-nowrap text-xs font-bold text-primary"
                          >
                            #{order.orderNumber}
                          </p>

                          <p className="mt-1 flex items-center gap-1.5 whitespace-nowrap text-[11px] text-muted">
                            <CalendarDays size={13} />
                            {dateText(order.createdAt)}
                          </p>
                        </td>

                        {/* CUSTOMER */}

                        <td className="px-5 py-2.5 align-middle">
                          <div className="flex min-w-[175px] items-center gap-2.5">
                            <CustomerAvatar
                              name={customerName}
                              photoUrl={customerPhoto}
                            />

                            <div className="min-w-0 flex-1">
                              <p
                                title={customerName}
                                className="max-w-[145px] truncate whitespace-nowrap text-sm font-semibold text-primary"
                              >
                                {customerName}
                              </p>

                              <p className="whitespace-nowrap text-[11px] text-muted">
                                {customerPhone}
                              </p>

                              <p className="text-[11px] font-medium text-secondary">
                                {order.guest
                                  ? "Guest Customer"
                                  : "Registered Customer"}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* PRODUCTS */}

                        <td className="px-5 py-2.5 align-middle">
                          <OrderProductPreview order={order} />
                        </td>

                        {/* AMOUNT */}

                        <td className="px-5 py-2.5 align-middle">
                          <p className="whitespace-nowrap text-sm font-bold text-primary">
                            {money(order.total)}
                          </p>

                          <p className="mt-1 whitespace-nowrap text-[11px] font-medium text-green-700">
                            Paid: {money(payment.verifiedAmount)}
                          </p>

                          <p className="mt-0.5 whitespace-nowrap text-[11px] font-medium text-amber-700">
                            Due: {money(getDue(order))}
                          </p>
                        </td>

                        {/* PAYMENT */}

                        <td className="px-5 py-2.5 align-middle">
                          <p className="mb-1.5 whitespace-nowrap text-xs font-semibold text-primary">
                            {METHOD_NAMES[payment.method] ||
                              payment.method ||
                              "—"}
                          </p>

                          <Badge value={payment.status} type="payment" />
                        </td>

                        {/* COURIER */}

                        <td className="px-5 py-2.5 align-middle">
                          <div className="flex items-center gap-1.5">
                            <Truck
                              size={15}
                              className="shrink-0 text-secondary"
                            />

                            <p
                              title={courier.name || "Not Assigned"}
                              className="max-w-[135px] truncate whitespace-nowrap text-xs font-semibold text-primary"
                            >
                              {courier.name || "Not Assigned"}
                            </p>
                          </div>

                          <p
                            title={courier.trackingNumber || "Tracking Pending"}
                            className="mt-1 max-w-[145px] truncate text-[11px] text-muted"
                          >
                            {courier.trackingNumber || "Tracking Pending"}
                          </p>
                        </td>

                        {/* ORDER STATUS */}

                        <td className="px-5 py-2.5 align-middle">
                          <Badge value={order.status} />
                        </td>

                        {/* DETAILS PAGE LINK */}

                        <td className="px-5 py-2.5 text-right align-middle">
                          <Link
                            to={detailsUrl}
                            className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-secondary/10 px-3 py-2 text-xs font-semibold text-secondary transition hover:bg-secondary/20"
                          >
                            <Eye size={15} />
                            Details
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ================================== */}
            {/* MOBILE ORDER CARDS */}
            {/* ================================== */}

            <div className="space-y-3 p-3 sm:p-4 lg:hidden">
              {orders.map((order) => {
                const first = order.items?.[0];

                const payment = order.payment || {};

                const detailsUrl = `/admin/orders/${encodeURIComponent(
                  order._id,
                )}`;

                return (
                  <article
                    key={order._id}
                    className="overflow-hidden rounded-xl border border-base-300 bg-white"
                  >
                    {/* CARD HEADER */}

                    <div className="flex items-start justify-between gap-2 bg-base-200/70 p-3">
                      <div>
                        <p className="break-all text-xs font-bold text-primary">
                          {order.orderNumber}
                        </p>

                        <p className="mt-1 text-[11px] text-muted">
                          {dateText(order.createdAt)}
                        </p>
                      </div>

                      <Badge value={order.status} />
                    </div>

                    <div className="space-y-3 p-3">
                      {/* PRODUCT */}

                      <div className="flex items-center gap-3">
                        <ProductThumb product={first} size="lg" />

                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-xs font-bold text-primary">
                            {first?.name || "অর্ডারের পণ্য"}
                          </p>

                          {first?.variantTitle && (
                            <p className="mt-1 text-[11px] text-muted">
                              {first.variantTitle}
                            </p>
                          )}

                          <p className="mt-1 text-[11px] text-muted">
                            মোট {getQuantity(order)} পিস
                          </p>
                        </div>
                      </div>

                      {/* CUSTOMER + TOTAL */}

                      <div className="grid grid-cols-2 gap-3 rounded-lg bg-base-200/60 p-3">
                        <div className="min-w-0">
                          <p className="text-[11px] text-muted">Customer</p>

                          <p
                            title={order.customer?.name}
                            className="mt-1 truncate text-xs font-bold text-primary"
                          >
                            {order.customer?.name || "—"}
                          </p>

                          <p className="mt-1 text-[11px] text-muted">
                            {order.guest ? "Guest" : "Registered"}
                          </p>
                        </div>

                        <div>
                          <p className="text-[11px] text-muted">Order Total</p>

                          <p className="mt-1 text-sm font-bold text-primary">
                            {money(order.total)}
                          </p>

                          <p className="mt-1 text-[11px] text-amber-700">
                            Due: {money(getDue(order))}
                          </p>
                        </div>
                      </div>

                      {/* PAYMENT */}

                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-bold text-primary">
                          {METHOD_NAMES[payment.method] ||
                            payment.method ||
                            "—"}
                        </span>

                        <Badge value={payment.status} type="payment" />
                      </div>

                      {/* GO TO DETAILS PAGE */}

                      <Link
                        to={detailsUrl}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-bold text-white transition hover:bg-secondary"
                      >
                        <Eye size={15} />
                        বিস্তারিত দেখুন
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* ================================== */}
            {/* EMPTY STATE */}
            {/* ================================== */}

            {orders.length === 0 && (
              <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
                <ShoppingBag size={30} className="text-secondary" />

                <h3 className="mt-4 text-sm font-bold text-primary">
                  কোনো অর্ডার পাওয়া যায়নি
                </h3>

                <p className="mt-2 text-xs text-muted">
                  Filter পরিবর্তন করে দেখুন।
                </p>

                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-4 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white"
                >
                  Reset Filters
                </button>
              </div>
            )}

            {/* ================================== */}
            {/* PAGINATION */}
            {/* ================================== */}

            {Number(pagination.total) > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-base-300 p-4 sm:px-5">
                <p className="text-xs text-muted">
                  Showing {((page - 1) * PER_PAGE + 1).toLocaleString("bn-BD")}
                  {"–"}
                  {Math.min(
                    page * PER_PAGE,
                    Number(pagination.total),
                  ).toLocaleString("bn-BD")}
                  {" of "}
                  {Number(pagination.total).toLocaleString("bn-BD")}
                </p>

                <div className="flex items-center gap-2">
                  {/* PREVIOUS */}

                  <button
                    type="button"
                    disabled={page <= 1}
                    aria-label="Previous page"
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    className="flex size-9 items-center justify-center rounded-lg border border-base-300 text-primary disabled:opacity-40"
                  >
                    <ChevronLeft size={17} />
                  </button>

                  {/* CURRENT PAGE */}

                  <span className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white">
                    {page} / {totalPages}
                  </span>

                  {/* NEXT */}

                  <button
                    type="button"
                    disabled={page >= totalPages}
                    aria-label="Next page"
                    onClick={() =>
                      setPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    className="flex size-9 items-center justify-center rounded-lg border border-base-300 text-primary disabled:opacity-40"
                  >
                    <ChevronRight size={17} />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : null}
      </section>
    </div>
  );
}
