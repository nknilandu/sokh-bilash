
import { useContext, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AuthContext } from "../../providers/AuthProvider";
import { Link } from "react-router-dom";
import {
  ShoppingBag,
  Clock3,
  Wallet,
  TrendingUp,
  Truck,
  Loader2,
  AlertCircle,
  RefreshCcw,
  BadgeCheck,
  ShieldCheck,
  PhoneCall,
  Hammer,
  ArrowRight,
  Bell,
  CalendarDays,
  Eye,
  UserRound,
  ImageOff,
} from "lucide-react";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";

// =====================================
// REAL DASHBOARD DATA
// =====================================

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/$/, "");

const STATUS_COLORS = ["#8d389e", "#df72ef", "#ffe16d", "#c73e49"];
const PAYMENT_COLORS = ["#8d389e", "#ffd700", "#310039"];

const STATUS_MAP = {
  pending: { label: "পেন্ডিং", color: "bg-amber-50 text-amber-700" },
  verified: { label: "যাচাইকৃত", color: "bg-blue-50 text-blue-700" },
  processing: { label: "প্রসেসিং", color: "bg-purple-50 text-purple-700" },
  shipped: { label: "শিপড", color: "bg-indigo-50 text-indigo-700" },
  delivered: { label: "ডেলিভার্ড", color: "bg-green-50 text-green-700" },
  rejected: { label: "রিজেক্টেড", color: "bg-red-50 text-red-700" },
  cancelled: { label: "বাতিল", color: "bg-red-50 text-red-700" },
};

const PAYMENT_MAP = {
  pending: { label: "যাচাই বাকি", color: "bg-amber-50 text-amber-700" },
  partially_paid: { label: "আংশিক পরিশোধিত", color: "bg-blue-50 text-blue-700" },
  verified: { label: "ভেরিফাইড", color: "bg-green-50 text-green-700" },
  rejected: { label: "রিজেক্টেড", color: "bg-red-50 text-red-700" },
  cod_pending: { label: "COD বাকি", color: "bg-purple-50 text-purple-700" },
  cod_collected: { label: "COD সংগৃহীত", color: "bg-green-50 text-green-700" },
};

const METHOD_NAMES = {
  bkash: "bKash", nagad: "Nagad", rocket: "Rocket", cod: "Cash on Delivery",
};

