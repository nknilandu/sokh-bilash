import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import Swal from "sweetalert2";

import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  Copy,
  Gift,
  Headphones,
  ImageOff,
  Loader2,
  MapPin,
  PackageCheck,
  Phone,
  ReceiptText,
  RefreshCw,
  ShieldAlert,
  ShoppingBag,
  Truck,
  Wallet,
  Wrench,
  XCircle,
} from "lucide-react";

import {
  getOrderPath,
  money,
  orderRequest,
  PAYMENT_NAMES,
} from "../../utils/orderApi";

import { app } from "../../../firebase/firebase.config";

const auth = getAuth(app);

const STAGES = [
  {
    key: "pending",
    title: "অর্ডার গ্রহণ",
    english: "Order Placed",
    icon: PackageCheck,
  },
  {
    key: "verified",
    title: "অর্ডার নিশ্চিত",
    english: "Verified",
    icon: BadgeCheck,
  },
  {
    key: "processing",
    title: "প্রস্তুত হচ্ছে",
    english: "Processing",
    icon: Wrench,
  },
  {
    key: "shipped",
    title: "কুরিয়ারে পাঠানো",
    english: "Shipped",
    icon: Truck,
  },
  {
    key: "delivered",
    title: "ডেলিভারি সম্পন্ন",
    english: "Delivered",
    icon: MapPin,
  },
];

const STAGE_INDEX = {
  pending: 0,
  verified: 1,
  processing: 2,
  shipped: 3,
  delivered: 4,
};

