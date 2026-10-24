
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Copy,
  CreditCard,
  Gift,
  Headphones,
  LockKeyhole,
  MapPin,
  MessageCircle,
  Package,
  PackageCheck,
  PackageSearch,
  Phone,
  RefreshCcw,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
  Wallet,
  Wrench,
  XCircle,
} from "lucide-react";

// =============================================
// CONFIGURATION
// =============================================

// Set true when backend tracking endpoint is ready.
const USE_API = false;

const API_URL = import.meta.env.VITE_API_URL || "";

// =============================================
// DEMO DATA
// =============================================

const demoOrder = {
  _id: "order-1001",
  orderNumber: "SKB-98432",
  createdAt: "2026-10-24T18:45:00",

  status: "processing",

  payment: {
    method: "bkash",
    status: "verified",
    verifiedAmount: 2280,
  },

  customer: {
    name: "রহিম আহমেদ",
    phone: "01712345678",
    division: "ঢাকা",
    district: "নরসিংদী",
    address: "নরসিংদী সদর, নরসিংদী",
  },

  items: [
    {
      id: "gift-1",
      name: "বিবাহবার্ষিকী স্পেশাল কাস্টম গিফট বক্স",
      image: "",
      price: 4080,
      quantity: 1,
      variant: "রয়েল পার্পল ভেলভেট লাইনিং",
    },
  ],

  subtotal: 4080,
  discount: 0,
  deliveryCharge: 80,
  total: 4160,

  estimatedDelivery: null,

  courier: {
    name: null,
    trackingNumber: null,
    trackingUrl: null,
  },

  history: [
    {
      status: "placed",
      date: "2026-10-24T18:45:00",
      note: "আপনার অর্ডার সফলভাবে গ্রহণ করা হয়েছে।",
    },
    {
      status: "verified",
      date: "2026-10-25T10:30:00",
      note: "আপনার পেমেন্ট যাচাই সম্পন্ন হয়েছে।",
    },
    {
      status: "processing",
      date: "2026-10-25T12:00:00",
      note: "আপনার উপহার প্রস্তুতের কাজ শুরু হয়েছে।",
    },
  ],
};

// =============================================
// HELPERS
// =============================================

const money = (value) =>
  `৳${Number(value || 0).toLocaleString("bn-BD")}`;

