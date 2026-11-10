import { useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
import { getAuth } from "firebase/auth";

import {
  GripVertical,
  Image as ImageIcon,
  ImageOff,
  Loader2,
  Package,
  Plus,
  RefreshCw,
  Save,
  Star,
  UploadCloud,
  X,
  ArrowUp,
  ArrowDown,
  Info,
  Search,
} from "lucide-react";

import { app } from "../../../firebase/firebase.config";
import { API_URL } from "../../utils/siteConfig";

const MAX_IMAGES = 5;
const MAX_VARIANTS = 100;
const OPTION_TYPES = ["size", "color", "type"];

const inputClass =
  "w-full min-w-0 rounded-lg border border-[#e8ddec] bg-white px-3 py-2.5 text-sm text-[#310039] placeholder:text-[#a89aad] outline-none transition focus:border-[#903eaa] focus:ring-2 focus:ring-[#903eaa]/10";

const primaryButton =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-[#903eaa] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#76258a] disabled:cursor-not-allowed disabled:opacity-50";

const softButton =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-[#f2e8f7] px-3 py-2 text-sm font-semibold text-[#76258a] transition hover:bg-[#ead9f1] disabled:opacity-50";

// ==========================================
// HELPERS
// ==========================================

const normalizeLabel = (value) =>
  String(value ?? "")
    .normalize("NFKC")
    .replace(/\p{Cf}/gu, "")
    .trim()
    .replace(/\s+/gu, " ")
    .toLowerCase();

const isReservedOption = (value) =>
  ["default", "ডিফল্ট", "ডিফল্ট্"].includes(normalizeLabel(value));

const uid = () =>
  globalThis.crypto?.randomUUID?.() ||
  `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const makeSku = () =>
  `SKB-${Date.now().toString(36).toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 7)
    .toUpperCase()}`;

const money = (value) =>
  `৳ ${Number(value || 0).toLocaleString("bn-BD", {
    maximumFractionDigits: 2,
  })}`;

const validUrl = (value) => {
  try {
    return ["https:", "http:"].includes(new URL(String(value).trim()).protocol);
  } catch {
    return false;
  }
};

const makeHash = (text) => {
  let hash = 2166136261;

  for (let index = 0; index < text.length; index++) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36).toUpperCase();
};

const isRecord = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const toast = (title, icon = "success") =>
  Swal.fire({
    title,
    icon,
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 2600,
  });

const optionSignature = (options = {}) =>
  JSON.stringify(
    OPTION_TYPES.map((type) => [type, normalizeLabel(options[type])]),
  );

function parseOptionIds(key) {
  const result = {};

  for (const part of String(key || "").split("|")) {
    const separator = part.indexOf(":");
    if (separator < 1) continue;

    const type = part.slice(0, separator);
    const id = part.slice(separator + 1);

    if (OPTION_TYPES.includes(type) && /^[a-zA-Z0-9_-]+$/.test(id)) {
      result[type] = id;
    }
  }

  return result;
}

function emptyProduct() {
  return {
    id: "",
    name: "",
    sku: "",
    autoSku: true,
    regularPrice: "",
    salePrice: "",
    description: "",
    categoryId: "",
    occasionIds: [],
    images: [{ id: "product-image-1", url: "" }],
    available: true,
    featured: false,
    customizable: false,
    variantsEnabled: false,
    options: {
      size: { enabled: true, values: [] },
      color: { enabled: true, values: [] },
      type: { enabled: false, values: [] },
    },
    variantOverrides: {},
    customerFieldType: "none",
    packaging: "regular",
    premiumBoxPrice: "0",
  };
}

function generateCombinations(options, enabled) {
  if (!enabled) return { rows: [], count: 0 };

  const groups = OPTION_TYPES.map((type) => [type, options[type]]).filter(
    ([, group]) => group?.enabled && group.values.length > 0,
  );

  if (!groups.length) return { rows: [], count: 0 };

  const count = groups.reduce(
    (total, [, group]) => total * group.values.length,
    1,
  );

  if (count > MAX_VARIANTS) {
    return { rows: [], count };
  }

  let rows = [{ parts: [] }];

  for (const [type, group] of groups) {
    rows = rows.flatMap((row) =>
      group.values.map((option) => ({
        parts: [
          ...row.parts,
          {
            type,
            id: option.id,
            label: option.label,
          },
        ],
      })),
    );
  }

  return {
    count,
    rows: rows.map((row) => ({
      ...row,
      combinationKey: row.parts
        .map((part) => `${part.type}:${part.id}`)
        .join("|"),
      title: row.parts.map((part) => part.label).join(" / "),
      options: Object.fromEntries(
        row.parts.map((part) => [part.type, part.label]),
      ),
    })),
  };
}

// ==========================================
// RESTORE SAVED PRODUCT
// Saved variants are the source for real data.
// Overrides are kept as editing metadata.
// ==========================================

function hydrateProduct(existing) {
  const defaults = emptyProduct();

  const savedVariants = Array.isArray(existing.variants)
    ? existing.variants
    : [];

  const rawOverrides = isRecord(existing.variantOverrides)
    ? existing.variantOverrides
    : {};

  const options = {};

  for (const type of OPTION_TYPES) {
    const rawGroup = existing.options?.[type];
    const groupExists = isRecord(rawGroup);

    const rawValues = Array.isArray(rawGroup?.values) ? rawGroup.values : [];

    const values = [];
    const labelSet = new Set();
    const idSet = new Set();

    const appendValue = (rawValue) => {
      const label = String(
        typeof rawValue === "string" ? rawValue : rawValue?.label || "",
      ).trim();

      if (!label) return;

      const normalized = normalizeLabel(label);

      if (labelSet.has(normalized)) return;

      // Recover an ID from a saved key when the option
      // object does not contain its original ID.
      const matchingVariant = savedVariants.find(
        (variant) => normalizeLabel(variant.options?.[type]) === normalized,
      );

      const recoveredId = matchingVariant
        ? parseOptionIds(matchingVariant.key)[type]
        : "";

      const originalId =
        typeof rawValue === "object" && rawValue
          ? String(rawValue.id || "")
          : "";

      let id =
        originalId || recoveredId || `legacy-${type}-${values.length + 1}`;

      if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
        throw new Error(
          `${type}: saved option ID সঠিক নয়। Data migration ছাড়া এটি save করা নিরাপদ নয়।`,
        );
      }

      if (idSet.has(id)) {
        throw new Error(`${type}: একাধিক option-এর একই ID পাওয়া গেছে।`);
      }

      values.push({ id, label });
      labelSet.add(normalized);
      idSet.add(id);
    };

    rawValues.forEach(appendValue);

    // Recover missing option labels from existing variants.
    savedVariants.forEach((variant) => {
      const label = String(variant.options?.[type] || "").trim();
      if (label) appendValue(label);
    });

    const inferredEnabled = savedVariants.some((variant) =>
      String(variant.options?.[type] || "").trim(),
    );

    options[type] = {
      enabled: groupExists
        ? rawGroup.enabled === true ||
          (rawGroup.enabled === undefined && inferredEnabled)
        : inferredEnabled,
      values,
    };
  }

  const variantsEnabled = existing.variantsEnabled === true;

  const { rows, count } = generateCombinations(options, variantsEnabled);

  if (variantsEnabled && count > MAX_VARIANTS) {
    throw new Error(
      `Saved options থেকে ${count}টি combination হচ্ছে। সর্বোচ্চ ${MAX_VARIANTS}টি অনুমোদিত।`,
    );
  }

  const rowsBySignature = new Map(
    rows.map((row) => [optionSignature(row.options), row]),
  );

  const restoredOverrides = {};
  const usedKeys = new Set();
  const usedCombinations = new Set();

  // First retain overrides for combinations without
  // a materialized saved variant.
  for (const row of rows) {
    const savedOverride = rawOverrides[row.combinationKey];

    if (isRecord(savedOverride)) {
      restoredOverrides[row.combinationKey] = {
        ...savedOverride,
        savedKey: row.combinationKey,
      };
    }
  }

  for (const variant of savedVariants) {
    if (!isRecord(variant)) {
      throw new Error("Saved variant data সঠিক নয়।");
    }

    const row = rowsBySignature.get(optionSignature(variant.options));

    if (!row) {
      // Do not silently drop saved variants.
      if (variantsEnabled) {
        throw new Error(
          `"${variant.title || variant.key}" variant-এর options মেলেনি। ভুল data দিয়ে overwrite বন্ধ করা হয়েছে।`,
        );
      }

      continue;
    }

    const key = String(variant.key || row.combinationKey);

    if (key.length > 200 || !/^[a-zA-Z0-9_:|-]+$/.test(key)) {
      throw new Error(
        `"${variant.title || key}" variant-এর saved key সঠিক নয়।`,
      );
    }

    if (usedKeys.has(key) || usedCombinations.has(row.combinationKey)) {
      throw new Error(
        "একই key বা একই option combination-এর duplicate saved variant পাওয়া গেছে।",
      );
    }

    usedKeys.add(key);
    usedCombinations.add(row.combinationKey);

    const metadata =
      rawOverrides[key] || rawOverrides[row.combinationKey] || {};

    // Preserve explicit base-price inheritance if metadata
    // says the price field was intentionally left empty.
    const price =
      metadata.price === ""
        ? ""
        : variant.price !== undefined && variant.price !== null
          ? String(variant.price)
          : metadata.price == null
            ? ""
            : String(metadata.price);

    restoredOverrides[row.combinationKey] = {
      savedKey: key,
      sku: String(variant.sku ?? metadata.sku ?? ""),
      autoSku:
        typeof variant.autoSku === "boolean"
          ? variant.autoSku
          : (metadata.autoSku ?? false),
      price,
      imageUrl: String(variant.imageUrl ?? metadata.imageUrl ?? ""),
      available:
        typeof variant.available === "boolean"
          ? variant.available
          : metadata.available !== false,
    };
  }

  const images = (Array.isArray(existing.images) ? existing.images : []).map(
    (image, index) => ({
      id:
        typeof image === "object" && image?.id
          ? String(image.id)
          : `saved-image-${index + 1}`,
      url: String(typeof image === "string" ? image : image?.url || ""),
    }),
  );

  return {
    ...defaults,
    id: String(existing._id || existing.id || ""),
    name: String(existing.name || ""),
    sku: String(existing.sku || ""),
    autoSku: existing.autoSku === true,
    regularPrice: String(existing.regularPrice ?? ""),
    salePrice: existing.salePrice == null ? "" : String(existing.salePrice),
    description: String(existing.description || ""),
    categoryId: existing.categoryId || "",
    occasionIds: Array.isArray(existing.occasionIds)
      ? existing.occasionIds
      : [],
    images: images.length ? images : defaults.images,
    available: existing.available === true,
    featured: existing.featured === true,
    customizable: existing.customizable === true,
    variantsEnabled,
    options,
    variantOverrides: restoredOverrides,
    customerFieldType: existing.customerFieldType || "none",
    packaging: existing.packaging === "premium" ? "premium" : "regular",
    premiumBoxPrice: String(existing.premiumBoxPrice ?? 0),
  };
}

async function getToken() {
  const auth = getAuth(app);

  if (typeof auth.authStateReady === "function") {
    await auth.authStateReady();
  }

  if (!auth.currentUser) {
    throw new Error("প্রোডাক্ট পরিচালনা করতে লগইন করুন।");
  }

  return auth.currentUser.getIdToken();
}

async function fetchTaxonomies({ signal }) {
  const [categoryResponse, occasionResponse] = await Promise.all([
    fetch(`${API_URL}/categories`, { signal }),
    fetch(`${API_URL}/occasions`, { signal }),
  ]);

  const [categoryData, occasionData] = await Promise.all([
    categoryResponse.json().catch(() => ({})),
    occasionResponse.json().catch(() => ({})),
  ]);

  if (
    !categoryResponse.ok ||
    !occasionResponse.ok ||
    !categoryData.success ||
    !occasionData.success
  ) {
    throw new Error("ক্যাটাগরি ও উপলক্ষ লোড করা যায়নি।");
  }

  return {
    categories: Array.isArray(categoryData.categories)
      ? categoryData.categories
      : [],
    occasions: Array.isArray(occasionData.occasions)
      ? occasionData.occasions
      : [],
  };
}

// ==========================================
// REUSABLE COMPONENTS
// ==========================================

function Section({ title, right, children }) {
  return (
    <section className="overflow-hidden rounded-xl border border-[#ede4f1] bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f2ebf5] px-4 py-4 sm:px-5">
        <h2 className="flex items-center gap-2 text-base font-bold text-[#310039]">
          <span className="size-2 shrink-0 rounded-full bg-[#903eaa]" />
          {title}
        </h2>
        {right}
      </div>
      <div className="space-y-4 p-4 sm:p-5">{children}</div>
    </section>
  );
}

function Field({ label, required = false, hint, children }) {
  return (
    <div className="min-w-0">
      <p className="mb-2 text-sm font-semibold text-[#310039]">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </p>
      {children}
      {hint && (
        <p className="mt-1.5 text-xs leading-relaxed text-[#82748b]">{hint}</p>
      )}
    </div>
  );
}

function MiniSwitch({ checked, onChange, disabled = false }) {
  return (
    <label className="relative inline-flex shrink-0 cursor-pointer items-center">
      <input
        type="checkbox"
        checked={Boolean(checked)}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />
      <span className="h-6 w-11 rounded-full bg-[#ddd2e3] transition peer-checked:bg-[#903eaa] peer-focus-visible:ring-2 peer-focus-visible:ring-[#903eaa] peer-disabled:opacity-50" />
      <span className="absolute left-[3px] top-[3px] size-[18px] rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
    </label>
  );
}

function Photo({ url, className = "" }) {
  const [brokenUrl, setBrokenUrl] = useState("");

  if (!validUrl(url) || brokenUrl === url) {
    return (
      <div
        className={`flex items-center justify-center bg-[#f4eef8] text-[#a692b0] ${className}`}
      >
        <ImageOff size={22} />
      </div>
    );
  }

  return (
    <img
      src={url}
      alt="Product preview"
      className={`object-cover ${className}`}
      onError={() => setBrokenUrl(url)}
    />
  );
}

