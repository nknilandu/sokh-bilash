
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  CreditCard,
  Gift,
  Headphones,
  MapPin,
  MessageCircle,
  Package,
  PackageCheck,
  Phone,
  ReceiptText,
  RefreshCcw,
  ShieldAlert,
  ShoppingBag,
  Sparkles,
  Truck,
  Wallet,
  Wrench,
  X,
  XCircle,
} from "lucide-react";

// ============================================
// DEMO ORDER DATA
// Replace with backend API response
// ============================================

const demoOrder = {
  _id: "order-1001",
  orderNumber: "SKB-98432",
  createdAt: "2026-10-24T18:45:00",

  // payment_rejected | cancelled
  status: "payment_rejected",

  payment: {
    method: "bkash",
    status: "rejected",
    senderPhone: "01712345678",
    trxId: "TXN987A4F2",
    submittedAmount: 2280,
    verifiedAmount: 0,

    rejectionReason:
      "আপনার দেওয়া Transaction ID-এর সঙ্গে পেমেন্টের তথ্য মেলেনি। অনুগ্রহ করে সঠিক তথ্য দিয়ে আবার চেষ্টা করুন।",

    rejectedAt: "2026-10-25T11:30:00",
    allowResubmission: true,
  },

  cancellation: {
    reason:
      "আপনার অর্ডারটি যাচাই করে নিশ্চিত করা সম্ভব হয়নি। বিস্তারিত জানতে আমাদের সাপোর্ট টিমের সঙ্গে যোগাযোগ করুন।",
    cancelledAt: null,
    allowResubmission: false,
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
    key: "verification",
    label: "পেমেন্ট যাচাই",
    english: "Verification",
    icon: ShieldAlert,
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

export default function OrderRejectedPage() {
  const { orderId } = useParams();
  const [copied, setCopied] = useState(false);

  // Replace with actual backend API response
  const order = demoOrder;

  const isCancelled = order.status === "cancelled";
  const isPaymentRejected = order.status === "payment_rejected";
  const isCod = order.payment.method === "cod";

  const canResubmit =
    isPaymentRejected &&
    order.payment.allowResubmission === true;

  const subtotal = Number(order.subtotal || 0);
  const discount = Number(order.discount || 0);
  const delivery = Number(order.deliveryCharge || 0);
  const total = Number(order.total || 0);

  const submittedAmount = Number(
    order.payment.submittedAmount || 0
  );

  const rejectionDate = isCancelled
    ? order.cancellation?.cancelledAt
    : order.payment.rejectedAt;

  const rejectionReason = isCancelled
    ? order.cancellation?.reason
    : order.payment.rejectionReason;

  const itemCount = order.items.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );

  const copyOrderNumber = async () => {
    try {
      await navigator.clipboard.writeText(
        order.orderNumber
      );
      setCopied(true);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  const progressSteps = statusSteps.map((step) => {
    if (step.key === "verification" && isCod) {
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
            #{order.orderNumber} অর্ডার স্ট্যাটাস
          </span>
        </nav>

        {/* ===================================== */}
        {/* REJECTION HERO */}
        {/* ===================================== */}

        <section className="mb-8 text-center">

          {/* Rejection Icon */}
          <div className="relative mx-auto mb-5 flex size-20 items-center justify-center rounded-full bg-red-100">

            <div className="flex size-14 items-center justify-center rounded-full bg-red-600 text-white shadow-md">
              {isCancelled ? (
                <XCircle size={30} />
              ) : (
                <ShieldAlert size={30} />
              )}
            </div>

            <span className="absolute bottom-0 right-0 flex size-6 items-center justify-center rounded-full border-2 border-white bg-red-500 text-white">
              <X size={13} />
            </span>
          </div>

          {/* Status Badge */}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-4 py-1.5 text-xs font-semibold text-red-700">
            <AlertCircle size={14} />

            {isCancelled
              ? "অর্ডার বাতিল (Order Cancelled)"
              : "পেমেন্ট যাচাই ব্যর্থ (Payment Rejected)"}
          </span>

          {/* Heading */}
          <h1 className="mx-auto mt-4 max-w-xl text-2xl font-extrabold leading-tight text-primary sm:text-4xl">
            {isCancelled
              ? "আপনার অর্ডারটি নিশ্চিত করা সম্ভব হয়নি"
              : "আপনার পেমেন্ট যাচাই করা সম্ভব হয়নি"}
          </h1>

          {/* Description */}
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-muted">
            {isCancelled
              ? "দুঃখিত, যাচাই প্রক্রিয়ার পর আপনার অর্ডারটি বাতিল করা হয়েছে। বিস্তারিত জানতে আমাদের সাপোর্ট টিমের সঙ্গে যোগাযোগ করতে পারেন।"
              : "আপনার দেওয়া পেমেন্ট তথ্য যাচাই করে নিশ্চিত করা যায়নি। অনুগ্রহ করে নিচের কারণটি দেখুন এবং প্রয়োজন হলে সঠিক তথ্য দিয়ে আবার চেষ্টা করুন।"}
          </p>

          {/* Status Info */}
          <div className="mt-5 inline-flex max-w-full items-center gap-2 rounded-lg bg-red-50 px-4 py-2 text-xs font-medium text-red-700">
            <AlertCircle size={15} className="shrink-0" />

            {isCancelled
              ? "এই অর্ডারের পরবর্তী কার্যক্রম বন্ধ রয়েছে।"
              : canResubmit
                ? "আপনি পুনরায় পেমেন্ট তথ্য জমা দিতে পারবেন।"
                : "পুনরায় তথ্য জমা দিতে সাপোর্ট টিমের সঙ্গে যোগাযোগ করুন।"}
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

                <span className="rounded bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700">
                  {isCancelled
                    ? "CANCELLED"
                    : "PAYMENT REJECTED"}
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

              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                <XCircle size={13} />

                {isCancelled
                  ? "Order Cancelled"
                  : "Payment Rejected"}
              </span>

              <span className="inline-flex items-center gap-1 rounded-full bg-secondary/10 px-3 py-1 text-xs font-semibold text-secondary">
                <Package size={13} />
                Order #{order.orderNumber}
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

            {/* Submitted Amount */}
            <div className="rounded-xl bg-red-50 p-4">

              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-red-700">
                  {isCod
                    ? "অর্ডার নিশ্চিতকরণ"
                    : "প্রত্যাখ্যাত পেমেন্ট তথ্য"}
                </p>

                <CreditCard
                  size={16}
                  className="text-red-600"
                />
              </div>

              <p className="mt-2 text-xl font-extrabold text-red-700">
                {isCod
                  ? "Failed"
                  : money(submittedAmount)}
              </p>

              <p className="mt-1 text-xs text-red-700">
                {isCod
                  ? "ফোনে নিশ্চিত করা যায়নি"
                  : "জমা দেওয়া তথ্য যাচাই হয়নি"}
              </p>
            </div>

            {/* Payment Status */}
            <div className="rounded-xl bg-amber-50 p-4">

              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-amber-800">
                  পেমেন্ট স্ট্যাটাস
                </p>

                <Wallet
                  size={16}
                  className="text-amber-700"
                />
              </div>

              <p className="mt-2 text-lg font-extrabold text-amber-900">
                {isCod
                  ? "COD Cancelled"
                  : "Not Verified"}
              </p>

              <p className="mt-1 text-xs text-amber-800">
                কোনো পেমেন্ট অনুমোদিত হয়নি
              </p>
            </div>
          </div>
        </section>

        {/* ===================================== */}
        {/* REJECTION REASON */}
        {/* ===================================== */}

        <section className="mb-6 rounded-2xl border border-red-200 bg-white p-4 shadow-sm sm:p-6">

          <div className="flex items-start gap-3">

            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
              <AlertCircle size={21} />
            </span>

            <div className="min-w-0 flex-1">

              <h2 className="text-base font-extrabold text-primary">
                {isCancelled
                  ? "অর্ডার বাতিল হওয়ার কারণ"
                  : "পেমেন্ট যাচাই ব্যর্থ হওয়ার কারণ"}
              </h2>

              <p className="mt-1 text-xs text-muted">
                Verification / Cancellation Details
              </p>

              <div className="mt-4 rounded-xl bg-red-50 p-4">

                <p className="text-sm leading-7 text-red-800">
                  {rejectionReason ||
                    "অর্ডারটি যাচাই করা সম্ভব হয়নি। বিস্তারিত জানতে সাপোর্টে যোগাযোগ করুন।"}
                </p>
              </div>

              {rejectionDate && (
                <p className="mt-3 flex items-center gap-2 text-xs text-muted">
                  <Clock3 size={14} />

                  সিদ্ধান্তের সময়:{" "}
                  {new Date(rejectionDate).toLocaleString(
                    "bn-BD",
                    {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }
                  )}
                </p>
              )}
            </div>
          </div>

          {/* Next Steps */}
          <div className="mt-5 rounded-xl bg-secondary/5 p-4">

            <h3 className="flex items-center gap-2 text-sm font-bold text-primary">
              <Sparkles
                size={16}
                className="text-secondary"
              />

              এখন কী করবেন?
            </h3>

            <p className="mt-2 text-xs leading-6 text-muted">
              {canResubmit
                ? "আপনার পেমেন্টের Transaction ID, প্রেরক নম্বর ও পরিমাণ আবার যাচাই করুন। তথ্য ভুল থাকলে সংশোধন করে পুনরায় জমা দিন। নতুন করে টাকা পাঠানোর আগে সাপোর্ট টিমের সঙ্গে যোগাযোগ করুন।"
                : "এই অর্ডারে পুনরায় পেমেন্ট তথ্য জমা দেওয়ার সুযোগ নেই। বিস্তারিত জানতে অর্ডার নম্বরসহ আমাদের সাপোর্ট টিমের সঙ্গে যোগাযোগ করুন।"}
            </p>
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
                অর্ডারের বর্তমান অবস্থা ও যাচাইয়ের ফলাফল
              </p>
            </div>

            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
              {isCancelled
                ? "Order Cancelled"
                : "Verification Failed"}
            </span>
          </div>

          {/* Progress Steps */}
          <div className="relative overflow-x-auto pb-2">

            <div className="relative grid min-w-[570px] grid-cols-6 gap-2">

              {/* Background Line */}
              <div className="absolute left-[8.33%] right-[8.33%] top-5 h-1 rounded-full bg-base-300" />

              {/* Completed Line */}
              <div className="absolute left-[8.33%] top-5 h-1 w-[16.66%] rounded-full bg-red-400" />

              {progressSteps.map((step, index) => {
                const Icon = step.icon;

                const completed = index === 0;
                const rejected = index === 1;

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
                          : rejected
                            ? "border-red-500 bg-red-500 text-white"
                            : "border-base-200 bg-base-200 text-muted"
                      }`}
                    >
                      {rejected ? (
                        <X size={17} />
                      ) : (
                        <Icon size={17} />
                      )}
                    </div>

                    {/* Step Name */}
                    <p
                      className={`mt-3 text-xs font-bold ${
                        completed
                          ? "text-secondary"
                          : rejected
                            ? "text-red-600"
                            : "text-muted"
                      }`}
                    >
                      {step.label}
                    </p>

                    <p className="mt-1 text-[10px] text-muted">
                      {step.english}
                    </p>

                    {/* Step Status */}
                    <span
                      className={`mt-2 rounded px-2 py-0.5 text-[10px] font-semibold ${
                        completed
                          ? "bg-emerald-50 text-emerald-700"
                          : rejected
                            ? "bg-red-100 text-red-700"
                            : "bg-base-200 text-muted"
                      }`}
                    >
                      {completed
                        ? "সম্পন্ন"
                        : rejected
                          ? "ব্যর্থ / বাতিল"
                          : "বন্ধ"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Timeline Note */}
          <div className="mt-6 flex items-start gap-3 rounded-xl bg-red-50 p-4">

            <ShieldAlert
              size={18}
              className="mt-0.5 shrink-0 text-red-600"
            />

            <p className="text-xs leading-6 text-red-800">
              <span className="font-bold">
                স্ট্যাটাস আপডেট:
              </span>{" "}

              {isCancelled
                ? "আপনার অর্ডারটি বাতিল হয়েছে। তাই কাস্টমাইজেশন, প্যাকিং ও ডেলিভারি প্রক্রিয়া আর এগোবে না।"
                : "পেমেন্ট যাচাই ব্যর্থ হওয়ায় অর্ডারের পরবর্তী প্রস্তুতি আপাতত বন্ধ রয়েছে। সঠিক তথ্য পুনরায় জমা দেওয়ার সুযোগ থাকলে যাচাই আবার শুরু হবে।"}
            </p>
          </div>
        </section>

        {/* ===================================== */}
        {/* ITEMIZED SUMMARY */}
        {/* ===================================== */}

        <section className="section-card mb-6 p-4 sm:p-6">

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

                {/* Image */}
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

            <div className="flex items-center justify-between gap-3">
              <span className="text-muted">
                সর্বমোট অর্ডার মূল্য (Subtotal):
              </span>

              <strong className="text-primary">
                {money(subtotal)}
              </strong>
            </div>

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

            {/* Rejected Amount */}
            {!isCod && (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-red-50 px-3 py-2 text-red-700">
                <span className="flex items-center gap-2 text-xs font-semibold sm:text-sm">
                  <XCircle size={16} />
                  প্রত্যাখ্যাত পেমেন্ট তথ্য:
                </span>

                <strong>
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
                অর্ডারের মোট মূল্য:
              </span>

              <strong className="text-lg font-extrabold text-primary">
                {money(total)}
              </strong>
            </div>

            {/* Status */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-red-50 p-4">

              <div>
                <h3 className="text-base font-extrabold text-red-700">
                  {isCancelled
                    ? "অর্ডার বাতিল হয়েছে"
                    : "পেমেন্ট যাচাই ব্যর্থ"}
                </h3>

                <p className="mt-1 text-xs text-red-700">
                  {isCancelled
                    ? "এই অর্ডারের ডেলিভারি কার্যক্রম বন্ধ রয়েছে।"
                    : "কোনো পেমেন্ট যাচাইকৃত হিসেবে গ্রহণ করা হয়নি।"}
                </p>
              </div>

              <span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-red-700">
                {isCancelled
                  ? "Cancelled"
                  : "Rejected"}
              </span>
            </div>
          </div>

          {/* Payment Submission Details */}
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
                    যাচাইয়ের ফলাফল
                  </p>

                  <span className="mt-1 inline-flex rounded-full bg-red-100 px-3 py-1 font-semibold text-red-700">
                    Rejected
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Delivery Information */}
          <div className="mt-5 grid gap-4 rounded-xl bg-secondary/5 p-4 sm:grid-cols-2">

            {/* Address */}
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

            {/* Delivery Status */}
            <div className="flex items-start gap-2">
              <Truck
                size={18}
                className="mt-0.5 shrink-0 text-secondary"
              />

              <div>
                <h3 className="text-sm font-bold text-primary">
                  ডেলিভারি স্ট্যাটাস
                </h3>

                <p className="mt-2 text-xs font-semibold leading-5 text-red-700">
                  {isCancelled
                    ? "অর্ডার বাতিল হওয়ায় ডেলিভারি বন্ধ"
                    : "পেমেন্ট যাচাইয়ের কারণে ডেলিভারি স্থগিত"}
                </p>

                <p className="mt-1 text-xs text-muted">
                  লজিস্টিক পার্টনার নির্ধারিত হয়নি।
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ===================================== */}
        {/* ACTION BUTTONS */}
        {/* ===================================== */}

        <div className="mb-6 grid gap-3 sm:grid-cols-2">

          {canResubmit ? (
            <Link
              to={`/payment-resubmit/${orderId || order._id}`}
              className="btn-brand w-full rounded-xl text-sm"
            >
              <RefreshCcw size={17} />

              পেমেন্ট তথ্য সংশোধন করুন

              <ArrowRight size={16} />
            </Link>
          ) : (
            <Link
              to="/contact"
              className="btn-brand w-full rounded-xl text-sm"
            >
              <Headphones size={17} />

              সাপোর্টে যোগাযোগ করুন

              <ArrowRight size={16} />
            </Link>
          )}

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
                পেমেন্ট বা অর্ডার সংক্রান্ত সহায়তা প্রয়োজন?
              </h3>

              <p className="mt-1 text-xs leading-5 text-muted">
                আপনার অর্ডার নম্বর উল্লেখ করে আমাদের
                সাপোর্ট টিমের সঙ্গে যোগাযোগ করুন।
              </p>
            </div>
          </div>

          <Link
            to="/contact"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-primary"
          >
            <MessageCircle size={15} />
            যোগাযোগ করুন
          </Link>
        </section>
      </div>
    </main>
  );
}
