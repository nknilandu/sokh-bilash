
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  Check,
  Gift,
  ImagePlus,
  Loader2,
  Minus,
  Plus,
  Save,
  Trash2,
  X,
  AlertTriangle,
} from "lucide-react";

const API_URL = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:3000"
).replace(/\/$/, "");

const MAX_QUANTITY = 10;
const MAX_PHOTOS = 20;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

const formatPrice = (value) =>
  `৳${Number(value || 0).toLocaleString("en-US")}`;

const generateId = () =>
  globalThis.crypto?.randomUUID?.() ||
  `skb-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const getBasePrice = (product) => {
  const regular = Number(product?.regularPrice || 0);
  const sale = Number(product?.salePrice);

  return (
    Number.isFinite(sale) &&
    sale > 0 &&
    sale < regular
      ? sale
      : regular
  );
};

const getImage = (product) => {
  const first = product?.images?.[0];

  return typeof first === "string"
    ? first
    : first?.url || "";
};

const fieldClass =
  "w-full rounded-xl border border-base-300 bg-base-100 px-3 py-2.5 text-sm text-primary outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/10";

export default function CartItemEditor({
  item,
  onSave,
  onCancel,
  saving = false,
}) {
  const productId =
    item.productId || item.id;

  // ========================================
  // LOAD CURRENT PRODUCT DETAILS
  // ========================================

  const {
    data: product,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["cart-edit-product", productId],

    enabled: Boolean(productId),

    queryFn: async ({ signal }) => {
      const response = await fetch(
        `${API_URL}/products/${encodeURIComponent(
          productId
        )}`,
        { signal }
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (
        !response.ok ||
        !data.success ||
        !data.product
      ) {
        throw new Error(
          data.message || "Product not found"
        );
      }

      return data.product;
    },

    staleTime: 30 * 1000,
  });

  // ========================================
  // EXISTING CART VALUES
  // ========================================

  const custom = item.customization || {};

  const [variantKey, setVariantKey] = useState(
    item.variantKey || ""
  );

  const [quantity, setQuantity] = useState(
    Math.min(
      MAX_QUANTITY,
      Math.max(1, Number(item.quantity) || 1)
    )
  );

  const [packaging, setPackaging] = useState(
    item.packaging === "premium"
      ? "premium"
      : "regular"
  );

  const [surpriseBox, setSurpriseBox] = useState(
    item.surpriseBox === true
  );

  const [name, setName] = useState(
    custom.name || ""
  );

  const [date, setDate] = useState(
    custom.date || ""
  );

  const [message, setMessage] = useState(
    custom.message || ""
  );

  const [note, setNote] = useState(
    custom.note || ""
  );

  const [photos, setPhotos] = useState(
    Array.isArray(custom.photos)
      ? custom.photos
      : []
  );

  const [uploading, setUploading] =
    useState(false);

  const [uploadMessage, setUploadMessage] =
    useState("");

  const [error, setError] = useState("");

  // ========================================
  // PRODUCT VARIANTS
  // ========================================

  const variants =
    product?.variantsEnabled &&
    Array.isArray(product?.variants)
      ? product.variants
      : [];

  const selectedVariant = variants.find(
    (variant) => variant.key === variantKey
  );

  const selectedOptions =
    selectedVariant?.options || {};

  const optionGroups = ["size", "color", "type"]
    .map((type) => ({
      type,
      enabled:
        product?.options?.[type]?.enabled === true,
      values: product?.options?.[type]?.values || [],
    }))
    .filter(
      (group) =>
        group.enabled &&
        group.values.length > 0
    );

  const selectOption = (type, label) => {
    const availableVariants = variants.filter(
      (variant) =>
        variant.available !== false &&
        variant.options?.[type] === label
    );

    const sameCombination =
      availableVariants.find((variant) =>
        optionGroups.every(
          (group) =>
            group.type === type ||
            variant.options?.[group.type] ===
              selectedOptions[group.type]
        )
      );

    const nextVariant =
      sameCombination || availableVariants[0];

    if (nextVariant) {
      setVariantKey(nextVariant.key);
    }
  };

  // ========================================
  // CUSTOMIZATION CONFIGURATION
  // ========================================

  const frameMode =
    product?.customizable === true &&
    product?.customerFieldType === "frame";

  const noteMode =
    product?.customizable === true &&
    product?.customerFieldType === "note";

  const configuredPhotoLimit = Number(
    product?.customerFields?.find(
      (field) => field.key === "photos"
    )?.maxFiles || MAX_PHOTOS
  );

  const photoLimit = Math.min(
    MAX_PHOTOS,
    Math.max(1, configuredPhotoLimit)
  );

  // ========================================
  // CURRENT PRICE
  // ========================================

  const variantPrice = product?.variantsEnabled
    ? Number(selectedVariant?.price || 0)
    : getBasePrice(product);

  const premiumBoxPrice =
    Number(product?.premiumBoxPrice || 0);

  const packagingExtra =
    packaging === "premium"
      ? premiumBoxPrice
      : 0;

  const unitPrice =
    variantPrice + packagingExtra;

  const lineTotal =
    unitPrice * quantity;

  const purchasable =
    product?.available === true &&
    (
      !product?.variantsEnabled ||
      (
        selectedVariant &&
        selectedVariant.available !== false
      )
    ) &&
    Number.isFinite(unitPrice) &&
    unitPrice > 0;

  // ========================================
  // UPLOAD CUSTOMER PHOTOS
  // ========================================

  const handlePhotoUpload = async (event) => {
    const files = Array.from(
      event.target.files || []
    );

    event.target.value = "";

    if (!files.length || uploading) return;

    setError("");
    setUploadMessage("");

    const apiKey =
      import.meta.env.VITE_IMGBB_API_KEY;

    if (!apiKey) {
      setError(
        "ImgBB API Key পাওয়া যায়নি।"
      );
      return;
    }

    const remaining =
      photoLimit - photos.length;

    if (remaining <= 0) {
      setError(
        `সর্বোচ্চ ${photoLimit}টি ছবি দেওয়া যাবে।`
      );
      return;
    }

    const accepted = files.slice(0, remaining);

    if (files.length > remaining) {
      setError(
        `একসঙ্গে আরও সর্বোচ্চ ${remaining}টি ছবি যোগ করা যাবে।`
      );
      return;
    }

    for (const file of accepted) {
      if (
        ![
          "image/jpeg",
          "image/png",
          "image/webp",
        ].includes(file.type)
      ) {
        setError(
          `${file.name}: Unsupported image format.`
        );
        return;
      }

      if (
        file.size <= 0 ||
        file.size > MAX_IMAGE_SIZE
      ) {
        setError(
          `${file.name}: সর্বোচ্চ ১০ MB ছবি দেওয়া যাবে।`
        );
        return;
      }
    }

    setUploading(true);

    const uploaded = [];

    try {
      for (
        let index = 0;
        index < accepted.length;
        index++
      ) {
        const file = accepted[index];

        setUploadMessage(
          `ছবি আপলোড হচ্ছে ${index + 1}/${accepted.length}`
        );

        const formData = new FormData();

        formData.append("image", file);

        const response = await fetch(
          `https://api.imgbb.com/1/upload?key=${encodeURIComponent(
            apiKey
          )}`,
          {
            method: "POST",
            body: formData,
          }
        );

        const data = await response
          .json()
          .catch(() => ({}));

        if (
          !response.ok ||
          !data.success ||
          typeof data.data?.url !== "string" ||
          !data.data.url.startsWith("https://")
        ) {
          throw new Error(
            `${file.name} আপলোড করা যায়নি।`
          );
        }

        uploaded.push({
          id: generateId(),
          name: file.name,
          size: file.size,
          url: data.data.url,
        });
      }

      setPhotos((current) => [
        ...current,
        ...uploaded,
      ]);
    } catch (uploadError) {
      // Preserve successfully uploaded photos.
      if (uploaded.length > 0) {
        setPhotos((current) => [
          ...current,
          ...uploaded,
        ]);
      }

      setError(
        uploadError.message ||
          "ছবি আপলোড করা যায়নি।"
      );
    } finally {
      setUploading(false);
      setUploadMessage("");
    }
  };

  // ========================================
  // SAVE CONFIGURATION
  // ========================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (
      !product ||
      !purchasable ||
      uploading ||
      saving
    ) {
      return;
    }

    setError("");

    const customization = {
      mode: frameMode
        ? "frame"
        : noteMode
          ? "note"
          : "none",

      name: frameMode ? name.trim() : "",
      date: frameMode ? date : "",
      message: frameMode ? message.trim() : "",
      note: noteMode ? note.trim() : "",

      photos: frameMode
        ? photos.map((photo) => ({
            id: photo.id,
            name: photo.name,
            size: photo.size,
            url: photo.url,
          }))
        : [],
    };

    const updatedItem = {
      cartId: item.cartId,
      productId,

      name: product.name,
      slug: product.slug || "",
      sku:
        selectedVariant?.sku ||
        product.sku ||
        "",

      image:
        selectedVariant?.imageUrl ||
        getImage(product),

      quantity,

      variantKey:
        product.variantsEnabled
          ? selectedVariant?.key || ""
          : "",

      selectedOptions:
        product.variantsEnabled
          ? { ...selectedOptions }
          : {},

      packaging,
      premiumBoxPrice: packagingExtra,

      surpriseBox:
        product.surpriseBox === true &&
        surpriseBox,

      customization,

      price: unitPrice,
      unitPrice,
    };

    try {
      await onSave(
        item.cartId,
        updatedItem
      );
    } catch (saveError) {
      setError(
        saveError.message ||
          "কার্ট আপডেট করা যায়নি।"
      );
    }
  };

  // ========================================
  // LOADING + ERROR
  // ========================================

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-base-200 p-4 text-sm text-muted">
        <Loader2
          size={18}
          className="animate-spin"
        />
        প্রোডাক্টের তথ্য লোড হচ্ছে...
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-700">
          প্রোডাক্টের তথ্য পাওয়া যায়নি।
        </p>

        <button
          type="button"
          onClick={() => refetch()}
          className="mt-2 text-xs font-bold text-secondary underline"
        >
          আবার চেষ্টা করুন
        </button>
      </div>
    );
  }

  // ========================================
  // EDITOR UI
  // ========================================

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 space-y-5 rounded-2xl border border-secondary/20 bg-secondary/5 p-4 sm:p-5"
    >
      {/* HEADER */}

      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-primary sm:text-base">
            কার্টের প্রোডাক্ট এডিট করুন
          </h3>

          <p className="mt-1 text-xs text-muted">
            পরিবর্তন Save করলে আগের Cart Item-টাই Update হবে।
          </p>
        </div>

        <button
          type="button"
          onClick={onCancel}
          disabled={saving || uploading}
          aria-label="এডিট বন্ধ করুন"
          className="rounded-full p-2 text-muted hover:bg-base-200"
        >
          <X size={18} />
        </button>
      </div>

      {/* VARIANT OPTIONS */}

      {optionGroups.map((group) => (
        <div key={group.type}>
          <p className="mb-2 text-sm font-bold text-primary">
            {group.type === "size"
              ? "সাইজ"
              : group.type === "color"
                ? "কালার"
                : "ডিজাইন / টাইপ"}
          </p>

          <div className="flex flex-wrap gap-2">

            {group.values.map((option) => {
              const selected =
                selectedOptions[group.type] ===
                option.label;

              const available = variants.some(
                (variant) =>
                  variant.available !== false &&
                  variant.options?.[group.type] ===
                    option.label
              );

              return (
                <button
                  type="button"
                  key={option.id}
                  disabled={
                    !available ||
                    saving ||
                    uploading
                  }
                  onClick={() =>
                    selectOption(
                      group.type,
                      option.label
                    )
                  }
                  className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                    selected
                      ? "border-secondary bg-white text-secondary"
                      : "border-base-300 bg-white text-primary"
                  } disabled:opacity-40`}
                >
                  {option.label}

                  {selected && (
                    <Check size={14} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* PACKAGING */}

      <div>
        <p className="mb-2 flex items-center gap-2 text-sm font-bold text-primary">
          <Gift size={16} />
          গিফট প্যাকেজিং
        </p>

        <div className="grid grid-cols-2 gap-2">

          {[
            {
              value: "regular",
              title: "Regular Box",
              amount: 0,
            },
            {
              value: "premium",
              title: "Premium Box",
              amount: premiumBoxPrice,
            },
          ].map((option) => (
            <button
              type="button"
              key={option.value}
              disabled={saving || uploading}
              onClick={() =>
                setPackaging(option.value)
              }
              className={`rounded-xl border p-3 text-left transition ${
                packaging === option.value
                  ? "border-secondary bg-white ring-1 ring-secondary"
                  : "border-base-300 bg-white"
              }`}
            >
              <span className="block text-xs font-bold text-primary">
                {option.title}
              </span>

              <span className="mt-1 block text-xs text-secondary">
                {option.amount > 0
                  ? `+${formatPrice(option.amount)}`
                  : "ফ্রি"}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* SURPRISE BOX */}

      {product.surpriseBox && (
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-base-300 bg-white p-3">
          <input
            type="checkbox"
            checked={surpriseBox}
            onChange={(event) =>
              setSurpriseBox(
                event.target.checked
              )
            }
            disabled={saving || uploading}
            className="checkbox checkbox-sm checkbox-secondary"
          />

          <span className="text-sm font-semibold text-primary">
            সারপ্রাইজ বক্স হিসেবে প্রস্তুত করুন
          </span>
        </label>
      )}

      {/* FRAME CUSTOMIZATION */}

      {frameMode && (
        <div className="space-y-4">

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

            <label>
              <span className="mb-2 block text-xs font-semibold text-primary">
                নাম বা শিরোনাম
              </span>

              <input
                type="text"
                value={name}
                maxLength={80}
                onChange={(event) =>
                  setName(event.target.value)
                }
                className={fieldClass}
                placeholder="নাম লিখুন"
              />
            </label>

            <label>
              <span className="mb-2 block text-xs font-semibold text-primary">
                বিশেষ তারিখ
              </span>

              <input
                type="date"
                value={date}
                onChange={(event) =>
                  setDate(event.target.value)
                }
                className={fieldClass}
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-2 block text-xs font-semibold text-primary">
              খোদাই বার্তা / উইশ
            </span>

            <textarea
              value={message}
              onChange={(event) =>
                setMessage(event.target.value)
              }
              maxLength={300}
              rows={3}
              className={fieldClass}
              placeholder="আপনার বার্তা লিখুন"
            />
          </label>

          {/* PHOTOS */}

          <div>
            <p className="mb-2 text-sm font-bold text-primary">
              আপলোড করা ছবি ({photos.length}/{photoLimit})
            </p>

            {photos.length > 0 && (
              <div className="mb-3 grid grid-cols-4 gap-2 sm:grid-cols-6">

                {photos.map((photo, index) => (
                  <div
                    key={
                      photo.id ||
                      `${photo.url}-${index}`
                    }
                    className="relative overflow-hidden rounded-lg border border-base-300 bg-white"
                  >
                    <img
                      src={photo.url}
                      alt={
                        photo.name ||
                        `Photo ${index + 1}`
                      }
                      className="aspect-square w-full object-cover"
                    />

                    <button
                      type="button"
                      disabled={saving || uploading}
                      onClick={() =>
                        setPhotos((current) =>
                          current.filter(
                            (_, i) => i !== index
                          )
                        )
                      }
                      aria-label="ছবি সরান"
                      className="absolute right-1 top-1 rounded-full bg-white p-1 text-red-600 shadow-sm"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-secondary/40 bg-white px-4 py-3 text-xs font-semibold text-secondary">
              {uploading ? (
                <Loader2
                  size={17}
                  className="animate-spin"
                />
              ) : (
                <ImagePlus size={17} />
              )}

              {uploading
                ? uploadMessage
                : "আরও ছবি যোগ করুন"}

              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                disabled={
                  saving ||
                  uploading ||
                  photos.length >= photoLimit
                }
                onChange={handlePhotoUpload}
                className="sr-only"
              />
            </label>
          </div>
        </div>
      )}

      {/* CUSTOM NOTE */}

      {noteMode && (
        <label className="block">
          <span className="mb-2 block text-xs font-semibold text-primary">
            বিশেষ নির্দেশনা
          </span>

          <textarea
            value={note}
            onChange={(event) =>
              setNote(event.target.value)
            }
            maxLength={500}
            rows={4}
            placeholder="আপনার নির্দেশনা লিখুন"
            className={fieldClass}
          />
        </label>
      )}

      {/* QUANTITY */}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-base-300 bg-white p-3">
        <p className="text-sm font-bold text-primary">
          পরিমাণ
        </p>

        <div className="flex items-center rounded-xl border border-base-300">

          <button
            type="button"
            disabled={
              quantity <= 1 ||
              saving ||
              uploading
            }
            onClick={() =>
              setQuantity((value) =>
                Math.max(1, value - 1)
              )
            }
            className="flex size-9 items-center justify-center disabled:opacity-30"
          >
            <Minus size={15} />
          </button>

          <span className="min-w-9 text-center text-sm font-bold">
            {quantity}
          </span>

          <button
            type="button"
            disabled={
              quantity >= MAX_QUANTITY ||
              saving ||
              uploading
            }
            onClick={() =>
              setQuantity((value) =>
                Math.min(MAX_QUANTITY, value + 1)
              )
            }
            className="flex size-9 items-center justify-center disabled:opacity-30"
          >
            <Plus size={15} />
          </button>
        </div>
      </div>

      {/* PRICE PREVIEW */}

      <div className="flex items-center justify-between gap-3 rounded-xl bg-white p-4">
        <div>
          <p className="text-xs text-muted">
            নতুন প্রতি পিস মূল্য
          </p>

          <p className="mt-1 text-sm font-bold text-primary">
            {formatPrice(unitPrice)}
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs text-muted">
            নতুন মোট মূল্য
          </p>

          <p className="mt-1 text-lg font-extrabold text-secondary">
            {formatPrice(lineTotal)}
          </p>
        </div>
      </div>

      {/* ERRORS */}

      {!purchasable && (
        <p className="flex items-start gap-2 text-xs text-red-700">
          <AlertTriangle size={15} />
          এই প্রোডাক্ট বা ভ্যারিয়েন্ট বর্তমানে অনুপলব্ধ।
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="rounded-xl bg-red-50 p-3 text-xs text-red-700"
        >
          {error}
        </p>
      )}

      {/* ACTIONS */}

      <div className="flex flex-wrap gap-3">

        <button
          type="submit"
          disabled={
            saving ||
            uploading ||
            !purchasable
          }
          className="btn-gold flex-1 rounded-xl px-4 py-3 text-sm disabled:opacity-50"
        >
          {saving ? (
            <Loader2
              size={17}
              className="animate-spin"
            />
          ) : (
            <Save size={17} />
          )}

          {saving
            ? "সেভ হচ্ছে..."
            : "পরিবর্তন সেভ করুন"}
        </button>

        <button
          type="button"
          onClick={onCancel}
          disabled={saving || uploading}
          className="btn-outline-brand rounded-xl px-5 py-3 text-sm disabled:opacity-50"
        >
          <X size={16} />
          বাতিল
        </button>
      </div>
    </form>
  );
}
