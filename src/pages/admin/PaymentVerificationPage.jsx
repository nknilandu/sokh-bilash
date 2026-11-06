import { useContext, useEffect, useState } from "react";

import { Link } from "react-router-dom";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import Swal from "sweetalert2";

import {
  Search,
  Wallet,
  Clock3,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  ShieldAlert,
  Eye,
  Phone,
  MessageCircle,
  Copy,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ArrowRight,
  UserRound,
  CalendarDays,
  ReceiptText,
  AlertTriangle,
  ShoppingBag,
  Loader2,
  X,
  ImageOff,
} from "lucide-react";

import { API_URL } from "../../utils/siteConfig";

import { AuthContext } from "../../providers/AuthProvider";

// ========================================
// CONFIG
// ========================================


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
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  partially_paid: {
    label: "আংশিক পরিশোধিত",
    className: "border-blue-200 bg-blue-50 text-blue-700",
  },
  verified: {
    label: "ভেরিফাইড",
    className: "border-green-200 bg-green-50 text-green-700",
  },
  rejected: {
    label: "রিজেক্টেড",
    className: "border-red-200 bg-red-50 text-red-700",
  },
};

const money = (amount) =>
  `৳${new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0)}`;

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("bn-BD", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const toCents = (value) => Math.round((Number(value) || 0) * 100);

const asAmount = (cents) => Number((cents / 100).toFixed(2));

const getPhoneLink = (phone) => {
  const digits = String(phone || "").replace(/\D/g, "");

  if (/^01[3-9]\d{8}$/.test(digits)) {
    return `88${digits}`;
  }

  if (/^8801[3-9]\d{8}$/.test(digits)) {
    return digits;
  }

  return "";
};

const getWhatsAppLink = (order) => {
  const phone = getPhoneLink(order.customer?.phone || order.shipping?.phone);

  if (!phone) return "";

  const message =
    `SokhBilash থেকে যোগাযোগ করছি।\n` +
    `আপনার অর্ডার ${order.orderNumber} এর ` +
    `পেমেন্ট সম্পর্কে কিছু তথ্য নিশ্চিত করতে চাই।`;

  return `https://wa.me/${phone}?text=` + encodeURIComponent(message);
};

// ========================================
// AUTHENTICATED ADMIN API
// ========================================

async function adminRequest(user, path, { method = "GET", body, signal } = {}) {
  if (!user) {
    throw new Error("Admin login required");
  }

  const token = await user.getIdToken();

  const response = await fetch(`${API_URL}${path}`, {
    method,
    signal,
    cache: "no-store",

    headers: {
      Accept: "application/json",

      Authorization: `Bearer ${token}`,

      ...(body !== undefined
        ? {
            "Content-Type": "application/json",
          }
        : {}),
    },

    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.success !== true) {
    throw new Error(data.message || `Request failed (${response.status})`);
  }

  return data;
}

// ========================================
// UI COMPONENTS
// ========================================

function StatusBadge({ status }) {
  const meta = STATUS_META[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold ${
        meta?.className || "border-base-300 bg-base-200 text-muted"
      }`}
    >
      {status === "verified" ? (
        <CheckCircle2 size={12} />
      ) : status === "rejected" ? (
        <XCircle size={12} />
      ) : (
        <Clock3 size={12} />
      )}

      {meta?.label || status || "অজানা"}
    </span>
  );
}

function MethodBadge({ method }) {
  const styles = {
    bkash: "bg-pink-50 text-pink-700",
    nagad: "bg-orange-50 text-orange-700",
    rocket: "bg-purple-50 text-purple-700",
  };

  return (
    <span
      className={`inline-flex rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
        styles[method] || "bg-base-200 text-primary"
      }`}
    >
      {METHOD_NAMES[method] || method || "—"}
    </span>
  );
}

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

      <p className="mt-4 text-2xl font-bold text-primary sm:text-3xl">
        {value}
      </p>
    </div>
  );
}

function ProductThumb({ product, size = "md" }) {
  const [failed, setFailed] = useState(false);

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-base-300 bg-base-200 ${
        size === "sm" ? "size-10" : "size-12"
      }`}
    >
      {product?.image && !failed ? (
        <img
          src={product.image}
          alt={product.name || "Product"}
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <ImageOff size={size === "sm" ? 15 : 18} className="text-muted" />
      )}
    </div>
  );
}

// ========================================
// CUSTOMER PROFILE AVATAR
// ========================================

