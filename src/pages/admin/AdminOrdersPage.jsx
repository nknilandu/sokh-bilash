
import { useMemo, useState } from "react";
import {
  Search,
  ShoppingBag,
  ClipboardClock,
  Paintbrush,
  Truck,
  Eye,
  X,
  Phone,
  MapPin,
  Package,
  CalendarDays,
  Wallet,
  RefreshCcw,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  UserRound,
  CreditCard,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  ImageOff,
} from "lucide-react";

// =====================================
// DEMO DATA
// Replace with TanStack Query API data
// =====================================

const demoOrders = [
  {
    id: "SKB-98432",
    date: "2026-10-25T10:30:00",
    customer: "রহিম আহমেদ",
    phone: "01712345678",
    address: "নরসিংদী সদর, নরসিংদী",
    products: [
      {
        id: "p1",
        name: "কাস্টমাইজড প্রিমিয়াম ফটো ফ্রেম",
        variant: "12×16 inch • Golden",
        image:
          "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=200&q=80",
        quantity: 1,
        price: 1850,
      },
    ],
    total: 1930,
    advancePaid: 0,
    codBalance: 1930,
    paymentMethod: "bKash",
    paymentStatus: "pending_verification",
    status: "pending",
    courier: "",
    trackingId: "",
    customized: true,
    note: "নাম ও ছবি অনুযায়ী কাস্টমাইজ করতে হবে",
  },
  {
    id: "SKB-98433",
    date: "2026-10-25T09:15:00",
    customer: "সাদিয়া ইসলাম",
    phone: "01812345678",
    address: "ধানমন্ডি, ঢাকা",
    products: [
      {
        id: "p2",
        name: "Birthday Luxury Gift Hamper",
        variant: "Chocolate + Flower + Balloon",
        image:
          "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=200&q=80",
        quantity: 1,
        price: 2650,
      },
    ],
    total: 2780,
    advancePaid: 0,
    codBalance: 2780,
    paymentMethod: "COD",
    paymentStatus: "cod_pending",
    status: "pending",
    courier: "",
    trackingId: "",
    customized: false,
    note: "ডেলিভারির আগে কল করবেন",
  },
  {
    id: "SKB-98434",
    date: "2026-10-24T15:20:00",
    customer: "মেহেদী হাসান",
    phone: "01912345678",
    address: "কান্দিরপাড়, কুমিল্লা",
    products: [
      {
        id: "p3",
        name: "ইসলামিক ক্যালিগ্রাফি ফ্রেম",
        variant: "Golden Frame • Customized",
        image:
          "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=200&q=80",
        quantity: 1,
        price: 1450,
      },
    ],
    total: 1580,
    advancePaid: 790,
    codBalance: 790,
    paymentMethod: "Nagad",
    paymentStatus: "verified",
    status: "processing",
    courier: "",
    trackingId: "",
    customized: true,
    note: "গোল্ডেন ফ্রেম",
  },
  {
    id: "SKB-98435",
    date: "2026-10-24T11:45:00",
    customer: "তানজিলা আক্তার",
    phone: "01612345678",
    address: "চৌরাস্তা, গাজীপুর",
    products: [
      {
        id: "p4",
        name: "কাপল শাড়ি পাঞ্জাবি কম্বো",
        variant: "Maroon • Size L",
        image:
          "https://images.unsplash.com/photo-1605000797499-95a51c5269ae?w=200&q=80",
        quantity: 1,
        price: 4200,
      },
    ],
    total: 4330,
    advancePaid: 2165,
    codBalance: 2165,
    paymentMethod: "bKash",
    paymentStatus: "verified",
    status: "ready_to_ship",
    courier: "",
    trackingId: "",
    customized: true,
    note: "",
  },
  {
    id: "SKB-98436",
    date: "2026-10-23T14:00:00",
    customer: "আকাশ দাস",
    phone: "01798765432",
    address: "মাধবদী, নরসিংদী",
    products: [
      {
        id: "p5",
        name: "কাপল ফটো ফ্রেম",
        variant: "Wooden • 8×10 inch",
        image:
          "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=200&q=80",
        quantity: 2,
        price: 850,
      },
    ],
    total: 1780,
    advancePaid: 890,
    codBalance: 890,
    paymentMethod: "Rocket",
    paymentStatus: "verified",
    status: "shipped",
    courier: "Steadfast",
    trackingId: "STD-123456",
    customized: false,
    note: "",
  },
  {
    id: "SKB-98437",
    date: "2026-10-22T12:10:00",
    customer: "নুসরাত জাহান",
    phone: "01898765432",
    address: "জিন্দাবাজার, সিলেট",
    products: [
      {
        id: "p6",
        name: "চকলেট ও ফুলের গিফট বক্স",
        variant: "Premium Red Rose",
        image:
          "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=200&q=80",
        quantity: 1,
        price: 2200,
      },
    ],
    total: 2330,
    advancePaid: 2330,
    codBalance: 0,
    paymentMethod: "bKash",
    paymentStatus: "verified",
    status: "delivered",
    courier: "Pathao",
    trackingId: "PTH-98437",
    customized: false,
    note: "",
  },
  {
    id: "SKB-98438",
    date: "2026-10-21T16:20:00",
    customer: "ইমরান হোসেন",
    phone: "01512345678",
    address: "শিবপুর, নরসিংদী",
    products: [
      {
        id: "p7",
        name: "নিকাহনামা ফ্রেম",
        variant: "A3 • Premium",
        image:
          "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=200&q=80",
        quantity: 1,
        price: 1950,
      },
    ],
    total: 2030,
    advancePaid: 0,
    codBalance: 2030,
    paymentMethod: "COD",
    paymentStatus: "cod_pending",
    status: "cancelled",
    courier: "",
    trackingId: "",
    customized: true,
    note: "",
  },
  {
    id: "SKB-98439",
    date: "2026-10-25T08:30:00",
    customer: "ফারিয়া ইসলাম",
    phone: "01312345678",
    address: "সাহেব বাজার, রাজশাহী",
    products: [
      {
        id: "p8",
        name: "Luxury Surprise Gift Box",
        variant: "Premium Packaging",
        image:
          "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=200&q=80",
        quantity: 1,
        price: 3500,
      },
    ],
    total: 3630,
    advancePaid: 0,
    codBalance: 3630,
    paymentMethod: "COD",
    paymentStatus: "cod_pending",
    status: "confirmed",
    courier: "",
    trackingId: "",
    customized: false,
    note: "",
  },
];

