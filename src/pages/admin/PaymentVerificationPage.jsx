import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";

import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Copy,
  Eye,
  ImageOff,
  Loader2,
  MessageCircle,
  Phone,
  ReceiptText,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  UserRound,
  Wallet,
  X,
  XCircle,
} from "lucide-react";

import { API_URL } from "../../utils/siteConfig";
import { AuthContext } from "../../providers/AuthProvider";

// ==========================================
// CONFIGURATION
// ==========================================

const PAGE_SIZE = 10;

const METHOD_NAMES = {
  bkash: "bKash",
  nagad: "Nagad",
  rocket: "Rocket",
  cod: "Cash on Delivery",
};

const STATUS_META = {
  pending: {
    label: "যাচাই বাকি",
    color: "border-amber-200 bg-amber-50 text-amber-700",
  },
  partially_paid: {
    label: "আংশিক পরিশোধিত",
    color: "border-blue-200 bg-blue-50 text-blue-700",
  },
  verified: {
    label: "ভেরিফাইড",
    color: "border-green-200 bg-green-50 text-green-700",
  },
  rejected: {
    label: "রিজেক্টেড",
    color: "border-red-200 bg-red-50 text-red-700",
  },
};

const ORDER_NAMES = {
  pending: "পেন্ডিং",
  verified: "যাচাইকৃত",
  processing: "প্রসেসিং",
  shipped: "শিপড",
  delivered: "ডেলিভার্ড",
  rejected: "রিজেক্টেড",
  cancelled: "বাতিল",
};

// ==========================================
// AMOUNT HELPERS
// ==========================================

const toCents = (value) => Math.round((Number(value) || 0) * 100);

const fromCents = (value) => Math.round(value) / 100;

const bn = (value) => Number(value || 0).toLocaleString("bn-BD");

const money = (value) =>
  `৳${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

const stopped = (order) => ["cancelled", "rejected"].includes(order?.status);

const dueOf = (order) =>
  Math.max(0, toCents(order?.total) - toCents(order?.payment?.verifiedAmount)) /
  100;

const excessOf = (order) =>
  Math.max(0, toCents(order?.payment?.verifiedAmount) - toCents(order?.total)) /
  100;

const refundDueOf = (order) =>
  Math.max(
    0,
    toCents(order?.payment?.verifiedAmount) -
      toCents(order?.payment?.refundedAmount),
  ) / 100;

// ==========================================
// GENERAL HELPERS
// ==========================================

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("bn-BD", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function phoneForWhatsApp(raw) {
  const digits = String(raw || "").replace(/\D/g, "");

  if (/^01[3-9]\d{8}$/.test(digits)) {
    return `88${digits}`;
  }

  if (/^8801[3-9]\d{8}$/.test(digits)) {
    return digits;
  }

  return "";
}

function whatsappLink(order) {
  const phone = phoneForWhatsApp(
    order.customer?.phone || order.shipping?.phone,
  );

  if (!phone) return "";

  const note = `SokhBilash থেকে যোগাযোগ করছি। আপনার অর্ডার ${order.orderNumber} এর পেমেন্ট সম্পর্কে কিছু তথ্য নিশ্চিত করতে চাই।`;

  return `https://wa.me/${phone}?text=` + encodeURIComponent(note);
}

// ==========================================
// AUTHENTICATED ADMIN API
// ==========================================

async function adminRequest(user, path, { method = "GET", body, signal } = {}) {
  if (!user) {
    throw new Error("Admin login required");
  }

  const token = await user.getIdToken();

  const response = await fetch(`${API_URL}${path}`, {
    method,
    cache: "no-store",
    signal,

    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,

      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
    },

    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.success !== true) {
    throw new Error(data.message || `Request failed (${response.status})`);
  }

  return data;
}

// ==========================================
// STATUS BADGE
// ==========================================

function StatusBadge({ status }) {
  const meta = STATUS_META[status];

  const Icon =
    status === "verified"
      ? CheckCircle2
      : status === "rejected"
        ? XCircle
        : Clock3;

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-bold ${
        meta?.color || "border-base-300 bg-base-200 text-muted"
      }`}
    >
      <Icon size={12} />

      {meta?.label || status || "অজানা"}
    </span>
  );
}

// ==========================================
// PAYMENT METHOD BADGE
// ==========================================

function MethodBadge({ method }) {
  const colors = {
    bkash: "bg-pink-50 text-pink-700",
    nagad: "bg-orange-50 text-orange-700",
    rocket: "bg-purple-50 text-purple-700",
  };

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
        colors[method] || "bg-base-200 text-primary"
      }`}
    >
      {METHOD_NAMES[method] || method || "—"}
    </span>
  );
}

// ==========================================
// STATISTICS CARD
// ==========================================