function CustomerAvatar({ name, photoUrl }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-secondary/15 bg-secondary/10 text-secondary">
      {photoUrl && !failed ? (
        <img
          src={photoUrl}
          alt={name || "Customer"}
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <UserRound size={19} strokeWidth={1.8} />
      )}
    </div>
  );
}

// ========================================
// PRODUCT PREVIEW - MY ORDERS STYLE
// ========================================

function PaymentProductPreview({ order }) {
  const products = Array.isArray(order.items) ? order.items.slice(0, 2) : [];

  const quantity =
    Number(order.itemCount) ||
    (order.items || []).reduce(
      (total, item) => total + (Number(item.quantity) || 0),
      0,
    );

  return (
    <div className="flex min-w-0 items-center gap-2.5">
      {/* OVERLAPPING PRODUCT IMAGES */}

      <div className="flex shrink-0 items-center">
        {products.map((product, index) => (
          <div
            key={`${product.name}-${index}`}
            className={`rounded-lg border-2 border-white ${
              index > 0 ? "-ml-2" : ""
            }`}
          >
            <ProductThumb product={product} size="sm" />
          </div>
        ))}

        {products.length === 0 && (
          <div className="flex size-10 items-center justify-center rounded-lg bg-base-200 text-secondary">
            <ShoppingBag size={17} />
          </div>
        )}
      </div>

      {/* PRODUCT NAME + COUNT */}

      <div className="min-w-0 flex-1">
        <p
          title={products[0]?.name || ""}
          className="w-[145px] truncate text-xs font-semibold text-primary"
        >
          {products[0]?.name || "অর্ডারের পণ্য"}
        </p>

        <p className="mt-1 text-[11px] text-muted">
          মোট {quantity.toLocaleString("bn-BD")} পিস
        </p>
      </div>
    </div>
  );
}

function InfoRow({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-base-200 py-2.5 last:border-0">
      <span className="shrink-0 text-xs text-muted">{label}</span>

      <div className="min-w-0 max-w-[65%] break-words text-right text-xs font-semibold text-primary">
        {children || "—"}
      </div>
    </div>
  );
}

// ========================================
// PAYMENT REVIEW MODAL
// ========================================

