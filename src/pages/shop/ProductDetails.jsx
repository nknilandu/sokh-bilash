import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Swal from "sweetalert2";

import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Heart,
  ShoppingBag,
  Sparkles,
  ShieldCheck,
  Truck,
  Minus,
  Plus,
  Upload,
  Check,
  Gift,
  ZoomIn,
  MessageCircle,
  ImagePlus,
  Trash2,
  MessageSquareText,
  Loader2,
  ImageOff,
  RefreshCw,
  Zap,
} from "lucide-react";

import ProductCard from "../../components/product/ProductCard";
import useCart from "../../hooks/useCart";
import { AuthContext } from "../../providers/AuthProvider";
import { useWishlist } from "../../providers/WishlistProvider";
import { API_URL, CONTACT, getWhatsAppUrl } from "../../utils/siteConfig";

// ==========================================
// CONFIGURATION
// ==========================================

const MAX_PHOTOS = 20;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const BUY_NOW_KEY = "sokhbilash-buy-now-v1";

const FILE_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "jfif",
  "png",
  "webp",
  "gif",
  "heic",
  "heif",
  "avif",
  "bmp",
]);

const SUPPORTED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
  "image/avif",
  "image/bmp",
  "image/x-ms-bmp",
]);

const IMAGE_ACCEPT =
  ".jpg,.jpeg,.jfif,.png,.webp,.gif,.heic,.heif,.avif,.bmp,image/*";

// ==========================================
// COMMON HELPERS
// ==========================================

const formatPrice = (value) => `৳${Number(value || 0).toLocaleString("en-US")}`;

const validImageUrl = (url) => {
  try {
    return ["https:", "http:"].includes(new URL(String(url)).protocol);
  } catch {
    return false;
  }
};

const getImageUrls = (images) => {
  if (!Array.isArray(images)) return [];

  return images
    .map((image) => (typeof image === "string" ? image : image?.url))
    .filter(validImageUrl);
};

const positivePrice = (value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) && number > 0 ? number : null;
};

const getBasePrice = (product) => {
  const regular = positivePrice(product?.regularPrice) || 0;
  const sale = positivePrice(product?.salePrice);

  return sale !== null && sale < regular ? sale : regular;
};

const getColorCode = (label) => {
  const value = String(label).toLowerCase();

  if (/black|কালো/.test(value)) return "#343034";
  if (/white|সাদা/.test(value)) return "#ffffff";
  if (/red|লাল/.test(value)) return "#dc3545";
  if (/blue|নীল/.test(value)) return "#3278cc";
  if (/green|সবুজ/.test(value)) return "#318454";
  if (/gold|সোনালি/.test(value)) return "#e4b942";
  if (/pink|গোলাপি/.test(value)) return "#ed91bf";
  if (/brown|বাদামি/.test(value)) return "#795548";

  return "#76258a";
};

const showToast = (title, icon = "success") =>
  Swal.fire({
    title,
    icon,
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 2200,
    timerProgressBar: true,
  });

function getScrollBehavior() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? "auto"
    : "smooth";
}

// ==========================================
// EVENT-ONLY HELPERS
// ==========================================

function generateId() {
  return (
    globalThis.crypto?.randomUUID?.() ||
    `skb-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`
  );
}

function createCartItem(payload) {
  return {
    ...payload,
    cartId: generateId(),
    addedAt: new Date().toISOString(),
  };
}

function persistBuyNowItem(item) {
  try {
    sessionStorage.setItem(
      BUY_NOW_KEY,
      JSON.stringify({
        createdAt: Date.now(),
        item,
      }),
    );
  } catch (error) {
    console.warn("Buy Now session persistence unavailable:", error);
  }
}

// ==========================================
// IMAGE HELPERS
// ==========================================

function extensionOf(fileName) {
  return String(fileName || "")
    .split(".")
    .pop()
    .toLowerCase();
}

function replaceExtension(fileName, extension) {
  return `${String(fileName).replace(/\.[^.]+$/, "")}.${extension}`;
}

function validateFile(file) {
  if (!file || file.size <= 0) {
    throw new Error("ছবিটি খালি অথবা নষ্ট।");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("প্রতি ছবি সর্বোচ্চ ১০ MB হতে পারবে।");
  }

  const extension = extensionOf(file.name);
  const type = String(file.type || "").toLowerCase();

  if (!FILE_EXTENSIONS.has(extension) && !SUPPORTED_TYPES.has(type)) {
    throw new Error("এই ফরম্যাটের ছবি সাপোর্ট করে না।");
  }
}

function blobToFile(blob, filename, type) {
  return new File([blob], filename, {
    type,
    lastModified: Date.now(),
  });
}

async function convertUsingCanvas(file) {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = new Image();

    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () =>
        reject(new Error("এই ছবিটি ব্রাউজারে পড়া যাচ্ছে না।"));

      image.src = objectUrl;
    });

    const width = image.naturalWidth;
    const height = image.naturalHeight;

    if (!width || !height) {
      throw new Error("ছবির সাইজ শনাক্ত করা যায়নি।");
    }

    const scale = Math.min(1, 6000 / Math.max(width, height));

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));

    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("ছবি প্রসেস করা যাচ্ছে না।");
    }

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (result) =>
          result
            ? resolve(result)
            : reject(new Error("ছবি কনভার্ট করা যায়নি।")),
        "image/jpeg",
        0.92,
      );
    });

    return blobToFile(blob, replaceExtension(file.name, "jpg"), "image/jpeg");
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function prepareImage(file) {
  validateFile(file);

  const extension = extensionOf(file.name);
  const type = String(file.type || "").toLowerCase();

  const isHeic =
    ["heic", "heif"].includes(extension) ||
    ["image/heic", "image/heif"].includes(type);

  if (isHeic) {
    try {
      const { default: heic2any } = await import("heic2any");

      const result = await heic2any({
        blob: file,
        toType: "image/jpeg",
        quality: 0.94,
      });

      const blob = Array.isArray(result) ? result[0] : result;

      if (!blob) {
        throw new Error("কনভার্ট করা যায়নি।");
      }

      const converted = blobToFile(
        blob,
        replaceExtension(file.name, "jpg"),
        "image/jpeg",
      );

      if (converted.size > MAX_FILE_SIZE) {
        throw new Error("HEIC থেকে JPG করার পরে ছবি ১০ MB ছাড়িয়েছে।");
      }

      return converted;
    } catch (error) {
      throw new Error(`iPhone/HEIC ছবি প্রসেস হয়নি: ${error.message}`);
    }
  }

  if (
    ["avif", "bmp"].includes(extension) ||
    ["image/avif", "image/bmp", "image/x-ms-bmp"].includes(type)
  ) {
    const converted = await convertUsingCanvas(file);

    if (converted.size > MAX_FILE_SIZE) {
      throw new Error("কনভার্ট করার পরে ১০ MB ছাড়িয়েছে।");
    }

    return converted;
  }

  if (extension === "jfif") {
    return blobToFile(file, replaceExtension(file.name, "jpg"), "image/jpeg");
  }

  return file;
}

// ==========================================
// IMGBB UPLOAD
// ==========================================