function StatCard({ title, subtitle, value, icon: Icon, iconStyle }) {
  return (
    <div className="rounded-xl border border-base-300/70 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-xs font-bold text-primary sm:text-sm">{title}</h3>

          <p className="mt-1 text-[11px] text-muted">{subtitle}</p>
        </div>

        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${iconStyle}`}
        >
          <Icon size={20} />
        </div>
      </div>

      <p className="mt-4 break-words text-2xl font-bold text-primary sm:text-3xl">
        {value}
      </p>
    </div>
  );
}

// ==========================================
// PRODUCT THUMBNAIL
// ==========================================

function ProductThumb({ product, big = false }) {
  const [broken, setBroken] = useState("");

  const url = product?.image || "";

  return (
    <div
      className={`flex ${
        big ? "size-12" : "size-10"
      } shrink-0 items-center justify-center overflow-hidden rounded-lg border border-base-300 bg-base-200`}
    >
      {url && broken !== url ? (
        <img
          src={url}
          alt={product?.name || "Product"}
          loading="lazy"
          onError={() => setBroken(url)}
          className="size-full object-cover"
        />
      ) : (
        <ImageOff size={big ? 18 : 15} className="text-muted" />
      )}
    </div>
  );
}

// ==========================================
// CUSTOMER AVATAR
// ==========================================

function CustomerAvatar({ name, photoUrl }) {
  const [broken, setBroken] = useState("");

  return (
    <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-secondary/15 bg-secondary/10 text-secondary">
      {photoUrl && broken !== photoUrl ? (
        <img
          src={photoUrl}
          alt={name || "Customer"}
          loading="lazy"
          onError={() => setBroken(photoUrl)}
          className="size-full object-cover"
        />
      ) : (
        <UserRound size={19} />
      )}
    </div>
  );
}

// ==========================================
// PAYMENT PRODUCT PREVIEW
// ==========================================

function PaymentProductPreview({ order }) {
  const products = Array.isArray(order.items) ? order.items.slice(0, 2) : [];

  const quantity =
    order.itemCount ??
    (order.items || []).reduce(
      (n, item) => n + (Number(item.quantity) || 0),
      0,
    );

  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <div className="flex shrink-0 items-center">
        {products.map((product, i) => (
          <div
            key={product.cartId || `${product.name}-${i}`}
            className={`rounded-lg border-2 border-white ${i ? "-ml-2" : ""}`}
          >
            <ProductThumb product={product} />
          </div>
        ))}

        {!products.length && (
          <div className="flex size-10 items-center justify-center rounded-lg bg-base-200 text-secondary">
            <ShoppingBag size={17} />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p
          title={products[0]?.name || ""}
          className="w-[145px] truncate text-xs font-semibold text-primary"
        >
          {products[0]?.name || "অর্ডারের পণ্য"}
        </p>

        <p className="mt-1 text-[11px] text-muted">মোট {bn(quantity)} পিস</p>
      </div>
    </div>
  );
}

// ==========================================
// INFO ROW
// ==========================================

function InfoRow({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-base-200 py-2.5 last:border-0">
      <span className="shrink-0 text-xs text-muted">{label}</span>

      <div className="min-w-0 max-w-[65%] break-words text-right text-xs font-semibold text-primary">
        {children ?? "—"}
      </div>
    </div>
  );
}

// ==========================================
// PAYMENT REVIEW MODAL
//
// IMPORTANT:
// verifiedAmount = CUMULATIVE RECEIVED
//
// Current Proof amount can be lower/higher
// than claimedAmount or order total.
// ==========================================

function PaymentReviewModal({
  order,
  saving,
  actionError,
  onClose,
  onDecision,
}) {
  const payment = order.payment || {};

  const previous = toCents(payment.verifiedAmount);
  const total = toCents(order.total);
  const claimed = toCents(payment.claimedAmount);

  const pending = payment.status === "pending" && order.status === "pending";

  const due = Math.max(0, total - previous);
  const excess = excessOf(order);

  // Current proof's ACTUAL amount
  const [received, setReceived] = useState(() =>
    String(fromCents(Math.max(0, claimed))),
  );

  const [ack, setAck] = useState(false);
  const [extraAck, setExtraAck] = useState(false);
  const [mode, setMode] = useState("review");
  const [reason, setReason] = useState("");
  const [copied, setCopied] = useState(false);

  // ========================================
  // AMOUNT VALIDATION
  // ========================================

  const input = received.trim();

  const validAmount =
    /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(input) &&
    Number.isSafeInteger(Math.round(Number(input) * 100)) &&
    Number(input) > 0;

  const now = validAmount ? toCents(input) : 0;

  const afterReceived = previous + now;

  const afterDue = Math.max(0, total - afterReceived);

  const afterExcess = Math.max(0, afterReceived - total);

  // Extra verification for mismatch/overpay
  const mismatch = validAmount && now !== claimed;

  const special = validAmount && (afterExcess > 0 || mismatch);

  const validReview =
    pending && validAmount && ack && (!special || extraAck) && !saving;

  const phone = order.customer?.phone || order.shipping?.phone || "";

  const whatsapp = whatsappLink(order);

  // ========================================
  // COPY TRANSACTION
  // ========================================

  async function copyTransaction() {
    try {
      await navigator.clipboard.writeText(payment.trxId || "");

      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  // ========================================
  // VERIFY PAYMENT
  // ========================================

  function verify() {
    if (!validReview) return;

    // Backend expects cumulative total,
    // NOT this proof's individual amount.

    onDecision({
      orderId: order._id,
      decision: "verify",
      verifiedAmount: fromCents(afterReceived),
      previousReceived: fromCents(previous),
      trxId: payment.trxId,
    });
  }

  // ========================================
  // REJECT PAYMENT
  // ========================================

  function reject() {
    if (!pending || !reason.trim() || saving) {
      return;
    }

    onDecision({
      orderId: order._id,
      decision: "reject",
      reason: reason.trim(),
      previousReceived: fromCents(previous),
      trxId: payment.trxId,
    });
  }

  // ========================================
  // MODAL UI
  // ========================================

  return (
    <div
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !saving) {
          onClose();
        }
      }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-primary/60 p-3 backdrop-blur-sm"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-review-title"
        className="flex max-h-[95vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        {/* MODAL HEADER */}

        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-base-300 px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="text-[10px] font-bold tracking-wider text-secondary">
              PAYMENT VERIFICATION
            </p>

            <h2
              id="payment-review-title"
              className="mt-1 break-all text-base font-bold text-primary sm:text-xl"
            >
              {order.orderNumber}
            </h2>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusBadge status={payment.status} />

              <span className="rounded-full bg-base-200 px-2.5 py-1 text-[10px] font-semibold text-muted">
                {order.guest ? "Guest Order" : "Registered Customer"}
              </span>
            </div>
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            aria-label="Close review"
            className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-base-200 text-primary disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* SCROLLABLE CONTENT */}

        <div className="space-y-4 overflow-y-auto p-4 sm:p-6">
          {/* SECURITY NOTICE */}

          {pending && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <ShieldAlert size={20} className="shrink-0 text-amber-700" />

              <div>
                <p className="text-xs font-bold text-amber-900">
                  প্রকৃত পেমেন্ট যাচাই করুন
                </p>

                <p className="mt-1 text-xs leading-6 text-amber-800">
                  TrxID, Sender ও Amount bKash/Nagad/Rocket receiving account-এ
                  মিলিয়ে নিন। Customer-এর claim কম/বেশি হলেও বাস্তবে পাওয়া
                  Amount-ই লিখবেন।
                </p>
              </div>
            </div>
          )}

          {/* CUSTOMER + TRANSACTION */}

          <div className="grid gap-4 md:grid-cols-2">
            {/* CUSTOMER INFO */}

            <div className="rounded-xl border border-base-300 p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-primary">
                <UserRound size={17} className="text-secondary" />
                কাস্টমার তথ্য
              </h3>

              <InfoRow label="ধরন">
                {order.guest ? "Guest" : "Registered Customer"}
              </InfoRow>

              <InfoRow label="নাম">{order.customer?.name || "—"}</InfoRow>

              <InfoRow label="ফোন">{phone || "—"}</InfoRow>

              <InfoRow label="ইমেইল">{order.customer?.email || "—"}</InfoRow>

              <InfoRow label="জেলা">
                {order.shipping?.district || order.customer?.district || "—"}
              </InfoRow>

              <InfoRow label="Order Status">
                {ORDER_NAMES[order.status] || order.status}
              </InfoRow>

              {/* CONTACT ACTIONS */}

              <div className="mt-4 flex flex-wrap gap-2">
                {phone && (
                  <a
                    href={`tel:${phone}`}
                    className="inline-flex items-center gap-2 rounded-lg bg-secondary/10 px-3 py-2 text-xs font-bold text-secondary"
                  >
                    <Phone size={14} />
                    Call
                  </a>
                )}

                {whatsapp && (
                  <a
                    href={whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-3 py-2 text-xs font-bold text-white"
                  >
                    <MessageCircle size={14} />
                    WhatsApp
                  </a>
                )}
              </div>
            </div>

            {/* TRANSACTION INFO */}

            <div className="rounded-xl border border-base-300 p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-primary">
                <ReceiptText size={17} className="text-secondary" />
                Transaction Details
              </h3>

              <InfoRow label="Method">
                <MethodBadge method={payment.method} />
              </InfoRow>

              <InfoRow label="Sender Number">
                {payment.senderPhone || "—"}
              </InfoRow>

              <InfoRow label="Customer Claimed">
                {money(payment.claimedAmount)}
              </InfoRow>

              <InfoRow label="Order Date">
                {formatDate(order.createdAt)}
              </InfoRow>

              {/* TrxID */}

              <div className="mt-3 rounded-xl bg-base-200 p-3">
                <p className="text-[11px] text-muted">Transaction ID (TrxID)</p>

                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="min-w-0 break-all font-mono text-sm font-bold text-primary">
                    {payment.trxId || "—"}
                  </span>

                  <button
                    type="button"
                    onClick={copyTransaction}
                    aria-label="Copy TrxID"
                    className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white text-secondary"
                  >
                    {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>

              {payment.note && (
                <p className="mt-3 rounded-lg bg-secondary/5 p-3 text-xs leading-5 text-muted">
                  <strong>Customer Note: </strong>
                  {payment.note}
                </p>
              )}
            </div>
          </div>

          {/* ==================================
              FINANCIAL BREAKDOWN
          ================================== */}

          <div className="rounded-xl border border-base-300 p-4">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-primary">
              <Wallet size={17} className="text-secondary" />
              Payment Reconciliation
            </h3>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl bg-base-200 p-3">
                <p className="text-[11px] text-muted">Order Total</p>

                <p className="mt-2 text-lg font-bold text-primary">
                  {money(order.total)}
                </p>
              </div>

              <div className="rounded-xl bg-green-50 p-3">
                <p className="text-[11px] text-green-700">Already Received</p>

                <p className="mt-2 text-lg font-bold text-green-800">
                  {money(fromCents(previous))}
                </p>
              </div>

              <div className="rounded-xl bg-amber-50 p-3">
                <p className="text-[11px] text-amber-700">
                  {stopped(order) ? "Order Closed" : "Current Due"}
                </p>

                <p className="mt-2 text-lg font-bold text-amber-800">
                  {stopped(order) ? "—" : money(fromCents(due))}
                </p>
              </div>

              <div className="rounded-xl bg-secondary/10 p-3">
                <p className="text-[11px] text-secondary">Claimed for Proof</p>

                <p className="mt-2 text-lg font-bold text-primary">
                  {money(payment.claimedAmount)}
                </p>
              </div>
            </div>

            {/* MOBILE + CASH BREAKDOWN */}

            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-muted">
              <span>
                Online Verified:{" "}
                <strong className="text-primary">
                  {money(
                    payment.onlineVerifiedAmount ??
                      fromCents(previous - toCents(payment.cashCollected)),
                  )}
                </strong>
              </span>

              <span>
                Cash Collected:{" "}
                <strong className="text-primary">
                  {money(payment.cashCollected)}
                </strong>
              </span>

              <span>
                Refunded:{" "}
                <strong className="text-primary">
                  {money(payment.refundedAmount)}
                </strong>
              </span>
            </div>
          </div>

          {/* ==================================
              ORDER PRODUCTS
          ================================== */}

          <div className="rounded-xl border border-base-300 p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-primary">
              <ShoppingBag size={17} className="text-secondary" />
              অর্ডারের প্রোডাক্টসমূহ ({order.items?.length || 0})
            </h3>

            <div className="space-y-3">
              {(order.items || []).map((item, i) => (
                <div
                  key={item.cartId || i}
                  className="flex items-center gap-3 rounded-xl bg-base-200/60 p-3"
                >
                  <ProductThumb product={item} big />

                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-xs font-bold text-primary">
                      {item.name || "Product"}
                    </p>

                    <p className="mt-1 text-[11px] text-muted">
                      {item.variantTitle || item.sku || "Regular"}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-xs font-bold text-primary">
                      {money(
                        item.lineTotal ??
                          Number(item.unitPrice) * Number(item.quantity),
                      )}
                    </p>

                    <p className="mt-1 text-[10px] text-muted">
                      Qty: {bn(item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ==================================
              PREVIOUS PAYMENT STATUS
          ================================== */}

          {payment.status === "verified" && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-4">
              <p className="flex items-center gap-2 text-xs font-bold text-green-800">
                <CheckCircle2 size={17} />
                Payment Verified
              </p>

              <p className="mt-2 text-xs leading-5 text-green-700">
                Online:{" "}
                {money(
                  payment.onlineVerifiedAmount ??
                    fromCents(previous - toCents(payment.cashCollected)),
                )}
                {" · "}
                Total received: {money(payment.verifiedAmount)}
                {" · "}
                {formatDate(payment.verifiedAt)}
              </p>
            </div>
          )}

          {payment.status === "rejected" && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="flex items-center gap-2 text-xs font-bold text-red-800">
                <XCircle size={17} />
                Payment Rejected
              </p>

              <p className="mt-2 text-xs leading-5 text-red-700">
                {payment.rejectedReason || "No rejection reason available"}
              </p>

              {stopped(order) && refundDueOf(order) > 0 && (
                <p className="mt-2 text-xs font-semibold text-red-700">
                  Refund due: {money(refundDueOf(order))}
                  {" — "}
                  Order Details থেকে পরিচালনা করুন।
                </p>
              )}
            </div>
          )}

          {payment.status === "partially_paid" && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
              <p className="text-xs font-bold text-blue-800">
                Partial Payment Verified
              </p>

              <p className="mt-2 text-xs leading-6 text-blue-700">
                মোট পাওয়া: {money(payment.verifiedAmount)}
                {" · "}
                বাকি: {money(dueOf(order))}। এই proof ইতোমধ্যে reviewed; Backend
                অনুযায়ী বাকি টাকা delivery cash হিসেবে Order Details থেকে Record
                করতে হবে।
              </p>
            </div>
          )}

          {/* ==================================
              OVERPAYMENT NOTICE
          ================================== */}

          {excess > 0 && !stopped(order) && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs font-bold text-emerald-900">
                Overpayment: {money(excess)}
              </p>

              <p className="mt-1 text-xs leading-6 text-emerald-800">
                {payment.excessResolution?.status === "completed"
                  ? "Refund / Extra Product settlement সম্পন্ন হয়েছে।"
                  : "Phone Confirmation-এ Customer-এর সম্মতি নিয়ে Refund / Extra Product settlement করতে হবে।"}
              </p>

              <Link
                to={`/admin/orders/${encodeURIComponent(order._id)}`}
                onClick={onClose}
                className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-emerald-800"
              >
                Open Order
                <ArrowRight size={13} />
              </Link>
            </div>
          )}

          {/* ==================================
              VERIFICATION CONTROLS
          ================================== */}

          {pending ? (
            <div className="rounded-xl border border-secondary/20 bg-[#faf7fb] p-4">
              <h3 className="flex items-center gap-2 text-sm font-bold text-primary">
                <ShieldCheck size={18} className="text-secondary" />
                Admin Verification Decision
              </h3>

              {mode === "review" ? (
                <div className="mt-4 space-y-4">
                  {/* ACTUAL AMOUNT INPUT */}

                  <label className="block text-xs font-bold text-primary">
                    এই TrxID-তে বাস্তবে নতুন Received Amount (৳)
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={received}
                      disabled={saving}
                      onChange={(e) => {
                        setReceived(e.target.value);
                        setAck(false);
                        setExtraAck(false);
                      }}
                      className="input mt-2 w-full rounded-xl border-base-300 bg-white text-sm focus:border-secondary focus:outline-none"
                    />
                  </label>

                  <p className="text-[11px] leading-5 text-muted">
                    Customer claimed {money(payment.claimedAmount)}; কিন্তু
                    verified amount claim বা Order Total-এর মধ্যে সীমাবদ্ধ
                    নয়—বাস্তবে যা এসেছে সেটাই লিখুন।
                  </p>

                  {/* LIVE CALCULATION */}

                  {validAmount ? (
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      <div className="rounded-xl bg-white p-3">
                        <p className="text-[11px] text-muted">This Proof</p>

                        <p className="mt-1 font-bold text-primary">
                          {money(fromCents(now))}
                        </p>
                      </div>

                      <div className="rounded-xl bg-white p-3">
                        <p className="text-[11px] text-muted">
                          Cumulative Received
                        </p>

                        <p className="mt-1 font-bold text-primary">
                          {money(fromCents(afterReceived))}
                        </p>
                      </div>

                      <div className="rounded-xl bg-gold-soft/30 p-3">
                        <p className="text-[11px] text-muted">
                          After Verification
                        </p>

                        <p className="mt-1 font-bold text-primary">
                          {afterExcess > 0
                            ? `Excess ${money(fromCents(afterExcess))}`
                            : `Due ${money(fromCents(afterDue))}`}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p
                      role="alert"
                      className="rounded-lg bg-red-50 p-3 text-xs text-red-700"
                    >
                      সঠিক Amount লিখুন (সর্বোচ্চ ২ ঘর দশমিক; ০-এর বেশি)।
                    </p>
                  )}

                  {/* CLAIM MISMATCH WARNING */}

                  {mismatch && (
                    <p className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
                      <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                      Customer claimed {money(payment.claimedAmount)}, কিন্তু
                      আপনি {money(fromCents(now))} Verify করছেন। Receiving
                      Account-এর actual amount নিশ্চিত করুন।
                    </p>
                  )}

                  {/* OVERPAYMENT WARNING */}

                  {afterExcess > 0 && (
                    <p className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs leading-5 text-emerald-900">
                      <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                      Extra {money(fromCents(afterExcess))} পাওয়া গেলে Verify
                      করার পর Customer-কে call করে Refund অথবা সমমূল্যের Extra
                      Product বিষয়ে agreement নিতে হবে।
                    </p>
                  )}

                  {/* VERIFICATION CONFIRMATION */}

                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-base-300 bg-white p-3">
                    <input
                      type="checkbox"
                      checked={ack}
                      disabled={saving}
                      onChange={(e) => setAck(e.target.checked)}
                      className="checkbox checkbox-secondary checkbox-sm mt-0.5"
                    />

                    <span className="text-xs leading-6 text-primary">
                      Receiving Account-এ TrxID, Sender ও প্রকৃত Received Amount
                      যাচাই করেছি।
                    </span>
                  </label>

                  {/* ADDITIONAL MISMATCH CONFIRMATION */}

                  {special && (
                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
                      <input
                        type="checkbox"
                        checked={extraAck}
                        disabled={saving}
                        onChange={(e) => setExtraAck(e.target.checked)}
                        className="checkbox checkbox-secondary checkbox-sm mt-0.5"
                      />

                      <span className="text-xs leading-6 text-amber-900">
                        Claim-এর সঙ্গে পার্থক্য / Overpayment বুঝেছি। এই Amount
                        সত্যিই Receiving Account-এ এসেছে।
                      </span>
                    </label>
                  )}

                  {/* ACTION BUTTONS */}

                  <div className="grid gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={verify}
                      disabled={!validReview}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-700 px-4 py-3 text-xs font-bold text-white hover:bg-green-800 disabled:opacity-40"
                    >
                      {saving ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <CheckCircle2 size={16} />
                      )}
                      Verify Actual Amount
                    </button>

                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => setMode("reject")}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-50"
                    >
                      <XCircle size={16} />
                      Reject Payment
                    </button>
                  </div>
                </div>
              ) : (
                /* REJECTION FORM */

                <div className="mt-4 space-y-3">
                  <label className="block text-xs font-bold text-primary">
                    Rejection Reason
                    <textarea
                      rows={3}
                      maxLength={500}
                      value={reason}
                      disabled={saving}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="TrxID not found, wrong sender, invalid transaction..."
                      className="textarea mt-2 w-full rounded-xl border-base-300 bg-white text-xs focus:border-secondary focus:outline-none"
                    />
                  </label>

                  {previous > 0 && (
                    <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
                      Previously received {money(fromCents(previous))} must be
                      refunded if this Order is rejected. Record actual refund
                      in Order Details.
                    </p>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setMode("review")}
                      disabled={saving}
                      className="rounded-xl border border-base-300 bg-white px-4 py-3 text-xs font-bold text-primary"
                    >
                      Back
                    </button>

                    <button
                      type="button"
                      disabled={!reason.trim() || saving}
                      onClick={reject}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-700 px-4 py-3 text-xs font-bold text-white disabled:opacity-40"
                    >
                      {saving ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <XCircle size={16} />
                      )}
                      Confirm Rejection
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="rounded-xl bg-secondary/5 p-4 text-xs leading-6 text-muted">
              এই TrxID আর Pending Verification অবস্থায় নেই। নতুন করে একই proof
              Verify/Reject করা যাবে না। Phone Confirmation, বকেয়া আদায় বা
              Refund-এর জন্য Order Details ব্যবহার করুন।
            </p>
          )}

          {/* ACTION ERROR */}

          {actionError && (
            <p
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700"
            >
              {actionError}
            </p>
          )}

          {/* ==================================
              PAYMENT REVIEW HISTORY
          ================================== */}

          {Array.isArray(payment.reviews) && payment.reviews.length > 0 && (
            <div className="rounded-xl border border-base-300 p-4">
              <h3 className="mb-3 text-sm font-bold text-primary">
                Payment Review History
              </h3>

              <div className="space-y-2">
                {payment.reviews
                  .slice(-4)
                  .reverse()
                  .map((r, i) => (
                    <div
                      key={`${r.trxId || i}-${i}`}
                      className="rounded-lg bg-base-200/60 p-3 text-xs"
                    >
                      <p className="font-bold text-primary">
                        {r.decision === "verify" ? "Verified" : "Rejected"}
                        {" · "}
                        {r.trxId || "—"}
                      </p>

                      <p className="mt-1 text-muted">
                        {r.decision === "verify"
                          ? `For proof: ${money(
                              r.receivedForProof,
                            )} · Cumulative: ${money(r.cumulativeReceived)}`
                          : r.reason || "—"}
                      </p>

                      <p className="mt-1 text-[11px] text-muted">
                        {formatDate(r.at)}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* ==================================
              RECENT ORDER HISTORY
          ================================== */}

          {Array.isArray(order.history) && order.history.length > 0 && (
            <div className="rounded-xl border border-base-300 p-4">
              <h3 className="mb-3 text-sm font-bold text-primary">
                Recent Order History
              </h3>

              <div className="space-y-3">
                {order.history
                  .slice(-5)
                  .reverse()
                  .map((h, i) => (
                    <div
                      key={`${h.status || "event"}-${i}`}
                      className="border-l-2 border-secondary/30 pl-3"
                    >
                      <p className="text-xs font-semibold text-primary">
                        {String(h.status || "update").replace(/_/g, " ")}
                      </p>

                      <p className="mt-1 whitespace-pre-wrap break-words text-[11px] text-muted">
                        {h.note || ""}
                      </p>

                      <p className="mt-1 text-[10px] text-muted">
                        {formatDate(h.date)}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}

        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-base-300 px-4 py-4 sm:px-6">
          <Link
            to={`/admin/orders/${encodeURIComponent(order._id)}`}
            onClick={onClose}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-secondary hover:underline"
          >
            View Full Order
            <ArrowRight size={14} />
          </Link>

          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white disabled:opacity-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// DESKTOP PAYMENT ROW
// ==========================================

function PaymentRow({ order, index, onReview }) {
  const payment = order.payment || {};

  const pending = payment.status === "pending" && order.status === "pending";

  const name = order.customer?.name || "Unknown Customer";

  const phone = order.customer?.phone || "—";

  const detailUrl = `/admin/orders/${encodeURIComponent(order._id)}`;

  const online =
    payment.onlineVerifiedAmount ??
    Math.max(
      0,
      fromCents(
        toCents(payment.verifiedAmount) - toCents(payment.cashCollected),
      ),
    );

  const closedRefund = stopped(order) ? refundDueOf(order) : 0;

  const excess = !stopped(order) ? excessOf(order) : 0;

  return (
    <tr
      className={`transition-colors hover:bg-secondary/5 ${
        index % 2 ? "bg-[#faf7fb]" : "bg-white"
      }`}
    >
      {/* ORDER */}

      <td className="px-5 py-2.5 align-middle">
        <p
          title={order.orderNumber}
          className="max-w-[190px] truncate text-xs font-bold text-primary"
        >
          #{order.orderNumber}
        </p>

        <p className="mt-1 flex items-center gap-1.5 whitespace-nowrap text-[11px] text-muted">
          <CalendarDays size={13} />
          {formatDate(order.createdAt)}
        </p>
      </td>

      {/* CUSTOMER */}

      <td className="px-5 py-2.5 align-middle">
        <div className="flex min-w-[175px] items-center gap-2.5">
          <CustomerAvatar
            name={name}
            photoUrl={order.guest ? "" : order.customerPhotoUrl}
          />

          <div className="min-w-0">
            <p
              title={name}
              className="max-w-[145px] truncate text-sm font-semibold text-primary"
            >
              {name}
            </p>

            <p className="text-[11px] text-muted">{phone}</p>

            <p className="text-[11px] text-secondary">
              {order.guest ? "Guest Customer" : "Registered Customer"}
            </p>
          </div>
        </div>
      </td>

      {/* PRODUCTS */}

      <td className="px-5 py-2.5 align-middle">
        <PaymentProductPreview order={order} />
      </td>

      {/* PAYMENT METHOD */}

      <td className="px-5 py-2.5 align-middle">
        <MethodBadge method={payment.method} />
      </td>

      {/* TRANSACTION */}

      <td className="px-5 py-2.5 align-middle">
        <p
          title={payment.trxId}
          className="max-w-[130px] truncate font-mono text-xs font-semibold text-primary"
        >
          {payment.trxId || "—"}
        </p>

        <p className="mt-1 text-[11px] text-muted">
          {payment.senderPhone || "—"}
        </p>
      </td>

      {/* FINANCIAL SUMMARY */}

      <td className="px-5 py-2.5 align-middle">
        <p className="whitespace-nowrap text-sm font-bold text-primary">
          Claim: {money(payment.claimedAmount)}
        </p>

        <p className="mt-1 whitespace-nowrap text-[11px] text-muted">
          Order: {money(order.total)}
        </p>

        <p className="mt-0.5 whitespace-nowrap text-[11px] font-medium text-green-700">
          Online: {money(online)}
        </p>

        {Number(payment.cashCollected) > 0 && (
          <p className="mt-0.5 text-[11px] text-muted">
            Cash: {money(payment.cashCollected)}
          </p>
        )}

        {closedRefund > 0 ? (
          <p className="mt-0.5 text-[11px] font-semibold text-red-700">
            Refund due: {money(closedRefund)}
          </p>
        ) : excess > 0 ? (
          <p className="mt-0.5 text-[11px] font-semibold text-amber-700">
            {payment.excessResolution?.status === "completed"
              ? "Excess settled"
              : "Excess pending"}
            : {money(excess)}
          </p>
        ) : (
          !stopped(order) && (
            <p className="mt-0.5 text-[11px] text-amber-700">
              Due: {money(dueOf(order))}
            </p>
          )
        )}
      </td>

      {/* STATUS */}

      <td className="px-5 py-2.5 align-middle">
        <StatusBadge status={payment.status} />
      </td>

      {/* ACTIONS */}

      <td className="px-5 py-2.5 text-right align-middle">
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => onReview(order._id)}
            className={`inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold ${
              pending
                ? "bg-primary text-white hover:bg-secondary"
                : "bg-secondary/10 text-secondary hover:bg-secondary/20"
            }`}
          >
            {pending ? <ShieldCheck size={15} /> : <Eye size={15} />}

            {pending ? "Review" : "Details"}
          </button>

          <Link
            to={detailUrl}
            className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-base-300 bg-white px-3 py-2 text-xs font-semibold text-primary hover:text-secondary"
          >
            <ShoppingBag size={15} />
            Order
          </Link>
        </div>
      </td>
    </tr>
  );
}

// ==========================================
// MOBILE PAYMENT CARD
// ==========================================

function MobilePaymentCard({ order, onReview }) {
  const payment = order.payment || {};

  const pending = payment.status === "pending" && order.status === "pending";

  const first = order.items?.[0];

  const online =
    payment.onlineVerifiedAmount ??
    Math.max(
      0,
      fromCents(
        toCents(payment.verifiedAmount) - toCents(payment.cashCollected),
      ),
    );

  return (
    <article className="overflow-hidden rounded-xl border border-base-300 bg-white">
      {/* CARD HEADER */}

      <div className="flex flex-wrap items-start justify-between gap-2 bg-base-200/70 p-3">
        <div>
          <p className="break-all text-xs font-bold text-primary">
            #{order.orderNumber}
          </p>

          <p className="mt-1 text-[10px] text-muted">
            {formatDate(order.createdAt)}
          </p>
        </div>

        <StatusBadge status={payment.status} />
      </div>

      <div className="space-y-3 p-3">
        {/* PRODUCT */}

        <div className="flex items-center gap-3">
          <ProductThumb product={first} big />

          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-xs font-bold text-primary">
              {first?.name || "অর্ডারের পণ্য"}
            </p>

            <p className="mt-1 text-[10px] text-muted">
              {order.customer?.name || "—"}
              {" · "}
              {order.guest ? "Guest" : "Customer"}
            </p>
          </div>
        </div>

        {/* METHOD + CLAIM */}

        <div className="grid grid-cols-2 gap-3 rounded-lg bg-base-200/60 p-3">
          <div>
            <p className="text-[10px] text-muted">Payment Method</p>

            <div className="mt-2">
              <MethodBadge method={payment.method} />
            </div>
          </div>

          <div>
            <p className="text-[10px] text-muted">Claimed Amount</p>

            <p className="mt-1 text-sm font-bold text-primary">
              {money(payment.claimedAmount)}
            </p>

            <p className="text-[10px] text-muted">
              Order: {money(order.total)}
            </p>
          </div>
        </div>

        {/* TRANSACTION */}

        <div className="rounded-lg border border-base-300 p-3">
          <p className="text-[10px] text-muted">Transaction ID</p>

          <p className="mt-1 break-all font-mono text-xs font-bold text-primary">
            {payment.trxId || "—"}
          </p>

          <p className="mt-1 text-[10px] text-muted">
            Sender: {payment.senderPhone || "—"}
          </p>
        </div>

        {/* AMOUNT SUMMARY */}

        <div className="flex flex-wrap gap-3 text-[11px]">
          <span className="text-green-700">
            Online Verified: {money(online)}
          </span>

          {Number(payment.cashCollected) > 0 && (
            <span className="text-muted">
              Cash: {money(payment.cashCollected)}
            </span>
          )}

          {stopped(order) && refundDueOf(order) > 0 ? (
            <span className="text-red-700">
              Refund due: {money(refundDueOf(order))}
            </span>
          ) : !stopped(order) && excessOf(order) > 0 ? (
            <span className="text-amber-700">
              Excess: {money(excessOf(order))}
            </span>
          ) : (
            !stopped(order) && (
              <span className="text-amber-700">Due: {money(dueOf(order))}</span>
            )
          )}
        </div>

        {/* ACTIONS */}

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onReview(order._id)}
            className="flex items-center justify-center gap-1 rounded-lg bg-primary px-3 py-2.5 text-xs font-bold text-white"
          >
            {pending ? <ShieldCheck size={14} /> : <Eye size={14} />}

            {pending ? "Review" : "Details"}
          </button>

          <Link
            to={`/admin/orders/${encodeURIComponent(order._id)}`}
            className="flex items-center justify-center gap-1 rounded-lg border border-base-300 px-3 py-2.5 text-xs font-bold text-secondary"
          >
            <ShoppingBag size={14} />
            View Order
          </Link>
        </div>
      </div>
    </article>
  );
}

// ==========================================
// MAIN PAYMENT VERIFICATION PAGE
// ==========================================

export default function PaymentVerificationPage() {
  // ========================================
  // AUTH CONTEXT
  // ========================================

  const auth = useContext(AuthContext) || {};

  const { user, loading } = auth;

  const role = auth.role ?? auth.roleState?.role;

  const accountStatus = auth.accountStatus ?? auth.roleState?.status;

  const checking = Boolean(
    loading || (user && (auth.roleLoading || auth.roleState?.checking)),
  );

  const allowed =
    !checking &&
    Boolean(user) &&
    role === "admin" &&
    accountStatus === "active";

  const queryClient = useQueryClient();

  // ========================================
  // FILTER STATES
  // ========================================

  const [search, setSearch] = useState("");

  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [activeTab, setActiveTab] = useState("all");

  const [methodFilter, setMethodFilter] = useState("all");

  const [dateFilter, setDateFilter] = useState("all");

  const [page, setPage] = useState(1);

  const [selectedId, setSelectedId] = useState(null);

  // ========================================
  // SEARCH DEBOUNCE
  // ========================================

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search.trim()), 350);

    return () => clearTimeout(id);
  }, [search]);

  // ========================================
  // PAYMENT LIST QUERY
  // ========================================

  const listQuery = useQuery({
    queryKey: [
      "admin-payments",
      user?.uid,
      page,
      activeTab,
      methodFilter,
      dateFilter,
      debouncedSearch,
    ],

    enabled: allowed,

    queryFn: ({ signal }) => {
      const params = new URLSearchParams({
        page: String(page),
        status: activeTab,
        method: methodFilter,
        date: dateFilter,
      });

      if (debouncedSearch) {
        params.set("search", debouncedSearch);
      }

      return adminRequest(user, `/admin/payments?${params}`, { signal });
    },

    staleTime: 15000,
    refetchOnWindowFocus: true,
    refetchInterval: 60000,
    retry: 1,
  });

  // ========================================
  // FRESH FULL ORDER QUERY
  // ========================================

  const orderQuery = useQuery({
    queryKey: ["admin-payment-order", user?.uid, selectedId],

    enabled: allowed && Boolean(selectedId),

    queryFn: ({ signal }) =>
      adminRequest(user, `/admin/orders/${encodeURIComponent(selectedId)}`, {
        signal,
      }),

    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    retry: 1,
  });

  // ========================================
  // VERIFY / REJECT MUTATION
  // ========================================

  const decisionMutation = useMutation({
    mutationFn: async ({
      orderId,
      decision,
      verifiedAmount,
      reason,
      previousReceived,
      trxId,
    }) => {
      // Check latest order before writing.

      const fresh = await adminRequest(
        user,
        `/admin/orders/${encodeURIComponent(orderId)}`,
      );

      const current = fresh.order;

      if (
        !current ||
        current.status !== "pending" ||
        current.payment?.status !== "pending" ||
        current.payment?.trxId !== trxId ||
        toCents(current.payment?.verifiedAmount) !== toCents(previousReceived)
      ) {
        throw new Error(
          "Payment তথ্য পরিবর্তিত হয়েছে। Modal বন্ধ করে Refresh দিয়ে আবার Review করুন।",
        );
      }

      // Backend expects cumulative verifiedAmount.

      return adminRequest(
        user,
        `/admin/orders/${encodeURIComponent(orderId)}/payment`,
        {
          method: "PATCH",

          body:
            decision === "verify"
              ? {
                  decision,
                  verifiedAmount,
                }
              : {
                  decision,
                  reason,
                },
        },
      );
    },

    onSuccess: async () => {
      setSelectedId(null);

      // Refresh connected admin pages.

      await Promise.all(
        [
          ["admin-payments"],
          ["admin-payment-order"],
          ["admin-orders"],
          ["admin-order-detail"],
          ["admin-dashboard"],
          ["admin-deliveries"],
        ].map((queryKey) =>
          queryClient.invalidateQueries({
            queryKey,
          }),
        ),
      );

      void Swal.fire({
        icon: "success",
        title: "পেমেন্ট তথ্য আপডেট হয়েছে",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 1800,
      });
    },

    onError: () => {
      void queryClient.invalidateQueries({
        queryKey: ["admin-payment-order", user?.uid, selectedId],
      });
    },
  });

  // ========================================
  // MODAL SCROLL + ESCAPE
  // ========================================

  useEffect(() => {
    if (!selectedId) return;

    const old = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const onEscape = (event) => {
      if (event.key === "Escape" && !decisionMutation.isPending) {
        setSelectedId(null);
      }
    };

    document.addEventListener("keydown", onEscape);

    return () => {
      document.body.style.overflow = old;

      document.removeEventListener("keydown", onEscape);
    };
  }, [selectedId, decisionMutation.isPending]);

  // ========================================
  // API DATA
  // ========================================

  const data = listQuery.data || {};

  const payments = Array.isArray(data.payments) ? data.payments : [];

  const stats = data.stats || {};

  const pagination = data.pagination || {};

  const total = Number(pagination.total || 0);

  const totalPages = Math.max(1, Number(pagination.totalPages) || 1);

  // Backend /admin/payments statistics
  // cover ONLINE PAYMENT ORDERS ONLY.

  const online = Number(stats.verifiedCollection || 0);

  const cash = Number(stats.cashCollection || 0);

  const gross = Number(stats.grossCollection || 0);

  const refunded = Number(stats.refundedCollection || 0);

  const net = Number(stats.netCollection ?? gross - refunded);

  // ========================================
  // PAYMENT TABS
  // ========================================

  const tabs = [
    {
      value: "all",
      label: "সব পেমেন্ট",
      count: stats.total,
    },
    {
      value: "pending",
      label: "পেন্ডিং / আংশিক",
      count: stats.pending,
    },
    {
      value: "partially_paid",
      label: "আংশিক পরিশোধিত",
      count: stats.partiallyPaid,
    },
    {
      value: "verified",
      label: "ভেরিফাইড",
      count: stats.verified,
    },
    {
      value: "rejected",
      label: "রিজেক্টেড",
      count: stats.rejected,
    },
  ];

  // ========================================
  // RESET FILTERS
  // ========================================

  function resetFilters() {
    setSearch("");
    setDebouncedSearch("");
    setActiveTab("all");
    setMethodFilter("all");
    setDateFilter("all");
    setPage(1);
  }

  // ========================================
  // OPEN PAYMENT REVIEW
  // ========================================

  function openReview(id) {
    if (decisionMutation.isPending) return;

    decisionMutation.reset();

    // Remove previous cached detail to
    // force a fresh GET for this review.

    queryClient.removeQueries({
      queryKey: ["admin-payment-order", user?.uid, id],
      exact: true,
    });

    setSelectedId(id);
  }

  // ========================================
  // CLOSE PAYMENT REVIEW
  // ========================================

  function closeReview() {
    if (decisionMutation.isPending) return;

    setSelectedId(null);
    decisionMutation.reset();
  }

  // ========================================
  // AUTH LOADING
  // ========================================

  if (checking) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <Loader2 size={28} className="animate-spin text-secondary" />

        <p className="mt-3 text-sm text-muted">Admin Account যাচাই হচ্ছে...</p>
      </div>
    );
  }

  // ========================================
  // ACCESS DENIED
  // ========================================

  if (!allowed) {
    return (
      <div className="rounded-2xl bg-white px-5 py-16 text-center">
        <ShieldAlert size={36} className="mx-auto text-secondary" />

        <h2 className="mt-4 text-lg font-bold text-primary">
          এই পেজে প্রবেশের অনুমতি নেই
        </h2>

        <p className="mt-2 text-sm text-muted">
          শুধুমাত্র Active Admin পেমেন্ট যাচাই করতে পারবেন।
        </p>
      </div>
    );
  }

  // ========================================
  // MAIN PAGE
  // ========================================

  return (
    <div className="mx-auto max-w-[1600px] space-y-5 pb-10">
      {/* ==================================
          PAGE HEADER
      ================================== */}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-primary sm:text-2xl">
            পেমেন্ট ভেরিফিকেশন
          </h1>

          <p className="mt-1 text-xs text-muted">
            Guest ও Registered Customer-এর bKash, Nagad এবং Rocket পেমেন্ট যাচাই
            ও পরিচালনা করুন।
          </p>
        </div>

        <button
          type="button"
          onClick={() => listQuery.refetch()}
          disabled={listQuery.isFetching}
          className="inline-flex items-center gap-2 rounded-xl border border-base-300 bg-white px-4 py-2.5 text-xs font-semibold text-secondary hover:bg-secondary/5 disabled:opacity-50"
        >
          <RefreshCw
            size={15}
            className={listQuery.isFetching ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {/* ==================================
          FOUR KPI CARDS
      ================================== */}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="পেমেন্ট পেন্ডিং / আংশিক"
          subtitle="Pending + Partially Paid Orders"
          value={`${bn(stats.pending)} টি`}
          icon={Clock3}
          iconStyle="bg-amber-100 text-amber-700"
        />

        <StatCard
          title="ভেরিফাইড পেমেন্ট"
          subtitle="Verified Online Payment Orders"
          value={`${bn(stats.verified)} টি`}
          icon={CheckCircle2}
          iconStyle="bg-green-100 text-green-700"
        />

        <StatCard
          title="রিজেক্টেড পেমেন্ট"
          subtitle="Rejected Payment Orders"
          value={`${bn(stats.rejected)} টি`}
          icon={XCircle}
          iconStyle="bg-red-100 text-red-700"
        />

        <StatCard
          title="যাচাইকৃত মোবাইল ব্যাংকিং"
          subtitle="bKash / Nagad / Rocket · Cash বাদে"
          value={money(online)}
          icon={Wallet}
          iconStyle="bg-purple-100 text-secondary"
        />
      </div>

      {/* ==================================
          COLLECTION BREAKDOWN
      ================================== */}

      <div className="grid grid-cols-2 gap-3 rounded-xl border border-base-300/70 bg-white p-4 shadow-sm sm:grid-cols-4">
        <div>
          <p className="text-[11px] text-muted">
            Delivery Cash (online orders)
          </p>

          <p className="mt-1 flex items-center gap-1 text-sm font-bold text-primary">
            <Banknote size={14} className="text-secondary" />

            {money(cash)}
          </p>
        </div>

        <div>
          <p className="text-[11px] text-muted">Gross Collected</p>

          <p className="mt-1 text-sm font-bold text-primary">{money(gross)}</p>
        </div>

        <div>
          <p className="text-[11px] text-muted">Completed Refunds</p>

          <p className="mt-1 text-sm font-bold text-primary">
            {money(refunded)}
          </p>
        </div>

        <div>
          <p className="text-[11px] text-muted">Net Collected</p>

          <p className="mt-1 text-sm font-bold text-secondary">{money(net)}</p>
        </div>

        <p className="col-span-full text-[11px] leading-5 text-muted">
          এই চারটি হিসাব শুধু Mobile Banking দিয়ে করা অর্ডারের; COD Order-এর নগদ
          সংগ্রহ এখানে অন্তর্ভুক্ত নয়। Total Received = Online + Delivery Cash;
          Net = Gross − Refunded।
        </p>
      </div>

      {/* ==================================
          IMPORTANT NOTICE
      ================================== */}

      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-white p-4 shadow-sm">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gold-soft/40 text-primary">
          <AlertTriangle size={20} />
        </div>

        <div>
          <p className="text-xs font-bold text-primary">
            গুরুত্বপূর্ণ পেমেন্ট নির্দেশনা
          </p>

          <p className="mt-1 text-xs leading-6 text-muted">
            Customer-এর দেওয়া Amount ও TrxID টাকা পাওয়ার প্রমাণ নয়। Receiving
            Account যাচাই করে প্রকৃত Amount Verify করুন— Order Total বা Claimed
            Amount-এর চেয়ে কম/বেশি হলেও। Overpayment, Refund, Phone Confirmation
            ও বকেয়া Cash Collection-এর ব্যবস্থা Order Details-এ আছে।
          </p>
        </div>
      </div>

      {/* ==================================
          PAYMENT TABLE SECTION
      ================================== */}

      <section className="overflow-hidden rounded-2xl border border-base-300/70 bg-white shadow-sm">
        {/* TITLE */}

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-base-300 p-4 sm:p-5">
          <div>
            <h2 className="text-base font-bold text-primary">
              পেমেন্ট সাবমিশনসমূহ
            </h2>

            <p className="mt-1 text-xs text-muted">Online Payment Orders</p>
          </div>

          <span className="rounded-full bg-secondary/10 px-3 py-1.5 text-xs font-bold text-secondary">
            {bn(total)} Results
          </span>
        </div>

        {/* ==================================
            PAYMENT TABS
        ================================== */}

        <div className="flex gap-2 overflow-x-auto border-b border-base-300 px-4 py-3 sm:px-5">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              aria-pressed={activeTab === tab.value}
              onClick={() => {
                setActiveTab(tab.value);
                setPage(1);
              }}
              className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                activeTab === tab.value
                  ? "bg-primary text-white"
                  : "bg-base-200 text-muted hover:bg-secondary/10 hover:text-secondary"
              }`}
            >
              {tab.label}

              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                  activeTab === tab.value ? "bg-white/20" : "bg-white"
                }`}
              >
                {bn(tab.count)}
              </span>
            </button>
          ))}
        </div>

        {/* ==================================
            SEARCH + FILTERS
        ================================== */}

        <div className="grid gap-3 border-b border-base-300 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-[minmax(0,1fr)_160px_145px_auto]">
          {/* SEARCH */}

          <label className="flex h-11 items-center gap-2 rounded-xl border border-base-300 bg-base-200 px-3 focus-within:border-secondary">
            <Search size={17} className="shrink-0 text-muted" />

            <input
              value={search}
              maxLength={100}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Order, TrxID, Name, Phone..."
              className="w-full min-w-0 bg-transparent text-xs text-primary outline-none"
            />
          </label>

          {/* METHOD FILTER */}

          <select
            aria-label="Payment Method"
            value={methodFilter}
            onChange={(e) => {
              setMethodFilter(e.target.value);
              setPage(1);
            }}
            className="h-11 w-full rounded-xl border border-base-300 bg-base-200 px-3 text-xs font-semibold text-primary outline-none"
          >
            <option value="all">সব পেমেন্ট মাধ্যম</option>

            <option value="bkash">bKash</option>

            <option value="nagad">Nagad</option>

            <option value="rocket">Rocket</option>
          </select>

          {/* DATE FILTER */}

          <select
            aria-label="Payment Date"
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              setPage(1);
            }}
            className="h-11 w-full rounded-xl border border-base-300 bg-base-200 px-3 text-xs font-semibold text-primary outline-none"
          >
            <option value="all">সব তারিখ</option>

            <option value="today">আজ</option>

            <option value="week">শেষ ৭ দিন</option>

            <option value="month">এই মাস</option>
          </select>

          {/* RESET FILTER */}

          <button
            type="button"
            onClick={resetFilters}
            className="flex h-11 items-center justify-center gap-2 rounded-xl border border-base-300 px-4 text-xs font-bold text-secondary hover:bg-base-200"
          >
            <RefreshCw size={15} />
            Reset
          </button>
        </div>

        {/* ==================================
            LIST ERROR
        ================================== */}

        {listQuery.isError && (
          <div
            role="alert"
            className="m-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <p>{listQuery.error?.message || "Payment list load failed"}</p>

            <button
              type="button"
              onClick={() => listQuery.refetch()}
              className="mt-3 font-bold underline"
            >
              আবার চেষ্টা করুন
            </button>
          </div>
        )}

        {/* ==================================
            PAYMENT LIST
        ================================== */}

        {listQuery.isPending ? (
          <div className="flex min-h-64 flex-col items-center justify-center">
            <Loader2 size={28} className="animate-spin text-secondary" />

            <p className="mt-3 text-sm text-muted">Payment Data লোড হচ্ছে...</p>
          </div>
        ) : !listQuery.isError ? (
          <>
            {/* DESKTOP TABLE */}

            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[1200px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-base-300 bg-secondary/5 text-sm font-bold text-primary/60">
                    <th className="px-5 py-3">Order / Date</th>

                    <th className="px-5 py-3">Customer</th>

                    <th className="px-5 py-3">Products</th>

                    <th className="px-5 py-3">Method</th>

                    <th className="px-5 py-3">Transaction</th>

                    <th className="px-5 py-3">Amount</th>

                    <th className="px-5 py-3">Status</th>

                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-base-300/60">
                  {payments.map((order, index) => (
                    <PaymentRow
                      key={order._id}
                      order={order}
                      index={index}
                      onReview={openReview}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* MOBILE CARDS */}

            <div className="space-y-3 p-3 sm:p-4 lg:hidden">
              {payments.map((order) => (
                <MobilePaymentCard
                  key={order._id}
                  order={order}
                  onReview={openReview}
                />
              ))}
            </div>

            {/* EMPTY STATE */}

            {payments.length === 0 && (
              <div className="py-16 text-center">
                <ReceiptText size={30} className="mx-auto text-secondary" />

                <h3 className="mt-4 text-sm font-bold text-primary">
                  কোনো পেমেন্ট পাওয়া যায়নি
                </h3>

                <p className="mt-2 text-xs text-muted">
                  Filter পরিবর্তন করে দেখুন।
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

            {total > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-base-300 p-4 sm:px-5">
                <p className="text-xs text-muted">
                  Showing {bn((page - 1) * PAGE_SIZE + 1)}
                  {"–"}
                  {bn(Math.min(page * PAGE_SIZE, total))}
                  {" of "}
                  {bn(total)}
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Previous page"
                    disabled={page <= 1 || listQuery.isFetching}
                    onClick={() => setPage((v) => Math.max(1, v - 1))}
                    className="flex size-9 items-center justify-center rounded-lg border border-base-300 text-primary disabled:opacity-40"
                  >
                    <ChevronLeft size={17} />
                  </button>

                  <span className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white">
                    {page} / {totalPages}
                  </span>

                  <button
                    type="button"
                    aria-label="Next page"
                    disabled={page >= totalPages || listQuery.isFetching}
                    onClick={() => setPage((v) => Math.min(totalPages, v + 1))}
                    className="flex size-9 items-center justify-center rounded-lg border border-base-300 text-primary disabled:opacity-40"
                  >
                    <ChevronRight size={17} />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : null}
      </section>

      {/* ==================================
          PAYMENT REVIEW MODAL
      ================================== */}

      {selectedId &&
        (orderQuery.isPending ||
        orderQuery.isError ||
        !orderQuery.data?.order ? (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-primary/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-xl">
              {orderQuery.isPending ? (
                <>
                  <Loader2
                    size={28}
                    className="mx-auto animate-spin text-secondary"
                  />

                  <p className="mt-3 text-sm text-muted">
                    Order Details লোড হচ্ছে...
                  </p>
                </>
              ) : (
                <p className="text-sm text-red-700">
                  {orderQuery.error?.message || "Order load failed"}
                </p>
              )}

              <button
                type="button"
                onClick={closeReview}
                className="mt-5 rounded-lg bg-primary px-5 py-2 text-xs font-bold text-white"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <PaymentReviewModal
            key={`${orderQuery.data.order._id}-${orderQuery.data.order.payment?.trxId}-${orderQuery.data.order.payment?.status}-${orderQuery.data.order.payment?.verifiedAmount}`}
            order={orderQuery.data.order}
            saving={decisionMutation.isPending}
            actionError={decisionMutation.error?.message || ""}
            onClose={closeReview}
            onDecision={(values) => decisionMutation.mutate(values)}
          />
        ))}
    </div>
  );
}
