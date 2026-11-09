import { useContext, useEffect, useId, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
import {
  ArrowLeft,
  AlertTriangle,
  Banknote,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Copy,
  ExternalLink,
  Gift,
  History,
  ImageOff,
  Mail,
  MapPin,
  MessageCircle,
  MessageSquareText,
  Package,
  Paintbrush,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  ShieldCheck,
  Truck,
  UserRound,
  Wallet,
  X,
  Loader2,
} from "lucide-react";
import { AuthContext } from "../../providers/AuthProvider";
import { API_URL } from "../../utils/siteConfig";

const COURIER_KEY = "sokhbilash-admin-courier-names";

const ORDER_LABEL = {
  pending: "পেন্ডিং",
  verified: "যাচাইকৃত",
  processing: "প্রসেসিং",
  shipped: "শিপড",
  delivered: "ডেলিভার্ড",
  rejected: "রিজেক্টেড",
  cancelled: "বাতিল",
};

const PAYMENT_LABEL = {
  pending: "যাচাই বাকি",
  partially_paid: "আংশিক পরিশোধিত",
  verified: "পেমেন্ট যাচাইকৃত",
  rejected: "রিজেক্টেড",
  cod_pending: "COD বাকি",
  cod_collected: "COD সংগৃহীত",
};

const METHOD = {
  bkash: "bKash",
  nagad: "Nagad",
  rocket: "Rocket",
  cod: "Cash on Delivery",
};

const NEXT = {
  pending: "verified",
  verified: "processing",
  processing: "shipped",
  shipped: "delivered",
};

const BADGE = {
  pending: "bg-amber-100 text-amber-800",
  verified: "bg-green-100 text-green-800",
  partially_paid: "bg-blue-100 text-blue-800",
  processing: "bg-purple-100 text-purple-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  cancelled: "bg-red-100 text-red-800",
  cod_pending: "bg-amber-100 text-amber-800",
  cod_collected: "bg-green-100 text-green-800",
};

const inputClass =
  "mt-1.5 w-full min-w-0 rounded-xl border border-base-300 bg-base-200/60 px-3 py-2.5 text-sm text-primary outline-none focus:border-secondary disabled:opacity-50";

const cents = (value) => Math.round((Number(value) || 0) * 100);
const num = (value) => Math.round((Number(value) || 0) * 100) / 100;

const money = (value) =>
  `৳${num(value).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

const dueOf = (order) =>
  Math.max(
    0,
    (cents(order.total) - cents(order.payment?.verifiedAmount)) / 100,
  );

const excessOf = (order) =>
  Math.max(
    0,
    (cents(order.payment?.verifiedAmount) - cents(order.total)) / 100,
  );

const refundableOf = (order) =>
  Math.max(
    0,
    (cents(order.payment?.verifiedAmount) -
      cents(order.payment?.refundedAmount)) /
      100,
  );

const inactive = (order) => ["cancelled", "rejected"].includes(order.status);

const uuid = () => {
  if (!globalThis.crypto?.randomUUID) {
    throw new Error("HTTPS অথবা localhost-এ Secure Browser প্রয়োজন।");
  }
  return globalThis.crypto.randomUUID();
};

const validAmount = (text) =>
  /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(String(text).trim()) &&
  Number(text) > 0;

const safeHttps = (value) => {
  if (typeof value !== "string" || !value.trim()) return "";
  try {
    const u = new URL(value.trim());
    return u.protocol === "https:" && !u.username && !u.password ? u.href : "";
  } catch {
    return "";
  }
};

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString("bn-BD", {
        timeZone: "Asia/Dhaka",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
}

function dhakaParts(value = new Date()) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);

  const at = (type) => parts.find((p) => p.type === type)?.value;
  return {
    date: `${at("year")}-${at("month")}-${at("day")}`,
    time: `${at("hour")}:${at("minute")}`,
  };
}

function addDays(date, n) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

function addMonths(date, n) {
  const [y, m, d] = date.split("-").map(Number);
  const base = new Date(Date.UTC(y, m - 1 + n, 1));
  const limit = new Date(
    Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + 1, 0),
  ).getUTCDate();

  return new Date(
    Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), Math.min(d, limit)),
  )
    .toISOString()
    .slice(0, 10);
}

function readCouriers() {
  try {
    const list = JSON.parse(localStorage.getItem(COURIER_KEY) || "[]");
    return Array.isArray(list)
      ? list.filter((x) => typeof x === "string" && x.trim()).slice(0, 20)
      : [];
  } catch {
    return [];
  }
}

function rememberCourier(name) {
  if (!name) return;
  try {
    localStorage.setItem(
      COURIER_KEY,
      JSON.stringify(
        [
          name,
          ...readCouriers().filter(
            (x) => x.toLowerCase() !== name.toLowerCase(),
          ),
        ].slice(0, 20),
      ),
    );
  } catch {
    // Optional browser storage
  }
}

function readWeight(value) {
  const match = String(value || "")
    .trim()
    .match(/^(\d+(?:\.\d+)?)\s*(kg|g)$/i);

  return match
    ? { value: match[1], unit: match[2].toLowerCase() }
    : { value: "", unit: "kg" };
}

function weightPayload(weight) {
  const raw = String(weight.value).trim();
  if (!raw) return "";

  if (!/^\d+(?:\.\d{1,2})?$/.test(raw)) {
    throw new Error("ওজনে সর্বোচ্চ ২ ঘর দশমিক ব্যবহার করো।");
  }

  const value = Number(raw);
  const kg = weight.unit === "g" ? value / 1000 : value;

  if (!Number.isFinite(kg) || kg < 0.1 || kg > 100) {
    throw new Error("Parcel Weight 0.1–100 kg হতে হবে।");
  }

  if (weight.unit === "kg") return `${value} kg`;

  if (!Number.isInteger(value)) {
    throw new Error("Gram পূর্ণসংখ্যা হতে হবে।");
  }

  return value <= 9999 ? `${value} g` : `${Number(kg.toFixed(2))} kg`;
}

function whatsapp(order) {
  const number = String(
    order.shipping?.phone || order.customer?.phone || "",
  ).replace(/\D/g, "");

  const phone = /^01[3-9]\d{8}$/.test(number)
    ? `88${number}`
    : /^8801[3-9]\d{8}$/.test(number)
      ? number
      : "";

  return phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent(
        `SokhBilash থেকে যোগাযোগ করছি। আপনার অর্ডার ${order.orderNumber} সম্পর্কে তথ্য নিশ্চিত করতে চাই।`,
      )}`
    : "";
}

async function adminRequest(user, path, { method = "GET", body, signal } = {}) {
  if (!user) throw new Error("Admin login required");

  const token = await user.getIdToken();
  const res = await fetch(`${API_URL}${path}`, {
    method,
    signal,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || data.success !== true) {
    throw new Error(data.message || `Request failed (${res.status})`);
  }

  return data;
}

// ==========================================
// REUSABLE UI
// ==========================================

function Section({ title, subtitle, icon: Icon, right, children }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-base-300/70 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-base-300/70 px-4 py-4 sm:px-5">
        <div className="flex items-center gap-2.5">
          <Icon size={18} className="shrink-0 text-secondary" />
          <div>
            <h2 className="text-sm font-bold text-primary sm:text-base">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-0.5 text-[11px] text-muted">{subtitle}</p>
            )}
          </div>
        </div>
        {right}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

function InfoRow({ label, value, strong = false }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-base-200 py-2.5 last:border-0">
      <span className="text-xs text-muted">{label}</span>
      <div
        className={`max-w-[67%] break-words text-right ${
          strong ? "text-sm font-bold" : "text-xs font-semibold"
        } text-primary`}
      >
        {value ?? "—"}
      </div>
    </div>
  );
}

function StatusBadge({ value, payment = false }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ${
        BADGE[value] || "bg-base-200 text-muted"
      }`}
    >
      {payment
        ? PAYMENT_LABEL[value] || value || "—"
        : ORDER_LABEL[value] || value || "—"}
    </span>
  );
}

function Photo({ src, alt = "Image", avatar = false }) {
  const [failed, setFailed] = useState("");

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden border border-base-300 bg-base-200 ${
        avatar ? "size-11 rounded-full" : "size-16 rounded-xl sm:size-20"
      }`}
    >
      {src && src !== failed ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => setFailed(src)}
          className="size-full object-cover"
        />
      ) : avatar ? (
        <UserRound size={21} className="text-secondary" />
      ) : (
        <ImageOff size={21} className="text-muted" />
      )}
    </div>
  );
}

// ==========================================
// ORDER PRODUCT CARD
// ==========================================