function StatusCard({ title, subtitle, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl bg-[#f7f0fc] px-4 py-4">
      <div className="min-w-0">
        <p className="text-sm font-bold">{title}</p>
        <p className="mt-1 text-xs text-[#82748b]">{subtitle}</p>
      </div>
      <MiniSwitch checked={checked} onChange={onChange} />
    </div>
  );
}

function OptionGroup({ title, type, group, onToggle, onAdd, onRemove }) {
  const [draft, setDraft] = useState("");

  const addValues = () => {
    const values = draft
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    if (!values.length) return;

    if (onAdd(type, values)) {
      setDraft("");
    }
  };

  const colorDot = (label) => {
    const value = label.toLowerCase();

    if (/black|কালো/.test(value)) return "#222222";
    if (/gold|সোনালি/.test(value)) return "#e7bf27";
    if (/red|লাল/.test(value)) return "#e14755";
    if (/white|সাদা/.test(value)) return "#ffffff";
    if (/blue|নীল/.test(value)) return "#397ec4";
    if (/green|সবুজ/.test(value)) return "#42965a";
    if (/pink|গোলাপি/.test(value)) return "#ed91bf";

    return "#903eaa";
  };

  return (
    <div
      className={`rounded-xl p-4 ${
        group.enabled ? "bg-[#f7f0fc]" : "bg-[#f9f7fa] opacity-75"
      }`}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm font-bold">{title}</p>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-[#903eaa]">
            {group.enabled ? "সক্রিয়" : "বন্ধ"}
          </span>
          <MiniSwitch
            checked={group.enabled}
            onChange={(value) => onToggle(type, value)}
          />
        </div>
      </div>

      {group.enabled && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            {group.values.map((option) => (
              <span
                key={option.id}
                className={`inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-medium ${
                  isReservedOption(option.label)
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-[#e4d6e9] bg-[#eee2f4]"
                }`}
              >
                {type === "color" && (
                  <span
                    className="size-3 rounded-full border border-black/10"
                    style={{
                      backgroundColor: colorDot(option.label),
                    }}
                  />
                )}
                {option.label}
                <button
                  type="button"
                  onClick={() => onRemove(type, option.id)}
                  className="text-[#8f7796] hover:text-red-500"
                  aria-label={`Remove ${option.label}`}
                >
                  <X size={14} />
                </button>
              </span>
            ))}

            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === ",") {
                  event.preventDefault();
                  addValues();
                }
              }}
              placeholder="+ নতুন অপশন"
              className="min-w-[120px] max-w-56 flex-1 rounded-lg border border-[#e9dcec] bg-white px-3 py-2 text-sm outline-none focus:border-[#903eaa]"
            />

            <button
              type="button"
              onClick={addValues}
              className="flex size-9 items-center justify-center rounded-lg bg-[#903eaa] text-white"
              aria-label="Add option"
            >
              <Plus size={17} />
            </button>
          </div>

          <p className="mt-3 text-xs leading-5 text-[#82748b]">
            Default স্বয়ংক্রিয়ভাবে customer page-এ থাকবে। এখানে Default নামে
            option যোগ করবেন না।
          </p>
        </>
      )}
    </div>
  );
}