async function uploadToImgBB(file, apiKey) {
  let lastError;

  for (let attempt = 0; attempt < 2; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90000);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch(
        `https://api.imgbb.com/1/upload?key=${encodeURIComponent(apiKey)}`,
        {
          method: "POST",
          body: formData,
          signal: controller.signal,
        },
      );

      const result = await response.json().catch(() => ({}));

      if (
        !response.ok ||
        result.success !== true ||
        !validImageUrl(result.data?.url)
      ) {
        const error = new Error(
          result.error?.message ||
            result.error?.code ||
            `ImgBB HTTP ${response.status}`,
        );

        error.retryable =
          response.status === 408 ||
          response.status === 429 ||
          response.status >= 500;

        throw error;
      }

      return {
        url: result.data.url,
        displayUrl: result.data.display_url || result.data.url,
      };
    } catch (error) {
      lastError = error;

      const retryable =
        error.retryable === true ||
        error.name === "TypeError" ||
        error.name === "AbortError";

      if (!retryable || attempt === 1) break;

      await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
    } finally {
      clearTimeout(timeout);
    }
  }

  if (lastError?.name === "AbortError") {
    throw new Error("নেটওয়ার্ক টাইমআউট হয়েছে।");
  }

  throw lastError || new Error("Upload failed");
}

// ==========================================
// GALLERY / DEFAULT / VARIANT HELPERS
// ==========================================

function buildThumbnails(variants, gallery) {
  // Keep ALL Product Photos as Default/gallery images.
  // A shared variant URL must not remove a Product Photo.
  const regular = [...new Set(gallery)].map((url, index) => ({
    id: `gallery-${index}`,
    url,
    isVariant: false,
    variantKey: "",
    labels: [],
  }));

  // Keep every variant after all regular Product Photos.
  const variantImages = variants
    .filter((variant) => validImageUrl(variant.imageUrl))
    .map((variant) => ({
      id: `variant-${variant.key}`,
      url: variant.imageUrl,
      isVariant: true,
      variantKey: variant.key,
      labels: Object.values(variant.options || {}).filter(Boolean),
    }));

  return [...regular, ...variantImages];
}

function getDefaultThumbnailId(thumbnails) {
  return thumbnails.find((thumbnail) => !thumbnail.isVariant)?.id || "";
}

function getVariantThumbnailId(variant, thumbnails) {
  if (!variant) {
    return getDefaultThumbnailId(thumbnails);
  }

  return (
    thumbnails.find(
      (thumbnail) =>
        thumbnail.isVariant && thumbnail.variantKey === variant.key,
    )?.id || getDefaultThumbnailId(thumbnails)
  );
}

function selectionForThumbnail(thumbnail, variants) {
  const variant = thumbnail.isVariant
    ? variants.find((item) => item.key === thumbnail.variantKey)
    : null;

  return {
    selectedVariantKey: variant?.key || "",
    selectedThumbnailId: thumbnail.id,
  };
}

function buildInitialForm(product, thumbnails, saved) {
  const custom = saved?.customization || {};

  return {
    // Always open with the first regular Product Photo.
    selectedVariantKey: "",
    selectedThumbnailId: getDefaultThumbnailId(thumbnails),

    quantity: Math.min(
      10,
      Math.max(1, Math.trunc(Number(saved?.quantity) || 1)),
    ),

    packaging:
      positivePrice(product.premiumBoxPrice) && saved?.packaging === "premium"
        ? "premium"
        : "regular",

    customText: String(custom.name || ""),
    customDate: String(custom.date || ""),
    customMessage: String(custom.message || ""),
    customNote: String(custom.note || ""),

    photos: Array.isArray(custom.photos)
      ? custom.photos.filter((photo) => photo && validImageUrl(photo.url))
      : [],
  };
}

// ==========================================
// PRODUCT CONTENT
// ==========================================