const statusMap = {
  pending: {
    label: "পেন্ডিং",
    color: "bg-amber-50 text-amber-700 border-amber-200",
  },
  confirmed: {
    label: "কনফার্মড",
    color: "bg-blue-50 text-blue-700 border-blue-200",
  },
  processing: {
    label: "প্রসেসিং",
    color: "bg-purple-50 text-purple-700 border-purple-200",
  },
  ready_to_ship: {
    label: "প্যাকিং সম্পন্ন",
    color: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200",
  },
  shipped: {
    label: "শিপড",
    color: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  delivered: {
    label: "ডেলিভার্ড",
    color: "bg-green-50 text-green-700 border-green-200",
  },
  cancelled: {
    label: "বাতিল",
    color: "bg-red-50 text-red-700 border-red-200",
  },
};

const paymentMap = {
  pending_verification: {
    label: "যাচাই বাকি",
    color: "bg-amber-50 text-amber-700",
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

const statusTabs = [
  ["all", "সব অর্ডার"],
  ["pending", "পেন্ডিং"],
  ["confirmed", "কনফার্মড"],
  ["processing", "প্রসেসিং"],
  ["ready_to_ship", "প্যাকিং সম্পন্ন"],
  ["shipped", "শিপড"],
  ["delivered", "ডেলিভার্ড"],
  ["cancelled", "বাতিল"],
];

const money = (amount) =>
  `৳${Number(amount || 0).toLocaleString("bn-BD")}`;

const dateText = (value) =>
  new Date(value).toLocaleDateString("bn-BD", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

function Badge({ value, type = "order" }) {
  const item =
    type === "payment" ? paymentMap[value] : statusMap[value];

  return (
    <span
      className={`inline-flex items-center rounded-full border border-transparent px-2.5 py-1 text-[10px] font-bold whitespace-nowrap ${
        item?.color || "bg-base-200 text-muted"
      }`}
    >
      {item?.label || value}
    </span>
  );
}

function ProductThumb({ product, size = "md" }) {
  const [failed, setFailed] = useState(false);

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-base-300 bg-base-200 ${
        size === "lg" ? "size-16" : "size-12"
      }`}
    >
      {product?.image && !failed ? (
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <ImageOff size={20} className="text-muted" />
      )}
    </div>
  );
}

function StatCard({
  title,
  subtitle,
  value,
  icon: Icon,
  iconClass,
  note,
  noteClass,
}) {
  return (
    <div className="rounded-xl border border-base-300/70 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-xs font-bold text-primary sm:text-sm">
            {title}
          </h3>
          <p className="mt-0.5 text-[10px] text-muted sm:text-xs">
            {subtitle}
          </p>
        </div>
        <div
          className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${iconClass}`}
        >
          <Icon size={19} />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-end justify-between gap-2">
        <p className="text-2xl font-extrabold text-primary sm:text-3xl">
          {value.toLocaleString("bn-BD")}
          <span className="ml-1 text-sm font-semibold">টি</span>
        </p>
        <span
          className={`rounded-full px-2 py-1 text-[10px] font-bold ${noteClass}`}
        >
          {note}
        </span>
      </div>
    </div>
  );
}

function DetailRow({ label, children }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 text-xs sm:text-sm">
      <span className="shrink-0 text-muted">{label}</span>
      <span className="text-right font-semibold text-primary">
        {children}
      </span>
    </div>
  );
}

function OrderDetailsModal({ order, onClose }) {
  if (!order) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-primary/50 p-3 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-detail-title"
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-base-300 p-4 sm:p-5">
          <div>
            <p className="text-xs font-semibold text-secondary">
              Order Details
            </p>
            <h2
              id="order-detail-title"
              className="mt-1 text-lg font-extrabold text-primary"
            >
              #{order.id}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-lg bg-base-200"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto p-4 sm:p-5">
          <div className="flex flex-wrap gap-2">
            <Badge value={order.status} />
            <Badge value={order.paymentStatus} type="payment" />
            {order.customized && (
              <span className="rounded-full bg-fuchsia-50 px-3 py-1 text-[10px] font-bold text-fuchsia-700">
                Customized
              </span>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-base-300 p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-primary">
                <UserRound size={16} />
                কাস্টমার
              </h3>
              <p className="text-sm font-bold">{order.customer}</p>
              <a
                href={`tel:${order.phone}`}
                className="mt-2 flex items-center gap-2 text-xs text-secondary"
              >
                <Phone size={14} />
                {order.phone}
              </a>
              <p className="mt-2 flex items-start gap-2 text-xs text-muted">
                <MapPin size={14} className="shrink-0" />
                {order.address}
              </p>
            </div>

            <div className="rounded-xl border border-base-300 p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-primary">
                <CreditCard size={16} />
                পেমেন্ট
              </h3>
              <DetailRow label="মাধ্যম">
                {order.paymentMethod}
              </DetailRow>
              <DetailRow label="অগ্রিম প্রাপ্ত">
                {money(order.advancePaid)}
              </DetailRow>
              <DetailRow label="COD বাকি">
                {money(order.codBalance)}
              </DetailRow>
            </div>
          </div>

          <div className="rounded-xl border border-base-300 p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-primary">
              <Package size={16} />
              প্রোডাক্টসমূহ
            </h3>

            <div className="space-y-3">
              {order.products.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center gap-3 rounded-xl bg-base-200 p-3"
                >
                  <ProductThumb product={product} size="lg" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-primary sm:text-sm">
                      {product.name}
                    </p>
                    <p className="mt-1 text-[11px] text-muted">
                      {product.variant}
                    </p>
                    <p className="mt-1 text-[11px] text-muted">
                      Qty: {product.quantity}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-primary">
                    {money(product.price * product.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-base-200 p-4">
            <DetailRow label="অর্ডারের তারিখ">
              {dateText(order.date)}
            </DetailRow>
            <DetailRow label="কুরিয়ার">
              {order.courier || "এখনো নির্ধারিত নয়"}
            </DetailRow>
            {order.trackingId && (
              <DetailRow label="Tracking ID">
                {order.trackingId}
              </DetailRow>
            )}
            <div className="mt-2 border-t border-base-300 pt-2">
              <DetailRow label="সর্বমোট">
                {money(order.total)}
              </DetailRow>
            </div>
          </div>

          {order.note && (
            <div className="rounded-xl border border-secondary/15 bg-secondary/5 p-4">
              <p className="text-xs font-bold text-secondary">
                Customer Note
              </p>
              <p className="mt-1 text-sm text-primary">{order.note}</p>
            </div>
          )}

          {order.paymentStatus === "pending_verification" && (
            <div className="flex gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
              <AlertCircle size={17} className="shrink-0" />
              পেমেন্ট যাচাই না হওয়া পর্যন্ত অর্ডার প্রসেস করবেন না।
            </div>
          )}
        </div>

        <div className="flex justify-end border-t border-base-300 p-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
}

// =====================================
// MAIN PAGE
// =====================================

export default function AdminOrdersPage() {
  const [orders] = useState(demoOrders);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const perPage = 10;

  const selectedOrder =
    orders.find((item) => item.id === selectedOrderId) || null;

  const counts = useMemo(() => {
    const result = { all: orders.length };

    Object.keys(statusMap).forEach((status) => {
      result[status] = orders.filter(
        (order) => order.status === status
      ).length;
    });

    return result;
  }, [orders]);

  const stats = useMemo(() => {
    const active = orders.filter(
      (order) =>
        !["delivered", "cancelled"].includes(order.status)
    ).length;

    const pending = orders.filter(
      (order) => order.status === "pending"
    ).length;

    const custom = orders.filter(
      (order) =>
        order.customized &&
        ["confirmed", "processing"].includes(order.status)
    ).length;

    const transit = orders.filter(
      (order) => order.status === "shipped"
    ).length;

    return { active, pending, custom, transit };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const term = search.trim().toLowerCase();

    return orders
      .filter((order) => {
        const searchMatch =
          !term ||
          order.id.toLowerCase().includes(term) ||
          order.customer.toLowerCase().includes(term) ||
          order.phone.includes(term) ||
          order.products.some((product) =>
            product.name.toLowerCase().includes(term)
          );

        const statusMatch =
          activeTab === "all" || order.status === activeTab;

        const paymentMatch =
          paymentFilter === "all" ||
          order.paymentMethod === paymentFilter;

        let dateMatch = true;

        if (dateFilter !== "all") {
          const date = new Date(order.date);
          const now = new Date();
          const today = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
          );

          if (dateFilter === "today") {
            dateMatch = date >= today && date <= now;
          } else if (dateFilter === "week") {
            const start = new Date(today);
            start.setDate(start.getDate() - 6);
            dateMatch = date >= start && date <= now;
          } else if (dateFilter === "month") {
            dateMatch =
              date.getMonth() === now.getMonth() &&
              date.getFullYear() === now.getFullYear() &&
              date <= now;
          }
        }

        return (
          searchMatch &&
          statusMatch &&
          paymentMatch &&
          dateMatch
        );
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [orders, search, activeTab, paymentFilter, dateFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredOrders.length / perPage)
  );

  const currentPage = Math.min(page, totalPages);

  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  const resetPage = () => setPage(1);

  const resetFilters = () => {
    setActiveTab("all");
    setSearch("");
    setPaymentFilter("all");
    setDateFilter("all");
    setPage(1);
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-5 pb-10">

      {/* PAGE HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-primary sm:text-2xl">
            অর্ডার ম্যানেজমেন্ট
          </h1>
          <p className="mt-1 text-xs text-muted">
            সকল অর্ডার, পেমেন্ট ও ডেলিভারি স্ট্যাটাস এক জায়গায়।
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-semibold text-secondary shadow-sm">
          <ShoppingBag size={15} />
          {orders.length.toLocaleString("bn-BD")} Orders
        </div>
      </div>

      {/* 4 KPI CARDS — SCREENSHOT STYLE */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="মোট সক্রিয় অর্ডার"
          subtitle="Active Lifecycle"
          value={stats.active}
          icon={ShoppingBag}
          iconClass="bg-purple-100 text-primary"
          note="চলমান অর্ডার"
          noteClass="bg-purple-50 text-secondary"
        />

        <StatCard
          title="নতুন / পেন্ডিং অর্ডার"
          subtitle="Pending Confirmation"
          value={stats.pending}
          icon={ClipboardClock}
          iconClass="bg-amber-100 text-amber-800"
          note="ভেরিফিকেশন আবশ্যক"
          noteClass="bg-amber-100 text-amber-800"
        />

        <StatCard
          title="কাস্টমাইজড প্রস্তুত কাজ"
          subtitle="Custom Engraving & Craft"
          value={stats.custom}
          icon={Paintbrush}
          iconClass="bg-fuchsia-100 text-fuchsia-700"
          note="ওয়ার্কশপে চলমান"
          noteClass="bg-fuchsia-100 text-fuchsia-700"
        />

        <StatCard
          title="কুরিয়ারে হস্তান্তর / পথে আছে"
          subtitle="Dispatched & Transit"
          value={stats.transit}
          icon={Truck}
          iconClass="bg-purple-100 text-primary"
          note="Pathao & Steadfast"
          noteClass="bg-purple-50 text-primary"
        />
      </div>

      {/* ORDER SECTION */}
      <div className="overflow-hidden rounded-2xl border border-base-300/70 bg-white shadow-sm">

        {/* TABLE HEADING */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-base-300 p-4 sm:p-5">
          <div>
            <h2 className="text-base font-extrabold text-primary">
              সকল অর্ডার
            </h2>
            <p className="mt-1 text-xs text-muted">
              অর্ডারের বিস্তারিত তথ্য ও বর্তমান অবস্থা
            </p>
          </div>

          <span className="rounded-full bg-secondary/10 px-3 py-1.5 text-xs font-bold text-secondary">
            {filteredOrders.length.toLocaleString("bn-BD")} Results
          </span>
        </div>

        {/* STATUS TABS */}
        <div className="flex gap-2 overflow-x-auto border-b border-base-300 px-4 py-3 sm:px-5">
          {statusTabs.map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setActiveTab(value);
                resetPage();
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
                  activeTab === value
                    ? "bg-white/20"
                    : "bg-white"
                }`}
              >
                {counts[value] || 0}
              </span>
            </button>
          ))}
        </div>

        {/* FILTERS */}
        <div className="grid gap-3 border-b border-base-300 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-[minmax(0,1fr)_170px_150px_auto]">
          <label className="flex h-11 items-center gap-2 rounded-xl border border-base-300 bg-base-200 px-3 focus-within:border-secondary">
            <Search size={17} className="shrink-0 text-muted" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                resetPage();
              }}
              placeholder="Order ID, Customer, Phone, Product..."
              className="w-full min-w-0 bg-transparent text-xs text-primary outline-none placeholder:text-muted"
            />
          </label>

          <div className="relative">
            <select
              value={paymentFilter}
              onChange={(e) => {
                setPaymentFilter(e.target.value);
                resetPage();
              }}
              className="h-11 w-full appearance-none rounded-xl border border-base-300 bg-base-200 px-3 pr-9 text-xs font-semibold text-primary outline-none"
            >
              <option value="all">সব পেমেন্ট মাধ্যম</option>
              <option value="bKash">bKash</option>
              <option value="Nagad">Nagad</option>
              <option value="Rocket">Rocket</option>
              <option value="COD">COD</option>
            </select>
            <ChevronDown
              size={15}
              className="pointer-events-none absolute right-3 top-3.5 text-muted"
            />
          </div>

          <div className="relative">
            <select
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                resetPage();
              }}
              className="h-11 w-full appearance-none rounded-xl border border-base-300 bg-base-200 px-3 pr-9 text-xs font-semibold text-primary outline-none"
            >
              <option value="all">সব তারিখ</option>
              <option value="today">আজ</option>
              <option value="week">শেষ ৭ দিন</option>
              <option value="month">এই মাস</option>
            </select>
            <ChevronDown
              size={15}
              className="pointer-events-none absolute right-3 top-3.5 text-muted"
            />
          </div>

          <button
            type="button"
            onClick={resetFilters}
            className="flex h-11 items-center justify-center gap-2 rounded-xl border border-base-300 px-4 text-xs font-bold text-secondary hover:bg-base-200"
          >
            <RefreshCcw size={15} />
            Reset
          </button>
        </div>

        {/* DESKTOP ZEBRA TABLE */}
        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full min-w-[1050px] border-collapse text-left">
            <thead>
              <tr className="bg-[#f3edf5] text-[11px] font-bold text-primary">
                <th className="px-4 py-4">অর্ডার ID / তারিখ</th>
                <th className="px-4 py-4">কাস্টমার</th>
                <th className="px-4 py-4">প্রোডাক্ট</th>
                <th className="px-4 py-4">মোট / বকেয়া</th>
                <th className="px-4 py-4">পেমেন্ট</th>
                <th className="px-4 py-4">ডেলিভারি</th>
                <th className="px-4 py-4">স্ট্যাটাস</th>
                <th className="px-4 py-4 text-right">অ্যাকশন</th>
              </tr>
            </thead>

            <tbody>
              {paginatedOrders.map((order, index) => {
                const firstProduct = order.products[0];
                const quantity = order.products.reduce(
                  (sum, product) => sum + product.quantity,
                  0
                );

                return (
                  <tr
                    key={order.id}
                    className={`border-b border-base-300/50 transition hover:bg-purple-50/70 ${
                      index % 2 === 0
                        ? "bg-white"
                        : "bg-[#faf7fb]"
                    }`}
                  >
                    {/* ORDER */}
                    <td className="px-4 py-4 align-middle">
                      <p className="whitespace-nowrap text-sm font-semibold text-primary">
                        #{order.id}
                      </p>
                      <p className="mt-1.5 flex items-center gap-1 text-[10px] text-muted">
                        <CalendarDays size={12} />
                        {dateText(order.date)}
                      </p>
                    </td>

                    {/* CUSTOMER */}
                    <td className="px-4 py-4 align-middle">
                      <div className="flex items-start gap-2">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                          <UserRound size={15} />
                        </div>
                        <div className="min-w-0">
                          <p className="whitespace-nowrap text-xs font-bold text-primary">
                            {order.customer}
                          </p>
                          <p className="mt-1 text-[10px] text-muted">
                            {order.phone}
                          </p>
                          <p className="mt-1 max-w-36 truncate text-[10px] text-muted">
                            {order.address}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* PRODUCT WITH IMAGE */}
                    <td className="px-4 py-4 align-middle">
                      <div className="flex min-w-[190px] items-center gap-2.5">
                        <ProductThumb product={firstProduct} />

                        <div className="min-w-0">
                          <p className="line-clamp-2 max-w-44 text-xs font-bold leading-5 text-primary">
                            {firstProduct?.name}
                          </p>
                          <p className="mt-1 text-[10px] text-muted">
                            {firstProduct?.variant}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-1">
                            <span className="rounded bg-base-200 px-1.5 py-0.5 text-[10px] font-semibold text-muted">
                              Qty: {quantity}
                            </span>
                            {order.customized && (
                              <span className="rounded bg-fuchsia-50 px-1.5 py-0.5 text-[10px] font-bold text-fuchsia-700">
                                Custom
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* AMOUNT */}
                    <td className="px-4 py-4 align-middle">
                      <p className="whitespace-nowrap text-sm font-extrabold text-primary">
                        {money(order.total)}
                      </p>
                      <p className="mt-1 text-[10px] text-green-700">
                        Paid: {money(order.advancePaid)}
                      </p>
                      <p className="mt-1 text-[10px] font-semibold text-amber-700">
                        Due: {money(order.codBalance)}
                      </p>
                    </td>

                    {/* PAYMENT */}
                    <td className="px-4 py-4 align-middle">
                      <p className="mb-2 flex items-center gap-1 text-xs font-bold text-primary">
                        <Wallet size={13} className="text-secondary" />
                        {order.paymentMethod}
                      </p>
                      <Badge
                        value={order.paymentStatus}
                        type="payment"
                      />
                    </td>

                    {/* DELIVERY */}
                    <td className="px-4 py-4 align-middle">
                      <p className="flex items-center gap-1 text-xs font-bold text-primary">
                        <Truck size={13} className="text-secondary" />
                        {order.courier || "Not Assigned"}
                      </p>
                      <p className="mt-1 max-w-28 truncate text-[10px] text-muted">
                        {order.trackingId || "Tracking pending"}
                      </p>
                    </td>

                    {/* ORDER STATUS */}
                    <td className="px-4 py-4 align-middle">
                      <Badge value={order.status} />
                    </td>

                    {/* ACTION */}
                    <td className="px-4 py-4 text-right align-middle">
                      <button
                        type="button"
                        onClick={() => setSelectedOrderId(order.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-secondary/15 bg-secondary/10 px-3 py-2 text-[11px] font-bold text-secondary transition hover:bg-secondary hover:text-white"
                      >
                        <Eye size={14} />
                        Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* MOBILE + TABLET ORDER CARDS */}
        <div className="space-y-3 p-3 sm:p-4 lg:hidden">
          {paginatedOrders.map((order) => {
            const firstProduct = order.products[0];

            return (
              <div
                key={order.id}
                className="overflow-hidden rounded-xl border border-base-300 bg-white"
              >
                <div className="flex items-start justify-between gap-2 bg-base-200/70 p-3">
                  <div>
                    <p className="text-xs font-extrabold text-primary">
                      #{order.id}
                    </p>
                    <p className="mt-1 text-[10px] text-muted">
                      {dateText(order.date)}
                    </p>
                  </div>
                  <Badge value={order.status} />
                </div>

                <div className="space-y-3 p-3">
                  <div className="flex items-center gap-3">
                    <ProductThumb product={firstProduct} size="lg" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-primary">
                        {firstProduct?.name}
                      </p>
                      <p className="mt-1 text-[11px] text-muted">
                        {firstProduct?.variant}
                      </p>
                      <p className="mt-1 text-[10px] text-muted">
                        {order.products.length} Product Line(s)
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 rounded-lg bg-base-200/60 p-3">
                    <div>
                      <p className="text-[10px] text-muted">কাস্টমার</p>
                      <p className="mt-1 text-xs font-bold text-primary">
                        {order.customer}
                      </p>
                      <p className="mt-1 text-[10px] text-muted">
                        {order.phone}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted">সর্বমোট</p>
                      <p className="mt-1 text-sm font-extrabold text-primary">
                        {money(order.total)}
                      </p>
                      <p className="mt-1 text-[10px] text-amber-700">
                        Due: {money(order.codBalance)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-primary">
                        {order.paymentMethod}
                      </span>
                      <Badge
                        value={order.paymentStatus}
                        type="payment"
                      />
                    </div>
                    <span className="text-[11px] text-muted">
                      {order.courier || "Courier Pending"}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedOrderId(order.id)}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-bold text-white"
                  >
                    <Eye size={15} />
                    বিস্তারিত দেখুন
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* EMPTY STATE */}
        {paginatedOrders.length === 0 && (
          <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
            <div className="mb-3 flex size-14 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
              <ShoppingBag size={25} />
            </div>
            <h3 className="text-sm font-bold text-primary">
              কোনো অর্ডার পাওয়া যায়নি
            </h3>
            <p className="mt-2 text-xs text-muted">
              Filter পরিবর্তন করে আবার চেষ্টা করুন।
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

        {/* PAGINATION */}
        {filteredOrders.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-base-300 p-4 sm:px-5">
            <p className="text-xs text-muted">
              Showing{" "}
              {((currentPage - 1) * perPage + 1).toLocaleString("bn-BD")}
              {"–"}
              {Math.min(
                currentPage * perPage,
                filteredOrders.length
              ).toLocaleString("bn-BD")}
              {" of "}
              {filteredOrders.length.toLocaleString("bn-BD")}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="flex size-9 items-center justify-center rounded-lg border border-base-300 text-primary disabled:opacity-40"
              >
                <ChevronLeft size={17} />
              </button>

              <span className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white">
                {currentPage.toLocaleString("bn-BD")} /{" "}
                {totalPages.toLocaleString("bn-BD")}
              </span>

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() =>
                  setPage((p) => Math.min(totalPages, p + 1))
                }
                className="flex size-9 items-center justify-center rounded-lg border border-base-300 text-primary disabled:opacity-40"
              >
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* DETAILS MODAL */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrderId(null)}
        />
      )}
    </div>
  );
}
