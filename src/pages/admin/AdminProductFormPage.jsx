
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
import { getAuth } from "firebase/auth";

import {
  Gift,
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

// =====================================
// CONFIGURATION
// =====================================

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/$/, "");

const MAX_IMAGES = 5;
const MAX_VARIANTS = 100;

// =====================================
// STYLES
// =====================================

const inputClass =
  "w-full min-w-0 rounded-lg border border-[#e8ddec] bg-white px-3 py-2.5 text-sm text-[#310039] placeholder:text-[#a89aad] outline-none transition focus:border-[#903eaa] focus:ring-2 focus:ring-[#903eaa]/10";

const primaryButton =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-[#903eaa] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#76258a] disabled:cursor-not-allowed disabled:opacity-50";

const softButton =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-[#f2e8f7] px-3 py-2 text-sm font-semibold text-[#76258a] transition hover:bg-[#ead9f1] disabled:opacity-50";

// =====================================
// HELPERS
// =====================================

const uid = () =>
  globalThis.crypto?.randomUUID?.() ||
  `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const makeSku = () =>
  `SKB-${Date.now().toString(36).toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 7)
    .toUpperCase()}`;

const money = (value) =>
  `৳ ${Number(value || 0).toLocaleString("bn-BD")}`;

const validUrl = (url) => {
  try {
    return ["https:", "http:"].includes(
      new URL(String(url).trim()).protocol
    );
  } catch {
    return false;
  }
};

const makeHash = (text) => {
  let h = 2166136261;

  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }

  return (h >>> 0).toString(36).toUpperCase();
};

const createImage = (url = "") => ({
  id: uid(),
  url,
});

const createProduct = () => ({
  id: "",
  name: "",
  sku: makeSku(),
  autoSku: true,

  regularPrice: "",
  salePrice: "",
  description: "",
  categoryId: "",
  occasionIds: [],

  images: [createImage()],

  available: true,
  featured: false,
  customizable: false,
  variantsEnabled: false,

  options: {
    size: {
      enabled: true,
      values: [],
    },
    color: {
      enabled: true,
      values: [],
    },
    type: {
      enabled: false,
      values: [],
    },
  },

  variantOverrides: {},

  customerFieldType: "none",
  surpriseBox: false,

  packaging: "regular",
  premiumBoxPrice: "250",
});

// =====================================
// SECTION
// =====================================

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

      <div className="space-y-4 p-4 sm:p-5">
        {children}
      </div>
    </section>
  );
}

// =====================================
// FIELD
// =====================================

function Field({
  label,
  required = false,
  hint,
  children,
}) {
  return (
    <div className="min-w-0">
      <p className="mb-2 text-sm font-semibold text-[#310039]">
        {label}

        {required && (
          <span className="ml-1 text-red-500">*</span>
        )}
      </p>

      {children}

      {hint && (
        <p className="mt-1.5 text-xs leading-relaxed text-[#82748b]">
          {hint}
        </p>
      )}
    </div>
  );
}

// =====================================
// SWITCH
// =====================================

function MiniSwitch({
  checked,
  onChange,
  disabled = false,
}) {
  return (
    <label className="relative inline-flex shrink-0 cursor-pointer items-center">
      <input
        type="checkbox"
        checked={!!checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />

      <span className="h-6 w-11 rounded-full bg-[#ddd2e3] transition peer-checked:bg-[#903eaa] peer-focus-visible:ring-2 peer-focus-visible:ring-[#903eaa] peer-disabled:opacity-50" />

      <span className="absolute left-[3px] top-[3px] size-[18px] rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
    </label>
  );
}

// =====================================
// IMAGE PREVIEW
// =====================================

function Photo({ url, className = "" }) {
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    setBroken(false);
  }, [url]);

  if (!validUrl(url) || broken) {
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
      onError={() => setBroken(true)}
    />
  );
}

// =====================================
// STATUS CARD
// =====================================

function StatusCard({
  title,
  subtitle,
  checked,
  onChange,
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl bg-[#f7f0fc] px-4 py-4">
      <div className="min-w-0">
        <p className="text-sm font-bold">{title}</p>

        <p className="mt-1 text-xs text-[#82748b]">
          {subtitle}
        </p>
      </div>

      <MiniSwitch
        checked={checked}
        onChange={onChange}
      />
    </div>
  );
}

// =====================================
// VARIANT OPTION GROUP
// =====================================

function OptionGroup({
  title,
  type,
  group,
  onToggle,
  onAdd,
  onRemove,
}) {
  const [draft, setDraft] = useState("");

  const addValues = () => {
    draft
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .forEach((value) => onAdd(type, value));

    setDraft("");
  };

  const colorDot = (label) => {
    const v = label.toLowerCase();

    if (/black|কালো/.test(v)) return "#222222";
    if (/gold|সোনালি/.test(v)) return "#e7bf27";
    if (/red|লাল/.test(v)) return "#e14755";
    if (/white|সাদা/.test(v)) return "#ffffff";
    if (/blue|নীল/.test(v)) return "#397ec4";
    if (/green|সবুজ/.test(v)) return "#42965a";

    return "#903eaa";
  };

  return (
    <div
      className={`rounded-xl p-4 ${
        group.enabled
          ? "bg-[#f7f0fc]"
          : "bg-[#f9f7fa] opacity-75"
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
            onChange={(v) => onToggle(type, v)}
          />
        </div>
      </div>

      {group.enabled && (
        <div className="flex flex-wrap items-center gap-2">
          {group.values.map((option) => (
            <span
              key={option.id}
              className="inline-flex items-center gap-2 rounded-lg border border-[#e4d6e9] bg-[#eee2f4] px-2.5 py-1.5 text-xs font-medium"
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
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
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
      )}
    </div>
  );
}

// =====================================
// POLISHED VARIANT CARD
// =====================================

function VariantCard({
  variant,
  onChange,
  coverImage,
  basePrice,
}) {
  return (
    <article
      className={`flex min-h-[286px] min-w-0 flex-col rounded-xl border p-3.5 transition sm:p-4 ${
        variant.available
          ? "border-[#ebdff0] bg-[#f7f0fc] hover:border-[#cfa9df]"
          : "border-[#eae5ed] bg-[#faf8fb] opacity-80"
      }`}
    >
      {/* CARD HEADER */}

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
            onChange={(v) => onChange({ available: v })}
          />
        </div>
      </div>

      {/* IMAGE URL + PRICE */}

      <div className="mt-4 grid min-w-0 gap-2.5 sm:grid-cols-[minmax(0,1fr)_minmax(90px,0.5fr)]">
        <Field label="ভ্যারিয়েন্ট ছবির URL">
          <input
            type="url"
            value={variant.imageUrl}
            onChange={(e) =>
              onChange({
                imageUrl: e.target.value,
              })
            }
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
            onChange={(e) =>
              onChange({
                price: e.target.value,
              })
            }
            placeholder={String(basePrice || 0)}
            className={inputClass}
          />
        </Field>
      </div>

      {/* SKU */}

      <div className="mt-3 min-w-0">
        <Field label="Unique Variant SKU">
          <div className="flex items-center gap-2">
            <input
              value={variant.sku}
              disabled={variant.autoSku}
              onChange={(e) =>
                onChange({
                  sku: e.target.value,
                })
              }
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
                onChange={(e) =>
                  onChange({
                    autoSku: e.target.checked,
                    sku: e.target.checked ? "" : variant.sku,
                  })
                }
                className="checkbox checkbox-sm border-[#903eaa] checked:border-[#903eaa] checked:bg-[#903eaa]"
              />

              <span className="hidden 2xl:inline">
                Auto
              </span>
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

// =====================================
// MAIN PAGE
// =====================================

export default function AdminProductFormPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { productId } = useParams();

  const isEdit = Boolean(productId);

  const [form, setForm] = useState(createProduct);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  const [variantQuery, setVariantQuery] = useState("");
  const [variantFilter, setVariantFilter] = useState("all");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const [categories, setCategories] = useState([]);
  const [occasions, setOccasions] = useState([]);
  const [taxonomiesLoading, setTaxonomiesLoading] = useState(true);

  const [productLoading, setProductLoading] = useState(isEdit);
  const [productLoaded, setProductLoaded] = useState(!isEdit);

  const draggingId = useRef(null);

  // =====================================
  // LOAD CATEGORIES AND OCCASIONS
  // =====================================

  useEffect(() => {
    let ignore = false;

    const loadTaxonomies = async () => {
      setTaxonomiesLoading(true);

      try {
        const [categoryRes, occasionRes] = await Promise.all([
          fetch(`${API_URL}/categories`),
          fetch(`${API_URL}/occasions`),
        ]);

        const [categoryData, occasionData] = await Promise.all([
          categoryRes.json(),
          occasionRes.json(),
        ]);

        if (
          !categoryRes.ok ||
          !categoryData.success ||
          !occasionRes.ok ||
          !occasionData.success
        ) {
          throw new Error("ক্যাটাগরি ও উপলক্ষ লোড করা যায়নি।");
        }

        if (!ignore) {
          setCategories(categoryData.categories || []);
          setOccasions(occasionData.occasions || []);
        }
      } catch (err) {
        console.error("Load categories/occasions:", err);

        if (!ignore) {
          setError(
            err.message || "ক্যাটাগরি ও উপলক্ষ লোড করা যায়নি।"
          );
        }
      } finally {
        if (!ignore) {
          setTaxonomiesLoading(false);
        }
      }
    };

    loadTaxonomies();

    return () => {
      ignore = true;
    };
  }, []);

  // =====================================
  // LOAD EXISTING PRODUCT FROM MONGODB
  // =====================================

  useEffect(() => {
    let ignore = false;

    const loadProduct = async () => {
      setError("");
      setSuccess("");
      setSelectedPhoto(null);
      setVariantQuery("");
      setVariantFilter("all");

      // ADD MODE
      if (!productId) {
        setForm(createProduct());
        setProductLoading(false);
        setProductLoaded(true);
        return;
      }

      // EDIT MODE
      setProductLoading(true);
      setProductLoaded(false);

      try {
        const auth = getAuth(app);

        // Wait until Firebase restores logged-in user
        if (typeof auth.authStateReady === "function") {
          await auth.authStateReady();
        }

        const currentUser = auth.currentUser;

        if (!currentUser) {
          throw new Error("প্রোডাক্ট এডিট করতে লগইন করুন।");
        }

        const token = await currentUser.getIdToken();

        const response = await fetch(
          `${API_URL}/admin/products/${productId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
          }
        );

        const result = await response.json().catch(() => ({}));

        if (!response.ok || !result.success || !result.product) {
          throw new Error(
            result.message || "প্রোডাক্ট লোড করা যায়নি।"
          );
        }

        if (ignore) return;

        const existing = result.product;
        const defaults = createProduct();

        // RESTORE IMAGES
        const images = (
          Array.isArray(existing.images) ? existing.images : []
        )
          .map((image) => {
            if (typeof image === "string") {
              return createImage(image);
            }

            return {
              id: image?.id || uid(),
              url: image?.url || "",
            };
          })
          .slice(0, MAX_IMAGES);

        // RESTORE VARIANT OPTIONS
        const options = Object.fromEntries(
          Object.entries(defaults.options).map(
            ([type, defaultGroup]) => {
              const savedGroup = existing.options?.[type] || {};

              return [
                type,
                {
                  ...defaultGroup,
                  ...savedGroup,
                  values: Array.isArray(savedGroup.values)
                    ? savedGroup.values.map((value) => ({
                        id: value.id || uid(),
                        label: String(value.label || ""),
                      }))
                    : [],
                },
              ];
            }
          )
        );

        // RESTORE COMPLETE PRODUCT FORM
        setForm({
          ...defaults,
          ...existing,

          id: String(existing._id || existing.id || ""),

          name: existing.name || "",
          sku: existing.sku || "",
          autoSku: existing.autoSku === true,
          description: existing.description || "",

          regularPrice: String(existing.regularPrice ?? ""),

          salePrice:
            existing.salePrice == null
              ? ""
              : String(existing.salePrice),

          categoryId: existing.categoryId || "",

          occasionIds: Array.isArray(existing.occasionIds)
            ? existing.occasionIds
            : [],

          images: images.length ? images : [createImage()],

          available: existing.available === true,
          featured: existing.featured === true,
          customizable: existing.customizable === true,

          variantsEnabled: existing.variantsEnabled === true,

          options,

          variantOverrides:
            existing.variantOverrides &&
            typeof existing.variantOverrides === "object" &&
            !Array.isArray(existing.variantOverrides)
              ? existing.variantOverrides
              : {},

          customerFieldType:
            existing.customerFieldType || "none",

          surpriseBox: existing.surpriseBox === true,

          packaging:
            existing.packaging === "premium"
              ? "premium"
              : "regular",

          premiumBoxPrice: String(
            existing.premiumBoxPrice ?? 250
          ),
        });

        setProductLoaded(true);
      } catch (err) {
        console.error("Load Product Error:", err);

        if (!ignore) {
          setError(
            err.message || "প্রোডাক্ট লোড করা যায়নি।"
          );
          setProductLoaded(false);
        }
      } finally {
        if (!ignore) {
          setProductLoading(false);
        }
      }
    };

    loadProduct();

    return () => {
      ignore = true;
    };
  }, [productId]);

  // =====================================
  // FIELD UPDATES
  // =====================================

  const update = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));

    setError("");
    setSuccess("");
  };

  const updateMultiple = (patch) => {
    setForm((prev) => ({
      ...prev,
      ...patch,
    }));

    setError("");
    setSuccess("");
  };

  // =====================================
  // CUSTOMER MODE
  // =====================================

  const chooseCustomerMode = (type) => {
    updateMultiple({
      customerFieldType: type,
      customizable: type !== "none",
    });
  };

  const toggleCustomizable = (enabled) => {
    setForm((prev) => ({
      ...prev,
      customizable: enabled,

      customerFieldType: enabled
        ? prev.customerFieldType === "none"
          ? "frame"
          : prev.customerFieldType
        : "none",
    }));
  };

  // =====================================
  // PRODUCT IMAGE GALLERY
  // =====================================

  const addPhoto = () => {
    setForm((prev) =>
      prev.images.length >= MAX_IMAGES
        ? prev
        : {
            ...prev,
            images: [...prev.images, createImage()],
          }
    );
  };

  const updatePhoto = (id, url) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.map((image) =>
        image.id === id
          ? { ...image, url }
          : image
      ),
    }));
  };

  const removePhoto = (id) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter(
        (image) => image.id !== id
      ),
    }));

    if (selectedPhoto === id) {
      setSelectedPhoto(null);
    }
  };

  const reorderPhoto = (fromId, toId) => {
    if (!fromId || !toId || fromId === toId) return;

    setForm((prev) => {
      const images = [...prev.images];

      const from = images.findIndex(
        (x) => x.id === fromId
      );

      const to = images.findIndex(
        (x) => x.id === toId
      );

      if (from < 0 || to < 0) return prev;

      const [moved] = images.splice(from, 1);
      images.splice(to, 0, moved);

      return {
        ...prev,
        images,
      };
    });
  };

  const movePhoto = (index, step) => {
    if (form.images[index + step]) {
      reorderPhoto(
        form.images[index].id,
        form.images[index + step].id
      );
    }
  };

  const gallery = form.images.filter(
    (image) => validUrl(image.url)
  );

  const mainPhoto =
    gallery.find(
      (image) => image.id === selectedPhoto
    ) || gallery[0];

  // =====================================
  // VARIANT OPTIONS
  // =====================================

  const toggleOption = (type, enabled) => {
    setForm((prev) => ({
      ...prev,
      options: {
        ...prev.options,
        [type]: {
          ...prev.options[type],
          enabled,
        },
      },
    }));
  };

  const addOption = (type, label) => {
    const value = label.trim();

    if (!value) return;

    setForm((prev) => {
      const group = prev.options[type];

      const exists = group.values.some(
        (x) =>
          x.label.toLowerCase() ===
          value.toLowerCase()
      );

      if (exists) return prev;

      return {
        ...prev,
        options: {
          ...prev.options,
          [type]: {
            ...group,
            values: [
              ...group.values,
              {
                id: uid(),
                label: value,
              },
            ],
          },
        },
      };
    });
  };

  const removeOption = (type, id) => {
    setForm((prev) => ({
      ...prev,
      options: {
        ...prev.options,
        [type]: {
          ...prev.options[type],
          values: prev.options[type].values.filter(
            (x) => x.id !== id
          ),
        },
      },
    }));
  };

  // =====================================
  // GENERATE VARIANT COMBINATIONS
  // =====================================

  const activeGroups = useMemo(
    () =>
      Object.entries(form.options).filter(
        ([, group]) =>
          group.enabled && group.values.length
      ),
    [form.options]
  );

  const combinationCount =
    !form.variantsEnabled || !activeGroups.length
      ? 0
      : activeGroups.reduce(
          (n, [, group]) =>
            n * group.values.length,
          1
        );

  const combinations = useMemo(() => {
    if (
      !form.variantsEnabled ||
      combinationCount === 0 ||
      combinationCount > MAX_VARIANTS
    ) {
      return [];
    }

    let rows = [{ parts: [] }];

    for (const [type, group] of activeGroups) {
      rows = rows.flatMap((row) =>
        group.values.map((v) => ({
          parts: [
            ...row.parts,
            {
              type,
              id: v.id,
              label: v.label,
            },
          ],
        }))
      );
    }

    return rows.map((row) => ({
      ...row,

      key: row.parts
        .map((part) => `${part.type}:${part.id}`)
        .join("|"),

      title: row.parts
        .map((part) => part.label)
        .join(" / "),
    }));
  }, [
    activeGroups,
    combinationCount,
    form.variantsEnabled,
  ]);

  const variants = useMemo(
    () =>
      combinations.map((row) => {
        const patch =
          form.variantOverrides[row.key] || {};

        const autoSku = patch.autoSku ?? true;

        return {
          ...row,
          autoSku,

          sku: autoSku
            ? `${form.sku || "SKB"}-${makeHash(row.key)}`
            : patch.sku || "",

          imageUrl: patch.imageUrl || "",
          price: patch.price ?? "",
          available: patch.available ?? true,
        };
      }),
    [
      combinations,
      form.variantOverrides,
      form.sku,
    ]
  );

  const updateVariant = (key, patch) => {
    setForm((prev) => ({
      ...prev,

      variantOverrides: {
        ...prev.variantOverrides,

        [key]: {
          ...(prev.variantOverrides[key] || {}),
          ...patch,
        },
      },
    }));
  };

  // =====================================
  // SEARCH / FILTER VARIANTS
  // =====================================

  const filteredVariants = useMemo(
    () =>
      variants.filter((v) => {
        if (
          variantFilter === "available" &&
          !v.available
        ) {
          return false;
        }

        if (
          variantFilter === "unavailable" &&
          v.available
        ) {
          return false;
        }

        return (
          !variantQuery.trim() ||
          `${v.title} ${v.sku}`
            .toLowerCase()
            .includes(
              variantQuery.toLowerCase().trim()
            )
        );
      }),
    [
      variants,
      variantFilter,
      variantQuery,
    ]
  );

  // =====================================
  // PRICE PREVIEW
  // =====================================

  const regularPrice =
    Number(form.regularPrice) || 0;

  const salePrice =
    Number(form.salePrice) || 0;

  const basePrice =
    salePrice > 0
      ? salePrice
      : regularPrice;

  const purchasableVariants = variants.filter(
    (v) => v.available
  );

  const prices = purchasableVariants.map(
    (v) =>
      v.price === ""
        ? basePrice
        : Number(v.price)
  );

  const minPrice = form.variantsEnabled
    ? prices.length
      ? Math.min(...prices)
      : 0
    : basePrice;

  const maxPrice = form.variantsEnabled
    ? prices.length
      ? Math.max(...prices)
      : 0
    : basePrice;

  // =====================================
  // CUSTOMER FIELD CONFIGURATION
  // =====================================

  const getCustomerFields = () => {
    if (!form.customizable) return [];

    if (form.customerFieldType === "frame") {
      return [
        {
          key: "photos",
          label: "আপনার ছবি আপলোড করুন",
          type: "file",
          maxFiles: 20,
        },
        {
          key: "name",
          label: "নাম",
          type: "text",
        },
        {
          key: "dob",
          label: "জন্মতারিখ / বিবাহবার্ষিকী",
          type: "date",
        },
        {
          key: "engraving",
          label: "ফ্রেমের নিচের খোদাই বার্তা / উইশ",
          type: "textarea",
        },
      ];
    }

    if (form.customerFieldType === "note") {
      return [
        {
          key: "customNote",
          label: "বিশেষ নির্দেশনা",
          type: "textarea",
        },
      ];
    }

    return [];
  };

  // =====================================
  // PUBLISH / UPDATE PRODUCT
  // =====================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const fail = (message) => {
      setError(message);

      Swal.fire({
        title: message,
        icon: "error",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true,
      });
    };

    // PREVENT UPDATE BEFORE PRODUCT LOAD
    if (isEdit && !productLoaded) {
      return fail("প্রোডাক্টের তথ্য এখনো লোড হয়নি।");
    }

    // BASIC VALIDATION
    if (!form.name.trim()) {
      return fail("প্রোডাক্টের নাম লিখুন।");
    }

    if (!form.sku.trim()) {
      return fail("প্রোডাক্ট SKU প্রয়োজন।");
    }

    if (
      !form.regularPrice ||
      !Number.isFinite(regularPrice) ||
      regularPrice <= 0
    ) {
      return fail("সঠিক নিয়মিত মূল্য লিখুন।");
    }

    if (
      form.salePrice !== "" &&
      (!Number.isFinite(Number(form.salePrice)) ||
        salePrice <= 0 ||
        salePrice >= regularPrice)
    ) {
      return fail(
        "অফার মূল্য নিয়মিত মূল্যের চেয়ে কম হতে হবে।"
      );
    }

    if (!form.categoryId) {
      return fail("ক্যাটাগরি নির্বাচন করুন।");
    }

    if (!form.occasionIds.length) {
      return fail("অন্তত একটি উপলক্ষ নির্বাচন করুন।");
    }

    // IMAGE VALIDATION
    const images = form.images.filter(
      (image) => image.url.trim()
    );

    if (
      !images.length ||
      images.some((image) => !validUrl(image.url))
    ) {
      return fail(
        "অন্তত একটি সঠিক Image URL প্রয়োজন।"
      );
    }

    if (
      new Set(
        images.map((i) => i.url.trim())
      ).size !== images.length
    ) {
      return fail(
        "একই Image URL একাধিকবার দেওয়া যাবে না।"
      );
    }

    // VARIANT VALIDATION
    if (combinationCount > MAX_VARIANTS) {
      return fail(
        `সর্বোচ্চ ${MAX_VARIANTS}টি variant রাখা যাবে।`
      );
    }

    if (
      form.variantsEnabled &&
      !variants.length
    ) {
      return fail(
        "Variant চালু থাকলে অন্তত একটি Size, Color বা Type যোগ করুন।"
      );
    }

    for (const v of variants) {
      if (!v.sku.trim()) {
        return fail(
          `${v.title}: SKU প্রয়োজন।`
        );
      }

      if (
        v.imageUrl.trim() &&
        !validUrl(v.imageUrl)
      ) {
        return fail(
          `${v.title}: Image URL সঠিক নয়।`
        );
      }

      if (
        v.price !== "" &&
        (!Number.isFinite(Number(v.price)) ||
          Number(v.price) <= 0)
      ) {
        return fail(
          `${v.title}: মূল্য সঠিক নয়।`
        );
      }
    }

    const allSkus = [
      form.sku,
      ...variants.map((v) => v.sku),
    ].map((s) => s.trim().toUpperCase());

    if (
      new Set(allSkus).size !== allSkus.length
    ) {
      return fail(
        "Product ও Variant SKU আলাদা হতে হবে।"
      );
    }

    // PACKAGING VALIDATION
    if (
      !Number.isFinite(Number(form.premiumBoxPrice)) ||
      Number(form.premiumBoxPrice) < 0 ||
      form.premiumBoxPrice === ""
    ) {
      return fail(
        "Premium Box-এর মূল্য সঠিক নয়।"
      );
    }

    const now = new Date().toISOString();

    // =====================================
    // COMPLETE PRODUCT OBJECT
    // =====================================

    const payload = {
      ...form,

      id: form.id || productId || uid(),
      name: form.name.trim(),
      sku: form.sku.trim(),

      regularPrice,

      salePrice:
        form.salePrice === ""
          ? null
          : salePrice,

      images: images.map((i) => ({
        id: i.id,
        url: i.url.trim(),
      })),

      variants: variants.map((v) => ({
        key: v.key,
        title: v.title,

        options: Object.fromEntries(
          v.parts.map((p) => [
            p.type,
            p.label,
          ])
        ),

        sku: v.sku.trim(),
        autoSku: v.autoSku,

        price:
          v.price === ""
            ? basePrice
            : Number(v.price),

        imageUrl: v.imageUrl.trim(),
        available: v.available,
      })),

      customerFields: getCustomerFields(),

      premiumBoxPrice: Number(
        form.premiumBoxPrice
      ),

      status: "published",
      createdAt: form.createdAt || now,
      updatedAt: now,
    };

    setLoading(true);

    try {
      const auth = getAuth(app);

      if (typeof auth.authStateReady === "function") {
        await auth.authStateReady();
      }

      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error("প্রোডাক্ট সংরক্ষণ করতে লগইন করুন।");
      }

      const token = await currentUser.getIdToken();

      // ADD = POST, EDIT = PATCH
      const response = await fetch(
        isEdit
          ? `${API_URL}/admin/products/${productId}`
          : `${API_URL}/admin/products`,
        {
          method: isEdit ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response
        .json()
        .catch(() => ({}));

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "প্রোডাক্ট সংরক্ষণ করা যায়নি।"
        );
      }

      setSuccess(
        isEdit
          ? "প্রোডাক্ট আপডেট হয়েছে!"
          : "প্রোডাক্ট যোগ হয়েছে!"
      );

      Swal.fire({
        title: isEdit
          ? "প্রোডাক্ট আপডেট হয়েছে!"
          : "প্রোডাক্ট যোগ হয়েছে!",
        icon: "success",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });

      // REFRESH PRODUCT LIST CACHE
      await queryClient.invalidateQueries({
        queryKey: ["adminProducts"],
      });

      navigate("/admin/products", {
        replace: true,
      });
    } catch (err) {
      const message =
        err.message || "প্রোডাক্ট সংরক্ষণ করা যায়নি।";

      setError(message);

      Swal.fire({
        title: message,
        icon: "error",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // =====================================
  // PRODUCT LOADING / ERROR
  // =====================================

  if (isEdit && productLoading) {
    return (
      <div className="flex min-h-[65vh] flex-col items-center justify-center gap-3">
        <Loader2
          size={32}
          className="animate-spin text-secondary"
        />

        <p className="text-sm text-muted">
          প্রোডাক্টের তথ্য লোড হচ্ছে...
        </p>
      </div>
    );
  }

  if (isEdit && !productLoaded) {
    return (
      <div className="mx-auto max-w-xl rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm font-semibold text-red-700">
          {error || "প্রোডাক্ট লোড করা যায়নি।"}
        </p>

        <button
          type="button"
          onClick={() => navigate("/admin/products")}
          className="mt-4 rounded-lg bg-secondary px-4 py-2.5 text-sm font-semibold text-white"
        >
          প্রোডাক্ট তালিকায় ফিরে যান
        </button>
      </div>
    );
  }

  // =====================================
  // JSX - ORIGINAL DESIGN
  // =====================================

  return (
    <div className="min-h-screen text-[#310039]">

      {/* PAGE HEADING */}

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
        {/* LEFT COLUMN */}

        <div className="min-w-0 space-y-5">

          {/* BASIC DETAILS */}

          <Section
            title="প্রাথমিক তথ্য (Basic Details)"
            right={
              <span className="text-xs text-[#8b7890]">
                * চিহ্নিত ফিল্ডগুলো বাধ্যতামূলক
              </span>
            }
          >
            <Field
              label="প্রোডাক্টের নাম (Product Name)"
              required
            >
              <input
                value={form.name}
                onChange={(e) =>
                  update("name", e.target.value)
                }
                placeholder="বিবাহবার্ষিকী স্পেশাল কাস্টম কাঠের গিফট বক্স"
                className={`${inputClass} bg-[#f8f1fd]`}
              />
            </Field>

            <Field
              label="মাস্টার SKU (Master SKU)"
              required
            >
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  value={form.sku}
                  disabled={form.autoSku}
                  onChange={(e) =>
                    update("sku", e.target.value)
                  }
                  placeholder="SKB-BOX-2026"
                  className={`${inputClass} flex-1 bg-[#f8f1fd] disabled:opacity-75`}
                />

                <button
                  type="button"
                  onClick={() =>
                    update("sku", makeSku())
                  }
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
                  onChange={(e) =>
                    update(
                      "autoSku",
                      e.target.checked
                    )
                  }
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
                  hint="ভ্যারিয়েন্ট ছাড়া সাধারণ বিক্রয় মূল্য"
                >
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.regularPrice}
                    onChange={(e) =>
                      update(
                        "regularPrice",
                        e.target.value
                      )
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
                    onChange={(e) =>
                      update(
                        "salePrice",
                        e.target.value
                      )
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
                onChange={(e) =>
                  update(
                    "description",
                    e.target.value
                  )
                }
                placeholder="প্রোডাক্ট সম্পর্কে বিস্তারিত লিখুন..."
                className={`${inputClass} resize-y bg-[#f8f1fd]`}
              />
            </Field>
          </Section>

          {/* PRODUCT PHOTO GALLERY */}

          <Section
            title="ছবি লিংক ইনপুট ও গ্যালারি (Product Photos)"
            right={
              <span className="rounded-lg bg-[#f4eafa] px-3 py-1.5 text-xs font-semibold text-[#903eaa]">
                সর্বোচ্চ ৫টি ছবি
              </span>
            }
          >
            <p className="text-sm leading-relaxed text-[#84778b]">
              ছবির URL পেস্ট করুন। ড্র্যাগ করে পজিশন
              পরিবর্তন করুন। প্রথম ছবিটি প্রধান ছবি হবে।
            </p>

            <div className="space-y-2">
              {form.images.map((image, index) => (
                <div
                  key={image.id}
                  onDragOver={(e) =>
                    e.preventDefault()
                  }
                  onDrop={(e) => {
                    e.preventDefault();

                    reorderPhoto(
                      draggingId.current,
                      image.id
                    );

                    draggingId.current = null;
                  }}
                  className="flex min-w-0 items-center gap-2 rounded-lg border border-[#ede3f2] bg-[#f7f0fc] p-2.5"
                >
                  <span
                    draggable
                    onDragStart={(e) => {
                      draggingId.current = image.id;

                      e.dataTransfer.effectAllowed =
                        "move";

                      e.dataTransfer.setData(
                        "text/plain",
                        image.id
                      );
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
                    onChange={(e) =>
                      updatePhoto(
                        image.id,
                        e.target.value
                      )
                    }
                    placeholder="ছবির URL পেস্ট করুন (https://...)"
                    className="min-w-0 flex-1 rounded-lg border border-[#eee5f2] bg-white px-3 py-2 text-sm outline-none focus:border-[#b66ac5]"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setSelectedPhoto(image.id)
                    }
                    className="shrink-0"
                  >
                    <Photo
                      url={image.url}
                      className="size-10 rounded-lg"
                    />
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
                      onClick={() =>
                        movePhoto(index, -1)
                      }
                      className="text-[#8c7793] disabled:opacity-25"
                    >
                      <ArrowUp size={15} />
                    </button>

                    <button
                      type="button"
                      disabled={
                        index ===
                        form.images.length - 1
                      }
                      onClick={() =>
                        movePhoto(index, 1)
                      }
                      className="text-[#8c7793] disabled:opacity-25"
                    >
                      <ArrowDown size={15} />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      removePhoto(image.id)
                    }
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
              disabled={
                form.images.length >= MAX_IMAGES
              }
              className={softButton}
            >
              <Plus size={17} />
              আরেকটি ছবির লিংক যোগ করুন
              ({form.images.length}/{MAX_IMAGES})
            </button>
          </Section>

          {/* VARIANT CONFIGURATION */}

          <Section
            title="ভ্যারিয়েন্ট কনফিগারেশন (Variant Options)"
            right={
              <div className="flex items-center gap-3">
                <span className="text-xs text-[#89798f]">
                  ভ্যারিয়েন্ট সিস্টেম:
                </span>

                <MiniSwitch
                  checked={form.variantsEnabled}
                  onChange={(v) =>
                    update("variantsEnabled", v)
                  }
                />

                <span className="text-xs font-bold text-[#903eaa]">
                  {form.variantsEnabled
                    ? "চালু"
                    : "বন্ধ"}
                </span>
              </div>
            }
          >
            {form.variantsEnabled ? (
              <>
                <OptionGroup
                  title="১. সাইজ অপশন (Size)"
                  type="size"
                  group={form.options.size}
                  onToggle={toggleOption}
                  onAdd={addOption}
                  onRemove={removeOption}
                />

                <OptionGroup
                  title="২. কালার অপশন (Color)"
                  type="color"
                  group={form.options.color}
                  onToggle={toggleOption}
                  onAdd={addOption}
                  onRemove={removeOption}
                />

                <OptionGroup
                  title="৩. ধরন / ডিজাইন টাইপ (Type) (ঐচ্ছিক)"
                  type="type"
                  group={form.options.type}
                  onToggle={toggleOption}
                  onAdd={addOption}
                  onRemove={removeOption}
                />

                {/* GENERATED VARIANT LIST */}

                <div className="border-t border-[#eee3f3] pt-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold text-[#903eaa]">
                        জেনারেটেড ভ্যারিয়েন্ট তালিকা
                        (Generated Variant List)
                      </h3>

                      <p className="mt-1 text-xs text-[#88788e]">
                        প্রতি ভ্যারিয়েন্টের ছবি, মূল্য,
                        SKU ও availability আলাদা।
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-lg bg-[#f7f0fc] px-3 py-2 text-xs font-semibold">
                        মোট {combinationCount}টি
                      </span>

                      <span className="rounded-lg bg-[#edf9f0] px-3 py-2 text-xs font-semibold text-[#237547]">
                        উপলব্ধ{" "}
                        {
                          variants.filter(
                            (v) => v.available
                          ).length
                        }
                        টি
                      </span>
                    </div>
                  </div>

                  {combinationCount > MAX_VARIANTS ? (
                    <p className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">
                      সর্বোচ্চ {MAX_VARIANTS}টি ভ্যারিয়েন্ট
                      রাখা যাবে। অপশন কমিয়ে দিন।
                    </p>
                  ) : variants.length === 0 ? (
                    <div className="mt-4 rounded-lg border border-dashed border-[#e5d7eb] bg-[#faf6fc] p-8 text-center text-sm text-[#85758d]">
                      Size, Color বা Type যোগ করলে
                      ভ্যারিয়েন্ট তৈরি হবে।
                    </div>
                  ) : (
                    <>
                      {/* SEARCH AND FILTER */}

                      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                        <div className="relative min-w-0 flex-1">
                          <Search
                            size={17}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9884a0]"
                          />

                          <input
                            value={variantQuery}
                            onChange={(e) =>
                              setVariantQuery(
                                e.target.value
                              )
                            }
                            placeholder="ভ্যারিয়েন্ট বা SKU সার্চ করুন..."
                            className={`${inputClass} pl-10`}
                          />
                        </div>

                        <select
                          value={variantFilter}
                          onChange={(e) =>
                            setVariantFilter(
                              e.target.value
                            )
                          }
                          className={`${inputClass} sm:w-44`}
                        >
                          <option value="all">
                            সব ভ্যারিয়েন্ট
                          </option>

                          <option value="available">
                            উপলব্ধ
                          </option>

                          <option value="unavailable">
                            অনুপলব্ধ
                          </option>
                        </select>
                      </div>

                      <div className="mt-3 flex items-center justify-between text-xs text-[#8d7994]">
                        <span>
                          দেখানো হচ্ছে{" "}
                          {filteredVariants.length}টি
                        </span>

                        {filteredVariants.length > 6 && (
                          <span className="font-semibold text-[#903eaa]">
                            প্রথম ৬টির পর নিচে স্ক্রল করুন ↓
                          </span>
                        )}
                      </div>

                      {/* SCROLLABLE VARIANT GRID */}

                      <div
                        className={`mt-3 grid grid-cols-1 items-stretch gap-3 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 ${
                          filteredVariants.length > 6
                            ? "max-h-[605px] overflow-y-auto overscroll-contain pr-1 xl:max-h-[590px]"
                            : ""
                        }`}
                      >
                        {filteredVariants.map(
                          (variant) => (
                            <VariantCard
                              key={variant.key}
                              variant={variant}
                              coverImage={
                                gallery[0]?.url
                              }
                              basePrice={basePrice}
                              onChange={(patch) =>
                                updateVariant(
                                  variant.key,
                                  patch
                                )
                              }
                            />
                          )
                        )}
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
                <Package
                  size={32}
                  className="mx-auto mb-3 text-[#a788b1]"
                />

                <p className="text-base font-bold">
                  Single Product Mode
                </p>

                <p className="mt-2 text-sm text-[#82758b]">
                  আলাদা সাইজ, কালার বা ডিজাইন থাকলে
                  Variant System চালু করুন।
                </p>
              </div>
            )}
          </Section>

          {/* CUSTOMER CUSTOMIZATION */}

          <Section
            title="গ্রাহক কাস্টমাইজেশন ফিল্ড মোড (Customer Customization Fields)"
            right={
              <span className="text-xs font-semibold text-[#903eaa]">
                অর্ডার ফর্ম কনফিগারেশন
              </span>
            }
          >
            {/* MODE SELECTOR */}

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
                const selected =
                  form.customerFieldType ===
                  mode.value;

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
                        onChange={() =>
                          chooseCustomerMode(
                            mode.value
                          )
                        }
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
              <Info
                size={17}
                className="shrink-0"
              />

              <p>
                Frame Field বা Custom Note বেছে নিলেই
                Customizable Product নিজে থেকে চালু হবে।
                নিচের ফিল্ডগুলো শুধু গ্রাহক ফর্মের
                প্রিভিউ; এখানে তথ্য দেওয়া যাবে না।
              </p>
            </div>

            {/* FRAME FIELD PREVIEW - ALL DISABLED */}

            {form.customerFieldType === "frame" &&
              form.customizable && (
                <div className="rounded-xl border border-[#eadff0] bg-[#f7f0fc] p-4">
                  <div className="mb-4 flex items-center justify-between gap-2">
                    <h3 className="flex items-center gap-2 text-sm font-bold">
                      <ImageIcon
                        size={18}
                        className="text-[#903eaa]"
                      />

                      ফ্রেম ফিল্ড সেটিংস
                      (Frame Field Preview)
                    </h3>

                    <span className="text-xs text-[#903eaa]">
                      লাইভ প্রিভিউ
                    </span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {/* PHOTO UPLOAD - DISABLED */}

                    <div className="rounded-lg bg-white p-4">
                      <Field
                        label="৩. আপনার ছবি আপলোড করুন"
                        hint="সর্বোচ্চ ২০টি ছবি আপলোড করা যাবে"
                      >
                        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-[#e4d3eb] bg-[#fbf8fd] p-5 text-center text-xs text-[#76258a]">
                          <UploadCloud size={25} />

                          <span>
                            ছবি বেছে নিন (Max 20)
                          </span>

                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            disabled
                            className="sr-only"
                          />
                        </label>
                      </Field>
                    </div>

                    {/* NAME AND DATE - DISABLED */}

                    <div className="space-y-3 rounded-lg bg-white p-4">
                      <Field label="৪.১. নাম">
                        <input
                          disabled
                          placeholder="গ্রাহকের নাম..."
                          className={inputClass}
                        />
                      </Field>

                      <Field label="৪.২. জন্মতারিখ / বিবাহবার্ষিকী">
                        <input
                          type="date"
                          disabled
                          className={inputClass}
                        />
                      </Field>
                    </div>
                  </div>

                  {/* ENGRAVING - DISABLED */}

                  <div className="mt-3 rounded-lg bg-white p-4">
                    <Field
                      label="৫. ফ্রেমের নিচের খোদাই বার্তা / উইশ"
                      hint="ফ্রেমের নিচে যে বিশেষ বার্তাটি খোদাই করতে চান, এখানে নোটের মতো লিখুন।"
                    >
                      <textarea
                        rows={3}
                        maxLength={500}
                        disabled
                        placeholder="যেমন: ভালোবাসার স্মৃতি..."
                        className={`${inputClass} resize-y`}
                      />
                    </Field>
                  </div>
                </div>
              )}

            {/* CUSTOM NOTE - DISABLED */}

            {form.customerFieldType === "note" &&
              form.customizable && (
                <div className="rounded-xl border border-[#eadff0] bg-[#f7f0fc] p-4">
                  <Field
                    label="কাস্টম নোট (Customer Note Preview)"
                    hint="গ্রাহক অর্ডারের সময় বিশেষ নির্দেশনা লিখতে পারবেন।"
                  >
                    <textarea
                      rows={4}
                      maxLength={500}
                      value=""
                      disabled
                      placeholder="গ্রাহকের বিশেষ নির্দেশনা..."
                      className={`${inputClass} resize-y`}
                    />
                  </Field>

                  <p className="mt-2 text-right text-xs text-[#8e7995]">
                    0/500
                  </p>
                </div>
              )}

            {/* SURPRISE BOX */}

            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-[#f7f0fc] p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-lg bg-[#ffe16d]">
                  <Gift size={21} />
                </div>

                <div>
                  <p className="text-sm font-bold">
                    সারপ্রাইজ বক্স অপশন (Surprise Box)
                  </p>

                  <p className="mt-1 text-xs text-[#82748b]">
                    ডিফল্ট: No
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs">No</span>

                <MiniSwitch
                  checked={form.surpriseBox}
                  onChange={(v) =>
                    update("surpriseBox", v)
                  }
                />

                <span className="text-xs text-[#903eaa]">
                  Yes
                </span>
              </div>
            </div>
          </Section>

          {/* PACKAGING */}

          <Section
            title="ঐচ্ছিক গিফট বক্স প্যাকেজিং (Optional Gift Box)"
            right={
              <span className="text-xs text-[#897a90]">
                চেকআউটে গ্রাহক নির্বাচন করতে পারবেন
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
                  checked={
                    form.packaging === "regular"
                  }
                  onChange={() =>
                    update("packaging", "regular")
                  }
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
                  checked={
                    form.packaging === "premium"
                  }
                  onChange={() =>
                    update("packaging", "premium")
                  }
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
                      value={form.premiumBoxPrice}
                      onChange={(e) =>
                        update(
                          "premiumBoxPrice",
                          e.target.value
                        )
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
        </div>

        {/* RIGHT SIDEBAR */}

        <aside className="min-w-0 space-y-5 lg:sticky lg:top-20">
          <Section title="সংগঠন ও স্ট্যাটাস ফ্ল্যাগস">
            <StatusCard
              title="ক্রয়যোগ্য / উপলব্ধ"
              subtitle="Available for Purchase"
              checked={form.available}
              onChange={(v) =>
                update("available", v)
              }
            />

            <StatusCard
              title="ফিচার্ড প্রোডাক্ট"
              subtitle="Featured Product"
              checked={form.featured}
              onChange={(v) =>
                update("featured", v)
              }
            />

            <StatusCard
              title="কাস্টমাইজেশনযোগ্য"
              subtitle="Customizable Product"
              checked={form.customizable}
              onChange={toggleCustomizable}
            />

            <Field
              label="ক্যাটাগরি (Category)"
              required
            >
              <select
                value={form.categoryId}
                onChange={(e) =>
                  update(
                    "categoryId",
                    e.target.value
                  )
                }
                className={`${inputClass} bg-[#f7f0fc]`}
                disabled={taxonomiesLoading}
              >
                <option value="">
                  ক্যাটাগরি নির্বাচন করুন
                </option>

                {categories.map((category) => (
                  <option
                    key={category.id}
                    value={category.id}
                  >
                    {category.name}
                  </option>
                ))}
              </select>
            </Field>

            {/* OCCASIONS: MULTIPLE SELECTION */}

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
                      onChange={(e) => {
                        update(
                          "occasionIds",
                          e.target.checked
                            ? [...form.occasionIds, occasion.id]
                            : form.occasionIds.filter(
                                (id) => id !== occasion.id
                              )
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
          </Section>

          {/* LIVE PREVIEW */}

          <div className="overflow-hidden rounded-xl border border-[#ede4f1] bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-[#eee4f2] bg-[#faf6fc] px-4 py-4">
              <Star
                size={18}
                className="text-[#903eaa]"
              />

              <h3 className="text-base font-bold">
                স্টোরফ্রন্ট লাইভ প্রিভিউ
              </h3>
            </div>

            <div className="p-4">
              <div className="relative overflow-hidden rounded-lg border border-[#efe6f2]">
                {mainPhoto ? (
                  <Photo
                    url={mainPhoto.url}
                    className="aspect-square w-full"
                  />
                ) : (
                  <div className="flex aspect-square flex-col items-center justify-center gap-3 bg-[#f7f0fc] text-[#a58caf]">
                    <ImageIcon size={48} />

                    <span className="text-sm">
                      Product Image Preview
                    </span>
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
                  {form.available
                    ? "উপলব্ধ"
                    : "অনুপলব্ধ"}
                </span>
              </div>

              {/* IMAGE THUMBNAILS */}

              {gallery.length > 1 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {gallery.map((image) => (
                    <button
                      key={image.id}
                      type="button"
                      onClick={() =>
                        setSelectedPhoto(image.id)
                      }
                      className={`size-12 overflow-hidden rounded-lg border-2 ${
                        mainPhoto?.id === image.id
                          ? "border-[#903eaa]"
                          : "border-transparent"
                      }`}
                    >
                      <Photo
                        url={image.url}
                        className="size-full"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* PRODUCT DETAILS PREVIEW */}

              <div className="mt-4 space-y-3">
                <p className="text-xs text-[#8a7c8c]">
                  শখবিলাস Bespoke • বাংলাদেশ
                </p>

                <h3 className="text-base font-bold">
                  {form.name ||
                    "আপনার প্রোডাক্টের নাম এখানে দেখাবে"}
                </h3>

                <div className="flex flex-wrap items-center gap-2">
                  {form.variantsEnabled &&
                  prices.length === 0 ? (
                    <p className="text-sm font-bold text-red-500">
                      সব ভ্যারিয়েন্ট অনুপলব্ধ
                    </p>
                  ) : (
                    <p className="text-xl font-extrabold">
                      {minPrice === maxPrice
                        ? money(minPrice)
                        : `${money(minPrice)} – ${money(maxPrice)}`}
                    </p>
                  )}

                  {!form.variantsEnabled &&
                    salePrice > 0 && (
                      <span className="text-sm text-[#998d9c] line-through">
                        {money(regularPrice)}
                      </span>
                    )}
                </div>

                {form.variantsEnabled && (
                  <p className="text-sm text-[#85758c]">
                    {variants.length}টি ভ্যারিয়েন্ট
                  </p>
                )}

                {form.customizable &&
                  form.customerFieldType === "frame" && (
                    <p className="text-xs text-[#82758b]">
                      ✓ ফ্রেম ফিল্ড কাস্টমাইজেশন সক্রিয়
                    </p>
                  )}

                {form.customizable &&
                  form.customerFieldType === "note" && (
                    <p className="text-xs text-[#82758b]">
                      ✓ কাস্টম নোট সক্রিয়
                    </p>
                  )}

                {form.surpriseBox && (
                  <p className="text-xs text-[#82758b]">
                    ✓ সারপ্রাইজ বক্স অপশন সক্রিয়
                  </p>
                )}

                {form.packaging === "premium" && (
                  <p className="text-xs text-[#82758b]">
                    ✓ প্রিমিয়াম বক্স:{" "}
                    {money(form.premiumBoxPrice)}
                  </p>
                )}
              </div>

              <div className="mt-5 space-y-3 border-t border-[#f0e8f3] pt-5">
                <button
                  type="submit"
                  disabled={
                    loading ||
                    taxonomiesLoading ||
                    productLoading ||
                    (isEdit && !productLoaded)
                  }
                  className={`${primaryButton} w-full py-3`}
                >
                  {loading ? (
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />
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
                  onClick={() =>
                    navigate("/admin/products")
                  }
                  className={`${softButton} w-full`}
                >
                  বাতিল করে ফিরে যান
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-3 rounded-xl border border-[#eee4f2] bg-white p-4 text-sm leading-relaxed text-[#88788d]">
            <Info
              size={19}
              className="mt-0.5 shrink-0 text-[#903eaa]"
            />

            <p>
              Slug backend-এ স্বয়ংক্রিয়ভাবে তৈরি হবে।
              প্রতিটি Variant-এর SKU আলাদা হতে হবে।
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700"
            >
              {error}
            </div>
          )}

          {success && (
            <div
              role="status"
              className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm font-semibold text-green-700"
            >
              {success}
            </div>
          )}
        </aside>
      </form>
    </div>
  );
}
