
import { useContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import Swal from "sweetalert2";

import {
  ArrowLeft,
  AlertTriangle,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Clock3,
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
  Save,
  ShieldCheck,
  ShoppingBag,
  Truck,
  UserRound,
  Wallet,
  X,
  Loader2,
} from "lucide-react";

import { AuthContext } from "../../providers/AuthProvider";
import { API_URL } from "../../utils/siteConfig";


const COURIER_KEY =
  "sokhbilash-admin-courier-names";

const ORDER_STATUSES = {
  pending: "পেন্ডিং",
  verified: "যাচাইকৃত",
  processing: "প্রসেসিং",
  shipped: "শিপড",
  delivered: "ডেলিভার্ড",
  rejected: "রিজেক্টেড",
  cancelled: "বাতিল",
};

const PAYMENT_STATUSES = {
  pending: "যাচাই বাকি",
  partially_paid: "আংশিক পরিশোধিত",
  verified: "সম্পূর্ণ ভেরিফাইড",
  rejected: "রিজেক্টেড",
  cod_pending: "COD বাকি",
  cod_collected: "COD সংগৃহীত",
};

const PAYMENT_METHODS = {
  bkash: "bKash",
  nagad: "Nagad",
  rocket: "Rocket",
  cod: "Cash on Delivery",
};

const NEXT_STATUSES = {
  pending: "verified",
  verified: "processing",
  processing: "shipped",
  shipped: "delivered",
};

const ORDER_COLORS = {
  pending: "bg-amber-100 text-amber-800",
  verified: "bg-blue-100 text-blue-800",
  processing: "bg-purple-100 text-purple-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  cancelled: "bg-red-100 text-red-800",
};

const PAYMENT_COLORS = {
  pending: "bg-amber-100 text-amber-800",
  partially_paid: "bg-blue-100 text-blue-800",
  verified: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  cod_pending: "bg-purple-100 text-purple-800",
  cod_collected: "bg-green-100 text-green-800",
};

// ==================================================
// HELPERS
// ==================================================

const money = (value) =>
  `৳${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

const cents = (value) =>
  Math.round((Number(value) || 0) * 100);

const fromCents = (value) =>
  Number((value / 100).toFixed(2));

function formatDate(value) {
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
}

function dhakaParts(value = new Date()) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const get = (type) =>
    parts.find((part) => part.type === type)?.value;

  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    time: `${get("hour")}:${get("minute")}`,
  };
}

function addDays(dateString, days) {
  const [year, month, day] = dateString
    .split("-")
    .map(Number);

  const date = new Date(
    Date.UTC(year, month - 1, day + days)
  );

  return date.toISOString().slice(0, 10);
}

function addMonths(dateString, months) {
  const [year, month, day] = dateString
    .split("-")
    .map(Number);

  const first = new Date(
    Date.UTC(year, month - 1 + months, 1)
  );

  const lastDay = new Date(
    Date.UTC(
      first.getUTCFullYear(),
      first.getUTCMonth() + 1,
      0
    )
  ).getUTCDate();

  const result = new Date(
    Date.UTC(
      first.getUTCFullYear(),
      first.getUTCMonth(),
      Math.min(day, lastDay)
    )
  );

  return result.toISOString().slice(0, 10);
}

function getDeliveryRange() {
  const today = dhakaParts()?.date;

  return {
    min: addDays(today, 1),
    max: addMonths(today, 6),
  };
}

function normalizePhone(value) {
  const phone = String(value || "").replace(
    /\D/g,
    ""
  );

  if (/^01[3-9]\d{8}$/.test(phone)) {
    return `88${phone}`;
  }

  if (/^8801[3-9]\d{8}$/.test(phone)) {
    return phone;
  }

  return "";
}

function whatsappLink(order) {
  const phone = normalizePhone(
    order.shipping?.phone ||
      order.customer?.phone
  );

  if (!phone) return "";

  const message =
    "SokhBilash থেকে যোগাযোগ করছি।\n" +
    `আপনার অর্ডার ${order.orderNumber} ` +
    "সম্পর্কে কিছু তথ্য নিশ্চিত করতে চাই।";

  return (
    `https://wa.me/${phone}?text=` +
    encodeURIComponent(message)
  );
}

function remainingDue(order) {
  return Math.max(
    0,
    fromCents(
      cents(order.total) -
      cents(order.payment?.verifiedAmount)
    )
  );
}

function isCustomized(item) {
  const custom = item.customization || {};

  return (
    (custom.mode &&
      custom.mode !== "none") ||
    Boolean(custom.name) ||
    Boolean(custom.date) ||
    Boolean(custom.message) ||
    Boolean(custom.note) ||
    (custom.photos?.length || 0) > 0
  );
}

// ==================================================
// COURIER LOCAL STORAGE
// ==================================================

function readCourierNames() {
  try {
    const data = JSON.parse(
      localStorage.getItem(COURIER_KEY) || "[]"
    );

    return Array.isArray(data)
      ? data.filter(
          (item) =>
            typeof item === "string" &&
            item.trim()
        )
      : [];
  } catch {
    return [];
  }
}

function rememberCourierName(name) {
  const clean = String(name || "").trim();

  if (!clean) return readCourierNames();

  const current = readCourierNames();

  const updated = [
    clean,
    ...current.filter(
      (value) =>
        value.toLowerCase() !== clean.toLowerCase()
    ),
  ].slice(0, 20);

  try {
    localStorage.setItem(
      COURIER_KEY,
      JSON.stringify(updated)
    );
  } catch {
    // Local storage may be unavailable.
  }

  return updated;
}

function readWeight(value) {
  const match = String(value || "").match(
    /^\s*(\d+(?:\.\d+)?)\s*(kg|g)\s*$/i
  );

  if (!match) {
    return {
      value: "",
      unit: "kg",
    };
  }

  return {
    value: match[1],
    unit: match[2].toLowerCase(),
  };
}

// ==================================================
// ADMIN API
// ==================================================

async function adminRequest(
  user,
  path,
  { method = "GET", body, signal } = {}
) {
  if (!user) {
    throw new Error("Admin login required");
  }

  const token = await user.getIdToken();

  const response = await fetch(
    `${API_URL}${path}`,
    {
      method,
      signal,
      cache: "no-store",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        ...(body !== undefined
          ? {
              "Content-Type":
                "application/json",
            }
          : {}),
      },
      body:
        body === undefined
          ? undefined
          : JSON.stringify(body),
    }
  );

  const data = await response
    .json()
    .catch(() => ({}));

  if (!response.ok || data.success !== true) {
    throw new Error(
      data.message ||
        `Request failed (${response.status})`
    );
  }

  return data;
}

// ==================================================
// COMMON UI
// ==================================================