function VariantCard({ variant, onChange, coverImage, basePrice }) {
  return (
    <article
      className={`flex min-h-[286px] min-w-0 flex-col rounded-xl border p-3.5 transition sm:p-4 ${
        variant.available
          ? "border-[#ebdff0] bg-[#f7f0fc] hover:border-[#cfa9df]"
          : "border-[#eae5ed] bg-[#faf8fb] opacity-80"
      }`}
    >
      <div className="flex items-center gap-3">
        <Photo
          url={variant.imageUrl || coverImage}
          className="size-12 shrink-0 rounded-lg border border-[#eaddec]"
        />

        <div className="min-w-0 flex-1">
          <p
            className="truncate text-sm font-bold text-[#310039]"
            title={variant.title}
          >
            {variant.title}
          </p>
          <p
            className="mt-1 truncate font-mono text-xs text-[#8b7792]"
            title={variant.sku}
          >
            {variant.sku || "SKU required"}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <span className="hidden text-xs text-[#8a788f] 2xl:inline">
            উপলব্ধ
          </span>
          <MiniSwitch
            checked={variant.available}
            onChange={(value) => onChange({ available: value })}
          />
        </div>
      </div>

      <div className="mt-4 grid min-w-0 gap-2.5 sm:grid-cols-[minmax(0,1fr)_minmax(90px,0.5fr)]">
        <Field label="ভ্যারিয়েন্ট ছবির URL">
          <input
            type="url"
            value={variant.imageUrl}
            onChange={(event) => onChange({ imageUrl: event.target.value })}
            placeholder="https://example.com/photo.jpg"
            className={inputClass}
          />
        </Field>

        <Field label="মূল্য (৳)">
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={variant.price}
            onChange={(event) => onChange({ price: event.target.value })}
            placeholder={String(basePrice || 0)}
            className={inputClass}
          />
        </Field>
      </div>

      <div className="mt-3 min-w-0">
        <Field label="Unique Variant SKU">
          <div className="flex items-center gap-2">
            <input
              value={variant.sku}
              disabled={variant.autoSku}
              onChange={(event) => onChange({ sku: event.target.value })}
              placeholder="Enter unique SKU"
              className={`${inputClass} min-w-0 flex-1 disabled:bg-[#fbf8fd] disabled:text-[#8f7699]`}
            />

            <label
              className="flex shrink-0 cursor-pointer items-center gap-1 text-xs text-[#85758c]"
              title="Automatically generate SKU"
            >
              <input
                type="checkbox"
                checked={variant.autoSku}
                onChange={(event) =>
                  onChange({
                    autoSku: event.target.checked,
                    sku: event.target.checked ? "" : variant.sku,
                  })
                }
                className="checkbox checkbox-sm border-[#903eaa] checked:border-[#903eaa] checked:bg-[#903eaa]"
              />
              <span className="hidden 2xl:inline">Auto</span>
            </label>
          </div>
        </Field>
      </div>

      <p className="mt-auto pt-2 text-xs text-[#9c8aa0]">
        {variant.price === ""
          ? "বেস প্রাইস প্রযোজ্য"
          : "আলাদা ভ্যারিয়েন্ট মূল্য"}
      </p>
    </article>
  );
}

// ==========================================
// FORM EDITOR
// Mounted only after the edit data is loaded.
// ==========================================

