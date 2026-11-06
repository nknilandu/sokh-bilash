import { Fragment, useContext, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
import {
  Truck,
  PackageCheck,
  PackageSearch,
  AlertTriangle,
  CalendarDays,
  Search,
  RefreshCcw,
  Eye,
  Pencil,
  Save,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  UserRound,
  ExternalLink,
  ShoppingBag,
  ShieldCheck,
} from "lucide-react";
import { AuthContext } from "../../providers/AuthProvider";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/$/, "");
const COURIER_STORAGE_KEY = "sokhbilash-admin-courier-names";
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
const money = (n) =>
  `৳${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const bn = (n) => Number(n || 0).toLocaleString("bn-BD");
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
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(dt);
  const part = (type) => parts.find((p) => p.type === type)?.value;
  return {
    date: `${part("year")}-${part("month")}-${part("day")}`,
    time: `${part("hour")}:${part("minute")}`,
  };
}
function nextDate(date, days) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}
function plusMonths(date, count) {
  const [y, m, d] = date.split("-").map(Number);
  const first = new Date(Date.UTC(y, m - 1 + count, 1));
  const last = new Date(
    Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0),
  ).getUTCDate();
  return new Date(
    Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), Math.min(d, last)),
  )
    .toISOString()
    .slice(0, 10);
}
function savedCouriers() {
  try {
    const list = JSON.parse(localStorage.getItem(COURIER_STORAGE_KEY) || "[]");
    return Array.isArray(list)
      ? list.filter((x) => typeof x === "string" && x.trim())
      : [];
  } catch {
    return [];
  }
}
function saveCourierName(value) {
  if (!value.trim()) return;
  try {
    const list = [
      value.trim(),
      ...savedCouriers().filter(
        (x) => x.toLowerCase() !== value.trim().toLowerCase(),
      ),
    ].slice(0, 20);
    localStorage.setItem(COURIER_STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* Optional browser cache */
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
  const [broken, setBroken] = useState("");
  return (
    <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-secondary/15 bg-secondary/10 text-secondary">
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
function ProductPreview({ order }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <div className="flex shrink-0">
        {(order.items || []).slice(0, 2).map((item, index) => (
          <div
            key={item.cartId || index}
            className={`size-10 overflow-hidden rounded-lg border-2 border-white bg-base-200 ${index ? "-ml-2" : ""}`}
          >
            {item.image ? (
              <img
                src={item.image}
                alt={item.name || "Product"}
                className="size-full object-cover"
                loading="lazy"
              />
            ) : (
              <ShoppingBag size={17} className="m-2 text-secondary" />
            )}
          </div>
        ))}
      </div>
      <div className="min-w-0">
        <p
          title={order.items?.[0]?.name}
          className="max-w-[155px] truncate text-xs font-semibold text-primary"
        >
          {order.items?.[0]?.name || "অর্ডারের পণ্য"}
        </p>
        <p className="mt-1 text-[11px] text-muted">
          মোট {bn(order.itemCount)} পিস
        </p>
      </div>
    </div>
  );
}
async function adminApi(user, path, { method = "GET", body, signal } = {}) {
  if (!user) throw new Error("Admin login required");
  const token = await user.getIdToken();
  const response = await fetch(`${API_URL}${path}`, {
    method,
    signal,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok || json.success !== true)
    throw new Error(json.message || `Request failed (${response.status})`);
  return json;
}

// Existing PATCH /admin/orders/:id/tracking contract.
function TrackingEditor({ order, saving, onSave, onCancel }) {
  const courier = order.courier || {};
  const previousETA = dhakaDateTime(order.estimatedDelivery);
  const [form, setForm] = useState({
    name: courier.name || savedCouriers()[0] || "",
    trackingNumber: courier.trackingNumber || "",
    trackingUrl: courier.trackingUrl || "",
    weight: parseWeight(courier.parcelWeight),
    etaDate: previousETA?.date || "",
    etaTime: previousETA?.time || "18:00",
  });
  const [error, setError] = useState("");
  const [suggestions] = useState(savedCouriers);
  const update = (key, value) => setForm((old) => ({ ...old, [key]: value }));
  const today = dhakaDateTime().date;
  const minDate = nextDate(today, 1);
  const maxDate = plusMonths(today, 6);

  async function submit(e) {
    e.preventDefault();
    setError("");
    const name = form.name.trim();
    const trackingNumber = form.trackingNumber.trim();
    const trackingUrl = form.trackingUrl.trim();
    let parcelWeight = "";
    if (form.weight.value !== "") {
      const quantity = Number(form.weight.value);
      const kg = form.weight.unit === "g" ? quantity / 1000 : quantity;
      if (!Number.isFinite(quantity) || kg < 0.1 || kg > 100) {
        setError("Weight 0.1 থেকে 100 kg-এর মধ্যে হতে হবে।");
        return;
      }
      if (form.weight.unit === "kg") {
        if (!/^\d+(?:\.\d{1,2})?$/.test(form.weight.value)) {
          setError("kg-তে সর্বোচ্চ ২ ঘর দশমিক ব্যবহার কর।");
          return;
        }
        parcelWeight = `${quantity} kg`;
      } else {
        if (!Number.isInteger(quantity)) {
          setError("Gram অবশ্যই পূর্ণসংখ্যা হবে।");
          return;
        }
        // Current backend accepts four-digit gram quantities or kg with two decimals.
        if (quantity <= 9999) parcelWeight = `${quantity} g`;
        else if (quantity % 10 === 0)
          parcelWeight = `${Number((quantity / 1000).toFixed(2))} kg`;
        else {
          setError("9999 g-এর বেশি হলে 10 g-এর গুণিতক দিন অথবা kg ব্যবহার কর।");
          return;
        }
      }
    }
    if (!name && (trackingNumber || trackingUrl || parcelWeight)) {
      setError("Courier Name প্রয়োজন।");
      return;
    }
    if (trackingUrl && !trackingNumber) {
      setError("Tracking URL-এর জন্য Tracking ID প্রয়োজন।");
      return;
    }
    if (trackingUrl) {
      try {
        const u = new URL(trackingUrl);
        if (u.protocol !== "https:" || u.username || u.password)
          throw new Error("url");
      } catch {
        setError("Valid HTTPS Tracking URL দিতে হবে।");
        return;
      }
    }
    if (
      order.status === "shipped" &&
      (!name || !trackingNumber || !form.etaDate)
    ) {
      setError(
        "Shipped Order-এর Courier Name, Tracking ID এবং Expected Delivery রাখতে হবে।",
      );
      return;
    }
    const payload = { name, trackingNumber, trackingUrl, parcelWeight };
    const newETA = form.etaDate ? `${form.etaDate}T${form.etaTime}` : "";
    const oldETA = previousETA ? `${previousETA.date}T${previousETA.time}` : "";
    if (newETA !== oldETA) {
      if (!form.etaDate) {
        if (order.status === "shipped") {
          setError("Shipped order-এর ETA ফাঁকা করা যাবে না।");
          return;
        }
        payload.estimatedDelivery = null;
      } else {
        if (form.etaDate < minDate || form.etaDate > maxDate) {
          setError(
            "নতুন Expected Delivery আগামীকাল থেকে ৬ মাসের মধ্যে হতে হবে।",
          );
          return;
        }
        if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(form.etaTime)) {
          setError("সঠিক সময় দাও।");
          return;
        }
        const eta = new Date(`${form.etaDate}T${form.etaTime}:00+06:00`);
        if (Number.isNaN(eta.getTime())) {
          setError("Invalid delivery date");
          return;
        }
        payload.estimatedDelivery = eta.toISOString();
      }
    }
    try {
      await onSave(order._id, payload);
      saveCourierName(name);
      onCancel();
    } catch (err) {
      setError(err.message || "Courier save হয়নি।");
    }
  }

  return (
    <form
      noValidate
      onSubmit={submit}
      className="rounded-xl border border-secondary/20 bg-[#faf7fb] p-4"
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-bold text-primary">
          <Truck size={17} className="text-secondary" /> কুরিয়ার তথ্য আপডেট
        </h3>
        <button
          type="button"
          disabled={saving}
          onClick={onCancel}
          aria-label="Close editor"
          className="rounded-lg p-1.5 text-muted hover:bg-base-200"
        >
          <X size={17} />
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="space-y-1.5 text-xs font-semibold text-primary">
          Courier Name
          <input
            value={form.name}
            list={`courier-names-${order._id}`}
            maxLength={150}
            onChange={(e) => update("name", e.target.value)}
            placeholder="Steadfast / Pathao"
            className="input input-bordered w-full bg-white text-sm"
          />
          <datalist id={`courier-names-${order._id}`}>
            {suggestions.map((x) => (
              <option value={x} key={x} />
            ))}
          </datalist>
        </label>
        <label className="space-y-1.5 text-xs font-semibold text-primary">
          Tracking ID
          <input
            value={form.trackingNumber}
            maxLength={150}
            onChange={(e) => update("trackingNumber", e.target.value)}
            placeholder="Courier tracking number"
            className="input input-bordered w-full bg-white text-sm"
          />
        </label>
        <label className="space-y-1.5 text-xs font-semibold text-primary">
          Tracking URL (HTTPS)
          <input
            value={form.trackingUrl}
            maxLength={2048}
            onChange={(e) => update("trackingUrl", e.target.value)}
            placeholder="https://..."
            className="input input-bordered w-full bg-white text-sm"
          />
        </label>
        <div>
          <label className="text-xs font-semibold text-primary">
            Parcel Weight
          </label>
          <div className="mt-1.5 flex gap-2">
            <input
              type="number"
              min={form.weight.unit === "kg" ? 0.1 : 100}
              max={form.weight.unit === "kg" ? 100 : 100000}
              step={form.weight.unit === "kg" ? 0.01 : 1}
              value={form.weight.value}
              onChange={(e) =>
                update("weight", { ...form.weight, value: e.target.value })
              }
              className="input input-bordered w-full min-w-0 bg-white text-sm"
              placeholder="Weight"
            />
            <select
              value={form.weight.unit}
              onChange={(e) => {
                const unit = e.target.value;
                const old = Number(form.weight.value);
                const converted =
                  form.weight.value === ""
                    ? ""
                    : unit === "g"
                      ? old * (form.weight.unit === "kg" ? 1000 : 1)
                      : old / (form.weight.unit === "g" ? 1000 : 1);
                update("weight", {
                  unit,
                  value: form.weight.value === "" ? "" : String(converted),
                });
              }}
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
            value={form.etaDate}
            min={minDate}
            max={maxDate}
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
      </div>
      <p className="mt-2 text-[11px] text-muted">
        নতুন ETA আগামীকাল থেকে ৬ মাস। পুরোনো ETA অপরিবর্তিত রেখে অন্য field edit
        করা যাবে। Date পার হলে status auto-delivered হবে না।
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
          onClick={onCancel}
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

export default function AdminDeliveryManagementPage() {
  const auth = useContext(AuthContext) || {};
  const { user, loading } = auth;
  const role = auth.role ?? auth.roleState?.role;
  const accountStatus = auth.accountStatus ?? auth.roleState?.status;
  const checking =
    loading || Boolean(user && (auth.roleLoading || auth.roleState?.checking));
  const allowed =
    !checking &&
    Boolean(user) &&
    role === "admin" &&
    accountStatus === "active";
  const [view, setView] = useState("all");
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState(null);
  const client = useQueryClient();
  const params = new URLSearchParams({
    page: String(page),
    view,
    sort,
    search: submittedSearch,
  });
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
    queryFn: ({ signal }) =>
      adminApi(user, `/admin/deliveries?${params.toString()}`, { signal }),
    staleTime: 15000,
    refetchOnWindowFocus: true,
  });
  const action = useMutation({
    mutationFn: ({ id, endpoint, body }) =>
      adminApi(user, `/admin/orders/${encodeURIComponent(id)}/${endpoint}`, {
        method: "PATCH",
        body,
      }),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ["admin-deliveries"] }),
        client.invalidateQueries({ queryKey: ["admin-orders"] }),
        client.invalidateQueries({ queryKey: ["admin-dashboard"] }),
        client.invalidateQueries({ queryKey: ["admin-order-detail"] }),
      ]);
    },
  });
  const updateTracking = async (id, body) => {
    await action.mutateAsync({ id, endpoint: "tracking", body });
    Swal.fire({
      icon: "success",
      title: "Courier তথ্য সেভ হয়েছে",
      timer: 1300,
      showConfirmButton: false,
      toast: true,
      position: "top-end",
    });
  };
  const updateStatus = async (order, next) => {
    if (action.isPending) return;
    if (
      next === "shipped" &&
      (!order.courier?.name ||
        !order.courier?.trackingNumber ||
        !order.estimatedDelivery)
    ) {
      Swal.fire({
        icon: "warning",
        title: "Courier তথ্য অসম্পূর্ণ",
        text: "Shipped করার আগে Courier Name, Tracking ID ও Expected Delivery যোগ কর।",
        confirmButtonColor: "#76258A",
      });
      setEditingId(order._id);
      return;
    }
    const answer = await Swal.fire({
      title:
        next === "delivered"
          ? "ডেলিভারি নিশ্চিত হয়েছে?"
          : next === "shipped"
            ? "কুরিয়ারে পাঠানো হয়েছে?"
            : "প্রসেসিং শুরু করবেন?",
      text:
        next === "delivered"
          ? "Courier/Customer থেকে ডেলিভারি নিশ্চিত হওয়ার পরই Delivered কর। COD টাকা আদায় হয়েছে কি না আলাদাভাবে যাচাই করতে হবে।"
          : "Status manually পরিবর্তন হবে।",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Confirm",
      cancelButtonText: "Back",
      confirmButtonColor: "#76258A",
    });
    if (!answer.isConfirmed) return;
    try {
      await action.mutateAsync({
        id: order._id,
        endpoint: "status",
        body: { status: next },
      });
      setEditingId(null);
      Swal.fire({
        icon: "success",
        title: "Status Updated",
        timer: 1400,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Update failed",
        text: err.message,
        confirmButtonColor: "#76258A",
      });
    }
  };
  const changeView = (value) => {
    setView(value);
    setPage(1);
    setEditingId(null);
  };
  const deliveries = Array.isArray(query.data?.deliveries)
    ? query.data.deliveries
    : [];
  const stats = query.data?.stats || {};
  const paging = query.data?.pagination || {};
  const pages = Math.max(1, Number(paging.totalPages) || 1);
  const nextStatus = (status) =>
    ({ verified: "processing", processing: "shipped", shipped: "delivered" })[
      status
    ];
  const nextLabel = {
    processing: "Start Processing",
    shipped: "Mark Shipped",
    delivered: "Mark Delivered",
  };
  const overdue = (order) =>
    order.status === "shipped" &&
    order.estimatedDelivery &&
    new Date(order.estimatedDelivery).getTime() < Date.now();
  const Stat = ({ label, detail, value, icon: Icon, iconClass, filter }) => (
    <button
      type="button"
      onClick={() => changeView(filter)}
      className={`rounded-xl border bg-white p-4 text-left shadow-sm transition hover:border-secondary/40 ${view === filter ? "border-secondary" : "border-base-300/70"}`}
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
  if (checking)
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-2 text-secondary">
        <Loader2 className="animate-spin" /> Admin যাচাই হচ্ছে...
      </div>
    );
  if (!allowed)
    return (
      <div className="rounded-xl bg-white p-12 text-center">
        <ShieldCheck className="mx-auto text-secondary" size={32} />
        <h2 className="mt-3 font-bold text-primary">Access Denied</h2>
        <p className="mt-2 text-xs text-muted">Active Admin Account প্রয়োজন।</p>
      </div>
    );

  return (
    <div className="mx-auto max-w-[1600px] space-y-5 pb-10">
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
          disabled={query.isFetching}
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
        <Stat
          label="প্রস্তুতির অপেক্ষায়"
          detail="Verified orders"
          value={stats.verified}
          icon={PackageSearch}
          iconClass="bg-blue-100 text-blue-700"
          filter="verified"
        />
        <Stat
          label="প্যাকিং / প্রসেসিং"
          detail="Awaiting dispatch"
          value={stats.processing}
          icon={ShoppingBag}
          iconClass="bg-purple-100 text-purple-700"
          filter="processing"
        />
        <Stat
          label="কুরিয়ারে / পথে"
          detail="In transit"
          value={stats.shipped}
          icon={Truck}
          iconClass="bg-indigo-100 text-indigo-700"
          filter="shipped"
        />
        <Stat
          label="সফল ডেলিভারি"
          detail="Manually confirmed"
          value={stats.delivered}
          icon={PackageCheck}
          iconClass="bg-green-100 text-green-700"
          filter="delivered"
        />
        <Stat
          label="সময় অতিক্রান্ত"
          detail="Shipped + ETA passed"
          value={stats.overdue}
          icon={AlertTriangle}
          iconClass="bg-amber-100 text-amber-800"
          filter="overdue"
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
            {bn(paging.total)} Results
          </span>
        </div>
        <div className="flex gap-2 overflow-x-auto border-b border-base-300 px-4 py-3 sm:px-5">
          {VIEWS.map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => changeView(value)}
              className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold ${view === value ? "bg-primary text-white" : "bg-base-200 text-muted hover:text-secondary"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSubmittedSearch(search.trim());
            setPage(1);
            setEditingId(null);
          }}
          className="grid gap-3 border-b border-base-300 p-4 sm:grid-cols-[minmax(0,1fr)_180px_auto] sm:p-5"
        >
          <label className="flex h-11 items-center gap-2 rounded-xl border border-base-300 bg-base-200 px-3">
            <Search size={16} className="text-muted" />
            <input
              value={search}
              maxLength={80}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Order, Customer, Phone, Courier, Tracking..."
              className="w-full min-w-0 bg-transparent text-xs text-primary outline-none"
            />
          </label>
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
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
              className="flex-1 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white"
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setSubmittedSearch("");
                setSort("newest");
                changeView("all");
              }}
              className="rounded-xl border border-base-300 px-3 py-2 text-xs font-semibold text-secondary"
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
            {query.error?.message}{" "}
            <button
              type="button"
              onClick={() => query.refetch()}
              className="ml-2 font-bold underline"
            >
              Retry
            </button>
          </div>
        )}
        {action.isError && (
          <div
            role="alert"
            className="m-4 rounded-xl bg-red-50 p-4 text-xs text-red-700"
          >
            {action.error?.message}
          </div>
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
                    {deliveries.map((order, index) => (
                      <Fragment key={order._id}>
                        <tr
                          className={`${index % 2 ? "bg-[#faf7fb]" : "bg-white"} hover:bg-secondary/5`}
                        >
                          <td className="px-5 py-3">
                            <p className="max-w-[195px] truncate text-xs font-bold text-primary">
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
                                <p className="max-w-[135px] truncate text-xs font-semibold text-primary">
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
                              {order.courier?.name || "Not assigned"}
                            </p>
                            <p className="mt-1 max-w-[155px] truncate text-[11px] text-muted">
                              {order.courier?.trackingNumber ||
                                "Tracking pending"}
                            </p>
                            {order.courier?.trackingUrl && (
                              <a
                                href={order.courier.trackingUrl}
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
                              className={`whitespace-nowrap text-xs font-semibold ${overdue(order) ? "text-red-700" : "text-primary"}`}
                            >
                              {dateText(order.estimatedDelivery)}
                            </p>
                            {overdue(order) && (
                              <p className="mt-1 text-[11px] text-red-700">
                                Overdue
                              </p>
                            )}
                          </td>
                          <td className="px-5 py-3">
                            <StatusBadge status={order.status} />
                            {order.payment?.method === "cod" && (
                              <p className="mt-1 text-[11px] text-amber-700">
                                COD
                              </p>
                            )}
                          </td>
                          <td className="px-5 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Link
                                to={`/admin/orders/${encodeURIComponent(order._id)}`}
                                className="inline-flex items-center gap-1 rounded-lg bg-secondary/10 px-2.5 py-2 text-[11px] font-bold text-secondary"
                              >
                                <Eye size={14} />
                                Details
                              </Link>
                              {order.status !== "delivered" && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingId(
                                      editingId === order._id
                                        ? null
                                        : order._id,
                                    );
                                    action.reset();
                                  }}
                                  className="inline-flex items-center gap-1 rounded-lg border border-base-300 px-2.5 py-2 text-[11px] font-bold text-primary"
                                >
                                  <Pencil size={13} />
                                  Edit
                                </button>
                              )}
                            </div>
                            {nextStatus(order.status) && (
                              <button
                                type="button"
                                disabled={action.isPending}
                                onClick={() =>
                                  updateStatus(order, nextStatus(order.status))
                                }
                                className="mt-2 rounded-lg bg-primary px-3 py-2 text-[11px] font-bold text-white disabled:opacity-40"
                              >
                                {nextLabel[nextStatus(order.status)]}
                              </button>
                            )}
                          </td>
                        </tr>
                        {editingId === order._id && (
                          <tr>
                            <td colSpan={8} className="p-3 sm:p-4">
                              <TrackingEditor
                                key={order._id}
                                order={order}
                                saving={action.isPending}
                                onSave={updateTracking}
                                onCancel={() => setEditingId(null)}
                              />
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="space-y-3 p-3 lg:hidden">
                {deliveries.map((order) => (
                  <article
                    key={order._id}
                    className="overflow-hidden rounded-xl border border-base-300 bg-white"
                  >
                    <div className="flex items-center justify-between gap-2 bg-base-200/70 p-3">
                      <div>
                        <p className="text-xs font-bold text-primary">
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
                        <div className="flex items-center gap-2">
                          <Avatar
                            name={order.customer?.name}
                            photoUrl={order.customerPhotoUrl}
                          />
                          <div>
                            <p className="text-xs font-bold text-primary">
                              {order.customer?.name || "—"}
                            </p>
                            <p className="text-[11px] text-muted">
                              {order.customer?.phone || "—"}
                            </p>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-primary">
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
                            {order.courier?.name || "Not assigned"}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted">Tracking ID</p>
                          <p className="mt-1 break-all font-semibold text-primary">
                            {order.courier?.trackingNumber || "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted">Expected Delivery</p>
                          <p
                            className={`mt-1 font-semibold ${overdue(order) ? "text-red-700" : "text-primary"}`}
                          >
                            {dateText(order.estimatedDelivery)}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Link
                          to={`/admin/orders/${encodeURIComponent(order._id)}`}
                          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-secondary/10 px-3 py-2.5 text-xs font-bold text-secondary"
                        >
                          <Eye size={15} />
                          Details
                        </Link>
                        {order.status !== "delivered" && (
                          <button
                            type="button"
                            onClick={() =>
                              setEditingId(
                                editingId === order._id ? null : order._id,
                              )
                            }
                            className="inline-flex items-center gap-1.5 rounded-lg border border-base-300 px-3 py-2.5 text-xs font-bold text-primary"
                          >
                            <Pencil size={15} />
                            Edit
                          </button>
                        )}
                        {nextStatus(order.status) && (
                          <button
                            type="button"
                            disabled={action.isPending}
                            onClick={() =>
                              updateStatus(order, nextStatus(order.status))
                            }
                            className="rounded-lg bg-primary px-3 py-2.5 text-xs font-bold text-white disabled:opacity-40"
                          >
                            {nextLabel[nextStatus(order.status)]}
                          </button>
                        )}
                      </div>
                      {editingId === order._id && (
                        <TrackingEditor
                          key={order._id}
                          order={order}
                          saving={action.isPending}
                          onSave={updateTracking}
                          onCancel={() => setEditingId(null)}
                        />
                      )}
                    </div>
                  </article>
                ))}
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
              {Number(paging.total) > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-base-300 p-4 sm:px-5">
                  <p className="text-xs text-muted">
                    Showing {bn((page - 1) * 10 + 1)}–
                    {bn(Math.min(page * 10, paging.total))} of{" "}
                    {bn(paging.total)}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => {
                        setPage((p) => p - 1);
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
                      disabled={page >= pages}
                      onClick={() => {
                        setPage((p) => p + 1);
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
      <p className="text-[11px] text-muted">
        Expected Delivery শুধু আনুমানিক সময়। Courier-এর প্রকৃত ডেলিভারি নিশ্চিত
        হওয়ার পরেই Admin status Delivered করবেন; COD payment status আলাদা থাকবে।
      </p>
    </div>
  );
}
