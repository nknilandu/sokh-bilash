
import { useEffect, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import Swal from "sweetalert2";

import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Copy,
  ExternalLink,
  Gift,
  Headphones,
  ImageOff,
  Info,
  Loader2,
  MapPin,
  PackageCheck,
  Phone,
  ReceiptText,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
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

// ==========================================
// CONFIGURATION
// ==========================================

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

const inputClass =
  "mt-1.5 w-full min-w-0 rounded-xl border border-base-300 bg-base-100 px-3.5 py-3 text-sm text-primary outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/10 disabled:opacity-50";

// ==========================================
// HELPERS
// ==========================================

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("bn-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function roundAmount(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.round(number * 100) / 100;
}

function positiveAmount(value) {
  return Math.max(0, roundAmount(value));
}

function validPhone(value) {
  return /^01[3-9]\d{8}$/.test(
    String(value || "").trim(),
  );
}

function validPaymentAmount(value) {
  const text = String(value || "").trim();

  return (
    /^\d+(?:\.\d{1,2})?$/.test(text) &&
    Number.isFinite(Number(text)) &&
    Number(text) > 0
  );
}

// Backend permits absolute HTTPS tracking URLs.

function getSafeTrackingUrl(value) {
  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    return "";
  }

  try {
    const url = new URL(value.trim());

    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password
    ) {
      return "";
    }

    return url.href;
  } catch {
    return "";
  }
}

function getPaymentStatusText(
  status,
  isCod,
  phoneConfirmed = false,
) {
  if (isCod) {
    if (status === "cod_collected") {
      return "সম্পূর্ণ টাকা পরিশোধিত";
    }

    return phoneConfirmed
      ? "ডেলিভারিতে নগদ পেমেন্ট"
      : "ফোনে নিশ্চিতকরণের অপেক্ষায়";
  }

  switch (status) {
    case "verified":
      return "পেমেন্ট যাচাইকৃত";

    case "partially_paid":
      return "আংশিক পেমেন্ট যাচাইকৃত";

    case "rejected":
      return "পেমেন্ট যাচাই ব্যর্থ";

    case "pending":
    case "verification_pending":
      return "যাচাইয়ের অপেক্ষায়";

    default:
      return status || "যাচাইয়ের অপেক্ষায়";
  }
}

// ==========================================
// ORDER PRODUCTS
// ==========================================