function OrderItemCard({ item }) {
  const custom = item.customization || {};

  const fields = [
    ["নাম", custom.name],
    ["তারিখ", custom.date || custom.dob],
    ["বার্তা", custom.message || custom.engraving],
    ["নোট", custom.note || custom.customNote],
  ].filter(([, value]) => Boolean(value));

  const photos = Array.isArray(custom.photos) ? custom.photos : [];

  const options = Object.entries(item.selectedOptions || {}).filter(
    ([, value]) => Boolean(value),
  );

  const qty = Number(item.quantity) || 1;
  const price = Number(item.unitPrice ?? item.price ?? 0);

  return (
    <article className="overflow-hidden rounded-xl border-2 border-dashed border-secondary/25 bg-white p-3 sm:p-4">
      <div className="flex min-w-0 items-start gap-3">
        <Photo src={item.image} alt={item.name} />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="line-clamp-2 text-sm font-bold leading-5 text-primary">
                {item.name || "Product"}
              </h3>

              {item.variantTitle && (
                <p className="mt-1 truncate text-[11px] text-muted">
                  {item.variantTitle}
                </p>
              )}

              {item.sku && (
                <p className="mt-1 truncate text-[11px] text-muted">
                  SKU: {item.sku}
                </p>
              )}
            </div>

            <span className="shrink-0 rounded-lg bg-secondary/10 px-2 py-1 text-xs font-bold text-secondary">
              × {qty}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap items-end justify-between gap-2">
            <p className="text-xs text-muted">প্রতি পিস {money(price)}</p>
            <p className="text-sm font-bold text-primary">
              মোট {money(item.lineTotal ?? price * qty)}
            </p>
          </div>
        </div>
      </div>

      {(options.length > 0 || item.packaging) && (
        <div className="mt-3 flex flex-wrap gap-1.5 border-t border-base-300/70 pt-3">
          {options.map(([key, value]) => (
            <span
              key={key}
              className="rounded-md bg-base-200 px-2 py-1 text-[11px] text-primary"
            >
              {key}: {String(value)}
            </span>
          ))}

          <span className="rounded-md bg-secondary/10 px-2 py-1 text-[11px] text-secondary">
            {item.packaging === "premium" ? "Premium Box" : "Regular Box"}
          </span>
        </div>
      )}

      {(fields.length > 0 ||
        photos.length > 0 ||
        (custom.mode && custom.mode !== "none")) && (
        <details className="group mt-3 rounded-xl border border-secondary/15 bg-secondary/5">
          <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2.5 text-xs font-bold text-secondary [&::-webkit-details-marker]:hidden">
            <span className="flex items-center gap-2">
              <Paintbrush size={15} />
              কাস্টমাইজেশন ডিটেইলস
            </span>
            <ChevronDown
              size={15}
              className="transition group-open:rotate-180"
            />
          </summary>

          <div className="space-y-2 border-t border-secondary/15 p-3">
            {fields.map(([label, value]) => (
              <div key={label} className="rounded-lg bg-white p-2.5">
                <p className="text-[11px] font-semibold text-secondary">
                  {label}
                </p>
                <p className="mt-1 whitespace-pre-wrap break-words text-xs text-primary">
                  {String(value)}
                </p>
              </div>
            ))}

            {photos.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-bold text-primary">
                  Customer Photos ({photos.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {photos.map((photo, i) => {
                    const src = typeof photo === "string" ? photo : photo?.url;
                    const url = safeHttps(src);

                    return url ? (
                      <a
                        key={photo?.id || i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <img
                          src={url}
                          alt={`Customer photo ${i + 1}`}
                          loading="lazy"
                          className="size-16 rounded-lg border border-base-300 object-cover"
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
}

// ==========================================
// MODAL COMPONENTS
// ==========================================

function Modal({ title, subtitle, busy, onClose, children }) {
  useEffect(() => {
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = old;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-primary/60 p-3 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="flex max-h-[94vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-base-300 px-4 py-4 sm:px-5">
          <div>
            <h2 className="text-base font-bold text-primary">{title}</h2>
            {subtitle && <p className="mt-1 text-xs text-muted">{subtitle}</p>}
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg bg-base-200 p-2 text-primary disabled:opacity-50"
          >
            <X size={17} />
          </button>
        </div>
        <div className="space-y-4 overflow-y-auto p-4 sm:p-5">{children}</div>
      </section>
    </div>
  );
}

function ModalActions({
  busy,
  onClose,
  label = "Save",
  disabled = false,
  danger = false,
}) {
  return (
    <div className="flex justify-end gap-2">
      <button
        type="button"
        onClick={onClose}
        disabled={busy}
        className="rounded-xl border border-base-300 px-4 py-2.5 text-xs font-bold text-primary disabled:opacity-50"
      >
        Back
      </button>
      <button
        type="submit"
        disabled={busy || disabled}
        className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-white disabled:opacity-40 ${
          danger ? "bg-red-700" : "bg-primary"
        }`}
      >
        {busy ? (
          <Loader2 size={15} className="animate-spin" />
        ) : (
          <Save size={15} />
        )}
        {label}
      </button>
    </div>
  );
}

// ==========================================
// PAYMENT VERIFICATION MODAL
// ==========================================

function PaymentModal({ order, busy, error, onClose, onSubmit }) {
  const payment = order.payment || {};
  const pending = order.status === "pending" && payment.status === "pending";

  const previous = num(payment.verifiedAmount);
  const claimed = num(payment.claimedAmount);

  const [mode, setMode] = useState("verify");
  const [amount, setAmount] = useState(String(Math.max(0, claimed)));
  const [reason, setReason] = useState("");
  const [checked, setChecked] = useState(false);

  const valid = validAmount(amount);
  const cumulative = num(previous + Number(amount));

  return (
    <Modal
      title="Payment Verification"
      subtitle={`${order.orderNumber} · ${
        METHOD[payment.method] || payment.method
      }`}
      busy={busy}
      onClose={onClose}
    >
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-6 text-amber-900">
        <AlertTriangle size={16} className="mr-2 inline" />
        বিকাশ/নগদ/রকেট Receiving Account-এ বাস্তবে যত টাকা এসেছে, TrxID ও Sender
        মিলিয়ে তবেই Verify করুন। Customer claim বেশি/কম হতে পারে।
      </div>

      <div className="rounded-xl border border-base-300 p-3">
        <InfoRow label="Sender" value={payment.senderPhone || "—"} />
        <InfoRow
          label="TrxID"
          value={
            <span className="break-all font-mono">{payment.trxId || "—"}</span>
          }
        />
        <InfoRow label="Claimed" value={money(claimed)} />
        <InfoRow
          label="Previously Received (Online + Cash)"
          value={money(previous)}
        />
        <InfoRow label="Order Total" value={money(order.total)} strong />
      </div>

      {pending ? (
        <div className="rounded-xl border border-secondary/20 bg-[#faf7fb] p-3">
          <div className="mb-3 flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => setMode("verify")}
              className={`rounded-lg px-3 py-2 text-xs font-bold ${
                mode === "verify"
                  ? "bg-secondary text-white"
                  : "bg-white text-primary"
              }`}
            >
              Verify
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setMode("reject")}
              className={`rounded-lg px-3 py-2 text-xs font-bold ${
                mode === "reject"
                  ? "bg-red-700 text-white"
                  : "bg-white text-red-700"
              }`}
            >
              Reject
            </button>
          </div>

          {mode === "verify" ? (
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (valid && checked) {
                  onSubmit({
                    decision: "verify",
                    verifiedAmount: cumulative,
                  });
                }
              }}
            >
              <label className="block text-xs font-bold text-primary">
                এই Proof-এ প্রকৃত নতুন Received Amount (৳)
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setChecked(false);
                  }}
                  disabled={busy}
                  className={inputClass}
                />
              </label>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-white p-3 text-xs">
                  <p className="text-muted">After Verification Received</p>
                  <p className="mt-1 font-bold text-primary">
                    {valid ? money(cumulative) : "—"}
                  </p>
                </div>
                <div className="rounded-lg bg-gold-soft/30 p-3 text-xs">
                  <p className="text-muted">After Verification Difference</p>
                  <p className="mt-1 font-bold text-primary">
                    {valid
                      ? cumulative > num(order.total)
                        ? `Excess ${money(cumulative - num(order.total))}`
                        : `Due ${money(num(order.total) - cumulative)}`
                      : "—"}
                  </p>
                </div>
              </div>

              <label className="flex cursor-pointer items-start gap-2 rounded-lg bg-white p-3 text-xs leading-5 text-primary">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => setChecked(e.target.checked)}
                  disabled={busy}
                  className="checkbox checkbox-secondary checkbox-xs mt-0.5"
                />
                Receiving Account-এ প্রকৃত টাকা, TrxID ও Sender যাচাই করেছি।
              </label>

              {valid && cumulative > num(order.total) && (
                <p className="rounded-lg bg-emerald-50 p-3 text-xs leading-5 text-emerald-800">
                  অতিরিক্ত পেমেন্ট যাচাই হলে Phone Confirmation-এ Customer-এর
                  সম্মতি নিয়ে Refund বা Extra Product নির্বাচন করতে হবে।
                </p>
              )}

              {error && (
                <p
                  role="alert"
                  className="rounded-lg bg-red-50 p-3 text-xs text-red-700"
                >
                  {error}
                </p>
              )}

              <ModalActions
                busy={busy}
                onClose={onClose}
                disabled={!valid || !checked}
                label="Verify Actual Amount"
              />
            </form>
          ) : (
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (reason.trim()) {
                  onSubmit({
                    decision: "reject",
                    reason: reason.trim(),
                  });
                }
              }}
            >
              <label className="block text-xs font-bold text-primary">
                Rejection Reason
                <textarea
                  rows={3}
                  maxLength={500}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  disabled={busy}
                  className={inputClass}
                  placeholder="TrxID not found, wrong sender, etc."
                />
              </label>

              {previous > 0 && (
                <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
                  আগে পাওয়া {money(previous)} টাকা reject করার পর Refund
                  obligation তৈরি হবে।
                </p>
              )}

              {error && <p className="text-xs text-red-700">{error}</p>}

              <ModalActions
                busy={busy}
                onClose={onClose}
                disabled={!reason.trim()}
                danger
                label="Reject Payment"
              />
            </form>
          )}
        </div>
      ) : (
        <div className="rounded-xl bg-secondary/5 p-4 text-xs leading-6 text-muted">
          এই Proof আর Pending নয়। Status:{" "}
          <strong>{PAYMENT_LABEL[payment.status] || payment.status}</strong>।
          একই TrxID পুনরায় Verify করা যাবে না।
        </div>
      )}
    </Modal>
  );
}

// ==========================================
// PHONE CONFIRMATION MODAL
// ==========================================

function PhoneModal({ order, busy, error, onClose, onSubmit }) {
  const excess = excessOf(order);
  const existing = order.payment?.excessResolution;

  const [confirmed, setConfirmed] = useState(true);
  const [note, setNote] = useState(order.phoneConfirmation?.note || "");
  const [resolution, setResolution] = useState(existing?.type || "");

  const needsAgreement = confirmed && excess > 0;

  return (
    <Modal
      title="Phone Confirmation"
      subtitle={`Customer-এর সঙ্গে কথা বলে Order ${order.orderNumber} নিশ্চিত করুন`}
      busy={busy}
      onClose={onClose}
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit({
            confirmed,
            note: note.trim(),
            ...(needsAgreement && resolution
              ? { excessResolution: resolution }
              : {}),
          });
        }}
      >
        <div className="flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => setConfirmed(true)}
            className={`flex-1 rounded-xl px-3 py-3 text-xs font-bold ${
              confirmed ? "bg-secondary text-white" : "bg-base-200 text-primary"
            }`}
          >
            Phone Confirmed
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => setConfirmed(false)}
            className={`flex-1 rounded-xl px-3 py-3 text-xs font-bold ${
              !confirmed ? "bg-red-700 text-white" : "bg-base-200 text-primary"
            }`}
          >
            Revoke
          </button>
        </div>

        <p className="rounded-lg bg-secondary/5 p-3 text-xs leading-6 text-muted">
          Phone Confirmation সব ধরনের অর্ডারে প্রয়োজন—COD এবং bKash/Nagad/Rocket
          উভয় ক্ষেত্রেই। কেবল Confirm করলে টাকা প্রাপ্ত বলে গণ্য হবে না।
        </p>

        {needsAgreement && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
            <p className="text-xs font-bold text-emerald-900">
              যাচাইকৃত অতিরিক্ত: {money(excess)}
            </p>
            <p className="mt-1 text-xs leading-5 text-emerald-800">
              কাস্টমারের সম্মতি অনুযায়ী একটি Resolution নির্বাচন করুন।
            </p>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => setResolution("refund")}
                className={`rounded-lg px-3 py-2 text-xs font-bold ${
                  resolution === "refund"
                    ? "bg-emerald-700 text-white"
                    : "bg-white text-primary"
                }`}
              >
                Refund Money
              </button>

              <button
                type="button"
                disabled={busy}
                onClick={() => setResolution("extra_product")}
                className={`rounded-lg px-3 py-2 text-xs font-bold ${
                  resolution === "extra_product"
                    ? "bg-emerald-700 text-white"
                    : "bg-white text-primary"
                }`}
              >
                Extra Product
              </button>
            </div>
          </div>
        )}

        <label className="block text-xs font-bold text-primary">
          Call Note {needsAgreement && "*"}
          <textarea
            rows={3}
            maxLength={500}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={busy}
            placeholder="কাস্টমার কী Confirm করেছেন / অতিরিক্ত টাকার সিদ্ধান্ত..."
            className={inputClass}
          />
        </label>

        {error && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 p-3 text-xs text-red-700"
          >
            {error}
          </p>
        )}

        <ModalActions
          busy={busy}
          onClose={onClose}
          disabled={needsAgreement && (!resolution || !note.trim())}
          label={confirmed ? "Confirm Customer" : "Revoke Confirmation"}
          danger={!confirmed}
        />
      </form>
    </Modal>
  );
}

// ==========================================
// DELIVERY CASH COLLECTION MODAL
// ==========================================

function CashModal({ order, busy, error, onClose, onSubmit }) {
  const due = dueOf(order);

  const [id, setId] = useState(uuid);
  const [amount, setAmount] = useState(String(due));
  const [note, setNote] = useState("");
  const [agreed, setAgreed] = useState(false);

  const valid = validAmount(amount) && cents(amount) <= cents(due);

  const newId = () => {
    setId(uuid());
    setAgreed(false);
  };

  return (
    <Modal
      title="Collect Delivery Cash"
      subtitle={`#${order.orderNumber} · ${
        METHOD[order.payment?.method] || "Payment"
      }`}
      busy={busy}
      onClose={onClose}
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (valid && agreed && note.trim()) {
            onSubmit({
              collectionId: id,
              amount: Number(amount),
              note: note.trim(),
            });
          }
        }}
      >
        <div className="grid grid-cols-3 gap-2 text-xs">
          {[
            ["Order Total", order.total],
            ["Received", order.payment?.verifiedAmount],
            ["Actual Due", due],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-base-200 p-3">
              <p className="text-muted">{label}</p>
              <p className="mt-1 font-bold text-primary">{money(value)}</p>
            </div>
          ))}
        </div>

        <p className="rounded-xl bg-amber-50 p-3 text-xs leading-6 text-amber-900">
          শুধু হাতে পাওয়া টাকা Record করুন। Full/Partial Cash Collection করা
          যাবে; একই Request Retry করলে একই Collection ID ব্যবহার হবে।
        </p>

        <label className="block text-xs font-bold text-primary">
          Collected Cash (৳)
          <input
            type="number"
            min="0.01"
            step="0.01"
            max={due}
            value={amount}
            disabled={busy}
            onChange={(e) => {
              setAmount(e.target.value);
              newId();
            }}
            className={inputClass}
          />
        </label>

        <label className="block text-xs font-bold text-primary">
          Collection Note
          <textarea
            rows={2}
            maxLength={500}
            value={note}
            disabled={busy}
            onChange={(e) => {
              setNote(e.target.value);
              newId();
            }}
            className={inputClass}
            placeholder="কুরিয়ার থেকে পাওয়া নগদ টাকার বিবরণ"
          />
        </label>

        <label className="flex cursor-pointer items-start gap-2 rounded-xl bg-secondary/5 p-3 text-xs leading-5">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            disabled={busy}
            className="checkbox checkbox-secondary checkbox-xs mt-0.5"
          />
          উপরের টাকা বাস্তবে গ্রহণ করেছি।
        </label>

        {error && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 p-3 text-xs text-red-700"
          >
            {error}
          </p>
        )}

        <ModalActions
          busy={busy}
          onClose={onClose}
          disabled={!valid || !agreed || !note.trim()}
          label="Record Cash"
        />
      </form>
    </Modal>
  );
}

// ==========================================
// OVERPAYMENT SETTLEMENT MODAL
// ==========================================

function ExcessModal({ order, busy, error, onClose, onSubmit }) {
  const excess = excessOf(order);
  const resolution = order.payment?.excessResolution || {};
  const isRefund = resolution.type === "refund";

  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [ack, setAck] = useState(false);

  const [products, setProducts] = useState([
    {
      name: "",
      sku: "",
      quantity: "1",
      unitPrice: String(excess),
    },
  ]);

  const productTotal = products.reduce(
    (sum, p) => sum + cents(p.unitPrice) * Number(p.quantity || 0),
    0,
  );

  const productsValid =
    products.length > 0 &&
    products.length <= 20 &&
    products.every(
      (p) =>
        p.name.trim() &&
        validAmount(p.unitPrice) &&
        Number.isInteger(Number(p.quantity)) &&
        Number(p.quantity) >= 1 &&
        Number(p.quantity) <= 100,
    ) &&
    productTotal === cents(excess);

  const valid = Boolean(
    note.trim() && ack && (isRefund ? reference.trim() : productsValid),
  );

  const updateProduct = (index, key, value) =>
    setProducts((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [key]: value } : p)),
    );

  return (
    <Modal
      title="Complete Overpayment Settlement"
      subtitle={`${order.orderNumber} · Excess ${money(excess)}`}
      busy={busy}
      onClose={onClose}
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!valid) return;

          onSubmit({
            completed: true,
            note: note.trim(),
            ...(isRefund
              ? { reference: reference.trim() }
              : {
                  extraProducts: products.map((p) => ({
                    name: p.name.trim(),
                    sku: p.sku.trim(),
                    quantity: Number(p.quantity),
                    unitPrice: Number(p.unitPrice),
                  })),
                }),
          });
        }}
      >
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs leading-6 text-emerald-900">
          <strong>Customer agreed:</strong>{" "}
          {isRefund ? "Refund Money" : "Extra Products"}
          <p>
            সমমূল্য: {money(resolution.amount)} · এখনো{" "}
            {resolution.status || "pending"}
          </p>
        </div>

        {isRefund ? (
          <label className="block text-xs font-bold text-primary">
            Actual Refund Transaction / Receipt Reference *
            <input
              value={reference}
              maxLength={150}
              onChange={(e) => setReference(e.target.value)}
              disabled={busy}
              placeholder="Transaction reference after sending refund"
              className={inputClass}
            />
          </label>
        ) : (
          <div className="space-y-3">
            <p className="text-xs font-bold text-primary">
              বাস্তবে দেওয়া অতিরিক্ত পণ্যসমূহ
            </p>

            {products.map((p, i) => (
              <div key={i} className="rounded-xl border border-base-300 p-3">
                <div className="grid grid-cols-2 gap-2">
                  <label className="col-span-2 text-xs text-primary">
                    Product Name
                    <input
                      maxLength={200}
                      value={p.name}
                      onChange={(e) => updateProduct(i, "name", e.target.value)}
                      disabled={busy}
                      className={inputClass}
                    />
                  </label>

                  <label className="col-span-2 text-xs text-primary">
                    SKU (optional)
                    <input
                      maxLength={100}
                      value={p.sku}
                      onChange={(e) => updateProduct(i, "sku", e.target.value)}
                      disabled={busy}
                      className={inputClass}
                    />
                  </label>

                  <label className="text-xs text-primary">
                    Quantity
                    <input
                      type="number"
                      min="1"
                      max="100"
                      step="1"
                      value={p.quantity}
                      onChange={(e) =>
                        updateProduct(i, "quantity", e.target.value)
                      }
                      disabled={busy}
                      className={inputClass}
                    />
                  </label>

                  <label className="text-xs text-primary">
                    Unit Price (৳)
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={p.unitPrice}
                      onChange={(e) =>
                        updateProduct(i, "unitPrice", e.target.value)
                      }
                      disabled={busy}
                      className={inputClass}
                    />
                  </label>
                </div>

                <button
                  type="button"
                  disabled={busy || products.length === 1}
                  onClick={() =>
                    setProducts((prev) => prev.filter((_, n) => n !== i))
                  }
                  className="mt-2 text-xs text-red-600 disabled:opacity-30"
                >
                  Remove
                </button>
              </div>
            ))}

            <button
              type="button"
              disabled={busy || products.length >= 20}
              onClick={() =>
                setProducts((prev) => [
                  ...prev,
                  { name: "", sku: "", quantity: "1", unitPrice: "" },
                ])
              }
              className="text-xs font-bold text-secondary"
            >
              + Add Product
            </button>

            <p
              className={`rounded-lg p-3 text-xs font-bold ${
                productsValid
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-amber-50 text-amber-800"
              }`}
            >
              পণ্যের মোট মূল্য {money(productTotal / 100)} · প্রয়োজন{" "}
              {money(excess)} (সমান হতে হবে)
            </p>
          </div>
        )}

        <label className="block text-xs font-bold text-primary">
          Completion Note *
          <textarea
            rows={3}
            maxLength={500}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={busy}
            className={inputClass}
            placeholder="Refund পাঠানো বা পণ্য হস্তান্তরের বিবরণ"
          />
        </label>

        <label className="flex cursor-pointer items-start gap-2 rounded-lg bg-secondary/5 p-3 text-xs leading-5 text-primary">
          <input
            type="checkbox"
            checked={ack}
            onChange={(e) => setAck(e.target.checked)}
            disabled={busy}
            className="checkbox checkbox-secondary checkbox-xs mt-0.5"
          />
          আমি নিশ্চিত করছি,{" "}
          {isRefund
            ? "টাকা বাস্তবে ফেরত পাঠানো হয়েছে"
            : "অতিরিক্ত পণ্য বাস্তবে প্রদান করা হয়েছে"}
          ।
        </label>

        {error && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 p-3 text-xs text-red-700"
          >
            {error}
          </p>
        )}

        <ModalActions
          busy={busy}
          onClose={onClose}
          disabled={!valid}
          label="Record Settlement Completed"
        />
      </form>
    </Modal>
  );
}

// ==========================================
// CANCELLATION REFUND MODAL
// ==========================================

function RefundModal({ order, busy, error, onClose, onSubmit }) {
  const pending = refundableOf(order);

  const [id, setId] = useState(uuid);
  const [amount, setAmount] = useState(String(pending));
  const [method, setMethod] = useState("bkash");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [ack, setAck] = useState(false);

  const refreshId = () => {
    setId(uuid());
    setAck(false);
  };

  const valid =
    validAmount(amount) &&
    cents(amount) <= cents(pending) &&
    Boolean(reference.trim() && note.trim() && ack);

  return (
    <Modal
      title="Record Cancellation / Rejection Refund"
      subtitle={`#${order.orderNumber} · Return Remaining ${money(pending)}`}
      busy={busy}
      onClose={onClose}
    >
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (valid) {
            onSubmit({
              completed: true,
              refundId: id,
              amount: Number(amount),
              method,
              reference: reference.trim(),
              note: note.trim(),
            });
          }
        }}
      >
        <div className="grid grid-cols-3 gap-2 text-xs">
          {[
            ["Received", order.payment?.verifiedAmount],
            ["Already Refunded", order.payment?.refundedAmount],
            ["Remaining Refund", pending],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-base-200 p-3">
              <p className="text-muted">{label}</p>
              <p className="mt-1 font-bold text-primary">{money(value)}</p>
            </div>
          ))}
        </div>

        <p className="rounded-lg bg-amber-50 p-3 text-xs leading-6 text-amber-900">
          টাকা বাস্তবে ফেরত পাঠানোর পরই Save করবেন। Partial Refund সম্ভব। একই
          Submission Retry করলে Refund ID একই থাকবে।
        </p>

        <label className="block text-xs font-bold text-primary">
          Refunded Amount (৳)
          <input
            type="number"
            min="0.01"
            max={pending}
            step="0.01"
            value={amount}
            disabled={busy}
            onChange={(e) => {
              setAmount(e.target.value);
              refreshId();
            }}
            className={inputClass}
          />
        </label>

        <label className="block text-xs font-bold text-primary">
          Refund Method
          <select
            value={method}
            onChange={(e) => {
              setMethod(e.target.value);
              refreshId();
            }}
            disabled={busy}
            className={inputClass}
          >
            {[
              ["bkash", "bKash"],
              ["nagad", "Nagad"],
              ["rocket", "Rocket"],
              ["bank", "Bank"],
              ["cash", "Cash"],
              ["other", "Other"],
            ].map(([value, label]) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-xs font-bold text-primary">
          Actual Refund Reference *
          <input
            maxLength={150}
            value={reference}
            onChange={(e) => {
              setReference(e.target.value);
              refreshId();
            }}
            disabled={busy}
            className={inputClass}
            placeholder="Actual refund TrxID / receipt"
          />
        </label>

        <label className="block text-xs font-bold text-primary">
          Refund Note *
          <textarea
            rows={3}
            maxLength={500}
            value={note}
            onChange={(e) => {
              setNote(e.target.value);
              refreshId();
            }}
            disabled={busy}
            className={inputClass}
            placeholder="Recipient and refund details"
          />
        </label>

        <label className="flex cursor-pointer items-start gap-2 rounded-lg bg-secondary/5 p-3 text-xs leading-5">
          <input
            type="checkbox"
            checked={ack}
            onChange={(e) => setAck(e.target.checked)}
            disabled={busy}
            className="checkbox checkbox-secondary checkbox-xs mt-0.5"
          />
          আমি নিশ্চিত করছি, টাকা বাস্তবে গ্রাহকের কাছে ফেরত দেওয়া হয়েছে।
        </label>

        {error && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 p-3 text-xs text-red-700"
          >
            {error}
          </p>
        )}

        <ModalActions
          busy={busy}
          onClose={onClose}
          disabled={!valid}
          danger
          label="Record Actual Refund"
        />
      </form>
    </Modal>
  );
}

// ==========================================
// COURIER SECTION
// ==========================================

function CourierSection({ order, saving, onSave }) {
  const courier = order.courier || {};
  const htmlId = useId();

  const makeForm = () => {
    const eta = dhakaParts(order.estimatedDelivery);
    return {
      name: courier.name || "",
      trackingNumber: courier.trackingNumber || "",
      trackingUrl: courier.trackingUrl || "",
      weight: readWeight(courier.parcelWeight),
      etaDate: eta?.date || "",
      etaTime: eta?.time || "18:00",
    };
  };

  const [form, setForm] = useState(makeForm);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [savedNames, setSavedNames] = useState(readCouriers);

  const [range] = useState(() => {
    const today = dhakaParts().date;
    return {
      min: addDays(today, 1),
      max: addMonths(today, 6),
    };
  });

  const update = (key, value) =>
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));

  const tracking = safeHttps(courier.trackingUrl);
  const editable = !inactive(order) && order.status !== "delivered";

  const start = () => {
    const f = makeForm();
    const names = readCouriers();

    setSavedNames(names);
    setForm({
      ...f,
      name: f.name || names[0] || "",
    });
    setError("");
    setEditing(true);
  };

  const cancel = () => {
    setEditing(false);
    setForm(makeForm());
    setError("");
  };

  const convertUnit = (unit) => {
    setForm((prev) => {
      const v = Number(prev.weight.value);
      if (!prev.weight.value || !Number.isFinite(v)) {
        return {
          ...prev,
          weight: { value: "", unit },
        };
      }

      const n =
        unit === "g" && prev.weight.unit === "kg"
          ? v * 1000
          : unit === "kg" && prev.weight.unit === "g"
            ? v / 1000
            : v;

      return {
        ...prev,
        weight: {
          value: String(Number(n.toFixed(3))),
          unit,
        },
      };
    });
  };

  async function submit(e) {
    e.preventDefault();
    if (saving) return;
    setError("");

    try {
      const name = form.name.trim();
      const trackingNumber = form.trackingNumber.trim();
      const trackingUrl = form.trackingUrl.trim();
      const parcelWeight = weightPayload(form.weight);

      if (!name && (trackingNumber || trackingUrl || parcelWeight)) {
        throw new Error("Courier Name ছাড়া Tracking/Weight দেওয়া যাবে না।");
      }
      if (trackingUrl && !trackingNumber) {
        throw new Error("Tracking URL-এর জন্য Tracking ID প্রয়োজন।");
      }
      if (trackingUrl && !safeHttps(trackingUrl)) {
        throw new Error("Valid HTTPS Tracking URL দিন।");
      }
      if (
        order.status === "shipped" &&
        (!name || !trackingNumber || !form.etaDate)
      ) {
        throw new Error(
          "Shipped Order-এর Courier Name, Tracking ID ও ETA থাকতে হবে।",
        );
      }

      const payload = {
        name,
        trackingNumber,
        trackingUrl,
        parcelWeight,
      };

      const previous = dhakaParts(order.estimatedDelivery);
      const oldETA = previous ? `${previous.date}T${previous.time}` : "";
      const nextETA = form.etaDate ? `${form.etaDate}T${form.etaTime}` : "";

      if (oldETA !== nextETA) {
        if (!form.etaDate) {
          if (order.status === "shipped") {
            throw new Error("Shipped Order-এর ETA মুছা যাবে না।");
          }
          payload.estimatedDelivery = null;
        } else {
          if (form.etaDate < range.min || form.etaDate > range.max) {
            throw new Error("নতুন ETA আগামীকাল থেকে ৬ মাসের মধ্যে দিতে হবে।");
          }
          if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(form.etaTime)) {
            throw new Error("Expected Delivery Time ঠিক নয়।");
          }

          const d = new Date(`${form.etaDate}T${form.etaTime}:00+06:00`);

          if (
            Number.isNaN(d.getTime()) ||
            dhakaParts(d)?.date !== form.etaDate
          ) {
            throw new Error("Invalid Delivery Date।");
          }

          payload.estimatedDelivery = d.toISOString();
        }
      }

      await onSave(payload);
      rememberCourier(name);
      setEditing(false);
    } catch (err) {
      setError(err.message || "Logistics save failed");
    }
  }

  return (
    <Section
      title="লজিস্টিকস ও কুরিয়ার"
      subtitle="Courier, Parcel & Expected Delivery"
      icon={Truck}
      right={
        editable && !editing ? (
          <button
            type="button"
            onClick={start}
            className="inline-flex items-center gap-1 rounded-lg bg-secondary/10 px-3 py-2 text-xs font-bold text-secondary"
          >
            <Pencil size={14} />
            Edit
          </button>
        ) : null
      }
    >
      {!editing ? (
        <div>
          {courier.name || courier.trackingNumber || order.estimatedDelivery ? (
            <>
              <InfoRow label="Courier Name" value={courier.name || "—"} />
              <InfoRow
                label="Tracking ID"
                value={courier.trackingNumber || "—"}
              />

              {courier.parcelWeight && (
                <InfoRow label="Parcel Weight" value={courier.parcelWeight} />
              )}

              {order.estimatedDelivery && (
                <InfoRow
                  label="Expected Delivery"
                  value={formatDate(order.estimatedDelivery)}
                />
              )}

              {tracking && (
                <a
                  href={tracking}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-2 rounded-lg bg-secondary/10 px-3 py-2 text-xs font-semibold text-secondary"
                >
                  <Truck size={14} />
                  Open Courier Tracking
                  <ExternalLink size={13} />
                </a>
              )}
            </>
          ) : (
            <p className="rounded-lg bg-secondary/5 p-3 text-xs leading-6 text-muted">
              অর্ডার প্রস্তুত হলে কুরিয়ার ও সম্ভাব্য ডেলিভারি তথ্য যোগ করুন।
            </p>
          )}
        </div>
      ) : (
        <form noValidate onSubmit={submit} className="space-y-3">
          <label className="block text-xs font-bold text-primary">
            Courier Name
            <input
              list={`${htmlId}-couriers`}
              maxLength={150}
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              disabled={saving}
              placeholder="Steadfast / Pathao / RedX"
              className={inputClass}
            />
            <datalist id={`${htmlId}-couriers`}>
              {savedNames.map((x) => (
                <option key={x} value={x} />
              ))}
            </datalist>
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-bold text-primary">
              Tracking Number
              <input
                maxLength={150}
                value={form.trackingNumber}
                onChange={(e) => update("trackingNumber", e.target.value)}
                disabled={saving}
                className={inputClass}
              />
            </label>

            <label className="block text-xs font-bold text-primary">
              Tracking URL (HTTPS)
              <input
                type="url"
                maxLength={2048}
                value={form.trackingUrl}
                onChange={(e) => update("trackingUrl", e.target.value)}
                disabled={saving}
                placeholder="https://..."
                className={inputClass}
              />
            </label>
          </div>

          <div>
            <p className="text-xs font-bold text-primary">Parcel Weight</p>
            <div className="mt-1.5 flex gap-2">
              <input
                type="number"
                min={form.weight.unit === "kg" ? 0.1 : 100}
                max={form.weight.unit === "kg" ? 100 : 100000}
                step={form.weight.unit === "kg" ? 0.01 : 1}
                value={form.weight.value}
                onChange={(e) =>
                  update("weight", {
                    ...form.weight,
                    value: e.target.value,
                  })
                }
                disabled={saving}
                className={inputClass}
              />
              <select
                aria-label="Weight Unit"
                value={form.weight.unit}
                onChange={(e) => convertUnit(e.target.value)}
                disabled={saving}
                className="rounded-xl border border-base-300 px-2 text-xs"
              >
                <option value="kg">kg</option>
                <option value="g">g</option>
              </select>
            </div>
          </div>

          <div className="rounded-xl bg-secondary/5 p-3">
            <p className="text-xs font-bold text-primary">
              Expected Delivery (Bangladesh Time)
            </p>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <input
                type="date"
                min={range.min}
                max={range.max}
                value={form.etaDate}
                onChange={(e) => update("etaDate", e.target.value)}
                disabled={saving}
                className={inputClass}
              />
              <input
                type="time"
                value={form.etaTime}
                onChange={(e) => update("etaTime", e.target.value)}
                disabled={saving || !form.etaDate}
                className={inputClass}
              />
            </div>

            {form.etaDate && order.status !== "shipped" && (
              <button
                type="button"
                disabled={saving}
                onClick={() => update("etaDate", "")}
                className="mt-2 text-xs text-red-600"
              >
                Clear ETA
              </button>
            )}

            <p className="mt-2 text-[11px] text-muted">
              নতুন ETA আগামীকাল থেকে ৬ মাসের মধ্যে। ETA পার হলেই auto-delivered
              হবে না।
            </p>
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-lg bg-red-50 p-3 text-xs text-red-700"
            >
              {error}
            </p>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={cancel}
              disabled={saving}
              className="rounded-xl border border-base-300 px-3 py-3 text-xs font-bold text-primary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-3 py-3 text-xs font-bold text-white disabled:opacity-40"
            >
              {saving ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Save size={15} />
              )}
              Save Changes
            </button>
          </div>
        </form>
      )}
    </Section>
  );
}

// ==========================================
// MAIN ADMIN ORDER DETAILS PAGE
// ==========================================

export default function AdminOrderDetailsPage() {
  const { orderId } = useParams();
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

  const qc = useQueryClient();

  const [copied, setCopied] = useState("");
  const [noteText, setNoteText] = useState("");
  const [modal, setModal] = useState("");
  const [modalError, setModalError] = useState("");
  const [opening, setOpening] = useState(false);

  // ========================================
  // FETCH ORDER
  // ========================================

  const orderQuery = useQuery({
    queryKey: ["admin-order-detail", user?.uid, orderId],
    enabled: allowed && Boolean(orderId),
    queryFn: ({ signal }) =>
      adminRequest(user, `/admin/orders/${encodeURIComponent(orderId)}`, {
        signal,
      }),
    staleTime: 0,
    refetchOnWindowFocus: true,
    retry: 1,
  });

  // ========================================
  // INVALIDATE SHARED CACHES
  // ========================================

  const invalidate = async () => {
    await Promise.all(
      [
        "admin-order-detail",
        "admin-orders",
        "admin-payments",
        "admin-dashboard",
        "admin-deliveries",
        "my-orders",
        "sokhbilash-order-details",
      ].map((key) =>
        qc.invalidateQueries({
          queryKey: [key],
        }),
      ),
    );
  };

  // ========================================
  // MUTATION
  // ========================================

  const mutation = useMutation({
    mutationFn: ({ endpoint, body }) =>
      adminRequest(
        user,
        `/admin/orders/${encodeURIComponent(orderId)}/${endpoint}`,
        {
          method: endpoint === "notes" ? "POST" : "PATCH",
          body,
        },
      ),
    onSuccess: async () => {
      await invalidate();
    },
  });

  const saving = mutation.isPending;

  const closeModal = () => {
    if (!saving) {
      setModal("");
      setModalError("");
    }
  };

  async function perform(endpoint, body, { close = true, toast = true } = {}) {
    setModalError("");

    try {
      await mutation.mutateAsync({ endpoint, body });

      if (close) closeModal();

      if (toast) {
        void Swal.fire({
          toast: true,
          icon: "success",
          title: "MongoDB-তে সফলভাবে Save হয়েছে",
          timer: 1600,
          position: "top-end",
          showConfirmButton: false,
        });
      }

      return true;
    } catch (err) {
      setModalError(err.message || "Update failed");

      if (!modal) {
        void Swal.fire({
          icon: "error",
          title: "Update failed",
          text: err.message,
          confirmButtonColor: "#76258A",
        });
      }

      return false;
    }
  }

  // ========================================
  // OPEN FINANCIAL MODAL
  // ========================================

  async function openModal(next) {
    if (saving || opening) return;

    setOpening(true);
    setModalError("");

    try {
      const result = await orderQuery.refetch();

      if (result.isError || !result.data?.order) {
        throw result.error || new Error("Order refresh failed");
      }

      const fresh = result.data.order;

      if (
        next === "cash" &&
        (!["verified", "processing", "shipped", "delivered"].includes(
          fresh.status,
        ) ||
          !fresh.phoneConfirmed ||
          dueOf(fresh) <= 0)
      ) {
        throw new Error(
          "Cash Collection-এর জন্য confirmed active order এবং বকেয়া টাকা লাগবে।",
        );
      }

      if (
        next === "excess" &&
        (!fresh.phoneConfirmed ||
          !fresh.payment?.excessResolution?.type ||
          fresh.payment.excessResolution.status === "completed" ||
          excessOf(fresh) <= 0 ||
          inactive(fresh))
      ) {
        throw new Error(
          "Overpayment agreement এখনো pending অথবা ইতোমধ্যে settled।",
        );
      }

      if (next === "refund" && (!inactive(fresh) || refundableOf(fresh) <= 0)) {
        throw new Error("Cancelled/Rejected Order-এর ফেরত দেওয়ার টাকা নেই।");
      }

      if (next === "phone" && !["pending", "verified"].includes(fresh.status)) {
        throw new Error("এই stage-এ Phone Confirmation পরিবর্তন করা যায় না।");
      }

      setModal(next);
    } catch (err) {
      void Swal.fire({
        icon: "error",
        title: "Action unavailable",
        text: err.message,
        confirmButtonColor: "#76258A",
      });
    } finally {
      setOpening(false);
    }
  }

  // ========================================
  // STATUS UPDATE
  // ========================================

  async function changeStatus(next) {
    if (saving || opening || !orderQuery.data?.order) return;

    const answer = await Swal.fire({
      icon: next === "cancelled" ? "warning" : "question",
      title:
        next === "cancelled"
          ? "অর্ডার বাতিল করবেন?"
          : `Mark ${ORDER_LABEL[next] || next}?`,
      text:
        next === "cancelled"
          ? "গ্রাহকের প্রাপ্ত টাকা Refund করতে হবে। Refund আলাদাভাবে রেকর্ড করুন।"
          : next === "delivered"
            ? "প্রকৃত Delivery নিশ্চিত করে এবং সমস্ত বকেয়া/Overpayment settle করে তারপর Delivered করুন।"
            : "Order Status পরিবর্তন করা হবে।",
      showCancelButton: true,
      confirmButtonText: "Confirm",
      cancelButtonText: "Back",
      confirmButtonColor: next === "cancelled" ? "#dc2626" : "#76258A",
    });

    if (!answer.isConfirmed) return;

    setOpening(true);

    try {
      const result = await orderQuery.refetch();

      if (result.isError || !result.data?.order) {
        throw result.error || new Error("Order refresh failed");
      }

      const latest = result.data.order;

      if (next === "delivered") {
        if (!latest.phoneConfirmed) {
          throw new Error("Phone Confirmation বাকি।");
        }

        if (dueOf(latest) > 0) {
          throw new Error(
            `বকেয়া ${money(dueOf(latest))}; আগে Collect Cash করুন।`,
          );
        }

        if (
          excessOf(latest) > 0 &&
          latest.payment?.excessResolution?.status !== "completed"
        ) {
          throw new Error(
            "অতিরিক্ত পেমেন্টের Refund/Extra Product Settlement বাকি।",
          );
        }
      }

      if (
        next === "shipped" &&
        (!latest.courier?.name ||
          !latest.courier?.trackingNumber ||
          !latest.estimatedDelivery)
      ) {
        throw new Error(
          "Shipped করার আগে Courier, Tracking Number ও ETA Save করুন।",
        );
      }

      await perform("status", { status: next });
    } catch (err) {
      void Swal.fire({
        icon: "warning",
        title: "Action blocked",
        text: err.message,
        confirmButtonColor: "#76258A",
      });
    } finally {
      setOpening(false);
    }
  }

  async function copyText(value, key) {
    try {
      await navigator.clipboard.writeText(String(value || ""));
      setCopied(key);
    } catch {
      void Swal.fire({
        icon: "error",
        text: "Copy করা যায়নি।",
        confirmButtonColor: "#76258A",
      });
    }
  }

  async function addNote() {
    const text = noteText.trim();
    if (!text || saving) return;
    if (await perform("notes", { text })) {
      setNoteText("");
    }
  }

  // ========================================
  // AUTH / DATA
  // ========================================

  const order = orderQuery.data?.order;

  if (checking) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-2 text-secondary">
        <Loader2 className="animate-spin" />
        Admin যাচাই হচ্ছে...
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center">
        <ShieldCheck size={32} className="mx-auto text-secondary" />
        <h2 className="mt-3 font-bold text-primary">Access Denied</h2>
        <p className="mt-2 text-xs text-muted">Active Admin Account প্রয়োজন।</p>
      </div>
    );
  }

  if (orderQuery.isPending) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-2 text-secondary">
        <Loader2 className="animate-spin" />
        Order Details লোড হচ্ছে...
      </div>
    );
  }

  if (orderQuery.isError || !order) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center">
        <AlertTriangle size={28} className="mx-auto text-red-600" />
        <p className="mt-3 text-sm text-red-700">
          {orderQuery.error?.message || "Order not found"}
        </p>
        <button
          type="button"
          onClick={() => orderQuery.refetch()}
          className="mt-4 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  const payment = order.payment || {};
  const shipping = order.shipping || {};
  const customer = order.customer || {};

  const items = Array.isArray(order.items) ? order.items : [];
  const history = Array.isArray(order.history)
    ? [...order.history].reverse()
    : [];
  const notes = Array.isArray(order.internalNotes) ? order.internalNotes : [];

  const isCOD = payment.method === "cod";
  const stopped = inactive(order);

  const due = dueOf(order);
  const excess = excessOf(order);
  const refundable = refundableOf(order);

  const online = num(
    payment.onlineVerifiedAmount ??
      (payment.verifiedAmount || 0) - (payment.cashCollected || 0),
  );

  const cash = num(payment.cashCollected);
  const verified = num(payment.verifiedAmount);
  const refunded = num(payment.refundedAmount);

  const phoneNumber = shipping.phone || customer.phone || "";
  const whatsappUrl = whatsapp(order);

  const canPhone = ["pending", "verified"].includes(order.status);

  const pendingProof =
    !isCOD && order.status === "pending" && payment.status === "pending";

  const canAdvancePending =
    order.status === "pending" &&
    order.phoneConfirmed &&
    (isCOD || ["verified", "partially_paid"].includes(payment.status)) &&
    (excess <= 0 || payment.excessResolution?.type);

  const nextStatus =
    order.status === "pending"
      ? canAdvancePending
        ? "verified"
        : null
      : NEXT[order.status];

  const canCancel = ["pending", "verified", "processing"].includes(
    order.status,
  );

  const shippingReady = Boolean(
    order.courier?.name &&
    order.courier?.trackingNumber &&
    order.estimatedDelivery,
  );

  const readyToDeliver =
    order.phoneConfirmed &&
    due <= 0 &&
    (excess <= 0 || payment.excessResolution?.status === "completed");

  const busy = saving || opening;

  // ========================================
  // PAGE
  // ========================================

  return (
    <div className="mx-auto max-w-[1550px] space-y-5 pb-10 text-primary">
      {/* BREADCRUMB */}

      <nav className="flex flex-wrap items-center gap-2 text-xs text-muted">
        <Link to="/admin" className="hover:text-secondary">
          ড্যাশবোর্ড
        </Link>
        <span>/</span>
        <Link to="/admin/orders" className="hover:text-secondary">
          অর্ডারসমূহ
        </Link>
        <span>/</span>
        <span className="font-semibold text-primary">{order.orderNumber}</span>
      </nav>

      {/* HEADER */}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/admin/orders"
              className="flex size-9 items-center justify-center rounded-xl border border-base-300 bg-white"
            >
              <ArrowLeft size={17} />
            </Link>

            <h1 className="break-all text-xl font-bold text-primary sm:text-2xl">
              অর্ডার #{order.orderNumber}
            </h1>

            <button
              type="button"
              title="Copy Order Number"
              onClick={() => copyText(order.orderNumber, "order")}
              className="rounded-lg p-1.5 text-muted hover:bg-white"
            >
              {copied === "order" ? <Check size={16} /> : <Copy size={16} />}
            </button>

            <StatusBadge value={order.status} />

            {items.some(
              (it) =>
                it.customization?.mode && it.customization.mode !== "none",
            ) && (
              <span className="rounded-full bg-primary px-3 py-1 text-[11px] font-bold text-white">
                Customized
              </span>
            )}
          </div>

          <p className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
            <CalendarDays size={14} />
            {formatDate(order.createdAt)}
            <span>•</span>
            {order.guest ? "Guest Checkout" : "Registered Customer"}
          </p>
        </div>

        <button
          type="button"
          onClick={() => orderQuery.refetch()}
          disabled={orderQuery.isFetching || busy}
          className="inline-flex items-center gap-2 rounded-xl border border-base-300 bg-white px-4 py-2.5 text-xs font-bold text-secondary disabled:opacity-50"
        >
          <RefreshCw
            size={15}
            className={orderQuery.isFetching ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {/* IMPORTANT NOTICES */}

      {order.status === "pending" &&
        (!order.phoneConfirmed ||
          pendingProof ||
          (!isCOD && payment.status === "partially_paid") ||
          excess > 0) && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="rounded-xl bg-gold-soft/40 p-2.5 text-primary">
                <AlertTriangle size={20} />
              </span>

              <div>
                <p className="text-sm font-bold text-primary">
                  {!order.phoneConfirmed
                    ? "Customer Phone Confirmation প্রয়োজন"
                    : pendingProof
                      ? "Payment Verification প্রয়োজন"
                      : payment.status === "partially_paid"
                        ? "আংশিক পেমেন্ট যাচাইকৃত"
                        : "পেমেন্ট সমন্বয় বাকি"}
                </p>

                <p className="mt-1 text-xs leading-6 text-muted">
                  {!order.phoneConfirmed
                    ? "COD ও Mobile Banking—উভয় অর্ডারে ফোনে Confirm করুন।"
                    : `বর্তমান বকেয়া ${money(due)}; অতিরিক্ত ${money(excess)}।`}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {phoneNumber && (
                <a
                  href={`tel:${phoneNumber}`}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-secondary px-3 py-2.5 text-xs font-bold text-white"
                >
                  <Phone size={14} />
                  Call
                </a>
              )}

              {!order.phoneConfirmed && (
                <button
                  type="button"
                  onClick={() => openModal("phone")}
                  disabled={busy}
                  className="rounded-xl bg-gold-soft px-3 py-2.5 text-xs font-bold text-primary disabled:opacity-40"
                >
                  Phone Confirm
                </button>
              )}

              {pendingProof && (
                <button
                  type="button"
                  onClick={() => openModal("payment")}
                  disabled={busy}
                  className="rounded-xl bg-primary px-3 py-2.5 text-xs font-bold text-white disabled:opacity-40"
                >
                  Verify Payment
                </button>
              )}
            </div>
          </div>
        )}

      {stopped && refundable > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-semibold leading-6 text-amber-900">
            <RotateCcw size={16} className="mr-2 inline" />
            Cancelled / Rejected Order: এখনো {money(refundable)} Refund বাকি।
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => openModal("refund")}
            className="rounded-lg bg-amber-800 px-4 py-2.5 text-xs font-bold text-white"
          >
            Record Refund
          </button>
        </div>
      )}

      {mutation.isError && !modal && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-xs text-red-700"
        >
          {mutation.error?.message}
        </p>
      )}

      {/* MAIN TWO-COLUMN LAYOUT */}

      <div className="grid items-start gap-5 xl:grid-cols-12">
        {/* LEFT COLUMN */}

        <div className="space-y-5 xl:col-span-8">
          {/* PRODUCTS */}

          <Section
            title="অর্ডারকৃত আইটেম ও কাস্টমাইজেশন বিবরণী"
            subtitle="Ordered Products"
            icon={Package}
            right={
              <span className="rounded-full bg-secondary/10 px-3 py-1.5 text-xs font-bold text-secondary">
                মোট {items.reduce((n, p) => n + (Number(p.quantity) || 0), 0)}{" "}
                পিস
              </span>
            }
          >
            <div className="space-y-3">
              {items.map((item, i) => (
                <OrderItemCard key={item.cartId || i} item={item} />
              ))}

              {!items.length && (
                <p className="text-xs text-muted">কোনো Product নেই।</p>
              )}

              {order.giftOptions?.message && (
                <div className="rounded-xl bg-gradient-to-br from-[#f8f5fa] to-[#eee2f3] p-4">
                  <p className="mb-2 flex items-center gap-2 text-xs font-bold text-secondary">
                    <Gift size={16} />
                    Gift Message
                  </p>
                  <p className="whitespace-pre-wrap rounded-lg border-l-4 border-secondary bg-white p-3 text-sm leading-6 text-primary">
                    {order.giftOptions.message}
                  </p>
                </div>
              )}
            </div>
          </Section>

          {/* ORDER HISTORY */}

          <Section
            title="অর্ডার প্রসেসিং ও ডেলিভারি টাইমলাইন"
            subtitle="Order Activity History"
            icon={History}
          >
            <div className="space-y-4">
              {!history.length && (
                <p className="text-xs text-muted">কোনো History নেই।</p>
              )}

              {history.map((event, i) => (
                <div
                  key={event.date || i}
                  className="border-l-2 border-secondary/30 pl-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-bold text-primary">
                      {ORDER_LABEL[event.status] ||
                        String(event.status || "update").replace(/_/g, " ")}
                    </p>
                    <p className="text-[11px] text-secondary">
                      {formatDate(event.date || event.createdAt)}
                    </p>
                  </div>

                  {event.note && (
                    <p className="mt-1 whitespace-pre-wrap break-words text-xs leading-6 text-muted">
                      {event.note}
                    </p>
                  )}

                  <p className="mt-1 text-[11px] text-muted">
                    By: {event.by || "system"}
                  </p>
                </div>
              ))}
            </div>
          </Section>

          {/* INTERNAL NOTES */}

          <Section
            title="ইন্টারনাল অ্যাডমিন ও কারিগর নোট"
            subtitle="Admin Only · Customer cannot view"
            icon={MessageSquareText}
          >
            <div className="space-y-3">
              {!notes.length && (
                <p className="rounded-lg bg-base-200 p-3 text-xs text-muted">
                  এখনো কোনো Internal Note নেই।
                </p>
              )}

              {notes.map((note, i) => (
                <div key={note.id || i} className="rounded-xl bg-base-200 p-3">
                  <div className="flex flex-wrap justify-between gap-2">
                    <p className="text-xs font-bold text-primary">
                      {note.author || "SokhBilash Admin"}
                    </p>
                    <p className="text-[11px] text-muted">
                      {formatDate(note.createdAt)}
                    </p>
                  </div>

                  <p className="mt-2 whitespace-pre-wrap break-words text-xs leading-6 text-muted">
                    {note.text}
                  </p>
                </div>
              ))}

              <textarea
                rows={3}
                maxLength={1000}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                disabled={busy}
                placeholder="Workshop Instructions / Internal Note"
                className={inputClass}
              />

              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={busy || !noteText.trim()}
                  onClick={addNote}
                  className="inline-flex items-center gap-2 rounded-xl bg-secondary px-4 py-2.5 text-xs font-bold text-white disabled:opacity-40"
                >
                  <Plus size={15} />
                  নোট যোগ করুন
                </button>
              </div>
            </div>
          </Section>

          {/* ORDER STATUS MANAGEMENT */}

          <Section
            title="অর্ডার স্ট্যাটাস ম্যানেজমেন্ট"
            subtitle="Manual Order Fulfillment"
            icon={ClipboardCheck}
            right={<StatusBadge value={order.status} />}
          >
            <div className="space-y-3">
              {canPhone && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-base-200 p-3">
                  <div>
                    <p className="text-xs font-bold text-primary">
                      Customer Phone Confirmation
                    </p>
                    <p className="mt-1 text-[11px] text-muted">
                      {order.phoneConfirmed ? "Confirmed" : "Not Confirmed"} ·
                      All payment methods
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => openModal("phone")}
                    className={`rounded-lg px-3 py-2 text-xs font-bold disabled:opacity-40 ${
                      order.phoneConfirmed
                        ? "bg-secondary/10 text-secondary"
                        : "bg-green-700 text-white"
                    }`}
                  >
                    {order.phoneConfirmed ? "Update / Revoke" : "Confirm Phone"}
                  </button>
                </div>
              )}

              <p className="text-xs leading-6 text-muted">
                Phone Confirmation, Payment Verification, Courier, Due
                Collection ও Excess Settlement সম্পন্ন করে Order এগিয়ে নিন।
                Final validation Backend করবে।
              </p>

              {order.status === "pending" && !canAdvancePending && (
                <p className="rounded-lg bg-amber-50 p-3 text-xs leading-6 text-amber-800">
                  {!order.phoneConfirmed
                    ? "ফোনে Customer Confirm করো।"
                    : !isCOD &&
                        !["verified", "partially_paid"].includes(payment.status)
                      ? "Online Payment আগে Verify করো।"
                      : "Pending অবস্থার শর্ত যাচাই করো।"}
                </p>
              )}

              {nextStatus === "shipped" && !shippingReady && (
                <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
                  Shipped করার আগে Courier Name, Tracking Number ও ETA Save করো।
                </p>
              )}

              {nextStatus === "delivered" && !readyToDeliver && (
                <p className="rounded-lg bg-amber-50 p-3 text-xs leading-6 text-amber-800">
                  Delivered করার আগে{" "}
                  {due > 0
                    ? `বকেয়া ${money(due)} Collect Cash করতে হবে।`
                    : excess > 0
                      ? "অতিরিক্ত পেমেন্ট settle করতে হবে।"
                      : "Phone Confirm করতে হবে।"}
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                {nextStatus && (
                  <button
                    type="button"
                    disabled={
                      busy ||
                      (nextStatus === "shipped" && !shippingReady) ||
                      (nextStatus === "delivered" && !readyToDeliver)
                    }
                    onClick={() => changeStatus(nextStatus)}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-700 px-4 py-3 text-xs font-bold text-white disabled:opacity-40"
                  >
                    <CheckCircle2 size={16} />
                    {ORDER_LABEL[nextStatus]} করুন
                  </button>
                )}

                {canCancel && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => changeStatus("cancelled")}
                    className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-700 disabled:opacity-50"
                  >
                    Cancel Order
                  </button>
                )}
              </div>

              {!nextStatus && !canCancel && (
                <p className="rounded-lg bg-base-200 p-3 text-xs text-muted">
                  এই Order-এর আর কোনো Manual Status Action নেই।
                </p>
              )}
            </div>
          </Section>
        </div>

        {/* RIGHT COLUMN */}

        <div className="space-y-5 xl:col-span-4">
          {/* CUSTOMER */}

          <Section
            title="গ্রাহক প্রোফাইল"
            subtitle="Customer & Delivery Information"
            icon={UserRound}
          >
            <div className="mb-4 flex items-center gap-3">
              <Photo
                src={order.guest ? "" : order.customerPhotoUrl}
                alt={customer.name}
                avatar
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-primary">
                  {customer.name || "Unknown Customer"}
                </p>
                <p className="mt-1 text-[11px] text-muted">
                  {order.guest ? "Guest Customer" : "Registered Customer"}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 rounded-xl bg-base-200 p-3">
              <p className="min-w-0 truncate text-xs font-bold text-primary">
                {phoneNumber || "—"}
              </p>

              <div className="flex shrink-0 gap-3">
                {phoneNumber && (
                  <a
                    href={`tel:${phoneNumber}`}
                    title="Call"
                    className="text-secondary"
                  >
                    <Phone size={16} />
                  </a>
                )}

                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="WhatsApp"
                    className="text-green-700"
                  >
                    <MessageCircle size={17} />
                  </a>
                )}

                <button
                  type="button"
                  title="Copy Phone"
                  onClick={() => copyText(phoneNumber, "phone")}
                  className="text-muted"
                >
                  {copied === "phone" ? (
                    <Check size={16} />
                  ) : (
                    <Copy size={16} />
                  )}
                </button>
              </div>
            </div>

            {customer.email && (
              <p className="mt-2 flex items-start gap-2 rounded-xl bg-base-200 p-3 text-xs text-muted">
                <Mail size={15} className="shrink-0 text-secondary" />
                <span className="break-all">{customer.email}</span>
              </p>
            )}

            <div className="mt-4 border-t border-base-300 pt-4">
              <p className="mb-2 flex items-center gap-2 text-xs font-bold text-primary">
                <MapPin size={15} className="text-secondary" />
                ডেলিভারি ঠিকানা
              </p>

              <div className="rounded-xl bg-base-200 p-3">
                <p className="text-xs font-bold text-primary">
                  {shipping.recipientName || customer.name || "—"}
                </p>
                <p className="mt-2 whitespace-pre-wrap break-words text-xs leading-6 text-muted">
                  {shipping.address || "—"}
                </p>
                <p className="mt-1 text-[11px] text-muted">
                  {shipping.district || "—"}, {shipping.division || "—"}
                </p>
              </div>

              {shipping.note && (
                <p className="mt-2 whitespace-pre-wrap rounded-lg bg-gold-soft/25 p-3 text-xs text-primary">
                  {shipping.note}
                </p>
              )}
            </div>
          </Section>

          {/* PAYMENT */}

          <Section
            title="পেমেন্ট বিবরণী"
            subtitle="Financial Reconciliation"
            icon={Wallet}
            right={<StatusBadge value={payment.status} payment />}
          >
            <InfoRow label="Subtotal" value={money(order.subtotal)} />

            {num(order.discount) > 0 && (
              <InfoRow
                label="Discount"
                value={
                  <span className="text-red-600">−{money(order.discount)}</span>
                }
              />
            )}

            {num(order.giftWrapCharge) > 0 && (
              <InfoRow
                label="Historical Gift Wrap"
                value={money(order.giftWrapCharge)}
              />
            )}

            <InfoRow label="Delivery" value={money(order.deliveryCharge)} />

            <div className="mt-3 rounded-xl bg-primary p-3 text-white">
              <div className="flex justify-between gap-2">
                <span className="text-xs font-semibold">Grand Total</span>
                <strong className="text-lg">{money(order.total)}</strong>
              </div>
            </div>

            {/* COLLECTION BREAKDOWN */}

            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl bg-green-50 p-3">
                <p className="text-green-700">Total Received</p>
                <p className="mt-1 text-lg font-bold text-green-800">
                  {money(verified)}
                </p>
              </div>

              <div className="rounded-xl bg-gold-soft/35 p-3">
                <p className="text-primary">
                  {stopped ? "Order Closed" : "Remaining Due"}
                </p>
                <p className="mt-1 text-lg font-bold text-primary">
                  {stopped ? "—" : money(due)}
                </p>
              </div>

              <div className="rounded-xl bg-secondary/5 p-3">
                <p className="text-muted">Mobile Banking</p>
                <p className="mt-1 font-bold text-primary">{money(online)}</p>
              </div>

              <div className="rounded-xl bg-secondary/5 p-3">
                <p className="text-muted">Cash Collected</p>
                <p className="mt-1 font-bold text-primary">{money(cash)}</p>
              </div>

              {refunded > 0 && (
                <div className="col-span-2 rounded-xl bg-emerald-50 p-3">
                  <p className="text-emerald-800">Already Refunded</p>
                  <p className="mt-1 font-bold text-emerald-800">
                    {money(refunded)}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-3 border-t border-base-300 pt-3">
              <InfoRow
                label="Payment Method"
                value={METHOD[payment.method] || payment.method || "—"}
              />

              {!isCOD && (
                <>
                  <InfoRow
                    label="Sender Phone"
                    value={payment.senderPhone || "—"}
                  />
                  <InfoRow
                    label="Customer Claimed"
                    value={money(payment.claimedAmount)}
                  />
                  <InfoRow
                    label="TrxID"
                    value={
                      <span className="break-all font-mono">
                        {payment.trxId || "—"}
                      </span>
                    }
                  />
                </>
              )}

              <InfoRow
                label="Phone Confirmed"
                value={order.phoneConfirmed ? "Yes" : "No"}
              />

              {payment.verifiedAt && (
                <InfoRow
                  label="Last Payment Review"
                  value={formatDate(payment.verifiedAt)}
                />
              )}
            </div>

            {!isCOD && (
              <button
                type="button"
                disabled={busy}
                onClick={() => openModal("payment")}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-secondary/10 px-4 py-3 text-xs font-bold text-secondary disabled:opacity-40"
              >
                <ShieldCheck size={16} />
                {pendingProof
                  ? "Verify / Reject Payment"
                  : "Payment Review Details"}
              </button>
            )}

            {!stopped &&
              ["verified", "processing", "shipped", "delivered"].includes(
                order.status,
              ) &&
              due > 0 && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => openModal("cash")}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-bold text-white disabled:opacity-40"
                >
                  <Banknote size={16} />
                  Record Actual Cash Collection
                </button>
              )}

            {/* OVERPAYMENT SETTLEMENT */}

            {!stopped && excess > 0 && (
              <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs leading-6 text-emerald-900">
                <p className="font-bold">
                  Verified Overpayment: {money(excess)}
                </p>

                <p className="mt-1">
                  Customer Agreement:{" "}
                  {payment.excessResolution?.type === "refund"
                    ? "Refund"
                    : payment.excessResolution?.type === "extra_product"
                      ? "Extra Products"
                      : "Phone Confirmation required"}
                </p>

                <p>Status: {payment.excessResolution?.status || "Pending"}</p>

                {payment.excessResolution?.type &&
                  payment.excessResolution.status !== "completed" && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => openModal("excess")}
                      className="mt-3 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-40"
                    >
                      Record Settlement Completed
                    </button>
                  )}
              </div>
            )}

            {/* CANCELLATION REFUND */}

            {stopped && (
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-6 text-amber-900">
                <p className="font-bold">Cancellation / Rejection Refund</p>
                <p>
                  Already Returned: {money(refunded)} · Refund Due:{" "}
                  {money(refundable)}
                </p>
                <p>
                  Status:{" "}
                  {payment.cancellationRefund?.status ||
                    (refundable ? "pending" : "not_required")}
                </p>

                {refundable > 0 && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => openModal("refund")}
                    className="mt-3 rounded-lg bg-amber-800 px-3 py-2 text-xs font-bold text-white"
                  >
                    Record Actual Refund
                  </button>
                )}
              </div>
            )}

            {/* REFUND HISTORY */}

            {Array.isArray(payment.refunds) && payment.refunds.length > 0 && (
              <details className="group mt-3 rounded-xl bg-base-200/70 p-3">
                <summary className="flex cursor-pointer items-center justify-between text-xs font-bold text-primary">
                  Refund History ({payment.refunds.length})
                  <ChevronDown
                    size={15}
                    className="transition group-open:rotate-180"
                  />
                </summary>
                <div className="mt-3 space-y-2">
                  {payment.refunds.map((r, i) => (
                    <div
                      key={r.refundId || i}
                      className="rounded-lg bg-white p-3 text-xs"
                    >
                      <p className="font-bold text-primary">
                        {money(r.amount)} · {r.type || "refund"}
                      </p>
                      <p className="mt-1 break-words text-muted">
                        {r.method || "—"} · {r.reference || "—"}
                      </p>
                      <p className="mt-1 text-muted">
                        {formatDate(r.refundedAt)}
                      </p>
                    </div>
                  ))}
                </div>
              </details>
            )}

            {/* CASH COLLECTION HISTORY */}

            {Array.isArray(payment.deliveryCollections) &&
              payment.deliveryCollections.length > 0 && (
                <details className="group mt-3 rounded-xl bg-base-200/70 p-3">
                  <summary className="flex cursor-pointer items-center justify-between text-xs font-bold text-primary">
                    Cash Collection History (
                    {payment.deliveryCollections.length})
                    <ChevronDown
                      size={15}
                      className="transition group-open:rotate-180"
                    />
                  </summary>
                  <div className="mt-3 space-y-2">
                    {payment.deliveryCollections.map((c, i) => (
                      <div
                        key={c.collectionId || i}
                        className="rounded-lg bg-white p-3 text-xs"
                      >
                        <p className="font-bold text-primary">
                          {money(c.amount)}
                        </p>
                        <p className="mt-1 text-muted">
                          {formatDate(c.collectedAt)}
                        </p>
                        <p className="mt-1 whitespace-pre-wrap text-muted">
                          {c.note}
                        </p>
                      </div>
                    ))}
                  </div>
                </details>
              )}
          </Section>

          {/* COURIER */}

          <CourierSection
            key={order._id}
            order={order}
            saving={busy}
            onSave={async (payload) => {
              const ok = await perform("tracking", payload);
              if (!ok) {
                throw new Error(
                  "Courier update failed. Check the error shown on the page.",
                );
              }
            }}
          />
        </div>
      </div>

      {/* FINANCIAL MODALS */}

      {modal === "payment" && !isCOD && (
        <PaymentModal
          key={`${order._id}:${payment.trxId}:${payment.status}`}
          order={order}
          busy={saving}
          error={modalError}
          onClose={closeModal}
          onSubmit={(body) => perform("payment", body)}
        />
      )}

      {modal === "phone" && (
        <PhoneModal
          key={`${order._id}:${order.phoneConfirmed}:${
            payment.excessResolution?.type || ""
          }`}
          order={order}
          busy={saving}
          error={modalError}
          onClose={closeModal}
          onSubmit={(body) => perform("phone-confirmation", body)}
        />
      )}

      {modal === "cash" && (
        <CashModal
          key={`${order._id}:${payment.verifiedAmount}`}
          order={order}
          busy={saving}
          error={modalError}
          onClose={closeModal}
          onSubmit={(body) => perform("collect-balance", body)}
        />
      )}

      {modal === "excess" && (
        <ExcessModal
          key={`${order._id}:${payment.excessResolution?.type}`}
          order={order}
          busy={saving}
          error={modalError}
          onClose={closeModal}
          onSubmit={(body) => perform("excess-resolution", body)}
        />
      )}

      {modal === "refund" && (
        <RefundModal
          key={`${order._id}:${payment.refundedAmount}`}
          order={order}
          busy={saving}
          error={modalError}
          onClose={closeModal}
          onSubmit={(body) => perform("refund", body)}
        />
      )}
    </div>
  );
}
