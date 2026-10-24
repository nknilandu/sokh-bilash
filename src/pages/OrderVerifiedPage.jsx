
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  Download,
  Gift,
  Headphones,
  MapPin,
  MessageCircle,
  Package,
  PackageCheck,
  Phone,
  ShieldCheck,
  Sparkles,
  Truck,
  Wallet,
  Wrench,
} from "lucide-react";

// ============================================
// DEMO DATA - Replace with backend API response
// ============================================

const demoOrder = {
  _id: "order-1001",
  orderNumber: "SKB-98432",
  createdAt: "2026-10-24T18:45:00",

  status: "processing",

  payment: {
    method: "bkash",
    status: "rejected",
    verifiedAmount: 2280,
    senderPhone: "01712345678",
    trxId: "TXN987A4F2",
  },

  customer: {
    name: "রহিম আহমেদ",
    phone: "01712345678",
    division: "ঢাকা",
    district: "নরসিংদী",
    address: "বাড়ি #১২, রোড #০৭, ব্লক ডি, নরসিংদী",
  },

  items: [
    {
      id: "gift-1",
      name: "বিবাহবার্ষিকী স্পেশাল কাস্টম গিফট বক্স (কাঠের খোদাই ও ফ্রেম)",
      image: "",
      price: 4080,
      quantity: 1,
      customization: "চিরন্তনই হোক - অনন্ত ভালোবাসায়",
      variant: "রয়েল পার্পল ভেলভেট লাইনিং",
    },
  ],

  subtotal: 4080,
  discount: 0,
  deliveryCharge: 0,
  total: 4080,

  estimatedDelivery: "১৮ নভেম্বর ২০২৬, বিকেল ৪টা - রাত ৮টার মধ্যে",
  courierName: "পাঠাও প্রিমিয়াম এক্সপ্রেস",
};

// ============================================
// HELPERS
// ============================================

const money = (amount) =>
  `৳${Number(amount || 0).toLocaleString("bn-BD")}`;

const paymentNames = {
  bkash: "bKash",
  nagad: "Nagad",
  rocket: "Rocket",
  cod: "Cash on Delivery",
};