function OrderProducts({ items }) {
  const list = Array.isArray(items) ? items : [];

  if (!list.length) {
    return (
      <div className="rounded-xl bg-base-200 p-5 text-center">
        <ShoppingBag
          size={25}
          className="mx-auto text-secondary"
        />

        <p className="mt-2 text-xs text-muted">
          পণ্যের তথ্য পাওয়া যায়নি।
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {list.map((item, index) => {
        const custom =
          item.customization &&
          typeof item.customization === "object"
            ? item.customization
            : {};

        const fields = [
          ["নাম", custom.name],
          ["বিশেষ তারিখ", custom.date || custom.dob],
          ["বার্তা", custom.message || custom.engraving],
          ["নোট", custom.note || custom.customNote],
        ].filter(([, value]) => Boolean(value));

        const photos = Array.isArray(custom.photos)
          ? custom.photos
          : [];

        const hasCustom =
          fields.length > 0 || photos.length > 0;

        const quantity = Number(item.quantity) || 1;
        const unitPrice = Number(
          item.unitPrice ?? item.price ?? 0,
        );
        const lineTotal = Number(
          item.lineTotal ?? unitPrice * quantity,
        );

        return (
          <article
            key={
              item.cartId ||
              `${item.productId || index}-${index}`
            }
            className="rounded-xl border-2 border-dashed border-secondary/25 bg-base-100 p-3 sm:p-4"
          >
            <div className="flex min-w-0 gap-3">
              {/* PRODUCT IMAGE */}

              <div className="size-16 shrink-0 overflow-hidden rounded-lg bg-base-200 sm:size-20">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name || "Product"}
                    className="size-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center text-muted">
                    <ImageOff size={24} />
                  </div>
                )}
              </div>

              {/* PRODUCT INFORMATION */}

              <div className="min-w-0 flex-1">
                <h3 className="line-clamp-2 text-xs font-bold leading-5 text-primary sm:text-sm">
                  {item.name || "প্রোডাক্ট"}
                </h3>

                {item.sku && (
                  <p className="mt-1 truncate text-[10px] text-muted">
                    SKU: {item.sku}
                  </p>
                )}

                <div className="mt-2 flex flex-wrap gap-1.5">
                  {Object.entries(
                    item.selectedOptions || {},
                  )
                    .filter(([, value]) => Boolean(value))
                    .map(([key, value]) => (
                      <span
                        key={key}
                        className="rounded-md bg-base-200 px-2 py-1 text-[10px] text-primary"
                      >
                        {key}: {String(value)}
                      </span>
                    ))}

                  {/* PER-PRODUCT PACKAGING */}

                  <span className="inline-flex items-center gap-1 rounded-md bg-secondary/5 px-2 py-1 text-[10px] text-secondary">
                    <Gift size={11} />

                    {item.packaging === "premium"
                      ? "গিফট র‍্যাপিং বক্স"
                      : "সাধারণ প্যাকেজিং"}
                  </span>
                </div>

                <p className="mt-2 text-xs text-muted">
                  পরিমাণ: {quantity} × {money(unitPrice)}
                </p>
              </div>

              <strong className="shrink-0 whitespace-nowrap text-xs text-primary sm:text-sm">
                {money(lineTotal)}
              </strong>
            </div>

            {/* CUSTOMIZATION */}

            {hasCustom && (
              <details className="group mt-3 rounded-lg bg-secondary/5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 text-xs font-semibold text-secondary [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center gap-1.5">
                    <Gift size={14} />
                    আপনার কাস্টমাইজেশন
                  </span>

                  <ChevronDown
                    size={15}
                    className="transition-transform group-open:rotate-180"
                  />
                </summary>

                <div className="space-y-3 border-t border-secondary/10 p-3">
                  {fields.map(([label, value]) => (
                    <div key={label}>
                      <p className="text-[11px] font-semibold text-primary">
                        {label}
                      </p>

                      <p className="mt-1 whitespace-pre-wrap break-words rounded-md bg-base-100 p-2 text-xs leading-5 text-muted">
                        {String(value)}
                      </p>
                    </div>
                  ))}

                  {photos.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-semibold text-primary">
                        আপলোড করা ছবি ({photos.length})
                      </p>

                      <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
                        {photos.map((photo, photoIndex) => {
                          const photoUrl =
                            getSafeTrackingUrl(photo.url);

                          return photoUrl ? (
                            <a
                              key={photo.id || photoIndex}
                              href={photoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="aspect-square overflow-hidden rounded-lg bg-base-200"
                            >
                              <img
                                src={photoUrl}
                                alt={`Customer Photo ${photoIndex + 1}`}
                                className="size-full object-cover"
                                loading="lazy"
                              />
                            </a>
                          ) : null;
                        })}
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

// ==========================================
// ORDER PROGRESS
// ==========================================

function OrderProgress({ order }) {
  const rejected = [
    "rejected",
    "cancelled",
  ].includes(order.status);

  const isCancelled = order.status === "cancelled";

  const current = STAGE_INDEX[order.status] ?? 0;

  return (
    <section className="section-card p-4 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-bold text-primary">
            অর্ডার অগ্রগতি স্ট্যাটাস
          </h2>

          <p className="mt-1 text-xs text-muted">
            Order Progress & Tracking
          </p>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            rejected
              ? "bg-red-100 text-red-700"
              : "bg-secondary/10 text-secondary"
          }`}
        >
          {rejected
            ? isCancelled
              ? "Order Cancelled"
              : "Payment Rejected"
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

            const complete = rejected
              ? index === 0
              : index < current;

            const active = rejected
              ? index === 1
              : index === current;

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
                  ) : complete ? (
                    <Check size={17} />
                  ) : (
                    <Icon size={17} />
                  )}
                </div>

                <p className="mt-2 text-[11px] font-bold text-primary">
                  {rejected && index === 1
                    ? isCancelled
                      ? "বাতিল"
                      : "যাচাই ব্যর্থ"
                    : stage.title}
                </p>

                <p className="mt-1 text-[10px] text-muted">
                  {rejected && index === 1
                    ? isCancelled
                      ? "Cancelled"
                      : "Rejected"
                    : stage.english}
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
          ? isCancelled
            ? "অর্ডারটি বাতিল হয়েছে। কোনো টাকা গ্রহণ করা হয়ে থাকলে Refund Status নিচে দেখুন।"
            : "পেমেন্ট যাচাই ব্যর্থ হয়েছে। সঠিক তথ্য পুনরায় জমা দিতে পারবেন।"
          : order.status === "pending"
            ? order.payment?.method === "cod"
              ? "আমাদের টিম ফোন করে অর্ডার নিশ্চিত করবে।"
              : "আপনার দেওয়া পেমেন্টের তথ্য Admin যাচাই করবেন। প্রয়োজনে ফোনে যোগাযোগ করা হবে।"
            : order.status === "shipped"
              ? "আপনার অর্ডার কুরিয়ারে পাঠানো হয়েছে। Tracking URL দেওয়া থাকলে নিচে কুরিয়ারের লিংক দেখা যাবে।"
              : order.status === "delivered"
                ? "আপনার অর্ডার ডেলিভারি সম্পন্ন হয়েছে।"
                : "অর্ডারটির বর্তমান অবস্থা অনুযায়ী প্রস্তুতি ও ডেলিভারি এগিয়ে চলছে।"}
      </p>
    </section>
  );
}

// ==========================================
// PAYMENT DIFFERENCE NOTICE
// ==========================================

function PaymentDifferenceNotice({
  total,
  claimed,
  verifiedAmount,
  isCod,
  rejected,
  paymentReviewed,
}) {
  if (isCod || rejected || claimed <= 0) {
    return null;
  }

  const claimedShortfall = Math.max(
    0,
    roundAmount(total - claimed),
  );

  const claimedExcess = Math.max(
    0,
    roundAmount(claimed - total),
  );

  const verifiedExcess = Math.max(
    0,
    roundAmount(verifiedAmount - total),
  );

  const exact =
    roundAmount(claimed) === roundAmount(total);

  return (
    <section className="section-card mb-5 p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <span className="icon-box">
          <Wallet size={19} />
        </span>

        <div>
          <h2 className="font-bold text-primary">
            পেমেন্টের পরিমাণ ও সমন্বয়
          </h2>

          <p className="mt-1 text-xs text-muted">
            Payment Difference & Adjustment
          </p>
        </div>
      </div>

      {/* UNDERPAYMENT */}

      {claimedShortfall > 0 && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle
              size={20}
              className="mt-0.5 shrink-0 text-amber-700"
            />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-amber-900">
                  আংশিক পেমেন্ট
                </h3>

                <span className="text-sm font-bold text-amber-900">
                  সম্ভাব্য বাকি: {money(claimedShortfall)}
                </span>
              </div>

              <p className="mt-2 text-xs leading-6 text-amber-900">
                অর্ডারের মোট মূল্যের চেয়ে{" "}
                {money(claimedShortfall)} কম পাঠানোর
                তথ্য দিয়েছেন। পেমেন্ট যাচাইয়ের পর
                আমাদের টিম ফোনে বিষয়টি নিশ্চিত করবে।
                বাকি টাকা পণ্য হাতে পাওয়ার পর
                পরিশোধ করতে হবে।
              </p>

              <p className="mt-2 text-[11px] leading-5 text-amber-800">
                যাচাইয়ে পাঠানো টাকার পরিমাণ ভিন্ন হলে
                বাকি টাকার হিসাবও পরিবর্তিত হতে পারে।
              </p>
            </div>
          </div>
        </div>
      )}

      {/* OVERPAYMENT */}

      {claimedExcess > 0 && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck
              size={20}
              className="mt-0.5 shrink-0 text-emerald-700"
            />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-emerald-900">
                  অতিরিক্ত পেমেন্ট
                </h3>

                <span className="text-sm font-bold text-emerald-800">
                  দাবিকৃত অতিরিক্ত: +
                  {money(claimedExcess)}
                </span>
              </div>

              <p className="mt-2 text-xs leading-6 text-emerald-900">
                অর্ডারের মোট মূল্যের চেয়ে{" "}
                {money(claimedExcess)} বেশি পাঠানোর
                তথ্য দিয়েছেন। Admin পেমেন্ট যাচাইয়ের
                পর ফোনে যোগাযোগ করবেন।
              </p>

              <p className="mt-2 text-xs leading-6 text-emerald-900">
                আপনার সম্মতিতে যাচাইকৃত অতিরিক্ত
                টাকা ফেরত দেওয়া হবে অথবা
                সমমূল্যের অতিরিক্ত পণ্য দেওয়া হবে।
              </p>

              {verifiedExcess > 0 && (
                <div className="mt-3 rounded-lg bg-white/75 p-3">
                  <p className="text-xs font-bold text-emerald-800">
                    যাচাইকৃত অতিরিক্ত টাকা:{" "}
                    {money(verifiedExcess)}
                  </p>

                  <p className="mt-1 text-[11px] leading-5 text-emerald-900">
                    Refund বা অতিরিক্ত পণ্যের
                    সিদ্ধান্তের অগ্রগতি নিচে
                    দেখতে পারবেন।
                  </p>
                </div>
              )}

              {!paymentReviewed && (
                <p className="mt-2 text-[11px] leading-5 text-emerald-800">
                  বর্তমানে এটি শুধু আপনার দেওয়া
                  তথ্যের ভিত্তিতে হিসাব করা হয়েছে;
                  অতিরিক্ত টাকা এখনো যাচাইকৃত নয়।
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* EXACT PAYMENT */}

      {exact && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-secondary/15 bg-secondary/5 p-4">
          <CheckCircle2
            size={20}
            className="mt-0.5 shrink-0 text-secondary"
          />

          <div>
            <h3 className="text-sm font-bold text-primary">
              পেমেন্টের পরিমাণ মিলেছে
            </h3>

            <p className="mt-1 text-xs leading-6 text-muted">
              আপনার দেওয়া পাঠানো টাকার পরিমাণ
              অর্ডারের মোট মূল্যের সঙ্গে মিলেছে।
              {paymentReviewed
                ? " Admin-এর যাচাইকৃত পেমেন্ট তথ্য নিচে দেখুন।"
                : " তবে Admin যাচাই করার পরই পেমেন্ট নিশ্চিত হবে।"}
            </p>
          </div>
        </div>
      )}

      <div className="mt-4 flex items-start gap-2 rounded-lg bg-base-200/70 p-3">
        <Phone
          size={16}
          className="mt-0.5 shrink-0 text-secondary"
        />

        <p className="text-[11px] leading-5 text-muted">
          পেমেন্টে কোনো পার্থক্য থাকলে আমাদের
          টিম ফোনে নিশ্চিত করবে। যাচাই ও
          প্রয়োজনীয় সম্মতি ছাড়া অতিরিক্ত
          টাকা ফেরত বা অতিরিক্ত পণ্য প্রদান
          সম্পন্ন বলে গণ্য হবে না।
        </p>
      </div>
    </section>
  );
}

// ==========================================
// VERIFIED PAYMENT & REFUND STATUS
// ==========================================

function PaymentSettlement({ order }) {
  const payment = order.payment || {};

  const total = positiveAmount(order.total);

  const received = positiveAmount(
    payment.verifiedAmount,
  );

  const cash = positiveAmount(
    payment.cashCollected,
  );

  const online = positiveAmount(
    payment.onlineVerifiedAmount ??
      received - cash,
  );

  const refunded = positiveAmount(
    payment.refundedAmount,
  );

  const cancellation = payment.cancellationRefund;
  const excess = payment.excessResolution;

  const inactive = [
    "cancelled",
    "rejected",
  ].includes(order.status);

  const refundRemaining = Math.max(
    0,
    roundAmount(received - refunded),
  );

  const show =
    received > 0 ||
    refunded > 0 ||
    Boolean(cancellation) ||
    Boolean(excess);

  if (!show) return null;

  return (
    <section className="section-card mb-5 p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <span className="icon-box">
          <Wallet size={19} />
        </span>

        <div>
          <h2 className="font-bold text-primary">
            যাচাইকৃত পেমেন্ট ও রিফান্ড
          </h2>

          <p className="mt-1 text-xs text-muted">
            Verified Payments & Refunds
          </p>
        </div>
      </div>

      {/* COLLECTION BREAKDOWN */}

      <div className="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
        {[
          ["মোবাইল ব্যাংকিং", online],
          ["ডেলিভারিতে নগদ", cash],
          ["সর্বমোট প্রাপ্ত", received],
          ["ফেরত দেওয়া", refunded],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-xl bg-secondary/5 p-3"
          >
            <p className="text-muted">
              {label}
            </p>

            <p className="mt-1 text-sm font-bold text-primary">
              {money(value)}
            </p>
          </div>
        ))}
      </div>

      {/* CANCELLED / REJECTED ORDER REFUND */}

      {inactive && received > 0 && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-6 text-amber-900">
          <p className="font-bold">
            {refundRemaining === 0
              ? "রিফান্ড সম্পন্ন"
              : "রিফান্ড কার্যক্রম চলছে"}
          </p>

          <p className="mt-1">
            {refundRemaining > 0
              ? `যাচাইকৃত প্রাপ্ত টাকার মধ্যে ${money(refundRemaining)} এখনো ফেরত দেওয়ার বাকি। Admin-এর সঙ্গে যোগাযোগ করুন।`
              : "যাচাইকৃত প্রাপ্ত টাকা ফেরত দেওয়ার রেকর্ড সম্পন্ন হয়েছে।"}
          </p>

          {cancellation?.status && (
            <p className="mt-1 text-[11px]">
              Refund Status:{" "}
              {cancellation.status.replace(/_/g, " ")}
            </p>
          )}
        </div>
      )}

      {/* OVERPAYMENT RESOLUTION */}

      {!inactive && excess?.type && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs leading-6 text-emerald-900">
          <p className="font-bold">
            অতিরিক্ত পেমেন্টের সমন্বয়
          </p>

          <p className="mt-1">
            {excess.type === "refund"
              ? "টাকা ফেরত"
              : "সমমূল্যের অতিরিক্ত পণ্য"}
            :{" "}
            {money(excess.amount || 0)}
            {" · "}
            {excess.status === "completed"
              ? "সম্পন্ন"
              : "প্রক্রিয়াধীন"}
          </p>
        </div>
      )}

      {!inactive &&
        received > total &&
        !excess?.type && (
          <p className="mt-3 text-xs leading-6 text-muted">
            অতিরিক্ত টাকা যাচাই হয়েছে।
            Admin ফোনে যোগাযোগ করে Refund
            অথবা সমমূল্যের পণ্যের সিদ্ধান্ত
            নিশ্চিত করবেন।
          </p>
        )}
    </section>
  );
}

// ==========================================
// PAYMENT PROOF RESUBMISSION
// ==========================================

function ResubmitPayment({
  order,
  orderId,
  accessToken,
  onSuccess,
}) {
  const [form, setForm] = useState({
    senderPhone: order.payment?.senderPhone || "",
    trxId: "",
    amount:
      order.payment?.claimedAmount != null
        ? String(order.payment.claimedAmount)
        : order.payment?.amount != null
          ? String(order.payment.amount)
          : "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();

    if (loading) return;

    const phone = form.senderPhone.trim();
    const trxId = form.trxId.trim().toUpperCase();
    const paidAmount = Number(form.amount);

    if (!validPhone(phone)) {
      setError("সঠিক Sender Phone Number দিন।");
      return;
    }

    if (!/^[A-Z0-9_-]{5,60}$/.test(trxId)) {
      setError("সঠিক Transaction ID দিন।");
      return;
    }

    if (!validPaymentAmount(form.amount)) {
      setError("সঠিক পাঠানো টাকার পরিমাণ দিন।");
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
            amount: paidAmount,
          },
        },
      );

      await onSuccess();

      Swal.fire({
        icon: "success",
        title: "পেমেন্ট তথ্য জমা হয়েছে",
        text: "এখন Admin Verification-এর অপেক্ষায় রয়েছে।",
        timer: 2200,
        showConfirmButton: false,
      });
    } catch (requestError) {
      setError(
        requestError?.message ||
          "পেমেন্ট তথ্য জমা দেওয়া যায়নি।",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="section-card p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <span className="icon-box">
          <RefreshCw size={19} />
        </span>

        <div>
          <h2 className="font-bold text-primary">
            পেমেন্ট তথ্য সংশোধন করুন
          </h2>

          <p className="mt-1 text-xs text-muted">
            Payment Proof Resubmission
          </p>
        </div>
      </div>

      <p className="mt-3 text-xs leading-6 text-muted">
        আগের TrxID, Sender Number বা Amount ভুল
        হলে সঠিক তথ্য পুনরায় জমা দিন। নতুন করে
        টাকা পাঠানোর আগে সাপোর্ট টিমের সঙ্গে
        যোগাযোগ করুন।
      </p>

      {error && (
        <p
          role="alert"
          className="mt-3 rounded-lg border border-red-100 bg-red-50 p-3 text-xs leading-6 text-red-700"
        >
          {error}
        </p>
      )}

      <form
        onSubmit={submit}
        noValidate
        className="mt-4 grid gap-3 sm:grid-cols-2"
      >
        <label className="block text-xs font-semibold text-primary">
          Sender Number

          <input
            type="tel"
            inputMode="numeric"
            value={form.senderPhone}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                senderPhone: event.target.value
                  .replace(/\D/g, "")
                  .slice(0, 11),
              }))
            }
            placeholder="01XXXXXXXXX"
            className={inputClass}
            disabled={loading}
          />
        </label>

        <label className="block text-xs font-semibold text-primary">
          New / Correct TrxID

          <input
            value={form.trxId}
            maxLength={60}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                trxId: event.target.value.slice(0, 60),
              }))
            }
            placeholder="Transaction ID"
            className={inputClass}
            disabled={loading}
          />
        </label>

        <label className="block text-xs font-semibold text-primary sm:col-span-2">
          পাঠানো টাকার পরিমাণ (৳)

          <input
            type="number"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            value={form.amount}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                amount: event.target.value,
              }))
            }
            placeholder="প্রকৃত পাঠানো টাকা"
            className={inputClass}
            disabled={loading}
          />

          <span className="mt-1.5 block text-[11px] font-normal leading-5 text-muted">
            আপনি যত টাকা পাঠিয়েছেন, ঠিক সেই
            পরিমাণ লিখুন। মোট অর্ডারের চেয়ে
            কম বা বেশি হলেও সঠিক Amount দিন।
          </span>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="btn-brand flex min-h-12 w-full items-center justify-center gap-2 rounded-xl sm:col-span-2"
        >
          {loading ? (
            <Loader2
              size={16}
              className="animate-spin"
            />
          ) : (
            <RefreshCw size={16} />
          )}

          পুনরায় পেমেন্ট তথ্য জমা দিন
        </button>
      </form>
    </section>
  );
}

// ==========================================
// DELIVERY & COURIER DETAILS
// ==========================================

function DeliveryDetails({ order }) {
  const customer =
    order.shipping || order.customer || {};

  const courier = order.courier || {};

  const trackingUrl = getSafeTrackingUrl(
    courier.trackingUrl,
  );

  const trackingNumber = String(
    courier.trackingNumber || "",
  ).trim();

  const courierName = String(
    courier.name || "",
  ).trim();

  const isDispatched = [
    "shipped",
    "delivered",
  ].includes(order.status);

  const inactive = [
    "cancelled",
    "rejected",
  ].includes(order.status);

  const hasCourierDetails = Boolean(
    courierName ||
      trackingNumber ||
      trackingUrl ||
      order.estimatedDelivery,
  );

  return (
    <div className="mt-5 grid gap-4 rounded-xl bg-secondary/5 p-4 sm:grid-cols-2">
      {/* SHIPPING ADDRESS */}

      <div className="flex items-start gap-2">
        <MapPin
          size={17}
          className="mt-0.5 shrink-0 text-secondary"
        />

        <div className="min-w-0">
          <h3 className="text-sm font-bold text-primary">
            ডেলিভারি ঠিকানা
          </h3>

          <p className="mt-2 break-words text-xs leading-6 text-muted">
            {[
              customer.address,
              customer.district,
              customer.division,
            ]
              .filter(Boolean)
              .join(", ") || "ঠিকানা পাওয়া যায়নি"}
          </p>

          <p className="mt-1 text-xs leading-6 text-muted">
            প্রাপক:{" "}
            {customer.recipientName ||
              customer.name ||
              order.customer?.name ||
              "—"}
            {" • "}
            {customer.phone ||
              order.customer?.phone ||
              "—"}
          </p>

          {customer.note && (
            <p className="mt-2 whitespace-pre-wrap break-words text-xs leading-6 text-muted">
              নোট: {customer.note}
            </p>
          )}
        </div>
      </div>

      {/* COURIER SECTION */}

      <div className="flex items-start gap-2">
        <Truck
          size={17}
          className="mt-0.5 shrink-0 text-secondary"
        />

        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-primary">
            ডেলিভারি ও কুরিয়ার
          </h3>

          {/* NOTHING ASSIGNED YET */}

          {!hasCourierDetails && (
            <div className="mt-2 rounded-lg border border-secondary/10 bg-base-100/80 p-3">
              <p className="text-xs leading-6 text-muted">
                {inactive
                  ? "এই অর্ডারের ডেলিভারি কার্যক্রম বন্ধ রয়েছে।"
                  : isDispatched
                    ? "অর্ডার পাঠানো হয়েছে। কুরিয়ারের বিস্তারিত তথ্যের জন্য সাপোর্টে যোগাযোগ করুন।"
                    : "অর্ডার প্রস্তুত ও কুরিয়ার নির্ধারণের পর বিস্তারিত তথ্য এখানে দেখা যাবে।"}
              </p>
            </div>
          )}

          {/* COURIER NAME */}

          {courierName && (
            <p className="mt-2 text-xs leading-6 text-muted">
              কুরিয়ার:{" "}
              <span className="font-semibold text-primary">
                {courierName}
              </span>
            </p>
          )}

          {/* ESTIMATED DELIVERY */}

          {order.estimatedDelivery && (
            <p className="mt-1 text-xs leading-6 text-muted">
              সম্ভাব্য ডেলিভারি:{" "}
              <span className="font-medium text-primary">
                {formatDate(order.estimatedDelivery)}
              </span>
            </p>
          )}

          {/* TRACKING NUMBER */}

          {trackingNumber && (
            <p className="mt-1 break-all text-xs leading-6 text-muted">
              Tracking Number:{" "}
              <span className="font-semibold text-primary">
                {trackingNumber}
              </span>
            </p>
          )}

          {/* ONLY SHOW EXTERNAL TRACKING WHEN URL EXISTS */}

          {trackingUrl && (
            <a
              href={trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex max-w-full items-center gap-2 rounded-lg bg-secondary px-3.5 py-2.5 text-xs font-semibold text-white transition hover:bg-primary"
            >
              <Truck size={15} />
              <span>কুরিয়ারে ট্র্যাক করুন</span>
              <ExternalLink
                size={13}
                className="shrink-0"
              />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// MAIN ORDER STATUS PAGE
// ==========================================

export default function OrderStatusPage({
  mode = "confirmation",
}) {
  const { orderId } = useParams();

  const navigate = useNavigate();
  const location = useLocation();

  const [copied, setCopied] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  const accessToken =
    location.state?.guestAccessToken || "";

  // ========================================
  // AUTH INITIALIZATION
  // ========================================

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      () => setAuthReady(true),
    );

    return unsubscribe;
  }, []);

  // ========================================
  // FETCH ORDER
  // ========================================

  const orderQuery = useQuery({
    queryKey: [
      "sokhbilash-order-details",
      orderId,
      Boolean(accessToken),
    ],

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

      if (!response?.order) {
        throw new Error(
          "Server থেকে অর্ডারের তথ্য পাওয়া যায়নি।",
        );
      }

      return response.order;
    },

    staleTime: 0,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
    retry: 1,
  });

  const order = orderQuery.data;

  // ========================================
  // REDIRECT ACCORDING TO DATABASE STATUS
  // ========================================

  useEffect(() => {
    if (!order || !orderId) return;

    const path = getOrderPath(order);

    const expected =
      `/order-${mode}/${encodeURIComponent(orderId)}`;

    if (path && path !== expected) {
      navigate(path, {
        replace: true,
        state: location.state,
      });
    }
  }, [
    order,
    orderId,
    mode,
    navigate,
    location.state,
  ]);

  // ========================================
  // COPY ORDER NUMBER
  // ========================================

  const copyOrderNumber = async () => {
    if (!order?.orderNumber) return;

    try {
      await navigator.clipboard.writeText(
        order.orderNumber,
      );

      setCopied(true);
    } catch {
      Swal.fire({
        icon: "error",
        title: "কপি করা যায়নি",
        text: "Order Number ম্যানুয়ালি কপি করুন।",
        confirmButtonColor: "#76258A",
      });
    }
  };

  // ========================================
  // LOADING
  // ========================================

  if (!authReady || orderQuery.isLoading) {
    return (
      <main className="page-bg flex min-h-[65vh] items-center justify-center">
        <div className="text-center">
          <Loader2
            size={30}
            className="mx-auto animate-spin text-secondary"
          />

          <p className="mt-3 text-sm text-muted">
            অর্ডারের তথ্য লোড হচ্ছে...
          </p>
        </div>
      </main>
    );
  }

  // ========================================
  // ERROR
  // ========================================

  if (orderQuery.isError || !order) {
    return (
      <main className="page-bg flex min-h-[65vh] items-center justify-center px-4">
        <section className="section-card w-full max-w-md p-6 text-center">
          <AlertTriangle
            size={32}
            className="mx-auto text-amber-600"
          />

          <h1 className="mt-4 text-lg font-bold text-primary">
            অর্ডার পাওয়া যায়নি
          </h1>

          <p className="mt-2 text-sm leading-6 text-muted">
            {orderQuery.error?.message ||
              "অর্ডার দেখতে অনুমতি নেই অথবা Order ID ভুল।"}
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

            <Link
              to="/help#contact"
              className="btn-outline-brand"
            >
              সাপোর্ট
            </Link>
          </div>
        </section>
      </main>
    );
  }

  // ========================================
  // ACTUAL ORDER DATA
  // ========================================

  const payment = order.payment || {};

  const isCod = payment.method === "cod";

  const isCancelled =
    order.status === "cancelled";

  const rejected =
    ["rejected", "cancelled"].includes(order.status) ||
    payment.status === "rejected";

  const verified =
    !rejected &&
    [
      "verified",
      "processing",
      "shipped",
      "delivered",
    ].includes(order.status);

  const isPartial =
    payment.status === "partially_paid";

  const paymentConfirmed =
    payment.status === "verified" ||
    payment.status === "cod_collected";

  const total = positiveAmount(order.total);

  const subtotal = positiveAmount(
    order.subtotal,
  );

  const delivery = positiveAmount(
    order.deliveryCharge,
  );

  const discount = positiveAmount(
    order.discount,
  );

  // Old orders can still have this charge.

  const legacyGiftWrap = positiveAmount(
    order.giftWrapCharge,
  );

  // Customer's reported transfer.

  const claimed = positiveAmount(
    payment.claimedAmount ??
      payment.amount ??
      0,
  );

  // Cumulative actual received amount.
  // Includes verified online + collected cash.

  const verifiedAmount = positiveAmount(
    payment.verifiedAmount,
  );

  const onlineVerified = positiveAmount(
    payment.onlineVerifiedAmount ??
      verifiedAmount -
        positiveAmount(payment.cashCollected),
  );

  const cashCollected = positiveAmount(
    payment.cashCollected,
  );

  const paymentReviewed =
    !isCod &&
    !rejected &&
    (
      paymentConfirmed ||
      isPartial ||
      verifiedAmount > 0
    );

  const isCodConfirmed =
    isCod &&
    order.phoneConfirmed === true;

  const verifiedDue = Math.max(
    0,
    roundAmount(total - verifiedAmount),
  );

  const claimedDue = Math.max(
    0,
    roundAmount(total - claimed),
  );

  const claimedExcess = Math.max(
    0,
    roundAmount(claimed - total),
  );

  const verifiedExcess = Math.max(
    0,
    roundAmount(verifiedAmount - total),
  );

  const displayedDue = rejected
    ? 0
    : isCod
      ? verifiedDue
      : paymentReviewed
        ? verifiedDue
        : claimedDue;

  const dueTitle = rejected
    ? "অর্ডার স্ট্যাটাস"
    : isCod
      ? "ডেলিভারিতে প্রদেয়"
      : paymentReviewed
        ? "যাচাইকৃত বাকি টাকা"
        : "পেমেন্ট যাচাই";

  const dueValue = rejected
    ? "অনুমোদিত নয়"
    : isCod
      ? money(verifiedDue)
      : paymentReviewed
        ? money(verifiedDue)
        : "অপেক্ষমাণ";

  const dueSubtitle = rejected
    ? "যাচাইকৃত টাকা থাকলে Refund Status দেখুন"
    : isCod
      ? payment.status === "cod_collected"
        ? "নগদ পেমেন্ট সম্পন্ন"
        : "ফোনে নিশ্চিতকরণের পর নগদ পরিশোধ"
      : paymentReviewed
        ? "Admin-এর যাচাইকৃত হিসাব"
        : "এখনো Admin যাচাই করেননি";

  // ========================================
  // REJECTION / CANCELLATION REASON
  // ========================================

  const rejectionReason =
    payment.rejectedReason ||
    (isCancelled
      ? "অর্ডারটি বাতিল হয়েছে। বিস্তারিত জানতে সাপোর্ট টিমের সঙ্গে যোগাযোগ করুন।"
      : "পেমেন্ট যাচাই করা যায়নি। সঠিক তথ্য পুনরায় জমা দিতে পারেন।");

  const canResubmit =
    order.status === "rejected" &&
    payment.status === "rejected" &&
    !isCod;

  // ========================================
  // HERO CONTENT
  // ========================================

  const title = rejected
    ? isCancelled
      ? "আপনার অর্ডারটি বাতিল হয়েছে"
      : "আপনার পেমেন্ট যাচাই করা যায়নি"
    : verified
      ? "আপনার অর্ডার নিশ্চিত হয়েছে"
      : isCod
        ? "আপনার অর্ডার জমা হয়েছে!"
        : "আপনার পেমেন্ট তথ্য জমা হয়েছে!";

  const description = rejected
    ? "অর্ডারের বর্তমান স্ট্যাটাস ও প্রয়োজনীয় তথ্য নিচে দেখুন।"
    : verified
      ? "আপনার অর্ডার নিশ্চিত হয়েছে। প্রস্তুতি ও ডেলিভারির অগ্রগতি এখানে দেখতে পারবেন।"
      : isCod
        ? "আমাদের টিম ফোনে যোগাযোগ করে আপনার অর্ডার নিশ্চিত করবে।"
        : isPartial
          ? "কিছু পেমেন্ট যাচাই হয়েছে। বাকি টাকার বিষয়ে আমাদের টিম যোগাযোগ করবে।"
          : "আপনার দেওয়া Transaction Information Admin যাচাই করবেন। কম বা বেশি টাকা পাঠানো হলে ফোনে নিশ্চিত করা হবে।";

  const HeroIcon = rejected
    ? ShieldAlert
    : verified
      ? BadgeCheck
      : Clock3;

  const statusLabel = rejected
    ? isCancelled
      ? "Order Cancelled"
      : "Payment Rejected"
    : verified
      ? isCod
        ? "Order Confirmed"
        : "Order Verified"
      : isCod
        ? "Phone Confirmation Pending"
        : isPartial
          ? "Partially Verified"
          : "Payment Verification Pending";

  // ========================================
  // PAGE UI
  // ========================================

  return (
    <main className="page-bg min-h-screen py-7 sm:py-10">
      <div className="page-container max-w-5xl">
        {/* BREADCRUMB */}

        <nav className="mb-7 flex flex-wrap items-center justify-center gap-2 text-xs text-muted">
          <Link
            to="/"
            className="hover:text-secondary"
          >
            হোম
          </Link>

          <span>›</span>

          <Link
            to="/shop"
            className="hover:text-secondary"
          >
            উপহারসমূহ
          </Link>

          <span>›</span>

          <span className="break-all font-semibold text-secondary">
            {order.orderNumber}
          </span>
        </nav>

        {/* ==================================
            HERO
        ================================== */}

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
            {statusLabel}
          </span>

          <h1 className="mt-4 text-2xl font-bold text-primary sm:text-3xl">
            {title}
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-muted">
            {description}
          </p>
        </section>

        {/* ==================================
            ORDER HEADER & SUMMARY
        ================================== */}

        <section className="section-card mb-5 p-4 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-muted">
                অর্ডার ট্র্যাকিং কোড
              </p>

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
                  {copied ? (
                    <Check size={15} />
                  ) : (
                    <Copy size={15} />
                  )}
                </button>
              </div>

              <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
                <CalendarDays size={13} />
                {formatDate(order.createdAt)}
              </p>
            </div>

            <span className="rounded-full bg-secondary/10 px-3 py-1 text-xs font-semibold capitalize text-secondary">
              {String(
                order.status || "pending",
              ).replace(/_/g, " ")}
            </span>
          </div>

          {/* SUMMARY CARDS */}

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {/* TOTAL */}

            <div className="rounded-xl bg-secondary/5 p-4">
              <p className="text-xs text-muted">
                সর্বমোট অর্ডার মূল্য
              </p>

              <p className="mt-2 text-xl font-bold text-primary">
                {money(total)}
              </p>
            </div>

            {/* CLAIMED PAYMENT */}

            <div className="rounded-xl bg-secondary/5 p-4">
              <p className="text-xs text-muted">
                {isCod
                  ? "পেমেন্ট পদ্ধতি"
                  : "দাবিকৃত পাঠানো টাকা"}
              </p>

              <p className="mt-2 text-xl font-bold text-primary">
                {isCod
                  ? "COD"
                  : money(claimed)}
              </p>

              <p className="mt-1 text-xs leading-5 text-muted">
                {isCod
                  ? "ডেলিভারিতে নগদ পরিশোধ"
                  : "Customer-এর দেওয়া তথ্য"}
              </p>
            </div>

            {/* DUE / PAYMENT STATUS */}

            <div className="rounded-xl bg-gold-soft/20 p-4">
              <p className="text-xs text-primary">
                {dueTitle}
              </p>

              <p className="mt-2 text-xl font-bold text-primary">
                {dueValue}
              </p>

              <p className="mt-1 text-xs leading-5 text-muted">
                {dueSubtitle}
              </p>
            </div>
          </div>

          {/* CLAIMED DIFFERENCE */}

          {!isCod &&
            !rejected &&
            !paymentReviewed &&
            claimed > 0 &&
            claimed !== total && (
              <p className="mt-4 flex items-start gap-2 rounded-lg border border-secondary/10 bg-base-200/60 p-3 text-xs leading-5 text-muted">
                <Info
                  size={15}
                  className="mt-0.5 shrink-0 text-secondary"
                />

                <span>
                  {claimed < total
                    ? `আপনার দেওয়া তথ্য অনুযায়ী সম্ভাব্য বাকি ${money(claimedDue)}। `
                    : `আপনার দেওয়া তথ্য অনুযায়ী অতিরিক্ত ${money(claimedExcess)}। `}

                  চূড়ান্ত হিসাব Admin পেমেন্ট
                  যাচাই করার পর নিশ্চিত করবেন।
                </span>
              </p>
            )}
        </section>

        {/* ==================================
            PAYMENT DIFFERENCE
        ================================== */}

        <PaymentDifferenceNotice
          total={total}
          claimed={claimed}
          verifiedAmount={verifiedAmount}
          isCod={isCod}
          rejected={rejected}
          paymentReviewed={paymentReviewed}
        />

        {/* ==================================
            VERIFIED PAYMENT / REFUND
        ================================== */}

        <PaymentSettlement order={order} />

        {/* ==================================
            REJECTION REASON
        ================================== */}

        {rejected && (
          <section className="mb-5 rounded-2xl border border-red-200 bg-base-100 p-4 sm:p-6">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
                <AlertTriangle size={20} />
              </span>

              <div className="min-w-0 flex-1">
                <h2 className="font-bold text-primary">
                  {isCancelled
                    ? "অর্ডার বাতিলের তথ্য"
                    : "পেমেন্ট যাচাই ব্যর্থ হওয়ার কারণ"}
                </h2>

                <p className="mt-3 whitespace-pre-wrap break-words rounded-xl bg-red-50 p-4 text-sm leading-6 text-red-800">
                  {rejectionReason}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* ==================================
            ORDER PROGRESS
        ================================== */}

        <div className="mb-5">
          <OrderProgress order={order} />
        </div>

        {/* ==================================
            ORDER DETAILS
        ================================== */}

        <section className="section-card mb-5 p-4 sm:p-6">
          <h2 className="mb-5 flex items-center gap-2 font-bold text-primary">
            <ReceiptText
              size={19}
              className="text-secondary"
            />
            অর্ডারের বিশদ বিবরণ
          </h2>

          {/* PRODUCT ITEMS */}

          <OrderProducts items={order.items} />

          {/* FINANCIAL DETAILS */}

          <div className="mt-5 space-y-3 border-t border-base-300 pt-4 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-muted">
                পণ্যের মূল্য
              </span>

              <strong className="text-primary">
                {money(subtotal)}
              </strong>
            </div>

            {discount > 0 && (
              <div className="flex justify-between gap-3">
                <span className="text-secondary">
                  ডিসকাউন্ট
                </span>

                <strong className="text-secondary">
                  -{money(discount)}
                </strong>
              </div>
            )}

            <div className="flex justify-between gap-3">
              <span className="text-muted">
                ডেলিভারি চার্জ
              </span>

              <strong className="text-primary">
                {money(delivery)}
              </strong>
            </div>

            {/* HISTORICAL GIFT WRAPPING */}

            {legacyGiftWrap > 0 && (
              <div className="flex justify-between gap-3">
                <span className="text-muted">
                  আগের অর্ডারের গিফট র‍্যাপিং চার্জ
                </span>

                <strong className="text-primary">
                  {money(legacyGiftWrap)}
                </strong>
              </div>
            )}

            {/* TOTAL */}

            <div className="flex justify-between gap-3 border-t border-base-300 pt-3 font-bold">
              <span className="text-primary">
                সর্বমোট মূল্য
              </span>

              <strong className="text-primary">
                {money(total)}
              </strong>
            </div>

            {/* MOBILE BANKING */}

            {!isCod && (
              <>
                <div className="flex justify-between gap-3">
                  <span className="text-muted">
                    দাবিকৃত পাঠানো টাকা
                  </span>

                  <strong className="text-primary">
                    {money(claimed)}
                  </strong>
                </div>

                <div className="flex justify-between gap-3">
                  <span className="text-muted">
                    যাচাইকৃত মোবাইল ব্যাংকিং
                  </span>

                  <strong className="text-emerald-700">
                    {money(onlineVerified)}
                  </strong>
                </div>

                {cashCollected > 0 && (
                  <div className="flex justify-between gap-3">
                    <span className="text-muted">
                      ডেলিভারিতে নগদ আদায়
                    </span>

                    <strong className="text-primary">
                      {money(cashCollected)}
                    </strong>
                  </div>
                )}

                {verifiedExcess > 0 && (
                  <div className="flex justify-between gap-3">
                    <span className="text-emerald-700">
                      যাচাইকৃত অতিরিক্ত
                    </span>

                    <strong className="text-emerald-700">
                      +{money(verifiedExcess)}
                    </strong>
                  </div>
                )}

                {!paymentReviewed &&
                  !rejected &&
                  claimedExcess > 0 && (
                    <div className="flex justify-between gap-3">
                      <span className="text-muted">
                        দাবিকৃত অতিরিক্ত
                      </span>

                      <strong className="text-secondary">
                        +{money(claimedExcess)}
                      </strong>
                    </div>
                  )}
              </>
            )}

            {/* COD COLLECTED */}

            {isCod && cashCollected > 0 && (
              <div className="flex justify-between gap-3">
                <span className="text-muted">
                  সংগৃহীত নগদ টাকা
                </span>

                <strong className="text-emerald-700">
                  {money(cashCollected)}
                </strong>
              </div>
            )}

            {/* BALANCE */}

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-secondary/10 p-4">
              <div>
                <p className="font-bold text-primary">
                  {rejected
                    ? "অর্ডার বন্ধ"
                    : isCod
                      ? "ডেলিভারিতে প্রদেয়"
                      : paymentReviewed
                        ? "যাচাইকৃত অবশিষ্ট ব্যালেন্স"
                        : "সম্ভাব্য অবশিষ্ট ব্যালেন্স"}
                </p>

                <p className="mt-1 text-xs leading-5 text-muted">
                  {rejected
                    ? "যাচাইকৃত টাকা থাকলে Refund Status দেখুন"
                    : isCod
                      ? "ফোনে নিশ্চিতকরণের পর ডেলিভারিতে পরিশোধ"
                      : paymentReviewed
                        ? "Admin-এর যাচাইকৃত পেমেন্ট অনুযায়ী"
                        : "দাবিকৃত পেমেন্ট অনুযায়ী; চূড়ান্ত নয়"}
                </p>
              </div>

              <strong className="text-xl text-primary">
                {money(displayedDue)}
              </strong>
            </div>

            {legacyGiftWrap > 0 && (
              <p className="text-[11px] leading-5 text-muted">
                এই অর্ডারটিতে পুরোনো Checkout-এর
                Gift Wrapping Charge সংরক্ষিত আছে।
                নতুন অর্ডারে whole-cart Gift
                Wrapping Charge আর প্রযোজ্য নয়।
              </p>
            )}
          </div>

          {/* ==================================
              PAYMENT DETAILS
          ================================== */}

          <div className="mt-5 rounded-xl border border-base-300/70 p-4">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-primary">
              <Wallet
                size={17}
                className="text-secondary"
              />
              পেমেন্টের তথ্য
            </h3>

            <div className="grid gap-4 text-xs sm:grid-cols-2">
              <div>
                <p className="text-muted">
                  Payment Method
                </p>

                <p className="mt-1 font-semibold text-primary">
                  {PAYMENT_NAMES[payment.method] ||
                    payment.method ||
                    "—"}
                </p>
              </div>

              <div>
                <p className="text-muted">
                  Payment Status
                </p>

                <p className="mt-1 font-semibold text-secondary">
                  {getPaymentStatusText(
                    payment.status,
                    isCod,
                    order.phoneConfirmed === true,
                  )}
                </p>
              </div>

              {!isCod && (
                <>
                  <div>
                    <p className="text-muted">
                      Sender Number
                    </p>

                    <p className="mt-1 font-semibold text-primary">
                      {payment.senderPhone || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-muted">
                      Transaction ID
                    </p>

                    <p className="mt-1 break-all font-semibold text-secondary">
                      {payment.trxId || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-muted">
                      দাবিকৃত পাঠানো টাকা
                    </p>

                    <p className="mt-1 font-semibold text-primary">
                      {money(claimed)}
                    </p>
                  </div>

                  <div>
                    <p className="text-muted">
                      যাচাইকৃত মোবাইল ব্যাংকিং
                    </p>

                    <p className="mt-1 font-semibold text-emerald-700">
                      {money(onlineVerified)}
                    </p>
                  </div>
                </>
              )}

              {isCod && (
                <div>
                  <p className="text-muted">
                    Phone Confirmation
                  </p>

                  <p className="mt-1 font-semibold text-primary">
                    {isCodConfirmed
                      ? "Confirmed"
                      : "Pending"}
                  </p>
                </div>
              )}
            </div>

            {!isCod &&
              !paymentReviewed &&
              !rejected && (
                <div className="mt-4 flex items-start gap-2 rounded-lg bg-gold-soft/20 p-3">
                  <Clock3
                    size={16}
                    className="mt-0.5 shrink-0 text-secondary"
                  />

                  <p className="text-[11px] leading-5 text-muted">
                    Payment Amount ও TrxID Admin
                    যাচাই করবেন। যাচাই না হওয়া
                    পর্যন্ত দাবিকৃত পাঠানো টাকা
                    নিশ্চিত Received Payment নয়।
                  </p>
                </div>
              )}
          </div>

          {/* ==================================
              DELIVERY AND TRACKING
          ================================== */}

          <DeliveryDetails order={order} />

          {/* ==================================
              GIFT MESSAGE
          ================================== */}

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

        {/* ==================================
            PAYMENT RESUBMISSION
        ================================== */}

        {canResubmit && (
          <div className="mb-5">
            <ResubmitPayment
              order={order}
              orderId={orderId}
              accessToken={accessToken}
              onSuccess={() =>
                orderQuery.refetch()
              }
            />
          </div>
        )}

        {/* ==================================
            ORDER HISTORY
        ================================== */}

        {Array.isArray(order.history) &&
          order.history.length > 0 && (
            <section className="section-card mb-5 p-4 sm:p-6">
              <h2 className="mb-4 font-bold text-primary">
                অর্ডার হিস্ট্রি
              </h2>

              <div className="space-y-3">
                {[...order.history]
                  .reverse()
                  .map((event, index) => (
                    <div
                      key={`${event.status}-${index}`}
                      className="flex gap-3 border-l-2 border-secondary/20 pl-3"
                    >
                      <span className="mt-1 size-2 shrink-0 rounded-full bg-secondary" />

                      <div className="min-w-0">
                        <p className="text-xs font-bold capitalize text-primary">
                          {String(
                            event.status || "update",
                          ).replace(/_/g, " ")}
                        </p>

                        <p className="mt-1 text-[11px] text-muted">
                          {formatDate(
                            event.date ||
                              event.createdAt ||
                              event.timestamp,
                          )}
                        </p>

                        {event.note && (
                          <p className="mt-1 whitespace-pre-wrap break-words text-xs leading-5 text-muted">
                            {event.note}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </section>
          )}

        {/* ==================================
            ACTION BUTTONS
        ================================== */}

        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Link
            to={`/track-order/${encodeURIComponent(orderId)}`}
            className="btn-brand flex min-h-12 w-full items-center justify-center gap-2 rounded-xl text-center text-sm"
          >
            <PackageCheck size={16} />
            অর্ডারের আপডেট দেখুন
            <ArrowRight size={16} />
          </Link>

          <Link
            to="/shop"
            className="btn-outline-brand flex min-h-12 w-full items-center justify-center gap-2 rounded-xl text-center text-sm"
          >
            <ShoppingBag size={16} />
            আরও উপহার দেখুন
          </Link>
        </div>

        {/* ==================================
            SUPPORT
        ================================== */}

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
                Order Number উল্লেখ করে সাপোর্ট
                টিমের সঙ্গে যোগাযোগ করুন।
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