function formatDate(value) {
  if (!value) return "নির্ধারিত হয়নি";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString("bn-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function OrderProducts({ items }) {
  const list = Array.isArray(items) ? items : [];

  return (
    <div className="space-y-3">
      {list.map((item, index) => {
        const custom =
          typeof item.customization === "object"
            ? item.customization || {}
            : {};

        const fields = [
          ["নাম", custom.name],
          ["বিশেষ তারিখ", custom.date],
          ["বার্তা", custom.message],
          ["নোট", custom.note],
        ].filter(([, value]) => Boolean(value));

        const photos = Array.isArray(custom.photos) ? custom.photos : [];

        const hasCustom = fields.length > 0 || photos.length > 0;

        const quantity = Number(item.quantity) || 1;
        const unitPrice = Number(item.unitPrice ?? item.price ?? 0);

        return (
          <article
            key={item.cartId || `${item.productId}-${index}`}
            className="rounded-xl border-2 border-dashed border-secondary/25 bg-base-100 p-3 sm:p-4"
          >
            <div className="flex min-w-0 gap-3">
              <div className="size-16 shrink-0 overflow-hidden rounded-lg bg-base-200 sm:size-20">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center text-muted">
                    <ImageOff size={24} />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="line-clamp-2 text-xs font-bold leading-5 text-primary sm:text-sm">
                  {item.name}
                </h3>

                {item.sku && (
                  <p className="mt-1 truncate text-[10px] text-muted">
                    SKU: {item.sku}
                  </p>
                )}

                <div className="mt-2 flex flex-wrap gap-1.5">
                  {Object.entries(item.selectedOptions || {})
                    .filter(([, value]) => Boolean(value))
                    .map(([key, value]) => (
                      <span
                        key={key}
                        className="rounded-md bg-base-200 px-2 py-1 text-[10px] text-primary"
                      >
                        {key}: {String(value)}
                      </span>
                    ))}

                  <span className="rounded-md bg-secondary/5 px-2 py-1 text-[10px] text-secondary">
                    {item.packaging === "premium"
                      ? "Premium Box"
                      : "Regular Box"}
                  </span>

                  {item.surpriseBox && (
                    <span className="rounded-md bg-amber-50 px-2 py-1 text-[10px] text-amber-800">
                      Surprise Box
                    </span>
                  )}
                </div>

                <p className="mt-2 text-xs text-muted">
                  পরিমাণ: {quantity} × {money(unitPrice)}
                </p>
              </div>

              <strong className="shrink-0 whitespace-nowrap text-xs text-primary sm:text-sm">
                {money(item.lineTotal ?? unitPrice * quantity)}
              </strong>
            </div>

            {hasCustom && (
              <details className="group mt-3 rounded-lg bg-secondary/5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 text-xs font-semibold text-secondary [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center gap-1.5">
                    <Gift size={14} />
                    Customer Customization
                  </span>

                  <ChevronDown
                    size={15}
                    className="transition-transform group-open:rotate-180"
                  />
                </summary>

                <div className="space-y-2 border-t border-secondary/10 p-3">
                  {fields.map(([label, value]) => (
                    <div key={label}>
                      <p className="text-[11px] font-semibold text-primary">
                        {label}
                      </p>
                      <p className="mt-1 whitespace-pre-wrap break-words rounded-md bg-base-100 p-2 text-xs leading-5 text-muted">
                        {value}
                      </p>
                    </div>
                  ))}

                  {photos.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-semibold text-primary">
                        Customer Photos ({photos.length})
                      </p>
                      <div className="grid grid-cols-6 gap-2 sm:grid-cols-10">
                        {photos.map((photo, photoIndex) => (
                          <a
                            key={photo.id || photoIndex}
                            href={photo.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="aspect-square overflow-hidden rounded-lg bg-base-200"
                          >
                            <img
                              src={photo.url}
                              alt={`Customer Photo ${photoIndex + 1}`}
                              className="size-full object-cover"
                            />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </details>
            )}
          </article>
        );
      })}
    </div>
  );
}

function OrderProgress({ order, mode }) {
  const rejected = mode === "rejected";
  const current = STAGE_INDEX[order.status] ?? 0;

  return (
    <section className="section-card p-4 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-bold text-primary">অর্ডার অগ্রগতি স্ট্যাটাস</h2>
          <p className="mt-1 text-xs text-muted">Order Progress & Tracking</p>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            rejected
              ? "bg-red-100 text-red-700"
              : "bg-secondary/10 text-secondary"
          }`}
        >
          {rejected
            ? "Verification Failed"
            : `ধাপ ${current + 1} / ${STAGES.length}`}
        </span>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="relative grid min-w-[500px] grid-cols-5 gap-2">
          <div className="absolute left-[10%] right-[10%] top-5 h-1 rounded-full bg-base-300" />

          {!rejected && (
            <div
              className="absolute left-[10%] top-5 h-1 rounded-full bg-secondary"
              style={{
                width: `${current * 20}%`,
              }}
            />
          )}

          {STAGES.map((stage, index) => {
            const Icon = stage.icon;
            const complete = rejected ? index === 0 : index < current;

            const active = rejected ? index === 1 : index === current;

            return (
              <div
                key={stage.key}
                className="relative z-10 flex flex-col items-center text-center"
              >
                <div
                  className={`flex size-10 items-center justify-center rounded-full border-2 ${
                    rejected && active
                      ? "border-red-500 bg-red-500 text-white"
                      : complete
                        ? "border-secondary bg-secondary text-white"
                        : active
                          ? "border-gold-soft bg-gold-soft text-primary"
                          : "border-base-300 bg-base-200 text-muted"
                  }`}
                >
                  {rejected && active ? (
                    <XCircle size={17} />
                  ) : (
                    <Icon size={17} />
                  )}
                </div>

                <p className="mt-2 text-[11px] font-bold text-primary">
                  {rejected && index === 1 ? "যাচাই ব্যর্থ" : stage.title}
                </p>

                <p className="mt-1 text-[10px] text-muted">
                  {rejected && index === 1 ? "Rejected" : stage.english}
                </p>

                <span
                  className={`mt-1.5 rounded-md px-2 py-0.5 text-[10px] ${
                    rejected && active
                      ? "bg-red-100 text-red-700"
                      : complete
                        ? "bg-emerald-50 text-emerald-700"
                        : active
                          ? "bg-gold-soft/40 text-primary"
                          : "bg-base-200 text-muted"
                  }`}
                >
                  {rejected && active
                    ? "ব্যর্থ"
                    : complete
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

      <p className="mt-5 rounded-xl bg-secondary/5 p-3 text-xs leading-6 text-muted">
        {rejected
          ? "পেমেন্ট যাচাই ব্যর্থ বা অর্ডার বাতিল হওয়ায় পরবর্তী কার্যক্রম স্থগিত রয়েছে।"
          : order.status === "pending"
            ? order.payment?.method === "cod"
              ? "আমাদের টিম ফোন করে অর্ডার নিশ্চিত করবে।"
              : "আপনার পাঠানো পেমেন্ট তথ্য Admin যাচাই করবেন।"
            : "অর্ডারটির বর্তমান অবস্থা অনুযায়ী প্রস্তুতি ও ডেলিভারি এগিয়ে চলছে।"}
      </p>
    </section>
  );
}

function ResubmitPayment({ order, orderId, accessToken, onSuccess }) {
  const [form, setForm] = useState({
    senderPhone: order.payment?.senderPhone || "",
    trxId: "",
    amount:
      order.payment?.claimedAmount != null
        ? String(order.payment.claimedAmount)
        : "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    if (loading) return;

    const phone = form.senderPhone.trim();
    const trxId = form.trxId.trim().toUpperCase();
    const amount = Number(form.amount);

    if (!/^01[3-9]\d{8}$/.test(phone)) {
      setError("সঠিক Sender Phone Number দিন।");
      return;
    }

    if (!/^[A-Z0-9_-]{5,60}$/.test(trxId)) {
      setError("সঠিক Transaction ID দিন।");
      return;
    }

    if (
      !Number.isFinite(amount) ||
      amount <= 0 ||
      amount > Number(order.total)
    ) {
      setError("সঠিক Payment Amount দিন।");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await orderRequest(
        `/orders/${encodeURIComponent(orderId)}/payment-proof`,
        {
          method: "POST",
          orderId,
          accessToken,
          body: {
            senderPhone: phone,
            trxId,
            amount,
          },
        },
      );

      await onSuccess();

      Swal.fire({
        icon: "success",
        title: "পেমেন্ট তথ্য আবার জমা হয়েছে",
        text: "এখন Admin Verification-এর অপেক্ষায় আছে।",
        timer: 2200,
        showConfirmButton: false,
      });
    } catch (err) {
      setError(err.message || "পেমেন্ট তথ্য জমা দেওয়া যায়নি।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="section-card p-4 sm:p-6">
      <h2 className="flex items-center gap-2 font-bold text-primary">
        <RefreshCw size={18} className="text-secondary" />
        পেমেন্ট তথ্য সংশোধন করুন
      </h2>

      <p className="mt-2 text-xs leading-6 text-muted">
        আগের TrxID বা Sender Number ভুল হলে সঠিক তথ্য পুনরায় জমা দিন। নতুন করে
        টাকা পাঠানোর আগে সাপোর্ট টিমের সঙ্গে যোগাযোগ করুন।
      </p>

      {error && (
        <p
          role="alert"
          className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-700"
        >
          {error}
        </p>
      )}

      <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block text-xs font-semibold text-primary">
          Sender Number
          <input
            type="tel"
            value={form.senderPhone}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                senderPhone: event.target.value.replace(/\D/g, "").slice(0, 11),
              }))
            }
            placeholder="01XXXXXXXXX"
            className="input input-bordered mt-1.5 w-full rounded-xl"
            disabled={loading}
          />
        </label>

        <label className="block text-xs font-semibold text-primary">
          New / Correct TrxID
          <input
            value={form.trxId}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                trxId: event.target.value.slice(0, 60),
              }))
            }
            placeholder="Transaction ID"
            className="input input-bordered mt-1.5 w-full rounded-xl"
            disabled={loading}
          />
        </label>

        <label className="block text-xs font-semibold text-primary sm:col-span-2">
          পাঠানো টাকার পরিমাণ
          <input
            type="number"
            min="0.01"
            max={Number(order.total)}
            step="0.01"
            value={form.amount}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                amount: event.target.value,
              }))
            }
            className="input input-bordered mt-1.5 w-full rounded-xl"
            disabled={loading}
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="btn-brand w-full rounded-xl sm:col-span-2"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <RefreshCw size={16} />
          )}
          পুনরায় পেমেন্ট তথ্য জমা দিন
        </button>
      </form>
    </section>
  );
}

export default function OrderStatusPage({ mode = "confirmation" }) {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [copied, setCopied] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  // Token was also stored in sessionStorage at checkout.
  const accessToken = location.state?.guestAccessToken || "";

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, () => setAuthReady(true));

    return unsubscribe;
  }, []);

  const orderQuery = useQuery({
    queryKey: ["sokhbilash-order-details", orderId, Boolean(accessToken)],

    enabled: authReady && Boolean(orderId),

    queryFn: async ({ signal }) => {
      const response = await orderRequest(
        `/orders/${encodeURIComponent(orderId)}`,
        {
          signal,
          orderId,
          accessToken,
        },
      );

      return response.order;
    },

    staleTime: 0,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
    retry: 1,
  });

  const order = orderQuery.data;

  // Redirect according to ACTUAL MongoDB status.
  useEffect(() => {
    if (!order || !orderId) return;

    const path = getOrderPath(order);
    const expected = `/order-${mode}/${encodeURIComponent(orderId)}`;

    if (path !== expected) {
      navigate(path, {
        replace: true,
        state: location.state,
      });
    }
  }, [order, orderId, mode, navigate, location.state]);

  const copyOrderNumber = async () => {
    if (!order?.orderNumber) return;

    try {
      await navigator.clipboard.writeText(order.orderNumber);
      setCopied(true);
    } catch {
      // Clipboard not available.
    }
  };

  // ========================================
  // LOADING / ERROR
  // ========================================

  if (!authReady || orderQuery.isLoading) {
    return (
      <main className="page-bg flex min-h-[65vh] items-center justify-center">
        <div className="text-center">
          <Loader2 size={30} className="mx-auto animate-spin text-secondary" />
          <p className="mt-3 text-sm text-muted">অর্ডারের তথ্য লোড হচ্ছে...</p>
        </div>
      </main>
    );
  }

  if (orderQuery.isError || !order) {
    return (
      <main className="page-bg flex min-h-[65vh] items-center justify-center px-4">
        <section className="section-card w-full max-w-md p-6 text-center">
          <AlertTriangle size={32} className="mx-auto text-amber-600" />

          <h1 className="mt-4 text-lg font-bold text-primary">
            অর্ডার পাওয়া যায়নি
          </h1>

          <p className="mt-2 text-sm leading-6 text-muted">
            {orderQuery.error?.message ||
              "অর্ডার দেখতে অনুমতি নেই অথবা Order ID ভুল।"}
          </p>

          <p className="mt-2 text-xs text-muted">
            দুঃখিত, অর্ডারটি পাওয়া যায়নি অথবা আপনার এই অর্ডারে অ্যাক্সেস নেই।
          </p>

          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => orderQuery.refetch()}
              className="btn-brand"
            >
              <RefreshCw size={15} />
              আবার চেষ্টা করুন
            </button>

            <Link to="/help#contact" className="btn-outline-brand">
              সাপোর্ট
            </Link>
          </div>
        </section>
      </main>
    );
  }

  // ========================================
  // ACTUAL ORDER FIELDS
  // ========================================

  const payment = order.payment || {};
  const customer = order.customer || {};

  const isCod = payment.method === "cod";
  const rejected = mode === "rejected";
  const verified = mode === "verified";

  const isCancelled = order.status === "cancelled";

  const isPartial = payment.status === "partially_paid";

  const total = Number(order.total || 0);
  const subtotal = Number(order.subtotal || 0);
  const delivery = Number(order.deliveryCharge || 0);
  const giftWrap = Number(order.giftWrapCharge || 0);
  const discount = Number(order.discount || 0);

  const claimed = Number(payment.claimedAmount || 0);

  const verifiedAmount = Math.max(
    0,
    Math.min(total, Number(payment.verifiedAmount || 0)),
  );

  const due = Math.max(total - verifiedAmount, 0);

  const paymentConfirmed = payment.status === "verified";

  const isCodConfirmed = isCod && order.phoneConfirmed === true;

  const rejectionReason =
    payment.rejectedReason ||
    (Array.isArray(order.history)
      ? [...order.history]
          .reverse()
          .find((event) =>
            ["payment_rejected", "cancelled"].includes(event.status),
          )?.note
      : "") ||
    "বিস্তারিত জানতে সাপোর্ট টিমের সঙ্গে যোগাযোগ করুন।";

  const canResubmit =
    order.status === "rejected" && payment.status === "rejected" && !isCod;

  const title = rejected
    ? isCancelled
      ? "আপনার অর্ডারটি বাতিল হয়েছে"
      : "আপনার পেমেন্ট যাচাই করা যায়নি"
    : verified
      ? isCod
        ? "আপনার অর্ডার নিশ্চিত হয়েছে"
        : "আপনার পেমেন্ট যাচাই সম্পন্ন হয়েছে"
      : isCod
        ? "আপনার অর্ডার জমা হয়েছে!"
        : "আপনার পেমেন্ট তথ্য জমা হয়েছে!";

  const description = rejected
    ? "অর্ডারের বর্তমান স্ট্যাটাস ও যাচাইয়ের কারণ নিচে দেখুন।"
    : verified
      ? "আপনার অর্ডার নিশ্চিত হয়েছে। প্রস্তুতি ও ডেলিভারির অগ্রগতি এখানে দেখতে পারবেন।"
      : isCod
        ? "আমাদের টিম ফোনে যোগাযোগ করে আপনার অর্ডার নিশ্চিত করবে।"
        : isPartial
          ? "কিছু পেমেন্ট যাচাই হয়েছে। বাকি অংশের বিষয়ে আমাদের টিম যোগাযোগ করবে।"
          : "আপনার দেওয়া Transaction Information অ্যাডমিন যাচাই করবেন।";

  const HeroIcon = rejected ? ShieldAlert : verified ? BadgeCheck : Clock3;

  return (
    <main className="page-bg min-h-screen py-7 sm:py-10">
      <div className="page-container max-w-5xl">
        {/* BREADCRUMB */}

        <nav className="mb-7 flex flex-wrap items-center justify-center gap-2 text-xs text-muted">
          <Link to="/" className="hover:text-secondary">
            হোম
          </Link>
          <span>›</span>
          <Link to="/shop" className="hover:text-secondary">
            উপহারসমূহ
          </Link>
          <span>›</span>
          <span className="font-semibold text-secondary">
            {order.orderNumber}
          </span>
        </nav>

        {/* HERO */}

        <section className="mb-8 text-center">
          <div
            className={`mx-auto flex size-20 items-center justify-center rounded-full ${
              rejected
                ? "bg-red-100"
                : verified
                  ? "bg-emerald-100"
                  : "bg-secondary/10"
            }`}
          >
            <HeroIcon
              size={36}
              className={
                rejected
                  ? "text-red-600"
                  : verified
                    ? "text-emerald-600"
                    : "text-secondary"
              }
            />
          </div>

          <span
            className={`mt-5 inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold ${
              rejected
                ? "bg-red-100 text-red-700"
                : verified
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-gold-soft/60 text-primary"
            }`}
          >
            {rejected
              ? isCancelled
                ? "Order Cancelled"
                : "Payment Rejected"
              : verified
                ? isCod
                  ? "Phone Confirmed"
                  : "Payment Verified"
                : isCod
                  ? "Phone Confirmation Pending"
                  : isPartial
                    ? "Partially Verified"
                    : "Payment Verification Pending"}
          </span>

          <h1 className="mt-4 text-2xl font-bold text-primary sm:text-3xl">
            {title}
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-muted">
            {description}
          </p>
        </section>

        {/* HEADER + FINANCIAL SUMMARY */}

        <section className="section-card mb-5 p-4 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-muted">অর্ডার ট্র্যাকিং কোড</p>

              <div className="mt-1 flex flex-wrap items-center gap-2">
                <h2 className="break-all text-lg font-bold text-primary">
                  #{order.orderNumber}
                </h2>

                <button
                  type="button"
                  onClick={copyOrderNumber}
                  aria-label="অর্ডার নম্বর কপি"
                  className="rounded-lg p-1.5 text-secondary hover:bg-secondary/10"
                >
                  {copied ? <Check size={15} /> : <Copy size={15} />}
                </button>
              </div>

              <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
                <CalendarDays size={13} />
                {formatDate(order.createdAt)}
              </p>
            </div>

            <span className="rounded-full bg-secondary/10 px-3 py-1 text-xs font-semibold text-secondary">
              {order.status}
            </span>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-secondary/5 p-4">
              <p className="text-xs text-muted">সর্বমোট অর্ডার মূল্য</p>
              <p className="mt-2 text-xl font-bold text-primary">
                {money(total)}
              </p>
            </div>

            <div className="rounded-xl bg-secondary/5 p-4">
              <p className="text-xs text-muted">
                {isCod ? "পেমেন্ট পদ্ধতি" : "দাবিকৃত পাঠানো টাকা"}
              </p>

              <p className="mt-2 text-xl font-bold text-primary">
                {isCod ? "COD" : money(claimed)}
              </p>

              <p className="mt-1 text-xs text-muted">
                {isCod ? "ডেলিভারিতে পরিশোধ" : "ভেরিফিকেশন অনুযায়ী হিসাব হবে"}
              </p>
            </div>

            <div className="rounded-xl bg-gold-soft/20 p-4">
              <p className="text-xs text-primary">
                {rejected ? "Payment Status" : "অবশিষ্ট প্রদেয়"}
              </p>

              <p className="mt-2 text-xl font-bold text-primary">
                {rejected ? "Not Approved" : money(due)}
              </p>

              <p className="mt-1 text-xs text-muted">
                {isCod
                  ? "ডেলিভারিতে পরিশোধ"
                  : paymentConfirmed
                    ? "পেমেন্ট সম্পূর্ণ যাচাইকৃত"
                    : isPartial
                      ? "আংশিক পেমেন্ট যাচাইকৃত"
                      : "চূড়ান্ত যাচাই বাকি"}
              </p>
            </div>
          </div>
        </section>

        {/* REJECTION REASON */}

        {rejected && (
          <section className="mb-5 rounded-2xl border border-red-200 bg-base-100 p-4 sm:p-6">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
                <AlertTriangle size={20} />
              </span>

              <div className="min-w-0 flex-1">
                <h2 className="font-bold text-primary">
                  {isCancelled
                    ? "অর্ডার বাতিলের কারণ"
                    : "পেমেন্ট যাচাই ব্যর্থ হওয়ার কারণ"}
                </h2>

                <p className="mt-3 whitespace-pre-wrap break-words rounded-xl bg-red-50 p-4 text-sm leading-6 text-red-800">
                  {rejectionReason}
                </p>
              </div>
            </div>
          </section>
        )}

        <div className="mb-5">
          <OrderProgress order={order} mode={mode} />
        </div>

        {/* ORDER ITEMS + FINANCIAL DETAILS */}

        <section className="section-card mb-5 p-4 sm:p-6">
          <h2 className="mb-5 flex items-center gap-2 font-bold text-primary">
            <ReceiptText size={19} className="text-secondary" />
            অর্ডারের বিশদ বিবরণ
          </h2>

          <OrderProducts items={order.items} />

          <div className="mt-5 space-y-3 border-t border-base-300 pt-4 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-muted">পণ্যের মূল্য</span>
              <strong className="text-primary">{money(subtotal)}</strong>
            </div>

            {discount > 0 && (
              <div className="flex justify-between gap-3">
                <span className="text-secondary">ডিসকাউন্ট</span>
                <strong className="text-secondary">-{money(discount)}</strong>
              </div>
            )}

            <div className="flex justify-between gap-3">
              <span className="text-muted">ডেলিভারি চার্জ</span>
              <strong className="text-primary">{money(delivery)}</strong>
            </div>

            {giftWrap > 0 && (
              <div className="flex justify-between gap-3">
                <span className="text-muted">গিফট র‍্যাপিং</span>
                <strong className="text-primary">{money(giftWrap)}</strong>
              </div>
            )}

            <div className="flex justify-between gap-3 border-t border-base-300 pt-3 font-bold">
              <span className="text-primary">সর্বমোট মূল্য</span>
              <strong className="text-primary">{money(total)}</strong>
            </div>

            {!isCod && (
              <>
                <div className="flex justify-between gap-3">
                  <span className="text-muted">দাবিকৃত পেমেন্ট</span>
                  <strong className="text-primary">{money(claimed)}</strong>
                </div>

                <div className="flex justify-between gap-3">
                  <span className="text-muted">যাচাইকৃত পেমেন্ট</span>
                  <strong className="text-emerald-700">
                    {money(verifiedAmount)}
                  </strong>
                </div>
              </>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-secondary/10 p-4">
              <div>
                <p className="font-bold text-primary">অবশিষ্ট ব্যালেন্স</p>
                <p className="mt-1 text-xs text-muted">
                  Server-side Payment Status অনুযায়ী
                </p>
              </div>

              <strong className="text-xl text-primary">{money(due)}</strong>
            </div>
          </div>

          {/* PAYMENT DETAILS */}

          <div className="mt-5 rounded-xl border border-base-300/70 p-4">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-primary">
              <Wallet size={17} className="text-secondary" />
              পেমেন্টের তথ্য
            </h3>

            <div className="grid gap-4 text-xs sm:grid-cols-2">
              <div>
                <p className="text-muted">Payment Method</p>
                <p className="mt-1 font-semibold text-primary">
                  {PAYMENT_NAMES[payment.method] || payment.method}
                </p>
              </div>

              <div>
                <p className="text-muted">Payment Status</p>
                <p className="mt-1 font-semibold text-secondary">
                  {payment.status || (isCod ? "cod_pending" : "pending")}
                </p>
              </div>

              {!isCod && (
                <>
                  <div>
                    <p className="text-muted">Sender Number</p>
                    <p className="mt-1 font-semibold text-primary">
                      {payment.senderPhone || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-muted">Transaction ID</p>
                    <p className="mt-1 break-all font-semibold text-secondary">
                      {payment.trxId || "—"}
                    </p>
                  </div>
                </>
              )}

              {isCod && (
                <div>
                  <p className="text-muted">Phone Confirmation</p>
                  <p className="mt-1 font-semibold text-primary">
                    {isCodConfirmed ? "Confirmed" : "Pending"}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* DELIVERY DETAILS */}

          <div className="mt-5 grid gap-4 rounded-xl bg-secondary/5 p-4 sm:grid-cols-2">
            <div className="flex items-start gap-2">
              <MapPin size={17} className="mt-0.5 shrink-0 text-secondary" />

              <div className="min-w-0">
                <h3 className="text-sm font-bold text-primary">
                  ডেলিভারি ঠিকানা
                </h3>

                <p className="mt-2 break-words text-xs leading-6 text-muted">
                  {customer.address}, {customer.district}, {customer.division}
                </p>

                <p className="mt-1 text-xs leading-6 text-muted">
                  প্রাপক: {customer.name}
                  {" • "}
                  {customer.phone}
                </p>

                {customer.note && (
                  <p className="mt-2 whitespace-pre-wrap break-words text-xs text-muted">
                    নোট: {customer.note}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Truck size={17} className="mt-0.5 shrink-0 text-secondary" />

              <div>
                <h3 className="text-sm font-bold text-primary">
                  ডেলিভারি ও কুরিয়ার
                </h3>

                <p className="mt-2 text-xs leading-6 text-muted">
                  সম্ভাব্য ডেলিভারি: {formatDate(order.estimatedDelivery)}
                </p>

                <p className="mt-1 text-xs leading-6 text-muted">
                  কুরিয়ার: {order.courier?.name || "এখনো নির্ধারিত হয়নি"}
                </p>

                {order.courier?.trackingNumber && (
                  <p className="mt-1 break-all text-xs text-muted">
                    Tracking: {order.courier.trackingNumber}
                  </p>
                )}
              </div>
            </div>
          </div>

          {order.giftOptions?.message && (
            <div className="mt-4 rounded-xl bg-gold-soft/15 p-4">
              <h3 className="flex items-center gap-2 text-sm font-bold text-primary">
                <Gift size={16} />
                শুভেচ্ছা বার্তা
              </h3>

              <p className="mt-2 whitespace-pre-wrap break-words text-xs leading-6 text-muted">
                {order.giftOptions.message}
              </p>
            </div>
          )}
        </section>

        {/* PAYMENT RESUBMISSION */}

        {canResubmit && (
          <div className="mb-5">
            <ResubmitPayment
              order={order}
              orderId={orderId}
              accessToken={accessToken}
              onSuccess={() => orderQuery.refetch()}
            />
          </div>
        )}

        {/* ORDER HISTORY */}

        {Array.isArray(order.history) && order.history.length > 0 && (
          <section className="section-card mb-5 p-4 sm:p-6">
            <h2 className="mb-4 font-bold text-primary">অর্ডার হিস্ট্রি</h2>

            <div className="space-y-3">
              {[...order.history].reverse().map((event, index) => (
                <div
                  key={`${event.status}-${index}`}
                  className="flex gap-3 border-l-2 border-secondary/20 pl-3"
                >
                  <span className="mt-1 size-2 shrink-0 rounded-full bg-secondary" />

                  <div className="min-w-0">
                    <p className="text-xs font-bold capitalize text-primary">
                      {String(event.status).replace(/_/g, " ")}
                    </p>

                    <p className="mt-1 text-[11px] text-muted">
                      {formatDate(event.date)}
                    </p>

                    {event.note && (
                      <p className="mt-1 break-words text-xs text-muted">
                        {event.note}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ACTION BUTTONS */}

        <div className="mb-5 grid gap-3 sm:grid-cols-2">
          <Link
            to={`/track-order/${encodeURIComponent(orderId)}`}
            className="btn-brand w-full rounded-xl text-sm"
          >
            <PackageCheck size={16} />
            অর্ডার ট্র্যাক করুন
            <ArrowRight size={16} />
          </Link>

          <Link
            to="/shop"
            className="btn-outline-brand w-full rounded-xl text-sm"
          >
            <ShoppingBag size={16} />
            আরও উপহার দেখুন
          </Link>
        </div>

        {/* SUPPORT */}

        <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-secondary/5 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="icon-box shrink-0">
              <Headphones size={19} />
            </div>

            <div>
              <h3 className="text-sm font-bold text-primary">
                অর্ডার সংক্রান্ত সহায়তা প্রয়োজন?
              </h3>

              <p className="mt-1 text-xs leading-5 text-muted">
                Order Number উল্লেখ করে সাপোর্ট টিমের সঙ্গে যোগাযোগ করুন।
              </p>
            </div>
          </div>

          <Link
            to="/help#contact"
            className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-primary"
          >
            <Phone size={14} />
            যোগাযোগ করুন
            <ArrowRight size={14} />
          </Link>
        </section>
      </div>
    </main>
  );
}