const formatDate = (date) => {
  if (!date) return "এখনো নির্ধারিত হয়নি";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return date;

  return parsed.toLocaleString("bn-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const steps = [
  {
    key: "placed",
    label: "অর্ডার গ্রহণ",
    english: "Order Placed",
    icon: PackageCheck,
  },
  {
    key: "verified",
    label: "পেমেন্ট যাচাই",
    english: "Payment Verified",
    icon: ShieldCheck,
  },
  {
    key: "processing",
    label: "কাস্টমাইজেশন ও প্রস্তুতি",
    english: "In Production",
    icon: Wrench,
  },
  {
    key: "packing",
    label: "প্যাকিং ও গিফটিং",
    english: "Gift Packing",
    icon: Gift,
  },
  {
    key: "shipped",
    label: "কুরিয়ারে হস্তান্তর",
    english: "Dispatched",
    icon: Truck,
  },
  {
    key: "delivered",
    label: "ডেলিভারি সম্পন্ন",
    english: "Delivered",
    icon: MapPin,
  },
];

const statusIndex = {
  pending: 0,
  placed: 0,
  pending_payment_verification: 1,
  confirmed: 1,
  verified: 1,
  processing: 2,
  packing: 3,
  shipped: 4,
  delivered: 5,
};

const statusLabels = {
  pending: "অর্ডার গ্রহণ",
  placed: "অর্ডার গ্রহণ",
  pending_payment_verification: "পেমেন্ট যাচাই চলছে",
  confirmed: "অর্ডার নিশ্চিত",
  verified: "পেমেন্ট যাচাইকৃত",
  processing: "উপহার প্রস্তুত হচ্ছে",
  packing: "প্যাকিং চলছে",
  shipped: "কুরিয়ারে পাঠানো হয়েছে",
  delivered: "ডেলিভারি সম্পন্ন",
  payment_rejected: "পেমেন্ট যাচাই ব্যর্থ",
  cancelled: "অর্ডার বাতিল",
};

const paymentLabels = {
  pending: "Pending Verification",
  verified: "Payment Verified",
  rejected: "Payment Rejected",
  cod: "Cash on Delivery",
};

// =============================================
// MAIN COMPONENT
// =============================================

export default function OrderTrackingPage() {
  const { orderId } = useParams();

  const [orderNumber, setOrderNumber] = useState(
    orderId || ""
  );

  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (orderId) {
      setOrderNumber(orderId);
      setOrder(null);
    }
  }, [orderId]);

  // ===========================================
  // SEARCH ORDER
  // ===========================================

  const handleTrackOrder = async (event) => {
    event.preventDefault();

    setError("");
    setOrder(null);

    const number = orderNumber.trim().toUpperCase();
    const mobile = phone.trim();

    if (!number || !mobile) {
      setError("অর্ডার নম্বর ও মোবাইল নম্বর দিন।");
      return;
    }

    if (!/^01\d{9}$/.test(mobile)) {
      setError("সঠিক ১১ সংখ্যার মোবাইল নম্বর দিন।");
      return;
    }

    setLoading(true);

    try {
      if (!USE_API) {
        // DEMO MODE
        // Only exact matching demo credentials work.
        if (
          number === demoOrder.orderNumber &&
          mobile === demoOrder.customer.phone
        ) {
          setOrder(demoOrder);
        } else {
          setError(
            "এই তথ্য দিয়ে কোনো অর্ডার পাওয়া যায়নি।"
          );
        }

        return;
      }

      // PUBLIC TRACKING API
      // Backend must validate order number AND phone.
      const response = await fetch(
        `${API_URL}/orders/public/track`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderNumber: number,
            phone: mobile,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          "এই তথ্য দিয়ে কোনো অর্ডার পাওয়া যায়নি।"
        );
      }

      setOrder(data.order);
    } catch (err) {
      setError(
        err.message || "অর্ডার খুঁজতে সমস্যা হয়েছে।"
      );
    } finally {
      setLoading(false);
    }
  };

  // ===========================================
  // COPY ORDER NUMBER
  // ===========================================

  const handleCopy = async () => {
    if (!order) return;

    try {
      await navigator.clipboard.writeText(
        order.orderNumber
      );
      setCopied(true);
    } catch (err) {
      console.error(err);
    }
  };

  // ===========================================
  // DERIVED DATA
  // ===========================================

  const isRejected =
    order?.status === "payment_rejected";

  const isCancelled = order?.status === "cancelled";

  const isStopped = isRejected || isCancelled;

  const isCod = order?.payment?.method === "cod";

  const currentStep =
    statusIndex[order?.status] ?? 0;

  const paidAmount =
    order?.payment?.status === "verified"
      ? Math.min(
          Number(order?.total || 0),
          Math.max(
            0,
            Number(
              order?.payment?.verifiedAmount || 0
            )
          )
        )
      : 0;

  const dueBalance = Math.max(
    Number(order?.total || 0) - paidAmount,
    0
  );

  const showConfirmedBalance =
    isCod ||
    order?.payment?.status === "verified";

  const itemCount =
    order?.items?.reduce(
      (sum, item) =>
        sum + Number(item.quantity || 0),
      0
    ) || 0;

  // ===========================================
  // UI
  // ===========================================

  return (
    <main className="min-h-screen bg-base-200/60 py-8 text-base-content sm:py-12">
      <div className="page-container max-w-6xl">

        {/* ==================================== */}
        {/* PAGE HEADER */}
        {/* ==================================== */}

        <div className="mb-8 text-center">

          <span className="badge-soft">
            <PackageSearch size={14} />
            সহজ ও নিরাপদ অর্ডার ট্র্যাকিং
          </span>

          <h1 className="mt-3 text-2xl font-extrabold text-primary sm:text-4xl">
            আপনার অর্ডার ট্র্যাক করুন
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted">
            অর্ডার নম্বর ও মোবাইল নম্বর দিয়ে আপনার
            উপহারের সর্বশেষ অবস্থা, পেমেন্ট এবং
            ডেলিভারি আপডেট দেখুন।
          </p>
        </div>

        {/* ==================================== */}
        {/* SEARCH CARD */}
        {/* ==================================== */}

        <section className="section-card mx-auto mb-8 max-w-3xl overflow-hidden">

          <div className="border-b border-base-300/70 bg-secondary/5 px-5 py-4 sm:px-6">

            <h2 className="flex items-center gap-2 text-base font-bold text-primary">
              <Search
                size={18}
                className="text-secondary"
              />
              অর্ডার খুঁজুন
            </h2>

            <p className="mt-1 text-xs text-muted">
              লগইন ছাড়াই আপনার অর্ডারের বর্তমান অবস্থা
              জানতে পারবেন।
            </p>
          </div>

          <form
            onSubmit={handleTrackOrder}
            className="p-5 sm:p-6"
          >

            <div className="grid gap-4 sm:grid-cols-2">

              {/* Order Number */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-primary">
                  অর্ডার নম্বর *
                </label>

                <div className="relative">
                  <Package
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary"
                  />

                  <input
                    type="text"
                    value={orderNumber}
                    onChange={(event) =>
                      setOrderNumber(
                        event.target.value
                      )
                    }
                    placeholder="SKB-98432"
                    className="input h-12 w-full rounded-xl border-base-300 bg-base-200/50 pl-10 text-sm text-primary focus:border-secondary focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Mobile Number */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-primary">
                  অর্ডারের মোবাইল নম্বর *
                </label>

                <div className="relative">
                  <Phone
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary"
                  />

                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={11}
                    value={phone}
                    onChange={(event) =>
                      setPhone(
                        event.target.value.replace(
                          /\D/g,
                          ""
                        )
                      )
                    }
                    placeholder="01712345678"
                    className="input h-12 w-full rounded-xl border-base-300 bg-base-200/50 pl-10 text-sm text-primary focus:border-secondary focus:outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                role="alert"
                className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700"
              >
                <AlertCircle
                  size={16}
                  className="shrink-0"
                />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-brand mt-5 w-full rounded-xl py-3 text-sm disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner loading-xs" />
                  খোঁজা হচ্ছে...
                </>
              ) : (
                <>
                  <Search size={17} />
                  আমার অর্ডার খুঁজুন
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            <div className="mt-4 flex items-start justify-center gap-2 text-center text-xs text-muted">
              <LockKeyhole
                size={14}
                className="mt-0.5 shrink-0 text-secondary"
              />

              আপনার অর্ডারের তথ্য দেখতে অর্ডার
              নম্বর ও সঠিক মোবাইল নম্বর প্রয়োজন।
            </div>
          </form>
        </section>

        {/* ==================================== */}
        {/* EMPTY STATE */}
        {/* ==================================== */}

        {!order && !loading && (
          <div className="mx-auto max-w-xl py-5 text-center">

            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-secondary/10 text-secondary">
              <PackageSearch size={28} />
            </div>

            <h3 className="mt-4 text-base font-bold text-primary">
              আপনার অর্ডারের আপডেট এখানে দেখুন
            </h3>

            <p className="mt-2 text-sm leading-6 text-muted">
              উপরের ফর্মে অর্ডার নম্বর ও মোবাইল
              নম্বর দিয়ে সার্চ করুন।
            </p>

            {!USE_API && (
              <p className="mt-3 text-xs text-muted">
                Demo: SKB-98432 / 01712345678
              </p>
            )}
          </div>
        )}

        {/* ==================================== */}
        {/* TRACKING RESULTS */}
        {/* ==================================== */}

        {order && (
          <div className="space-y-6">

            {/* ================================= */}
            {/* ORDER SUMMARY HEADER */}
            {/* ================================= */}

            <section className="section-card p-4 sm:p-6">

              <div className="flex flex-wrap items-start justify-between gap-4">

                <div>
                  <p className="text-xs font-semibold text-muted">
                    আপনার অর্ডারের তথ্য
                  </p>

                  <div className="mt-1 flex items-center gap-2">

                    <h2 className="text-xl font-extrabold text-primary">
                      #{order.orderNumber}
                    </h2>

                    <button
                      type="button"
                      onClick={handleCopy}
                      aria-label="অর্ডার নম্বর কপি করুন"
                      className="rounded-md p-1 text-secondary hover:bg-secondary/10"
                    >
                      {copied ? (
                        <Check size={15} />
                      ) : (
                        <Copy size={15} />
                      )}
                    </button>
                  </div>

                  <p className="mt-2 flex items-center gap-1 text-xs text-muted">
                    <CalendarDays size={13} />
                    {formatDate(order.createdAt)}
                  </p>
                </div>

                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${
                    isStopped
                      ? "bg-red-100 text-red-700"
                      : order.status === "delivered"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-gold-soft/50 text-primary"
                  }`}
                >
                  {isStopped ? (
                    <XCircle size={14} />
                  ) : (
                    <Clock3 size={14} />
                  )}

                  {statusLabels[order.status] ||
                    order.status}
                </span>
              </div>

              {/* Financial Summary */}
              <div className="mt-6 grid gap-3 sm:grid-cols-3">

                <div className="rounded-xl bg-secondary/5 p-4">
                  <p className="text-xs font-semibold text-muted">
                    সর্বমোট অর্ডার
                  </p>

                  <p className="mt-2 text-xl font-extrabold text-primary">
                    {money(order.total)}
                  </p>

                  <p className="mt-1 text-xs text-muted">
                    পণ্য ও ডেলিভারি চার্জসহ
                  </p>
                </div>

                <div
                  className={`rounded-xl p-4 ${
                    order.payment?.status ===
                    "verified"
                      ? "bg-emerald-50"
                      : isRejected
                        ? "bg-red-50"
                        : "bg-secondary/5"
                  }`}
                >
                  <p className="text-xs font-semibold text-muted">
                    পেমেন্ট স্ট্যাটাস
                  </p>

                  <p
                    className={`mt-2 text-sm font-extrabold ${
                      order.payment?.status ===
                      "verified"
                        ? "text-emerald-700"
                        : isRejected
                          ? "text-red-700"
                          : "text-primary"
                    }`}
                  >
                    {isCod
                      ? "Cash on Delivery"
                      : paymentLabels[
                          order.payment?.status
                        ] || "Pending"}
                  </p>

                  <p className="mt-2 text-xs text-muted">
                    {isCod
                      ? "ফোনে নিশ্চিতকরণ প্রযোজ্য"
                      : order.payment?.status ===
                          "verified"
                        ? `পরিশোধিত ${money(paidAmount)}`
                        : "ম্যানুয়াল যাচাই প্রযোজ্য"}
                  </p>
                </div>

                <div className="rounded-xl bg-amber-50 p-4">
                  <p className="text-xs font-semibold text-amber-800">
                    অবশিষ্ট ব্যালেন্স (COD)
                  </p>

                  <p className="mt-2 text-xl font-extrabold text-amber-900">
                    {isStopped
                      ? "প্রযোজ্য নয়"
                      : showConfirmedBalance
                        ? money(dueBalance)
                        : "যাচাই অপেক্ষমাণ"}
                  </p>

                  <p className="mt-1 text-xs text-amber-800">
                    {isStopped
                      ? "অর্ডার স্থগিত / বাতিল"
                      : "ডেলিভারির সময় প্রদেয়"}
                  </p>
                </div>
              </div>
            </section>

            {/* ================================= */}
            {/* MAIN TWO COLUMN LAYOUT */}
            {/* ================================= */}

            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">

              {/* LEFT */}
              <div className="space-y-6">

                {/* ============================= */}
                {/* ORDER PROGRESS */}
                {/* ============================= */}

                <section className="section-card p-4 sm:p-6">

                  <div className="mb-6">
                    <h2 className="flex items-center gap-2 text-base font-extrabold text-primary">
                      <PackageCheck
                        size={19}
                        className="text-secondary"
                      />
                      অর্ডারের অগ্রগতি
                    </h2>

                    <p className="mt-1 text-xs text-muted">
                      আপনার অর্ডারের প্রতিটি ধাপের
                      সর্বশেষ অবস্থা
                    </p>
                  </div>

                  <div className="space-y-0">

                    {steps.map((step, index) => {
                      const Icon = step.icon;

                      const completed =
                        !isStopped &&
                        index < currentStep;

                      const active =
                        !isStopped &&
                        index === currentStep;

                      const failed =
                        isStopped && index === 1;

                      const historyItem =
                        order.history?.find(
                          (item) =>
                            item.status === step.key
                        );

                      return (
                        <div
                          key={step.key}
                          className="flex gap-4"
                        >

                          {/* Icon and Line */}
                          <div className="flex flex-col items-center">

                            <div
                              className={`z-10 flex size-10 shrink-0 items-center justify-center rounded-full border-2 ${
                                failed
                                  ? "border-red-500 bg-red-500 text-white"
                                  : completed
                                    ? "border-emerald-500 bg-emerald-500 text-white"
                                    : active
                                      ? "border-gold-soft bg-gold-soft text-primary"
                                      : "border-base-300 bg-base-200 text-muted"
                              }`}
                            >
                              {failed ? (
                                <XCircle size={18} />
                              ) : completed ? (
                                <Check size={18} />
                              ) : (
                                <Icon size={18} />
                              )}
                            </div>

                            {index !==
                              steps.length - 1 && (
                              <div
                                className={`my-1 min-h-8 w-0.5 flex-1 ${
                                  completed
                                    ? "bg-emerald-400"
                                    : "bg-base-300"
                                }`}
                              />
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex min-w-0 flex-1 flex-wrap items-start justify-between gap-2 pb-8">

                            <div>
                              <h3
                                className={`text-sm font-bold ${
                                  failed
                                    ? "text-red-700"
                                    : active
                                      ? "text-primary"
                                      : completed
                                        ? "text-emerald-700"
                                        : "text-muted"
                                }`}
                              >
                                {step.label}
                              </h3>

                              <p className="mt-1 text-xs text-muted">
                                {step.english}
                              </p>

                              {historyItem && (
                                <>
                                  <p className="mt-2 text-xs text-muted">
                                    {formatDate(
                                      historyItem.date
                                    )}
                                  </p>

                                  <p className="mt-1 text-xs leading-5 text-muted">
                                    {historyItem.note}
                                  </p>
                                </>
                              )}
                            </div>

                            <span
                              className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                                failed
                                  ? "bg-red-100 text-red-700"
                                  : completed
                                    ? "bg-emerald-100 text-emerald-700"
                                    : active
                                      ? "bg-gold-soft/50 text-primary"
                                      : "bg-base-200 text-muted"
                              }`}
                            >
                              {failed
                                ? "ব্যর্থ"
                                : completed
                                  ? "সম্পন্ন"
                                  : active
                                    ? "চলমান"
                                    : "অপেক্ষমাণ"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Progress Note */}
                  <div
                    className={`flex items-start gap-3 rounded-xl p-4 ${
                      isStopped
                        ? "bg-red-50"
                        : "bg-secondary/5"
                    }`}
                  >
                    {isStopped ? (
                      <AlertCircle
                        size={18}
                        className="mt-0.5 shrink-0 text-red-600"
                      />
                    ) : (
                      <Sparkles
                        size={18}
                        className="mt-0.5 shrink-0 text-secondary"
                      />
                    )}

                    <p className="text-xs leading-6 text-muted">
                      {isCancelled
                        ? "আপনার অর্ডারটি বাতিল হয়েছে। বিস্তারিত জানতে সাপোর্টে যোগাযোগ করুন।"
                        : isRejected
                          ? "পেমেন্ট যাচাই ব্যর্থ হয়েছে। সংশোধনের সুযোগ থাকলে আবার তথ্য জমা দিতে পারবেন।"
                          : order.status === "delivered"
                            ? "আপনার অর্ডার সফলভাবে ডেলিভারি সম্পন্ন হয়েছে।"
                            : "আপনার উপহার প্রস্তুতি ও ডেলিভারির আপডেট এখানে নিয়মিত দেখতে পারবেন।"}
                    </p>
                  </div>
                </section>

                {/* ============================= */}
                {/* ORDER HISTORY */}
                {/* ============================= */}

                {order.history?.length > 0 && (
                  <section className="section-card p-4 sm:p-6">

                    <h2 className="mb-5 flex items-center gap-2 text-base font-extrabold text-primary">
                      <Clock3
                        size={19}
                        className="text-secondary"
                      />
                      সাম্প্রতিক আপডেট
                    </h2>

                    <div className="space-y-4">
                      {[...order.history]
                        .reverse()
                        .map((item, index) => (
                          <div
                            key={`${item.status}-${index}`}
                            className="flex gap-3"
                          >
                            <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                              <CheckCircle2 size={15} />
                            </div>

                            <div>
                              <h3 className="text-sm font-bold text-primary">
                                {statusLabels[
                                  item.status
                                ] || item.status}
                              </h3>

                              <p className="mt-1 text-xs text-muted">
                                {formatDate(item.date)}
                              </p>

                              <p className="mt-1 text-xs leading-5 text-muted">
                                {item.note}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </section>
                )}
              </div>

              {/* ================================= */}
              {/* RIGHT SIDEBAR */}
              {/* ================================= */}

              <div className="space-y-5">

                {/* ORDER ITEMS */}
                <section className="section-card p-4 sm:p-5">

                  <div className="mb-4 flex items-center justify-between gap-2">
                    <h2 className="flex items-center gap-2 text-sm font-extrabold text-primary">
                      <ShoppingBag
                        size={18}
                        className="text-secondary"
                      />
                      অর্ডারের পণ্যসমূহ
                    </h2>

                    <span className="badge-soft">
                      {itemCount} টি পণ্য
                    </span>
                  </div>

                  <div className="space-y-3">
                    {order.items?.map((item) => (
                      <div
                        key={item.id}
                        className="flex gap-3 rounded-xl bg-secondary/5 p-3"
                      >
                        <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white text-secondary">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="size-full object-cover"
                            />
                          ) : (
                            <Gift size={23} />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="line-clamp-2 text-xs font-bold leading-5 text-primary">
                            {item.name}
                          </h3>

                          <p className="mt-1 text-xs text-muted">
                            পরিমাণ: {item.quantity}
                          </p>

                          <p className="mt-1 text-sm font-extrabold text-primary">
                            {money(
                              item.price *
                                item.quantity
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Price Breakdown */}
                  <div className="mt-5 space-y-3 border-t border-base-300 pt-4 text-xs">

                    <div className="flex justify-between gap-2">
                      <span className="text-muted">
                        পণ্যের মূল্য
                      </span>

                      <strong className="text-primary">
                        {money(order.subtotal)}
                      </strong>
                    </div>

                    {Number(order.discount) > 0 && (
                      <div className="flex justify-between gap-2">
                        <span className="text-muted">
                          ডিসকাউন্ট
                        </span>

                        <strong className="text-secondary">
                          - {money(order.discount)}
                        </strong>
                      </div>
                    )}

                    <div className="flex justify-between gap-2">
                      <span className="text-muted">
                        ডেলিভারি চার্জ
                      </span>

                      <strong className="text-primary">
                        {Number(
                          order.deliveryCharge
                        ) === 0
                          ? "ফ্রি"
                          : money(
                              order.deliveryCharge
                            )}
                      </strong>
                    </div>

                    <div className="flex justify-between gap-2 rounded-lg bg-secondary/10 p-3 text-sm">
                      <strong className="text-primary">
                        সর্বমোট
                      </strong>

                      <strong className="text-primary">
                        {money(order.total)}
                      </strong>
                    </div>

                    {order.payment?.status ===
                      "verified" && (
                      <div className="flex justify-between gap-2 text-emerald-700">
                        <span>
                          যাচাইকৃত অগ্রিম
                        </span>

                        <strong>
                          - {money(paidAmount)}
                        </strong>
                      </div>
                    )}
                  </div>
                </section>

                {/* DELIVERY */}
                <section className="section-card p-4 sm:p-5">

                  <h2 className="mb-4 flex items-center gap-2 text-sm font-extrabold text-primary">
                    <Truck
                      size={18}
                      className="text-secondary"
                    />
                    ডেলিভারি তথ্য
                  </h2>

                  <div className="space-y-4 text-xs">

                    <div>
                      <p className="font-semibold text-primary">
                        ডেলিভারি এলাকা
                      </p>

                      <p className="mt-1 text-muted">
                        {order.customer?.district},{" "}
                        {order.customer?.division}
                      </p>
                    </div>

                    <div>
                      <p className="font-semibold text-primary">
                        সম্ভাব্য ডেলিভারি
                      </p>

                      <p className="mt-1 text-muted">
                        {order.estimatedDelivery ||
                          "এখনো নির্ধারিত হয়নি"}
                      </p>
                    </div>

                    <div>
                      <p className="font-semibold text-primary">
                        কুরিয়ার পার্টনার
                      </p>

                      <p className="mt-1 text-muted">
                        {order.courier?.name ||
                          "এখনো নির্ধারিত হয়নি"}
                      </p>
                    </div>

                    {order.courier
                      ?.trackingNumber && (
                      <div>
                        <p className="font-semibold text-primary">
                          কুরিয়ার ট্র্যাকিং নম্বর
                        </p>

                        <p className="mt-1 font-bold text-secondary">
                          {
                            order.courier
                              .trackingNumber
                          }
                        </p>
                      </div>
                    )}

                    {order.courier?.trackingUrl &&
                      /^https:\/\//i.test(
                        order.courier.trackingUrl
                      ) && (
                        <a
                          href={
                            order.courier.trackingUrl
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-semibold text-secondary hover:underline"
                        >
                          কুরিয়ার ট্র্যাকিং দেখুন
                          <ArrowRight size={14} />
                        </a>
                      )}
                  </div>
                </section>

                {/* HELP */}
                <section className="rounded-2xl bg-secondary/5 p-4 sm:p-5">

                  <div className="flex items-start gap-3">
                    <div className="icon-box">
                      <Headphones size={20} />
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-primary">
                        সাহায্য প্রয়োজন?
                      </h3>

                      <p className="mt-1 text-xs leading-5 text-muted">
                        অর্ডার বা ডেলিভারি নিয়ে
                        কোনো প্রশ্ন থাকলে যোগাযোগ
                        করুন।
                      </p>
                    </div>
                  </div>

                  <Link
                    to="/contact"
                    className="btn-outline-brand mt-4 w-full rounded-xl px-3 py-2.5 text-xs"
                  >
                    <MessageCircle size={15} />
                    সাপোর্টে যোগাযোগ করুন
                  </Link>
                </section>
              </div>
            </div>

            {/* ================================= */}
            {/* BOTTOM ACTIONS */}
            {/* ================================= */}

            <div className="grid gap-3 sm:grid-cols-2">

              <button
                type="button"
                onClick={() => {
                  setOrder(null);
                  setError("");
                }}
                className="btn-outline-brand w-full rounded-xl text-sm"
              >
                <RefreshCcw size={17} />
                অন্য অর্ডার খুঁজুন
              </button>

              <Link
                to="/shop"
                className="btn-brand w-full rounded-xl text-sm"
              >
                <ShoppingBag size={17} />
                আরও উপহার দেখুন
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