const statusSteps = [
  {
    key: "placed",
    label: "অর্ডার গ্রহণ",
    english: "Order Placed",
    icon: Check,
  },
  {
    key: "verified",
    label: "পেমেন্ট যাচাইকৃত",
    english: "Verified",
    icon: BadgeCheck,
  },
  {
    key: "processing",
    label: "কাজের মেয়াদ",
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
  confirmed: 1,
  processing: 2,
  packing: 3,
  shipped: 4,
  delivered: 5,
};

// ============================================
// MAIN PAGE
// ============================================

export default function OrderVerifiedPage() {
  const { orderId } = useParams();

  const [copied, setCopied] = useState(false);

  // Replace with actual order API response
  const order = demoOrder;

  const total = Number(order.total || 0);

  const isVerified = order.payment.status === "verified";

  const paidAmount = isVerified
    ? Math.max(
        0,
        Math.min(
          Number(order.payment.verifiedAmount || 0),
          total
        )
      )
    : 0;

  const dueBalance = Math.max(total - paidAmount, 0);

  const currentStep = statusIndex[order.status] ?? 0;

  const itemCount = order.items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const copyOrderNumber = async () => {
    try {
      await navigator.clipboard.writeText(order.orderNumber);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const handleDownloadInvoice = () => {
    // Replace with backend-generated invoice URL.
    // Example: GET /orders/:orderId/invoice
    alert("Invoice download API connect করতে হবে।");
  };

  return (
    <main className="min-h-screen bg-base-200/60 py-6 text-base-content sm:py-10">
      <div className="page-container max-w-5xl">

        {/* ===================================== */}
        {/* BREADCRUMB */}
        {/* ===================================== */}

        <nav className="mb-8 flex flex-wrap items-center justify-center gap-2 text-xs text-muted">
          <Link to="/" className="hover:text-secondary">
            হোম (Home)
          </Link>

          <span>›</span>

          <Link
            to="/track-order"
            className="hover:text-secondary"
          >
            আমার অর্ডারসমূহ
          </Link>

          <span>›</span>

          <span className="font-semibold text-secondary">
            #{order.orderNumber} নিশ্চিতকরণ
          </span>
        </nav>

        {/* ===================================== */}
        {/* VERIFIED HERO */}
        {/* ===================================== */}

        <section className="mb-8 text-center">

          <div className="relative mx-auto mb-5 flex size-20 items-center justify-center rounded-full bg-emerald-100">
            <BadgeCheck
              size={38}
              className="text-emerald-600"
            />

            <span className="absolute bottom-0 right-0 flex size-6 items-center justify-center rounded-full border-2 border-white bg-emerald-500 text-white">
              <Check size={13} />
            </span>
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-4 py-1.5 text-xs font-semibold text-emerald-700">
            <CheckCircle2 size={14} />
            পেমেন্ট ভেরিফাইড (Payment Verified)
          </span>

          <h1 className="mx-auto mt-4 max-w-xl text-2xl font-extrabold leading-tight text-primary sm:text-4xl">
            আপনার পেমেন্ট যাচাই সম্পন্ন হয়েছে
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted">
            আপনার অগ্রিম পেমেন্ট সফলভাবে যাচাই করা হয়েছে।
            আপনার বিশেষ কাস্টমাইজড আইটেম তৈরির কাজ
            আমাদের কারিগর দল শুরু করেছে।
          </p>
        </section>

        {/* ===================================== */}
        {/* ORDER HEADER & FINANCIAL CARDS */}
        {/* ===================================== */}

        <section className="section-card mb-6 p-4 sm:p-6">

          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-semibold text-muted">
                  অর্ডার ট্র্যাকিং কোড
                </p>

                <span className="rounded bg-base-200 px-2 py-0.5 text-[10px] font-bold text-primary">
                  CONFIRMED
                </span>
              </div>

              <div className="mt-1 flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-primary">
                  অর্ডার #{order.orderNumber}
                </h2>

                <button
                  type="button"
                  onClick={copyOrderNumber}
                  className="rounded-md p-1 text-secondary hover:bg-secondary/10"
                  aria-label="অর্ডার নম্বর কপি করুন"
                >
                  {copied ? (
                    <Check size={15} />
                  ) : (
                    <Copy size={15} />
                  )}
                </button>
              </div>

              <p className="mt-1 flex items-center gap-1 text-xs text-muted">
                <CalendarDays size={13} />

                {new Date(order.createdAt).toLocaleString(
                  "bn-BD",
                  {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }
                )}
              </p>
            </div>

            <div className="flex flex-col items-start gap-2 sm:items-end">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                <CheckCircle2 size={13} />
                Payment Verified (অনুমোদিত)
              </span>

              <span className="inline-flex items-center gap-1 rounded-full bg-secondary/10 px-3 py-1 text-xs font-semibold text-secondary">
                <Wrench size={13} />
                কারিগরের কাজ (In Production)
              </span>
            </div>
          </div>

          {/* Financial Cards */}
          <div className="mt-6 grid gap-3 sm:grid-cols-3">

            {/* Total */}
            <div className="rounded-xl bg-secondary/5 p-4">
              <p className="text-xs font-semibold text-muted">
                সর্বমোট গিফট মূল্য
              </p>

              <p className="mt-2 text-xl font-extrabold text-primary">
                {money(total)}
              </p>

              <p className="mt-1 text-xs text-muted">
                ১০০% ভ্যাট ও প্যাকেজিং সহ
              </p>
            </div>

            {/* Paid */}
            <div className="rounded-xl bg-emerald-50 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-emerald-700">
                  পরিশোধিত অগ্রিম
                </p>

                <ShieldCheck
                  size={16}
                  className="text-emerald-600"
                />
              </div>

              <p className="mt-2 text-xl font-extrabold text-emerald-700">
                {money(paidAmount)}
              </p>

              <p className="mt-1 text-xs text-emerald-700">
                ম্যানুয়ালি ভেরিফাইড ও অনুমোদিত
              </p>
            </div>

            {/* COD */}
            <div className="rounded-xl bg-amber-50 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-amber-800">
                  অবশিষ্ট ব্যালেন্স (COD)
                </p>

                <Wallet
                  size={16}
                  className="text-amber-700"
                />
              </div>

              <p className="mt-2 text-xl font-extrabold text-amber-900">
                {money(dueBalance)}
              </p>

              <p className="mt-1 text-xs text-amber-800">
                ডেলিভারির সময় প্রদেয় টাকা
              </p>
            </div>
          </div>
        </section>

        {/* ===================================== */}
        {/* ORDER PROGRESS */}
        {/* ===================================== */}

        <section className="section-card mb-6 p-4 sm:p-6">

          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-extrabold text-primary">
                অর্ডার অগ্রগতি স্ট্যাটাস
              </h2>

              <p className="mt-1 text-xs text-muted">
                রিয়েল-টাইম কাস্টমাইজেশন ও ডেলিভারি
                পদক্ষেপসমূহ
              </p>
            </div>

            <span className="badge-soft">
              ধাপ {currentStep + 1} / ৬ সক্রিয়
            </span>
          </div>

          {/* Progress Steps */}
          <div className="relative overflow-x-auto pb-2">
            <div className="relative grid min-w-[570px] grid-cols-6 gap-2">

              {/* Background Line */}
              <div className="absolute left-[8.33%] right-[8.33%] top-5 h-1 rounded-full bg-base-300" />

              {/* Active Line */}
              <div
                className="absolute left-[8.33%] top-5 h-1 rounded-full bg-secondary transition-all"
                style={{
                  width: `${
                    (currentStep / 5) * 83.34
                  }%`,
                }}
              />

              {statusSteps.map((step, index) => {
                const Icon = step.icon;

                const completed = index < currentStep;
                const active = index === currentStep;

                return (
                  <div
                    key={step.key}
                    className="relative flex flex-col items-center text-center"
                  >
                    <div
                      className={`z-10 flex size-10 items-center justify-center rounded-full border-2 shadow-sm ${
                        completed
                          ? "border-secondary bg-secondary text-white"
                          : active
                            ? "border-gold-soft bg-gold-soft text-primary"
                            : "border-base-200 bg-base-200 text-muted"
                      }`}
                    >
                      <Icon size={17} />
                    </div>

                    <p
                      className={`mt-3 text-xs font-bold ${
                        completed
                          ? "text-secondary"
                          : active
                            ? "text-primary"
                            : "text-muted"
                      }`}
                    >
                      {step.label}
                    </p>

                    <p className="mt-1 text-[10px] text-muted">
                      {step.english}
                    </p>

                    <span
                      className={`mt-2 rounded px-2 py-0.5 text-[10px] font-semibold ${
                        completed
                          ? "bg-emerald-50 text-emerald-700"
                          : active
                            ? "bg-gold-soft/40 text-primary"
                            : "bg-base-200 text-muted"
                      }`}
                    >
                      {completed
                        ? "সম্পন্ন"
                        : active
                          ? "চলমান"
                          : "অপেক্ষমাণ"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Progress Note */}
          <div className="mt-6 flex items-start gap-3 rounded-xl bg-secondary/5 p-4">
            <Sparkles
              size={18}
              className="mt-0.5 shrink-0 text-secondary"
            />

            <p className="text-xs leading-6 text-muted">
              <span className="font-bold text-primary">
                শিল্পী নোট:
              </span>{" "}
              পেমেন্ট যাচাই সম্পন্ন হয়েছে। আপনার
              অর্ডারের বর্তমান অবস্থা অনুযায়ী কাজ
              এগিয়ে চলছে। পরবর্তী আপডেট এখানে
              দেখতে পারবেন।
            </p>
          </div>
        </section>

        {/* ===================================== */}
        {/* ITEMIZED SUMMARY */}
        {/* ===================================== */}

        <section className="section-card mb-6 p-4 sm:p-6">

          <h2 className="mb-5 flex items-center gap-2 text-base font-extrabold text-primary">
            <Package
              size={19}
              className="text-secondary"
            />
            অর্ডারের বিশদ বিবরণ
            <span className="text-xs font-medium text-muted">
              (Itemized Summary)
            </span>
          </h2>

          {/* Products */}
          <div className="space-y-3">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-3 rounded-xl bg-secondary/5 p-3 sm:flex-row sm:items-center sm:p-4"
              >
                <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white text-secondary">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="size-full object-cover"
                    />
                  ) : (
                    <Gift size={27} />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold leading-6 text-primary sm:text-base">
                    {item.name}
                  </h3>

                  {item.customization && (
                    <p className="mt-1 text-xs leading-5 text-muted">
                      ব্যক্তিগত বার্তা:{" "}
                      <span className="font-semibold text-secondary">
                        "{item.customization}"
                      </span>
                    </p>
                  )}

                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="rounded-md bg-white px-2 py-1 text-xs text-primary">
                      পরিমাণ: {item.quantity} টি
                    </span>

                    {item.variant && (
                      <span className="rounded-md bg-white px-2 py-1 text-xs text-primary">
                        {item.variant}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <p className="text-lg font-extrabold text-primary">
                    {money(item.price * item.quantity)}
                  </p>

                  <p className="text-xs text-muted">
                    মোট মূল্য
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Price Breakdown */}
          <div className="mt-6 space-y-3 text-sm">

            <div className="flex items-center justify-between gap-3">
              <span className="text-muted">
                সর্বমোট অর্ডার মূল্য (Subtotal):
              </span>

              <strong className="text-primary">
                {money(order.subtotal)}
              </strong>
            </div>

            {Number(order.discount) > 0 && (
              <div className="flex items-center justify-between gap-3">
                <span className="text-secondary">
                  ডিসকাউন্ট:
                </span>

                <strong className="text-secondary">
                  - {money(order.discount)}
                </strong>
              </div>
            )}

            {/* Verified Payment */}
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-emerald-700">
              <span className="flex items-center gap-2 text-xs font-semibold sm:text-sm">
                <CheckCircle2 size={16} />
                অনুমোদিত অগ্রিম (
                {paymentNames[order.payment.method]} Verified):
              </span>

              <strong>- {money(paidAmount)}</strong>
            </div>

            {/* Delivery */}
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted">
                ডেলিভারি চার্জ:
              </span>

              <span className="font-semibold text-emerald-700">
                {Number(order.deliveryCharge) === 0
                  ? "ফ্রি"
                  : money(order.deliveryCharge)}
              </span>
            </div>

            {/* Remaining */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-secondary/10 p-4">
              <div>
                <h3 className="text-base font-extrabold text-primary">
                  অবশিষ্ট প্রদেয় ব্যালেন্স
                </h3>

                <p className="mt-1 text-xs text-muted">
                  ডেলিভারির সময় ক্যাশ অন ডেলিভারি (COD)
                </p>
              </div>

              <strong className="text-2xl font-extrabold text-primary">
                {money(dueBalance)}
              </strong>
            </div>
          </div>

          {/* Delivery Details */}
          <div className="mt-5 grid gap-4 rounded-xl bg-secondary/5 p-4 sm:grid-cols-2">

            <div className="flex items-start gap-2">
              <MapPin
                size={18}
                className="mt-0.5 shrink-0 text-secondary"
              />

              <div>
                <h3 className="text-sm font-bold text-primary">
                  ডেলিভারি ঠিকানা
                </h3>

                <p className="mt-2 text-xs leading-5 text-muted">
                  {order.customer.address},{" "}
                  {order.customer.district},{" "}
                  {order.customer.division}
                </p>

                <p className="mt-1 text-xs text-muted">
                  প্রাপক: {order.customer.name}
                  <br />
                  {order.customer.phone}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Clock3
                size={18}
                className="mt-0.5 shrink-0 text-secondary"
              />

              <div>
                <h3 className="text-sm font-bold text-primary">
                  সম্ভাব্য ডেলিভারি তারিখ
                </h3>

                <p className="mt-2 text-xs font-semibold leading-5 text-primary">
                  {order.estimatedDelivery ||
                    "এখনো নির্ধারিত হয়নি"}
                </p>

                <p className="mt-1 text-xs text-muted">
                  লজিস্টিক পার্টনার:{" "}
                  {order.courierName ||
                    "এখনো নির্ধারিত হয়নি"}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ===================================== */}
        {/* ACTION BUTTONS */}
        {/* ===================================== */}

        <div className="mb-6 grid gap-3 sm:grid-cols-2">

          <Link
            to={`/track-order/${orderId || order._id}`}
            className="btn-brand w-full rounded-xl text-sm"
          >
            <PackageCheck size={17} />
            অর্ডার ট্র্যাক করুন
            <ArrowRight size={16} />
          </Link>

          <button
            type="button"
            onClick={handleDownloadInvoice}
            className="btn-outline-brand w-full rounded-xl text-sm"
          >
            <Download size={17} />
            চালান ডাউনলোড করুন (Download Invoice)
          </button>
        </div>

        {/* ===================================== */}
        {/* SUPPORT FOOTER */}
        {/* ===================================== */}

        <section className="flex flex-col gap-4 rounded-2xl bg-secondary/5 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">

          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <Headphones size={19} />
            </span>

            <div>
              <h3 className="text-sm font-bold text-primary">
                সহায়তার প্রয়োজন বা নকশায় পরিবর্তন?
              </h3>

              <p className="mt-1 text-xs leading-5 text-muted">
                আমাদের স্পেশাল গিফট কনসালট্যান্ট দল
                আপনার সেবায় সার্বক্ষণিক নিয়োজিত।
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              to="/contact"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-primary"
            >
              <MessageCircle size={15} />
              যোগাযোগ করুন
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
