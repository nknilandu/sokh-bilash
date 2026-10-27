
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Wallet,
  Clock3,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  ShieldAlert,
  CreditCard,
  Eye,
  Phone,
  MessageCircle,
  Copy,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  ArrowRight,
  UserRound,
  CalendarDays,
  Hash,
  ReceiptText,
  AlertTriangle,
  FileCheck2,
  Send,
  Banknote,
  Filter,
  ExternalLink,
  ImageOff,
  ShoppingBag,
} from "lucide-react";

// ========================================
// DEMO DATA — Replace with backend API
// ========================================

const demoPayments = [
  {
    id: "PAY-1001",
    orderId: "SKB-98431",
    createdAt: "2026-10-25T10:42:00+06:00",
    customer: {
      name: "তানভীর হাসান",
      phone: "01819223344",
    },
    product: {
      name: "বিবাহবার্ষিকী স্পেশাল গিফট বক্স",
      image:
        "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=160&q=80",
    },
    method: "bKash",
    senderPhone: "01819223344",
    transactionId: "BK892348LL",
    submittedAmount: 2565,
    orderTotal: 5130,
    previousVerified: 0,
    status: "verified",
    verifiedAt: "2026-10-25T10:48:00+06:00",
    verifiedBy: "Admin",
    note: "",
    rejectionReason: "",
  },
  {
    id: "PAY-1002",
    orderId: "SKB-98432",
    createdAt: "2026-10-25T11:15:00+06:00",
    customer: {
      name: "রহিম আহমেদ",
      phone: "01712345678",
    },
    product: {
      name: "কাস্টমাইজড প্রিমিয়াম ফটো ফ্রেম",
      image:
        "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=160&q=80",
    },
    method: "bKash",
    senderPhone: "01712345678",
    transactionId: "BK7T9M1234",
    submittedAmount: 500,
    orderTotal: 1930,
    previousVerified: 0,
    status: "pending",
    verifiedAt: null,
    verifiedBy: null,
    note: "অগ্রিম পেমেন্ট পাঠিয়েছি।",
    rejectionReason: "",
  },
  {
    id: "PAY-1003",
    orderId: "SKB-98434",
    createdAt: "2026-10-25T11:30:00+06:00",
    customer: {
      name: "মেহেদী হাসান",
      phone: "01912345678",
    },
    product: {
      name: "ইসলামিক ক্যালিগ্রাফি ফ্রেম",
      image:
        "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=160&q=80",
    },
    method: "Nagad",
    senderPhone: "01912345678",
    transactionId: "NG4567ABCD",
    submittedAmount: 790,
    orderTotal: 1580,
    previousVerified: 0,
    status: "pending",
    verifiedAt: null,
    verifiedBy: null,
    note: "",
    rejectionReason: "",
  },
  {
    id: "PAY-1004",
    orderId: "SKB-98436",
    createdAt: "2026-10-24T14:20:00+06:00",
    customer: {
      name: "আকাশ দাস",
      phone: "01798765432",
    },
    product: {
      name: "কাপল ফটো ফ্রেম",
      image:
        "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=160&q=80",
    },
    method: "Rocket",
    senderPhone: "01798765432",
    transactionId: "RK78291033",
    submittedAmount: 890,
    orderTotal: 1780,
    previousVerified: 0,
    status: "verified",
    verifiedAt: "2026-10-24T14:40:00+06:00",
    verifiedBy: "Admin",
    note: "",
    rejectionReason: "",
  },
  {
    id: "PAY-1005",
    orderId: "SKB-98440",
    createdAt: "2026-10-25T12:10:00+06:00",
    customer: {
      name: "সাদিয়া ইসলাম",
      phone: "01812345678",
    },
    product: {
      name: "Birthday Luxury Hamper",
      image:
        "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=160&q=80",
    },
    method: "bKash",
    senderPhone: "01812345678",
    transactionId: "BK8X3P9981",
    submittedAmount: 1300,
    orderTotal: 2780,
    previousVerified: 0,
    status: "pending",
    verifiedAt: null,
    verifiedBy: null,
    note: "",
    rejectionReason: "",
  },
  {
    id: "PAY-1006",
    orderId: "SKB-98441",
    createdAt: "2026-10-23T16:30:00+06:00",
    customer: {
      name: "নুসরাত জাহান",
      phone: "01698765432",
    },
    product: {
      name: "চকলেট ও ফুলের গিফট বক্স",
      image:
        "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=160&q=80",
    },
    method: "Nagad",
    senderPhone: "01698765432",
    transactionId: "NG9999TEST",
    submittedAmount: 1200,
    orderTotal: 2330,
    previousVerified: 0,
    status: "rejected",
    verifiedAt: null,
    verifiedBy: null,
    note: "",
    rejectionReason: "লেনদেনের তথ্য মিল পাওয়া যায়নি।",
  },
];