function PaymentReviewModal({
  order,
  saving,
  actionError,
  onClose,
  onDecision,
}) {
  const payment = order.payment || {};

  const previousCents = toCents(payment.verifiedAmount);

  const totalCents = toCents(order.total);

  const claimCents = toCents(payment.claimedAmount);

  const remainingCents = Math.max(0, totalCents - previousCents);

  const maxThisProof = Math.min(claimCents, remainingCents);

  // This input is the amount actually received
  // for the CURRENT proof, not cumulative total.
  const [received, setReceived] = useState(String(asAmount(maxThisProof)));
  const [confirmed, setConfirmed] = useState(false);
  const [mode, setMode] = useState("review");
  const [reason, setReason] = useState("");
  const [copied, setCopied] = useState(false);
  const actualCents = toCents(received);

  const validActual =
    received.trim() !== "" &&
    /^\d+(?:\.\d{1,2})?$/.test(received) &&
    actualCents > 0 &&
    actualCents <= maxThisProof;

  const afterCents = Math.max(0, remainingCents - actualCents);
  const pending = payment.status === "pending" && order.status === "pending";
  const canVerify = pending && confirmed && validActual && !saving;
  const whatsapp = getWhatsAppLink(order);
  const phone = order.customer?.phone || order.shipping?.phone || "";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(payment.trxId || "");

      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const handleVerify = () => {
    if (!canVerify) return;

    const cumulative = asAmount(previousCents + actualCents);

    onDecision({
      orderId: order._id,
      decision: "verify",
      verifiedAmount: cumulative,
    });
  };

  const handleReject = () => {
    if (!pending || !reason.trim() || saving) {
      return;
    }

    onDecision({
      orderId: order._id,
      decision: "reject",
      reason: reason.trim(),
    });
  };

  return (
    <div
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) {
          onClose();
        }
      }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-primary/60 p-3 backdrop-blur-sm"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-title"
        className="flex max-h-[95vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        {/* MODAL HEADER */}

        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-base-300 px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="text-[10px] font-bold tracking-wider text-secondary">
              PAYMENT VERIFICATION
            </p>

            <h2
              id="review-title"
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
                  আগে প্রকৃত পেমেন্ট যাচাই করুন
                </p>

                <p className="mt-1 text-xs leading-6 text-amber-800">
                  Customer-এর দেওয়া TrxID পেমেন্টের প্রমাণ নয়।
                  bKash/Nagad/Rocket-এর receiving account-এ TrxID, sender,
                  amount এবং লেনদেন সফল হয়েছে কি না মিলিয়ে তারপর Verify করুন।
                </p>
              </div>
            </div>
          )}

          {/* CUSTOMER + TRANSACTION */}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-base-300 p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-primary">
                <UserRound size={17} className="text-secondary" />
                কাস্টমার তথ্য
              </h3>

              <InfoRow label="ধরন">
                {order.guest ? "Guest" : "Registered Customer"}
              </InfoRow>
              <InfoRow label="নাম">{order.customer?.name}</InfoRow>
              <InfoRow label="ফোন">{phone}</InfoRow>
              <InfoRow label="ইমেইল">{order.customer?.email || "—"}</InfoRow>
              <InfoRow label="জেলা">
                {order.shipping?.district || order.customer?.district}
              </InfoRow>
              <InfoRow label="Order Status">{order.status}</InfoRow>

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

            {/* TRANSACTION */}

            <div className="rounded-xl border border-base-300 p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-primary">
                <ReceiptText size={17} className="text-secondary" />
                Transaction Details
              </h3>

              <InfoRow label="Method">
                <MethodBadge method={payment.method} />
              </InfoRow>

              <InfoRow label="Sender Number">{payment.senderPhone}</InfoRow>
              <InfoRow label="Claimed Amount">
                {money(payment.claimedAmount)}
              </InfoRow>
              <InfoRow label="Order Date">
                {formatDate(order.createdAt)}
              </InfoRow>

              <div className="mt-3 rounded-xl bg-base-200 p-3">
                <p className="text-[11px] text-muted">Transaction ID (TrxID)</p>

                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="min-w-0 break-all font-mono text-sm font-bold text-primary">
                    {payment.trxId || "—"}
                  </span>

                  <button
                    type="button"
                    onClick={handleCopy}
                    aria-label="Copy TrxID"
                    className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white text-secondary"
                  >
                    {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>

              {payment.note && (
                <p className="mt-3 rounded-lg bg-secondary/5 p-3 text-xs leading-5 text-muted">
                  <strong>Customer Note:</strong> {payment.note}
                </p>
              )}
            </div>
          </div>

          {/* FINANCIAL BREAKDOWN */}

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
                <p className="text-[11px] text-green-700">Already Verified</p>

                <p className="mt-2 text-lg font-bold text-green-800">
                  {money(payment.verifiedAmount)}
                </p>
              </div>

              <div className="rounded-xl bg-amber-50 p-3">
                <p className="text-[11px] text-amber-700">Remaining Due</p>

                <p className="mt-2 text-lg font-bold text-amber-800">
                  {money(asAmount(remainingCents))}
                </p>
              </div>

              <div className="rounded-xl bg-secondary/10 p-3">
                <p className="text-[11px] text-secondary">Customer Claimed</p>

                <p className="mt-2 text-lg font-bold text-primary">
                  {money(payment.claimedAmount)}
                </p>
              </div>
            </div>
          </div>

          {/* PRODUCTS */}

          <div className="rounded-xl border border-base-300 p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-primary">
              <ShoppingBag size={17} className="text-secondary" />
              অর্ডারের প্রোডাক্টসমূহ ({order.items?.length || 0})
            </h3>

            <div className="space-y-3">
              {(order.items || []).map((item, index) => (
                <div
                  key={item.cartId || index}
                  className="flex items-center gap-3 rounded-xl bg-base-200/60 p-3"
                >
                  <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-base-200">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <ImageOff size={18} className="text-muted" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-xs font-bold text-primary">
                      {item.name}
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
                      Qty: {item.quantity}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* HISTORICAL DECISIONS */}

          {payment.status === "verified" && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-4">
              <p className="flex items-center gap-2 text-xs font-bold text-green-800">
                <CheckCircle2 size={17} />
                Payment Verified
              </p>

              <p className="mt-2 text-xs leading-5 text-green-700">
                Verified Amount: {money(payment.verifiedAmount)}
                {" • "}
                {formatDate(payment.verifiedAt)}
              </p>

              {payment.verifiedBy && (
                <p className="mt-1 break-all text-[11px] text-green-700">
                  Verified By: {payment.verifiedBy}
                </p>
              )}
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
            </div>
          )}

          {payment.status === "partially_paid" && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
              <p className="text-xs font-bold text-blue-800">
                Partial Payment Verified
              </p>

              <p className="mt-2 text-xs leading-6 text-blue-700">
                {money(payment.verifiedAmount)} গ্রহণ করা হয়েছে। বাকি{" "}
                {money(asAmount(remainingCents))} পরিশোধের জন্য Customer-এর নতুন
                Payment Proof প্রয়োজন।
              </p>
            </div>
          )}

          {/* ADMIN VERIFICATION CONTROLS */}

          {pending && (
            <div className="rounded-xl border border-secondary/20 bg-[#faf7fb] p-4">
              <h3 className="flex items-center gap-2 text-sm font-bold text-primary">
                <ShieldCheck size={18} className="text-secondary" />
                Admin Verification Decision
              </h3>

              {mode === "review" ? (
                <div className="mt-4 space-y-4">
                  <div>
                    <label
                      htmlFor="received-amount"
                      className="block text-xs font-bold text-primary"
                    >
                      প্রকৃত প্রাপ্ত Amount (৳)
                    </label>

                    <input
                      id="received-amount"
                      type="number"
                      min="0.01"
                      step="0.01"
                      max={asAmount(maxThisProof)}
                      value={received}
                      disabled={saving}
                      onChange={(event) => setReceived(event.target.value)}
                      className="input mt-2 w-full rounded-xl border-base-300 bg-white text-sm focus:border-secondary focus:outline-none"
                    />

                    <p className="mt-2 text-[11px] text-muted">
                      এই TrxID থেকে সর্বোচ্চ {money(asAmount(maxThisProof))}{" "}
                      Verify করা যাবে।
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-3 rounded-xl bg-gold-soft/30 p-3">
                    <span className="text-xs font-bold text-primary">
                      Verify করার পরে Due
                    </span>

                    <span className="text-base font-bold text-primary">
                      {validActual ? money(asAmount(afterCents)) : "—"}
                    </span>
                  </div>

                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-base-300 bg-white p-3">
                    <input
                      type="checkbox"
                      checked={confirmed}
                      disabled={saving}
                      onChange={(event) => setConfirmed(event.target.checked)}
                      className="checkbox checkbox-secondary checkbox-sm mt-0.5"
                    />

                    <span className="text-xs leading-6 text-primary">
                      আমি receiving account-এর প্রকৃত transaction history দেখে
                      TrxID, sender এবং amount মিলিয়ে নিশ্চিত হয়েছি।
                    </span>
                  </label>

                  <div className="grid gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={handleVerify}
                      disabled={!canVerify}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-700 px-4 py-3 text-xs font-bold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {saving ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <CheckCircle2 size={16} />
                      )}
                      Verify Payment
                    </button>

                    <button
                      type="button"
                      onClick={() => setMode("reject")}
                      disabled={saving}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                    >
                      <XCircle size={16} />
                      Reject Payment
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  <label
                    htmlFor="reject-reason"
                    className="block text-xs font-bold text-primary"
                  >
                    Rejection Reason
                  </label>

                  <textarea
                    id="reject-reason"
                    rows={4}
                    maxLength={500}
                    value={reason}
                    disabled={saving}
                    onChange={(event) => setReason(event.target.value)}
                    placeholder="পেমেন্ট কেন রিজেক্ট করা হচ্ছে লিখুন..."
                    className="textarea w-full rounded-xl border-base-300 bg-white text-xs focus:border-secondary focus:outline-none"
                  />

                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => setMode("review")}
                      className="rounded-xl border border-base-300 bg-white px-4 py-3 text-xs font-bold text-primary"
                    >
                      Back
                    </button>

                    <button
                      type="button"
                      disabled={!reason.trim() || saving}
                      onClick={handleReject}
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
          )}

          {actionError && (
            <p
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700"
            >
              {actionError}
            </p>
          )}

          {/* RECENT AUDIT HISTORY */}

          {Array.isArray(order.history) && order.history.length > 0 && (
            <div className="rounded-xl border border-base-300 p-4">
              <h3 className="mb-3 text-sm font-bold text-primary">
                Recent Order History
              </h3>

              <div className="space-y-3">
                {order.history
                  .slice(-5)
                  .reverse()
                  .map((entry, index) => (
                    <div
                      key={index}
                      className="border-l-2 border-secondary/30 pl-3"
                    >
                      <p className="text-xs font-semibold text-primary">
                        {entry.status}
                      </p>

                      <p className="mt-1 text-[11px] text-muted">
                        {entry.note}
                      </p>

                      <p className="mt-1 text-[10px] text-muted">
                        {formatDate(entry.date)}
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

// ========================================
// MAIN PAYMENT VERIFICATION PAGE
// ========================================

export default function PaymentVerificationPage() {
  const { user, loading, role, roleLoading, accountStatus } =
    useContext(AuthContext);

  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");

  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [activeTab, setActiveTab] = useState("all");

  const [methodFilter, setMethodFilter] = useState("all");

  const [dateFilter, setDateFilter] = useState("all");

  const [page, setPage] = useState(1);

  const [selectedId, setSelectedId] = useState(null);

  const checking = loading || (Boolean(user) && roleLoading);

  const allowed =
    !checking &&
    Boolean(user) &&
    role === "admin" &&
    accountStatus === "active";

  // ======================================
  // DEBOUNCED SEARCH
  // ======================================

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 350);

    return () => clearTimeout(timeout);
  }, [search]);

  // ======================================
  // LIST QUERY
  // ======================================

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

    staleTime: 15 * 1000,
    refetchOnWindowFocus: true,
  });

  // ======================================
  // SINGLE ORDER QUERY
  // Always fetch fresh order before review.
  // ======================================

  const orderQuery = useQuery({
    queryKey: ["admin-payment-order", user?.uid, selectedId],

    enabled: allowed && Boolean(selectedId),

    queryFn: ({ signal }) =>
      adminRequest(user, `/admin/orders/${encodeURIComponent(selectedId)}`, {
        signal,
      }),

    staleTime: 0,
    refetchOnMount: "always",
  });

  // ======================================
  // VERIFY / REJECT MUTATION
  // ======================================

  const decisionMutation = useMutation({
    mutationFn: ({ orderId, decision, verifiedAmount, reason }) =>
      adminRequest(
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
      ),

    onSuccess: async () => {
      setSelectedId(null);

      await queryClient.invalidateQueries({
        queryKey: ["admin-payments"],
      });

      await queryClient.invalidateQueries({
        queryKey: ["admin-payment-order"],
      });

      await queryClient.invalidateQueries({
        queryKey: ["admin-orders"],
      });

      Swal.fire({
        icon: "success",
        title: "পেমেন্ট তথ্য আপডেট হয়েছে",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });
    },
  });

  // ======================================
  // MODAL SCROLL + ESCAPE
  // ======================================

  useEffect(() => {
    if (!selectedId) return;

    const previous = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const handleEscape = (event) => {
      if (event.key === "Escape" && !decisionMutation.isPending) {
        setSelectedId(null);
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previous;

      document.removeEventListener("keydown", handleEscape);
    };
  }, [selectedId, decisionMutation.isPending]);

  // ======================================
  // DATA
  // ======================================

  const response = listQuery.data || {};

  const payments = Array.isArray(response.payments) ? response.payments : [];

  const stats = response.stats || {
    total: 0,
    pending: 0,
    partiallyPaid: 0,
    verified: 0,
    rejected: 0,
    verifiedCollection: 0,
  };

  const pagination = response.pagination || {
    total: 0,
    totalPages: 1,
    limit: PAGE_SIZE,
  };

  const totalPages = Math.max(1, Number(pagination.totalPages) || 1);

  const tabs = [
    {
      value: "all",
      label: "সব পেমেন্ট",
      count: stats.total,
    },
    {
      value: "pending",
      label: "যাচাই বাকি",
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

  const changeTab = (value) => {
    setActiveTab(value);
    setPage(1);
  };

  const resetFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setActiveTab("all");
    setMethodFilter("all");
    setDateFilter("all");
    setPage(1);
  };

  const openReview = (id) => {
    decisionMutation.reset();
    setSelectedId(id);
  };

  const closeReview = () => {
    if (decisionMutation.isPending) {
      return;
    }

    setSelectedId(null);
    decisionMutation.reset();
  };

  // ======================================
  // AUTH CHECK
  // ======================================

  if (checking) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <Loader2 size={28} className="animate-spin text-secondary" />

        <p className="mt-3 text-sm text-muted">Admin Account যাচাই হচ্ছে...</p>
      </div>
    );
  }

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

  // ======================================
  // PAGE UI
  // ======================================

  return (
    <div className="mx-auto max-w-[1600px] space-y-5 pb-10">
      {/* PAGE HEADER */}

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

      {/* KPI CARDS */}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="পেমেন্ট যাচাই বাকি"
          subtitle="Pending + Partial"
          value={`${stats.pending.toLocaleString("bn-BD")} টি`}
          icon={Clock3}
          iconStyle="bg-amber-100 text-amber-700"
        />

        <StatCard
          title="ভেরিফাইড পেমেন্ট"
          subtitle="Fully Verified"
          value={`${stats.verified.toLocaleString("bn-BD")} টি`}
          icon={CheckCircle2}
          iconStyle="bg-green-100 text-green-700"
        />

        <StatCard
          title="রিজেক্টেড পেমেন্ট"
          subtitle="Rejected Proofs"
          value={`${stats.rejected.toLocaleString("bn-BD")} টি`}
          icon={XCircle}
          iconStyle="bg-red-100 text-red-700"
        />

        <StatCard
          title="ভেরিফাইড কালেকশন"
          subtitle="Includes partial receipts"
          value={money(stats.verifiedCollection)}
          icon={Wallet}
          iconStyle="bg-purple-100 text-secondary"
        />
      </div>

      {/* IMPORTANT NOTICE */}

      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-white p-4 shadow-sm">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gold-soft/40 text-primary">
          <AlertTriangle size={20} />
        </div>

        <div>
          <p className="text-xs font-bold text-primary">
            গুরুত্বপূর্ণ পেমেন্ট নির্দেশনা
          </p>

          <p className="mt-1 text-xs leading-6 text-muted">
            Customer-এর দেওয়া Amount ও TrxID বাস্তব Payment-এর নিশ্চয়তা নয়।
            Receiving Account যাচাই করার পরেই Verify করুন। Cash on Delivery এই
            Online Payment Dashboard-এর বাইরে।
          </p>
        </div>
      </div>

      {/* TABLE CONTAINER */}

      <section className="overflow-hidden rounded-2xl border border-base-300/70 bg-white shadow-sm">
        {/* TITLE */}

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-base-300 p-4 sm:p-5">
          <div>
            <h2 className="text-base font-bold text-primary">
              পেমেন্ট সাবমিশনসমূহ
            </h2>

            <p className="mt-1 text-xs text-muted">MongoDB Orders Collection</p>
          </div>

          <span className="rounded-full bg-secondary/10 px-3 py-1.5 text-xs font-bold text-secondary">
            {Number(pagination.total).toLocaleString("bn-BD")} Results
          </span>
        </div>

        {/* TABS */}

        <div className="flex gap-2 overflow-x-auto border-b border-base-300 px-4 py-3 sm:px-5">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => changeTab(tab.value)}
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
                {tab.count.toLocaleString("bn-BD")}
              </span>
            </button>
          ))}
        </div>

        {/* FILTERS */}

        <div className="grid gap-3 border-b border-base-300 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-[minmax(0,1fr)_160px_145px_auto]">
          <label className="flex h-11 items-center gap-2 rounded-xl border border-base-300 bg-base-200 px-3 focus-within:border-secondary">
            <Search size={17} className="shrink-0 text-muted" />

            <input
              value={search}
              maxLength={100}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Order, TrxID, Name, Phone..."
              className="w-full min-w-0 bg-transparent text-xs text-primary outline-none"
            />
          </label>

          <select
            value={methodFilter}
            onChange={(event) => {
              setMethodFilter(event.target.value);
              setPage(1);
            }}
            className="h-11 w-full rounded-xl border border-base-300 bg-base-200 px-3 text-xs font-semibold text-primary outline-none"
          >
            <option value="all">সব পেমেন্ট মাধ্যম</option>
            <option value="bkash">bKash</option>
            <option value="nagad">Nagad</option>
            <option value="rocket">Rocket</option>
          </select>

          <select
            value={dateFilter}
            onChange={(event) => {
              setDateFilter(event.target.value);
              setPage(1);
            }}
            className="h-11 w-full rounded-xl border border-base-300 bg-base-200 px-3 text-xs font-semibold text-primary outline-none"
          >
            <option value="all">সব তারিখ</option>
            <option value="today">আজ</option>
            <option value="week">শেষ ৭ দিন</option>
            <option value="month">এই মাস</option>
          </select>

          <button
            type="button"
            onClick={resetFilters}
            className="flex h-11 items-center justify-center gap-2 rounded-xl border border-base-300 px-4 text-xs font-bold text-secondary hover:bg-base-200"
          >
            <RefreshCw size={15} />
            Reset
          </button>
        </div>

        {/* FETCH ERROR */}

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

        {/* LOADING */}

        {listQuery.isPending ? (
          <div className="flex min-h-64 flex-col items-center justify-center">
            <Loader2 size={28} className="animate-spin text-secondary" />

            <p className="mt-3 text-sm text-muted">Payment Data লোড হচ্ছে...</p>
          </div>
        ) : !listQuery.isError ? (
          <>
            {/* ======================================== */}
            {/* DESKTOP PAYMENT TABLE - UPDATED DESIGN   */}
            {/* ======================================== */}

            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[1120px] border-collapse text-left">
                {/* ==================================== */}
                {/* TABLE HEADER */}
                {/* ==================================== */}

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

                {/* ==================================== */}
                {/* TABLE BODY */}
                {/* ==================================== */}

                <tbody className="divide-y divide-base-300/60">
                  {payments.map((order, index) => {
                    const payment = order.payment || {};

                    const customerName =
                      order.customer?.name || "Unknown Customer";

                    const customerPhone =
                      order.customer?.phone || order.shipping?.phone || "—";

                    const customerPhoto = order.customerPhotoUrl || "";

                    const pending =
                      payment.status === "pending" &&
                      order.status === "pending";

                    return (
                      <tr
                        key={order._id}
                        className={`transition-colors hover:bg-secondary/5 ${
                          index % 2 === 0 ? "bg-white" : "bg-[#faf7fb]"
                        }`}
                      >
                        {/* ============================= */}
                        {/* ORDER NUMBER + DATE */}
                        {/* ============================= */}

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

                        {/* ============================= */}
                        {/* CUSTOMER PROFILE + INFORMATION */}
                        {/* ============================= */}

                        <td className="px-5 py-2.5 align-middle">
                          <div className="flex min-w-[175px] items-center gap-2.5">
                            {/* CUSTOMER AVATAR */}

                            <CustomerAvatar
                              name={customerName}
                              photoUrl={customerPhoto}
                            />

                            {/* NAME + PHONE */}

                            <div className="min-w-0 flex-1">
                              <p
                                title={customerName}
                                className="max-w-[145px] truncate whitespace-nowrap text-sm font-semibold text-primary"
                              >
                                {customerName}
                              </p>

                              <p className="whitespace-nowrap text-[11px] text-muted">
                                {customerPhone}
                              </p>

                              <p className="text-[11px] font-medium text-secondary">
                                {order.guest
                                  ? "Guest Customer"
                                  : "Registered Customer"}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* ============================= */}
                        {/* PRODUCT PREVIEW */}
                        {/* SAME STYLE AS MY ORDERS */}
                        {/* ============================= */}

                        <td className="px-5 py-2.5 align-middle">
                          <PaymentProductPreview order={order} />
                        </td>

                        {/* ============================= */}
                        {/* PAYMENT METHOD */}
                        {/* ============================= */}

                        <td className="px-5 py-2.5 align-middle">
                          <MethodBadge method={payment.method} />
                        </td>

                        {/* ============================= */}
                        {/* TRANSACTION ID + SENDER */}
                        {/* ============================= */}

                        <td className="px-5 py-2.5 align-middle">
                          <p
                            title={payment.trxId || ""}
                            className="max-w-[125px] truncate font-mono text-xs font-semibold text-primary"
                          >
                            {payment.trxId || "—"}
                          </p>

                          <p className="mt-1 whitespace-nowrap text-[11px] text-muted">
                            {payment.senderPhone || "—"}
                          </p>
                        </td>

                        {/* ============================= */}
                        {/* PAYMENT AMOUNT */}
                        {/* ============================= */}

                        <td className="px-5 py-2.5 align-middle">
                          <p className="whitespace-nowrap text-sm font-bold text-primary">
                            {money(payment.claimedAmount)}
                          </p>

                          <p className="mt-1 whitespace-nowrap text-[11px] text-muted">
                            Total: {money(order.total)}
                          </p>

                          {Number(payment.verifiedAmount) > 0 && (
                            <p className="mt-0.5 whitespace-nowrap text-[11px] font-medium text-green-700">
                              Paid: {money(payment.verifiedAmount)}
                            </p>
                          )}
                        </td>

                        {/* ============================= */}
                        {/* PAYMENT STATUS */}
                        {/* ============================= */}

                        <td className="px-5 py-2.5 align-middle">
                          <StatusBadge status={payment.status} />
                        </td>

                        {/* ============================= */}
                        {/* ACTION BUTTONS */}
                        {/* ============================= */}

                        <td className="px-5 py-2.5 text-right align-middle">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* REVIEW BUTTON */}

                            <button
                              type="button"
                              onClick={() => openReview(order._id)}
                              className={`inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition ${
                                pending
                                  ? "bg-primary text-white hover:bg-secondary"
                                  : "bg-secondary/10 text-secondary hover:bg-secondary/20"
                              }`}
                            >
                              {pending ? (
                                <ShieldCheck size={15} />
                              ) : (
                                <Eye size={15} />
                              )}

                              {pending ? "Review" : "Details"}
                            </button>

                            {/* VIEW ORDER BUTTON */}

                            <Link
                              to={`/admin/orders/${encodeURIComponent(
                                order._id,
                              )}`}
                              className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-base-300 bg-white px-3 py-2 text-xs font-semibold text-primary transition hover:border-secondary/30 hover:text-secondary"
                            >
                              <ShoppingBag size={15} />
                              Order
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* MOBILE / TABLET CARDS */}

            <div className="space-y-3 p-3 sm:p-4 lg:hidden">
              {payments.map((order) => {
                const payment = order.payment || {};

                const first = order.items?.[0];

                return (
                  <div
                    key={order._id}
                    className="overflow-hidden rounded-xl border border-base-300 bg-white"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2 bg-base-200/70 p-3">
                      <div>
                        <p className="break-all text-xs font-bold text-primary">
                          {order.orderNumber}
                        </p>

                        <p className="mt-1 text-[10px] text-muted">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>

                      <StatusBadge status={payment.status} />
                    </div>

                    <div className="space-y-3 p-3">
                      <div className="flex items-center gap-3">
                        <ProductThumb product={first} />

                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-xs font-bold text-primary">
                            {first?.name}
                          </p>

                          <p className="mt-1 text-[10px] text-muted">
                            {order.customer?.name}
                            {" • "}
                            {order.guest ? "Guest" : "Customer"}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 rounded-lg bg-base-200/60 p-3">
                        <div>
                          <p className="text-[10px] text-muted">
                            Payment Method
                          </p>

                          <div className="mt-2">
                            <MethodBadge method={payment.method} />
                          </div>
                        </div>

                        <div>
                          <p className="text-[10px] text-muted">
                            Claimed Amount
                          </p>

                          <p className="mt-1 text-sm font-bold text-primary">
                            {money(payment.claimedAmount)}
                          </p>

                          <p className="text-[10px] text-muted">
                            Total: {money(order.total)}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-lg border border-base-300 p-3">
                        <p className="text-[10px] text-muted">Transaction ID</p>

                        <p className="mt-1 break-all font-mono text-xs font-bold text-primary">
                          {payment.trxId}
                        </p>

                        <p className="mt-1 text-[10px] text-muted">
                          Sender: {payment.senderPhone}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => openReview(order._id)}
                          className="flex items-center justify-center gap-1 rounded-lg bg-primary px-3 py-2.5 text-xs font-bold text-white"
                        >
                          <Eye size={14} />
                          Review
                        </button>

                        <Link
                          to={`/admin/orders/${order._id}`}
                          className="flex items-center justify-center gap-1 rounded-lg border border-base-300 px-3 py-2.5 text-xs font-bold text-secondary"
                        >
                          <ShoppingBag size={14} />
                          View Order
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* EMPTY */}

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

            {Number(pagination.total) > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-base-300 p-4 sm:px-5">
                <p className="text-xs text-muted">
                  Showing {((page - 1) * PAGE_SIZE + 1).toLocaleString("bn-BD")}
                  {"–"}
                  {Math.min(
                    page * PAGE_SIZE,
                    Number(pagination.total),
                  ).toLocaleString("bn-BD")}
                  {" of "}
                  {Number(pagination.total).toLocaleString("bn-BD")}
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Previous page"
                    disabled={page <= 1}
                    onClick={() => setPage((value) => Math.max(1, value - 1))}
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
                    disabled={page >= totalPages}
                    onClick={() =>
                      setPage((value) => Math.min(totalPages, value + 1))
                    }
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

      {/* =================================== */}
      {/* PAYMENT REVIEW MODAL */}
      {/* =================================== */}

      {selectedId &&
        (orderQuery.isPending || orderQuery.isError ? (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-primary/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-xl">
              {orderQuery.isPending ? (
                <>
                  <Loader2
                    size={28}
                    className="mx-auto animate-spin text-secondary"
                  />

                  <p className="mt-3 text-sm text-muted">
                    Order details লোড হচ্ছে...
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
            key={`${orderQuery.data.order._id}-${orderQuery.data.order.payment?.trxId}-${orderQuery.data.order.payment?.status}`}
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
