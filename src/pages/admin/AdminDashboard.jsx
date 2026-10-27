
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ShoppingBag,
  Clock3,
  Wallet,
  TrendingUp,
  Truck,
  BadgeCheck,
  ShieldCheck,
  PhoneCall,
  Hammer,
  ArrowRight,
  Bell,
  Package,
  CalendarDays,
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
// DEMO DATA
// =====================================

const kpis = [
  {
    title: "মোট অর্ডার",
    value: "১৪৮",
    unit: "টি",
    change: "↑ ১২.৫% বৃদ্ধি",
    icon: ShoppingBag,
    bg: "bg-secondary/10",
    color: "text-secondary",
  },
  {
    title: "পেন্ডিং অর্ডার",
    value: "৯",
    unit: "টি",
    change: "অপেক্ষমাণ",
    icon: Clock3,
    bg: "bg-amber-100",
    color: "text-amber-700",
  },
  {
    title: "পেমেন্ট ভেরিফিকেশন",
    value: "৩",
    unit: "টি",
    change: "যাচাই প্রয়োজন",
    icon: Wallet,
    bg: "bg-fuchsia-100",
    color: "text-fuchsia-700",
  },
  {
    title: "মোট বিক্রি",
    value: "৳২,৮৪,৫০০",
    unit: "",
    change: "↑ ১৮.৪% বৃদ্ধি",
    icon: TrendingUp,
    bg: "bg-yellow-100",
    color: "text-yellow-700",
  },
  {
    title: "সফল ডেলিভারি",
    value: "১২৬",
    unit: "টি",
    change: "৮৫.১% সফল",
    icon: BadgeCheck,
    bg: "bg-green-100",
    color: "text-green-700",
  },
  {
    title: "বকেয়া / COD ব্যালেন্স",
    value: "৳৪২,৬০০",
    unit: "",
    change: "ডেলিভারির সময় প্রাপ্য",
    icon: Wallet,
    bg: "bg-secondary/10",
    color: "text-secondary",
  },
];

const salesData = {
  daily: [
    { name: "শনি", sales: 12500 },
    { name: "রবি", sales: 18500 },
    { name: "সোম", sales: 17000 },
    { name: "মঙ্গল", sales: 24500 },
    { name: "বুধ", sales: 31500 },
    { name: "বৃহস্পতি", sales: 36000 },
    { name: "শুক্র", sales: 25500 },
  ],
  weekly: [
    { name: "১ম", sales: 65000 },
    { name: "২য়", sales: 72000 },
    { name: "৩য়", sales: 61000 },
    { name: "৪র্থ", sales: 86500 },
  ],
  monthly: [
    { name: "মে", sales: 145000 },
    { name: "জুন", sales: 165000 },
    { name: "জুলাই", sales: 195000 },
    { name: "আগস্ট", sales: 220000 },
    { name: "সেপ্টে", sales: 248000 },
    { name: "অক্টো", sales: 284500 },
  ],
};

const statusData = [
  { name: "সম্পন্ন", value: 126, color: "#8d389e" },
  { name: "প্রসেসিং", value: 8, color: "#df72ef" },
  { name: "পেন্ডিং", value: 9, color: "#ffe16d" },
  { name: "বাতিল", value: 5, color: "#c73e49" },
];

const paymentData = [
  { name: "bKash", amount: 145000, color: "#8d389e" },
  { name: "Nagad", amount: 86500, color: "#ffd700" },
  { name: "Rocket", amount: 53000, color: "#310039" },
];

const recentOrders = [
  {
    id: "SKB-98432",
    customer: "রহিম আহমেদ",
    product: "কাস্টমাইজড ফটো ফ্রেম",
    amount: 1850,
    status: "পেমেন্ট পেন্ডিং",
  },
  {
    id: "SKB-98433",
    customer: "সাদিয়া ইসলাম",
    product: "প্রিমিয়াম গিফট বক্স",
    amount: 2650,
    status: "প্রসেসিং",
  },
  {
    id: "SKB-98434",
    customer: "মেহেদী হাসান",
    product: "ইসলামিক ক্যালিগ্রাফি",
    amount: 1450,
    status: "ডেলিভারি বাকি",
  },
];

const money = (n) =>
  `৳${Number(n).toLocaleString("bn-BD")}`;

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
// MAIN DASHBOARD
// =====================================

export default function AdminDashboard() {
  const [period, setPeriod] = useState("daily");

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
          Demo Overview
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
              ৯টি পেন্ডিং
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
                  ৩টি ভেরিফিকেশন বাকি
                </h3>
                <p className="mt-2 text-xs leading-5 text-muted">
                  ৩টি ম্যানুয়াল বিকাশ ও নগদ TrxID
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
                  ২টি COD নিশ্চিতকরণ বাকি
                </h3>
                <p className="mt-2 text-xs leading-5 text-muted">
                  ক্যাশ অন ডেলিভারি প্রসেসিংয়ের আগে
                  গ্রাহকের সাথে ফোনে অর্ডার কনফার্ম করুন।
                </p>
                <Link
                  to="/admin/orders?status=cod_pending"
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
                  ৪টি কাস্টম প্রসেসিং
                </h3>
                <p className="mt-2 text-xs leading-5 text-muted">
                  কাঠের মোড়ক, নামফলক ও অন্যান্য
                  কাস্টম গিফটের কাজ শুরু বা অগ্রগতি আপডেট করুন।
                </p>
                <Link
                  to="/admin/orders?type=custom"
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
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>

            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xs text-muted">মোট অর্ডার</span>
              <span className="text-2xl font-extrabold text-primary">
                ১৪৮
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
      {/* RECENT ORDERS */}
      {/* ===================================== */}

      <section className="section-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-base-300 p-4 sm:p-5">
          <div>
            <h2 className="font-bold text-primary">
              সাম্প্রতিক অর্ডার
            </h2>
            <p className="mt-1 text-xs text-muted">
              সর্বশেষ জমা হওয়া অর্ডারসমূহ
            </p>
          </div>

          <Link
            to="/admin/orders"
            className="inline-flex items-center gap-1 text-xs font-bold text-secondary"
          >
            সব অর্ডার
            <ArrowRight size={15} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead className="bg-base-200 text-primary">
              <tr>
                <th>অর্ডার</th>
                <th>কাস্টমার</th>
                <th>প্রোডাক্ট</th>
                <th>মূল্য</th>
                <th>স্ট্যাটাস</th>
                <th>অ্যাকশন</th>
              </tr>
            </thead>

            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id}>
                  <td className="font-bold text-primary">
                    {order.id}
                  </td>
                  <td>{order.customer}</td>
                  <td>{order.product}</td>
                  <td className="font-semibold">
                    {money(order.amount)}
                  </td>
                  <td>
                    <span className="badge-soft whitespace-nowrap">
                      {order.status}
                    </span>
                  </td>
                  <td>
                    <Link
                      to={`/admin/orders/${order.id}`}
                      className="text-xs font-bold text-secondary hover:underline"
                    >
                      বিস্তারিত
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