const statusMeta = {
  pending: {
    label: "যাচাই বাকি",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  verified: {
    label: "ভেরিফাইড",
    className: "bg-green-50 text-green-700 border-green-200",
  },
  rejected: {
    label: "রিজেক্টেড",
    className: "bg-red-50 text-red-700 border-red-200",
  },
};

const methodColors = {
  bKash: "bg-pink-50 text-pink-700",
  Nagad: "bg-orange-50 text-orange-700",
  Rocket: "bg-purple-50 text-purple-700",
};

const money = (amount) =>
  `৳${Number(amount || 0).toLocaleString("bn-BD")}`;

const formatDate = (value) => {
  if (!value) return "—";

  return new Date(value).toLocaleString("bn-BD", {
    timeZone: "Asia/Dhaka",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

function toWhatsAppNumber(phone) {
  const cleaned = String(phone || "").replace(/\D/g, "");

  if (/^01[3-9]\d{8}$/.test(cleaned)) {
    return `88${cleaned}`;
  }

  if (/^8801[3-9]\d{8}$/.test(cleaned)) {
    return cleaned;
  }

  return null;
}

function getWhatsAppLink(payment) {
  const number = toWhatsAppNumber(payment.customer.phone);
  if (!number) return null;

  const message = [
    `আসসালামু আলাইকুম ${payment.customer.name},`,
    "",
    "SokhBilash (শখবিলাস) থেকে যোগাযোগ করছি।",
    `আপনার অর্ডার #${payment.orderId} এর পেমেন্ট সম্পর্কে কিছু তথ্য নিশ্চিত করতে চাই।`,
    "",
    "ধন্যবাদ,",
    "SokhBilash Team",
  ].join("\n");

  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

function StatusBadge({ status }) {
  const meta = statusMeta[status];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold ${
        meta?.className || "bg-base-200 text-muted"
      }`}
    >
      {status === "verified" && <CheckCircle2 size={12} />}
      {status === "pending" && <Clock3 size={12} />}
      {status === "rejected" && <XCircle size={12} />}
      {meta?.label || status}
    </span>
  );
}

function MethodBadge({ method }) {
  return (
    <span
      className={`inline-flex rounded-lg px-2.5 py-1.5 text-[11px] font-extrabold ${
        methodColors[method] || "bg-base-200 text-primary"
      }`}
    >
      {method}
    </span>
  );
}

function StatCard({
  title,
  subtitle,
  value,
  icon: Icon,
  iconStyle,
  valueStyle,
}) {
  return (
    <div className="rounded-xl border border-base-300/70 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-xs font-bold text-primary sm:text-sm">
            {title}
          </h3>
          <p className="mt-1 text-[11px] text-muted">{subtitle}</p>
        </div>

        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${iconStyle}`}
        >
          <Icon size={20} />
        </div>
      </div>

      <p
        className={`mt-4 text-2xl font-extrabold sm:text-3xl ${
          valueStyle || "text-primary"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function ProductThumb({ product }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-base-300 bg-base-200">
      {product?.image && !failed ? (
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <ImageOff size={18} className="text-muted" />
      )}
    </div>
  );
}

function InfoRow({ label, children, strong = false }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2 text-xs">
      <span className="text-muted">{label}</span>
      <span
        className={`max-w-[62%] break-words text-right ${
          strong
            ? "text-sm font-extrabold text-primary"
            : "font-semibold text-primary"
        }`}
      >
        {children}
      </span>
    </div>
  );
}

// ========================================
// PAYMENT REVIEW MODAL
// ========================================

function PaymentReviewModal({
  payment,
  allPayments,
  onClose,
  onVerify,
  onReject,
}) {
  const [mode, setMode] = useState("review");
  const [rejectReason, setRejectReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!payment) return null;

  const whatsappLink = getWhatsAppLink(payment);
  const callLink = `tel:${payment.customer.phone}`;

  const duplicateMatches = allPayments.filter(
    (item) =>
      item.id !== payment.id &&
      item.method === payment.method &&
      item.transactionId.trim().toUpperCase() ===
        payment.transactionId.trim().toUpperCase()
  );

  const remainingBefore = Math.max(
    0,
    payment.orderTotal - payment.previousVerified
  );

  const remainingAfter = Math.max(
    0,
    remainingBefore - payment.submittedAmount
  );

  const copyTrxId = async () => {
    try {
      await navigator.clipboard.writeText(payment.transactionId);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const canVerify =
    payment.status === "pending" &&
    confirmed &&
    duplicateMatches.length === 0 &&
    payment.submittedAmount > 0 &&
    payment.submittedAmount <= remainingBefore;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-primary/55 p-3 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-review-title"
        className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between gap-3 border-b border-base-300 px-4 py-4 sm:px-6">
          <div>
            <p className="text-[11px] font-bold text-secondary">
              PAYMENT VERIFICATION
            </p>
            <h2
              id="payment-review-title"
              className="mt-1 text-lg font-extrabold text-primary"
            >
              {payment.id}
            </h2>
            <p className="mt-1 text-xs text-muted">
              Order #{payment.orderId}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <StatusBadge status={payment.status} />
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex size-9 items-center justify-center rounded-lg bg-base-200 text-primary"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* MODAL CONTENT */}
        <div className="space-y-4 overflow-y-auto p-4 sm:p-6">

          {/* WARNING */}
          {payment.status === "pending" && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <ShieldAlert
                size={20}
                className="shrink-0 text-amber-700"
              />
              <div>
                <p className="text-xs font-extrabold text-amber-900">
                  ম্যানুয়াল পেমেন্ট যাচাই প্রয়োজন
                </p>
                <p className="mt-1 text-xs leading-6 text-amber-800">
                  শুধু TrxID জমা দেওয়া মানেই পেমেন্ট সফল নয়।
                  আপনার bKash/Nagad/Rocket অ্যাকাউন্টের প্রকৃত
                  Transaction History-তে amount, sender, TrxID
                  এবং receiving account মিলিয়ে যাচাই করুন।
                </p>
              </div>
            </div>
          )}

          {duplicateMatches.length > 0 && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800">
              <AlertTriangle size={18} className="shrink-0" />
              এই payment method ও TrxID অন্য submission-এও আছে।
              Duplicate review না করে verify করা যাবে না।
            </div>
          )}

          {/* CUSTOMER AND TRANSACTION */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-base-300 p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-extrabold text-primary">
                <UserRound size={17} className="text-secondary" />
                কাস্টমার তথ্য
              </h3>

              <InfoRow label="নাম">
                {payment.customer.name}
              </InfoRow>
              <InfoRow label="ফোন">
                {payment.customer.phone}
              </InfoRow>
              <InfoRow label="Order ID">
                <Link
                  to={`/admin/orders/${payment.orderId}`}
                  onClick={onClose}
                  className="text-secondary underline"
                >
                  {payment.orderId}
                </Link>
              </InfoRow>

              <div className="mt-3 flex flex-wrap gap-2">
                <a
                  href={callLink}
                  className="inline-flex items-center gap-2 rounded-lg bg-secondary/10 px-3 py-2 text-xs font-bold text-secondary"
                >
                  <Phone size={14} />
                  Call
                </a>

                {whatsappLink && (
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-3 py-2 text-xs font-bold text-white"
                  >
                    <MessageCircle size={15} />
                    WhatsApp
                  </a>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-base-300 p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-extrabold text-primary">
                <ReceiptText size={17} className="text-secondary" />
                Submitted Transaction
              </h3>

              <InfoRow label="Method">
                <MethodBadge method={payment.method} />
              </InfoRow>

              <InfoRow label="Sender Number">
                {payment.senderPhone}
              </InfoRow>

              <InfoRow label="Submitted Amount">
                {money(payment.submittedAmount)}
              </InfoRow>

              <div className="mt-2 rounded-xl bg-base-200 p-3">
                <p className="text-[11px] text-muted">
                  Transaction ID (TrxID)
                </p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="break-all font-mono text-sm font-extrabold text-primary">
                    {payment.transactionId}
                  </span>

                  <button
                    type="button"
                    onClick={copyTrxId}
                    className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white text-secondary"
                  >
                    {copied ? (
                      <Check size={16} />
                    ) : (
                      <Copy size={16} />
                    )}
                  </button>
                </div>
              </div>

              <p className="mt-3 text-[11px] text-muted">
                Submitted: {formatDate(payment.createdAt)}
              </p>
            </div>
          </div>

          {/* FINANCIAL RECONCILIATION */}
          <div className="rounded-xl border border-base-300 p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-extrabold text-primary">
              <Wallet size={17} className="text-secondary" />
              Order Payment Breakdown
            </h3>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-base-200 p-3">
                <p className="text-[11px] text-muted">
                  Order Total
                </p>
                <p className="mt-2 text-lg font-extrabold text-primary">
                  {money(payment.orderTotal)}
                </p>
              </div>

              <div className="rounded-xl bg-green-50 p-3">
                <p className="text-[11px] text-green-700">
                  Previously Verified
                </p>
                <p className="mt-2 text-lg font-extrabold text-green-800">
                  {money(payment.previousVerified)}
                </p>
              </div>

              <div className="rounded-xl bg-amber-50 p-3">
                <p className="text-[11px] text-amber-700">
                  Remaining Before
                </p>
                <p className="mt-2 text-lg font-extrabold text-amber-900">
                  {money(remainingBefore)}
                </p>
              </div>
            </div>

            {payment.status === "pending" && (
              <div className="mt-3 flex items-center justify-between rounded-xl bg-[#ffe16d]/30 p-3">
                <span className="text-xs font-bold text-primary">
                  Balance after verification
                </span>
                <span className="text-base font-extrabold text-primary">
                  {money(remainingAfter)}
                </span>
              </div>
            )}
          </div>

          {/* PAYMENT NOTE */}
          {payment.note && (
            <div className="rounded-xl bg-base-200 p-4">
              <p className="text-xs font-bold text-primary">
                Customer Note
              </p>
              <p className="mt-2 text-xs text-muted">
                {payment.note}
              </p>
            </div>
          )}

          {/* EXISTING DECISION */}
          {payment.status === "verified" && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-4">
              <p className="flex items-center gap-2 text-xs font-extrabold text-green-800">
                <CheckCircle2 size={17} />
                Payment Verified
              </p>
              <p className="mt-2 text-xs text-green-700">
                Verified by {payment.verifiedBy || "Admin"}
                {" • "}
                {formatDate(payment.verifiedAt)}
              </p>
            </div>
          )}

          {payment.status === "rejected" && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="flex items-center gap-2 text-xs font-extrabold text-red-800">
                <XCircle size={17} />
                Payment Rejected
              </p>
              <p className="mt-2 text-xs text-red-700">
                {payment.rejectionReason}
              </p>
            </div>
          )}

          {/* VERIFICATION CONTROLS */}
          {payment.status === "pending" && (
            <div className="rounded-xl border border-secondary/20 bg-[#faf7fb] p-4">
              <h3 className="flex items-center gap-2 text-sm font-extrabold text-primary">
                <ShieldCheck size={18} className="text-secondary" />
                Admin Verification Decision
              </h3>

              {mode === "review" ? (
                <div className="mt-4">
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-base-300 bg-white p-3">
                    <input
                      type="checkbox"
                      checked={confirmed}
                      onChange={(e) =>
                        setConfirmed(e.target.checked)
                      }
                      className="checkbox checkbox-sm mt-0.5 border-secondary [--chkbg:#76258a] [--chkfg:white]"
                    />
                    <span className="text-xs leading-6 text-primary">
                      আমি প্রকৃত receiving account-এর transaction
                      history দেখে payment method, TrxID, sender
                      number এবং amount মিলিয়ে নিশ্চিত হয়েছি।
                    </span>
                  </label>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={!canVerify}
                      onClick={() => onVerify(payment.id)}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-700 px-4 py-3 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <CheckCircle2 size={16} />
                      Verify Payment
                    </button>

                    <button
                      type="button"
                      onClick={() => setMode("reject")}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-700"
                    >
                      <XCircle size={16} />
                      Reject Payment
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  <label className="block text-xs font-bold text-primary">
                    Rejection Reason
                  </label>

                  <textarea
                    value={rejectReason}
                    onChange={(e) =>
                      setRejectReason(e.target.value)
                    }
                    rows={3}
                    placeholder="কেন পেমেন্ট রিজেক্ট করা হচ্ছে লিখুন..."
                    className="w-full rounded-xl border border-base-300 bg-white p-3 text-xs text-primary outline-none focus:border-secondary"
                  />

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setMode("review")}
                      className="rounded-xl border border-base-300 bg-white px-4 py-3 text-xs font-bold text-primary"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      disabled={!rejectReason.trim()}
                      onClick={() =>
                        onReject(payment.id, rejectReason.trim())
                      }
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-700 px-4 py-3 text-xs font-bold text-white disabled:opacity-40"
                    >
                      <XCircle size={16} />
                      Confirm Rejection
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="flex justify-between gap-3 border-t border-base-300 px-4 py-4 sm:px-6">
          <Link
            to={`/admin/orders/${payment.orderId}`}
            onClick={onClose}
            className="inline-flex items-center gap-2 text-xs font-bold text-secondary"
          >
            View Order
            <ArrowRight size={14} />
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white"
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
  const [payments, setPayments] = useState(demoPayments);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedPaymentId, setSelectedPaymentId] = useState(null);

  const perPage = 8;

  const selectedPayment =
    payments.find((item) => item.id === selectedPaymentId) || null;

  const stats = useMemo(() => {
    const pending = payments.filter(
      (item) => item.status === "pending"
    ).length;

    const verified = payments.filter(
      (item) => item.status === "verified"
    );

    const rejected = payments.filter(
      (item) => item.status === "rejected"
    ).length;

    const verifiedCollection = verified.reduce(
      (sum, item) => sum + item.submittedAmount,
      0
    );

    return {
      pending,
      verified: verified.length,
      rejected,
      verifiedCollection,
    };
  }, [payments]);

  const filteredPayments = useMemo(() => {
    const term = search.trim().toLowerCase();

    return payments
      .filter((payment) => {
        const searchMatch =
          !term ||
          payment.id.toLowerCase().includes(term) ||
          payment.orderId.toLowerCase().includes(term) ||
          payment.customer.name.toLowerCase().includes(term) ||
          payment.customer.phone.includes(term) ||
          payment.senderPhone.includes(term) ||
          payment.transactionId.toLowerCase().includes(term);

        const statusMatch =
          activeTab === "all" || payment.status === activeTab;

        const methodMatch =
          methodFilter === "all" ||
          payment.method === methodFilter;

        let dateMatch = true;

        if (dateFilter !== "all") {
          const date = new Date(payment.createdAt);
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
          methodMatch &&
          dateMatch
        );
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [payments, search, activeTab, methodFilter, dateFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredPayments.length / perPage)
  );

  const currentPage = Math.min(page, totalPages);

  const paginatedPayments = filteredPayments.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  const resetPage = () => setPage(1);

  const resetFilters = () => {
    setSearch("");
    setActiveTab("all");
    setMethodFilter("all");
    setDateFilter("all");
    setPage(1);
  };

  // DEMO-ONLY: these updates are not persisted.
  // In production, call authenticated admin endpoints.
  const handleVerify = (paymentId) => {
    setPayments((prev) =>
      prev.map((payment) =>
        payment.id === paymentId && payment.status === "pending"
          ? {
              ...payment,
              status: "verified",
              verifiedAt: new Date().toISOString(),
              verifiedBy: "Admin",
            }
          : payment
      )
    );

    setSelectedPaymentId(null);
  };

  const handleReject = (paymentId, reason) => {
    setPayments((prev) =>
      prev.map((payment) =>
        payment.id === paymentId && payment.status === "pending"
          ? {
              ...payment,
              status: "rejected",
              rejectionReason: reason,
            }
          : payment
      )
    );

    setSelectedPaymentId(null);
  };

  const tabs = [
    { value: "all", label: "সব পেমেন্ট", count: payments.length },
    {
      value: "pending",
      label: "যাচাই বাকি",
      count: stats.pending,
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

  return (
    <div className="mx-auto max-w-[1600px] space-y-5 pb-10">

      {/* PAGE HEADER */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-primary sm:text-2xl">
            পেমেন্ট ভেরিফিকেশন
          </h1>
          <p className="mt-1 text-xs text-muted">
            bKash, Nagad ও Rocket-এর ম্যানুয়াল পেমেন্ট
            যাচাই ও পরিচালনা করুন।
          </p>
        </div>

        <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-semibold text-secondary shadow-sm">
          <ShieldCheck size={15} />
          Manual Verification
        </span>
      </div>

      {/* 4 KPI CARDS */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="পেমেন্ট যাচাই বাকি"
          subtitle="Pending Verification"
          value={`${stats.pending.toLocaleString("bn-BD")} টি`}
          icon={Clock3}
          iconStyle="bg-amber-100 text-amber-700"
        />

        <StatCard
          title="ভেরিফাইড পেমেন্ট"
          subtitle="Successfully Verified"
          value={`${stats.verified.toLocaleString("bn-BD")} টি`}
          icon={CheckCircle2}
          iconStyle="bg-green-100 text-green-700"
        />

        <StatCard
          title="রিজেক্টেড পেমেন্ট"
          subtitle="Rejected Submissions"
          value={`${stats.rejected.toLocaleString("bn-BD")} টি`}
          icon={XCircle}
          iconStyle="bg-red-100 text-red-700"
        />

        <StatCard
          title="মোট ভেরিফাইড কালেকশন"
          subtitle="Verified Online Payments"
          value={money(stats.verifiedCollection)}
          icon={Wallet}
          iconStyle="bg-purple-100 text-secondary"
        />
      </div>

      {/* IMPORTANT NOTICE */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-white p-4 shadow-sm">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#ffe16d]/40 text-primary">
          <AlertTriangle size={20} />
        </div>

        <div>
          <p className="text-xs font-extrabold text-primary">
            পেমেন্ট যাচাইয়ের গুরুত্বপূর্ণ নির্দেশনা
          </p>
          <p className="mt-1 text-xs leading-6 text-muted">
            TrxID ও sender number কেবল customer-submitted তথ্য।
            receiving account-এর প্রকৃত transaction history-তে
            লেনদেন নিশ্চিত হওয়ার পরেই Verify করুন। COD
            confirmation ও COD collection এই online payment
            verification থেকে আলাদা রাখুন।
          </p>
        </div>
      </div>

      {/* PAYMENT TABLE CONTAINER */}
      <div className="overflow-hidden rounded-2xl border border-base-300/70 bg-white shadow-sm">

        {/* SECTION HEADING */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-base-300 p-4 sm:p-5">
          <div>
            <h2 className="text-base font-extrabold text-primary">
              পেমেন্ট সাবমিশনসমূহ
            </h2>
            <p className="mt-1 text-xs text-muted">
              সকল ম্যানুয়াল ট্রানজেকশন রিকোয়েস্ট
            </p>
          </div>

          <span className="rounded-full bg-secondary/10 px-3 py-1.5 text-xs font-bold text-secondary">
            {filteredPayments.length.toLocaleString("bn-BD")} Results
          </span>
        </div>

        {/* STATUS TABS */}
        <div className="flex gap-2 overflow-x-auto border-b border-base-300 px-4 py-3 sm:px-5">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => {
                setActiveTab(tab.value);
                resetPage();
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
                  activeTab === tab.value
                    ? "bg-white/20"
                    : "bg-white"
                }`}
              >
                {tab.count.toLocaleString("bn-BD")}
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
              placeholder="Order ID, TrxID, Customer, Phone..."
              className="w-full min-w-0 bg-transparent text-xs text-primary outline-none placeholder:text-muted"
            />
          </label>

          <div className="relative">
            <select
              value={methodFilter}
              onChange={(e) => {
                setMethodFilter(e.target.value);
                resetPage();
              }}
              className="h-11 w-full appearance-none rounded-xl border border-base-300 bg-base-200 px-3 pr-9 text-xs font-semibold text-primary outline-none"
            >
              <option value="all">সব পেমেন্ট মাধ্যম</option>
              <option value="bKash">bKash</option>
              <option value="Nagad">Nagad</option>
              <option value="Rocket">Rocket</option>
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
            <RefreshCw size={15} />
            Reset
          </button>
        </div>

        {/* DESKTOP ZEBRA TABLE */}
        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full min-w-[1050px] border-collapse text-left">
            <thead>
              <tr className="bg-[#f3edf5] text-[11px] font-bold text-primary">
                <th className="px-4 py-4">Payment / Date</th>
                <th className="px-4 py-4">Customer</th>
                <th className="px-4 py-4">Order / Product</th>
                <th className="px-4 py-4">Method</th>
                <th className="px-4 py-4">Transaction Details</th>
                <th className="px-4 py-4">Amount</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4 text-right">Action</th>
              </tr>
            </thead>

            <tbody>
              {paginatedPayments.map((payment, index) => (
                <tr
                  key={payment.id}
                  className={`border-b border-base-300/50 transition hover:bg-purple-50/70 ${
                    index % 2 === 0
                      ? "bg-white"
                      : "bg-[#faf7fb]"
                  }`}
                >
                  <td className="px-4 py-4 align-middle">
                    <p className="whitespace-nowrap text-sm font-bold text-primary">
                      {payment.id}
                    </p>
                    <p className="mt-1.5 flex items-center gap-1 text-[10px] text-muted">
                      <CalendarDays size={12} />
                      {formatDate(payment.createdAt)}
                    </p>
                  </td>

                  <td className="px-4 py-4 align-middle">
                    <div className="flex items-center gap-2">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                        <UserRound size={15} />
                      </div>
                      <div>
                        <p className="whitespace-nowrap text-xs font-bold text-primary">
                          {payment.customer.name}
                        </p>
                        <p className="mt-1 text-[10px] text-muted">
                          {payment.customer.phone}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-4 align-middle">
                    <div className="flex min-w-[180px] items-center gap-2.5">
                      <ProductThumb product={payment.product} />
                      <div className="min-w-0">
                        <Link
                          to={`/admin/orders/${payment.orderId}`}
                          className="text-xs font-extrabold text-secondary hover:underline"
                        >
                          #{payment.orderId}
                        </Link>
                        <p className="mt-1 line-clamp-2 max-w-40 text-[11px] text-muted">
                          {payment.product.name}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-4 align-middle">
                    <MethodBadge method={payment.method} />
                  </td>

                  <td className="px-4 py-4 align-middle">
                    <p className="whitespace-nowrap text-xs font-semibold text-primary">
                      {payment.transactionId}
                    </p>
                    <p className="mt-1.5 text-[10px] text-muted">
                      From: {payment.senderPhone}
                    </p>
                  </td>

                  <td className="px-4 py-4 align-middle">
                    <p className="whitespace-nowrap text-sm font-extrabold text-primary">
                      {money(payment.submittedAmount)}
                    </p>
                    <p className="mt-1 text-[10px] text-muted">
                      Order: {money(payment.orderTotal)}
                    </p>
                  </td>

                  <td className="px-4 py-4 align-middle">
                    <StatusBadge status={payment.status} />
                  </td>

                
                  <td className="px-4 py-4 text-right align-middle">
  <div className="flex items-center justify-end gap-2">
    {/* Payment Review */}
    <button
      type="button"
      onClick={() => setSelectedPaymentId(payment.id)}
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-[11px] font-bold transition ${
        payment.status === "pending"
          ? "bg-primary text-white hover:bg-secondary"
          : "border border-secondary/15 bg-secondary/10 text-secondary hover:bg-secondary hover:text-white"
      }`}
    >
      {payment.status === "pending" ? (
        <ShieldCheck size={14} />
      ) : (
        <Eye size={14} />
      )}
      {payment.status === "pending" ? "Review" : "Details"}
    </button>

    {/* View Full Order */}
    <Link
      to={`/admin/orders/${payment.orderId}`}
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-base-300 bg-white px-3 py-2 text-[11px] font-bold text-primary transition hover:border-secondary hover:bg-secondary/10 hover:text-secondary"
    >
      <ShoppingBag size={14} />
      View Order
      <ArrowRight size={13} />
    </Link>
  </div>
</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* MOBILE + TABLET CARDS */}
        <div className="space-y-3 p-3 sm:p-4 lg:hidden">
          {paginatedPayments.map((payment) => (
            <div
              key={payment.id}
              className="overflow-hidden rounded-xl border border-base-300 bg-white"
            >
              <div className="flex items-start justify-between gap-2 bg-base-200/70 p-3">
                <div>
                  <p className="text-xs font-extrabold text-primary">
                    {payment.id}
                  </p>
                  <p className="mt-1 text-[10px] text-muted">
                    {formatDate(payment.createdAt)}
                  </p>
                </div>
                <StatusBadge status={payment.status} />
              </div>

              <div className="space-y-3 p-3">
                <div className="flex items-center gap-3">
                  <ProductThumb product={payment.product} />
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/admin/orders/${payment.orderId}`}
                      className="text-xs font-extrabold text-secondary"
                    >
                      #{payment.orderId}
                    </Link>
                    <p className="mt-1 text-xs font-semibold text-primary">
                      {payment.product.name}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 rounded-lg bg-base-200/60 p-3">
                  <div>
                    <p className="text-[10px] text-muted">Customer</p>
                    <p className="mt-1 text-xs font-bold text-primary">
                      {payment.customer.name}
                    </p>
                    <p className="mt-1 text-[10px] text-muted">
                      {payment.customer.phone}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted">
                      Submitted Amount
                    </p>
                    <p className="mt-1 text-sm font-extrabold text-primary">
                      {money(payment.submittedAmount)}
                    </p>
                    <div className="mt-1">
                      <MethodBadge method={payment.method} />
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-base-300 p-3">
                  <p className="text-[10px] text-muted">TrxID</p>
                  <p className="mt-1 break-all font-mono text-xs font-bold text-primary">
                    {payment.transactionId}
                  </p>
                  <p className="mt-1 text-[10px] text-muted">
                    Sender: {payment.senderPhone}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedPaymentId(payment.id)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-bold text-white"
                >
                  {payment.status === "pending"
                    ? "Review Payment"
                    : "View Details"}
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* EMPTY STATE */}
        {paginatedPayments.length === 0 && (
          <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
            <div className="mb-3 flex size-14 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
              <ReceiptText size={25} />
            </div>
            <h3 className="text-sm font-bold text-primary">
              কোনো পেমেন্ট পাওয়া যায়নি
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
        {filteredPayments.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-base-300 p-4 sm:px-5">
            <p className="text-xs text-muted">
              Showing{" "}
              {((currentPage - 1) * perPage + 1).toLocaleString("bn-BD")}
              {"–"}
              {Math.min(
                currentPage * perPage,
                filteredPayments.length
              ).toLocaleString("bn-BD")}
              {" of "}
              {filteredPayments.length.toLocaleString("bn-BD")}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() =>
                  setPage((prev) => Math.max(1, prev - 1))
                }
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
                  setPage((prev) =>
                    Math.min(totalPages, prev + 1)
                  )
                }
                className="flex size-9 items-center justify-center rounded-lg border border-base-300 text-primary disabled:opacity-40"
              >
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* PAYMENT REVIEW MODAL */}
      {selectedPayment && (
        <PaymentReviewModal
          key={selectedPayment.id}
          payment={selectedPayment}
          allPayments={payments}
          onClose={() => setSelectedPaymentId(null)}
          onVerify={handleVerify}
          onReject={handleReject}
        />
      )}
    </div>
  );
}
