
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";

import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Copy,
  Gift,
  Headphones,
  ImageOff,
  Loader2,
  LockKeyhole,
  MapPin,
  PackageCheck,
  PackageSearch,
  RefreshCw,
  Search,
  ShieldCheck,
  ShoppingBag,
  Truck,
  Wrench,
  XCircle,
} from "lucide-react";

import {
  money,
  orderRequest,
  getGuestOrderToken,
} from "../../utils/orderApi";
import { app } from "../../../firebase/firebase.config";

const auth = getAuth(app);

// =============================================
// STATUS CONFIGURATION
// Matches existing commerce.routes.js
// =============================================

const STEPS = [
  {
    key: "pending",
    label: "অর্ডার গ্রহণ",
    english: "Order Placed",
    icon: PackageCheck,
  },
  {
    key: "verified",
    label: "অর্ডার নিশ্চিত",
    english: "Verified / Confirmed",
    icon: ShieldCheck,
  },
  {
    key: "processing",
    label: "উপহার প্রস্তুত হচ্ছে",
    english: "Processing",
    icon: Wrench,
  },
  {
    key: "shipped",
    label: "কুরিয়ারে পাঠানো",
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

const STATUS_INDEX = {
  pending: 0,
  verified: 1,
  processing: 2,
  shipped: 3,
  delivered: 4,
};

const STATUS_LABELS = {
  pending: "যাচাইয়ের অপেক্ষায়",
  verified: "অর্ডার নিশ্চিত হয়েছে",
  processing: "উপহার প্রস্তুত হচ্ছে",
  shipped: "কুরিয়ারে পাঠানো হয়েছে",
  delivered: "ডেলিভারি সম্পন্ন",
  rejected: "পেমেন্ট যাচাই ব্যর্থ",
  cancelled: "অর্ডার বাতিল",
};

const PAYMENT_LABELS = {
  pending: "Payment Verification Pending",
  partially_paid: "Partially Verified",
  verified: "Payment Verified",
  rejected: "Payment Rejected",
  cod_pending: "Phone Confirmation Pending",
};

const HISTORY_LABELS = {
  placed: "অর্ডার গ্রহণ করা হয়েছে",
  payment_verified: "পেমেন্ট যাচাই সম্পন্ন",
  payment_partially_verified:
    "আংশিক পেমেন্ট যাচাই সম্পন্ন",
  payment_rejected: "পেমেন্ট যাচাই ব্যর্থ",
  payment_resubmitted:
    "পেমেন্ট তথ্য পুনরায় জমা হয়েছে",
  phone_confirmed: "ফোনে অর্ডার নিশ্চিত",
  phone_unconfirmed: "ফোন নিশ্চিতকরণ অপেক্ষমাণ",
  verified: "অর্ডার নিশ্চিত",
  processing: "উপহার প্রস্তুত হচ্ছে",
  shipped: "কুরিয়ারে পাঠানো হয়েছে",
  delivered: "ডেলিভারি সম্পন্ন",
  cancelled: "অর্ডার বাতিল",
  tracking_updated: "ডেলিভারি তথ্য আপডেট",
};

const formatDate = (value) => {
  if (!value) return "এখনো নির্ধারিত হয়নি";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleString("bn-BD", {
        dateStyle: "medium",
        timeStyle: "short",
      });
};

// =============================================
// ORDER PROGRESS
// =============================================

function TrackingProgress({ order }) {
  const stopped = [
    "rejected",
    "cancelled",
  ].includes(order.status);

  const activeIndex =
    STATUS_INDEX[order.status] ?? 0;

  const events = Array.isArray(order.history)
    ? order.history
    : [];

  return (
    <section className="section-card p-4 sm:p-6">
      <div className="mb-5">
        <h2 className="flex items-center gap-2 text-base font-bold text-primary">
          <PackageCheck
            size={19}
            className="text-secondary"
          />
          অর্ডারের অগ্রগতি
        </h2>

        <p className="mt-1 text-xs text-muted">
          আপনার অর্ডারের প্রতিটি ধাপের সর্বশেষ অবস্থা
        </p>
      </div>

      <div>
        {STEPS.map((step, index) => {
          const Icon = step.icon;

          const complete = stopped
            ? index === 0
            : index < activeIndex;

          const active = stopped
            ? index === 1
            : index === activeIndex;

          const matchingEvent = events
            .filter((event) => {
              if (step.key === "pending") {
                return event.status === "placed";
              }

              if (step.key === "verified") {
                return [
                  "payment_verified",
                  "phone_confirmed",
                  "verified",
                ].includes(event.status);
              }

              return event.status === step.key;
            })
            .at(-1);

          return (
            <div key={step.key} className="flex gap-3">

              {/* ICON + CONNECTOR */}

              <div className="flex flex-col items-center">
                <div
                  className={`z-10 flex size-9 shrink-0 items-center justify-center rounded-full border-2 ${
                    stopped && active
                      ? "border-red-500 bg-red-500 text-white"
                      : complete
                        ? "border-secondary bg-secondary text-white"
                        : active
                          ? "border-gold-soft bg-gold-soft text-primary"
                          : "border-base-300 bg-base-200 text-muted"
                  }`}
                >
                  {stopped && active ? (
                    <XCircle size={17} />
                  ) : complete ? (
                    <Check size={17} />
                  ) : (
                    <Icon size={17} />
                  )}
                </div>

                {index < STEPS.length - 1 && (
                  <div
                    className={`my-1 min-h-8 w-0.5 flex-1 ${
                      complete
                        ? "bg-secondary/60"
                        : "bg-base-300"
                    }`}
                  />
                )}
              </div>

              {/* TEXT */}

              <div className="flex min-w-0 flex-1 flex-wrap items-start justify-between gap-2 pb-7">

                <div className="min-w-0">
                  <h3
                    className={`text-xs font-bold sm:text-sm ${
                      stopped && active
                        ? "text-red-700"
                        : active || complete
                          ? "text-primary"
                          : "text-muted"
                    }`}
                  >
                    {stopped && active
                      ? "অর্ডার যাচাই ব্যর্থ / বাতিল"
                      : step.label}
                  </h3>

                  <p className="mt-1 text-[11px] text-muted">
                    {step.english}
                  </p>

                  {matchingEvent?.date && (
                    <p className="mt-1.5 text-[11px] text-muted">
                      {formatDate(matchingEvent.date)}
                    </p>
                  )}
                </div>

                <span
                  className={`shrink-0 rounded-lg px-2 py-1 text-[10px] font-semibold ${
                    stopped && active
                      ? "bg-red-100 text-red-700"
                      : complete
                        ? "bg-secondary/10 text-secondary"
                        : active
                          ? "bg-gold-soft/50 text-primary"
                          : "bg-base-200 text-muted"
                  }`}
                >
                  {stopped && active
                    ? "বন্ধ"
                    : complete
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

      <div
        className={`rounded-xl p-3 text-xs leading-6 ${
          stopped
            ? "bg-red-50 text-red-700"
            : "bg-secondary/5 text-muted"
        }`}
      >
        {stopped
          ? "অর্ডারটি বর্তমানে বন্ধ রয়েছে। বিস্তারিত জানতে সাপোর্টে যোগাযোগ করুন।"
          : order.status === "pending"
            ? order.payment?.method === "cod"
              ? "ফোনে নিশ্চিতকরণের পরে অর্ডারের প্রস্তুতি শুরু হবে।"
              : "পেমেন্টের তথ্য যাচাইয়ের অপেক্ষায় রয়েছে।"
            : "অর্ডারের বর্তমান অবস্থা অনুযায়ী প্রস্তুতি ও ডেলিভারি এগিয়ে চলছে।"}
      </div>
    </section>
  );
}

// =============================================
// ORDER HISTORY
// =============================================

function TrackingHistory({ history, fullAccess }) {
  const events = Array.isArray(history)
    ? [...history].reverse()
    : [];

  if (events.length === 0) return null;

  return (
    <section className="section-card p-4 sm:p-6">
      <h2 className="mb-4 flex items-center gap-2 font-bold text-primary">
        <Clock3 size={18} className="text-secondary" />
        সাম্প্রতিক আপডেট
      </h2>

      <div className="space-y-4">
        {events.map((event, index) => (
          <div
            key={`${event.status}-${index}`}
            className="flex items-start gap-3"
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-secondary">
              <CheckCircle2 size={15} />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-bold text-primary">
                {HISTORY_LABELS[event.status] ||
                  String(event.status).replace(/_/g, " ")}
              </p>

              <p className="mt-1 text-[11px] text-muted">
                {formatDate(event.date)}
              </p>

              {fullAccess && event.note && (
                <p className="mt-1 break-words text-xs leading-5 text-muted">
                  {event.note}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// =============================================
// FULL ACCESS: PRODUCT ITEM
// =============================================

function TrackingProduct({ item }) {
  const quantity = Number(item.quantity) || 1;
  const unitPrice = Number(
    item.unitPrice ?? item.price ?? 0
  );

  const custom = item.customization || {};

  const fields = [
    ["নাম", custom.name],
    ["বিশেষ তারিখ", custom.date],
    ["বার্তা", custom.message],
    ["নোট", custom.note],
  ].filter(([, value]) => Boolean(value));

  const photos = Array.isArray(custom.photos)
    ? custom.photos
    : [];

  return (
    <article className="min-w-0 rounded-xl border-2 border-dashed border-secondary/25 bg-base-100 p-3">
      <div className="flex min-w-0 items-start gap-2.5">

        <div className="size-14 shrink-0 overflow-hidden rounded-lg bg-base-200">
          {item.image ? (
            <img
              src={item.image}
              alt={item.name}
              loading="lazy"
              className="size-full object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-muted">
              <ImageOff size={20} />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-xs font-bold leading-5 text-primary">
            {item.name}
          </p>

          {item.sku && (
            <p className="mt-1 truncate text-[10px] text-muted">
              SKU: {item.sku}
            </p>
          )}

          <div className="mt-1.5 flex flex-wrap gap-1">
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
          </div>

          <p className="mt-2 text-[11px] text-muted">
            {quantity} × {money(unitPrice)}
          </p>

          <p className="mt-1 text-sm font-bold text-primary">
            {money(item.lineTotal ?? unitPrice * quantity)}
          </p>
        </div>
      </div>

      {(fields.length > 0 || photos.length > 0) && (
        <details className="group mt-3 rounded-lg bg-secondary/5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 text-xs font-semibold text-secondary [&::-webkit-details-marker]:hidden">
            <span className="flex items-center gap-1.5">
              <Gift size={13} />
              কাস্টমাইজেশন
            </span>

            <ChevronDown
              size={15}
              className="transition-transform group-open:rotate-180"
            />
          </summary>

          <div className="space-y-2 border-t border-secondary/10 p-3">
            {fields.map(([label, value]) => (
              <div key={label}>
                <p className="text-[11px] font-bold text-primary">
                  {label}
                </p>

                <p className="mt-1 whitespace-pre-wrap break-words rounded-lg bg-base-100 p-2 text-xs text-muted">
                  {value}
                </p>
              </div>
            ))}

            {photos.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {photos.map((photo, index) => (
                  <a
                    key={photo.id || index}
                    href={photo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="aspect-square overflow-hidden rounded-lg bg-base-200"
                  >
                    <img
                      src={photo.url}
                      alt={`Customer photo ${index + 1}`}
                      loading="lazy"
                      className="size-full object-cover"
                    />
                  </a>
                ))}
              </div>
            )}
          </div>
        </details>
      )}
    </article>
  );
}

// =============================================
// MAIN TRACKING PAGE
// =============================================

export default function OrderTrackingPage() {
  const { orderId } = useParams();

  const [authState, setAuthState] = useState({
    ready: false,
    uid: null,
  });

  const [orderNumber, setOrderNumber] = useState(
    orderId || ""
  );

  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState(null);
  const [fullAccess, setFullAccess] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // ===========================================
  // WAIT FOR FIREBASE AUTH INITIALIZATION
  // ===========================================

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setAuthState({
        ready: true,
        uid: user?.uid || null,
      });
    });
  }, []);

  // ===========================================
  // AUTO-LOAD SECURE ORDER BY URL
  // Logged-in owner or valid Guest Token only
  // ===========================================

  useEffect(() => {
    setOrderNumber(orderId || "");
    setOrder(null);
    setFullAccess(false);
    setError("");

    if (!orderId || !authState.ready) return;

    const token = getGuestOrderToken(orderId);

    if (!authState.uid && !token) {
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);

      try {
        const result = await orderRequest(
          `/orders/${encodeURIComponent(orderId)}`,
          {
            orderId,
          }
        );

        if (cancelled) return;

        setOrder(result.order);
        setFullAccess(true);
      } catch (error) {
        if (cancelled) return;

        setError(
          "অর্ডারটি সরাসরি খোলা যায়নি। প্রয়োজন হলে নিচে Order Number ও Phone দিয়ে Status দেখুন।"
        );
        console.log(error)
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [
    orderId,
    authState.ready,
    authState.uid,
  ]);

  // ===========================================
  // TRACK ORDER
  // Prefer authorized details; otherwise
  // use the LIMITED public tracking endpoint.
  // ===========================================

  const performTracking = async (identifier, mobile) => {
    const token = getGuestOrderToken(identifier);

    if (auth.currentUser || token) {
      try {
        const result = await orderRequest(
          `/orders/${encodeURIComponent(identifier)}`,
          { orderId: identifier }
        );

        return {
          order: result.order,
          full: true,
        };
      } catch (err) {
        // Unauthorized lookup may still use
        // phone-based limited public tracking.
        if (![401, 403, 404].includes(err.status)) {
          throw err;
        }
      }
    }

    const result = await orderRequest(
      "/orders/public/track",
      {
        method: "POST",
        body: {
          orderNumber: identifier,
          phone: mobile,
        },
      }
    );

    return {
      order: result.order,
      full: false,
    };
  };

  const handleTrackOrder = async (event) => {
    event.preventDefault();

    if (loading) return;

    const identifier = orderNumber.trim().toUpperCase();
    const mobile = phone.trim();

    if (!identifier) {
      setError("Order Number অথবা Order ID দিন।");
      return;
    }

    if (!/^01[3-9]\d{8}$/.test(mobile)) {
      setError("সঠিক ১১ সংখ্যার মোবাইল নম্বর দিন।");
      return;
    }

    setLoading(true);
    setError("");
    setOrder(null);
    setFullAccess(false);

    try {
      const result = await performTracking(
        identifier,
        mobile
      );

      setOrder(result.order);
      setFullAccess(result.full);
    } catch (err) {
      setError(
        err.status === 429
          ? "অনেকবার চেষ্টা করা হয়েছে। কিছুক্ষণ পরে আবার চেষ্টা করুন।"
          : err.status === 404
            ? "এই তথ্য দিয়ে কোনো অর্ডার পাওয়া যায়নি।"
            : err.message || "অর্ডার খুঁজতে সমস্যা হয়েছে।"
      );
    } finally {
      setLoading(false);
    }
  };

  // ===========================================
  // REFRESH CURRENT ORDER
  // ===========================================

  const handleRefresh = async () => {
    if (!order || loading) return;

    setLoading(true);
    setError("");

    try {
      let result;

      if (fullAccess) {
        const response = await orderRequest(
          `/orders/${encodeURIComponent(
            order._id || order.orderNumber
          )}`,
          {
            orderId:
              order._id || order.orderNumber,
          }
        );

        result = response.order;
      } else {
        const response = await orderRequest(
          "/orders/public/track",
          {
            method: "POST",
            body: {
              orderNumber: order.orderNumber,
              phone: phone.trim(),
            },
          }
        );

        result = response.order;
      }

      setOrder(result);
    } catch (err) {
      setError(
        err.message || "অর্ডার আপডেট করা যায়নি।"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!order?.orderNumber) return;

    try {
      await navigator.clipboard.writeText(
        order.orderNumber
      );

      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  // ===========================================
  // COMPUTED DATA
  // ===========================================

  const stopped = [
    "rejected",
    "cancelled",
  ].includes(order?.status);

  const isCod =
    order?.payment?.method === "cod";

  const partialPayment =
    order?.payment?.status === "partially_paid";

  const total = Number(order?.total || 0);
  const verifiedAmount = Number(
    order?.payment?.verifiedAmount || 0
  );

  const dueAmount = Math.max(
    0,
    total - verifiedAmount
  );

  const items = Array.isArray(order?.items)
    ? order.items
    : [];

  const itemCount = items.reduce(
    (sum, item) =>
      sum + (Number(item.quantity) || 0),
    0
  );

  // ===========================================
  // PAGE UI
  // ===========================================

  return (
    <main className="page-bg min-h-screen py-8 sm:py-12">
      <div className="page-container max-w-6xl">

        {/* HEADER */}

        <div className="mb-8 text-center">
          <span className="badge-soft">
            <PackageSearch size={14} />
            সহজ ও নিরাপদ অর্ডার ট্র্যাকিং
          </span>

          <h1 className="mt-3 text-2xl font-bold text-primary sm:text-3xl">
            আপনার অর্ডার ট্র্যাক করুন
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted">
            অর্ডার নম্বর ও মোবাইল নম্বর দিয়ে
            সর্বশেষ অর্ডার স্ট্যাটাস দেখুন।
          </p>
        </div>

        {/* SEARCH FORM */}

        <section className="section-card mx-auto mb-8 max-w-3xl overflow-hidden">
          <div className="border-b border-base-300/70 bg-secondary/5 px-4 py-4 sm:px-6">
            <h2 className="flex items-center gap-2 font-bold text-primary">
              <Search size={18} className="text-secondary" />
              অর্ডার খুঁজুন
            </h2>

            <p className="mt-1 text-xs text-muted">
              লগইন ছাড়াই Order Status দেখা যাবে।
              ব্যক্তিগত Order Details দেখতে Secure Access প্রয়োজন।
            </p>
          </div>

          <form
            onSubmit={handleTrackOrder}
            className="p-4 sm:p-6"
          >
            <div className="grid gap-4 sm:grid-cols-2">

              <label className="block text-xs font-semibold text-primary">
                Order Number / Order ID
                <input
                  type="text"
                  value={orderNumber}
                  onChange={(event) =>
                    setOrderNumber(event.target.value)
                  }
                  maxLength={100}
                  placeholder="SKB-XXXX অথবা Order ID"
                  className="input input-bordered mt-2 h-12 w-full rounded-xl bg-base-200/50 text-sm"
                  required
                />
              </label>

              <label className="block text-xs font-semibold text-primary">
                অর্ডারের মোবাইল নম্বর
                <input
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={(event) =>
                    setPhone(
                      event.target.value
                        .replace(/\D/g, "")
                        .slice(0, 11)
                    )
                  }
                  maxLength={11}
                  placeholder="01XXXXXXXXX"
                  className="input input-bordered mt-2 h-12 w-full rounded-xl bg-base-200/50 text-sm"
                  required
                />
              </label>
            </div>

            {error && (
              <p
                role="alert"
                className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-700"
              >
                <AlertCircle
                  size={16}
                  className="shrink-0"
                />
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-brand mt-5 w-full rounded-xl py-3 text-sm disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
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

            <p className="mt-4 flex items-start justify-center gap-2 text-center text-[11px] leading-5 text-muted">
              <LockKeyhole
                size={13}
                className="mt-0.5 shrink-0"
              />
              অর্ডারের পূর্ণ তথ্য শুধুমাত্র অনুমোদিত
              Account বা Guest Access Token দিয়ে দেখা যাবে।
            </p>
          </form>
        </section>

        {/* EMPTY STATE */}

        {!order && !loading && (
          <div className="mx-auto max-w-lg py-5 text-center">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-secondary/10 text-secondary">
              <PackageSearch size={28} />
            </div>

            <h3 className="mt-4 font-bold text-primary">
              আপনার অর্ডারের আপডেট এখানে দেখুন
            </h3>

            <p className="mt-2 text-sm text-muted">
              উপরের ফর্মে তথ্য দিয়ে সার্চ করুন।
            </p>
          </div>
        )}

        {/* ORDER RESULTS */}

        {order && (
          <div className="space-y-6">

            {/* ACCESS STATUS */}

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-secondary/10 bg-secondary/5 px-4 py-3">
              <p className="flex items-center gap-2 text-xs font-semibold text-secondary">
                <LockKeyhole size={15} />

                {fullAccess
                  ? "Secure Full Order Details"
                  : "Limited Order Status View"}
              </p>

              <button
                type="button"
                onClick={handleRefresh}
                disabled={loading}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-secondary disabled:opacity-50"
              >
                <RefreshCw
                  size={14}
                  className={loading ? "animate-spin" : ""}
                />
                Refresh Status
              </button>
            </div>

            {/* ORDER HEADER */}

            <section className="section-card p-4 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">

                <div className="min-w-0">
                  <p className="text-xs text-muted">
                    আপনার অর্ডার
                  </p>

                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <h2 className="break-all text-lg font-bold text-primary sm:text-xl">
                      #{order.orderNumber}
                    </h2>

                    <button
                      type="button"
                      onClick={handleCopy}
                      className="rounded-lg p-1.5 text-secondary hover:bg-secondary/10"
                      aria-label="অর্ডার নম্বর কপি"
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
                  className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                    stopped
                      ? "bg-red-100 text-red-700"
                      : order.status === "delivered"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-gold-soft/50 text-primary"
                  }`}
                >
                  {STATUS_LABELS[order.status] ||
                    order.status}
                </span>
              </div>

              {/* SUMMARY */}

              <div className={`mt-5 grid gap-3 ${
                fullAccess
                  ? "sm:grid-cols-3"
                  : "sm:grid-cols-2"
              }`}>

                <div className="rounded-xl bg-secondary/5 p-4">
                  <p className="text-xs text-muted">
                    অর্ডার স্ট্যাটাস
                  </p>

                  <p className="mt-2 text-sm font-bold text-primary">
                    {STATUS_LABELS[order.status] ||
                      order.status}
                  </p>
                </div>

                <div className="rounded-xl bg-secondary/5 p-4">
                  <p className="text-xs text-muted">
                    পেমেন্ট স্ট্যাটাস
                  </p>

                  <p className="mt-2 text-sm font-bold text-primary">
                    {PAYMENT_LABELS[
                      order.payment?.status
                    ] ||
                      order.payment?.status ||
                      "Pending"}
                  </p>

                  {partialPayment && (
                    <p className="mt-1 text-[11px] text-secondary">
                      আংশিক পেমেন্ট যাচাইকৃত
                    </p>
                  )}
                </div>

                {fullAccess && (
                  <div className="rounded-xl bg-gold-soft/20 p-4">
                    <p className="text-xs text-primary">
                      সর্বমোট অর্ডার মূল্য
                    </p>

                    <p className="mt-2 text-xl font-bold text-primary">
                      {money(total)}
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* MAIN TWO COLUMNS */}

            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">

              {/* LEFT: PROGRESS + HISTORY */}

              <div className="space-y-5">
                <TrackingProgress order={order} />

                <TrackingHistory
                  history={order.history}
                  fullAccess={fullAccess}
                />
              </div>

              {/* RIGHT: PRODUCTS + SHIPPING */}

              <div className="space-y-5">

                {/* PUBLIC VIEW NOTICE */}

                {!fullAccess && (
                  <section className="section-card p-4 sm:p-5">
                    <div className="flex items-start gap-3">
                      <div className="icon-box shrink-0">
                        <LockKeyhole size={19} />
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-primary">
                          ব্যক্তিগত অর্ডার তথ্য সুরক্ষিত
                        </h3>

                        <p className="mt-2 text-xs leading-6 text-muted">
                          Customer Address, Product
                          Customization, TrxID ও Payment
                          Amount এখানে প্রকাশ করা হয়নি।
                          নিজের Account-এ Login অথবা
                          Guest Secure Order Link ব্যবহার
                          করে পূর্ণ তথ্য দেখতে পারবেন।
                        </p>
                      </div>
                    </div>
                  </section>
                )}

                {/* FULL DETAILS ONLY */}

                {fullAccess && (
                  <>
                    <section className="section-card p-4 sm:p-5">
                      <h2 className="mb-4 flex items-center gap-2 font-bold text-primary">
                        <ShoppingBag
                          size={18}
                          className="text-secondary"
                        />
                        অর্ডারের পণ্যসমূহ ({itemCount})
                      </h2>

                      <div className="max-h-[520px] space-y-3 overflow-y-auto pr-1">
                        {items.map((item, index) => (
                          <TrackingProduct
                            key={item.cartId || index}
                            item={item}
                          />
                        ))}
                      </div>

                      {/* PRICE BREAKDOWN */}

                      <div className="mt-5 space-y-3 border-t border-base-300 pt-4 text-xs">
                        <div className="flex justify-between gap-2">
                          <span className="text-muted">
                            পণ্যের মূল্য
                          </span>
                          <strong className="text-primary">
                            {money(order.subtotal)}
                          </strong>
                        </div>

                        <div className="flex justify-between gap-2">
                          <span className="text-muted">
                            ডেলিভারি
                          </span>
                          <strong className="text-primary">
                            {money(order.deliveryCharge)}
                          </strong>
                        </div>

                        {Number(order.giftWrapCharge) > 0 && (
                          <div className="flex justify-between gap-2">
                            <span className="text-muted">
                              গিফট র‍্যাপিং
                            </span>
                            <strong className="text-primary">
                              {money(order.giftWrapCharge)}
                            </strong>
                          </div>
                        )}

                        <div className="flex justify-between gap-2 rounded-lg bg-secondary/10 p-3 font-bold">
                          <span className="text-primary">
                            সর্বমোট
                          </span>
                          <span className="text-primary">
                            {money(total)}
                          </span>
                        </div>

                        {!isCod && (
                          <div className="flex justify-between gap-2">
                            <span className="text-muted">
                              দাবিকৃত পেমেন্ট
                            </span>
                            <strong className="text-primary">
                              {money(order.payment?.claimedAmount)}
                            </strong>
                          </div>
                        )}

                        {!isCod && (
                          <div className="flex justify-between gap-2">
                            <span className="text-muted">
                              যাচাইকৃত পেমেন্ট
                            </span>
                            <strong className="text-emerald-700">
                              {money(verifiedAmount)}
                            </strong>
                          </div>
                        )}

                        <div className="flex justify-between gap-2 rounded-lg bg-gold-soft/20 p-3">
                          <strong className="text-primary">
                            অবশিষ্ট ব্যালেন্স
                          </strong>
                          <strong className="text-primary">
                            {stopped
                              ? "অর্ডার বন্ধ"
                              : money(dueAmount)}
                          </strong>
                        </div>
                      </div>
                    </section>

                    {/* DELIVERY */}

                    <section className="section-card p-4 sm:p-5">
                      <h2 className="mb-4 flex items-center gap-2 font-bold text-primary">
                        <Truck
                          size={18}
                          className="text-secondary"
                        />
                        ডেলিভারি তথ্য
                      </h2>

                      <div className="space-y-4 text-xs">
                        <div>
                          <p className="font-semibold text-primary">
                            ডেলিভারি ঠিকানা
                          </p>

                          <p className="mt-1 break-words leading-6 text-muted">
                            {order.customer?.address},{" "}
                            {order.customer?.district},{" "}
                            {order.customer?.division}
                          </p>
                        </div>

                        <div>
                          <p className="font-semibold text-primary">
                            প্রাপকের নাম ও নম্বর
                          </p>

                          <p className="mt-1 text-muted">
                            {order.customer?.name} ·{" "}
                            {order.customer?.phone}
                          </p>
                        </div>

                        <div>
                          <p className="font-semibold text-primary">
                            সম্ভাব্য ডেলিভারি
                          </p>

                          <p className="mt-1 text-muted">
                            {formatDate(order.estimatedDelivery)}
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

                        {order.courier?.trackingNumber && (
                          <p className="break-all text-xs text-secondary">
                            Tracking:{" "}
                            {order.courier.trackingNumber}
                          </p>
                        )}
                      </div>
                    </section>
                  </>
                )}

                {/* DELIVERY ESTIMATE FOR LIMITED VIEW */}

                {!fullAccess && (
                  <section className="section-card p-4">
                    <p className="text-xs font-semibold text-primary">
                      সম্ভাব্য ডেলিভারি
                    </p>

                    <p className="mt-2 text-sm text-muted">
                      {formatDate(order.estimatedDelivery)}
                    </p>
                  </section>
                )}

                {/* SUPPORT */}

                <section className="rounded-2xl bg-secondary/5 p-4">
                  <div className="flex items-start gap-3">
                    <div className="icon-box shrink-0">
                      <Headphones size={20} />
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-primary">
                        সাহায্য প্রয়োজন?
                      </h3>

                      <p className="mt-1 text-xs leading-5 text-muted">
                        অর্ডার বা ডেলিভারি সংক্রান্ত
                        প্রশ্ন থাকলে যোগাযোগ করুন।
                      </p>
                    </div>
                  </div>

                  <Link
                    to="/contact"
                    className="btn-outline-brand mt-4 w-full rounded-xl px-3 py-2.5 text-xs"
                  >
                    সাপোর্টে যোগাযোগ করুন
                  </Link>
                </section>
              </div>
            </div>

            {/* ACTIONS */}

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  setOrder(null);
                  setError("");
                  setFullAccess(false);
                  setCopied(false);
                }}
                className="btn-outline-brand w-full rounded-xl text-sm"
              >
                <RefreshCw size={16} />
                অন্য অর্ডার খুঁজুন
              </button>

              <Link
                to="/shop"
                className="btn-brand w-full rounded-xl text-sm"
              >
                <ShoppingBag size={16} />
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
