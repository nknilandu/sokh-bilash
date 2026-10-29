import { useEffect, useMemo, useRef, useState } from "react";

import { Link, useNavigate, useParams } from "react-router-dom";

import { useQuery } from "@tanstack/react-query";
import Swal from "sweetalert2";

import {
  ArrowRight,
  Heart,
  Star,
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
} from "lucide-react";

// ========================================
// CONFIGURATION
// ========================================

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/$/, "");

const CART_KEY = "sokhbilash-cart";
const WISHLIST_KEY = "sokhbilash-wishlist";

const MAX_PHOTOS = 20;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// ========================================
// HELPERS
// ========================================

const formatPrice = (value) => `৳${Number(value || 0).toLocaleString("en-US")}`;

const generateId = () =>
  globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;

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

const getBasePrice = (product) =>
  Number(product?.salePrice ?? product?.regularPrice ?? 0);

const readCart = () => {
  try {
    const data = JSON.parse(localStorage.getItem(CART_KEY) || "[]");

    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

const readWishlist = () => {
  try {
    const data = JSON.parse(localStorage.getItem(WISHLIST_KEY) || "[]");

    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
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

const getFirstVariant = (product) => {
  if (!product?.variantsEnabled || !Array.isArray(product.variants)) {
    return null;
  }

  return (
    product.variants.find((variant) => variant.available !== false) ||
    product.variants[0] ||
    null
  );
};

// ========================================
// RELATED PRODUCT CARD
// ========================================

function ProductCard({ product }) {
  const image = getImageUrls(product.images)[0];

  const price = getBasePrice(product);
  const regularPrice = Number(product.regularPrice || 0);

  const discount =
    regularPrice > price && price > 0
      ? Math.round(((regularPrice - price) / regularPrice) * 100)
      : 0;

  const productLink = `/shop/${product._id}`;

  return (
    <article className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-base-300/80 bg-base-100 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
      {/* IMAGE */}

      <div className="relative aspect-square overflow-hidden bg-base-200">
        <Link
          to={productLink}
          aria-label={`${product.name} দেখুন`}
          className="block h-full w-full"
        >
          {image ? (
            <img
              src={image}
              alt={product.name}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <ImageOff size={26} className="text-muted" />
            </div>
          )}
        </Link>

        <div className="absolute left-2 top-2 flex max-w-[75%] flex-wrap gap-1">
          {product.featured && (
            <span className="badge-soft bg-secondary px-2 py-1 text-[10px] text-white shadow-sm sm:text-xs">
              ফিচার্ড
            </span>
          )}

          {discount > 0 && (
            <span className="badge-gold px-2 py-1 text-[10px] shadow-sm sm:text-xs">
              {discount}% ছাড়
            </span>
          )}
        </div>
      </div>

      {/* CARD CONTENT */}

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        {Number(product.reviewCount || 0) > 0 && (
          <div className="flex items-center gap-1 text-xs">
            <Star size={13} className="fill-amber-400 text-amber-500" />

            <span className="font-semibold text-primary">
              {Number(product.rating || 0).toFixed(1)}
            </span>

            <span className="truncate text-muted">
              ({product.reviewCount} রিভিউ)
            </span>
          </div>
        )}

        <Link
          to={productLink}
          className="mt-2 line-clamp-2 text-sm font-bold leading-5 text-primary transition hover:text-secondary sm:text-base"
        >
          {product.name}
        </Link>

        <p className="mt-1 line-clamp-2 text-xs text-muted">
          {product.description}
        </p>

        {/* PRICE */}

        <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-base font-bold text-primary sm:text-lg">
            {formatPrice(price)}
          </span>

          {discount > 0 && (
            <span className="text-xs text-muted line-through">
              {formatPrice(regularPrice)}
            </span>
          )}
        </div>

        <div className="mt-auto pt-4">
          <Link
            to={productLink}
            className="btn-brand w-full rounded-xl px-2 py-2.5 text-xs sm:text-sm"
          >
            <ShoppingBag size={15} />
            বিস্তারিত দেখুন
          </Link>
        </div>
      </div>
    </article>
  );
}

// ========================================
// PRODUCT DETAILS CONTENT
// ========================================

function ProductDetailsContent({ product, relatedProducts }) {
  const navigate = useNavigate();

  // ========================================
  // REFS
  // ========================================

  const descriptionRef = useRef(null);

  // ========================================
  // PRODUCT / VARIANT STATES
  // ========================================

  const [selectedVariantKey, setSelectedVariantKey] = useState(
    () => getFirstVariant(product)?.key || "",
  );

  const variants = useMemo(
    () =>
      product.variantsEnabled && Array.isArray(product.variants)
        ? product.variants
        : [],
    [product],
  );

  const optionGroups = useMemo(() => {
    if (!product.variantsEnabled) return [];

    return ["size", "color", "type"]
      .map((type) => ({
        type,
        enabled: product.options?.[type]?.enabled === true,
        values: product.options?.[type]?.values || [],
      }))
      .filter(
        (group) =>
          group.enabled &&
          Array.isArray(group.values) &&
          group.values.length > 0,
      );
  }, [product]);

  const gallery = useMemo(() => getImageUrls(product.images), [product]);

  const selectedVariant =
    variants.find((variant) => variant.key === selectedVariantKey) || null;

  const selectedOptions = selectedVariant?.options || {};

  const variantImage = validImageUrl(selectedVariant?.imageUrl)
    ? selectedVariant.imageUrl
    : "";

  const [selectedImage, setSelectedImage] = useState(() => {
    const first = getFirstVariant(product);

    return validImageUrl(first?.imageUrl)
      ? first.imageUrl
      : getImageUrls(product.images)[0] || "";
  });

  const thumbnails = useMemo(
    () => [...new Set([...(variantImage ? [variantImage] : []), ...gallery])],
    [variantImage, gallery],
  );

  // ========================================
  // DESCRIPTION STATES
  // ========================================

  const [descriptionExpanded, setDescriptionExpanded] = useState(false);

  const [hasLongDescription, setHasLongDescription] = useState(false);

  // Detect whether description exceeds 5 lines.
  useEffect(() => {
    if (descriptionExpanded) return;

    const element = descriptionRef.current;

    if (!element) return;

    const checkOverflow = () => {
      const isOverflowing = element.scrollHeight > element.clientHeight + 2;

      setHasLongDescription(isOverflowing);
    };

    const frame = window.requestAnimationFrame(checkOverflow);

    const observer =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(checkOverflow)
        : null;

    observer?.observe(element);

    window.addEventListener("resize", checkOverflow);

    return () => {
      window.cancelAnimationFrame(frame);
      observer?.disconnect();

      window.removeEventListener("resize", checkOverflow);
    };
  }, [product.description, descriptionExpanded]);

  // ========================================
  // WISHLIST
  // ========================================

  const [favorite, setFavorite] = useState(() =>
    readWishlist().includes(product._id),
  );

  const toggleWishlist = () => {
    const wishlist = readWishlist();

    const nextWishlist = favorite
      ? wishlist.filter((item) => item !== product._id)
      : [...new Set([...wishlist, product._id])];

    localStorage.setItem(WISHLIST_KEY, JSON.stringify(nextWishlist));

    setFavorite(!favorite);

    window.dispatchEvent(new Event("sokhbilash-wishlist-updated"));

    Swal.fire({
      title: favorite ? "Wishlist থেকে সরানো হয়েছে" : "Wishlist-এ যোগ হয়েছে",
      icon: "success",
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 1600,
    });
  };

  // ========================================
  // CUSTOMIZATION STATES
  // ========================================

  const [quantity, setQuantity] = useState(1);

  const [customText, setCustomText] = useState("");
  const [customDate, setCustomDate] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [customNote, setCustomNote] = useState("");

  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [fileError, setFileError] = useState("");
  const [uploadProgress, setUploadProgress] = useState("");

  const [packaging, setPackaging] = useState("regular");

  const [surpriseBox, setSurpriseBox] = useState(false);

  // ========================================
  // CART STATES
  // ========================================

  const [cartItems, setCartItems] = useState(readCart);

  const [adding, setAdding] = useState(false);

  // ========================================
  // IMAGE ZOOM
  // ========================================

  const [zoom, setZoom] = useState(false);

  const [zoomPosition, setZoomPosition] = useState("50% 50%");

  // ========================================
  // CART STORAGE SYNC
  // ========================================

  useEffect(() => {
    const syncCart = () => {
      setCartItems(readCart());
    };

    window.addEventListener("storage", syncCart);

    window.addEventListener("sokhbilash-cart-updated", syncCart);

    return () => {
      window.removeEventListener("storage", syncCart);

      window.removeEventListener("sokhbilash-cart-updated", syncCart);
    };
  }, []);

  // ========================================
  // CHANGE VARIANT
  // ========================================

  const chooseOption = (type, label) => {
    const matching = variants.filter(
      (variant) =>
        variant.options?.[type] === label && variant.available !== false,
    );

    // Prefer keeping the other selected options.
    const nextVariant =
      matching.find((variant) =>
        optionGroups.every(
          (group) =>
            group.type === type ||
            variant.options?.[group.type] === selectedOptions[group.type],
        ),
      ) || matching[0];

    if (!nextVariant) return;

    setSelectedVariantKey(nextVariant.key);

    const nextImage = validImageUrl(nextVariant.imageUrl)
      ? nextVariant.imageUrl
      : gallery[0] || "";

    setSelectedImage(nextImage);
    setZoom(false);
  };

  // ========================================
  // PRICE
  // ========================================

  const productPrice = getBasePrice(product);

  const variantPrice = product.variantsEnabled
    ? Number(selectedVariant?.price ?? productPrice)
    : productPrice;

  const premiumBoxPrice = Number(product.premiumBoxPrice || 0);

  const packagingExtra = packaging === "premium" ? premiumBoxPrice : 0;

  const price = variantPrice + packagingExtra;

  const total = price * quantity;

  const regularPrice = Number(product.regularPrice || 0);

  const discount =
    !product.variantsEnabled && regularPrice > productPrice && productPrice > 0
      ? Math.round(((regularPrice - productPrice) / regularPrice) * 100)
      : 0;

  const purchasable =
    product.available === true &&
    (!product.variantsEnabled ||
      (selectedVariant !== null && selectedVariant.available !== false)) &&
    price > 0;

  // ========================================
  // CUSTOMIZATION MODE
  // ========================================

  const frameMode =
    product.customizable === true && product.customerFieldType === "frame";

  const noteMode =
    product.customizable === true && product.customerFieldType === "note";

  const photoLimit = Math.min(
    MAX_PHOTOS,
    Math.max(
      1,
      Number(
        product.customerFields?.find((field) => field.key === "photos")
          ?.maxFiles || MAX_PHOTOS,
      ) || MAX_PHOTOS,
    ),
  );

  // ========================================
  // EXACT CART CONFIGURATION
  // ========================================

  const currentCustomization = {
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

  const currentPhotoUrls = currentCustomization.photos.map(
    (photo) => photo.url,
  );

  const isSameCartConfiguration = (item) => {
    if ((item.productId || item.id) !== product._id) {
      return false;
    }

    const custom = item.customization || {};

    const savedPhotoUrls = (custom.photos || []).map((photo) => photo.url);

    return (
      (item.variantKey || "") === (selectedVariant?.key || "") &&
      (item.packaging || "regular") === packaging &&
      Boolean(item.surpriseBox) ===
        Boolean(product.surpriseBox && surpriseBox) &&
      (custom.mode || "none") === currentCustomization.mode &&
      (custom.name || "") === currentCustomization.name &&
      (custom.date || "") === currentCustomization.date &&
      (custom.message || "") === currentCustomization.message &&
      (custom.note || "") === currentCustomization.note &&
      JSON.stringify(savedPhotoUrls) === JSON.stringify(currentPhotoUrls)
    );
  };

  const alreadyInCart = cartItems.some(isSameCartConfiguration);

  // ========================================
  // IMGBB UPLOAD
  // ========================================

  const handleFileChange = async (event) => {
    const incoming = Array.from(event.target.files || []);

    event.target.value = "";
    setFileError("");

    if (!incoming.length || uploading) return;

    const apiKey = import.meta.env.VITE_IMGBB_API_KEY;

    if (!apiKey) {
      setFileError("Image Upload API Key পাওয়া যায়নি।");
      return;
    }

    const remaining = photoLimit - photos.length;

    if (remaining <= 0) {
      setFileError(`সর্বোচ্চ ${photoLimit}টি ছবি দেওয়া যাবে।`);
      return;
    }

    const accepted = [];
    const errors = [];

    const seen = new Set(photos.map((photo) => `${photo.name}-${photo.size}`));

    for (const file of incoming) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        errors.push(`${file.name}: শুধু JPG, PNG, WebP দিন।`);
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: সর্বোচ্চ ১০ MB।`);
        continue;
      }

      const signature = `${file.name}-${file.size}`;

      if (seen.has(signature)) {
        errors.push(`${file.name}: ছবিটি আগে যোগ করা হয়েছে।`);
        continue;
      }

      if (accepted.length >= remaining) {
        errors.push(`সর্বোচ্চ ${photoLimit}টি ছবি দেওয়া যাবে।`);
        break;
      }

      seen.add(signature);
      accepted.push(file);
    }

    if (!accepted.length) {
      setFileError(errors.join(" "));
      return;
    }

    setUploading(true);

    for (let index = 0; index < accepted.length; index++) {
      const file = accepted[index];

      setUploadProgress(`${index + 1}/${accepted.length} আপলোড হচ্ছে...`);

      try {
        const imageData = new FormData();

        imageData.append("image", file);

        const response = await fetch(
          `https://api.imgbb.com/1/upload?key=${encodeURIComponent(apiKey)}`,
          {
            method: "POST",
            body: imageData,
          },
        );

        const result = await response.json().catch(() => ({}));

        if (
          !response.ok ||
          !result.success ||
          !validImageUrl(result.data?.url)
        ) {
          throw new Error("Image upload failed");
        }

        setPhotos((current) => [
          ...current,
          {
            id: generateId(),
            name: file.name,
            size: file.size,
            url: result.data.url,
          },
        ]);
      } catch (error) {
        console.error("Image Upload Error:", error);

        errors.push(`${file.name}: আপলোড হয়নি।`);
      }
    }

    setFileError(errors.join(" "));
    setUploadProgress("");
    setUploading(false);
  };

  const removePhoto = (photoId) => {
    setPhotos((current) => current.filter((photo) => photo.id !== photoId));

    setFileError("");
  };

  // ========================================
  // ADD TO CART
  // ========================================

  const handleAddToCart = async () => {
    if (alreadyInCart) {
      navigate("/cart");
      return;
    }

    if (!purchasable || uploading || adding) {
      return;
    }

    setAdding(true);

    try {
      const cartItem = {
        cartId: generateId(),

        productId: product._id,
        id: product._id,
        slug: product.slug || "",

        name: product.name,

        sku: selectedVariant?.sku || product.sku,

        image: variantImage || gallery[0] || "",

        price,
        unitPrice: price,
        quantity,

        variantKey: selectedVariant?.key || "",

        selectedOptions: product.variantsEnabled ? { ...selectedOptions } : {},

        packaging,
        premiumBoxPrice: packagingExtra,

        surpriseBox: Boolean(product.surpriseBox && surpriseBox),

        customization: currentCustomization,

        addedAt: new Date().toISOString(),
      };

      const existing = readCart();

      const updated = [...existing, cartItem];

      localStorage.setItem(CART_KEY, JSON.stringify(updated));

      setCartItems(updated);

      window.dispatchEvent(new Event("sokhbilash-cart-updated"));

      Swal.fire({
        title: "পণ্যটি কার্টে যোগ হয়েছে!",
        icon: "success",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });
    } catch (error) {
      console.error("Add To Cart Error:", error);

      Swal.fire({
        title: "কার্টে যোগ করা যায়নি।",
        icon: "error",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2500,
      });
    } finally {
      setAdding(false);
    }
  };

  // ========================================
  // WHATSAPP
  // ========================================

  const handleWhatsApp = () => {
    const optionText = Object.entries(selectedOptions)
      .map(([key, value]) => `${key}: ${value}`)
      .join(", ");

    const text = [
      "আসসালামু আলাইকুম, SokhBilash সাপোর্ট।",
      "",
      `প্রোডাক্ট: ${product.name}`,
      `SKU: ${selectedVariant?.sku || product.sku}`,
      optionText && `ভ্যারিয়েন্ট: ${optionText}`,
      `পরিমাণ: ${quantity}`,
      `মোট মূল্য: ${formatPrice(total)}`,
      "",
      "আমার এই প্রোডাক্ট সম্পর্কে সাহায্য দরকার।",
    ]
      .filter(Boolean)
      .join("\n");

    window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  // ========================================
  // JSX
  // ========================================

  return (
    <main className="page-bg min-h-screen pb-12">
      <div className="page-container">
        {/* BREADCRUMB */}

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

        {/* MAIN PRODUCT SECTION */}

        <section className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2 lg:gap-10">
          {/* LEFT: STICKY PRODUCT GALLERY */}

          <div className="min-w-0 lg:sticky lg:top-24 lg:self-start">
            {/* MAIN IMAGE */}

            <div className="section-card overflow-hidden">
              <div
                className={`relative aspect-[4/5] overflow-hidden bg-base-200 sm:aspect-[5/4] lg:aspect-[5/5] ${
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
                    className="h-full w-full object-cover transition-transform duration-200 ease-out"
                    style={{
                      transform: zoom ? "scale(1.8)" : "scale(1)",
                      transformOrigin: zoomPosition,
                    }}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <ImageOff size={44} className="text-muted" />
                  </div>
                )}

                {/* PRODUCT BADGE */}

                {product.customizable && (
                  <span className="badge-gold absolute left-3 top-3 shadow-sm sm:left-5 sm:top-5">
                    <Sparkles size={13} />
                    পার্সোনালাইজড গিফট
                  </span>
                )}

                {/* ONLY ONE WISHLIST BUTTON */}

                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    toggleWishlist();
                  }}
                  aria-label={
                    favorite ? "Wishlist থেকে সরান" : "Wishlist-এ যোগ করুন"
                  }
                  aria-pressed={favorite}
                  className="absolute right-3 top-3 flex size-10 items-center justify-center rounded-full bg-white text-primary shadow-md transition hover:scale-105 sm:right-5 sm:top-5"
                >
                  <Heart
                    size={19}
                    className={favorite ? "fill-rose-500 text-rose-500" : ""}
                  />
                </button>

                {/* ZOOM HINT */}

                <span className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-white/95 px-3 py-2 text-xs text-primary shadow-sm">
                  <ZoomIn size={14} />
                  জুম করতে ক্লিক করুন
                </span>
              </div>
            </div>

            {/* SMALL PRODUCT THUMBNAILS */}

            <div className="mt-3 grid grid-cols-4 gap-2 sm:gap-3">
              {thumbnails.map((image, index) => (
                <button
                  type="button"
                  key={`${image}-${index}`}
                  onClick={() => {
                    setSelectedImage(image);
                    setZoom(false);
                  }}
                  aria-label={`প্রোডাক্টের ছবি ${index + 1} দেখুন`}
                  aria-pressed={selectedImage === image}
                  className={`aspect-square min-w-0 overflow-hidden rounded-lg border-2 bg-base-200 transition sm:rounded-xl ${
                    selectedImage === image
                      ? "border-secondary"
                      : "border-base-300 hover:border-secondary/60"
                  }`}
                >
                  <img
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>

            {/* FEATURE HIGHLIGHTS */}

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
                    উপহার দেওয়ার উপযোগী প্যাকেজিং।
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: NORMAL PRODUCT DETAILS */}

          <div className="min-w-0">
            {/* BADGES */}

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

            {/* PRODUCT TITLE */}

            <h1 className="mt-4 text-2xl font-extrabold leading-snug text-primary sm:text-3xl lg:text-4xl">
              {product.name}
            </h1>

            {/* DESCRIPTION: MAX 5 LINES + MORE */}

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

                {hasLongDescription && (
                  <button
                    type="button"
                    onClick={() => setDescriptionExpanded((value) => !value)}
                    aria-expanded={descriptionExpanded}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-secondary transition hover:text-primary sm:text-sm"
                  >
                    {descriptionExpanded ? "কম দেখুন" : "আরও দেখুন"}

                    <span>{descriptionExpanded ? "↑" : "↓"}</span>
                  </button>
                )}
              </div>
            )}

            {/* REVIEW */}

            {Number(product.reviewCount || 0) > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                <div className="flex items-center gap-1">
                  <Star size={16} className="fill-amber-400 text-amber-500" />

                  <span className="font-bold text-primary">
                    {Number(product.rating || 0).toFixed(1)}
                  </span>
                </div>

                <span className="text-muted">
                  ({product.reviewCount} রিভিউ)
                </span>

                <span className="h-4 border-l border-base-300" />

                {product.customizable && (
                  <span className="font-medium text-secondary">
                    কাস্টমাইজ অর্ডার
                  </span>
                )}
              </div>
            )}

            {/* PRICE CARD */}

            <div className="mt-6 rounded-2xl border border-base-300 bg-base-200 p-4 sm:p-5">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-3xl font-extrabold text-primary sm:text-4xl">
                  {formatPrice(price)}
                </span>

                {discount > 0 && (
                  <>
                    <span className="text-sm text-muted line-through">
                      {formatPrice(regularPrice)}
                    </span>

                    <span className="badge-gold">{discount}% ছাড়</span>
                  </>
                )}
              </div>

              <p className="mt-2 text-xs text-muted">
                নির্বাচিত ভ্যারিয়েন্ট ও প্যাকেজিং অনুযায়ী মূল্য পরিবর্তন হবে।
              </p>
            </div>

            {/* ========================= */}
            {/* DYNAMIC VARIANT OPTIONS */}
            {/* ========================= */}

            {optionGroups.map((group, groupIndex) => (
              <div className="mt-6" key={group.type}>
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-sm font-bold text-primary sm:text-base">
                    {groupIndex + 1}.{" "}
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

                {/* COLOR OPTION */}

                {group.type === "color" ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {group.values.map((option) => {
                      const selected =
                        selectedOptions[group.type] === option.label;

                      const available = variants.some(
                        (variant) =>
                          variant.available !== false &&
                          variant.options?.[group.type] === option.label,
                      );

                      return (
                        <button
                          type="button"
                          key={option.id}
                          disabled={!available}
                          onClick={() => chooseOption(group.type, option.label)}
                          aria-pressed={selected}
                          className={`flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium transition sm:px-4 sm:text-sm ${
                            selected
                              ? "border-secondary bg-secondary/5 text-primary"
                              : "border-base-300 text-muted hover:border-secondary/50"
                          } disabled:cursor-not-allowed disabled:opacity-40`}
                        >
                          <span
                            className="size-4 rounded-full border border-black/10"
                            style={{
                              backgroundColor: getColorCode(option.label),
                            }}
                          />

                          {option.label}

                          {selected && (
                            <Check size={13} className="text-secondary" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  /* SIZE / TYPE CARDS */

                  <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-3">
                    {group.values.map((option) => {
                      const selected =
                        selectedOptions[group.type] === option.label;

                      const available = variants.some(
                        (variant) =>
                          variant.available !== false &&
                          variant.options?.[group.type] === option.label,
                      );

                      return (
                        <button
                          type="button"
                          key={option.id}
                          disabled={!available}
                          onClick={() => chooseOption(group.type, option.label)}
                          aria-pressed={selected}
                          className={`relative rounded-xl border p-3 text-left transition sm:p-4 ${
                            selected
                              ? "border-secondary bg-secondary/5 ring-1 ring-secondary"
                              : "border-base-300 hover:border-secondary/50"
                          } disabled:cursor-not-allowed disabled:opacity-40`}
                        >
                          {selected && (
                            <Check
                              size={15}
                              className="absolute right-2 top-2 text-secondary"
                            />
                          )}

                          <span className="block pr-3 text-sm font-bold text-primary">
                            {option.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}

            {/* VARIANT SKU */}

            {product.variantsEnabled && (
              <p className="mt-3 text-xs text-muted">
                Variant SKU:{" "}
                <span className="font-semibold text-secondary">
                  {selectedVariant?.sku || "—"}
                </span>
              </p>
            )}

            {!purchasable && (
              <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">
                এই প্রোডাক্ট বা নির্বাচিত ভ্যারিয়েন্ট বর্তমানে অনুপলব্ধ।
              </p>
            )}

            {/* ========================= */}
            {/* FRAME CUSTOMIZATION    */}
            {/* ========================= */}

            {frameMode && (
              <>
                {/* IMAGE UPLOAD */}

                <div className="mt-6">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h2 className="text-sm font-bold text-primary sm:text-base">
                        ৩. আপনার ছবি আপলোড করুন
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
                          ? uploadProgress
                          : photos.length >= photoLimit
                            ? "সর্বোচ্চ ছবি নির্বাচন করা হয়েছে"
                            : "ছবি নির্বাচন করুন"}
                      </span>

                      <span className="mt-1 block text-xs leading-5 text-muted">
                        JPG, PNG, WEBP · প্রতি ছবি সর্বোচ্চ ১০ MB
                      </span>
                    </span>

                    <span className="btn-outline-brand rounded-lg px-3 py-2 text-xs">
                      <Upload size={14} />
                      Browse
                    </span>

                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      disabled={photos.length >= photoLimit || uploading}
                      onChange={handleFileChange}
                      className="sr-only"
                    />
                  </label>

                  <p className="mt-2 text-xs text-muted">
                    ছবি আপলোড ঐচ্ছিক। ছবি না দিলেও কার্টে যোগ করা যাবে।
                  </p>

                  {fileError && (
                    <p
                      role="alert"
                      className="mt-2 rounded-lg bg-red-50 p-3 text-xs leading-5 text-red-700"
                    >
                      {fileError}
                    </p>
                  )}

                  {/* PHOTO PREVIEW GRID */}

                  {photos.length > 0 && (
                    <div className="mt-4 rounded-xl border border-base-300 p-3 sm:p-4">
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <p className="text-sm font-bold text-primary">
                          নির্বাচিত ছবিগুলো
                        </p>

                        <span className="text-xs text-muted">
                          {photos.length}টি ছবি
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                        {photos.map((photo) => (
                          <div
                            key={photo.id}
                            className="relative min-w-0 overflow-hidden rounded-lg border-2 border-base-300 bg-base-200"
                          >
                            <img
                              src={photo.url}
                              alt={photo.name}
                              className="aspect-square w-full object-cover"
                            />

                            <button
                              type="button"
                              onClick={() => removePhoto(photo.id)}
                              aria-label={`${photo.name} সরান`}
                              className="absolute right-1 top-1 flex size-7 items-center justify-center rounded-full bg-white text-red-600 shadow-sm hover:bg-red-50"
                            >
                              <Trash2 size={14} />
                            </button>

                            <p className="truncate px-1.5 py-1 text-[10px] text-primary">
                              {photo.name}
                            </p>

                            <p className="px-1.5 pb-1 text-[10px] text-muted">
                              {(photo.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* CUSTOM NAME / DATE */}

                <div className="mt-6">
                  <h2 className="text-sm font-bold text-primary sm:text-base">
                    ৪. খোদাইয়ের জন্য নাম ও তারিখ
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
                        onChange={(event) => setCustomText(event.target.value)}
                        placeholder="যেমন: অর্ণব ও প্রিয়ার গল্প"
                        className="input input-bordered w-full bg-base-100 text-sm"
                      />
                    </label>

                    <label className="form-control w-full">
                      <span className="mb-2 text-xs font-semibold text-primary">
                        বিশেষ তারিখ
                      </span>

                      <input
                        type="date"
                        value={customDate}
                        onChange={(event) => setCustomDate(event.target.value)}
                        className="input input-bordered w-full bg-base-100 text-sm"
                      />
                    </label>
                  </div>
                </div>

                {/* ENGRAVING MESSAGE */}

                <div className="mt-6">
                  <div className="flex items-start gap-3">
                    <div className="icon-box">
                      <MessageSquareText size={20} />
                    </div>

                    <div>
                      <h2 className="text-sm font-bold text-primary sm:text-base">
                        ৫. ফ্রেমের নিচের খোদাই বার্তা / উইশ
                      </h2>

                      <p className="mt-1 text-xs leading-5 text-muted">
                        ফ্রেমের নিচে যে বিশেষ বার্তাটি খোদাই করতে চান, এখানে
                        নোটের মতো লিখুন।
                      </p>
                    </div>
                  </div>

                  <textarea
                    value={customMessage}
                    onChange={(event) => setCustomMessage(event.target.value)}
                    maxLength={300}
                    rows={4}
                    placeholder="যেমন: আমাদের ছোট্ট গল্পটা চিরদিন এমনই সুন্দর থাকুক..."
                    className="textarea textarea-bordered mt-3 min-h-28 w-full resize-y bg-base-100 text-sm leading-6"
                  />

                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="text-xs text-muted">
                      খোদাইয়ের জন্য আপনার পছন্দের বার্তা লিখুন।
                    </span>

                    <span className="shrink-0 text-xs text-muted">
                      {customMessage.length}/300
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* CUSTOM NOTE MODE */}

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

                    <p className="mt-1 text-xs leading-5 text-muted">
                      আপনার পছন্দ অনুযায়ী নির্দেশনা লিখুন।
                    </p>
                  </div>
                </div>

                <textarea
                  value={customNote}
                  onChange={(event) => setCustomNote(event.target.value)}
                  maxLength={500}
                  rows={4}
                  placeholder="আপনার বিশেষ নির্দেশনা লিখুন..."
                  className="textarea textarea-bordered mt-3 min-h-28 w-full resize-y bg-base-100 text-sm leading-6"
                />

                <p className="mt-2 text-right text-xs text-muted">
                  {customNote.length}/500
                </p>
              </div>
            )}

            {/* ========================= */}
            {/* PACKAGING               */}
            {/* ========================= */}

            <div className="mt-6">
              <h2 className="text-sm font-bold text-primary sm:text-base">
                গিফট বক্স প্যাকেজিং
              </h2>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPackaging("regular")}
                  aria-pressed={packaging === "regular"}
                  className={`relative rounded-xl border p-3 text-left transition sm:p-4 ${
                    packaging === "regular"
                      ? "border-secondary bg-secondary/5 ring-1 ring-secondary"
                      : "border-base-300 hover:border-secondary/50"
                  }`}
                >
                  <span className="block text-sm font-bold text-primary">
                    Regular Box
                  </span>

                  <span className="mt-2 block text-xs font-bold text-secondary">
                    ফ্রি
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setPackaging("premium")}
                  aria-pressed={packaging === "premium"}
                  className={`relative rounded-xl border p-3 text-left transition sm:p-4 ${
                    packaging === "premium"
                      ? "border-secondary bg-secondary/5 ring-1 ring-secondary"
                      : "border-base-300 hover:border-secondary/50"
                  }`}
                >
                  <span className="block text-sm font-bold text-primary">
                    Premium Box
                  </span>

                  <span className="mt-2 block text-xs font-bold text-secondary">
                    +{formatPrice(premiumBoxPrice)}
                  </span>
                </button>
              </div>
            </div>

            {/* SURPRISE BOX */}

            {product.surpriseBox && (
              <label className="mt-5 flex cursor-pointer items-center gap-3 rounded-xl border border-base-300 bg-base-200/60 p-4">
                <input
                  type="checkbox"
                  checked={surpriseBox}
                  onChange={(event) => setSurpriseBox(event.target.checked)}
                  className="checkbox checkbox-sm checkbox-secondary"
                />

                <span className="text-sm font-semibold text-primary">
                  সারপ্রাইজ বক্স হিসেবে প্রস্তুত করুন
                </span>
              </label>
            )}

            {/* ========================= */}
            {/* QUANTITY                */}
            {/* ========================= */}

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
                  onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                  aria-label="পরিমাণ কমাও"
                  className="flex size-10 items-center justify-center text-primary disabled:opacity-30"
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
                    setQuantity((value) => Math.min(10, value + 1))
                  }
                  aria-label="পরিমাণ বাড়াও"
                  className="flex size-10 items-center justify-center text-primary disabled:opacity-30"
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

            {/* ========================= */}
            {/* ACTION BUTTONS          */}
            {/* ========================= */}

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {/* ADD TO CART */}

              <button
                type="button"
                onClick={handleAddToCart}
                disabled={
                  !alreadyInCart && (!purchasable || uploading || adding)
                }
                className="btn-gold min-h-12 w-full rounded-xl px-4 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                {adding ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : alreadyInCart ? (
                  <Check size={18} />
                ) : (
                  <ShoppingBag size={18} />
                )}

                {alreadyInCart
                  ? "Added to Cart"
                  : adding
                    ? "যোগ হচ্ছে..."
                    : uploading
                      ? "ছবি আপলোড হচ্ছে..."
                      : !purchasable
                        ? "অনুপলব্ধ"
                        : "কার্টে যোগ করুন"}
              </button>

              {/* MAKE A BOX */}

              <Link
                to="/make-box"
                className="btn-brand min-h-12 w-full rounded-xl px-4 text-sm"
              >
                <Gift size={17} />
                Make a Box
              </Link>
            </div>

            {/* WHATSAPP HELP */}

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
                  প্রোডাক্ট বা কাস্টমাইজেশন নিয়ে সাহায্যের জন্য WhatsApp-এ
                  যোগাযোগ করুন।
                </span>
              </span>

              <ArrowRight size={18} className="shrink-0 text-secondary" />
            </button>

            {/* DELIVERY INFO */}

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex items-start gap-3 rounded-xl bg-base-200 p-4">
                <Truck size={20} className="shrink-0 text-secondary" />

                <div>
                  <p className="text-sm font-bold text-primary">
                    দেশজুড়ে ডেলিভারি
                  </p>

                  <p className="mt-1 text-xs leading-5 text-muted">
                    ডেলিভারি চার্জ ও সময় চেকআউটে নিশ্চিত করতে হবে।
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

        {/* ========================= */}
        {/* RELATED PRODUCTS         */}
        {/* ========================= */}

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
                className="hidden items-center gap-2 text-sm font-bold text-secondary transition hover:text-primary sm:flex"
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

// ========================================
// MAIN PAGE: FETCH DATA
// ========================================

export default function ProductDetails() {
  const { id } = useParams();

  // SINGLE PRODUCT API

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

  // RELATED PRODUCTS API

  const { data: relatedProducts = [] } = useQuery({
    queryKey: ["related-products", product?._id],

    enabled: Boolean(product?._id),

    queryFn: async ({ signal }) => {
      const response = await fetch(
        `${API_URL}/products/${product._id}/related`,
        { signal },
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        return [];
      }

      return result.products || [];
    },

    staleTime: 60 * 1000,
  });

  // LOADING STATE

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

  // ERROR STATE

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

  // PRODUCT DATA READY

  return (
    <ProductDetailsContent
      key={product._id}
      product={product}
      relatedProducts={relatedProducts}
    />
  );
}