function ProductEditor({ initialForm, productId }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = Boolean(productId);

  const [form, setForm] = useState(() => initialForm);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [variantQuery, setVariantQuery] = useState("");
  const [variantFilter, setVariantFilter] = useState("all");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const draggingId = useRef(null);
  const submittingRef = useRef(false);

  const taxonomyQuery = useQuery({
    queryKey: ["admin-product-taxonomies"],
    queryFn: fetchTaxonomies,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const categories = taxonomyQuery.data?.categories || [];
  const occasions = taxonomyQuery.data?.occasions || [];
  const taxonomiesLoading = taxonomyQuery.isPending;

  const reportError = (message) => {
    setError(message);
    void toast(message, "error");
  };

  const update = (key, value) => {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
    setError("");
    setSuccess("");
  };

  const chooseCustomerMode = (type) => {
    setForm((previous) => ({
      ...previous,
      customerFieldType: type,
      customizable: type !== "none",
    }));
  };

  const toggleCustomizable = (enabled) => {
    setForm((previous) => ({
      ...previous,
      customizable: enabled,
      customerFieldType: enabled
        ? previous.customerFieldType === "none"
          ? "frame"
          : previous.customerFieldType
        : "none",
    }));
  };

  // ========================================
  // PRODUCT PHOTOS
  // ========================================

  const addPhoto = () => {
    if (form.images.length >= MAX_IMAGES) return;

    const image = { id: uid(), url: "" };

    setForm((previous) => ({
      ...previous,
      images:
        previous.images.length >= MAX_IMAGES
          ? previous.images
          : [...previous.images, image],
    }));
  };

  const updatePhoto = (id, url) => {
    setForm((previous) => ({
      ...previous,
      images: previous.images.map((image) =>
        image.id === id ? { ...image, url } : image,
      ),
    }));
  };

  const removePhoto = (id) => {
    setForm((previous) => ({
      ...previous,
      images: previous.images.filter((image) => image.id !== id),
    }));

    if (selectedPhoto === id) setSelectedPhoto(null);
  };

  const reorderPhoto = (fromId, toId) => {
    if (!fromId || !toId || fromId === toId) return;

    setForm((previous) => {
      const images = [...previous.images];
      const from = images.findIndex((image) => image.id === fromId);
      const to = images.findIndex((image) => image.id === toId);

      if (from < 0 || to < 0) return previous;

      const [moved] = images.splice(from, 1);
      images.splice(to, 0, moved);

      return { ...previous, images };
    });
  };

  const movePhoto = (index, step) => {
    if (form.images[index + step]) {
      reorderPhoto(form.images[index].id, form.images[index + step].id);
    }
  };

  const gallery = form.images.filter((image) => validUrl(image.url));

  const mainPhoto =
    gallery.find((image) => image.id === selectedPhoto) || gallery[0];

  // ========================================
  // OPTIONS
  // ========================================

  const toggleOption = (type, enabled) => {
    setForm((previous) => ({
      ...previous,
      options: {
        ...previous.options,
        [type]: {
          ...previous.options[type],
          enabled,
        },
      },
    }));
  };

  const addOption = (type, labels) => {
    if (labels.some(isReservedOption)) {
      reportError(
        "Default নামে option যোগ করা যাবে না। এটি স্বয়ংক্রিয়ভাবে থাকবে।",
      );
      return false;
    }

    const existingLabels = new Set(
      form.options[type].values.map((option) => normalizeLabel(option.label)),
    );

    const additions = [];

    for (const label of labels) {
      const clean = label.trim();
      const normalized = normalizeLabel(clean);

      if (!clean || existingLabels.has(normalized)) continue;

      existingLabels.add(normalized);
      additions.push({ id: uid(), label: clean });
    }

    if (form.options[type].values.length + additions.length > 100) {
      reportError("প্রতি group-এ সর্বোচ্চ ১০০টি option রাখা যাবে।");
      return false;
    }

    setForm((previous) => {
      const currentLabels = new Set(
        previous.options[type].values.map((option) =>
          normalizeLabel(option.label),
        ),
      );

      return {
        ...previous,
        options: {
          ...previous.options,
          [type]: {
            ...previous.options[type],
            values: [
              ...previous.options[type].values,
              ...additions.filter(
                (option) => !currentLabels.has(normalizeLabel(option.label)),
              ),
            ],
          },
        },
      };
    });

    setError("");
    return true;
  };

  const removeOption = (type, id) => {
    setForm((previous) => ({
      ...previous,
      options: {
        ...previous.options,
        [type]: {
          ...previous.options[type],
          values: previous.options[type].values.filter(
            (option) => option.id !== id,
          ),
        },
      },
    }));
  };

  // ========================================
  // VARIANT COMBINATIONS
  // ========================================

  const generated = useMemo(
    () => generateCombinations(form.options, form.variantsEnabled),
    [form.options, form.variantsEnabled],
  );

  const combinationCount = generated.count;

  const variants = useMemo(
    () =>
      generated.rows.map((row) => {
        const saved = form.variantOverrides[row.combinationKey] || {};

        const key = saved.savedKey || row.combinationKey;
        const autoSku = saved.autoSku ?? true;

        return {
          ...row,
          key,
          autoSku,

          // Keep an existing SKU even if autoSku is true.
          // Only regenerate when explicitly cleared.
          sku:
            saved.sku ||
            (autoSku ? `${form.sku || "SKB-AUTO"}-${makeHash(key)}` : ""),

          imageUrl: String(saved.imageUrl || ""),
          price: saved.price == null ? "" : String(saved.price),
          available: saved.available !== false,
        };
      }),
    [generated.rows, form.variantOverrides, form.sku],
  );

  const updateVariant = (combinationKey, patch) => {
    setForm((previous) => ({
      ...previous,
      variantOverrides: {
        ...previous.variantOverrides,
        [combinationKey]: {
          ...(previous.variantOverrides[combinationKey] || {}),
          ...patch,
        },
      },
    }));
    setError("");
  };

  const filteredVariants = useMemo(
    () =>
      variants.filter((variant) => {
        if (variantFilter === "available" && !variant.available) {
          return false;
        }

        if (variantFilter === "unavailable" && variant.available) {
          return false;
        }

        return (
          !variantQuery.trim() ||
          `${variant.title} ${variant.sku}`
            .toLowerCase()
            .includes(variantQuery.trim().toLowerCase())
        );
      }),
    [variants, variantFilter, variantQuery],
  );

  // ========================================
  // PRICE PREVIEW
  // ========================================

  const regularPrice = Number(form.regularPrice) || 0;
  const salePrice = Number(form.salePrice) || 0;

  const basePrice =
    salePrice > 0 && salePrice < regularPrice ? salePrice : regularPrice;

  const prices = [
    basePrice,
    ...variants
      .filter((variant) => variant.available)
      .map((variant) =>
        variant.price === "" ? basePrice : Number(variant.price),
      ),
  ].filter((value) => Number.isFinite(value) && value > 0);

  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;

  const reservedExisting = OPTION_TYPES.some((type) =>
    form.options[type].values.some((option) => isReservedOption(option.label)),
  );

  // ========================================
  // SAVE
  // ========================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submittingRef.current) return;

    setError("");
    setSuccess("");

    if (taxonomyQuery.isPending || taxonomyQuery.isError) {
      return reportError("আগে ক্যাটাগরি ও উপলক্ষ লোড করুন।");
    }

    if (!form.name.trim()) {
      return reportError("প্রোডাক্টের নাম লিখুন।");
    }

    if (!form.autoSku && !form.sku.trim()) {
      return reportError("Product SKU লিখুন।");
    }

    if (
      !form.regularPrice ||
      !Number.isFinite(Number(form.regularPrice)) ||
      regularPrice <= 0
    ) {
      return reportError("সঠিক নিয়মিত মূল্য লিখুন।");
    }

    if (
      form.salePrice !== "" &&
      (!Number.isFinite(Number(form.salePrice)) ||
        salePrice <= 0 ||
        salePrice >= regularPrice)
    ) {
      return reportError("অফার মূল্য নিয়মিত মূল্যের চেয়ে কম হতে হবে।");
    }

    if (!form.categoryId) {
      return reportError("ক্যাটাগরি নির্বাচন করুন।");
    }

    if (!form.occasionIds.length) {
      return reportError("অন্তত একটি উপলক্ষ নির্বাচন করুন।");
    }

    const images = form.images.filter((image) => image.url.trim());

    if (
      !images.length ||
      images.length > MAX_IMAGES ||
      images.some((image) => !validUrl(image.url))
    ) {
      return reportError("১ থেকে ৫টি valid Product Photo প্রয়োজন।");
    }

    if (
      new Set(images.map((image) => image.url.trim())).size !== images.length
    ) {
      return reportError("একই Product Photo URL বারবার দেওয়া যাবে না।");
    }

    for (const type of OPTION_TYPES) {
      const group = form.options[type];

      if (group.values.length > 100) {
        return reportError(`${type}: সর্বোচ্চ ১০০টি option রাখা যাবে।`);
      }

      if (group.values.some((option) => isReservedOption(option.label))) {
        return reportError(
          `${type}: Default নামের option সরিয়ে দিন। Default স্বয়ংক্রিয়ভাবে থাকবে।`,
        );
      }

      const labels = group.values.map((option) => normalizeLabel(option.label));

      if (labels.some((label) => !label)) {
        return reportError(`${type}: খালি option রাখা যাবে না।`);
      }

      if (new Set(labels).size !== labels.length) {
        return reportError(`${type}: duplicate option রয়েছে।`);
      }

      const ids = group.values.map((option) => option.id);

      if (
        ids.some((id) => !/^[a-zA-Z0-9_-]+$/.test(id)) ||
        new Set(ids).size !== ids.length
      ) {
        return reportError(`${type}: option ID সঠিক নয়।`);
      }
    }

    if (combinationCount > MAX_VARIANTS) {
      return reportError(`সর্বোচ্চ ${MAX_VARIANTS}টি variant রাখা যাবে।`);
    }

    if (form.variantsEnabled && !variants.length) {
      return reportError("Variant চালু থাকলে Size, Color বা Type যোগ করুন।");
    }

    if (
      form.premiumBoxPrice === "" ||
      !Number.isFinite(Number(form.premiumBoxPrice)) ||
      Number(form.premiumBoxPrice) < 0
    ) {
      return reportError("Premium Box-এর মূল্য সঠিক নয়।");
    }

    // Random SKU generation happens only in this event.
    const masterSku = (form.sku.trim() || makeSku()).toUpperCase();

    const finalVariants = variants.map((variant) => {
      const metadata = form.variantOverrides[variant.combinationKey] || {};

      const sku = (
        metadata.sku ||
        (variant.autoSku
          ? `${masterSku}-${makeHash(variant.key)}`
          : variant.sku)
      )
        .trim()
        .toUpperCase();

      return {
        key: variant.key,
        title: variant.title,
        options: { ...variant.options },
        sku,
        autoSku: variant.autoSku,
        price: variant.price === "" ? basePrice : Number(variant.price),
        imageUrl: variant.imageUrl.trim(),
        available: variant.available,
      };
    });

    for (const variant of finalVariants) {
      if (!variant.sku) {
        return reportError(`${variant.title}: SKU প্রয়োজন।`);
      }

      if (
        !variant.key ||
        variant.key.length > 200 ||
        !/^[a-zA-Z0-9_:|-]+$/.test(variant.key)
      ) {
        return reportError(`${variant.title}: variant key সঠিক নয়।`);
      }

      if (!Number.isFinite(variant.price) || variant.price <= 0) {
        return reportError(`${variant.title}: মূল্য সঠিক নয়।`);
      }

      if (variant.imageUrl && !validUrl(variant.imageUrl)) {
        return reportError(`${variant.title}: Image URL সঠিক নয়।`);
      }

      if (
        isReservedOption(variant.title) ||
        Object.values(variant.options).some(isReservedOption)
      ) {
        return reportError("Default নামে variant save করা যাবে না।");
      }
    }

    const allSkus = [masterSku, ...finalVariants.map((variant) => variant.sku)];

    if (new Set(allSkus).size !== allSkus.length) {
      return reportError("Product ও Variant SKU আলাদা হতে হবে।");
    }

    if (
      new Set(finalVariants.map((variant) => variant.key)).size !==
      finalVariants.length
    ) {
      return reportError("Duplicate variant key পাওয়া গেছে।");
    }

    // Persist COMPLETE overrides, not only changed fields.
    const finalOverrides = Object.fromEntries(
      finalVariants.map((variant, index) => [
        variant.key,
        {
          sku: variant.sku,
          autoSku: variant.autoSku,
          imageUrl: variant.imageUrl,
          price: variants[index].price === "" ? "" : variant.price,
          available: variant.available,
        },
      ]),
    );

    const payload = {
      name: form.name.trim(),
      sku: masterSku,
      autoSku: form.autoSku === true,
      regularPrice,
      salePrice: form.salePrice === "" ? null : salePrice,
      description: form.description.trim(),
      categoryId: form.categoryId,
      occasionIds: [...form.occasionIds],
      images: images.map((image) => ({
        id: image.id,
        url: image.url.trim(),
      })),
      available: form.available === true,
      featured: form.featured === true,
      customizable: form.customizable === true,
      variantsEnabled: form.variantsEnabled === true,

      options: Object.fromEntries(
        OPTION_TYPES.map((type) => [
          type,
          {
            enabled: form.options[type].enabled === true,
            values: form.options[type].values.map((option) => ({
              id: option.id,
              label: option.label.trim(),
            })),
          },
        ]),
      ),

      variants: form.variantsEnabled ? finalVariants : [],
      variantOverrides: form.variantsEnabled ? finalOverrides : {},
      customerFieldType: form.customizable ? form.customerFieldType : "none",
      packaging: form.packaging === "premium" ? "premium" : "regular",
      premiumBoxPrice: Number(form.premiumBoxPrice),
    };

    submittingRef.current = true;
    setLoading(true);

    try {
      const token = await getToken();

      const endpoint = isEdit
        ? `${API_URL}/admin/products/${encodeURIComponent(productId)}`
        : `${API_URL}/admin/products`;

      const response = await fetch(endpoint, {
        method: isEdit ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || result.success !== true) {
        throw new Error(result.message || "প্রোডাক্ট সংরক্ষণ করা যায়নি।");
      }

      const message = isEdit
        ? "প্রোডাক্ট আপডেট হয়েছে!"
        : "প্রোডাক্ট যোগ হয়েছে!";

      setSuccess(message);
      void toast(message);

      // Cache refresh failure must not report a failed save.
      await Promise.allSettled(
        [
          ["adminProducts"],
          ["admin-product-edit"],
          ["products"],
          ["shopProducts"],
          ["featuredProducts"],
          ["product-details"],
          ["related-products"],
        ].map((queryKey) => queryClient.invalidateQueries({ queryKey })),
      );

      navigate("/admin/products", { replace: true });
    } catch (saveError) {
      reportError(saveError.message || "প্রোডাক্ট সংরক্ষণ করা যায়নি।");
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  };

  // ========================================
  // UI
  // ========================================

  return (
    <div className="min-h-screen text-[#310039]">
      <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs text-[#917b9a]">
            প্রোডাক্ট ক্যাটালগ /{" "}
            <span className="text-[#903eaa]">
              {isEdit ? "সম্পাদনা" : "নতুন এন্ট্রি"}
            </span>
          </p>

          <h1 className="mt-2 text-xl font-bold text-primary sm:text-2xl">
            {isEdit
              ? "প্রোডাক্ট সম্পাদনা (Edit Product)"
              : "নতুন প্রোডাক্ট যোগ করুন (Add Product)"}
          </h1>
        </div>
      </div>

      <form
        id="sokhbilash-product-form"
        onSubmit={handleSubmit}
        className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_350px]"
      >
        <fieldset disabled={loading} className="min-w-0 space-y-5 border-0 p-0">
          <Section
            title="প্রাথমিক তথ্য (Basic Details)"
            right={
              <span className="text-xs text-[#8b7890]">
                * চিহ্নিত ফিল্ডগুলো বাধ্যতামূলক
              </span>
            }
          >
            <Field label="প্রোডাক্টের নাম (Product Name)" required>
              <input
                value={form.name}
                onChange={(event) => update("name", event.target.value)}
                placeholder="বিবাহবার্ষিকী স্পেশাল কাস্টম কাঠের গিফট বক্স"
                className={`${inputClass} bg-[#f8f1fd]`}
              />
            </Field>

            <Field
              label="মাস্টার SKU (Master SKU)"
              required
              hint={
                !form.sku && form.autoSku
                  ? "Save করার সময় SKU স্বয়ংক্রিয়ভাবে তৈরি হবে।"
                  : ""
              }
            >
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  value={form.sku}
                  disabled={form.autoSku}
                  onChange={(event) => update("sku", event.target.value)}
                  placeholder="স্বয়ংক্রিয় SKU"
                  className={`${inputClass} flex-1 bg-[#f8f1fd] disabled:opacity-75`}
                />
                <button
                  type="button"
                  onClick={() => update("sku", makeSku())}
                  disabled={!form.autoSku}
                  className={softButton}
                >
                  <RefreshCw size={16} />
                  অটো-জেনারেট
                </button>
              </div>

              <label className="mt-2 inline-flex cursor-pointer items-center gap-2 text-xs text-[#81718b]">
                <input
                  type="checkbox"
                  checked={form.autoSku}
                  onChange={(event) => update("autoSku", event.target.checked)}
                  className="checkbox checkbox-sm border-[#903eaa] checked:border-[#903eaa] checked:bg-[#903eaa]"
                />
                স্বয়ংক্রিয় SKU ব্যবহার করুন
              </label>
            </Field>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-[#f7effc] p-3">
                <Field
                  label="মূল্য (Regular Price)"
                  required
                  hint="Default / মূল product-এর বিক্রয় মূল্য"
                >
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.regularPrice}
                    onChange={(event) =>
                      update("regularPrice", event.target.value)
                    }
                    placeholder="5800"
                    className={inputClass}
                  />
                </Field>
              </div>

              <div className="rounded-lg bg-[#f7effc] p-3">
                <Field
                  label="অফার মূল্য (Sale Price)"
                  hint="খালি রাখলে নিয়মিত মূল্য প্রযোজ্য হবে"
                >
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.salePrice}
                    onChange={(event) =>
                      update("salePrice", event.target.value)
                    }
                    placeholder="4950"
                    className={inputClass}
                  />
                </Field>
              </div>
            </div>

            <Field label="প্রোডাক্ট বিবরণ (Description)">
              <textarea
                rows={5}
                value={form.description}
                onChange={(event) => update("description", event.target.value)}
                placeholder="প্রোডাক্ট সম্পর্কে বিস্তারিত লিখুন..."
                className={`${inputClass} resize-y bg-[#f8f1fd]`}
              />
            </Field>
          </Section>

          <Section
            title="ছবি লিংক ইনপুট ও গ্যালারি (Product Photos)"
            right={
              <span className="rounded-lg bg-[#f4eafa] px-3 py-1.5 text-xs font-semibold text-[#903eaa]">
                সর্বোচ্চ ৫টি ছবি
              </span>
            }
          >
            <p className="text-sm leading-relaxed text-[#84778b]">
              ছবির URL পেস্ট করুন। ড্র্যাগ করে পজিশন পরিবর্তন করুন। প্রথম ছবিটি
              প্রধান ও Default ছবি হবে।
            </p>

            <div className="space-y-2">
              {form.images.map((image, index) => (
                <div
                  key={image.id}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();

                    if (!loading) {
                      reorderPhoto(
                        draggingId.current ||
                          event.dataTransfer.getData("text/plain"),
                        image.id,
                      );
                    }

                    draggingId.current = null;
                  }}
                  className="flex min-w-0 items-center gap-2 rounded-lg border border-[#ede3f2] bg-[#f7f0fc] p-2.5"
                >
                  <span
                    draggable={!loading}
                    onDragStart={(event) => {
                      draggingId.current = image.id;
                      event.dataTransfer.effectAllowed = "move";
                      event.dataTransfer.setData("text/plain", image.id);
                    }}
                    onDragEnd={() => {
                      draggingId.current = null;
                    }}
                    className="shrink-0 cursor-grab text-[#90789a] active:cursor-grabbing"
                  >
                    <GripVertical size={19} />
                  </span>

                  <span className="shrink-0 text-sm font-bold text-[#903eaa]">
                    {index + 1}.
                  </span>

                  <input
                    type="url"
                    value={image.url}
                    onChange={(event) =>
                      updatePhoto(image.id, event.target.value)
                    }
                    placeholder="ছবির URL পেস্ট করুন (https://...)"
                    className="min-w-0 flex-1 rounded-lg border border-[#eee5f2] bg-white px-3 py-2 text-sm outline-none focus:border-[#b66ac5]"
                  />

                  <button
                    type="button"
                    onClick={() => setSelectedPhoto(image.id)}
                    className="shrink-0"
                    aria-label="ছবির প্রিভিউ"
                  >
                    <Photo url={image.url} className="size-10 rounded-lg" />
                  </button>

                  {index === 0 && (
                    <span className="hidden shrink-0 rounded-lg bg-[#ffe16d] px-2 py-1 text-xs font-bold text-[#604100] xl:inline">
                      প্রধান ছবি
                    </span>
                  )}

                  <div className="hidden shrink-0 flex-col gap-1 sm:flex">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => movePhoto(index, -1)}
                      className="text-[#8c7793] disabled:opacity-25"
                      aria-label="ছবি উপরে নিন"
                    >
                      <ArrowUp size={15} />
                    </button>
                    <button
                      type="button"
                      disabled={index === form.images.length - 1}
                      onClick={() => movePhoto(index, 1)}
                      className="text-[#8c7793] disabled:opacity-25"
                      aria-label="ছবি নিচে নিন"
                    >
                      <ArrowDown size={15} />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => removePhoto(image.id)}
                    aria-label="Remove image"
                    className="text-[#903eaa] hover:text-red-500"
                  >
                    <X size={19} />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addPhoto}
              disabled={form.images.length >= MAX_IMAGES}
              className={softButton}
            >
              <Plus size={17} />
              আরেকটি ছবির লিংক যোগ করুন ({form.images.length}/{MAX_IMAGES})
            </button>
          </Section>

          <Section
            title="ভ্যারিয়েন্ট কনফিগারেশন (Variant Options)"
            right={
              <div className="flex items-center gap-3">
                <span className="text-xs text-[#89798f]">
                  ভ্যারিয়েন্ট সিস্টেম:
                </span>
                <MiniSwitch
                  checked={form.variantsEnabled}
                  onChange={(value) => update("variantsEnabled", value)}
                />
                <span className="text-xs font-bold text-[#903eaa]">
                  {form.variantsEnabled ? "চালু" : "বন্ধ"}
                </span>
              </div>
            }
          >
            {reservedExisting && (
              <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs leading-6 text-red-700">
                পুরোনো data-তে Default নামে option আছে। সংশ্লিষ্ট group থেকে
                সেটি সরিয়ে তারপর save করুন। এটি সরালে ওই option-এর variant-গুলোও
                বাদ যাবে।
              </p>
            )}

            {form.variantsEnabled ? (
              <>
                {[
                  ["size", "১. সাইজ অপশন (Size)"],
                  ["color", "২. কালার অপশন (Color)"],
                  ["type", "৩. ধরন / ডিজাইন টাইপ (Type) (ঐচ্ছিক)"],
                ].map(([type, title]) => (
                  <OptionGroup
                    key={type}
                    title={title}
                    type={type}
                    group={form.options[type]}
                    onToggle={toggleOption}
                    onAdd={addOption}
                    onRemove={removeOption}
                  />
                ))}

                <div className="border-t border-[#eee3f3] pt-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold text-[#903eaa]">
                        জেনারেটেড ভ্যারিয়েন্ট তালিকা
                      </h3>
                      <p className="mt-1 text-xs text-[#88788e]">
                        প্রতি ভ্যারিয়েন্টের ছবি, মূল্য, SKU ও availability
                        আলাদা।
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-lg bg-[#f7f0fc] px-3 py-2 text-xs font-semibold">
                        মোট {combinationCount}টি
                      </span>
                      <span className="rounded-lg bg-[#edf9f0] px-3 py-2 text-xs font-semibold text-[#237547]">
                        উপলব্ধ{" "}
                        {variants.filter((variant) => variant.available).length}
                        টি
                      </span>
                    </div>
                  </div>

                  {combinationCount > MAX_VARIANTS ? (
                    <p className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">
                      সর্বোচ্চ {MAX_VARIANTS}টি ভ্যারিয়েন্ট রাখা যাবে। অপশন
                      কমিয়ে দিন।
                    </p>
                  ) : variants.length === 0 ? (
                    <div className="mt-4 rounded-lg border border-dashed border-[#e5d7eb] bg-[#faf6fc] p-8 text-center text-sm text-[#85758d]">
                      Size, Color বা Type যোগ করলে ভ্যারিয়েন্ট তৈরি হবে।
                    </div>
                  ) : (
                    <>
                      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                        <div className="relative min-w-0 flex-1">
                          <Search
                            size={17}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9884a0]"
                          />
                          <input
                            value={variantQuery}
                            onChange={(event) =>
                              setVariantQuery(event.target.value)
                            }
                            placeholder="ভ্যারিয়েন্ট বা SKU সার্চ করুন..."
                            className={`${inputClass} pl-10`}
                          />
                        </div>

                        <select
                          value={variantFilter}
                          onChange={(event) =>
                            setVariantFilter(event.target.value)
                          }
                          className={`${inputClass} sm:w-44`}
                        >
                          <option value="all">সব ভ্যারিয়েন্ট</option>
                          <option value="available">উপলব্ধ</option>
                          <option value="unavailable">অনুপলব্ধ</option>
                        </select>
                      </div>

                      <div className="mt-3 flex items-center justify-between text-xs text-[#8d7994]">
                        <span>দেখানো হচ্ছে {filteredVariants.length}টি</span>
                        {filteredVariants.length > 6 && (
                          <span className="font-semibold text-[#903eaa]">
                            প্রথম ৬টির পর নিচে স্ক্রল করুন ↓
                          </span>
                        )}
                      </div>

                      <div
                        className={`mt-3 grid grid-cols-1 items-stretch gap-3 lg:grid-cols-2 xl:grid-cols-3 ${
                          filteredVariants.length > 6
                            ? "max-h-[605px] overflow-y-auto overscroll-contain pr-1 xl:max-h-[590px]"
                            : ""
                        }`}
                      >
                        {filteredVariants.map((variant) => (
                          <VariantCard
                            key={variant.combinationKey}
                            variant={variant}
                            coverImage={gallery[0]?.url}
                            basePrice={basePrice}
                            onChange={(patch) =>
                              updateVariant(variant.combinationKey, patch)
                            }
                          />
                        ))}
                      </div>

                      {filteredVariants.length === 0 && (
                        <p className="mt-3 rounded-lg bg-[#faf6fc] p-5 text-center text-sm text-[#82748b]">
                          কোনো ভ্যারিয়েন্ট পাওয়া যায়নি।
                        </p>
                      )}
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-[#e6d9ed] bg-[#fbf7fd] px-4 py-10 text-center">
                <Package size={32} className="mx-auto mb-3 text-[#a788b1]" />
                <p className="text-base font-bold">Single Product Mode</p>
                <p className="mt-2 text-sm text-[#82758b]">
                  আলাদা সাইজ, কালার বা ডিজাইন থাকলে Variant System চালু করুন।
                </p>
                {isEdit && (
                  <p className="mt-2 text-xs text-[#82758b]">
                    বন্ধ অবস্থায় save করলে product-এর variants সরানো হবে।
                  </p>
                )}
              </div>
            )}
          </Section>

          <Section
            title="গ্রাহক কাস্টমাইজেশন ফিল্ড মোড (Customer Customization Fields)"
            right={
              <span className="text-xs font-semibold text-[#903eaa]">
                অর্ডার ফর্ম কনফিগারেশন
              </span>
            }
          >
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                {
                  value: "none",
                  title: "ক. কোনো ফিল্ড নেই (No Field)",
                  text: "সাধারণ কেনাকাটা, কোনো অতিরিক্ত তথ্য লাগবে না।",
                },
                {
                  value: "frame",
                  title: "খ. ফ্রেম ফিল্ড (Frame Field)",
                  text: "ছবি আপলোড, নাম, DOB ও খোদাই বার্তা।",
                },
                {
                  value: "note",
                  title: "গ. কাস্টম নোট মোড",
                  text: "শুধু সাধারণ লিখিত বা উপহারের তথ্য।",
                },
              ].map((mode) => {
                const selected = form.customerFieldType === mode.value;

                return (
                  <label
                    key={mode.value}
                    className={`relative min-h-[130px] cursor-pointer rounded-xl border p-4 transition ${
                      selected
                        ? "border-[#903eaa] bg-[#f8edfd] shadow-[0_0_0_1px_#903eaa]"
                        : "border-[#ece1f2] bg-[#f7f0fc] hover:border-[#ceacd9]"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="customerFieldType"
                        checked={selected}
                        onChange={() => chooseCustomerMode(mode.value)}
                        className="radio radio-sm mt-0.5 shrink-0 border-[#903eaa] checked:border-[#903eaa] checked:bg-[#903eaa]"
                      />
                      <div>
                        <p className="text-sm font-bold leading-snug">
                          {mode.title}
                        </p>
                        <p className="mt-2 text-xs leading-relaxed text-[#82748b]">
                          {mode.text}
                        </p>
                      </div>
                    </div>

                    {selected && (
                      <span className="absolute bottom-3 right-3 rounded-full bg-[#903eaa] px-3 py-1 text-xs font-bold text-white">
                        সক্রিয়
                      </span>
                    )}
                  </label>
                );
              })}
            </div>

            <div className="flex items-start gap-2 rounded-lg bg-[#faf5fc] p-3 text-xs text-[#806f88]">
              <Info size={17} className="shrink-0" />
              <p>
                Frame Field বা Custom Note বেছে নিলেই Customizable Product নিজে
                থেকে চালু হবে। নিচের ফিল্ডগুলো শুধু গ্রাহক ফর্মের প্রিভিউ।
              </p>
            </div>

            {form.customerFieldType === "frame" && form.customizable && (
              <div className="rounded-xl border border-[#eadff0] bg-[#f7f0fc] p-4">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <h3 className="flex items-center gap-2 text-sm font-bold">
                    <ImageIcon size={18} className="text-[#903eaa]" />
                    ফ্রেম ফিল্ড সেটিংস (Frame Field Preview)
                  </h3>
                  <span className="text-xs text-[#903eaa]">লাইভ প্রিভিউ</span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg bg-white p-4">
                    <Field
                      label="৩. আপনার ছবি আপলোড করুন"
                      hint="সর্বোচ্চ ২০টি ছবি আপলোড করা যাবে"
                    >
                      <div className="flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-[#e4d3eb] bg-[#fbf8fd] p-5 text-center text-xs text-[#76258a]">
                        <UploadCloud size={25} />
                        <span>ছবি বেছে নিন (Max 20)</span>
                      </div>
                    </Field>
                  </div>

                  <div className="space-y-3 rounded-lg bg-white p-4">
                    <Field label="৪.১. নাম">
                      <input
                        disabled
                        placeholder="গ্রাহকের নাম..."
                        className={inputClass}
                      />
                    </Field>
                    <Field label="৪.২. জন্মতারিখ / বিবাহবার্ষিকী">
                      <input type="date" disabled className={inputClass} />
                    </Field>
                  </div>
                </div>

                <div className="mt-3 rounded-lg bg-white p-4">
                  <Field
                    label="৫. ফ্রেমের নিচের খোদাই বার্তা / উইশ"
                    hint="গ্রাহক তাঁর বিশেষ বার্তা এখানে লিখতে পারবেন।"
                  >
                    <textarea
                      rows={3}
                      disabled
                      placeholder="যেমন: ভালোবাসার স্মৃতি..."
                      className={`${inputClass} resize-y`}
                    />
                  </Field>
                </div>
              </div>
            )}

            {form.customerFieldType === "note" && form.customizable && (
              <div className="rounded-xl border border-[#eadff0] bg-[#f7f0fc] p-4">
                <Field
                  label="কাস্টম নোট (Customer Note Preview)"
                  hint="গ্রাহক অর্ডারের সময় বিশেষ নির্দেশনা লিখতে পারবেন।"
                >
                  <textarea
                    rows={4}
                    disabled
                    placeholder="গ্রাহকের বিশেষ নির্দেশনা..."
                    className={`${inputClass} resize-y`}
                  />
                </Field>
                <p className="mt-2 text-right text-xs text-[#8e7995]">0/500</p>
              </div>
            )}
          </Section>

          <Section
            title="ঐচ্ছিক গিফট বক্স প্যাকেজিং (Optional Gift Box)"
            right={
              <span className="text-xs text-[#897a90]">
                প্রতি আইটেমে বক্স নির্বাচন
              </span>
            }
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <label
                className={`flex cursor-pointer gap-3 rounded-xl border p-4 ${
                  form.packaging === "regular"
                    ? "border-[#c99dd8] bg-[#f7f0fc]"
                    : "border-[#eee3f2] bg-[#fbf8fd]"
                }`}
              >
                <input
                  type="radio"
                  name="packaging"
                  checked={form.packaging === "regular"}
                  onChange={() => update("packaging", "regular")}
                  className="radio radio-sm mt-0.5 border-[#903eaa] checked:border-[#903eaa] checked:bg-[#903eaa]"
                />

                <div>
                  <p className="text-sm font-bold">
                    রেগুলার বক্স (Regular Box)
                  </p>
                  <span className="mt-2 inline-block rounded-md bg-white px-2 py-1 text-xs font-semibold text-[#903eaa]">
                    ফ্রি / অন্তর্ভুক্ত
                  </span>
                  <p className="mt-2 text-xs text-[#82748b]">
                    স্ট্যান্ডার্ড শখবিলাস সুরক্ষিত ক্রাফট বক্স।
                  </p>
                </div>
              </label>

              <label
                className={`flex cursor-pointer gap-3 rounded-xl border p-4 ${
                  form.packaging === "premium"
                    ? "border-[#c99dd8] bg-[#f7f0fc]"
                    : "border-[#eee3f2] bg-[#fbf8fd]"
                }`}
              >
                <input
                  type="radio"
                  name="packaging"
                  checked={form.packaging === "premium"}
                  onChange={() => update("packaging", "premium")}
                  className="radio radio-sm mt-0.5 border-[#903eaa] checked:border-[#903eaa] checked:bg-[#903eaa]"
                />
                <div>
                  <p className="text-sm font-bold">
                    প্রিমিয়াম বক্স (Premium Box)
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-[#82748b]">
                      অতিরিক্ত মূল্য:
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.premiumBoxPrice}
                      onChange={(event) =>
                        update("premiumBoxPrice", event.target.value)
                      }
                      className="w-24 rounded-lg border border-[#e7dcec] bg-white px-3 py-2 text-sm outline-none focus:border-[#903eaa]"
                    />
                  </div>
                  <p className="mt-2 text-xs text-[#82748b]">
                    ভেলভেট লাইনিংসহ আকর্ষণীয় গিফট বক্স।
                  </p>
                </div>
              </label>
            </div>
          </Section>
        </fieldset>

        {/* RIGHT SIDEBAR */}

        <aside className="min-w-0 space-y-5 lg:sticky lg:top-20">
          <fieldset disabled={loading} className="min-w-0 border-0 p-0">
            <Section title="সংগঠন ও স্ট্যাটাস ফ্ল্যাগস">
              <StatusCard
                title="ক্রয়যোগ্য / উপলব্ধ"
                subtitle="Available for Purchase"
                checked={form.available}
                onChange={(value) => update("available", value)}
              />
              <StatusCard
                title="ফিচার্ড প্রোডাক্ট"
                subtitle="Featured Product"
                checked={form.featured}
                onChange={(value) => update("featured", value)}
              />
              <StatusCard
                title="কাস্টমাইজেশনযোগ্য"
                subtitle="Customizable Product"
                checked={form.customizable}
                onChange={toggleCustomizable}
              />

              <Field label="ক্যাটাগরি (Category)" required>
                <select
                  value={form.categoryId}
                  onChange={(event) => update("categoryId", event.target.value)}
                  disabled={taxonomiesLoading}
                  className={`${inputClass} bg-[#f7f0fc]`}
                >
                  <option value="">ক্যাটাগরি নির্বাচন করুন</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field
                label="উপলক্ষ (Occasions)"
                required
                hint="প্রয়োজন অনুযায়ী একাধিক উপলক্ষ নির্বাচন করুন।"
              >
                <div className="space-y-2 rounded-xl border border-[#e8ddec] bg-[#f7f0fc] p-3">
                  {taxonomiesLoading && (
                    <p className="text-xs text-[#82748b]">
                      উপলক্ষ লোড হচ্ছে...
                    </p>
                  )}

                  {occasions.map((occasion) => (
                    <label
                      key={occasion.id}
                      className="flex cursor-pointer items-center gap-3 rounded-lg bg-white px-3 py-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={form.occasionIds.includes(occasion.id)}
                        onChange={(event) => {
                          update(
                            "occasionIds",
                            event.target.checked
                              ? [...form.occasionIds, occasion.id]
                              : form.occasionIds.filter(
                                  (id) => id !== occasion.id,
                                ),
                          );
                        }}
                        className="checkbox checkbox-sm checkbox-secondary"
                      />
                      {occasion.imageUrl && (
                        <img
                          src={occasion.imageUrl}
                          alt=""
                          loading="lazy"
                          className="size-9 shrink-0 rounded-lg object-cover"
                        />
                      )}
                      <span>{occasion.name}</span>
                    </label>
                  ))}
                </div>
              </Field>

              {taxonomyQuery.isError && (
                <div className="rounded-lg bg-red-50 p-3 text-xs text-red-700">
                  <p>{taxonomyQuery.error.message}</p>
                  <button
                    type="button"
                    onClick={() => taxonomyQuery.refetch()}
                    className="mt-2 font-semibold underline"
                  >
                    আবার চেষ্টা করুন
                  </button>
                </div>
              )}
            </Section>
          </fieldset>

          <div className="overflow-hidden rounded-xl border border-[#ede4f1] bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-[#eee4f2] bg-[#faf6fc] px-4 py-4">
              <Star size={18} className="text-[#903eaa]" />
              <h3 className="text-base font-bold">স্টোরফ্রন্ট লাইভ প্রিভিউ</h3>
            </div>

            <div className="p-4">
              <div className="relative overflow-hidden rounded-lg border border-[#efe6f2]">
                {mainPhoto ? (
                  <Photo url={mainPhoto.url} className="aspect-square w-full" />
                ) : (
                  <div className="flex aspect-square flex-col items-center justify-center gap-3 bg-[#f7f0fc] text-[#a58caf]">
                    <ImageIcon size={48} />
                    <span className="text-sm">Product Image Preview</span>
                  </div>
                )}

                <div className="absolute left-3 top-3 flex flex-col items-start gap-2">
                  {form.featured && (
                    <span className="rounded-lg bg-[#ffe16d] px-3 py-1.5 text-xs font-bold">
                      ফিচার্ড
                    </span>
                  )}
                  {form.customizable && (
                    <span className="rounded-lg bg-[#903eaa] px-3 py-1.5 text-xs font-semibold text-white">
                      কাস্টমাইজড
                    </span>
                  )}
                </div>

                <span className="absolute bottom-3 right-3 rounded-lg bg-white/90 px-3 py-1.5 text-xs font-semibold">
                  {form.available ? "উপলব্ধ" : "অনুপলব্ধ"}
                </span>
              </div>

              {gallery.length > 1 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {gallery.map((image) => (
                    <button
                      key={image.id}
                      type="button"
                      onClick={() => setSelectedPhoto(image.id)}
                      className={`size-12 overflow-hidden rounded-lg border-2 ${
                        mainPhoto?.id === image.id
                          ? "border-[#903eaa]"
                          : "border-transparent"
                      }`}
                    >
                      <Photo url={image.url} className="size-full" />
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-4 space-y-3">
                <p className="text-xs text-[#8a7c8c]">
                  শখবিলাস Bespoke • বাংলাদেশ
                </p>

                <h3 className="text-base font-bold">
                  {form.name || "আপনার প্রোডাক্টের নাম এখানে দেখাবে"}
                </h3>

                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xl font-bold">
                    {minPrice === maxPrice
                      ? money(minPrice)
                      : `${money(minPrice)} – ${money(maxPrice)}`}
                  </p>

                  {!form.variantsEnabled &&
                    salePrice > 0 &&
                    salePrice < regularPrice && (
                      <span className="text-sm text-[#998d9c] line-through">
                        {money(regularPrice)}
                      </span>
                    )}
                </div>

                {form.variantsEnabled && (
                  <p className="text-sm text-[#85758c]">
                    {variants.length}টি ভ্যারিয়েন্ট · Default স্বয়ংক্রিয়
                  </p>
                )}

                {form.customizable && form.customerFieldType === "frame" && (
                  <p className="text-xs text-[#82758b]">
                    ✓ ফ্রেম ফিল্ড কাস্টমাইজেশন সক্রিয়
                  </p>
                )}

                {form.customizable && form.customerFieldType === "note" && (
                  <p className="text-xs text-[#82758b]">✓ কাস্টম নোট সক্রিয়</p>
                )}

                {Number(form.premiumBoxPrice) > 0 && (
                  <p className="text-xs text-[#82758b]">
                    ✓ প্রিমিয়াম বক্স: {money(form.premiumBoxPrice)}
                  </p>
                )}
              </div>

              <div className="mt-5 space-y-3 border-t border-[#f0e8f3] pt-5">
                <button
                  type="submit"
                  disabled={
                    loading || taxonomiesLoading || taxonomyQuery.isError
                  }
                  className={`${primaryButton} w-full py-3`}
                >
                  {loading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Save size={18} />
                  )}

                  {loading
                    ? "সংরক্ষণ হচ্ছে..."
                    : isEdit
                      ? "প্রোডাক্ট আপডেট করুন"
                      : "প্রোডাক্ট যোগ করুন"}
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => navigate("/admin/products")}
                  className={`${softButton} w-full`}
                >
                  বাতিল করে ফিরে যান
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-3 rounded-xl border border-[#eee4f2] bg-white p-4 text-sm leading-relaxed text-[#88788d]">
            <Info size={19} className="mt-0.5 shrink-0 text-[#903eaa]" />
            <p>
              প্রতিটি Variant-এর SKU আলাদা হতে হবে। Default আলাদা database
              variant নয়। Option সরালে সংশ্লিষ্ট variant-ও save-এর সময় বাদ যাবে।
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700"
            >
              {error}
            </div>
          )}

          {success && (
            <div
              role="status"
              className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm font-semibold text-green-700"
            >
              {success}
            </div>
          )}
        </aside>
      </form>
    </div>
  );
}

// ==========================================
// EDIT DATA LOADER
// ==========================================

function EditProductLoader({ productId }) {
  const navigate = useNavigate();

  const productQuery = useQuery({
    queryKey: ["admin-product-edit", productId],

    queryFn: async ({ signal }) => {
      const token = await getToken();

      const response = await fetch(
        `${API_URL}/admin/products/${encodeURIComponent(productId)}`,
        {
          signal,
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        },
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok || result.success !== true || !result.product) {
        throw new Error(result.message || "প্রোডাক্ট লোড করা যায়নি।");
      }

      return hydrateProduct(result.product);
    },

    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
  });

  if (productQuery.isPending) {
    return (
      <div className="flex min-h-[65vh] flex-col items-center justify-center gap-3">
        <Loader2 size={32} className="animate-spin text-secondary" />
        <p className="text-sm text-muted">প্রোডাক্টের তথ্য লোড হচ্ছে...</p>
      </div>
    );
  }

  if (productQuery.isError) {
    return (
      <div className="mx-auto max-w-xl rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm font-semibold text-red-700">
          {productQuery.error.message}
        </p>

        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => productQuery.refetch()}
            className={primaryButton}
          >
            আবার চেষ্টা করুন
          </button>

          <button
            type="button"
            onClick={() => navigate("/admin/products")}
            className={softButton}
          >
            প্রোডাক্ট তালিকায় ফিরে যান
          </button>
        </div>
      </div>
    );
  }

  return (
    <ProductEditor
      key={productId}
      productId={productId}
      initialForm={productQuery.data}
    />
  );
}

export default function AdminProductFormPage() {
  const params = useParams();
  const productId = params.productId || params.id;

  if (productId) {
    return <EditProductLoader key={productId} productId={productId} />;
  }

  return (
    <ProductEditor
      key="new-product"
      productId=""
      initialForm={emptyProduct()}
    />
  );
}