function dateText(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("bn-BD", {
    timeZone: "Asia/Dhaka",
    day: "numeric", month: "short", year: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

function getQuantity(order) {
  if (order.itemCount !== undefined && order.itemCount !== null) {
    return Number(order.itemCount) || 0;
  }
  return (order.items || []).reduce(
    (total, item) => total + (Number(item.quantity) || 0), 0
  );
}

function getDue(order) {
  return Math.max(0, Number(
    order.payment?.dueAmount ??
      Number(order.total || 0) - Number(order.payment?.verifiedAmount || 0)
  ) || 0);
}

const bn = (value) =>
  Number(value || 0).toLocaleString("bn-BD", {
    maximumFractionDigits: 2,
  });

const money = (value) => `৳${bn(value)}`;

function growthText(value) {
  if (value === null || value === undefined) {
    return "আগের সময়ের তুলনা নেই";
  }
  const change = Number(value) || 0;
  if (change === 0) return "আগের ৩০ দিনের সমান";
  return `${change > 0 ? "↑" : "↓"} ${bn(Math.abs(change))}% ${
    change > 0 ? "বৃদ্ধি" : "হ্রাস"
  } (গত ৩০ দিন)`;
}

async function fetchDashboard(user, signal) {
  if (!user) throw new Error("Admin login required");

  const token = await user.getIdToken();
  const response = await fetch(`${API_URL}/admin/dashboard`, {
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
    throw new Error(data.message || `Dashboard request failed (${response.status})`);
  }
  return data;
}

// =====================================
// REUSABLE CHART CARD
// =====================================

function ChartCard({ title, subtitle, children, action }) {
  return (
    <div className="section-card min-w-0 p-4 sm:p-5">
      <div className="mb-5 flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-primary sm:text-base">
            {title}
          </h3>
          <p className="mt-1 text-xs text-muted">{subtitle}</p>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

// =====================================
// ORDER MANAGEMENT STYLE TABLE COMPONENTS
// =====================================

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


// =====================================
// MAIN DASHBOARD
// =====================================

export default function AdminDashboard() {
  const [period, setPeriod] = useState("daily");
  const { user, loading, role, roleLoading, accountStatus } =
    useContext(AuthContext);

  const checking = loading || (Boolean(user) && roleLoading);
  const allowed =
    !checking &&
    Boolean(user) &&
    role === "admin" &&
    accountStatus === "active";

  const dashboardQuery = useQuery({
    queryKey: ["admin-dashboard", user?.uid],
    enabled: allowed,
    queryFn: ({ signal }) => fetchDashboard(user, signal),
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });

  const dashboard = dashboardQuery.data || {};
  const metrics = dashboard.kpis || {};
  const attention = dashboard.attention || {};
  const salesData = dashboard.salesData || { daily: [], weekly: [], monthly: [] };

  const statusData = (Array.isArray(dashboard.statusData)
    ? dashboard.statusData : []).map((item, index) => ({
    ...item,
    color: item.color || STATUS_COLORS[index % STATUS_COLORS.length],
  }));

  const paymentData = (Array.isArray(dashboard.paymentData)
    ? dashboard.paymentData : []).map((item, index) => ({
    ...item,
    color: item.color || PAYMENT_COLORS[index % PAYMENT_COLORS.length],
  }));

  const statusTotal = Number(dashboard.statusTotal || 0);
  const attentionTotal =
    Number(attention.paymentPending || 0) +
    Number(attention.codUnconfirmed || 0) +
    Number(attention.customProcessing || 0);

  const recentOrders = Array.isArray(dashboard.recentOrders)
    ? dashboard.recentOrders
    : [];

  const kpis = [
    {
      title: "মোট অর্ডার",
      value: bn(metrics.totalOrders),
      unit: "টি",
      change: growthText(metrics.orderGrowthPercent),
      icon: ShoppingBag,
      bg: "bg-secondary/10",
      color: "text-secondary",
    },
    {
      title: "পেন্ডিং অর্ডার",
      value: bn(metrics.pendingOrders),
      unit: "টি",
      change: "অপেক্ষমাণ",
      icon: Clock3,
      bg: "bg-amber-100",
      color: "text-amber-700",
    },
    {
      title: "পেমেন্ট ভেরিফিকেশন",
      value: bn(metrics.pendingPayments),
      unit: "টি",
      change: "যাচাই প্রয়োজন",
      icon: Wallet,
      bg: "bg-fuchsia-100",
      color: "text-fuchsia-700",
    },
    {
      title: "মোট বিক্রি",
      value: money(metrics.totalSales),
      unit: "",
      change: growthText(metrics.salesGrowthPercent),
      icon: TrendingUp,
      bg: "bg-yellow-100",
      color: "text-yellow-700",
    },
    {
      title: "সফল ডেলিভারি",
      value: bn(metrics.deliveredOrders),
      unit: "টি",
      change: `${bn(metrics.deliveryRate)}% সফল`,
      icon: BadgeCheck,
      bg: "bg-green-100",
      color: "text-green-700",
    },
    {
      title: "বকেয়া / COD ব্যালেন্স",
      value: money(metrics.outstandingBalance),
      unit: "",
      change: "সক্রিয় অর্ডারের অবশিষ্ট পাওনা",
      icon: Wallet,
      bg: "bg-secondary/10",
      color: "text-secondary",
    },
  ];

  if (checking || (allowed && dashboardQuery.isPending)) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <Loader2 size={28} className="animate-spin text-secondary" />
        <p className="mt-3 text-sm text-muted">Dashboard লোড হচ্ছে...</p>
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="rounded-2xl bg-white px-5 py-16 text-center">
        <AlertCircle size={36} className="mx-auto text-secondary" />
        <h2 className="mt-4 text-lg font-bold text-primary">Access Denied</h2>
        <p className="mt-2 text-sm text-muted">শুধু Active Admin Dashboard দেখতে পারবেন।</p>
      </div>
    );
  }

  if (dashboardQuery.isError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-white p-8 text-center">
        <p className="text-sm text-red-700">{dashboardQuery.error?.message}</p>
        <button
          type="button"
          onClick={() => dashboardQuery.refetch()}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white"
        >
          <RefreshCcw size={15} /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className=" max-w-full space-y-6 pb-10">

      {/* PAGE HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-primary sm:text-2xl">
            ড্যাশবোর্ড ওভারভিউ
          </h1>
          <p className="mt-1 text-xs text-muted sm:text-sm">
            আপনার ব্যবসার গুরুত্বপূর্ণ তথ্য এক নজরে দেখুন।
          </p>
        </div>

        <span className="badge-soft">
          <CalendarDays size={14} />
          {new Date(dashboard.generatedAt || Date.now()).toLocaleDateString("bn-BD", {
            timeZone: "Asia/Dhaka", day: "numeric", month: "short", year: "numeric"
          })}
        </span>
      </div>

      {/* ===================================== */}
      {/* NEEDS ATTENTION */}
      {/* ===================================== */}

      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Bell size={17} className="text-secondary" />
            <h2 className="text-base font-bold text-primary">
              জরুরি করণীয়
            </h2>
            <span className="rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-bold text-red-600">
              {bn(attentionTotal)}টি পেন্ডিং
            </span>
          </div>
          <p className="text-xs text-muted">
            সরাসরি অ্যাকশন নিয়ে কাজগুলো সম্পন্ন করুন
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {/* Payment */}
          <div className="relative overflow-hidden rounded-2xl border border-base-300 bg-white p-4 shadow-sm">
            <span className="absolute inset-y-0 left-0 w-1 bg-gold-soft" />
            <div className="flex items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-yellow-100 text-primary">
                <ShieldCheck size={21} />
              </div>
              <div>
                <p className="text-xs font-semibold text-amber-700">
                  পেমেন্ট অপেক্ষা
                </p>
                <h3 className="mt-1 text-base font-extrabold text-primary">
                  {bn(attention.paymentPending)}টি ভেরিফিকেশন বাকি
                </h3>
                <p className="mt-2 text-xs leading-5 text-muted">
                  {bn(attention.paymentPending)}টি অনলাইন TrxID
                  মিলিয়ে একাউন্টে টাকা নিশ্চিত করতে হবে।
                </p>
                <Link
                  to="/admin/payments"
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gold-soft px-4 py-2 text-xs font-bold text-primary hover:bg-accent"
                >
                  যাচাই করুন <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>

          {/* COD */}
          <div className="relative overflow-hidden rounded-2xl border border-base-300 bg-white p-4 shadow-sm">
            <span className="absolute inset-y-0 left-0 w-1 bg-secondary" />
            <div className="flex items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                <PhoneCall size={21} />
              </div>
              <div>
                <p className="text-xs font-semibold text-secondary">
                  কল অপেক্ষা
                </p>
                <h3 className="mt-1 text-base font-extrabold text-primary">
                  {bn(attention.codUnconfirmed)}টি COD নিশ্চিতকরণ বাকি
                </h3>
                <p className="mt-2 text-xs leading-5 text-muted">
                  ক্যাশ অন ডেলিভারি প্রসেসিংয়ের আগে
                  গ্রাহকের সাথে ফোনে অর্ডার কনফার্ম করুন।
                </p>
                <Link
                  to={attention.firstCodOrderId
                    ? `/admin/orders/${encodeURIComponent(attention.firstCodOrderId)}`
                    : "/admin/orders"}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-secondary/10 px-4 py-2 text-xs font-bold text-secondary hover:bg-secondary/20"
                >
                  কল করুন <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>

          {/* Customization */}
          <div className="relative overflow-hidden rounded-2xl border border-base-300 bg-white p-4 shadow-sm">
            <span className="absolute inset-y-0 left-0 w-1 bg-primary" />
            <div className="flex items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-fuchsia-100 text-secondary">
                <Hammer size={21} />
              </div>
              <div>
                <p className="text-xs font-semibold text-secondary">
                  কাস্টমাইজড অর্ডার
                </p>
                <h3 className="mt-1 text-base font-extrabold text-primary">
                  {bn(attention.customProcessing)}টি কাস্টম প্রসেসিং
                </h3>
                <p className="mt-2 text-xs leading-5 text-muted">
                  কাঠের মোড়ক, নামফলক ও অন্যান্য
                  কাস্টম গিফটের কাজ শুরু বা অগ্রগতি আপডেট করুন।
                </p>
                <Link
                  to={attention.firstCustomOrderId
                    ? `/admin/orders/${encodeURIComponent(attention.firstCustomOrderId)}`
                    : "/admin/orders"}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-secondary"
                >
                  প্রসেস করুন <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================== */}
      {/* SIX KPI CARDS */}
      {/* ===================================== */}

      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {kpis.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="section-card min-w-0 p-3 sm:p-4"
            >
              <div className={`mb-4 flex size-10 items-center justify-center rounded-xl ${item.bg} ${item.color}`}>
                <Icon size={19} />
              </div>

              <p className="text-xs font-semibold text-muted">
                {item.title}
              </p>

              <p className="mt-2 break-words text-xl font-extrabold text-primary">
                {item.value}
                {item.unit && (
                  <span className="ml-1 text-xs">{item.unit}</span>
                )}
              </p>

              <p className="mt-2 text-[11px] leading-5 text-secondary">
                {item.change}
              </p>
            </div>
          );
        })}
      </section>

      {/* ===================================== */}
      {/* THREE CHARTS IN ONE ROW */}
      {/* ===================================== */}

      <section className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3">

        {/* LINE CHART */}
        <ChartCard
          title="বিক্রির গতিধারা (Sales Trend)"
          subtitle="দৈনিক, সাপ্তাহিক ও মাসিক বিক্রির তথ্য"
          action={
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="select select-xs border-base-300 bg-base-200 text-xs text-primary"
            >
              <option value="daily">দৈনিক</option>
              <option value="weekly">সাপ্তাহিক</option>
              <option value="monthly">মাসিক</option>
            </select>
          }
        >
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={salesData[period]}
                margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
              >
                <CartesianGrid
                  stroke="#e8ddec"
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v / 1000}k`}
                />
                <Tooltip formatter={(v) => money(v)} />
                <Line
                  type="monotone"
                  dataKey="sales"
                  name="বিক্রয়"
                  stroke="#8d389e"
                  strokeWidth={3}
                  dot={{ r: 3, fill: "#ffffff", strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: "#ffe16d" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* PIE CHART */}
        <ChartCard
          title="অর্ডার স্ট্যাটাস বিতরণ"
          subtitle="চলতি মাসের অর্ডারের অবস্থা"
        >
          <div className="relative h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={65}
                  outerRadius={90}
                  paddingAngle={2}
                  stroke="none"
                >
                  {statusData.map((item) => (
                    <Cell key={item.name} fill={item.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => `${bn(v)} টি`} />
              </PieChart>
            </ResponsiveContainer>

            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xs text-muted">মোট অর্ডার</span>
              <span className="text-2xl font-extrabold text-primary">
                {bn(statusTotal)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {statusData.map((item) => (
              <div
                key={item.name}
                className="flex items-center gap-2 rounded-lg bg-base-200 p-2 text-xs"
              >
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-muted">
                  {item.name} ({item.value})
                </span>
              </div>
            ))}
          </div>
        </ChartCard>

        {/* BAR CHART */}
        <ChartCard
          title="পেমেন্ট মাধ্যম অনুযায়ী"
          subtitle="যাচাইকৃত প্রাপ্ত অর্থের হিসাব"
        >
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={paymentData}
                margin={{ top: 10, right: 5, left: -25, bottom: 0 }}
              >
                <CartesianGrid
                  stroke="#e8ddec"
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => `${v / 1000}k`}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip formatter={(v) => money(v)} />
                <Bar
                  dataKey="amount"
                  name="প্রাপ্ত অর্থ"
                  radius={[7, 7, 0, 0]}
                  maxBarSize={48}
                >
                  {paymentData.map((item) => (
                    <Cell key={item.name} fill={item.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </section>

      {/* ===================================== */}
      {/* RECENT ORDERS - ORDER MANAGEMENT STYLE */}
      {/* ===================================== */}

      <section className="section-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-base-300 p-4 sm:p-5">
          <div>
            <h2 className="font-bold text-primary">সাম্প্রতিক অর্ডার</h2>
            <p className="mt-1 text-xs text-muted">সর্বশেষ জমা হওয়া ৫টি অর্ডার</p>
          </div>
          <Link
            to="/admin/orders"
            className="inline-flex items-center gap-1 text-xs font-bold text-secondary"
          >
            সব অর্ডার <ArrowRight size={15} />
          </Link>
        </div>

        {/* DESKTOP: SAME 8-COLUMN LAYOUT AS ORDER MANAGEMENT */}
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
              {recentOrders.map((order, index) => {
                const payment = order.payment || {};
                const courier = order.courier || {};
                const customerName = order.customer?.name || "Unknown Customer";
                const customerPhone = order.customer?.phone || order.shipping?.phone || "—";
                const customerPhoto = order.guest ? "" :
                  (order.customerPhotoUrl || "");
                const detailsUrl = `/admin/orders/${encodeURIComponent(order._id)}`;

                return (
                  <tr
                    key={order._id}
                    className={`transition-colors hover:bg-secondary/5 ${
                      index % 2 === 0 ? "bg-white" : "bg-[#faf7fb]"
                    }`}
                  >
                    <td className="px-5 py-2.5 align-middle">
                      <p title={order.orderNumber} className="max-w-[190px] truncate whitespace-nowrap text-xs font-bold text-primary">
                        #{order.orderNumber}
                      </p>
                      <p className="mt-1 flex items-center gap-1.5 whitespace-nowrap text-[11px] text-muted">
                        <CalendarDays size={13} /> {dateText(order.createdAt)}
                      </p>
                    </td>
                    <td className="px-5 py-2.5 align-middle">
                      <div className="flex min-w-[175px] items-center gap-2.5">
                        <CustomerAvatar name={customerName} photoUrl={customerPhoto} />
                        <div className="min-w-0 flex-1">
                          <p title={customerName} className="max-w-[145px] truncate whitespace-nowrap text-sm font-semibold text-primary">
                            {customerName}
                          </p>
                          <p className="whitespace-nowrap text-[11px] text-muted">{customerPhone}</p>
                          <p className="text-[11px] font-medium text-secondary">
                            {order.guest ? "Guest Customer" : "Registered Customer"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-2.5 align-middle">
                      <OrderProductPreview order={order} />
                    </td>
                    <td className="px-5 py-2.5 align-middle">
                      <p className="whitespace-nowrap text-sm font-bold text-primary">{money(order.total)}</p>
                      <p className="mt-1 whitespace-nowrap text-[11px] font-medium text-green-700">
                        Paid: {money(payment.verifiedAmount)}
                      </p>
                      <p className="mt-0.5 whitespace-nowrap text-[11px] font-medium text-amber-700">
                        Due: {money(getDue(order))}
                      </p>
                    </td>
                    <td className="px-5 py-2.5 align-middle">
                      <p className="mb-1.5 whitespace-nowrap text-xs font-semibold text-primary">
                        {METHOD_NAMES[payment.method] || payment.method || "—"}
                      </p>
                      <Badge value={payment.status} type="payment" />
                    </td>
                    <td className="px-5 py-2.5 align-middle">
                      <div className="flex items-center gap-1.5">
                        <Truck size={15} className="shrink-0 text-secondary" />
                        <p title={courier.name || "Not Assigned"} className="max-w-[135px] truncate whitespace-nowrap text-xs font-semibold text-primary">
                          {courier.name || "Not Assigned"}
                        </p>
                      </div>
                      <p title={courier.trackingNumber || "Tracking Pending"} className="mt-1 max-w-[145px] truncate text-[11px] text-muted">
                        {courier.trackingNumber || "Tracking Pending"}
                      </p>
                    </td>
                    <td className="px-5 py-2.5 align-middle"><Badge value={order.status} /></td>
                    <td className="px-5 py-2.5 text-right align-middle">
                      <Link
                        to={detailsUrl}
                        className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-secondary/10 px-3 py-2 text-xs font-semibold text-secondary transition hover:bg-secondary/20"
                      >
                        <Eye size={15} /> Details
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* MOBILE: MATCHING ORDER MANAGEMENT CARDS */}
        <div className="space-y-3 p-3 sm:p-4 lg:hidden">
          {recentOrders.map((order) => {
            const first = order.items?.[0];
            const payment = order.payment || {};
            const url = `/admin/orders/${encodeURIComponent(order._id)}`;
            return (
              <article key={order._id} className="overflow-hidden rounded-xl border border-base-300 bg-white">
                <div className="flex items-start justify-between gap-2 bg-base-200/70 p-3">
                  <div>
                    <p className="break-all text-xs font-bold text-primary">{order.orderNumber}</p>
                    <p className="mt-1 text-[11px] text-muted">{dateText(order.createdAt)}</p>
                  </div>
                  <Badge value={order.status} />
                </div>
                <div className="space-y-3 p-3">
                  <div className="flex items-center gap-3">
                    <ProductThumb product={first} size="lg" />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-xs font-bold text-primary">{first?.name || "অর্ডারের পণ্য"}</p>
                      {first?.variantTitle && (
                        <p className="mt-1 text-[11px] text-muted">{first.variantTitle}</p>
                      )}
                      <p className="mt-1 text-[11px] text-muted">মোট {getQuantity(order)} পিস</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 rounded-lg bg-base-200/60 p-3">
                    <div className="min-w-0">
                      <p className="text-[11px] text-muted">Customer</p>
                      <p className="mt-1 truncate text-xs font-bold text-primary">{order.customer?.name || "—"}</p>
                      <p className="mt-1 text-[11px] text-muted">{order.guest ? "Guest" : "Registered"}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted">Order Total</p>
                      <p className="mt-1 text-sm font-bold text-primary">{money(order.total)}</p>
                      <p className="mt-1 text-[11px] text-amber-700">Due: {money(getDue(order))}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-primary">
                      {METHOD_NAMES[payment.method] || payment.method || "—"}
                    </span>
                    <Badge value={payment.status} type="payment" />
                  </div>
                  <Link to={url} className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-bold text-white transition hover:bg-secondary">
                    <Eye size={15} /> বিস্তারিত দেখুন <ArrowRight size={14} />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>

        {recentOrders.length === 0 && (
          <div className="flex flex-col items-center justify-center px-4 py-14 text-center">
            <ShoppingBag size={30} className="text-secondary" />
            <p className="mt-3 text-xs text-muted">এখনো কোনো Order পাওয়া যায়নি।</p>
          </div>
        )}
      </section>
    </div>
  );
}