function Section({
  title,
  subtitle,
  icon: Icon,
  right,
  children,
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-base-300/70 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-base-300/70 px-4 py-4 sm:px-5">
        <div className="flex items-center gap-2.5">
          <Icon
            size={18}
            className="shrink-0 text-secondary"
          />

          <div>
            <h2 className="text-sm font-bold text-primary sm:text-base">
              {title}
            </h2>

            {subtitle && (
              <p className="mt-0.5 text-[11px] text-muted">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {right}
      </div>

      <div className="p-4 sm:p-5">
        {children}
      </div>
    </section>
  );
}

function InfoRow({ label, value, strong = false }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-base-200 py-2.5 last:border-0">
      <span className="shrink-0 text-xs text-muted">
        {label}
      </span>

      <div
        className={`max-w-[65%] break-words text-right ${
          strong
            ? "text-sm font-bold text-primary"
            : "text-xs font-semibold text-primary"
        }`}
      >
        {value ?? "—"}
      </div>
    </div>
  );
}

function StatusBadge({
  status,
  payment = false,
}) {
  const label = payment
    ? PAYMENT_STATUSES[status]
    : ORDER_STATUSES[status];

  const styles = payment
    ? PAYMENT_COLORS
    : ORDER_COLORS;

  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-bold ${
        styles[status] ||
        "bg-base-200 text-muted"
      }`}
      style={{
        borderColor:
          "color-mix(in srgb, currentColor 10%, transparent)",
      }}
    >
      {label || status || "—"}
    </span>
  );
}

function ProductImage({ src, alt }) {
  const [failedUrl, setFailedUrl] =
    useState("");

  const showImage =
    Boolean(src) && src !== failedUrl;

  return (
    <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-base-300 bg-base-200 sm:size-20">
      {showImage ? (
        <img
          src={src}
          alt={alt || "Product"}
          loading="lazy"
          onError={() => setFailedUrl(src)}
          className="h-full w-full object-cover"
        />
      ) : (
        <ImageOff
          size={20}
          className="text-muted"
        />
      )}
    </div>
  );
}

function CustomerAvatar({ name, photoUrl }) {
  const [failedUrl, setFailedUrl] =
    useState("");

  return (
    <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-secondary/15 bg-secondary/10 text-secondary">
      {photoUrl && failedUrl !== photoUrl ? (
        <img
          src={photoUrl}
          alt={name || "Customer"}
          onError={() => setFailedUrl(photoUrl)}
          className="h-full w-full object-cover"
        />
      ) : (
        <UserRound size={22} />
      )}
    </div>
  );
}

// ==================================================
// COMPACT PRODUCT CARD
// ==================================================

function OrderItemCard({ item }) {
  const customization = item.customization || {};

  const hasCustomization = isCustomized(item);

  const quantity = Number(item.quantity) || 1;

  const unitPrice = Number(
    item.unitPrice ?? item.price ?? 0
  );

  const lineTotal = Number(
    item.lineTotal ?? unitPrice * quantity
  );

  const options = Object.entries(
    item.selectedOptions || {}
  ).filter(([, value]) => Boolean(value));

  const photoList = Array.isArray(
    customization.photos
  )
    ? customization.photos
    : [];

  const customFields = [
    ["নাম", customization.name],
    ["তারিখ", customization.date],
    ["মেসেজ", customization.message],
    ["বিশেষ নির্দেশনা", customization.note],
  ].filter(([, value]) => Boolean(value));

  return (
    <article className="overflow-hidden rounded-xl border-2 border-dashed border-secondary/25 bg-white p-3 sm:p-4">
      <div className="flex min-w-0 items-start gap-3">
        <ProductImage
          src={item.image}
          alt={item.name}
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="line-clamp-2 text-sm font-bold leading-5 text-primary">
                {item.name || "Product"}
              </h3>

              <p className="mt-1 truncate text-[11px] text-muted">
                {item.variantTitle || "Regular"}
              </p>

              {item.sku && (
                <p className="mt-1 truncate text-[11px] text-muted">
                  SKU: {item.sku}
                </p>
              )}
            </div>

            <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-secondary/10 px-2.5 py-1.5 text-sm font-bold text-secondary">
              <Package size={14} />
              × {quantity}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-[11px] text-muted">
                প্রতি পিস {money(unitPrice)}
              </p>

              <p className="mt-1 text-sm font-bold text-primary">
                মোট {money(lineTotal)}
              </p>
            </div>

            <span className="rounded-lg bg-base-200 px-2.5 py-1.5 text-[11px] font-semibold text-primary">
              {quantity} পিস
            </span>
          </div>
        </div>
      </div>

      {(options.length > 0 ||
        item.packaging === "premium" ||
        item.surpriseBox) && (
        <div className="mt-3 flex flex-wrap gap-1.5 border-t border-base-300/70 pt-3">
          {options.map(([key, value]) => (
            <span
              key={key}
              className="rounded-md bg-base-200 px-2 py-1 text-[11px] text-primary"
            >
              {key}: {value}
            </span>
          ))}

          {item.packaging === "premium" && (
            <span className="rounded-md bg-secondary/10 px-2 py-1 text-[11px] text-secondary">
              Premium Box
            </span>
          )}

          {item.surpriseBox && (
            <span className="rounded-md bg-amber-100 px-2 py-1 text-[11px] text-amber-800">
              Surprise Box
            </span>
          )}
        </div>
      )}

      {/* CUSTOMIZATION COLLAPSED BY DEFAULT */}

      {hasCustomization && (
        <details className="group mt-3 rounded-xl border border-secondary/15 bg-secondary/5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2.5 [&::-webkit-details-marker]:hidden">
            <span className="flex items-center gap-2 text-xs font-bold text-secondary">
              <Paintbrush size={15} />
              কাস্টমাইজেশন ডিটেইলস
            </span>

            <ChevronDown
              size={16}
              className="text-secondary transition-transform group-open:rotate-180"
            />
          </summary>

          <div className="space-y-2 border-t border-secondary/15 p-3">
            {customFields.map(([label, value]) => (
              <div
                key={label}
                className="rounded-lg bg-white p-2.5"
              >
                <p className="text-[11px] font-semibold text-secondary">
                  {label}
                </p>

                <p className="mt-1 whitespace-pre-wrap break-words text-xs leading-5 text-primary">
                  {value}
                </p>
              </div>
            ))}

            {photoList.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold text-primary">
                  Customer Photos ({photoList.length})
                </p>

                <div className="flex flex-wrap gap-2">
                  {photoList.map((photo, index) => {
                    const url =
                      typeof photo === "string"
                        ? photo
                        : photo?.url;

                    if (!url) return null;

                    return (
                      <a
                        key={photo?.id || index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <img
                          src={url}
                          alt={`Reference ${index + 1}`}
                          loading="lazy"
                          className="size-16 rounded-lg border border-base-300 object-cover"
                        />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {customFields.length === 0 &&
              photoList.length === 0 && (
                <p className="text-xs text-muted">
                  অতিরিক্ত তথ্য দেওয়া হয়নি।
                </p>
              )}
          </div>
        </details>
      )}
    </article>
  );
}

// ==================================================
// COURIER SECTION
// ==================================================

function CourierSection({
  order,
  saving,
  onSave,
}) {
  const courier = order.courier || {};

  const existingETA = dhakaParts(
    order.estimatedDelivery
  );

  const [editing, setEditing] =
    useState(false);

  const [savedNames, setSavedNames] =
    useState(readCourierNames);

  const [error, setError] =
    useState("");

  const [form, setForm] = useState(() => ({
    name: courier.name || "",
    trackingNumber:
      courier.trackingNumber || "",
    trackingUrl:
      courier.trackingUrl || "",
    weight: readWeight(courier.parcelWeight),
    etaDate: existingETA?.date || "",
    etaTime: existingETA?.time || "18:00",
  }));

  const editable = ![
    "cancelled",
    "rejected",
    "delivered",
  ].includes(order.status);

  const deliveryRange = getDeliveryRange();

  const resetForm = () => {
    const latestETA = dhakaParts(
      order.estimatedDelivery
    );

    setForm({
      name: courier.name || "",
      trackingNumber:
        courier.trackingNumber || "",
      trackingUrl:
        courier.trackingUrl || "",
      weight: readWeight(
        courier.parcelWeight
      ),
      etaDate: latestETA?.date || "",
      etaTime: latestETA?.time || "18:00",
    });

    setError("");
  };

  // Keep server values synchronized when
  // switching orders or after refetch.
  useEffect(() => {
    if (editing) return;

    const eta = dhakaParts(
      order.estimatedDelivery
    );

    setForm({
      name: courier.name || "",
      trackingNumber:
        courier.trackingNumber || "",
      trackingUrl:
        courier.trackingUrl || "",
      weight: readWeight(
        courier.parcelWeight
      ),
      etaDate: eta?.date || "",
      etaTime: eta?.time || "18:00",
    });
  }, [
    editing,
    courier.name,
    courier.trackingNumber,
    courier.trackingUrl,
    courier.parcelWeight,
    order.estimatedDelivery,
  ]);

  const updateField = (key, value) => {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const startEditing = () => {
    resetForm();

    const names = readCourierNames();
    setSavedNames(names);

    // Autofill last used courier only if
    // the order has no assigned courier.
    if (!courier.name && names.length > 0) {
      setForm((previous) => ({
        ...previous,
        name: names[0],
      }));
    }

    setEditing(true);
  };

  const changeWeightUnit = (unit) => {
    setForm((previous) => {
      const old = previous.weight;

      const amount = Number(old.value);

      if (!old.value || !Number.isFinite(amount)) {
        return {
          ...previous,
          weight: { value: "", unit },
        };
      }

      const converted =
        unit === "g"
          ? old.unit === "kg"
            ? amount * 1000
            : amount
          : old.unit === "g"
            ? amount / 1000
            : amount;

      return {
        ...previous,
        weight: {
          value: String(
            Number(converted.toFixed(2))
          ),
          unit,
        },
      };
    });
  };

  const saveCourier = async (event) => {
    event.preventDefault();

    if (saving) return;

    setError("");

    const name = form.name.trim();
    const trackingNumber =
      form.trackingNumber.trim();

    const trackingUrl =
      form.trackingUrl.trim();

    let parcelWeight = "";

    // ======================================
    // WEIGHT: 0.1 kg - 100 kg
    // ======================================

    if (form.weight.value !== "") {
      const value = Number(
        form.weight.value
      );

      const kg =
        form.weight.unit === "g"
          ? value / 1000
          : value;

      if (
        !Number.isFinite(value) ||
        value <= 0 ||
        kg < 0.1 ||
        kg > 100
      ) {
        setError(
          "Parcel Weight 0.1 kg থেকে 100 kg-এর মধ্যে হতে হবে।"
        );
        return;
      }

      if (form.weight.unit === "kg") {
        if (
          !/^\d+(?:\.\d{1,2})?$/.test(
            form.weight.value
          )
        ) {
          setError(
            "KG-তে সর্বোচ্চ ২ ঘর decimal দিন।"
          );
          return;
        }

        parcelWeight = `${value} kg`;
      } else {
        if (!Number.isInteger(value)) {
          setError(
            "Gram-এর পরিমাণ পূর্ণসংখ্যা হতে হবে।"
          );
          return;
        }

        // Existing backend accepts at most
        // four digits for the numeric weight.
        parcelWeight =
          value <= 9999
            ? `${value} g`
            : `${Number(kg.toFixed(2))} kg`;
      }
    }

    if (
      !name &&
      (trackingNumber ||
        trackingUrl ||
        parcelWeight)
    ) {
      setError(
        "Tracking বা Weight দিলে Courier Name দিতে হবে।"
      );
      return;
    }

    if (trackingUrl && !trackingNumber) {
      setError(
        "Tracking URL দিলে Tracking ID প্রয়োজন।"
      );
      return;
    }

    if (trackingUrl) {
      try {
        const url = new URL(trackingUrl);

        if (
          url.protocol !== "https:" ||
          url.username ||
          url.password
        ) {
          throw new Error("Invalid URL");
        }
      } catch {
        setError(
          "একটি valid HTTPS Tracking URL দিন।"
        );
        return;
      }
    }

    // ======================================
    // DELIVERY DATE: TOMORROW - 6 MONTHS
    // ======================================

    const oldDateTime = existingETA
      ? `${existingETA.date}T${existingETA.time}`
      : "";

    const newDateTime = form.etaDate
      ? `${form.etaDate}T${form.etaTime}`
      : "";

    const dateChanged =
      oldDateTime !== newDateTime;

    const payload = {
      name,
      trackingNumber,
      trackingUrl,
      parcelWeight,
    };

    if (dateChanged) {
      if (!form.etaDate) {
        payload.estimatedDelivery = null;
      } else {
        if (
          form.etaDate < deliveryRange.min ||
          form.etaDate > deliveryRange.max
        ) {
          setError(
            "Expected Delivery আগামীকাল থেকে ৬ মাসের মধ্যে নির্বাচন করুন।"
          );
          return;
        }

        if (
          !/^([01]\d|2[0-3]):[0-5]\d$/.test(
            form.etaTime
          )
        ) {
          setError(
            "Valid delivery time নির্বাচন করুন।"
          );
          return;
        }

        const iso = new Date(
          `${form.etaDate}T${form.etaTime}:00+06:00`
        );

        if (
          Number.isNaN(iso.getTime())
        ) {
          setError(
            "Invalid delivery date/time।"
          );
          return;
        }

        payload.estimatedDelivery =
          iso.toISOString();
      }
    }

    try {
      await onSave(payload);

      if (name) {
        setSavedNames(
          rememberCourierName(name)
        );
      }

      setEditing(false);
    } catch (err) {
      setError(
        err.message ||
        "Logistics save করা যায়নি।"
      );
    }
  };

  return (
    <Section
      title="লজিস্টিকস ও কুরিয়ার"
      subtitle="Courier, Parcel & Expected Delivery"
      icon={Truck}
      right={
        editable && !editing ? (
          <button
            type="button"
            onClick={startEditing}
            className="inline-flex items-center gap-2 rounded-lg bg-secondary/10 px-3 py-2 text-xs font-bold text-secondary transition hover:bg-secondary/20"
          >
            <Pencil size={14} />
            Edit
          </button>
        ) : null
      }
    >
      {!editing ? (
        <div>
          <InfoRow
            label="Courier Name"
            value={
              courier.name ||
              "Not Assigned"
            }
          />

          <InfoRow
            label="Tracking ID"
            value={
              courier.trackingNumber ||
              "Pending"
            }
          />

          <InfoRow
            label="Parcel Weight"
            value={
              courier.parcelWeight || "—"
            }
          />

          <InfoRow
            label="Expected Delivery"
            value={formatDate(
              order.estimatedDelivery
            )}
          />

          <InfoRow
            label="Tracking URL"
            value={
              courier.trackingUrl ? (
                <a
                  href={courier.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-secondary"
                >
                  Open Tracking
                  <ExternalLink size={13} />
                </a>
              ) : (
                "Not Available"
              )
            }
          />

          {courier.name && (
            <div className="mt-3 rounded-xl border border-secondary/15 bg-secondary/5 p-3">
              <p className="flex items-center gap-2 text-xs font-semibold text-secondary">
                <CheckCircle2 size={15} />
                Courier information saved
              </p>

              <p className="mt-1 text-[11px] text-muted">
                অর্ডারের তথ্য MongoDB-তে সংরক্ষিত।
              </p>
            </div>
          )}
        </div>
      ) : (
        <form
          noValidate
          onSubmit={saveCourier}
          className="space-y-4"
        >
          {/* COURIER NAME */}

          <div>
            <label className="text-xs font-bold text-primary">
              Courier Name
            </label>

            <input
              type="text"
              list="courier-saved-names"
              maxLength={150}
              value={form.name}
              disabled={saving}
              onChange={(event) =>
                updateField(
                  "name",
                  event.target.value
                )
              }
              placeholder="Steadfast / Pathao / RedX"
              className="mt-2 h-11 w-full rounded-xl border border-base-300 bg-base-200 px-3 text-sm text-primary outline-none focus:border-secondary"
            />

            <datalist id="courier-saved-names">
              {savedNames.map((name) => (
                <option
                  key={name}
                  value={name}
                />
              ))}
            </datalist>

            {savedNames.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {savedNames.slice(0, 6).map(
                  (name) => (
                    <button
                      type="button"
                      key={name}
                      disabled={saving}
                      onClick={() =>
                        updateField("name", name)
                      }
                      className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold ${
                        form.name === name
                          ? "border-secondary bg-secondary/10 text-secondary"
                          : "border-base-300 bg-white text-muted"
                      }`}
                    >
                      {name}
                    </button>
                  )
                )}
              </div>
            )}
          </div>

          {/* TRACKING */}

          <div>
            <label className="text-xs font-bold text-primary">
              Tracking ID
            </label>

            <input
              type="text"
              maxLength={150}
              value={form.trackingNumber}
              disabled={saving}
              onChange={(event) =>
                updateField(
                  "trackingNumber",
                  event.target.value
                )
              }
              placeholder="Tracking Number"
              className="mt-2 h-11 w-full rounded-xl border border-base-300 bg-base-200 px-3 text-sm outline-none focus:border-secondary"
            />
          </div>

          {/* WEIGHT + UNIT DROPDOWN */}

          <div>
            <label className="text-xs font-bold text-primary">
              Parcel Weight
            </label>

            <div className="mt-2 flex gap-2">
              <input
                type="number"
                min={
                  form.weight.unit === "kg"
                    ? "0.1"
                    : "100"
                }
                max={
                  form.weight.unit === "kg"
                    ? "100"
                    : "100000"
                }
                step={
                  form.weight.unit === "kg"
                    ? "0.01"
                    : "1"
                }
                value={form.weight.value}
                disabled={saving}
                placeholder={
                  form.weight.unit === "kg"
                    ? "0.1 - 100"
                    : "100 - 100000"
                }
                onChange={(event) =>
                  updateField("weight", {
                    ...form.weight,
                    value: event.target.value,
                  })
                }
                className="h-11 min-w-0 flex-1 rounded-xl border border-base-300 bg-base-200 px-3 text-sm text-primary outline-none focus:border-secondary"
              />

              <select
                value={form.weight.unit}
                disabled={saving}
                onChange={(event) =>
                  changeWeightUnit(
                    event.target.value
                  )
                }
                className="h-11 w-24 rounded-xl border border-base-300 bg-base-200 px-2 text-sm font-semibold text-primary outline-none"
              >
                <option value="kg">kg</option>
                <option value="g">g</option>
              </select>
            </div>

            <p className="mt-1.5 text-[11px] text-muted">
              0.1–100 kg (100–100,000 g)
            </p>
          </div>

          {/* TRACKING URL */}

          <div>
            <label className="text-xs font-bold text-primary">
              Tracking URL
            </label>

            <input
              type="url"
              maxLength={2048}
              value={form.trackingUrl}
              disabled={saving}
              onChange={(event) =>
                updateField(
                  "trackingUrl",
                  event.target.value
                )
              }
              placeholder="https://..."
              className="mt-2 h-11 w-full rounded-xl border border-base-300 bg-base-200 px-3 text-sm text-primary outline-none focus:border-secondary"
            />
          </div>

          {/* EXPECTED DELIVERY */}

          <div className="rounded-xl border border-secondary/15 bg-secondary/5 p-3">
            <label className="flex items-center gap-2 text-xs font-bold text-primary">
              <CalendarDays size={15} />
              Expected Delivery
            </label>

            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div>
                <p className="mb-1.5 text-[11px] text-muted">
                  Delivery Date
                </p>

                <input
                  type="date"
                  value={form.etaDate}
                  min={deliveryRange.min}
                  max={deliveryRange.max}
                  disabled={saving}
                  onChange={(event) =>
                    updateField(
                      "etaDate",
                      event.target.value
                    )
                  }
                  className="h-11 w-full rounded-xl border border-base-300 bg-white px-3 text-sm text-primary outline-none focus:border-secondary"
                />
              </div>

              <div>
                <p className="mb-1.5 text-[11px] text-muted">
                  Estimated Time
                </p>

                <input
                  type="time"
                  value={form.etaTime}
                  disabled={
                    saving || !form.etaDate
                  }
                  onChange={(event) =>
                    updateField(
                      "etaTime",
                      event.target.value
                    )
                  }
                  className="h-11 w-full rounded-xl border border-base-300 bg-white px-3 text-sm text-primary outline-none focus:border-secondary disabled:opacity-50"
                />
              </div>
            </div>

            <p className="mt-2 text-[11px] text-muted">
              আগামীকাল থেকে ৬ মাসের মধ্যে।
              সময় বাংলাদেশ সময় (UTC+06:00)।
            </p>

            {form.etaDate && (
              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  updateField("etaDate", "");
                }}
                className="mt-2 text-[11px] font-semibold text-red-600 hover:underline"
              >
                Clear Expected Delivery
              </button>
            )}
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700"
            >
              {error}
            </p>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => {
                resetForm();
                setEditing(false);
              }}
              className="flex items-center justify-center gap-2 rounded-xl border border-base-300 bg-white px-4 py-3 text-xs font-bold text-primary"
            >
              <X size={15} />
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-bold text-white disabled:opacity-50"
            >
              {saving ? (
                <Loader2
                  size={15}
                  className="animate-spin"
                />
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

// ==================================================
// PAYMENT VERIFICATION MODAL
// Same verification contract as Payment Page
// ==================================================

function PaymentVerificationModal({
  order,
  saving,
  error,
  onClose,
  onDecision,
}) {
  const payment = order.payment || {};

  const previousCents = cents(
    payment.verifiedAmount
  );

  const totalCents = cents(order.total);

  const claimCents = cents(
    payment.claimedAmount
  );

  const remainingCents = Math.max(
    0,
    totalCents - previousCents
  );

  const maximumCents = Math.min(
    remainingCents,
    claimCents
  );

  const pending =
    payment.status === "pending" &&
    order.status === "pending";

  const [amount, setAmount] = useState(
    String(fromCents(maximumCents))
  );

  const [confirmed, setConfirmed] =
    useState(false);

  const [mode, setMode] =
    useState("verify");

  const [reason, setReason] =
    useState("");

  const actualCents = cents(amount);

  const validAmount =
    /^\d+(?:\.\d{1,2})?$/.test(amount) &&
    actualCents > 0 &&
    actualCents <= maximumCents;

  const afterCents = Math.max(
    0,
    remainingCents - actualCents
  );

  const handleVerify = () => {
    if (
      !pending ||
      !confirmed ||
      !validAmount ||
      saving
    ) {
      return;
    }

    // Backend requires cumulative amount.
    onDecision({
      decision: "verify",
      verifiedAmount: fromCents(
        previousCents + actualCents
      ),
    });
  };

  const handleReject = () => {
    if (
      !pending ||
      !reason.trim() ||
      saving
    ) {
      return;
    }

    onDecision({
      decision: "reject",
      reason: reason.trim(),
    });
  };

  return (
    <div
      role="presentation"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !saving
        ) {
          onClose();
        }
      }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-primary/60 p-3 backdrop-blur-sm"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-modal-title"
        className="flex max-h-[94vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-base-300 px-4 py-4 sm:px-5">
          <div className="min-w-0">
            <p className="text-[11px] font-bold tracking-wide text-secondary">
              PAYMENT VERIFICATION
            </p>

            <h2
              id="payment-modal-title"
              className="mt-1 break-all text-base font-bold text-primary"
            >
              {order.orderNumber}
            </h2>

            <div className="mt-2">
              <StatusBadge
                status={payment.status}
                payment
              />
            </div>
          </div>

          <button
            type="button"
            aria-label="Close payment modal"
            disabled={saving}
            onClick={onClose}
            className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-base-200 text-primary disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto p-4 sm:p-5">
          {pending && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
              <AlertTriangle
                size={18}
                className="shrink-0 text-amber-700"
              />

              <p className="text-xs leading-6 text-amber-800">
                Customer-এর TrxID বিশ্বাস
                করেই Verify করবেন না।
                Receiving account-এ আসল টাকা,
                TrxID ও Sender মিলিয়ে নিন।
              </p>
            </div>
          )}

          <div className="rounded-xl border border-base-300 p-4">
            <InfoRow
              label="Customer"
              value={
                order.customer?.name || "—"
              }
            />

            <InfoRow
              label="Payment Method"
              value={
                PAYMENT_METHODS[payment.method] ||
                payment.method
              }
            />

            <InfoRow
              label="Sender Phone"
              value={
                payment.senderPhone || "—"
              }
            />

            <InfoRow
              label="Transaction ID"
              value={
                <span className="break-all font-mono text-secondary">
                  {payment.trxId || "—"}
                </span>
              }
            />

            <InfoRow
              label="Claimed Amount"
              value={money(
                payment.claimedAmount
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-base-200 p-3">
              <p className="text-[11px] text-muted">
                Order Total
              </p>
              <p className="mt-1 text-lg font-bold text-primary">
                {money(order.total)}
              </p>
            </div>

            <div className="rounded-xl bg-green-50 p-3">
              <p className="text-[11px] text-green-700">
                Already Verified
              </p>
              <p className="mt-1 text-lg font-bold text-green-800">
                {money(
                  payment.verifiedAmount
                )}
              </p>
            </div>

            <div className="rounded-xl bg-secondary/10 p-3">
              <p className="text-[11px] text-secondary">
                Customer Claimed
              </p>
              <p className="mt-1 text-lg font-bold text-primary">
                {money(
                  payment.claimedAmount
                )}
              </p>
            </div>

            <div className="rounded-xl bg-amber-50 p-3">
              <p className="text-[11px] text-amber-700">
                Remaining Due
              </p>
              <p className="mt-1 text-lg font-bold text-amber-800">
                {money(
                  fromCents(remainingCents)
                )}
              </p>
            </div>
          </div>

          {/* PENDING PROOF: VERIFICATION */}

          {pending ? (
            <div className="rounded-xl border border-secondary/20 bg-[#faf7fb] p-4">
              <h3 className="flex items-center gap-2 text-sm font-bold text-primary">
                <ShieldCheck
                  size={17}
                  className="text-secondary"
                />
                Admin Decision
              </h3>

              {mode === "verify" ? (
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="text-xs font-bold text-primary">
                      প্রকৃত Received Amount (৳)
                    </label>

                    <input
                      type="number"
                      min="0.01"
                      max={fromCents(
                        maximumCents
                      )}
                      step="0.01"
                      value={amount}
                      disabled={saving}
                      onChange={(event) =>
                        setAmount(
                          event.target.value
                        )
                      }
                      className="mt-2 h-11 w-full rounded-xl border border-base-300 bg-white px-3 text-sm text-primary outline-none focus:border-secondary"
                    />

                    <p className="mt-2 text-[11px] text-muted">
                      এই Proof-এ সর্বোচ্চ{" "}
                      {money(
                        fromCents(maximumCents)
                      )}
                      {" "}Verify করা যাবে।
                    </p>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-[#ffe16d]/35 p-3">
                    <span className="text-xs font-bold text-primary">
                      Verify করার পরে Due
                    </span>

                    <span className="text-sm font-bold text-primary">
                      {validAmount
                        ? money(
                            fromCents(afterCents)
                          )
                        : "—"}
                    </span>
                  </div>

                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-base-300 bg-white p-3">
                    <input
                      type="checkbox"
                      checked={confirmed}
                      disabled={saving}
                      onChange={(event) =>
                        setConfirmed(
                          event.target.checked
                        )
                      }
                      className="checkbox checkbox-secondary checkbox-sm mt-1"
                    />

                    <span className="text-xs leading-6 text-primary">
                      আমি Receiving Account-এর
                      Transaction History দেখে
                      TrxID, Sender ও Amount
                      নিশ্চিত করেছি।
                    </span>
                  </label>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={
                        saving ||
                        !confirmed ||
                        !validAmount
                      }
                      onClick={handleVerify}
                      className="flex items-center justify-center gap-2 rounded-xl bg-green-700 px-3 py-3 text-xs font-bold text-white disabled:opacity-40"
                    >
                      {saving ? (
                        <Loader2
                          size={15}
                          className="animate-spin"
                        />
                      ) : (
                        <CheckCircle2 size={15} />
                      )}
                      Verify
                    </button>

                    <button
                      type="button"
                      disabled={saving}
                      onClick={() =>
                        setMode("reject")
                      }
                      className="rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-xs font-bold text-red-700"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  <label className="text-xs font-bold text-primary">
                    Rejection Reason
                  </label>

                  <textarea
                    rows={3}
                    maxLength={500}
                    value={reason}
                    disabled={saving}
                    onChange={(event) =>
                      setReason(
                        event.target.value
                      )
                    }
                    placeholder="কেন payment reject করা হচ্ছে?"
                    className="w-full rounded-xl border border-base-300 bg-white p-3 text-xs outline-none focus:border-secondary"
                  />

                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() =>
                        setMode("verify")
                      }
                      className="rounded-xl border border-base-300 bg-white px-4 py-3 text-xs font-bold text-primary"
                    >
                      Back
                    </button>

                    <button
                      type="button"
                      disabled={
                        saving ||
                        !reason.trim()
                      }
                      onClick={handleReject}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-700 px-4 py-3 text-xs font-bold text-white disabled:opacity-40"
                    >
                      Reject Payment
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-secondary/15 bg-secondary/5 p-4">
              <p className="text-xs font-bold text-primary">
                {payment.status ===
                "partially_paid"
                  ? "Partial Payment Verified"
                  : "Payment Review Completed"}
              </p>

              <p className="mt-2 text-xs leading-6 text-muted">
                {payment.status ===
                "partially_paid"
                  ? `আগে ${money(payment.verifiedAmount)} Verified হয়েছে। বাকি ${money(remainingDue(order))} টাকার জন্য Customer-এর নতুন Payment Proof প্রয়োজন।`
                  : payment.status ===
                      "verified"
                    ? "সম্পূর্ণ Payment আগে থেকেই Verified।"
                    : payment.rejectedReason ||
                      "বর্তমানে কোনো pending proof নেই।"}
              </p>

              <p className="mt-2 text-[11px] text-muted">
                একই Proof আবার Verify করা যাবে না।
              </p>
            </div>
          )}

          {error && (
            <p
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700"
            >
              {error}
            </p>
          )}
        </div>

        <div className="flex justify-end border-t border-base-300 p-4">
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

// ==================================================
// MAIN ADMIN ORDER DETAILS PAGE
// ==================================================

export default function AdminOrderDetailsPage() {
  const { orderId } = useParams();

  const {
    user,
    loading,
    role,
    roleLoading,
    accountStatus,
  } = useContext(AuthContext);

  const queryClient = useQueryClient();

  const [copied, setCopied] =
    useState("");

  const [noteText, setNoteText] =
    useState("");

  const [paymentModalOpen, setPaymentModalOpen] =
    useState(false);

  const checking =
    loading ||
    (Boolean(user) && roleLoading);

  const allowed =
    !checking &&
    Boolean(user) &&
    role === "admin" &&
    accountStatus === "active";

  // ========================================
  // ORDER QUERY
  // ========================================

  const orderQuery = useQuery({
    queryKey: [
      "admin-order-detail",
      user?.uid,
      orderId,
    ],

    enabled: allowed && Boolean(orderId),

    queryFn: ({ signal }) =>
      adminRequest(
        user,
        `/admin/orders/${encodeURIComponent(
          orderId
        )}`,
        { signal }
      ),

    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  // ========================================
  // SHARED CACHE INVALIDATION
  // ========================================

  const refreshOrderCaches = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: [
          "admin-order-detail",
          user?.uid,
          orderId,
        ],
      }),

      queryClient.invalidateQueries({
        queryKey: ["admin-orders"],
      }),

      queryClient.invalidateQueries({
        queryKey: ["admin-payments"],
      }),
    ]);
  };

  // ========================================
  // ORDER STATUS / TRACKING / NOTES
  // ========================================

  const actionMutation = useMutation({
    mutationFn: ({
      endpoint,
      body,
    }) =>
      adminRequest(
        user,
        `/admin/orders/${encodeURIComponent(
          orderId
        )}/${endpoint}`,
        {
          method:
            endpoint === "notes"
              ? "POST"
              : "PATCH",
          body,
        }
      ),

    onSuccess: async () => {
      await refreshOrderCaches();

      Swal.fire({
        icon: "success",
        title: "সফলভাবে সংরক্ষিত হয়েছে",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 1800,
        timerProgressBar: true,
      });
    },
  });

  // ========================================
  // PAYMENT VERIFY / REJECT
  // ========================================

  const paymentMutation = useMutation({
    mutationFn: (body) =>
      adminRequest(
        user,
        `/admin/orders/${encodeURIComponent(
          orderId
        )}/payment`,
        {
          method: "PATCH",
          body,
        }
      ),

    onSuccess: async () => {
      setPaymentModalOpen(false);

      await refreshOrderCaches();

      Swal.fire({
        icon: "success",
        title: "Payment Updated",
        text: "পেমেন্টের তথ্য MongoDB-তে সংরক্ষিত হয়েছে।",
        confirmButtonColor: "#76258A",
      });
    },
  });

  const saving =
    actionMutation.isPending ||
    paymentMutation.isPending;

  const saveAction = (
    endpoint,
    body
  ) =>
    actionMutation.mutateAsync({
      endpoint,
      body,
    });

  // ========================================
  // PAYMENT MODAL
  // ========================================

  const openPaymentModal = async () => {
    paymentMutation.reset();

    // Fetch latest proof before allowing
    // financial changes.
    const result = await orderQuery.refetch();

    if (result.isError) {
      Swal.fire({
        icon: "error",
        text:
          result.error?.message ||
          "Order refresh failed",
        confirmButtonColor: "#76258A",
      });
      return;
    }

    if (result.data?.order) {
      setPaymentModalOpen(true);
    }
  };

  const closePaymentModal = () => {
    if (paymentMutation.isPending) return;

    setPaymentModalOpen(false);
    paymentMutation.reset();
  };

  // ========================================
  // ESCAPE + SCROLL LOCK FOR MODAL
  // ========================================

  useEffect(() => {
    if (!paymentModalOpen) return;

    const oldOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    const handleEscape = (event) => {
      if (
        event.key === "Escape" &&
        !paymentMutation.isPending
      ) {
        setPaymentModalOpen(false);
      }
    };

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.body.style.overflow =
        oldOverflow;

      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [
    paymentModalOpen,
    paymentMutation.isPending,
  ]);

  // ========================================
  // COPY
  // ========================================

  const copyText = async (value, key) => {
    try {
      await navigator.clipboard.writeText(
        String(value || "")
      );

      setCopied(key);
    } catch {
      Swal.fire({
        icon: "error",
        text: "Copy করা যায়নি।",
        confirmButtonColor: "#76258A",
      });
    }
  };

  // ========================================
  // STATUS UPDATE
  // NO NOTE FIELD
  // ========================================

  const updateStatus = async (status) => {
    if (saving) return;

    const cancelling =
      status === "cancelled";

    const result = await Swal.fire({
      title: cancelling
        ? "অর্ডার বাতিল করবেন?"
        : "Status পরিবর্তন করবেন?",

      text: cancelling
        ? "Payment নেওয়া হয়ে থাকলে Refund আলাদাভাবে পরিচালনা করতে হবে।"
        : `New Status: ${
            ORDER_STATUSES[status] || status
          }`,

      icon: cancelling
        ? "warning"
        : "question",

      showCancelButton: true,

      confirmButtonText: cancelling
        ? "Cancel Order"
        : "Confirm",

      cancelButtonText: "Back",

      confirmButtonColor: cancelling
        ? "#dc2626"
        : "#237547",

      cancelButtonColor: "#76258A",
    });

    if (!result.isConfirmed) return;

    try {
      // Backend automatically generates
      // history note.
      await saveAction("status", {
        status,
      });
    } catch {
      // Error shown in the page.
    }
  };

  // ========================================
  // COD PHONE CONFIRMATION
  // ========================================

  const updatePhoneConfirmation = async (
    confirmed
  ) => {
    if (saving) return;

    const result = await Swal.fire({
      title: confirmed
        ? "Customer ফোনে Confirm করেছেন?"
        : "Confirmation প্রত্যাহার করবেন?",

      icon: "question",
      showCancelButton: true,

      confirmButtonText: "Confirm",
      cancelButtonText: "Back",

      confirmButtonColor: "#76258A",
    });

    if (!result.isConfirmed) return;

    try {
      await saveAction(
        "phone-confirmation",
        { confirmed }
      );
    } catch {
      // Error shown in the page.
    }
  };

  // ========================================
  // INTERNAL ADMIN NOTE
  // ========================================

  const addNote = async () => {
    const text = noteText.trim();

    if (!text || saving) return;

    try {
      await saveAction("notes", { text });
      setNoteText("");
    } catch {
      // Error shown in the page.
    }
  };

  // ========================================
  // AUTH / LOADING
  // ========================================

  if (checking) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <Loader2
          size={28}
          className="animate-spin text-secondary"
        />

        <p className="mt-3 text-sm text-muted">
          Admin Account যাচাই হচ্ছে...
        </p>
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="rounded-2xl border border-base-300 bg-white p-10 text-center">
        <ShieldCheck
          size={34}
          className="mx-auto text-secondary"
        />

        <h2 className="mt-3 text-lg font-bold text-primary">
          Access Denied
        </h2>

        <p className="mt-2 text-xs text-muted">
          Active Admin account প্রয়োজন।
        </p>
      </div>
    );
  }

  if (orderQuery.isPending) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <Loader2
          size={28}
          className="animate-spin text-secondary"
        />

        <p className="mt-3 text-sm text-muted">
          Order Details লোড হচ্ছে...
        </p>
      </div>
    );
  }

  if (
    orderQuery.isError ||
    !orderQuery.data?.order
  ) {
    return (
      <div className="rounded-2xl border border-red-200 bg-white p-8 text-center">
        <AlertTriangle
          size={30}
          className="mx-auto text-red-600"
        />

        <p className="mt-3 text-sm text-red-700">
          {orderQuery.error?.message ||
            "Order not found"}
        </p>

        <button
          type="button"
          onClick={() => orderQuery.refetch()}
          className="mt-4 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  // ========================================
  // ORDER DATA
  // ========================================

  const order = orderQuery.data.order;

  const customer = order.customer || {};
  const shipping = order.shipping || {};
  const payment = order.payment || {};

  const items = Array.isArray(order.items)
    ? order.items
    : [];

  const totalQuantity = items.reduce(
    (total, item) =>
      total + (Number(item.quantity) || 0),
    0
  );

  const customized =
    items.some(isCustomized);

  const notes = Array.isArray(
    order.internalNotes
  )
    ? order.internalNotes
    : [];

  const history = Array.isArray(
    order.history
  )
    ? [...order.history].reverse()
    : [];

  const isCOD =
    payment.method === "cod";

  const due = remainingDue(order);

  const verifiedAmount =
    Number(payment.verifiedAmount) || 0;

  const customerPhone =
    shipping.phone ||
    customer.phone ||
    "";

  const whatsapp =
    whatsappLink(order);

  const canConfirmCOD =
    isCOD &&
    ["pending", "verified"].includes(
      order.status
    );

  const hasPendingOnlineProof =
    !isCOD &&
    order.status === "pending" &&
    payment.status === "pending";

  const needsOnlinePayment =
    !isCOD &&
    order.status === "pending" &&
    payment.status !== "verified";

  const needsCODConfirmation =
    isCOD &&
    order.status === "pending" &&
    !order.phoneConfirmed;

  const canAdvancePending =
    order.status === "pending" &&
    (isCOD
      ? order.phoneConfirmed === true
      : payment.status === "verified");

  const nextStatus =
    order.status === "pending"
      ? canAdvancePending
        ? "verified"
        : null
      : NEXT_STATUSES[order.status] || null;

  const canCancel = [
    "pending",
    "verified",
    "processing",
  ].includes(order.status);

  const shippingReady =
    Boolean(order.courier?.name) &&
    Boolean(order.courier?.trackingNumber) &&
    Boolean(order.estimatedDelivery);

  const canAdvance =
    Boolean(nextStatus) &&
    (nextStatus !== "shipped" ||
      shippingReady);

  // ========================================
  // PAGE
  // ========================================

  return (
    <div className="mx-auto max-w-[1550px] space-y-5 pb-10 text-primary">
      {/* BREADCRUMB */}

      <nav className="flex flex-wrap items-center gap-2 text-xs text-muted">
        <Link
          to="/admin"
          className="hover:text-secondary"
        >
          ড্যাশবোর্ড
        </Link>

        <span>/</span>

        <Link
          to="/admin/orders"
          className="hover:text-secondary"
        >
          অর্ডারসমূহ
        </Link>

        <span>/</span>

        <span className="font-semibold text-primary">
          {order.orderNumber}
        </span>
      </nav>

      {/* HEADER */}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/admin/orders"
              aria-label="Back"
              className="flex size-9 items-center justify-center rounded-xl border border-base-300 bg-white hover:bg-base-200"
            >
              <ArrowLeft size={17} />
            </Link>

            <h1 className="break-all text-xl font-bold text-primary sm:text-2xl">
              অর্ডার #{order.orderNumber}
            </h1>

            <button
              type="button"
              title="Copy Order Number"
              onClick={() =>
                copyText(
                  order.orderNumber,
                  "order"
                )
              }
              className="rounded-lg p-1.5 text-muted hover:bg-white"
            >
              {copied === "order" ? (
                <Check size={16} />
              ) : (
                <Copy size={16} />
              )}
            </button>

            <StatusBadge
              status={order.status}
            />

            {customized && (
              <span className="rounded-full bg-primary px-3 py-1 text-[11px] font-bold text-white">
                Customized
              </span>
            )}
          </div>

          <p className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
            <CalendarDays size={14} />

            {formatDate(order.createdAt)}

            <span>•</span>

            {order.guest
              ? "Guest Checkout"
              : "Registered Customer"}
          </p>
        </div>

        {/* NO INVOICE / COURIER PRINT */}

        <button
          type="button"
          onClick={() => orderQuery.refetch()}
          disabled={orderQuery.isFetching}
          className="inline-flex items-center gap-2 rounded-xl border border-base-300 bg-white px-4 py-2.5 text-xs font-bold text-secondary disabled:opacity-50"
        >
          <RefreshCw
            size={15}
            className={
              orderQuery.isFetching
                ? "animate-spin"
                : ""
            }
          />
          Refresh
        </button>
      </div>

      {/* IMPORTANT BANNER */}

      {(needsCODConfirmation ||
        needsOnlinePayment) && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-white p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#ffe16d]/40 text-primary">
              <AlertTriangle size={20} />
            </div>

            <div>
              <h2 className="text-sm font-bold text-primary">
                {needsCODConfirmation
                  ? "ফোন কনফার্মেশন প্রয়োজন"
                  : payment.status ===
                      "partially_paid"
                    ? "বাকি Payment প্রয়োজন"
                    : "পেমেন্ট যাচাই প্রয়োজন"}
              </h2>

              <p className="mt-1 text-xs leading-6 text-muted">
                {needsCODConfirmation
                  ? "Customer-এর সাথে কথা বলে COD অর্ডার নিশ্চিত করুন।"
                  : payment.status ===
                      "partially_paid"
                    ? `${money(verifiedAmount)} Verified হয়েছে। বাকি ${money(due)} টাকার নতুন Payment Proof প্রয়োজন।`
                    : "Receiving Account যাচাই করে Payment Confirm করুন।"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {customerPhone && (
              <a
                href={`tel:${customerPhone}`}
                className="inline-flex items-center gap-2 rounded-xl bg-secondary px-3 py-2.5 text-xs font-bold text-white"
              >
                <Phone size={15} />
                Call
              </a>
            )}

            {needsCODConfirmation && (
              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  updatePhoneConfirmation(true)
                }
                className="rounded-xl bg-[#ffe16d] px-4 py-2.5 text-xs font-bold text-primary disabled:opacity-50"
              >
                Confirm COD
              </button>
            )}

            {!isCOD && (
              <button
                type="button"
                disabled={saving}
                onClick={openPaymentModal}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50"
              >
                <ShieldCheck size={15} />
                {hasPendingOnlineProof
                  ? "Verify Payment"
                  : "Payment Details"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ACTION ERROR */}

      {actionMutation.isError && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700"
        >
          {actionMutation.error?.message}
        </p>
      )}

      {/* TWO COLUMN LAYOUT */}

      <div className="grid items-start gap-5 xl:grid-cols-12">
        {/* LEFT */}

        <div className="space-y-5 xl:col-span-8">
          {/* PRODUCTS */}

          <Section
            title="অর্ডারকৃত আইটেম ও কাস্টমাইজেশন বিবরণী"
            subtitle="Ordered Products"
            icon={Package}
            right={
              <span className="rounded-full bg-secondary/10 px-3 py-1.5 text-xs font-bold text-secondary">
                মোট {totalQuantity} পিস
              </span>
            }
          >
            <div className="space-y-3">
              {items.map((item, index) => (
                <OrderItemCard
                  key={item.cartId || index}
                  item={item}
                />
              ))}

              {items.length === 0 && (
                <p className="text-xs text-muted">
                  কোনো Product পাওয়া যায়নি।
                </p>
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

          {/* HISTORY */}

          <Section
            title="অর্ডার প্রসেসিং ও ডেলিভারি টাইমলাইন"
            subtitle="Order Activity History"
            icon={History}
          >
            <div className="space-y-4">
              {history.length === 0 && (
                <p className="text-xs text-muted">
                  কোনো History নেই।
                </p>
              )}

              {history.map((event, index) => (
                <div
                  key={`${event.date}-${index}`}
                  className="border-l-2 border-secondary/30 pl-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-bold text-primary">
                      {ORDER_STATUSES[event.status] ||
                        event.status}
                    </p>

                    <p className="text-[11px] text-secondary">
                      {formatDate(event.date)}
                    </p>
                  </div>

                  {event.note && (
                    <p className="mt-1 text-xs leading-6 text-muted">
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
            subtitle="Admin Only"
            icon={MessageSquareText}
          >
            <div className="space-y-3">
              {notes.length === 0 && (
                <p className="rounded-lg bg-base-200 p-3 text-xs text-muted">
                  এখনো কোনো Internal Note নেই।
                </p>
              )}

              {notes.map((note, index) => (
                <div
                  key={note.id || index}
                  className="rounded-xl bg-base-200 p-3"
                >
                  <div className="flex flex-wrap justify-between gap-2">
                    <p className="text-xs font-bold text-primary">
                      {note.author ||
                        "SokhBilash Admin"}
                    </p>

                    <p className="text-[11px] text-muted">
                      {formatDate(
                        note.createdAt
                      )}
                    </p>
                  </div>

                  <p className="mt-2 whitespace-pre-wrap text-xs leading-6 text-muted">
                    {note.text}
                  </p>
                </div>
              ))}

              <textarea
                rows={3}
                maxLength={1000}
                value={noteText}
                disabled={saving}
                onChange={(event) =>
                  setNoteText(
                    event.target.value
                  )
                }
                placeholder="Workshop Instruction বা Internal Note লিখুন..."
                className="w-full rounded-xl border border-base-300 bg-base-200 p-3 text-xs outline-none focus:border-secondary"
              />

              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={
                    saving ||
                    !noteText.trim()
                  }
                  onClick={addNote}
                  className="inline-flex items-center gap-2 rounded-xl bg-secondary px-4 py-2.5 text-xs font-bold text-white disabled:opacity-40"
                >
                  <Plus size={15} />
                  নোট যোগ করুন
                </button>
              </div>
            </div>
          </Section>

          {/* STATUS */}

          <Section
            title="অর্ডার স্ট্যাটাস ম্যানেজমেন্ট"
            subtitle="Manual Order Fulfillment"
            icon={ClipboardCheck}
            right={
              <StatusBadge
                status={order.status}
              />
            }
          >
            {isCOD && (
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-base-200 p-3">
                <div>
                  <p className="text-xs font-bold text-primary">
                    COD Phone Confirmation
                  </p>

                  <p className="mt-1 text-[11px] text-muted">
                    {order.phoneConfirmed
                      ? "Confirmed"
                      : "Not Confirmed"}
                  </p>
                </div>

                {canConfirmCOD && (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() =>
                      updatePhoneConfirmation(
                        !order.phoneConfirmed
                      )
                    }
                    className={`rounded-lg px-3 py-2 text-xs font-bold disabled:opacity-40 ${
                      order.phoneConfirmed
                        ? "bg-red-50 text-red-700"
                        : "bg-green-700 text-white"
                    }`}
                  >
                    {order.phoneConfirmed
                      ? "Revoke"
                      : "Confirm"}
                  </button>
                )}
              </div>
            )}

            <p className="text-xs leading-6 text-muted">
              Payment Verification বা COD
              Confirmation সম্পন্ন হওয়ার পর
              অর্ডারকে পরবর্তী ধাপে এগিয়ে নিন।
              Status Change-এর জন্য আলাদা Note
              দিতে হবে না।
            </p>

            {order.status === "pending" &&
              !canAdvancePending && (
                <div className="mt-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
                  {isCOD
                    ? "আগে COD Phone Confirm করুন।"
                    : "আগে সম্পূর্ণ Online Payment Verify করুন।"}
                </div>
              )}

            <div className="mt-4 flex flex-wrap gap-2">
              {nextStatus && (
                <button
                  type="button"
                  disabled={
                    saving ||
                    !canAdvance
                  }
                  onClick={() =>
                    updateStatus(nextStatus)
                  }
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-700 px-4 py-3 text-xs font-bold text-white disabled:opacity-40"
                >
                  {saving ? (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  ) : (
                    <CheckCircle2 size={16} />
                  )}

                  {ORDER_STATUSES[nextStatus]} করুন
                </button>
              )}

              {canCancel && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() =>
                    updateStatus("cancelled")
                  }
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-700 disabled:opacity-50"
                >
                  Cancel Order
                </button>
              )}
            </div>

            {nextStatus === "shipped" &&
              !shippingReady && (
                <p className="mt-3 text-xs text-amber-700">
                  Shipped করার আগে Courier Name,
                  Tracking ID ও Expected Delivery
                  save করুন।
                </p>
              )}

            {!nextStatus && !canCancel && (
              <p className="mt-4 rounded-lg bg-base-200 p-3 text-xs text-muted">
                এই Order-এর আর কোনো Manual
                Status Action নেই।
              </p>
            )}
          </Section>
        </div>

        {/* RIGHT */}

        <div className="space-y-5 xl:col-span-4">
          {/* CUSTOMER */}

          <Section
            title="গ্রাহক প্রোফাইল"
            subtitle="Customer & Delivery Information"
            icon={UserRound}
          >
            <div className="mb-4 flex min-w-0 items-center gap-3">
              <CustomerAvatar
                name={customer.name}
                photoUrl={
                  order.guest
                    ? ""
                    : order.customerPhotoUrl
                }
              />

              <div className="min-w-0">
                <p
                  title={customer.name}
                  className="truncate text-sm font-bold text-primary"
                >
                  {customer.name ||
                    "Unknown Customer"}
                </p>

                <p className="mt-1 text-[11px] text-muted">
                  {order.guest
                    ? "Guest Customer"
                    : "Registered Customer"}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 rounded-xl bg-base-200 p-3">
              <p className="min-w-0 truncate text-xs font-bold text-primary">
                {customerPhone || "—"}
              </p>

              <div className="flex shrink-0 gap-2">
                {customerPhone && (
                  <a
                    href={`tel:${customerPhone}`}
                    title="Call"
                    className="text-secondary"
                  >
                    <Phone size={16} />
                  </a>
                )}

                {whatsapp && (
                  <a
                    href={whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="WhatsApp"
                    className="text-green-600"
                  >
                    <MessageCircle size={17} />
                  </a>
                )}

                <button
                  type="button"
                  title="Copy Phone"
                  onClick={() =>
                    copyText(
                      customerPhone,
                      "phone"
                    )
                  }
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
              <div className="mt-2 flex items-start gap-2 rounded-xl bg-base-200 p-3">
                <Mail
                  size={15}
                  className="mt-0.5 shrink-0 text-secondary"
                />

                <p className="min-w-0 break-all text-xs text-muted">
                  {customer.email}
                </p>
              </div>
            )}

            <div className="mt-4 border-t border-base-300 pt-4">
              <p className="mb-2 flex items-center gap-2 text-xs font-bold text-primary">
                <MapPin
                  size={15}
                  className="text-secondary"
                />
                ডেলিভারি ঠিকানা
              </p>

              <div className="rounded-xl bg-base-200 p-3">
                <p className="text-xs font-bold text-primary">
                  {shipping.recipientName ||
                    customer.name}
                </p>

                <p className="mt-2 text-xs leading-6 text-muted">
                  {shipping.address || "—"}
                </p>

                <p className="mt-1 text-[11px] text-muted">
                  {shipping.district || "—"},{" "}
                  {shipping.division || "—"}
                </p>
              </div>

              {shipping.note && (
                <p className="mt-2 rounded-lg bg-[#ffe16d]/25 p-3 text-xs text-primary">
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
            right={
              <StatusBadge
                status={payment.status}
                payment
              />
            }
          >
            <InfoRow
              label="Subtotal"
              value={money(order.subtotal)}
            />

            <InfoRow
              label="Discount"
              value={
                <span className="text-red-600">
                  −{money(order.discount)}
                </span>
              }
            />

            <InfoRow
              label="Gift Wrap"
              value={money(
                order.giftWrapCharge
              )}
            />

            <InfoRow
              label="Delivery"
              value={money(
                order.deliveryCharge
              )}
            />

            <div className="mt-3 rounded-xl bg-primary p-3 text-white">
              <div className="flex justify-between gap-3">
                <span className="text-xs font-semibold">
                  Grand Total
                </span>

                <span className="text-lg font-bold">
                  {money(order.total)}
                </span>
              </div>
            </div>

            {/* ALWAYS SHOW VERIFIED AMOUNT */}

            <div className="mt-3 rounded-xl bg-green-50 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="flex items-center gap-2 text-xs font-bold text-green-800">
                  <CheckCircle2 size={16} />
                  Verified Payment
                </p>

                <span className="text-lg font-bold text-green-800">
                  {money(verifiedAmount)}
                </span>
              </div>

              {payment.status ===
                "partially_paid" && (
                <p className="mt-2 text-[11px] leading-5 text-green-700">
                  এই Amount Verified হয়েছে,
                  কিন্তু Order এখনো Fully Paid নয়।
                </p>
              )}

              {payment.verifiedAt && (
                <p className="mt-2 text-[11px] text-green-700">
                  Last Verified:{" "}
                  {formatDate(
                    payment.verifiedAt
                  )}
                </p>
              )}
            </div>

            <div className="mt-3 rounded-xl bg-[#ffe16d]/40 p-3">
              <p className="text-[11px] font-bold text-primary">
                Remaining Due
              </p>

              <p className="mt-1 text-2xl font-bold text-primary">
                {money(due)}
              </p>

              <p className="mt-1 text-[11px] text-primary/70">
                {due > 0
                  ? "এখনো সম্পূর্ণ পরিশোধ হয়নি।"
                  : "সম্পূর্ণ পরিশোধিত।"}
              </p>
            </div>

            <div className="mt-4 border-t border-base-300 pt-3">
              <InfoRow
                label="Payment Method"
                value={
                  PAYMENT_METHODS[payment.method] ||
                  payment.method ||
                  "—"
                }
              />

              {!isCOD && (
                <>
                  <InfoRow
                    label="Sender Phone"
                    value={
                      payment.senderPhone || "—"
                    }
                  />

                  <InfoRow
                    label="Claimed Amount"
                    value={money(
                      payment.claimedAmount
                    )}
                  />

                  <InfoRow
                    label="TrxID"
                    value={
                      <span className="break-all font-mono text-[11px]">
                        {payment.trxId || "—"}
                      </span>
                    }
                  />
                </>
              )}

              {isCOD && (
                <InfoRow
                  label="Phone Confirmed"
                  value={
                    order.phoneConfirmed
                      ? "Yes"
                      : "No"
                  }
                />
              )}
            </div>

            {/* PAYMENT REVIEW IN SAME PAGE */}

            {!isCOD && (
              <button
                type="button"
                onClick={openPaymentModal}
                disabled={saving}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-secondary/10 px-4 py-3 text-xs font-bold text-secondary transition hover:bg-secondary hover:text-white disabled:opacity-40"
              >
                <ShieldCheck size={16} />

                {hasPendingOnlineProof
                  ? "Verify Payment"
                  : "Payment Details"}

                {hasPendingOnlineProof && (
                  <span className="rounded-full bg-white/60 px-2 py-0.5 text-[10px]">
                    Pending
                  </span>
                )}
              </button>
            )}
          </Section>

          {/* COURIER */}

          <CourierSection
            key={order._id}
            order={order}
            saving={saving}
            onSave={(values) =>
              saveAction(
                "tracking",
                values
              )
            }
          />
        </div>
      </div>

      {/* PAYMENT MODAL */}

      {paymentModalOpen && !isCOD && (
        <PaymentVerificationModal
          key={`${order._id}-${payment.status}-${payment.trxId}-${order.revision}`}
          order={order}
          saving={paymentMutation.isPending}
          error={
            paymentMutation.error?.message || ""
          }
          onClose={closePaymentModal}
          onDecision={(body) =>
            paymentMutation.mutate(body)
          }
        />
      )}
    </div>
  );
}