function ProductDetailsContent({ product, relatedProducts }) {
  const navigate = useNavigate();
  const descriptionRef = useRef(null);
  const thumbnailStripRef = useRef(null);

  const { user, loading, role, roleLoading, accountStatus } =
    useContext(AuthContext);

  const checkingRole = loading || (Boolean(user) && roleLoading);
  const isAdmin = Boolean(user) && role === "admin";

  const canShop =
    !checkingRole &&
    (!user || (role === "customer" && accountStatus === "active"));

  const {
    cartItems = [],
    addToCart,
    isInCart,
    cartReady,
    cartError,
    retrySync,
  } = useCart();

  const {
    isFavorite,
    toggleWishlist,
    ready: wishlistReady,
    canWishlist,
    savingId,
  } = useWishlist();

  const variants = useMemo(
    () =>
      product.variantsEnabled && Array.isArray(product.variants)
        ? product.variants
        : [],
    [product.variantsEnabled, product.variants],
  );

  const gallery = useMemo(() => getImageUrls(product.images), [product.images]);

  const thumbnails = useMemo(
    () => buildThumbnails(variants, gallery),
    [variants, gallery],
  );

  const defaultThumbnailId = getDefaultThumbnailId(thumbnails);
  const hasDefaultPhoto = Boolean(defaultThumbnailId);

  const optionGroups = useMemo(() => {
    if (!product.variantsEnabled) return [];

    return ["size", "color", "type"]
      .map((type) => {
        const configured = product.options?.[type];

        const rawValues = Array.isArray(configured?.values)
          ? configured.values
          : [];

        const values = rawValues
          .map((value) =>
            typeof value === "string" ? { label: value } : value,
          )
          .filter(
            (value) =>
              value && typeof value.label === "string" && value.label.trim(),
          );

        return {
          type,
          enabled: configured?.enabled === true,
          values,
        };
      })
      .filter((group) => group.enabled);
  }, [product.variantsEnabled, product.options]);

  // ========================================
  // FORM STATE
  // ========================================

  const cartList = Array.isArray(cartItems) ? cartItems : [];

  const savedCartItem = cartReady
    ? cartList.find(
        (item) => String(item.productId || item.id) === String(product._id),
      )
    : null;

  const initialForm = buildInitialForm(product, thumbnails, savedCartItem);

  const [draft, setDraft] = useState(null);
  const form = draft ?? initialForm;

  const {
    quantity,
    packaging,
    customText,
    customDate,
    customMessage,
    customNote,
    photos,
  } = form;

  const updateForm = (changes) => {
    setDraft((current) => ({
      ...(current ?? initialForm),
      ...changes,
    }));
  };

  const setField = (field, nextValue) => {
    setDraft((current) => {
      const previous = current ?? initialForm;

      return {
        ...previous,
        [field]:
          typeof nextValue === "function"
            ? nextValue(previous[field])
            : nextValue,
      };
    });
  };

  // Empty key means Default/base product.
  const isDefaultSelection = !form.selectedVariantKey;

  const selectedVariant = isDefaultSelection
    ? null
    : variants.find((variant) => variant.key === form.selectedVariantKey) ||
      null;

  const selectedOptions = selectedVariant?.options || {};

  const selectedThumb =
    thumbnails.find((thumbnail) => thumbnail.id === form.selectedThumbnailId) ||
    thumbnails.find(
      (thumbnail) =>
        thumbnail.id === getVariantThumbnailId(selectedVariant, thumbnails),
    ) ||
    null;

  const variantImage = validImageUrl(selectedVariant?.imageUrl)
    ? selectedVariant.imageUrl
    : "";

  const selectedImage = selectedThumb?.url || variantImage || gallery[0] || "";

  const [zoom, setZoom] = useState(false);
  const [zoomPosition, setZoomPosition] = useState("50% 50%");
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [hasLongDescription, setHasLongDescription] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [fileError, setFileError] = useState("");
  const [uploadProgress, setUploadProgress] = useState("");
  const [adding, setAdding] = useState(false);
  const [buying, setBuying] = useState(false);

  // ========================================
  // DESCRIPTION MEASUREMENT
  // ========================================

  useEffect(() => {
    if (descriptionExpanded) return;

    const element = descriptionRef.current;
    if (!element) return;

    const check = () => {
      setHasLongDescription(element.scrollHeight > element.clientHeight + 2);
    };

    const frameId = window.requestAnimationFrame(check);

    const observer =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(check) : null;

    observer?.observe(element);
    window.addEventListener("resize", check);

    return () => {
      window.cancelAnimationFrame(frameId);
      observer?.disconnect();
      window.removeEventListener("resize", check);
    };
  }, [product.description, descriptionExpanded]);

  // ========================================
  // KEEP ACTIVE THUMBNAIL VISIBLE
  // ========================================

  useEffect(() => {
    const strip = thumbnailStripRef.current;
    if (!strip || !selectedThumb?.id) return;

    const button = Array.from(strip.children).find(
      (element) => element.dataset.thumbnailId === selectedThumb.id,
    );

    if (!button) return;

    const stripRect = strip.getBoundingClientRect();
    const buttonRect = button.getBoundingClientRect();

    let distance = 0;

    if (buttonRect.left < stripRect.left) {
      distance = buttonRect.left - stripRect.left - 4;
    } else if (buttonRect.right > stripRect.right) {
      distance = buttonRect.right - stripRect.right + 4;
    }

    if (distance) {
      strip.scrollBy({
        left: distance,
        behavior: getScrollBehavior(),
      });
    }
  }, [selectedThumb?.id]);

  // ========================================
  // PRICING
  // ========================================

  const regularPrice = positivePrice(product.regularPrice) || 0;
  const salePrice = positivePrice(product.salePrice);
  const hasSale = salePrice !== null && salePrice < regularPrice;
  const basePrice = getBasePrice(product);

  const variantPrice = selectedVariant
    ? (positivePrice(selectedVariant.price) ?? basePrice)
    : basePrice;

  const premiumBoxPrice = positivePrice(product.premiumBoxPrice) || 0;
  const premiumEnabled = premiumBoxPrice > 0;

  const effectivePackaging =
    premiumEnabled && packaging === "premium" ? "premium" : "regular";

  const packagingExtra = effectivePackaging === "premium" ? premiumBoxPrice : 0;

  const price = variantPrice + packagingExtra;
  const total = price * quantity;

  const selectedUsesSale = hasSale && Math.abs(variantPrice - salePrice) < 0.01;

  const comparisonPrice = regularPrice + packagingExtra;
  const showOriginalPrice = selectedUsesSale && comparisonPrice > price;

  const discount = showOriginalPrice
    ? Math.round(((comparisonPrice - price) / comparisonPrice) * 100)
    : 0;

  const selectionAvailable =
    !product.variantsEnabled ||
    (isDefaultSelection
      ? hasDefaultPhoto
      : selectedVariant !== null && selectedVariant.available !== false);

  const purchasable =
    product.available === true && selectionAvailable && price > 0;

  // ========================================
  // CUSTOMIZATION
  // ========================================

  const frameMode =
    product.customizable === true && product.customerFieldType === "frame";

  const noteMode =
    product.customizable === true && product.customerFieldType === "note";

  const customerFields = Array.isArray(product.customerFields)
    ? product.customerFields
    : [];

  const photoLimit = Math.min(
    MAX_PHOTOS,
    Math.max(
      1,
      Number(
        customerFields.find((field) => field.key === "photos")?.maxFiles ||
          MAX_PHOTOS,
      ) || MAX_PHOTOS,
    ),
  );

  const customization = {
    mode: frameMode ? "frame" : noteMode ? "note" : "none",
    name: frameMode ? customText.trim() : "",
    date: frameMode ? customDate : "",
    message: frameMode ? customMessage.trim() : "",
    note: noteMode ? customNote.trim() : "",
    photos: frameMode
      ? photos.map((photo) => ({
          id: photo.id,
          name: photo.name,
          size: photo.size,
          url: photo.url,
        }))
      : [],
  };

  const alreadyInCart =
    selectionAvailable &&
    isInCart({
      productId: product._id,
      variantKey: selectedVariant?.key || "",
      packaging: effectivePackaging,
      customization,
    });

  const productInCart = cartList.some(
    (item) => String(item.productId || item.id) === String(product._id),
  );

  // ========================================
  // DEFAULT / VARIANT EVENTS
  // ========================================

  const resetZoom = () => {
    setZoom(false);
    setZoomPosition("50% 50%");
  };

  const chooseDefault = () => {
    if (!hasDefaultPhoto) return;

    updateForm({
      selectedVariantKey: "",
      selectedThumbnailId: defaultThumbnailId,
    });

    resetZoom();
  };

  const chooseOption = (type, label) => {
    const matching = variants.filter(
      (variant) =>
        variant.available !== false && variant.options?.[type] === label,
    );

    const score = (variant) =>
      optionGroups.reduce(
        (sum, group) =>
          sum +
          (group.type !== type &&
          variant.options?.[group.type] === selectedOptions[group.type]
            ? 1
            : 0),
        0,
      );

    const next = matching.reduce(
      (best, candidate) =>
        !best || score(candidate) > score(best) ? candidate : best,
      null,
    );

    if (!next) return;

    updateForm({
      selectedVariantKey: next.key,
      selectedThumbnailId: getVariantThumbnailId(next, thumbnails),
    });

    resetZoom();
  };

  const chooseThumbnail = (thumbnail) => {
    updateForm(selectionForThumbnail(thumbnail, variants));

    resetZoom();
  };

  const scrollThumbnails = (direction) => {
    const strip = thumbnailStripRef.current;
    if (!strip) return;

    strip.scrollBy({
      left: direction * Math.max(120, strip.clientWidth * 0.75),
      behavior: getScrollBehavior(),
    });
  };

  // ========================================
  // IMAGE UPLOAD
  // ========================================

  const handleFileChange = async (event) => {
    const incoming = Array.from(event.target.files || []);
    event.target.value = "";

    if (!incoming.length || uploading) return;

    setFileError("");

    const apiKey = import.meta.env.VITE_IMGBB_API_KEY;

    if (!apiKey) {
      setFileError("Image Upload API Key পাওয়া যায়নি।");
      return;
    }

    const remaining = photoLimit - photos.length;

    if (remaining <= 0) {
      setFileError(`সর্বোচ্চ ${photoLimit}টি ছবি যোগ করা যাবে।`);
      return;
    }

    const seen = new Set(photos.map((photo) => `${photo.name}-${photo.size}`));

    const accepted = [];
    const errors = [];

    for (const file of incoming) {
      try {
        validateFile(file);

        const signature = `${file.name}-${file.size}`;

        if (seen.has(signature)) {
          throw new Error("ছবিটি আগে যোগ করা হয়েছে।");
        }

        if (accepted.length >= remaining) {
          throw new Error(`সর্বোচ্চ ${photoLimit}টি ছবি যোগ করা যাবে।`);
        }

        seen.add(signature);
        accepted.push(file);
      } catch (error) {
        errors.push(`${file.name}: ${error.message}`);
      }
    }

    if (!accepted.length) {
      setFileError(errors.join("\n"));
      return;
    }

    updateForm({});
    setUploading(true);

    try {
      for (let index = 0; index < accepted.length; index++) {
        const original = accepted[index];

        setUploadProgress(`${index + 1}/${accepted.length} · ${original.name}`);

        try {
          const readyFile = await prepareImage(original);

          if (readyFile.size > MAX_FILE_SIZE) {
            throw new Error("প্রসেস করার পরে ১০ MB ছাড়িয়েছে।");
          }

          const uploaded = await uploadToImgBB(readyFile, apiKey);

          const newPhoto = {
            id: generateId(),
            name: original.name,
            size: original.size,
            url: uploaded.url,
          };

          setField("photos", (current) => [...current, newPhoto]);
        } catch (error) {
          console.error("Customer Image Upload:", original.name, error);

          errors.push(`${original.name}: ${error?.message || "আপলোড হয়নি।"}`);
        }
      }
    } finally {
      setFileError(errors.join("\n"));
      setUploadProgress("");
      setUploading(false);
    }
  };

  const removePhoto = (photoToRemove) => {
    setField("photos", (current) =>
      current.filter((photo) =>
        photoToRemove.id
          ? photo.id !== photoToRemove.id
          : photo.url !== photoToRemove.url,
      ),
    );

    setFileError("");
  };

  // ========================================
  // WISHLIST
  // ========================================

  const favorite = isFavorite(product._id);
  const wishlistSaving = savingId === String(product._id);

  const handleWishlist = async () => {
    if (!wishlistReady || !canWishlist || savingId) return;

    try {
      const added = await toggleWishlist(product._id);

      if (typeof added === "boolean") {
        showToast(
          added
            ? "পছন্দের তালিকায় যোগ হয়েছে"
            : "পছন্দের তালিকা থেকে সরানো হয়েছে",
        );
      }
    } catch (error) {
      showToast(error.message || "Wishlist আপডেট হয়নি", "error");
    }
  };

  // ========================================
  // CART / BUY NOW
  // Default: variantKey = "", selectedOptions = {}
  // ========================================

  const cartPayload = {
    productId: product._id,
    id: product._id,
    slug: product.slug || "",
    name: product.name,
    sku: selectedVariant?.sku || product.sku || "",
    image: variantImage || gallery[0] || "",
    price,
    unitPrice: price,
    quantity,
    variantKey: selectedVariant?.key || "",
    selectedOptions: selectedVariant ? { ...selectedOptions } : {},
    packaging: effectivePackaging,
    premiumBoxPrice: packagingExtra,
    customization,
  };

  const shoppingError = () => {
    if (isAdmin) {
      return "Admin অ্যাকাউন্ট দিয়ে অর্ডার করা যাবে না।";
    }

    if (checkingRole) {
      return "অ্যাকাউন্ট যাচাই হচ্ছে।";
    }

    return "এই অ্যাকাউন্ট দিয়ে কেনাকাটা করা যাবে না।";
  };

  const handleAddToCart = async () => {
    if (!canShop) {
      showToast(shoppingError(), "error");
      return;
    }

    if (adding || buying || uploading) return;

    if (alreadyInCart) {
      navigate("/cart");
      return;
    }

    if (!purchasable) return;

    if (!cartReady) {
      Swal.fire({
        icon: "warning",
        title: "কার্ট প্রস্তুত নয়",
        text: cartError || "কার্ট সিঙ্ক সম্পন্ন হলে আবার চেষ্টা করুন।",
        confirmButtonColor: "#76258A",
      });
      return;
    }

    updateForm({});
    setAdding(true);

    try {
      const item = createCartItem(cartPayload);
      await addToCart(item);
      showToast("পণ্যটি কার্টে যোগ হয়েছে!");
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "কার্টে যোগ করা যায়নি",
        text: error.message || "আবার চেষ্টা করুন।",
        confirmButtonColor: "#76258A",
      });
    } finally {
      setAdding(false);
    }
  };

  const handleBuyNow = () => {
    if (!canShop) {
      showToast(shoppingError(), "error");
      return;
    }

    if (!purchasable || uploading || buying || adding) return;

    updateForm({});
    setBuying(true);

    try {
      const item = createCartItem(cartPayload);

      persistBuyNowItem(item);

      navigate("/checkout?mode=buy-now", {
        state: { buyNowItem: item },
      });
    } catch (error) {
      setBuying(false);
      showToast(error.message || "Checkout খোলা যায়নি।", "error");
    }
  };

  // ========================================
  // WHATSAPP
  // ========================================

  const handleWhatsApp = () => {
    const optionText = selectedVariant
      ? Object.entries(selectedOptions)
          .map(([key, value]) => `${key}: ${value}`)
          .join(", ")
      : product.variantsEnabled
        ? "Default"
        : "";

    const message = [
      "আসসালামু আলাইকুম, SokhBilash সাপোর্ট।",
      "",
      `প্রোডাক্ট: ${product.name}`,
      `SKU: ${selectedVariant?.sku || product.sku || "—"}`,
      optionText && `অপশন: ${optionText}`,
      `পরিমাণ: ${quantity}`,
      `মোট মূল্য: ${formatPrice(total)}`,
      "",
      "এই প্রোডাক্ট সম্পর্কে সাহায্য দরকার।",
    ]
      .filter(Boolean)
      .join("\n");

    if (!CONTACT.whatsapp) {
      showToast("WhatsApp সাপোর্ট উপলব্ধ নয়", "warning");
      return;
    }

    window.open(getWhatsAppUrl(message), "_blank", "noopener,noreferrer");
  };

  // ========================================
  // UI
  // ========================================

  return (
    <main className="page-bg min-h-screen pb-12">
      <div className="page-container">
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-2 py-4 text-xs text-muted sm:py-5 sm:text-sm"
        >
          <Link to="/" className="hover:text-secondary">
            হোম
          </Link>
          <span>/</span>
          <Link to="/shop" className="hover:text-secondary">
            শপ
          </Link>
          <span>/</span>
          <span className="font-medium text-primary">{product.name}</span>
        </nav>

        <section className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2 lg:gap-10">
          {/* LEFT — GALLERY */}

          <div className="min-w-0 lg:sticky lg:top-24 lg:self-start">
            <div className="section-card overflow-hidden">
              <div
                className={`relative aspect-[4/5] overflow-hidden bg-base-200 sm:aspect-[5/4] lg:aspect-[4.5/5] ${
                  zoom ? "cursor-zoom-out" : "cursor-zoom-in"
                }`}
                onMouseMove={(event) => {
                  if (window.matchMedia("(hover: hover)").matches) {
                    const rect = event.currentTarget.getBoundingClientRect();

                    const x = ((event.clientX - rect.left) / rect.width) * 100;
                    const y = ((event.clientY - rect.top) / rect.height) * 100;

                    setZoomPosition(`${x}% ${y}%`);
                    setZoom(true);
                  }
                }}
                onMouseLeave={() => setZoom(false)}
                onClick={() => setZoom((value) => !value)}
                onKeyDown={(event) => {
                  if (event.target !== event.currentTarget) return;

                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setZoom((value) => !value);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label="ছবি জুম করতে ক্লিক করুন"
              >
                {selectedImage ? (
                  <img
                    src={selectedImage}
                    alt={product.name}
                    className="size-full object-cover transition-transform duration-200"
                    style={{
                      transform: zoom ? "scale(1.8)" : "scale(1)",
                      transformOrigin: zoomPosition,
                    }}
                  />
                ) : (
                  <div className="flex size-full items-center justify-center">
                    <ImageOff size={44} className="text-muted" />
                  </div>
                )}

                <div className="absolute left-3 top-3 flex flex-wrap gap-2 sm:left-5 sm:top-5">
                  {selectedThumb?.isVariant ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-[11px] font-bold text-white shadow-md">
                      <Sparkles size={12} />
                      ভ্যারিয়েন্ট ছবি
                    </span>
                  ) : (
                    product.customizable && (
                      <span className="badge-gold">
                        <Sparkles size={12} />
                        পার্সোনালাইজড গিফট
                      </span>
                    )
                  )}
                </div>

                {canWishlist && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      void handleWishlist();
                    }}
                    disabled={!wishlistReady || Boolean(savingId)}
                    aria-label={
                      favorite ? "Wishlist থেকে সরান" : "Wishlist-এ যোগ করুন"
                    }
                    aria-pressed={favorite}
                    className={`absolute right-3 top-3 flex size-10 items-center justify-center rounded-full bg-white shadow-md transition hover:scale-105 disabled:opacity-50 sm:right-5 sm:top-5 ${
                      favorite ? "text-rose-500" : "text-primary"
                    }`}
                  >
                    {wishlistSaving ? (
                      <Loader2 size={19} className="animate-spin" />
                    ) : (
                      <Heart
                        size={19}
                        className={favorite ? "fill-rose-500" : ""}
                      />
                    )}
                  </button>
                )}

                <span className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-white/95 px-3 py-2 text-xs text-primary shadow-sm">
                  <ZoomIn size={14} />
                  জুম করতে ক্লিক করুন
                </span>
              </div>
            </div>

            {/* SINGLE-ROW THUMBNAILS */}

            {thumbnails.length > 0 && (
              <div className="mt-3 flex min-w-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => scrollThumbnails(-1)}
                  aria-label="আগের ছবিগুলো দেখুন"
                  className="flex size-8 shrink-0 items-center justify-center rounded-full border border-base-300 bg-base-100 text-secondary shadow-sm transition hover:border-secondary hover:bg-secondary/5 sm:size-9"
                >
                  <ChevronLeft size={19} />
                </button>

                <div
                  ref={thumbnailStripRef}
                  role="group"
                  aria-label="প্রোডাক্ট ও ভ্যারিয়েন্টের ছবি"
                  className="flex min-w-0 flex-1 flex-nowrap gap-2 overflow-x-auto overscroll-x-contain py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-3"
                >
                  {thumbnails.map((thumbnail) => {
                    const active = selectedThumb?.id === thumbnail.id;

                    const label = thumbnail.isVariant
                      ? `ভ্যারিয়েন্ট: ${thumbnail.labels.join(" · ")}`
                      : "প্রোডাক্ট ছবি — Default";

                    return (
                      <button
                        key={thumbnail.id}
                        data-thumbnail-id={thumbnail.id}
                        type="button"
                        onClick={() => chooseThumbnail(thumbnail)}
                        title={label}
                        aria-label={label}
                        aria-pressed={active}
                        className={`relative size-20 shrink-0 overflow-hidden rounded-xl border-2 bg-base-200 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 sm:size-24 ${
                          active
                            ? "border-secondary"
                            : "border-base-300 hover:border-secondary/60"
                        }`}
                      >
                        <img
                          src={thumbnail.url}
                          alt={
                            thumbnail.isVariant
                              ? `${product.name} — ${thumbnail.labels.join(" / ")}`
                              : product.name
                          }
                          loading="lazy"
                          className="size-full object-cover "
                        />

                        {thumbnail.isVariant && (
                          <span className="absolute bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-secondary/95 px-2 py-1 text-center text-[9px] font-bold text-white shadow-sm">
                            ভ্যারিয়েন্ট
                          </span>
                        )}

                        {active && (
                          <span className="absolute right-1 top-1 rounded-full bg-white p-1 text-secondary shadow-sm">
                            <Check size={12} />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => scrollThumbnails(1)}
                  aria-label="পরের ছবিগুলো দেখুন"
                  className="flex size-8 shrink-0 items-center justify-center rounded-full border border-base-300 bg-base-100 text-secondary shadow-sm transition hover:border-secondary hover:bg-secondary/5 sm:size-9"
                >
                  <ChevronRight size={19} />
                </button>
              </div>
            )}

            {selectedThumb?.isVariant && selectedThumb.labels.length > 0 && (
              <p className="mt-2 text-xs leading-5 text-muted">
                ভ্যারিয়েন্ট: {selectedThumb.labels.join(" / ")}
              </p>
            )}

            {/* FEATURES */}

            <div className="section-card mt-5 grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <div className="icon-box">
                  <Gift size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-primary">
                    আপনার মতো করে তৈরি
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted">
                    ছবি, নাম ও বিশেষ বার্তা যোগ করুন।
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="icon-box">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-primary">
                    যত্নসহকারে প্যাকেজিং
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted">
                    উপহার দেওয়ার উপযোগী প্যাকেজিং।
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT — PRODUCT INFORMATION */}

          <div className="min-w-0">
            <div className="flex flex-wrap gap-2">
              {product.customizable && (
                <span className="badge-gold">
                  <Sparkles size={12} />
                  কাস্টমাইজ করা যাবে
                </span>
              )}

              {product.featured && (
                <span className="badge-soft">ফিচার্ড প্রোডাক্ট</span>
              )}

              {!product.available && (
                <span className="badge-soft">বর্তমানে অনুপলব্ধ</span>
              )}
            </div>

            <h1 className="mt-4 text-2xl font-extrabold leading-snug text-primary sm:text-3xl lg:text-4xl">
              {product.name}
            </h1>

            {product.description && (
              <div className="mt-3">
                <p
                  ref={descriptionRef}
                  className="whitespace-pre-line text-sm leading-6 text-muted"
                  style={
                    descriptionExpanded
                      ? {}
                      : {
                          display: "-webkit-box",
                          WebkitLineClamp: 5,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }
                  }
                >
                  {product.description}
                </p>

                {(hasLongDescription || descriptionExpanded) && (
                  <button
                    type="button"
                    onClick={() => setDescriptionExpanded((value) => !value)}
                    className="mt-2 text-xs font-bold text-secondary hover:underline"
                  >
                    {descriptionExpanded ? "কম দেখুন ↑" : "আরও দেখুন ↓"}
                  </button>
                )}
              </div>
            )}

            {/* PRICE */}

            <div className="mt-6 rounded-2xl border border-base-300 bg-base-200 p-4 sm:p-5">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-3xl font-extrabold text-primary sm:text-4xl">
                  {formatPrice(price)}
                </span>

                {showOriginalPrice && (
                  <>
                    <span className="text-sm text-muted line-through">
                      {formatPrice(comparisonPrice)}
                    </span>
                    {discount > 0 && (
                      <span className="badge-gold">{discount}% ছাড়</span>
                    )}
                  </>
                )}
              </div>

              <p className="mt-2 text-xs leading-5 text-muted">
                {product.variantsEnabled && (
                  <>
                    {isDefaultSelection ? "Default মূল্য" : "ভ্যারিয়েন্ট মূল্য"}
                    : {formatPrice(variantPrice)}।{" "}
                  </>
                )}
                {hasSale && (
                  <>
                    বেস অফার মূল্য: {formatPrice(salePrice)} · নিয়মিত মূল্য:{" "}
                    {formatPrice(regularPrice)}।{" "}
                  </>
                )}
                {packagingExtra > 0 && (
                  <>প্রিমিয়াম বক্স: +{formatPrice(packagingExtra)}। </>
                )}
                নির্বাচিত অপশন ও প্যাকেজিং অনুযায়ী মূল্য পরিবর্তন হবে।
              </p>
            </div>

            {/* VARIANT OPTIONS — DEFAULT FIRST */}

            {optionGroups.map((group, index) => (
              <div className="mt-6" key={group.type}>
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-sm font-bold text-primary sm:text-base">
                    {index + 1}.{" "}
                    {group.type === "size"
                      ? "সাইজ বেছে নাও"
                      : group.type === "color"
                        ? "কালার বেছে নাও"
                        : "ডিজাইন / টাইপ বেছে নাও"}
                  </h2>

                  <span className="text-xs text-muted">
                    {group.type.toUpperCase()}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={chooseDefault}
                    disabled={!hasDefaultPhoto}
                    aria-pressed={isDefaultSelection}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-3 text-xs font-medium transition sm:px-4 sm:text-sm ${
                      isDefaultSelection
                        ? "border-secondary bg-secondary/5 text-primary ring-1 ring-secondary"
                        : "border-base-300 text-muted hover:border-secondary/50"
                    } disabled:cursor-not-allowed disabled:opacity-40`}
                  >
                    Default
                    {isDefaultSelection && (
                      <Check size={14} className="text-secondary" />
                    )}
                  </button>

                  {group.values.map((option) => {
                    const selected =
                      !isDefaultSelection &&
                      selectedOptions[group.type] === option.label;

                    const available = variants.some(
                      (variant) =>
                        variant.available !== false &&
                        variant.options?.[group.type] === option.label,
                    );

                    return (
                      <button
                        type="button"
                        key={option.id || option.label}
                        disabled={!available}
                        onClick={() => chooseOption(group.type, option.label)}
                        aria-pressed={selected}
                        className={`flex items-center gap-2 rounded-xl border px-3 py-3 text-xs font-medium transition sm:px-4 sm:text-sm ${
                          selected
                            ? "border-secondary bg-secondary/5 text-primary ring-1 ring-secondary"
                            : "border-base-300 text-muted hover:border-secondary/50"
                        } disabled:cursor-not-allowed disabled:opacity-40`}
                      >
                        {group.type === "color" && (
                          <span
                            className="size-4 shrink-0 rounded-full border border-black/10"
                            style={{
                              backgroundColor: getColorCode(option.label),
                            }}
                          />
                        )}

                        {option.label}

                        {selected && (
                          <Check size={14} className="text-secondary" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {product.variantsEnabled && (
              <p className="mt-3 text-xs text-muted">
                {isDefaultSelection ? "Default SKU:" : "Variant SKU:"}{" "}
                <span className="font-semibold text-secondary">
                  {isDefaultSelection
                    ? product.sku || "—"
                    : selectedVariant?.sku || "—"}
                </span>
              </p>
            )}

            {!purchasable && (
              <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">
                {product.available !== true
                  ? "এই প্রোডাক্টটি বর্তমানে অনুপলব্ধ।"
                  : product.variantsEnabled &&
                      isDefaultSelection &&
                      !hasDefaultPhoto
                    ? "Default ছবি পাওয়া যায়নি। অন্য একটি উপলব্ধ অপশন বেছে নিন।"
                    : "নির্বাচিত অপশনটি বর্তমানে কেনার জন্য উপলব্ধ নয়।"}
              </p>
            )}

            {/* FRAME CUSTOMIZATION */}

            {frameMode && (
              <>
                <div className="mt-6">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h2 className="text-sm font-bold text-primary sm:text-base">
                        আপনার ছবি আপলোড করুন
                      </h2>
                      <p className="mt-1 text-xs text-muted">
                        একসঙ্গে একাধিক ছবি নির্বাচন করতে পারবেন।
                      </p>
                    </div>
                    <span className="badge-soft">
                      {photos.length}/{photoLimit} ছবি
                    </span>
                  </div>

                  <label
                    className={`mt-3 flex items-center gap-3 rounded-xl border border-dashed p-3 transition sm:p-4 ${
                      photos.length >= photoLimit || uploading
                        ? "cursor-not-allowed border-base-300 opacity-60"
                        : "cursor-pointer border-base-300 bg-base-200/60 hover:border-secondary"
                    }`}
                  >
                    <span className="icon-box">
                      {uploading ? (
                        <Loader2 size={20} className="animate-spin" />
                      ) : (
                        <ImagePlus size={20} />
                      )}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold text-primary">
                        {uploading
                          ? "ছবি আপলোড হচ্ছে..."
                          : photos.length >= photoLimit
                            ? "সর্বোচ্চ ছবি যোগ হয়েছে"
                            : "ছবি নির্বাচন করুন"}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-muted">
                        JPG, PNG, WebP, JFIF, GIF, HEIC, HEIF, AVIF, BMP
                      </span>
                      <span className="mt-0.5 block text-[11px] text-muted">
                        প্রতি ছবি সর্বোচ্চ ১০ MB
                      </span>
                    </span>

                    <span className="btn-outline-brand rounded-lg px-3 py-2 text-xs">
                      <Upload size={14} />
                      Browse
                    </span>

                    <input
                      type="file"
                      accept={IMAGE_ACCEPT}
                      multiple
                      disabled={photos.length >= photoLimit || uploading}
                      onChange={handleFileChange}
                      className="sr-only"
                    />
                  </label>

                  {uploading && (
                    <div
                      role="status"
                      className="mt-3 flex items-center gap-2 rounded-lg bg-secondary/5 p-3 text-xs text-secondary"
                    >
                      <Loader2 size={16} className="shrink-0 animate-spin" />
                      <span className="min-w-0 break-all">
                        {uploadProgress}
                      </span>
                    </div>
                  )}

                  <p className="mt-2 text-xs text-muted">
                    ছবি আপলোড ঐচ্ছিক। ছবি না দিলেও কার্টে যোগ করা যাবে।
                  </p>

                  {fileError && (
                    <div
                      role="alert"
                      className="mt-3 whitespace-pre-wrap break-words rounded-xl border border-red-100 bg-red-50 p-3 text-xs leading-6 text-red-700"
                    >
                      {fileError}
                    </div>
                  )}

                  {photos.length > 0 && (
                    <div className="mt-4 rounded-xl border border-base-300 p-3 sm:p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-sm font-bold text-primary">
                          নির্বাচিত ছবিগুলো
                        </p>
                        <span className="text-xs text-muted">
                          {photos.length}টি ছবি
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                        {photos.map((photo) => (
                          <div
                            key={photo.id || photo.url}
                            className="relative min-w-0 overflow-hidden rounded-lg border border-base-300 bg-base-200"
                          >
                            <a
                              href={photo.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="ছবি বড় করে দেখুন"
                            >
                              <img
                                src={photo.url}
                                alt={photo.name}
                                className="aspect-square w-full object-cover"
                              />
                            </a>

                            <button
                              type="button"
                              onClick={() => removePhoto(photo)}
                              aria-label={`${photo.name} সরান`}
                              className="absolute right-1 top-1 flex size-7 items-center justify-center rounded-full bg-white text-red-600 shadow-sm hover:bg-red-50"
                            >
                              <Trash2 size={14} />
                            </button>

                            <p className="truncate px-1.5 py-1 text-[10px] text-primary">
                              {photo.name}
                            </p>
                            <p className="px-1.5 pb-1 text-[10px] text-muted">
                              {(
                                Number(photo.size || 0) /
                                (1024 * 1024)
                              ).toFixed(2)}{" "}
                              MB
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6">
                  <h2 className="text-sm font-bold text-primary sm:text-base">
                    খোদাইয়ের জন্য নাম ও তারিখ
                  </h2>

                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label className="form-control w-full">
                      <span className="mb-2 text-xs font-semibold text-primary">
                        নাম বা শিরোনাম
                      </span>
                      <input
                        type="text"
                        maxLength={80}
                        value={customText}
                        onChange={(event) =>
                          setField("customText", event.target.value)
                        }
                        placeholder="যেমন: অর্ণব ও প্রিয়ার গল্প"
                        className="mt-1 w-full rounded-xl border border-secondary/20 bg-secondary/5 px-4 py-3 text-sm text-primary outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/10"
                      />
                    </label>

                    <label className="form-control w-full">
                      <span className="mb-2 text-xs font-semibold text-primary">
                        বিশেষ তারিখ
                      </span>
                      <input
                        type="date"
                        value={customDate}
                        onChange={(event) =>
                          setField("customDate", event.target.value)
                        }
                        className="mt-1 w-full rounded-xl border border-secondary/20 bg-secondary/5 px-4 py-3 text-sm text-primary outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/10"
                      />
                    </label>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="flex items-start gap-3">
                    <div className="icon-box">
                      <MessageSquareText size={20} />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-primary sm:text-base">
                        ফ্রেমের নিচের খোদাই বার্তা / উইশ
                      </h2>
                      <p className="mt-1 text-xs leading-5 text-muted">
                        ফ্রেমের নিচে যে বার্তাটি খোদাই করতে চান, এখানে লিখুন।
                      </p>
                    </div>
                  </div>

                  <textarea
                    value={customMessage}
                    onChange={(event) =>
                      setField("customMessage", event.target.value)
                    }
                    maxLength={300}
                    rows={4}
                    placeholder="যেমন: আমাদের ছোট্ট গল্পটা চিরদিন সুন্দর থাকুক..."
                    className="mt-3 min-h-28 w-full resize-none rounded-xl border border-secondary/20 bg-secondary/5 px-4 py-3 text-sm leading-6 text-primary outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/10"
                  />

                  <p className="mt-2 text-right text-xs text-muted">
                    {customMessage.length}/300
                  </p>
                </div>
              </>
            )}

            {/* CUSTOM NOTE */}

            {noteMode && (
              <div className="mt-6">
                <div className="flex items-start gap-3">
                  <div className="icon-box">
                    <MessageSquareText size={20} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-primary sm:text-base">
                      বিশেষ নির্দেশনা / কাস্টম নোট
                    </h2>
                    <p className="mt-1 text-xs text-muted">
                      আপনার প্রিয় গল্প, জন্মদিনের শুভেচ্ছা কিংবা মনের বিশেষ
                      কথাগুলো আমাদের জানান।
                    </p>
                  </div>
                </div>

                <textarea
                  value={customNote}
                  onChange={(event) =>
                    setField("customNote", event.target.value)
                  }
                  maxLength={500}
                  rows={4}
                  placeholder="যেমন: প্রিয় মানুষের জন্মদিনে তার নাম, শুভেচ্ছাবার্তা ও ভালোবাসার কিছু স্মৃতি যোগ করতে চাই..."
                  className="mt-3 min-h-28 w-full resize-none rounded-xl border border-secondary/20 bg-secondary/5 px-4 py-3 text-sm leading-6 text-primary outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/10"
                />

                <p className="mt-2 text-right text-xs text-muted">
                  {customNote.length}/500
                </p>
              </div>
            )}

            {/* GIFT WRAPPING */}

            <div className="mt-7">
              <div className="mb-4">
                <div className="flex items-center gap-2">
                  <Gift size={18} className="text-secondary" />
                  <h2 className="text-sm font-bold text-primary sm:text-base">
                    প্যাকেজিং বেছে নিন
                  </h2>
                </div>
                <p className="mt-1 text-xs leading-5 text-muted">
                  আপনার উপহারটি কীভাবে সাজিয়ে দিতে চান?
                </p>
              </div>

              <div
                className={`grid gap-3 ${
                  premiumEnabled ? "grid-cols-2" : "grid-cols-1"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setField("packaging", "regular")}
                  aria-pressed={effectivePackaging === "regular"}
                  className={`group relative flex min-w-0 flex-col rounded-2xl border-2 p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                    effectivePackaging === "regular"
                      ? "border-secondary bg-secondary/5 shadow-sm"
                      : "border-base-300 bg-base-100 hover:border-secondary/40"
                  }`}
                >
                  <div className="flex w-full items-start justify-between gap-2">
                    <span
                      className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
                        effectivePackaging === "regular"
                          ? "bg-secondary text-white"
                          : "bg-base-200 text-secondary"
                      }`}
                    >
                      <ShieldCheck size={20} />
                    </span>

                    {effectivePackaging === "regular" && (
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary text-white">
                        <Check size={14} strokeWidth={2.5} />
                      </span>
                    )}
                  </div>

                  <span className="mt-3 block text-sm font-bold text-primary">
                    সাধারণ প্যাকেজিং
                  </span>
                  <span className="mt-1 block text-[11px] leading-[18px] text-muted">
                    যত্নসহকারে প্যাক করা হবে আপনার প্রিয় উপহারটি।
                  </span>
                  <span className="mt-auto block pt-3 text-sm font-bold text-secondary">
                    সম্পূর্ণ ফ্রি
                  </span>
                </button>

                {premiumEnabled && (
                  <button
                    type="button"
                    onClick={() => setField("packaging", "premium")}
                    aria-pressed={effectivePackaging === "premium"}
                    className={`group relative flex min-w-0 flex-col rounded-2xl border-2 p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                      effectivePackaging === "premium"
                        ? "border-secondary bg-secondary/5 shadow-sm"
                        : "border-base-300 bg-base-100 hover:border-secondary/40"
                    }`}
                  >
                    <div className="flex w-full items-start justify-between gap-2">
                      <span
                        className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
                          effectivePackaging === "premium"
                            ? "bg-secondary text-white"
                            : "bg-gold-soft/40 text-primary"
                        }`}
                      >
                        <Gift size={20} />
                      </span>

                      {effectivePackaging === "premium" ? (
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary text-white">
                          <Check size={14} strokeWidth={2.5} />
                        </span>
                      ) : (
                        <span className="rounded-full bg-gold-soft px-2 py-1 text-[10px] font-bold text-primary">
                          <Sparkles size={10} className="mr-1 inline" />
                          Special
                        </span>
                      )}
                    </div>

                    <span className="mt-3 block text-sm font-bold text-primary">
                      গিফট র‍্যাপিং বক্স
                    </span>
                    <span className="mt-1 block text-[11px] leading-[18px] text-muted">
                      সুন্দর র‍্যাপিংয়ে প্রিয়জনের উপহারটি হয়ে উঠুক আরও বিশেষ!
                    </span>
                    <span className="mt-auto block pt-3 text-sm font-bold text-secondary">
                      +{formatPrice(premiumBoxPrice)}
                    </span>
                  </button>
                )}
              </div>

              <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-5 text-muted">
                <Sparkles
                  size={13}
                  className="mt-0.5 shrink-0 text-secondary"
                />
                উপহার যেমনই হোক, প্রতিটি প্যাকেজিংয়ে থাকবে আমাদের যত্নের ছোঁয়া।
              </p>
            </div>

            {/* QUANTITY */}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-base-300 p-4">
              <div>
                <h2 className="text-sm font-bold text-primary">
                  পরিমাণ (Quantity)
                </h2>
                <p className="mt-1 text-xs text-muted">সর্বোচ্চ ১০টি</p>
              </div>

              <div className="flex items-center rounded-full border border-base-300">
                <button
                  type="button"
                  disabled={quantity <= 1}
                  onClick={() =>
                    setField("quantity", (value) => Math.max(1, value - 1))
                  }
                  className="flex size-10 items-center justify-center text-primary disabled:opacity-30"
                  aria-label="পরিমাণ কমাও"
                >
                  <Minus size={15} />
                </button>

                <span className="min-w-7 text-center text-sm font-bold text-primary">
                  {quantity}
                </span>

                <button
                  type="button"
                  disabled={quantity >= 10}
                  onClick={() =>
                    setField("quantity", (value) => Math.min(10, value + 1))
                  }
                  className="flex size-10 items-center justify-center text-primary disabled:opacity-30"
                  aria-label="পরিমাণ বাড়াও"
                >
                  <Plus size={15} />
                </button>
              </div>

              <div className="w-full border-t border-base-300 pt-3 sm:flex sm:items-center sm:justify-between">
                <span className="text-sm text-muted">সর্বমোট পণ্যমূল্য</span>
                <span className="text-xl font-extrabold text-primary">
                  {formatPrice(total)}
                </span>
              </div>
            </div>

            {/* CART SYNC */}

            {cartError && !cartReady && (
              <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm text-amber-900">{cartError}</p>
                <button
                  type="button"
                  onClick={retrySync}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-secondary underline"
                >
                  <RefreshCw size={13} />
                  আবার সিঙ্ক করুন
                </button>
              </div>
            )}

            {cartReady && productInCart && (
              <div className="mt-5 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-secondary/20 bg-secondary/5 px-4 py-3">
                <p className="flex items-center gap-2 text-xs font-semibold text-secondary sm:text-sm">
                  <Check size={16} />
                  এই প্রোডাক্টটি ইতিমধ্যে কার্টে আছে
                </p>
                <Link
                  to="/cart"
                  className="text-xs font-bold text-secondary underline"
                >
                  কার্ট দেখুন
                </Link>
              </div>
            )}

            {/* PURCHASE BUTTONS */}

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={
                  !canShop ||
                  !cartReady ||
                  adding ||
                  buying ||
                  uploading ||
                  (!alreadyInCart && !purchasable)
                }
                className="btn-gold flex min-h-12 min-w-0 w-full items-center justify-center gap-2 rounded-xl px-3 py-3 text-center text-xs font-bold leading-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 sm:text-sm"
              >
                {adding ? (
                  <Loader2 size={17} className="shrink-0 animate-spin" />
                ) : alreadyInCart ? (
                  <Check size={17} className="shrink-0" />
                ) : (
                  <ShoppingBag size={17} className="shrink-0" />
                )}

                <span className="min-w-0 break-words">
                  {!canShop
                    ? checkingRole
                      ? "যাচাই হচ্ছে..."
                      : "কেনাকাটার অনুমতি নেই"
                    : adding
                      ? "কার্টে যোগ হচ্ছে..."
                      : !cartReady
                        ? "কার্ট প্রস্তুত নয়"
                        : uploading
                          ? "ছবি আপলোড হচ্ছে..."
                          : alreadyInCart
                            ? "কার্টে যোগ করা আছে"
                            : !purchasable
                              ? "অনুপলব্ধ"
                              : "কার্টে যোগ করুন"}
                </span>
              </button>

              <button
                type="button"
                onClick={handleBuyNow}
                disabled={
                  !canShop || !purchasable || uploading || adding || buying
                }
                className="btn-brand flex min-h-12 min-w-0 w-full items-center justify-center gap-2 rounded-xl px-3 py-3 text-center text-xs font-bold leading-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 sm:text-sm"
              >
                {buying ? (
                  <Loader2 size={17} className="shrink-0 animate-spin" />
                ) : (
                  <Zap size={17} className="shrink-0" />
                )}

                <span className="min-w-0 break-words">
                  {buying ? "Checkout-এ যাচ্ছে..." : "এখনই কিনুন"}
                </span>

                {!buying && <ArrowRight size={15} className="shrink-0" />}
              </button>
            </div>

            {/* WHATSAPP */}

            <button
              type="button"
              onClick={handleWhatsApp}
              className="mt-4 flex w-full items-center gap-3 rounded-2xl border border-base-300 bg-base-100 p-4 text-left transition hover:border-secondary hover:bg-secondary/5"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                <MessageCircle size={22} />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-primary">
                  কোনো সমস্যা হচ্ছে?
                </span>
                <span className="mt-1 block text-xs leading-5 text-muted">
                  প্রোডাক্ট বা কাস্টমাইজেশন নিয়ে সাহায্যের জন্য WhatsApp-এ
                  যোগাযোগ করুন।
                </span>
              </span>

              <ArrowRight size={18} className="shrink-0 text-secondary" />
            </button>

            {/* DELIVERY */}

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex items-start gap-3 rounded-xl bg-base-200 p-4">
                <Truck size={20} className="shrink-0 text-secondary" />
                <div>
                  <p className="text-sm font-bold text-primary">
                    দেশজুড়ে ডেলিভারি
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted">
                    ডেলিভারি চার্জ ও সময় চেকআউটে নিশ্চিত করতে হবে।
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl bg-base-200 p-4">
                <ShieldCheck size={20} className="shrink-0 text-secondary" />
                <div>
                  <p className="text-sm font-bold text-primary">
                    নিরাপদ অর্ডার
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted">
                    অর্ডার নিশ্চিত করার আগে সব তথ্য যাচাই করুন।
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* RELATED PRODUCTS */}

        {relatedProducts.length > 0 && (
          <section className="mt-14 sm:mt-20">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <span className="badge-soft">আপনার জন্য আরও</span>
                <h2 className="mt-3 text-xl font-extrabold text-primary sm:text-2xl">
                  একই ক্যাটাগরির উপহার
                </h2>
                <p className="mt-2 text-sm text-muted">
                  আপনার পছন্দের আরও কিছু সুন্দর স্মৃতি।
                </p>
              </div>

              <Link
                to="/shop"
                className="hidden items-center gap-2 text-sm font-bold text-secondary hover:text-primary sm:flex"
              >
                সব দেখুন
                <ArrowRight size={17} />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
              {relatedProducts.map((item) => (
                <ProductCard key={item._id} product={item} />
              ))}
            </div>

            <div className="mt-6 sm:hidden">
              <Link to="/shop" className="btn-outline-brand w-full">
                সব উপহার দেখুন
                <ArrowRight size={16} />
              </Link>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

// ==========================================
// PRODUCT FETCHING
// ==========================================

export default function ProductDetails() {
  const { id } = useParams();

  const {
    data: product,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["product-details", id],
    enabled: Boolean(id),

    queryFn: async ({ signal }) => {
      const response = await fetch(
        `${API_URL}/products/${encodeURIComponent(id)}`,
        { signal },
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success || !result.product) {
        throw new Error(result.message || "প্রোডাক্ট লোড করা যায়নি।");
      }

      return result.product;
    },

    staleTime: 30 * 1000,
  });

  const { data: relatedProducts = [] } = useQuery({
    queryKey: ["related-products", product?._id],
    enabled: Boolean(product?._id),

    queryFn: async ({ signal }) => {
      const response = await fetch(
        `${API_URL}/products/${encodeURIComponent(product._id)}/related`,
        { signal },
      );

      const result = await response.json().catch(() => ({}));

      return response.ok && result.success && Array.isArray(result.products)
        ? result.products
        : [];
    },

    staleTime: 60 * 1000,
  });

  if (isLoading) {
    return (
      <main className="page-bg flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <Loader2 size={34} className="mx-auto animate-spin text-secondary" />
          <p className="mt-3 text-sm text-muted">প্রোডাক্ট লোড হচ্ছে...</p>
        </div>
      </main>
    );
  }

  if (isError || !product) {
    return (
      <main className="page-bg flex min-h-[70vh] items-center justify-center px-4">
        <div className="section-card max-w-md p-8 text-center">
          <ImageOff size={42} className="mx-auto text-secondary" />

          <h2 className="mt-4 text-lg font-bold text-primary">
            প্রোডাক্ট পাওয়া যায়নি
          </h2>

          <p className="mt-2 text-sm text-muted">
            {error?.message || "এই প্রোডাক্টটি পাওয়া যাচ্ছে না।"}
          </p>

          <button
            type="button"
            onClick={() => refetch()}
            className="btn-brand mt-5 rounded-xl px-5 py-2.5"
          >
            আবার চেষ্টা করুন
          </button>

          <Link
            to="/shop"
            className="mt-3 block text-sm font-semibold text-secondary"
          >
            শপে ফিরে যান
          </Link>
        </div>
      </main>
    );
  }

  return (
    <ProductDetailsContent
      key={product._id}
      product={product}
      relatedProducts={relatedProducts}
    />
  );
}
