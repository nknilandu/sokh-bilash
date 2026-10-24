
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
  CreditCard,
  Gift,
  Headphones,
  Hourglass,
  MapPin,
  MessageCircle,
  Package,
  PackageCheck,
  Phone,
  ReceiptText,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
  Wallet,
  Wrench,
} from "lucide-react";

// ============================================
// DEMO ORDER DATA
// Replace with backend API response later
// ============================================

const demoOrder = {
  _id: "order-1001",
  orderNumber: "SKB-98432",
  createdAt: "2026-10-24T18:45:00",

  status: "pending_payment_verification",

  payment: {
    method: "bkash",
    status: "pending",
    senderPhone: "01712345678",
    trxId: "TXN987A4F2",
    submittedAmount: 2280,
    verifiedAmount: 0,
  },

  customer: {
    name: "রহিম আহমেদ",
    phone: "01712345678",
    division: "ঢাকা",
    district: "নরসিংদী",
    address: "বাড়ি #১২, রোড #০৭, ব্লক ডি, নরসিংদী",
    note: "বিকেলের মধ্যে ডেলিভারি করার অনুরোধ।",
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
  deliveryCharge: 80,
  total: 4160,

  estimatedDelivery: null,
  courierName: null,
};

// ============================================
// HELPERS
// ============================================

const money = (amount) =>
  `৳${Number(amount || 0).toLocaleString("bn-BD")}`;

const paymentNames = {
  bkash: "bKash (Send Money)",
  nagad: "Nagad (Send Money)",
  rocket: "Rocket (Send Money)",
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
    label: "পেমেন্ট যাচাই",
    english: "Payment Verification",
    icon: ShieldCheck,
  },
  {
    key: "processing",
    label: "কাজের প্রস্তুতি",
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

// ============================================
// MAIN COMPONENT
// ============================================

export default function OrderConfirmationPage() {
  const { orderId } = useParams();
  const [copied, setCopied] = useState(false);

  // Replace with actual backend API response
  const order = demoOrder;

  const isCod = order.payment.method === "cod";
  const isVerified = order.payment.status === "verified";

  const subtotal = Number(order.subtotal || 0);
  const discount = Number(order.discount || 0);
  const delivery = Number(order.deliveryCharge || 0);
  const total = Number(order.total || 0);

  const submittedAmount = isCod
    ? 0
    : Number(order.payment.submittedAmount || 0);

  const verifiedAmount = isVerified
    ? Math.max(
        0,
        Math.min(
          Number(order.payment.verifiedAmount || 0),
          total
        )
      )
    : 0;

  // Pending payment must not be treated as verified.
  const dueBalance =
    !isCod && !isVerified
      ? null
      : Math.max(total - verifiedAmount, 0);

  const itemCount = order.items.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );

  const copyOrderNumber = async () => {
    try {
      await navigator.clipboard.writeText(order.orderNumber);
      setCopied(true);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  // ============================================
  // CURRENT STATUS
  // ============================================

  const currentStep = 1;

  const progressSteps = statusSteps.map((step) => {
    if (step.key === "verified" && isCod) {
      return {
        ...step,
        label: "ফোনে নিশ্চিতকরণ",
        english: "Phone Confirmation",
      };
    }

    return step;
  });

  return (
    <main className="min-h-screen bg-base-200/60 py-6 text-base-content sm:py-10">
      <div className="page-container max-w-5xl">

        {/* ===================================== */}
        {/* BREADCRUMB */}
        {/* ===================================== */}

        <nav className="mb-8 flex flex-wrap items-center justify-center gap-2 text-xs text-muted">
          <Link
            to="/"
            className="transition hover:text-secondary"
          >
            হোম (Home)
          </Link>

          <span>›</span>

          <Link
            to="/shop"
            className="transition hover:text-secondary"
          >
            উপহারসমূহ
          </Link>

          <span>›</span>

          <span className="font-semibold text-secondary">
            #{order.orderNumber} নিশ্চিতকরণ
          </span>
        </nav>

        {/* ===================================== */}
        {/* PENDING CONFIRMATION HERO */}
        {/* ===================================== */}

        <section className="mb-8 text-center">

          {/* Icon */}
          <div className="relative mx-auto mb-5 flex size-20 items-center justify-center rounded-full bg-secondary/10">

            <div className="flex size-14 items-center justify-center rounded-full bg-primary text-gold-soft shadow-md">
              {isCod ? (
                <PackageCheck size={29} />
              ) : (
                <Hourglass size={29} />
              )}
            </div>

            <span className="absolute bottom-0 right-0 flex size-6 items-center justify-center rounded-full border-2 border-white bg-gold-soft text-primary">
              <Clock3 size={13} />
            </span>
          </div>

          {/* Status Badge */}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-soft px-4 py-1.5 text-xs font-semibold text-primary">
            <Clock3 size={14} />

            {isCod
              ? "ফোনে নিশ্চিতকরণের অপেক্ষায়"
              : "যাচাইয়ের অপেক্ষায় (Pending Verification)"}
          </span>

          {/* Title */}
          <h1 className="mx-auto mt-4 max-w-xl text-2xl font-extrabold leading-tight text-primary sm:text-4xl">
            {isCod
              ? "আপনার অর্ডার সফলভাবে জমা হয়েছে!"
              : "আপনার পেমেন্ট তথ্য জমা হয়েছে!"}
          </h1>

          {/* Description */}
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-muted">
            {isCod
              ? "আপনার অর্ডারটি আমরা সফলভাবে পেয়েছি। আমাদের টিম আপনার দেওয়া ফোন নম্বরে যোগাযোগ করে অর্ডার নিশ্চিত করবে। নিশ্চিত হওয়ার পর আপনার উপহার প্রস্তুতের কাজ শুরু হবে।"
              : "আপনার দেওয়া পেমেন্ট তথ্য আমাদের টিম যাচাই করছে। প্রয়োজন হলে আমরা আপনার ফোন নম্বরে যোগাযোগ করব। যাচাই সম্পন্ন হলে অর্ডারের স্ট্যাটাস স্বয়ংক্রিয়ভাবে আপডেট হবে।"}
          </p>

          {/* Information Badge */}
          <div className="mt-5 inline-flex max-w-full items-center gap-2 rounded-lg bg-secondary/10 px-4 py-2 text-xs font-medium text-secondary">
            <Clock3 size={15} className="shrink-0" />

            {isCod
              ? "আমাদের টিম ফোন করে আপনার অর্ডার নিশ্চিত করবে।"
              : "আপনার পেমেন্ট যাচাইয়ের জন্য অপেক্ষমাণ রয়েছে।"}
          </div>
        </section>

        {/* ===================================== */}
        {/* ORDER HEADER & FINANCIAL SUMMARY */}
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
                  ORDER RECEIVED
                </span>
              </div>

              <div className="mt-1 flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-primary">
                  অর্ডার #{order.orderNumber}
                </h2>

                <button
                  type="button"
                  onClick={copyOrderNumber}
                  aria-label="অর্ডার নম্বর কপি করুন"
                  className="rounded-md p-1 text-secondary transition hover:bg-secondary/10"
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

            {/* Status Badges */}
            <div className="flex flex-col items-start gap-2 sm:items-end">

              <span className="inline-flex items-center gap-1 rounded-full bg-gold-soft/50 px-3 py-1 text-xs font-semibold text-primary">
                <Clock3 size={13} />

                {isCod
                  ? "Phone Confirmation Pending"
                  : "Payment Verification Pending"}
              </span>

              <span className="inline-flex items-center gap-1 rounded-full bg-secondary/10 px-3 py-1 text-xs font-semibold text-secondary">
                <Package size={13} />
                Order Received
              </span>
            </div>
          </div>

          {/* Financial Cards */}
          <div className="mt-6 grid gap-3 sm:grid-cols-3">

            {/* Total */}
            <div className="rounded-xl bg-secondary/5 p-4">
              <p className="text-xs font-semibold text-muted">
                সর্বমোট অর্ডার মূল্য
              </p>

              <p className="mt-2 text-xl font-extrabold text-primary">
                {money(total)}
              </p>

              <p className="mt-1 text-xs text-muted">
                পণ্য ও ডেলিভারি চার্জসহ
              </p>
            </div>

            {/* Submitted Payment */}
            <div className="rounded-xl bg-secondary/5 p-4">

              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-secondary">
                  {isCod
                    ? "পেমেন্ট পদ্ধতি"
                    : "জমা দেওয়া অগ্রিম তথ্য"}
                </p>

                <CreditCard
                  size={16}
                  className="text-secondary"
                />
              </div>

              <p className="mt-2 text-xl font-extrabold text-primary">
                {isCod
                  ? "COD"
                  : money(submittedAmount)}
              </p>

              <p className="mt-1 text-xs text-muted">
                {isCod
                  ? "ডেলিভারির সময় পরিশোধ"
                  : "এখনো যাচাই সম্পন্ন হয়নি"}
              </p>
            </div>

            {/* Remaining Balance */}
            <div className="rounded-xl bg-amber-50 p-4">

              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-amber-800">
                  {dueBalance === null
                    ? "অবশিষ্ট ব্যালেন্স"
                    : "প্রদেয় ব্যালেন্স (COD)"}
                </p>

                <Wallet
                  size={16}
                  className="text-amber-700"
                />
              </div>

              <p className="mt-2 text-xl font-extrabold text-amber-900">
                {dueBalance === null
                  ? "যাচাই চলছে"
                  : money(dueBalance)}
              </p>

              <p className="mt-1 text-xs text-amber-800">
                {dueBalance === null
                  ? "যাচাইয়ের পর নিশ্চিত হবে"
                  : "ডেলিভারির সময় প্রদেয় টাকা"}
              </p>
            </div>
          </div>
        </section>

        {/* ===================================== */}
        {/* ORDER PROGRESS TIMELINE */}
        {/* ===================================== */}

        <section className="section-card mb-6 p-4 sm:p-6">

          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-extrabold text-primary">
                অর্ডার অগ্রগতি স্ট্যাটাস
              </h2>

              <p className="mt-1 text-xs text-muted">
                আপনার অর্ডারের বর্তমান অবস্থা ও পরবর্তী
                ধাপসমূহ
              </p>
            </div>

            <span className="badge-soft">
              ধাপ ২ / ৬ অপেক্ষমাণ
            </span>
          </div>

          {/* Progress Steps */}
          <div className="relative overflow-x-auto pb-2">

            <div className="relative grid min-w-[570px] grid-cols-6 gap-2">

              {/* Background Line */}
              <div className="absolute left-[8.33%] right-[8.33%] top-5 h-1 rounded-full bg-base-300" />

              {/* Completed Line */}
              <div className="absolute left-[8.33%] top-5 h-1 w-[16.66%] rounded-full bg-secondary" />

              {progressSteps.map((step, index) => {
                const Icon = step.icon;

                const completed = index < currentStep;
                const active = index === currentStep;

                return (
                  <div
                    key={step.key}
                    className="relative flex flex-col items-center text-center"
                  >
                    {/* Icon */}
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

                    {/* Step Label */}
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

                    {/* Status */}
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
                          ? "অপেক্ষমাণ"
                          : "শুরু হয়নি"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Status Note */}
          <div className="mt-6 flex items-start gap-3 rounded-xl bg-secondary/5 p-4">

            <Sparkles
              size={18}
              className="mt-0.5 shrink-0 text-secondary"
            />

            <p className="text-xs leading-6 text-muted">
              <span className="font-bold text-primary">
                গুরুত্বপূর্ণ নোট:
              </span>{" "}

              {isCod
                ? "আপনার অর্ডারটি সফলভাবে জমা হয়েছে। আমাদের টিম ফোনে নিশ্চিত করার পর কাস্টমাইজেশন ও প্যাকিংয়ের কাজ শুরু করবে।"
                : "আপনার পেমেন্ট তথ্য আমাদের টিম যাচাই করছে। যাচাই সম্পন্ন হলে অর্ডার নিশ্চিত হবে এবং পরবর্তী প্রস্তুতির ধাপ শুরু হবে।"}
            </p>
          </div>
        </section>

        {/* ===================================== */}
        {/* ITEMIZED ORDER SUMMARY */}
        {/* ===================================== */}

        <section className="section-card mb-6 p-4 sm:p-6">

          {/* Heading */}
          <h2 className="mb-5 flex flex-wrap items-center gap-2 text-base font-extrabold text-primary">
            <ReceiptText
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

                {/* Product Image */}
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

                {/* Product Details */}
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

                {/* Price */}
                <div className="text-left sm:text-right">
                  <p className="text-lg font-extrabold text-primary">
                    {money(
                      Number(item.price) *
                        Number(item.quantity)
                    )}
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

            {/* Subtotal */}
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted">
                সর্বমোট অর্ডার মূল্য (Subtotal):
              </span>

              <strong className="text-primary">
                {money(subtotal)}
              </strong>
            </div>

            {/* Discount */}
            {discount > 0 && (
              <div className="flex items-center justify-between gap-3">
                <span className="text-secondary">
                  ডিসকাউন্ট:
                </span>

                <strong className="text-secondary">
                  - {money(discount)}
                </strong>
              </div>
            )}

            {/* Submitted Payment */}
            {!isCod && (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-gold-soft/20 px-3 py-2">

                <span className="flex items-center gap-2 text-xs font-semibold text-primary sm:text-sm">
                  <Clock3 size={16} />

                  জমা দেওয়া অগ্রিম (যাচাই অপেক্ষমাণ):
                </span>

                <strong className="text-primary">
                  {money(submittedAmount)}
                </strong>
              </div>
            )}

            {/* Delivery */}
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted">
                ডেলিভারি চার্জ:
              </span>

              <strong className="text-primary">
                {delivery === 0
                  ? "ফ্রি"
                  : money(delivery)}
              </strong>
            </div>

            {/* Total */}
            <div className="flex items-center justify-between gap-3 border-t border-base-300 pt-3">
              <span className="font-bold text-primary">
                সর্বমোট অর্ডার:
              </span>

              <strong className="text-lg font-extrabold text-primary">
                {money(total)}
              </strong>
            </div>

            {/* Remaining Balance */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-secondary/10 p-4">

              <div>
                <h3 className="text-base font-extrabold text-primary">
                  {dueBalance === null
                    ? "পেমেন্ট যাচাই অপেক্ষমাণ"
                    : "অবশিষ্ট প্রদেয় ব্যালেন্স"}
                </h3>

                <p className="mt-1 text-xs text-muted">
                  {dueBalance === null
                    ? "পেমেন্ট যাচাই সম্পন্ন হলে বকেয়া ব্যালেন্স নিশ্চিত হবে"
                    : "ডেলিভারির সময় ক্যাশ অন ডেলিভারি (COD)"}
                </p>
              </div>

              <strong className="text-xl font-extrabold text-primary sm:text-2xl">
                {dueBalance === null
                  ? "যাচাই চলছে"
                  : money(dueBalance)}
              </strong>
            </div>
          </div>

          {/* ===================================== */}
          {/* PAYMENT SUBMISSION DETAILS */}
          {/* ===================================== */}

          {!isCod && (
            <div className="mt-5 rounded-xl border border-base-300/70 p-4">

              <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-primary">
                <CreditCard
                  size={17}
                  className="text-secondary"
                />

                জমা দেওয়া পেমেন্ট তথ্য
              </h3>

              <div className="grid gap-4 text-xs sm:grid-cols-2">

                <div>
                  <p className="text-muted">
                    পেমেন্ট পদ্ধতি
                  </p>

                  <p className="mt-1 font-semibold text-primary">
                    {paymentNames[order.payment.method]}
                  </p>
                </div>

                <div>
                  <p className="text-muted">
                    প্রেরক মোবাইল নম্বর
                  </p>

                  <p className="mt-1 font-semibold text-primary">
                    {order.payment.senderPhone}
                  </p>
                </div>

                <div>
                  <p className="text-muted">
                    ট্রানজেকশন আইডি (TrxID)
                  </p>

                  <p className="mt-1 break-all font-semibold text-secondary">
                    {order.payment.trxId}
                  </p>
                </div>

                <div>
                  <p className="text-muted">
                    পেমেন্ট যাচাই
                  </p>

                  <span className="mt-1 inline-flex rounded-full bg-gold-soft/50 px-3 py-1 font-semibold text-primary">
                    Pending Verification
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ===================================== */}
          {/* DELIVERY INFORMATION */}
          {/* ===================================== */}

          <div className="mt-5 grid gap-4 rounded-xl bg-secondary/5 p-4 sm:grid-cols-2">

            {/* Delivery Address */}
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

                <p className="mt-1 text-xs leading-5 text-muted">
                  প্রাপক: {order.customer.name}
                  <br />
                  {order.customer.phone}
                </p>
              </div>
            </div>

            {/* Delivery Estimate */}
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
                    "অর্ডার নিশ্চিত হওয়ার পর জানানো হবে"}
                </p>

                <p className="mt-1 text-xs text-muted">
                  লজিস্টিক পার্টনার:{" "}
                  {order.courierName ||
                    "এখনো নির্ধারিত হয়নি"}
                </p>
              </div>
            </div>
          </div>

          {/* Customer Note */}
          {order.customer.note && (
            <div className="mt-3 rounded-xl bg-base-200 p-3">
              <p className="text-xs font-semibold text-primary">
                বিশেষ নির্দেশনা
              </p>

              <p className="mt-1 text-xs leading-5 text-muted">
                {order.customer.note}
              </p>
            </div>
          )}
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

          <Link
            to="/shop"
            className="btn-outline-brand w-full rounded-xl text-sm"
          >
            <ShoppingBag size={17} />

            আরও উপহার দেখুন
          </Link>
        </div>

        {/* ===================================== */}
        {/* SUPPORT FOOTER */}
        {/* ===================================== */}

        <section className="flex flex-col gap-4 rounded-2xl bg-secondary/5 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">

          <div className="flex items-start gap-3">

            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-secondary">
              <Headphones size={19} />
            </span>

            <div>
              <h3 className="text-sm font-bold text-primary">
                সহায়তার প্রয়োজন বা অর্ডার সংক্রান্ত প্রশ্ন?
              </h3>

              <p className="mt-1 text-xs leading-5 text-muted">
                আপনার অর্ডার সংক্রান্ত যেকোনো
                জিজ্ঞাসায় আমাদের সাপোর্ট টিম পাশে আছে।
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
