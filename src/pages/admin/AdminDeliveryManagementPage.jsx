import {
  Fragment,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
import {
  AlertTriangle,
  Banknote,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Eye,
  ImageOff,
  Loader2,
  PackageCheck,
  PackageSearch,
  Pencil,
  RefreshCcw,
  Save,
  Search,
  ShieldCheck,
  ShoppingBag,
  Truck,
  UserRound,
  Wallet,
  X,
} from "lucide-react";
import { AuthContext } from "../../providers/AuthProvider";
import { API_URL } from "../../utils/siteConfig";

const STORAGE_KEY = "sokhbilash-admin-courier-names";
const PAGE_SIZE = 10;
const NEXT_STATUS = {
  verified: "processing",
  processing: "shipped",
  shipped: "delivered",
};
const NEXT_LABEL = {
  processing: "Start Processing",
  shipped: "Mark Shipped",
  delivered: "Mark Delivered",
};
const STATUS = {
  verified: { label: "যাচাইকৃত", css: "bg-blue-50 text-blue-700" },
  processing: { label: "প্রসেসিং", css: "bg-purple-50 text-purple-700" },
  shipped: { label: "কুরিয়ারে", css: "bg-indigo-50 text-indigo-700" },
  delivered: { label: "ডেলিভার্ড", css: "bg-green-50 text-green-700" },
};
const VIEWS = [
  ["all", "সব ডেলিভারি"],
  ["verified", "প্রস্তুতির অপেক্ষায়"],
  ["processing", "প্রসেসিং"],
  ["shipped", "কুরিয়ারে"],
  ["delivered", "ডেলিভার্ড"],
  ["overdue", "সময় পেরিয়েছে"],
  ["upcoming", "আগামী ৭ দিন"],
  ["unassigned", "কুরিয়ার বাকি"],
];
const bn = (n) =>
  Number(n || 0).toLocaleString("bn-BD", { maximumFractionDigits: 2 });
const money = (n) =>
  `৳${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const round = (n) => Math.round((Number(n) || 0) * 100) / 100;
const dueAmount = (order) =>
  Math.max(
    0,
    round(
      Number(order?.total || 0) - Number(order?.payment?.verifiedAmount || 0),
    ),
  );

function dateText(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("bn-BD", {
    timeZone: "Asia/Dhaka",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
function dhakaDateTime(value = new Date()) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const part = (type) => parts.find((p) => p.type === type)?.value;
  return {
    date: `${part("year")}-${part("month")}-${part("day")}`,
    time: `${part("hour")}:${part("minute")}`,
  };
}
function addDays(date, days) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}
function addMonths(date, months) {
  const [y, m, d] = date.split("-").map(Number);
  const first = new Date(Date.UTC(y, m - 1 + months, 1));
  const last = new Date(
    Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0),
  ).getUTCDate();
  return new Date(
    Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), Math.min(d, last)),
  )
    .toISOString()
    .slice(0, 10);
}
function readCouriers() {
  try {
    const list = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(list)
      ? list.filter((v) => typeof v === "string" && v.trim()).slice(0, 20)
      : [];
  } catch {
    return [];
  }
}
function rememberCourier(name) {
  if (!name) return;
  try {
    const list = [
      name,
      ...readCouriers().filter(
        (item) => item.toLowerCase() !== name.toLowerCase(),
      ),
    ].slice(0, 20);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* Optional storage */
  }
}
function safeUrl(value) {
  if (!value || typeof value !== "string") return "";
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" && !url.username && !url.password
      ? url.href
      : "";
  } catch {
    return "";
  }
}
function parseWeight(raw) {
  const match = String(raw || "")
    .trim()
    .match(/^(\d+(?:\.\d+)?)\s*(kg|g)$/i);
  return match
    ? { value: match[1], unit: match[2].toLowerCase() }
    : { value: "", unit: "kg" };
}
function weightForBackend(weight) {
  const text = String(weight.value).trim();
  if (!text) return "";
  if (!/^\d+(?:\.\d{1,2})?$/.test(text))
    throw new Error("ওজনের দশমিক সর্বোচ্চ ২ ঘর হতে হবে।");
  const amount = Number(text);
  const kg = weight.unit === "g" ? amount / 1000 : amount;
  if (!Number.isFinite(kg) || kg < 0.1 || kg > 100)
    throw new Error("Parcel Weight 0.1–100 kg হতে হবে।");
  if (weight.unit === "kg") return `${amount} kg`;
  if (!Number.isInteger(amount)) throw new Error("Gram পূর্ণসংখ্যা হতে হবে।");
  if (amount <= 9999) return `${amount} g`;
  if (!Number.isInteger(amount / 10)) throw new Error("বড় ওজন kg-এ লিখুন।");
  return `${Number((amount / 1000).toFixed(2))} kg`;
}
function isOverdue(order, now) {
  if (order.status !== "shipped" || !order.estimatedDelivery) return false;
  const eta = new Date(order.estimatedDelivery).getTime();
  return Number.isFinite(eta) && eta < now;
}
async function adminApi(user, path, { method = "GET", body, signal } = {}) {
  if (!user) throw new Error("Admin login required");
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
  const result = await response.json().catch(() => ({}));
  if (!response.ok || result.success !== true) {
    throw new Error(result.message || `Request failed (${response.status})`);
  }
  return result;
}
function StatusBadge({ status }) {
  const meta = STATUS[status];
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold ${meta?.css || "bg-base-200 text-muted"}`}
    >
      {meta?.label || status || "—"}
    </span>
  );
}
function Avatar({ name, photoUrl }) {
  const [badUrl, setBadUrl] = useState("");
  return (
    <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-secondary/15 bg-secondary/10 text-secondary">
      {photoUrl && photoUrl !== badUrl ? (
        <img
          src={photoUrl}
          alt={name || "Customer"}
          loading="lazy"
          onError={() => setBadUrl(photoUrl)}
          className="size-full object-cover"
        />
      ) : (
        <UserRound size={19} />
      )}
    </div>
  );
}
function Thumb({ item }) {
  const [badUrl, setBadUrl] = useState("");
  return (
    <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border-2 border-white bg-base-200">
      {item?.image && item.image !== badUrl ? (
        <img
          src={item.image}
          alt={item.name || "Product"}
          loading="lazy"
          onError={() => setBadUrl(item.image)}
          className="size-full object-cover"
        />
      ) : (
        <ImageOff size={17} className="text-secondary" />
      )}
    </div>
  );
}
function ProductPreview({ order }) {
  const items = Array.isArray(order.items) ? order.items : [];
  return (
    <div className="flex min-w-0 items-center gap-2">
      <div className="flex shrink-0 items-center">
        {items.slice(0, 2).map((item, i) => (
          <div key={item.cartId || i} className={i ? "-ml-2" : ""}>
            <Thumb item={item} />
          </div>
        ))}
        {!items.length && (
          <div className="flex size-10 items-center justify-center rounded-lg bg-base-200 text-secondary">
            <ShoppingBag size={17} />
          </div>
        )}
      </div>
      <div className="min-w-0">
        <p
          title={items[0]?.name || ""}
          className="max-w-[155px] truncate text-xs font-semibold text-primary"
        >
          {items[0]?.name || "অর্ডারের পণ্য"}
        </p>
        <p className="mt-1 text-[11px] text-muted">
          মোট {bn(order.itemCount)} পিস
        </p>
      </div>
    </div>
  );
}
function StatCard({
  label,
  detail,
  value,
  icon: Icon,
  iconClass,
  filter,
  selected,
  onSelect,
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => onSelect(filter)}
      className={`rounded-xl border bg-white p-4 text-left shadow-sm transition hover:border-secondary/40 ${selected ? "border-secondary" : "border-base-300/70"}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-xs font-bold text-primary sm:text-sm">{label}</h3>
          <p className="mt-1 text-[11px] text-muted">{detail}</p>
        </div>
        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
        >
          <Icon size={20} />
        </div>
      </div>
      <p className="mt-4 text-2xl font-bold text-primary">{bn(value)}</p>
    </button>
  );
}

// Tracking and ETA are saved through the existing backend endpoint.
function TrackingEditor({ order, saving, onSave, onClose }) {
  const courier = order.courier || {};
  const id = useId();
  const previousETA = dhakaDateTime(order.estimatedDelivery);
  const [suggestions] = useState(readCouriers);
  const [form, setForm] = useState(() => ({
    name: courier.name || "",
    trackingNumber: courier.trackingNumber || "",
    trackingUrl: courier.trackingUrl || "",
    weight: parseWeight(courier.parcelWeight),
    etaDate: previousETA?.date || "",
    etaTime: previousETA?.time || "18:00",
  }));
  const [error, setError] = useState("");
  const [limits] = useState(() => {
    const today = dhakaDateTime().date;
    return { min: addDays(today, 1), max: addMonths(today, 6) };
  });
  const update = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));
  function changeWeightUnit(unit) {
    setForm((current) => {
      const old = current.weight;
      if (!old.value || !Number.isFinite(Number(old.value)))
        return { ...current, weight: { value: "", unit } };
      const value =
        unit === "g" && old.unit === "kg"
          ? Number(old.value) * 1000
          : unit === "kg" && old.unit === "g"
            ? Number(old.value) / 1000
            : Number(old.value);
      return {
        ...current,
        weight: { value: String(Number(value.toFixed(3))), unit },
      };
    });
  }
  async function submit(event) {
    event.preventDefault();
    if (saving) return;
    setError("");
    try {
      const name = form.name.trim();
      const trackingNumber = form.trackingNumber.trim();
      const trackingUrl = form.trackingUrl.trim();
      const parcelWeight = weightForBackend(form.weight);
      if (!name && (trackingNumber || trackingUrl || parcelWeight))
        throw new Error("Courier Name ছাড়া Tracking/Weight দেওয়া যাবে না।");
      if (trackingUrl && !trackingNumber)
        throw new Error("Tracking URL-এর জন্য Tracking ID লাগবে।");
      if (trackingUrl && !safeUrl(trackingUrl))
        throw new Error("Tracking URL অবশ্যই valid HTTPS হতে হবে।");
      if (
        order.status === "shipped" &&
        (!name || !trackingNumber || !form.etaDate)
      )
        throw new Error(
          "Shipped Order-এর Courier Name, Tracking ID এবং ETA প্রয়োজন।",
        );
      const payload = { name, trackingNumber, trackingUrl, parcelWeight };
      const newETA = form.etaDate ? `${form.etaDate}T${form.etaTime}` : "";
      const oldETA = previousETA
        ? `${previousETA.date}T${previousETA.time}`
        : "";
      if (newETA !== oldETA) {
        if (!form.etaDate) {
          if (order.status === "shipped")
            throw new Error("Shipped Order-এর ETA মুছা যাবে না।");
          payload.estimatedDelivery = null;
        } else {
          if (form.etaDate < limits.min || form.etaDate > limits.max)
            throw new Error("নতুন ETA আগামীকাল থেকে ৬ মাসের মধ্যে দিতে হবে।");
          if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(form.etaTime))
            throw new Error("Expected Delivery Time সঠিক নয়।");
          const date = new Date(`${form.etaDate}T${form.etaTime}:00+06:00`);
          if (
            Number.isNaN(date.getTime()) ||
            dhakaDateTime(date)?.date !== form.etaDate
          )
            throw new Error("Delivery Date সঠিক নয়।");
          payload.estimatedDelivery = date.toISOString();
        }
      }
      await onSave(order._id, payload);
      rememberCourier(name);
      onClose();
    } catch (err) {
      setError(err.message || "Courier তথ্য Save করা যায়নি।");
    }
  }
  return (
    <form
      onSubmit={submit}
      noValidate
      className="rounded-xl border border-secondary/20 bg-[#faf7fb] p-4"
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-bold text-primary">
          <Truck size={17} className="text-secondary" /> কুরিয়ার তথ্য আপডেট
        </h3>
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          aria-label="Close editor"
          className="rounded-lg p-1.5 text-muted hover:bg-base-200"
        >
          <X size={17} />
        </button>
      </div>
      <fieldset
        disabled={saving}
        className="grid gap-3 disabled:opacity-60 sm:grid-cols-2 lg:grid-cols-3"
      >
        <label className="space-y-1.5 text-xs font-semibold text-primary">
          Courier Name
          <input
            list={`${id}-couriers`}
            maxLength={150}
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="Steadfast / Pathao"
            className="input input-bordered w-full bg-white text-sm"
          />
          <datalist id={`${id}-couriers`}>
            {suggestions.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </label>
        <label className="space-y-1.5 text-xs font-semibold text-primary">
          Tracking ID
          <input
            maxLength={150}
            value={form.trackingNumber}
            onChange={(e) => update("trackingNumber", e.target.value)}
            placeholder="Courier tracking number"
            className="input input-bordered w-full bg-white text-sm"
          />
        </label>
        <label className="space-y-1.5 text-xs font-semibold text-primary">
          Tracking URL (HTTPS)
          <input
            type="url"
            maxLength={2048}
            value={form.trackingUrl}
            onChange={(e) => update("trackingUrl", e.target.value)}
            placeholder="https://..."
            className="input input-bordered w-full bg-white text-sm"
          />
        </label>
        <div>
          <label
            htmlFor={`${id}-weight`}
            className="text-xs font-semibold text-primary"
          >
            Parcel Weight
          </label>
          <div className="mt-1.5 flex gap-2">
            <input
              id={`${id}-weight`}
              type="number"
              min={form.weight.unit === "kg" ? 0.1 : 100}
              max={form.weight.unit === "kg" ? 100 : 100000}
              step={form.weight.unit === "kg" ? 0.01 : 1}
              value={form.weight.value}
              onChange={(e) =>
                update("weight", { ...form.weight, value: e.target.value })
              }
              placeholder="Weight"
              className="input input-bordered w-full min-w-0 bg-white text-sm"
            />
            <select
              aria-label="Weight unit"
              value={form.weight.unit}
              onChange={(e) => changeWeightUnit(e.target.value)}
              className="select select-bordered w-24 bg-white text-sm"
            >
              <option value="kg">kg</option>
              <option value="g">g</option>
            </select>
          </div>
        </div>
        <label className="space-y-1.5 text-xs font-semibold text-primary">
          Expected Delivery Date
          <input
            type="date"
            min={limits.min}
            max={limits.max}
            value={form.etaDate}
            onChange={(e) => update("etaDate", e.target.value)}
            className="input input-bordered w-full bg-white text-sm"
          />
        </label>
        <label className="space-y-1.5 text-xs font-semibold text-primary">
          Expected Time (BD)
          <input
            type="time"
            disabled={!form.etaDate}
            value={form.etaTime}
            onChange={(e) => update("etaTime", e.target.value)}
            className="input input-bordered w-full bg-white text-sm"
          />
        </label>
      </fieldset>
      <p className="mt-2 text-[11px] text-muted">
        নতুন ETA আগামীকাল থেকে ৬ মাসের মধ্যে। পুরোনো ETA না বদলালে তা বহাল
        থাকবে। ETA পার হলেও Order auto-delivered হয় না।
      </p>
      {error && (
        <p
          role="alert"
          className="mt-3 rounded-lg bg-red-50 p-2.5 text-xs text-red-700"
        >
          {error}
        </p>
      )}
      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          disabled={saving}
          onClick={onClose}
          className="rounded-lg border border-base-300 bg-white px-4 py-2.5 text-xs font-bold text-primary"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50"
        >
          {saving ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Save size={15} />
          )}{" "}
          Save
        </button>
      </div>
    </form>
  );
}

// A collectionId is retained on retries, so an uncertain network result
// cannot create duplicate cash collection records by pressing Save again.
function CashCollectionModal({ order, collectionId, saving, onSave, onClose }) {
  const due = dueAmount(order);
  const [amount, setAmount] = useState(String(due));
  const [note, setNote] = useState("");
  const [ack, setAck] = useState(false);
  const [error, setError] = useState("");
  async function submit(event) {
    event.preventDefault();
    if (saving) return;
    setError("");
    const text = String(amount).trim();
    const value = Number(text);
    if (
      !/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(text) ||
      value <= 0 ||
      value > due
    ) {
      setError(`সঠিক Cash Amount লিখুন (সর্বোচ্চ ${money(due)})।`);
      return;
    }
    if (!note.trim()) {
      setError("Collection Note লিখুন।");
      return;
    }
    if (!ack) {
      setError("বাস্তবে টাকা পাওয়ার Confirmation দিতে হবে।");
      return;
    }
    try {
      await onSave(order._id, {
        collectionId,
        amount: value,
        note: note.trim(),
      });
    } catch (err) {
      setError(err.message || "Cash Collection Save করা যায়নি।");
    }
  }
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Record cash collection"
      className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl"
    >
      <div className="flex items-center justify-between border-b border-base-300 bg-secondary/5 px-5 py-4">
        <div>
          <h3 className="flex items-center gap-2 font-bold text-primary">
            <Banknote size={19} className="text-secondary" /> Cash Collection
          </h3>
          <p className="mt-1 text-xs text-muted">
            #{order.orderNumber} ·{" "}
            {order.payment?.method === "cod" ? "COD" : "Mobile Banking Balance"}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          aria-label="Close"
          className="rounded-lg p-2 text-muted"
        >
          <X size={19} />
        </button>
      </div>
      <form noValidate onSubmit={submit} className="space-y-4 p-5">
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="rounded-xl bg-base-200 p-3">
            <p className="text-muted">Order Total</p>
            <p className="mt-1 font-bold text-primary">{money(order.total)}</p>
          </div>
          <div className="rounded-xl bg-base-200 p-3">
            <p className="text-muted">Received</p>
            <p className="mt-1 font-bold text-primary">
              {money(order.payment?.verifiedAmount)}
            </p>
          </div>
          <div className="rounded-xl bg-gold-soft/30 p-3">
            <p className="text-muted">বকেয়া</p>
            <p className="mt-1 font-bold text-primary">{money(due)}</p>
          </div>
        </div>
        <p className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-800">
          <AlertTriangle size={17} className="mt-0.5 shrink-0" /> শুধু বাস্তবে
          পাওয়া নগদ টাকা Record করুন। Phone Confirmation বা কথার ভিত্তিতে টাকা
          প্রাপ্ত হিসেবে Record করবেন না।
        </p>
        <label className="block text-xs font-semibold text-primary">
          Collected Cash (৳) *
          <input
            type="number"
            min="0.01"
            step="0.01"
            max={due}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={saving}
            className="input input-bordered mt-1.5 w-full bg-white text-sm"
          />
        </label>
        <label className="block text-xs font-semibold text-primary">
          Collection Note *
          <textarea
            rows={2}
            maxLength={500}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={saving}
            placeholder="Courier cash / customer handover details"
            className="textarea textarea-bordered mt-1.5 w-full bg-white text-sm"
          />
        </label>
        <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-secondary/20 bg-secondary/5 p-3 text-xs leading-5 text-primary">
          <input
            type="checkbox"
            className="checkbox checkbox-secondary checkbox-xs mt-0.5"
            checked={ack}
            disabled={saving}
            onChange={(e) => setAck(e.target.checked)}
          />{" "}
          আমি নিশ্চিত করছি, এই নগদ টাকা বাস্তবে গ্রহণ করেছি।
        </label>
        {error && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 p-3 text-xs text-red-700"
          >
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border border-base-300 px-4 py-2.5 text-xs font-bold text-primary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || due <= 0}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50"
          >
            {saving ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Save size={15} />
            )}{" "}
            Record Cash
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AdminDeliveryManagementPage() {
  const auth = useContext(AuthContext) || {};
  const { user, loading } = auth;
  const role = auth.role ?? auth.roleState?.role;
  const status = auth.accountStatus ?? auth.roleState?.status;
  const checking = Boolean(
    loading || (user && (auth.roleLoading || auth.roleState?.checking)),
  );
  const allowed =
    !checking && Boolean(user) && role === "admin" && status === "active";
  const queryClient = useQueryClient();
  const collectionIds = useRef({});
  const [view, setView] = useState("all");
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState(null);
  const [cashOrder, setCashOrder] = useState(null);
  const [loadingCashId, setLoadingCashId] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => setNowMs(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  const query = useQuery({
    queryKey: [
      "admin-deliveries",
      user?.uid,
      page,
      view,
      sort,
      submittedSearch,
    ],
    enabled: allowed,
    queryFn: ({ signal }) => {
      const params = new URLSearchParams({
        page: String(page),
        view,
        sort,
        search: submittedSearch,
      });
      return adminApi(user, `/admin/deliveries?${params}`, { signal });
    },
    staleTime: 15000,
    refetchOnWindowFocus: true,
    refetchInterval: 60000,
    retry: 1,
  });
  const action = useMutation({
    mutationFn: ({ id, endpoint, body }) =>
      adminApi(user, `/admin/orders/${encodeURIComponent(id)}/${endpoint}`, {
        method: "PATCH",
        body,
      }),
    onSuccess: async () => {
      await Promise.all(
        [
          ["admin-deliveries"],
          ["admin-orders"],
          ["admin-dashboard"],
          ["admin-order-detail"],
          ["admin-payments"],
          ["my-orders"],
          ["sokhbilash-order-details"],
        ].map((queryKey) => queryClient.invalidateQueries({ queryKey })),
      );
    },
  });

  async function saveTracking(id, body) {
    await action.mutateAsync({ id, endpoint: "tracking", body });
    void Swal.fire({
      toast: true,
      icon: "success",
      title: "Courier তথ্য Save হয়েছে",
      position: "top-end",
      timer: 1400,
      showConfirmButton: false,
    });
  }
  async function getFullOrder(id) {
    const result = await adminApi(
      user,
      `/admin/orders/${encodeURIComponent(id)}`,
    );
    if (!result.order) throw new Error("Full Order Details পাওয়া যায়নি।");
    return result.order;
  }
  function showCashOrder(full) {
    if (
      typeof crypto === "undefined" ||
      typeof crypto.randomUUID !== "function"
    )
      throw new Error(
        "Cash Collection-এর জন্য HTTPS/localhost browser প্রয়োজন।",
      );
    collectionIds.current[full._id] ||= crypto.randomUUID();
    setEditingId(null);
    setCashOrder(full);
  }
  async function openCash(order) {
    if (action.isPending || loadingCashId) return;
    setLoadingCashId(order._id);
    try {
      const fresh = await getFullOrder(order._id);
      if (
        !["verified", "processing", "shipped", "delivered"].includes(
          fresh.status,
        )
      )
        throw new Error("এই Order-এ Cash Collection করা যাবে না।");
      if (!fresh.phoneConfirmed)
        throw new Error(
          "Order Details থেকে আগে Phone Confirmation সম্পন্ন করুন।",
        );
      if (dueAmount(fresh) <= 0) {
        void Swal.fire({
          icon: "info",
          title: "বকেয়া নেই",
          text: "এই অর্ডারের আর কোনো টাকা সংগ্রহ বাকি নেই।",
          confirmButtonColor: "#76258A",
        });
        return;
      }
      showCashOrder(fresh);
    } catch (error) {
      void Swal.fire({
        icon: "error",
        title: "Cash Collection Blocked",
        text: error.message,
        confirmButtonColor: "#76258A",
      });
    } finally {
      setLoadingCashId(null);
    }
  }
  async function recordCash(id, body) {
    await action.mutateAsync({ id, endpoint: "collect-balance", body });
    delete collectionIds.current[id];
    setCashOrder(null);
    void Swal.fire({
      icon: "success",
      title: "Cash Collection Recorded",
      timer: 1600,
      showConfirmButton: false,
    });
  }
  async function changeStatus(order, next) {
    if (action.isPending || loadingCashId || NEXT_STATUS[order.status] !== next)
      return;
    if (
      next === "shipped" &&
      (!order.courier?.name ||
        !order.courier?.trackingNumber ||
        !order.estimatedDelivery)
    ) {
      setEditingId(order._id);
      void Swal.fire({
        icon: "warning",
        title: "Courier তথ্য অসম্পূর্ণ",
        text: "Shipped করার আগে Courier Name, Tracking ID ও ETA Save কর।",
        confirmButtonColor: "#76258A",
      });
      return;
    }
    if (next === "delivered") {
      try {
        setLoadingCashId(order._id);
        const fresh = await getFullOrder(order._id);
        if (!fresh.phoneConfirmed)
          throw new Error(
            "Phone Confirmation বাকি। আগে Order Details থেকে নিশ্চিত করুন।",
          );
        if (dueAmount(fresh) > 0) {
          const answer = await Swal.fire({
            icon: "warning",
            title: `বকেয়া ${money(dueAmount(fresh))}`,
            text: "Delivered করার আগে বাস্তবে আদায় করা টাকা রেকর্ড করুন।",
            showCancelButton: true,
            confirmButtonText: "Collect Cash",
            cancelButtonText: "Back",
            confirmButtonColor: "#76258A",
          });
          if (answer.isConfirmed) showCashOrder(fresh);
          return;
        }
        if (
          Number(fresh.payment?.verifiedAmount || 0) >
            Number(fresh.total || 0) &&
          fresh.payment?.excessResolution?.status !== "completed"
        ) {
          throw new Error(
            "অতিরিক্ত টাকা ফেরত / সমমূল্যের পণ্য দেওয়া এখনো সম্পন্ন হয়নি। Order Details থেকে সমাধান করুন।",
          );
        }
      } catch (error) {
        void Swal.fire({
          icon: "error",
          title: "Delivery Blocked",
          text: error.message,
          confirmButtonColor: "#76258A",
        });
        return;
      } finally {
        setLoadingCashId(null);
      }
    }
    const answer = await Swal.fire({
      icon: "question",
      title:
        next === "delivered"
          ? "ডেলিভারি নিশ্চিত হয়েছে?"
          : next === "shipped"
            ? "কুরিয়ারে পাঠানো হয়েছে?"
            : "প্রসেসিং শুরু করবেন?",
      text:
        next === "delivered"
          ? "প্রকৃত ডেলিভারি নিশ্চিত হওয়ার পরই Delivered করুন। Backend পুনরায় Payment যাচাই করবে।"
          : "Order Status ম্যানুয়ালি পরিবর্তন হবে।",
      showCancelButton: true,
      confirmButtonText: "Confirm",
      cancelButtonText: "Back",
      confirmButtonColor: "#76258A",
    });
    if (!answer.isConfirmed || action.isPending) return;
    try {
      await action.mutateAsync({
        id: order._id,
        endpoint: "status",
        body: { status: next },
      });
      setEditingId(null);
      void Swal.fire({
        icon: "success",
        title: "Status Updated",
        timer: 1400,
        showConfirmButton: false,
      });
    } catch (error) {
      void Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: error.message,
        confirmButtonColor: "#76258A",
      });
    }
  }
  function changeView(next) {
    if (action.isPending) return;
    setView(next);
    setPage(1);
    setEditingId(null);
  }
  function toggleEditor(order) {
    if (action.isPending) return;
    setEditingId((prev) => (prev === order._id ? null : order._id));
    action.reset();
  }

  const deliveries = Array.isArray(query.data?.deliveries)
    ? query.data.deliveries
    : [];
  const stats = query.data?.stats || {};
  const pagination = query.data?.pagination || {};
  const total = Number(pagination.total || 0);
  const pages = Math.max(1, Number(pagination.totalPages) || 1);

  // Keep hooks above conditional returns.
  if (checking)
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-2 text-secondary">
        <Loader2 className="animate-spin" /> Admin যাচাই হচ্ছে...
      </div>
    );
  if (!allowed)
    return (
      <div className="rounded-xl bg-white p-12 text-center">
        <ShieldCheck size={32} className="mx-auto text-secondary" />
        <h2 className="mt-3 font-bold text-primary">Access Denied</h2>
        <p className="mt-2 text-xs text-muted">Active Admin Account প্রয়োজন।</p>
      </div>
    );

  return (
    <div className="mx-auto max-w-[1600px] space-y-5 pb-10">
      {cashOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-primary/60 p-3 sm:p-6">
          <CashCollectionModal
            key={cashOrder._id}
            order={cashOrder}
            collectionId={collectionIds.current[cashOrder._id]}
            saving={action.isPending}
            onSave={recordCash}
            onClose={() => {
              if (!action.isPending) setCashOrder(null);
            }}
          />
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-primary sm:text-2xl">
            ডেলিভারি ম্যানেজমেন্ট
          </h1>
          <p className="mt-1 text-xs text-muted">
            Order Dispatch, Courier Tracking & Manual Delivery Confirmation
          </p>
        </div>
        <button
          type="button"
          onClick={() => query.refetch()}
          disabled={query.isFetching || action.isPending}
          className="inline-flex items-center gap-2 rounded-xl border border-base-300 bg-white px-4 py-2.5 text-xs font-bold text-secondary disabled:opacity-40"
        >
          <RefreshCcw
            size={15}
            className={query.isFetching ? "animate-spin" : ""}
          />{" "}
          Refresh
        </button>
      </div>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <StatCard
          label="প্রস্তুতির অপেক্ষায়"
          detail="Verified orders"
          value={stats.verified}
          icon={PackageSearch}
          iconClass="bg-blue-100 text-blue-700"
          filter="verified"
          selected={view === "verified"}
          onSelect={changeView}
        />
        <StatCard
          label="প্যাকিং / প্রসেসিং"
          detail="Awaiting dispatch"
          value={stats.processing}
          icon={ShoppingBag}
          iconClass="bg-purple-100 text-purple-700"
          filter="processing"
          selected={view === "processing"}
          onSelect={changeView}
        />
        <StatCard
          label="কুরিয়ারে / পথে"
          detail="In transit"
          value={stats.shipped}
          icon={Truck}
          iconClass="bg-indigo-100 text-indigo-700"
          filter="shipped"
          selected={view === "shipped"}
          onSelect={changeView}
        />
        <StatCard
          label="সফল ডেলিভারি"
          detail="Manually confirmed"
          value={stats.delivered}
          icon={PackageCheck}
          iconClass="bg-green-100 text-green-700"
          filter="delivered"
          selected={view === "delivered"}
          onSelect={changeView}
        />
        <StatCard
          label="সময় অতিক্রান্ত"
          detail="Shipped + ETA passed"
          value={stats.overdue}
          icon={AlertTriangle}
          iconClass="bg-amber-100 text-amber-800"
          filter="overdue"
          selected={view === "overdue"}
          onSelect={changeView}
        />
      </section>

      <section className="overflow-hidden rounded-2xl border border-base-300/70 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-base-300 p-4 sm:p-5">
          <div>
            <h2 className="text-base font-bold text-primary">
              ডেলিভারি অর্ডারসমূহ
            </h2>
            <p className="mt-1 text-xs text-muted">
              Courier & Fulfillment Management
            </p>
          </div>
          <span className="rounded-full bg-secondary/10 px-3 py-1.5 text-xs font-bold text-secondary">
            {bn(total)} Results
          </span>
        </div>
        <div className="flex gap-2 overflow-x-auto border-b border-base-300 px-4 py-3 sm:px-5">
          {VIEWS.map(([value, label]) => (
            <button
              key={value}
              type="button"
              disabled={action.isPending}
              onClick={() => changeView(value)}
              aria-pressed={view === value}
              className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-50 ${view === value ? "bg-primary text-white" : "bg-base-200 text-muted hover:text-secondary"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!action.isPending) {
              setSubmittedSearch(search.trim());
              setPage(1);
              setEditingId(null);
            }
          }}
          className="grid gap-3 border-b border-base-300 p-4 sm:grid-cols-[minmax(0,1fr)_180px_auto] sm:p-5"
        >
          <label className="flex h-11 items-center gap-2 rounded-xl border border-base-300 bg-base-200 px-3">
            <Search size={16} className="shrink-0 text-muted" />
            <input
              value={search}
              maxLength={80}
              disabled={action.isPending}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Order, Customer, Phone, Courier, Tracking..."
              className="w-full min-w-0 bg-transparent text-xs text-primary outline-none"
            />
          </label>
          <select
            aria-label="Sort deliveries"
            value={sort}
            disabled={action.isPending}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
              setEditingId(null);
            }}
            className="h-11 rounded-xl border border-base-300 bg-base-200 px-3 text-xs font-semibold text-primary"
          >
            <option value="newest">Newest Orders</option>
            <option value="oldest">Oldest Orders</option>
            <option value="eta_soon">ETA: Earliest First</option>
          </select>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={action.isPending}
              className="flex-1 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
            >
              Search
            </button>
            <button
              type="button"
              disabled={action.isPending}
              onClick={() => {
                setSearch("");
                setSubmittedSearch("");
                setSort("newest");
                changeView("all");
              }}
              className="rounded-xl border border-base-300 px-3 py-2 text-xs font-semibold text-secondary disabled:opacity-50"
            >
              Reset
            </button>
          </div>
        </form>

        {query.isError && (
          <div
            role="alert"
            className="m-4 rounded-xl bg-red-50 p-4 text-xs text-red-700"
          >
            <AlertTriangle size={16} className="mr-2 inline" />
            {query.error?.message || "Delivery data load failed"}
            <button
              type="button"
              onClick={() => query.refetch()}
              className="ml-2 font-bold underline"
            >
              Retry
            </button>
          </div>
        )}
        {action.isError && !editingId && !cashOrder && (
          <p
            role="alert"
            className="m-4 rounded-xl bg-red-50 p-4 text-xs text-red-700"
          >
            {action.error?.message}
          </p>
        )}
        {query.isPending ? (
          <div className="flex min-h-60 flex-col items-center justify-center gap-2">
            <Loader2 size={26} className="animate-spin text-secondary" />
            <p className="text-xs text-muted">Delivery data লোড হচ্ছে...</p>
          </div>
        ) : (
          !query.isError && (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[1250px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-base-300 bg-secondary/5 text-xs font-bold text-primary/60">
                      <th className="px-5 py-3">Order / Date</th>
                      <th className="px-5 py-3">Customer</th>
                      <th className="px-5 py-3">Products</th>
                      <th className="px-5 py-3">Destination</th>
                      <th className="px-5 py-3">Courier / Tracking</th>
                      <th className="px-5 py-3">Expected Delivery</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-base-300/60">
                    {deliveries.map((order, index) => {
                      const next = NEXT_STATUS[order.status];
                      const overdue = isOverdue(order, nowMs);
                      const tracking = safeUrl(order.courier?.trackingUrl);
                      return (
                        <Fragment key={order._id}>
                          <tr
                            className={`${index % 2 ? "bg-[#faf7fb]" : "bg-white"} hover:bg-secondary/5`}
                          >
                            <td className="px-5 py-3">
                              <p
                                title={order.orderNumber}
                                className="max-w-[195px] truncate text-xs font-bold text-primary"
                              >
                                #{order.orderNumber}
                              </p>
                              <p className="mt-1 flex items-center gap-1 text-[11px] text-muted">
                                <CalendarDays size={12} />
                                {dateText(order.createdAt)}
                              </p>
                            </td>
                            <td className="px-5 py-3">
                              <div className="flex min-w-[165px] items-center gap-2">
                                <Avatar
                                  name={order.customer?.name}
                                  photoUrl={order.customerPhotoUrl}
                                />
                                <div className="min-w-0">
                                  <p
                                    title={order.customer?.name}
                                    className="max-w-[135px] truncate text-xs font-semibold text-primary"
                                  >
                                    {order.customer?.name || "—"}
                                  </p>
                                  <p className="mt-1 text-[11px] text-muted">
                                    {order.customer?.phone ||
                                      order.shipping?.phone ||
                                      "—"}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-3">
                              <ProductPreview order={order} />
                            </td>
                            <td className="px-5 py-3">
                              <p className="max-w-[135px] truncate text-xs font-semibold text-primary">
                                {order.shipping?.district || "—"}
                              </p>
                              <p className="mt-1 max-w-[135px] truncate text-[11px] text-muted">
                                {order.shipping?.division || "—"}
                              </p>
                            </td>
                            <td className="px-5 py-3">
                              <p className="max-w-[155px] truncate text-xs font-semibold text-primary">
                                {order.courier?.name || "কুরিয়ার যোগ হয়নি"}
                              </p>
                              {order.courier?.trackingNumber && (
                                <p className="mt-1 max-w-[155px] truncate text-[11px] text-muted">
                                  {order.courier.trackingNumber}
                                </p>
                              )}
                              {tracking && (
                                <a
                                  href={tracking}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mt-1 inline-flex items-center gap-1 text-[11px] text-secondary"
                                >
                                  Track <ExternalLink size={12} />
                                </a>
                              )}
                            </td>
                            <td className="px-5 py-3">
                              <p
                                className={`whitespace-nowrap text-xs font-semibold ${overdue ? "text-red-700" : "text-primary"}`}
                              >
                                {dateText(order.estimatedDelivery)}
                              </p>
                              {overdue && (
                                <p className="mt-1 text-[11px] text-red-700">
                                  Overdue
                                </p>
                              )}
                            </td>
                            <td className="px-5 py-3 text-center">
                              <StatusBadge status={order.status} />
                              {order.payment?.method === "cod" && (
                                <p className="mx-auto mt-1 w-fit rounded-full border border-amber-500/70 px-3 text-[11px] font-bold text-amber-700">
                                  COD
                                </p>
                              )}
                            </td>
                            <td className="px-5 py-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {next && (
                                  <button
                                    type="button"
                                    disabled={
                                      action.isPending || Boolean(loadingCashId)
                                    }
                                    onClick={() => changeStatus(order, next)}
                                    className="rounded-lg bg-primary px-3 py-2 text-[11px] font-bold text-white disabled:opacity-40"
                                  >
                                    {NEXT_LABEL[next]}
                                  </button>
                                )}
                                {next && (
                                  <button
                                    type="button"
                                    title="Record received cash"
                                    disabled={
                                      action.isPending || Boolean(loadingCashId)
                                    }
                                    onClick={() => openCash(order)}
                                    className="inline-flex items-center gap-1 rounded-lg border border-secondary/20 bg-secondary/5 px-2.5 py-2 text-[11px] font-bold text-secondary disabled:opacity-40"
                                  >
                                    {loadingCashId === order._id ? (
                                      <Loader2
                                        size={13}
                                        className="animate-spin"
                                      />
                                    ) : (
                                      <Wallet size={13} />
                                    )}{" "}
                                    Cash
                                  </button>
                                )}
                                {order.status !== "delivered" && (
                                  <button
                                    type="button"
                                    title="Edit courier"
                                    disabled={action.isPending}
                                    onClick={() => toggleEditor(order)}
                                    className="inline-flex items-center rounded-lg border border-base-300 px-2.5 py-2 text-primary hover:bg-secondary/20 disabled:opacity-50"
                                  >
                                    <Pencil size={13} />
                                  </button>
                                )}
                                <Link
                                  to={`/admin/orders/${encodeURIComponent(order._id)}`}
                                  title="Order Details"
                                  className="rounded-lg bg-secondary/10 px-2.5 py-2 text-secondary"
                                >
                                  <Eye size={14} />
                                </Link>
                              </div>
                            </td>
                          </tr>
                          {editingId === order._id && (
                            <tr>
                              <td colSpan={8} className="p-3 sm:p-4">
                                <TrackingEditor
                                  key={order._id}
                                  order={order}
                                  saving={action.isPending}
                                  onSave={saveTracking}
                                  onClose={() => setEditingId(null)}
                                />
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="space-y-3 p-3 lg:hidden">
                {deliveries.map((order) => {
                  const next = NEXT_STATUS[order.status];
                  const overdue = isOverdue(order, nowMs);
                  const tracking = safeUrl(order.courier?.trackingUrl);
                  return (
                    <article
                      key={order._id}
                      className="overflow-hidden rounded-xl border border-base-300 bg-white"
                    >
                      <div className="flex items-center justify-between gap-2 bg-base-200/70 p-3">
                        <div>
                          <p className="break-all text-xs font-bold text-primary">
                            #{order.orderNumber}
                          </p>
                          <p className="mt-1 text-[11px] text-muted">
                            {dateText(order.createdAt)}
                          </p>
                        </div>
                        <StatusBadge status={order.status} />
                      </div>
                      <div className="space-y-3 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-2">
                            <Avatar
                              name={order.customer?.name}
                              photoUrl={order.customerPhotoUrl}
                            />
                            <div className="min-w-0">
                              <p className="truncate text-xs font-bold text-primary">
                                {order.customer?.name || "—"}
                              </p>
                              <p className="text-[11px] text-muted">
                                {order.customer?.phone ||
                                  order.shipping?.phone ||
                                  "—"}
                              </p>
                            </div>
                          </div>
                          <span className="shrink-0 text-sm font-bold text-primary">
                            {money(order.total)}
                          </span>
                        </div>
                        <ProductPreview order={order} />
                        <div className="grid grid-cols-2 gap-3 rounded-lg bg-base-200/60 p-3 text-xs">
                          <div>
                            <p className="text-muted">Delivery Location</p>
                            <p className="mt-1 font-semibold text-primary">
                              {order.shipping?.district || "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted">Courier</p>
                            <p className="mt-1 font-semibold text-primary">
                              {order.courier?.name || "এখনো যোগ হয়নি"}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted">Tracking ID</p>
                            <p className="mt-1 break-all font-semibold text-primary">
                              {order.courier?.trackingNumber || "—"}
                            </p>
                            {tracking && (
                              <a
                                href={tracking}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-1 inline-flex items-center gap-1 text-secondary"
                              >
                                Track <ExternalLink size={12} />
                              </a>
                            )}
                          </div>
                          <div>
                            <p className="text-muted">Expected Delivery</p>
                            <p
                              className={`mt-1 font-semibold ${overdue ? "text-red-700" : "text-primary"}`}
                            >
                              {dateText(order.estimatedDelivery)}
                            </p>
                            {overdue && (
                              <p className="mt-1 text-red-700">Overdue</p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Link
                            to={`/admin/orders/${encodeURIComponent(order._id)}`}
                            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-secondary/10 px-3 py-2.5 text-xs font-bold text-secondary"
                          >
                            <Eye size={15} /> Details
                          </Link>
                          {order.status !== "delivered" && (
                            <button
                              type="button"
                              disabled={action.isPending}
                              onClick={() => toggleEditor(order)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-base-300 px-3 py-2.5 text-xs font-bold text-primary disabled:opacity-50"
                            >
                              <Pencil size={15} /> Edit
                            </button>
                          )}
                          {next && (
                            <button
                              type="button"
                              disabled={
                                action.isPending || Boolean(loadingCashId)
                              }
                              onClick={() => openCash(order)}
                              className="inline-flex items-center gap-1 rounded-lg border border-secondary/20 bg-secondary/5 px-3 py-2.5 text-xs font-bold text-secondary disabled:opacity-40"
                            >
                              {loadingCashId === order._id ? (
                                <Loader2 size={15} className="animate-spin" />
                              ) : (
                                <Wallet size={15} />
                              )}{" "}
                              Collect Cash
                            </button>
                          )}
                          {next && (
                            <button
                              type="button"
                              disabled={
                                action.isPending || Boolean(loadingCashId)
                              }
                              onClick={() => changeStatus(order, next)}
                              className="rounded-lg bg-primary px-3 py-2.5 text-xs font-bold text-white disabled:opacity-40"
                            >
                              {NEXT_LABEL[next]}
                            </button>
                          )}
                        </div>
                        {editingId === order._id && (
                          <TrackingEditor
                            key={order._id}
                            order={order}
                            saving={action.isPending}
                            onSave={saveTracking}
                            onClose={() => setEditingId(null)}
                          />
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
              {deliveries.length === 0 && (
                <div className="py-12 text-center text-sm text-muted">
                  <PackageSearch
                    size={30}
                    className="mx-auto mb-3 text-secondary"
                  />
                  এই Filter-এ কোনো ডেলিভারি অর্ডার পাওয়া যায়নি।
                </div>
              )}
              {total > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-base-300 p-4 sm:px-5">
                  <p className="text-xs text-muted">
                    Showing {bn((page - 1) * PAGE_SIZE + 1)}–
                    {bn(Math.min(page * PAGE_SIZE, total))} of {bn(total)}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-label="Previous page"
                      disabled={page <= 1 || action.isPending}
                      onClick={() => {
                        setPage((v) => Math.max(1, v - 1));
                        setEditingId(null);
                      }}
                      className="rounded-lg border border-base-300 p-2 text-primary disabled:opacity-30"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white">
                      {page} / {pages}
                    </span>
                    <button
                      type="button"
                      aria-label="Next page"
                      disabled={page >= pages || action.isPending}
                      onClick={() => {
                        setPage((v) => Math.min(pages, v + 1));
                        setEditingId(null);
                      }}
                      className="rounded-lg border border-base-300 p-2 text-primary disabled:opacity-30"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )
        )}
      </section>
      <p className="text-[11px] leading-5 text-muted">
        Expected Delivery কেবল আনুমানিক সময়। কুরিয়ার বা কাস্টমারের কাছ থেকে
        প্রকৃত ডেলিভারি নিশ্চিত হওয়ার পরই Delivered করুন। COD / Partial
        Payment-এর বাকি টাকা বাস্তবে গ্রহণ করে Cash Collection-এ রেকর্ড করতে
        হবে; শুধু ফোনে নিশ্চিত করলেই Paid ধরা হবে না।
      </p>
    </div>
  );
}
