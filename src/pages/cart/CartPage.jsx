import { useContext, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Swal from "sweetalert2";

import {
  ArrowLeft,
  ArrowRight,
  Heart,
  LockKeyhole,
  Minus,
  Plus,
  ShoppingBag,
  Tag,
  Trash2,
  Truck,
  Gift,
  ShieldCheck,
  MessageCircle,
  Loader2,
  AlertTriangle,
  ImageOff,
  RefreshCw,
  Package,
  Image as ImageIcon,
  Pencil,
  CheckCircle2,
  ChevronDown,
  PhoneCall,
} from "lucide-react";

import useCart from "../../hooks/useCart";
import CartItemEditor from "../../components/cart/CartItemEditor";
import { AuthContext } from "../../providers/AuthProvider";
import ProductCard from "../../components/product/ProductCard";
import { API_URL } from "../../utils/siteConfig";

// ==========================================
// CONFIGURATION
// ==========================================

const WISHLIST_KEY = "sokhbilash-wishlist";

const CHECKOUT_OPTIONS_KEY = "sokhbilash-checkout-gift-options";

const MAX_QUANTITY = 10;
const DELIVERY_NARSINGDI = 80;
const DELIVERY_OUTSIDE = 130;

// ==========================================
// HELPERS
// ==========================================

const formatPrice = (value) =>
  `৳${new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(Number(value) || 0)}`;

const getProductId = (item) => String(item?.productId || item?.id || "");

const getUnitPrice = (item) => {
  const price = Number(item?.unitPrice ?? item?.price ?? 0);

  return Number.isFinite(price) && price >= 0 ? price : 0;
};

const getVariantLabels = (item) => {
  const options = item?.selectedOptions || {};

  const labels = {
    size: "সাইজ",
    color: "কালার",
    type: "টাইপ",
  };

  return Object.entries(options)
    .filter(([, value]) => Boolean(value))
    .map(([key, value]) => ({
      label: labels[key] || key,
      value: String(value),
    }));
};

// ==========================================
// WISHLIST
// ==========================================

const readWishlist = () => {
  try {
    const value = JSON.parse(localStorage.getItem(WISHLIST_KEY) || "[]");

    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};

// ==========================================
// CHECKOUT GIFT MESSAGE ONLY
// ==========================================

const readCheckoutOptions = () => {
  try {
    const saved = JSON.parse(
      sessionStorage.getItem(CHECKOUT_OPTIONS_KEY) || "{}",
    );

    return {
      message:
        typeof saved?.message === "string" ? saved.message.slice(0, 250) : "",
    };
  } catch {
    return {
      message: "",
    };
  }
};

const saveCheckoutOptions = (options) => {
  try {
    const safeOptions = {
      message: String(options?.message || "").slice(0, 250),
    };

    sessionStorage.setItem(CHECKOUT_OPTIONS_KEY, JSON.stringify(safeOptions));
  } catch (error) {
    console.warn("Checkout storage error:", error);
  }
};

// ==========================================
// CUSTOMER CUSTOMIZATION ACCORDION
// ==========================================

function CustomizationAccordion({ customization }) {
  const data = customization || {};

  const photos = Array.isArray(data.photos) ? data.photos : [];

  const fields = [
    { label: "নাম", value: data.name },
    { label: "বিশেষ তারিখ", value: data.date },
    { label: "খোদাই বার্তা", value: data.message },
    { label: "বিশেষ নির্দেশনা", value: data.note },
  ].filter((field) => Boolean(field.value));

  const hasCustomization =
    data.mode === "frame" ||
    data.mode === "note" ||
    fields.length > 0 ||
    photos.length > 0;

  if (!hasCustomization) return null;

  return (
    <details className="group mt-3 min-w-0 overflow-hidden rounded-xl border border-secondary/15 bg-secondary/5">
      <summary className="flex min-w-0 cursor-pointer list-none items-center justify-between gap-2 px-2.5 py-2.5 transition-colors hover:bg-secondary/10 [&::-webkit-details-marker]:hidden">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
            <Gift size={15} />
          </span>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-bold text-primary sm:text-xs">
              কাস্টমাইজেশন
              <span className="hidden min-[360px]:inline"> ডিটেইলস</span>
            </p>

            <p className="mt-0.5 truncate text-[10px] text-muted">
              {photos.length > 0 ? `${photos.length} ছবি` : ""}

              {photos.length > 0 && fields.length > 0 && " • "}

              {fields.length > 0 ? `${fields.length} তথ্য` : ""}

              {photos.length === 0 && fields.length === 0 && "কাস্টমাইজড"}
            </p>
          </div>
        </div>

        <span className="flex shrink-0 items-center gap-1 text-secondary">
          <span className="hidden text-[10px] font-semibold min-[360px]:inline group-open:hidden">
            বিস্তারিত
          </span>

          <span className="hidden text-[10px] font-semibold min-[360px]:group-open:inline">
            লুকান
          </span>

          <ChevronDown
            size={16}
            className="shrink-0 transition-transform duration-200 group-open:rotate-180"
          />
        </span>
      </summary>

      <div className="min-w-0 space-y-3 border-t border-secondary/15 px-3 py-3">
        {fields.map((field) => (
          <div key={field.label} className="min-w-0">
            <p className="text-[11px] font-semibold text-primary">
              {field.label}
            </p>

            <p className="mt-1 whitespace-pre-wrap break-words rounded-lg bg-base-100 p-2 text-xs leading-5 text-muted">
              {field.value}
            </p>
          </div>
        ))}

        {photos.length > 0 && (
          <div className="min-w-0">
            <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold text-primary">
              <ImageIcon size={13} />
              আপলোড করা ছবি ({photos.length})
            </p>

            <div className="grid grid-cols-3 gap-2 min-[360px]:grid-cols-5 sm:grid-cols-10">
              {photos.map((photo, index) => (
                <a
                  key={photo.id || `${photo.url}-${index}`}
                  href={photo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="aspect-square overflow-hidden rounded-lg border border-base-300 bg-base-100"
                >
                  <img
                    src={photo.url}
                    alt={`Customer photo ${index + 1}`}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </a>
              ))}
            </div>
          </div>
        )}

        {fields.length === 0 && photos.length === 0 && (
          <p className="text-xs text-muted">অতিরিক্ত তথ্য দেওয়া হয়নি।</p>
        )}
      </div>
    </details>
  );
}

// ==========================================
// CART PRODUCT CARD
// ==========================================

function CartItem({
  item,
  busy,
  disabled,
  favorite,
  editing,
  savingEdit,
  onQuantityChange,
  onRemove,
  onToggleFavorite,
  onEdit,
  onCancelEdit,
  onSaveEdit,
}) {
  const productId = getProductId(item);
  const productLink = `/shop/${productId}`;

  const unitPrice = getUnitPrice(item);
  const quantity = Number(item.quantity) || 1;

  const variantOptions = getVariantLabels(item);
  const unavailable = item.unavailable === true;

  // ========================================
  // PRODUCT META
  // ========================================

  const productMeta = (
    <div className="min-w-0">
      {item.sku && (
        <p
          title={`SKU: ${item.sku}`}
          className="mt-1.5 truncate text-[10px] text-muted sm:text-[11px]"
        >
          SKU: {item.sku}
        </p>
      )}

      {item.variantTitle && (
        <p
          title={item.variantTitle}
          className="mt-1 truncate text-[10px] text-muted sm:text-[11px]"
        >
          {item.variantTitle}
        </p>
      )}

      <div className="mt-2 flex min-w-0 flex-wrap gap-1.5">
        {variantOptions.map((option) => (
          <span
            key={option.label}
            className="max-w-full break-words rounded-md border border-base-300 bg-base-200 px-2 py-1 text-[10px] leading-4 text-primary"
          >
            {option.label}: <strong>{option.value}</strong>
          </span>
        ))}

        {/* PER-PRODUCT PACKAGING */}

        <span className="inline-flex max-w-full items-center gap-1 rounded-md bg-secondary/5 px-2 py-1 text-[10px] text-secondary">
          <Package size={11} className="shrink-0" />

          {item.packaging === "premium" ? "Premium Box" : "Regular Box"}
        </span>
      </div>

      <p className="mt-2 text-[10px] text-muted sm:text-xs">
        প্রতি পিস: {formatPrice(unitPrice)}
      </p>

      {unavailable && (
        <span className="mt-2 inline-flex items-center gap-1 rounded-lg bg-red-50 px-2 py-1 text-[10px] font-semibold text-red-700">
          <AlertTriangle size={12} />
          বর্তমানে অনুপলব্ধ
        </span>
      )}
    </div>
  );

  // ========================================
  // QUANTITY CONTROLS
  // ========================================

  const quantityControl = (
    <div className="inline-flex shrink-0 items-center rounded-lg border border-base-300 bg-base-100 p-0.5">
      <button
        type="button"
        onClick={() => onQuantityChange(item.cartId, quantity - 1)}
        disabled={disabled || quantity <= 1 || unavailable}
        aria-label="পরিমাণ কমান"
        className="flex size-7 items-center justify-center rounded-md text-primary transition hover:bg-secondary/10 disabled:cursor-not-allowed disabled:opacity-30"
      >
        <Minus size={13} />
      </button>

      <span className="min-w-6 text-center text-xs font-bold text-primary">
        {busy ? (
          <Loader2 size={13} className="mx-auto animate-spin" />
        ) : (
          quantity
        )}
      </span>

      <button
        type="button"
        onClick={() => onQuantityChange(item.cartId, quantity + 1)}
        disabled={disabled || quantity >= MAX_QUANTITY || unavailable}
        aria-label="পরিমাণ বাড়ান"
        className="flex size-7 items-center justify-center rounded-md text-primary transition hover:bg-secondary/10 disabled:cursor-not-allowed disabled:opacity-30"
      >
        <Plus size={13} />
      </button>
    </div>
  );

  // ========================================
  // WISHLIST BUTTON
  // ========================================

  const wishlistButton = (
    <button
      type="button"
      onClick={() => onToggleFavorite(productId)}
      aria-label={favorite ? "Wishlist থেকে সরান" : "Wishlist-এ যোগ করুন"}
      aria-pressed={favorite}
      className="flex size-7 shrink-0 items-center justify-center rounded-full bg-base-100/95 text-primary shadow-sm transition hover:bg-secondary/10"
    >
      <Heart
        size={15}
        className={favorite ? "fill-rose-500 text-rose-500" : ""}
      />
    </button>
  );

  // ========================================
  // PRODUCT CARD UI
  // ========================================

  return (
    <article className="min-w-0 rounded-2xl border-2 border-dashed border-secondary/30 bg-base-100 p-2.5 transition-colors duration-200 hover:border-secondary/50 sm:p-4">
      <div className="flex min-w-0 items-start gap-2.5">
        {/* PRODUCT IMAGE */}

        <div className="relative size-15 shrink-0 sm:size-17">
          <Link
            to={productLink}
            aria-label={`${item.name} দেখুন`}
            className="block h-full w-full overflow-hidden rounded-xl bg-base-200"
          >
            {item.image ? (
              <img
                src={item.image}
                alt={item.name}
                loading="lazy"
                className="h-full w-full object-cover transition duration-300 hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted">
                <ImageOff size={20} />
              </div>
            )}
          </Link>

          {/* MOBILE WISHLIST */}

          <div className="absolute -right-1 -top-1 sm:hidden">
            {wishlistButton}
          </div>
        </div>

        {/* PRODUCT NAME */}

        <div className="min-w-0 flex-1">
          <Link
            to={productLink}
            className="line-clamp-2 break-words text-xs font-bold leading-5 text-primary transition hover:text-secondary sm:text-[15px]"
          >
            {item.name}
          </Link>

          <div className="hidden sm:block">{productMeta}</div>
        </div>

        {/* DESKTOP ACTIONS */}

        <div className="hidden shrink-0 flex-col items-end gap-2 sm:flex">
          {wishlistButton}

          {quantityControl}

          <p className="whitespace-nowrap text-right text-sm font-bold tabular-nums text-primary">
            {formatPrice(unitPrice * quantity)}
          </p>
        </div>
      </div>

      {/* MOBILE META */}

      <div className="min-w-0 sm:hidden">{productMeta}</div>

      {/* MOBILE QUANTITY + TOTAL */}

      <div className="mt-3 flex min-w-0 flex-wrap items-center justify-between gap-2 rounded-xl border border-base-300/60 bg-base-200/50 px-2.5 py-2.5 sm:hidden">
        <div className="shrink-0">
          <p className="mb-1 text-[10px] text-muted">পরিমাণ</p>

          {quantityControl}
        </div>

        <div className="min-w-0 text-right">
          <p className="mb-1 text-[10px] text-muted">মোট মূল্য</p>

          <p className="whitespace-nowrap text-xs font-bold tabular-nums text-primary min-[360px]:text-sm">
            {formatPrice(unitPrice * quantity)}
          </p>
        </div>
      </div>

      {/* CUSTOMIZATION */}

      <CustomizationAccordion customization={item.customization} />

      {/* EDIT / REMOVE */}

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-base-300/60 pt-3">
        <button
          type="button"
          onClick={onEdit}
          disabled={disabled}
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-secondary transition hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Pencil size={13} />
          {editing ? "এডিট চলছে" : "প্রোডাক্ট এডিট করুন"}
        </button>

        <button
          type="button"
          onClick={() => onRemove(item)}
          disabled={disabled}
          className="inline-flex items-center gap-1.5 text-[11px] text-muted transition hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Trash2 size={13} />
          কার্ট থেকে সরান
        </button>
      </div>

      {/* PRODUCT EDITOR */}

      {editing && (
        <CartItemEditor
          key={item.cartId}
          item={item}
          saving={savingEdit}
          onCancel={onCancelEdit}
          onSave={onSaveEdit}
        />
      )}

      {unavailable && item.unavailableReason && (
        <p className="mt-2 text-[11px] text-red-600">
          {item.unavailableReason}
        </p>
      )}
    </article>
  );
}

// ==========================================
// MAIN CART PAGE
// ==========================================

export default function CartPage() {
  const navigate = useNavigate();

  // ========================================
  // AUTH / ROLE
  // ========================================

  const { user, loading, role, roleLoading, accountStatus } =
    useContext(AuthContext);

  const checkingRole = loading || (Boolean(user) && roleLoading);

  const canShop =
    !checkingRole &&
    (!user || (role === "customer" && accountStatus === "active"));

  // ========================================
  // CART PROVIDER
  // ========================================

  const {
    cartItems,
    subtotal,
    totalQuantity,
    cartLoading,
    cartReady,
    cartError,
    updateQuantity,
    updateCartItem,
    removeFromCart,
    clearCart,
    retrySync,
    isGuest,
  } = useCart();

  const items = Array.isArray(cartItems) ? cartItems : [];

  // ========================================
  // STATE
  // ========================================

  const [giftOptions, setGiftOptions] = useState(readCheckoutOptions);

  const [favorites, setFavorites] = useState(readWishlist);

  const [busyCartId, setBusyCartId] = useState(null);

  const [editingCartId, setEditingCartId] = useState(null);

  const [clearing, setClearing] = useState(false);

  const [notice, setNotice] = useState({
    type: "",
    message: "",
  });

  const giftMessage = giftOptions.message;

  // ========================================
  // CALCULATIONS
  // ========================================

  const hasUnavailableItems = items.some((item) => item.unavailable === true);

  const safeSubtotal = Number(subtotal) || 0;

  const estimatedMinTotal = safeSubtotal + DELIVERY_NARSINGDI;

  const estimatedMaxTotal = safeSubtotal + DELIVERY_OUTSIDE;

  const cartBusy = Boolean(busyCartId) || clearing;

  const isEditing = editingCartId !== null;

  const canCheckout =
    canShop &&
    items.length > 0 &&
    cartReady &&
    !cartLoading &&
    !hasUnavailableItems &&
    !cartBusy &&
    !isEditing;

  // ========================================
  // SAVE CHECKOUT MESSAGE
  // ========================================

  useEffect(() => {
    saveCheckoutOptions(giftOptions);
  }, [giftOptions]);

  // ========================================
  // SYNC WISHLIST
  // ========================================

  useEffect(() => {
    const syncWishlist = () => {
      setFavorites(readWishlist());
    };

    window.addEventListener("storage", syncWishlist);

    window.addEventListener("sokhbilash-wishlist-updated", syncWishlist);

    return () => {
      window.removeEventListener("storage", syncWishlist);

      window.removeEventListener("sokhbilash-wishlist-updated", syncWishlist);
    };
  }, []);

  // ========================================
  // RECOMMENDED PRODUCTS
  // ========================================

  const { data: recommendations = [], isLoading: recommendationsLoading } =
    useQuery({
      queryKey: ["cart-recommended-products"],

      queryFn: async ({ signal }) => {
        const response = await fetch(
          `${API_URL}/products?sort=featured&page=1`,
          { signal },
        );

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(result.message || "Failed to load recommendations");
        }

        return Array.isArray(result.products) ? result.products : [];
      },

      staleTime: 60 * 1000,
      retry: 1,
    });

  const recommendedProducts = useMemo(() => {
    const cartProductIds = new Set(items.map(getProductId));

    return recommendations
      .filter(
        (product) =>
          product.available !== false &&
          !cartProductIds.has(String(product._id)),
      )
      .slice(0, 4);
  }, [recommendations, cartItems]);

  // ========================================
  // NOTICE HELPERS
  // ========================================

  const showNotice = (message, type = "success") => {
    setNotice({
      type,
      message,
    });
  };

  const clearNotice = () => {
    setNotice({
      type: "",
      message: "",
    });
  };

  // ========================================
  // UPDATE QUANTITY
  // ========================================

  const handleQuantityChange = async (cartId, quantity) => {
    if (cartBusy || isEditing || !cartReady) {
      return;
    }

    if (quantity < 1 || quantity > MAX_QUANTITY) {
      return;
    }

    setBusyCartId(cartId);
    clearNotice();

    try {
      await updateQuantity(cartId, quantity);
    } catch (error) {
      console.error("Update Quantity Error:", error);

      showNotice(error.message || "পরিমাণ আপডেট করা যায়নি।", "error");
    } finally {
      setBusyCartId(null);
    }
  };

  // ========================================
  // EDIT CART ITEM
  // ========================================

  const handleStartEdit = (cartId) => {
    if (!cartReady || cartBusy || isEditing) {
      return;
    }

    clearNotice();
    setEditingCartId(cartId);
  };

  const handleCancelEdit = () => {
    if (cartBusy) return;

    setEditingCartId(null);
  };

  const handleSaveEditedItem = async (cartId, updatedItem) => {
    if (!cartReady || cartBusy || editingCartId !== cartId) {
      throw new Error("Cart is currently busy.");
    }

    if (typeof updateCartItem !== "function") {
      throw new Error("updateCartItem is missing from CartProvider.");
    }

    setBusyCartId(cartId);
    clearNotice();

    try {
      await updateCartItem(cartId, updatedItem);

      setEditingCartId(null);

      showNotice("কার্টের প্রোডাক্ট সফলভাবে আপডেট হয়েছে।");
    } catch (error) {
      console.error("Edit Cart Item Error:", error);

      showNotice(
        error.message || "কার্টের প্রোডাক্ট আপডেট করা যায়নি।",
        "error",
      );

      throw error;
    } finally {
      setBusyCartId(null);
    }
  };

  // ========================================
  // REMOVE CART ITEM
  // ========================================

  const handleRemoveItem = async (item) => {
    if (cartBusy || isEditing || !cartReady) {
      return;
    }

    const confirmation = await Swal.fire({
      title: "কার্ট থেকে সরাতে চান?",
      text: item.name,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "হ্যাঁ, সরান",
      cancelButtonText: "বাতিল",
      confirmButtonColor: "#76258A",
      cancelButtonColor: "#64748b",
    });

    if (!confirmation.isConfirmed) return;

    if (cartBusy || isEditing || !cartReady) {
      return;
    }

    setBusyCartId(item.cartId);
    clearNotice();

    try {
      await removeFromCart(item.cartId);

      showNotice("পণ্যটি কার্ট থেকে সরানো হয়েছে।");
    } catch (error) {
      console.error("Remove Cart Item Error:", error);

      showNotice(error.message || "পণ্যটি সরানো যায়নি।", "error");
    } finally {
      setBusyCartId(null);
    }
  };

  // ========================================
  // CLEAR CART
  // ========================================

  const handleClearCart = async () => {
    if (cartBusy || isEditing || !cartReady || items.length === 0) {
      return;
    }

    const confirmation = await Swal.fire({
      title: "সম্পূর্ণ কার্ট খালি করবেন?",
      text: "কার্টে থাকা সব পণ্য সরিয়ে দেওয়া হবে।",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "হ্যাঁ, খালি করুন",
      cancelButtonText: "বাতিল",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
    });

    if (!confirmation.isConfirmed) return;

    if (cartBusy || isEditing || !cartReady) {
      return;
    }

    setClearing(true);
    clearNotice();

    try {
      await clearCart();
      setEditingCartId(null);

      showNotice("সম্পূর্ণ কার্ট খালি করা হয়েছে।");
    } catch (error) {
      console.error("Clear Cart Error:", error);

      showNotice(error.message || "কার্ট খালি করা যায়নি।", "error");
    } finally {
      setClearing(false);
    }
  };

  // ========================================
  // WISHLIST
  // ========================================

  const handleToggleFavorite = (productId) => {
    if (!productId) return;

    try {
      const current = readWishlist();

      const exists = current.includes(productId);

      const updated = exists
        ? current.filter((id) => id !== productId)
        : [...new Set([...current, productId])];

      localStorage.setItem(WISHLIST_KEY, JSON.stringify(updated));

      setFavorites(updated);

      window.dispatchEvent(new Event("sokhbilash-wishlist-updated"));

      showNotice(
        exists ? "Wishlist থেকে সরানো হয়েছে।" : "Wishlist-এ যোগ করা হয়েছে।",
      );
    } catch (error) {
      console.error("Wishlist Error:", error);

      showNotice("Wishlist আপডেট করা যায়নি।", "error");
    }
  };

  // ========================================
  // CHECKOUT
  // ========================================

  const handleCheckout = () => {
    if (!canShop || !canCheckout) {
      return;
    }

    const selectedGiftOptions = {
      message: giftOptions.message.trim().slice(0, 250),
    };

    saveCheckoutOptions(selectedGiftOptions);

    navigate("/checkout", {
      state: {
        giftOptions: selectedGiftOptions,
      },
    });
  };

  // ========================================
  // ROLE LOADING
  // ========================================

  if (checkingRole) {
    return (
      <main className="page-bg flex min-h-[65vh] items-center justify-center">
        <div className="text-center">
          <Loader2 size={28} className="mx-auto animate-spin text-secondary" />

          <p className="mt-3 text-sm text-muted">অ্যাকাউন্ট যাচাই হচ্ছে...</p>
        </div>
      </main>
    );
  }

  // ========================================
  // ADMIN / INACTIVE ACCOUNT BLOCK
  // ========================================

  if (!canShop) {
    return (
      <main className="page-bg flex min-h-[65vh] items-center justify-center px-4">
        <div className="section-card w-full max-w-md p-7 text-center">
          <LockKeyhole size={32} className="mx-auto text-secondary" />

          <h1 className="mt-4 text-xl font-bold text-primary">
            কেনাকাটার অনুমতি নেই
          </h1>

          <p className="mt-3 text-sm leading-6 text-muted">
            Admin বা নিষ্ক্রিয় অ্যাকাউন্ট দিয়ে Shopping Cart ব্যবহার করা যাবে
            না। কেনাকাটার জন্য Customer অ্যাকাউন্ট ব্যবহার করুন।
          </p>

          <Link
            to="/shop"
            className="btn-outline-brand mt-5 rounded-xl px-5 py-2.5"
          >
            পণ্য দেখুন
          </Link>
        </div>
      </main>
    );
  }

  // ========================================
  // PAGE UI
  // ========================================

  return (
    <main className="page-bg min-h-screen">
      <div className="page-container pb-10 pt-7 sm:pt-10">
        {/* BREADCRUMB */}

        <nav
          aria-label="Breadcrumb"
          className="mb-5 flex flex-wrap items-center gap-2 text-xs text-muted sm:text-sm"
        >
          <Link to="/" className="transition hover:text-secondary">
            হোম
          </Link>

          <span>/</span>

          <Link to="/shop" className="transition hover:text-secondary">
            শপ
          </Link>

          <span>/</span>

          <span className="font-semibold text-primary">আপনার শপিং কার্ট</span>
        </nav>

        {/* HEADER */}

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="badge-soft mb-3">
              <ShoppingBag size={13} />
              GIFT COLLECTION
            </span>

            <h1 className="text-2xl font-bold text-primary sm:text-3xl">
              আপনার শপিং কার্ট
            </h1>

            <p className="mt-2 text-sm text-muted">
              আপনার প্রিয় উপহারগুলো এক জায়গায় সাজানো।
            </p>
          </div>

          <Link
            to="/shop"
            className="btn-outline-brand rounded-xl px-4 py-2.5 text-sm"
          >
            <ArrowLeft size={16} />
            শপিং চালিয়ে যান
          </Link>
        </div>

        {/* CHECKOUT INFORMATION */}

        <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-secondary/10 bg-secondary/5 p-4">
          <div className="icon-box !h-10 !w-10">
            <ShieldCheck size={20} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-primary">
              নিশ্চিন্তে উপহার অর্ডার করুন
            </p>

            <p className="mt-1 text-xs leading-5 text-muted">
              পেমেন্টের পরিমাণ কম, বেশি বা সমান হলেও অর্ডার জমা দিতে পারবেন।
              প্রতিটি অর্ডার Admin ফোনে নিশ্চিত করবেন।
            </p>
          </div>

          <PhoneCall size={17} className="text-secondary" />
        </div>

        {/* CART ERROR */}

        {cartError && (
          <div
            role="alert"
            className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4"
          >
            <div className="flex items-start gap-2">
              <AlertTriangle
                size={18}
                className="mt-0.5 shrink-0 text-red-600"
              />

              <p className="text-sm text-red-700">{cartError}</p>
            </div>

            {!cartReady && (
              <button
                type="button"
                onClick={retrySync}
                className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-red-700"
              >
                <RefreshCw size={14} />
                আবার চেষ্টা করুন
              </button>
            )}
          </div>
        )}

        {/* NOTICE */}

        {notice.message && (
          <div
            role="status"
            className={`mt-4 flex items-center justify-between gap-3 rounded-xl border p-3 text-sm ${
              notice.type === "error"
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-secondary/20 bg-secondary/5 text-secondary"
            }`}
          >
            <span className="flex items-center gap-2">
              {notice.type === "error" ? (
                <AlertTriangle size={16} />
              ) : (
                <CheckCircle2 size={16} />
              )}

              {notice.message}
            </span>

            <button
              type="button"
              onClick={clearNotice}
              aria-label="নোটিশ বন্ধ করুন"
              className="shrink-0"
            >
              ✕
            </button>
          </div>
        )}

        {/* MAIN LAYOUT */}

        <div className="mt-7 grid grid-cols-1 items-start gap-6 lg:grid-cols-12 lg:gap-8">
          {/* LEFT SIDE */}

          <section className="min-w-0 space-y-5 lg:col-span-8">
            {/* CART PRODUCTS */}

            <div className="section-card overflow-hidden">
              {/* HEADER */}

              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-base-300/70 bg-base-200/70 px-4 py-4 sm:px-6">
                <div>
                  <h2 className="font-bold text-primary">কার্টের পণ্যসমূহ</h2>

                  <p className="mt-1 text-xs text-muted">
                    {totalQuantity} টি পণ্য
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {items.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearCart}
                      disabled={!cartReady || cartBusy || isEditing}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:underline disabled:opacity-50"
                    >
                      <Trash2 size={13} />

                      {clearing ? "খালি হচ্ছে..." : "কার্ট খালি করুন"}
                    </button>
                  )}

                  <Link
                    to="/shop"
                    className="text-xs font-semibold text-secondary hover:underline"
                  >
                    আরও উপহার দেখুন
                  </Link>
                </div>
              </div>

              {/* PRODUCT LIST */}

              {cartLoading ? (
                <div className="flex min-h-56 flex-col items-center justify-center px-5 py-14 text-center">
                  <Loader2 size={30} className="animate-spin text-secondary" />

                  <p className="mt-4 text-sm text-muted">কার্ট লোড হচ্ছে...</p>
                </div>
              ) : !cartReady ? (
                <div className="px-5 py-14 text-center">
                  <AlertTriangle size={34} className="mx-auto text-amber-600" />

                  <h3 className="mt-4 text-lg font-bold text-primary">
                    কার্ট লোড করা যায়নি
                  </h3>

                  <p className="mt-2 text-sm text-muted">
                    কার্ট সিঙ্ক করতে সমস্যা হয়েছে।
                  </p>

                  <button
                    type="button"
                    onClick={retrySync}
                    className="btn-brand mt-5"
                  >
                    <RefreshCw size={16} />
                    আবার চেষ্টা করুন
                  </button>
                </div>
              ) : items.length === 0 ? (
                <div className="px-5 py-15 text-center lg:py-33">
                  <div className="icon-box mx-auto mb-4 !h-16 !w-16">
                    <ShoppingBag size={27} />
                  </div>

                  <h3 className="text-lg font-bold text-primary">
                    আপনার কার্ট এখন খালি!
                  </h3>

                  <p className="mt-2 text-sm text-muted">
                    পছন্দের কাউকে উপহার দিতে শপ থেকে কিছু বেছে নিন।
                  </p>

                  <Link to="/shop" className="btn-brand mt-5">
                    উপহার খুঁজে দেখুন
                    <ArrowRight size={16} />
                  </Link>
                </div>
              ) : (
                <div className="space-y-3 bg-base-200/30 p-2 sm:space-y-4 sm:p-4">
                  {items.map((item) => (
                    <CartItem
                      key={item.cartId}
                      item={item}
                      busy={busyCartId === item.cartId}
                      disabled={!cartReady || cartBusy || isEditing}
                      favorite={favorites.includes(getProductId(item))}
                      editing={editingCartId === item.cartId}
                      savingEdit={busyCartId === item.cartId}
                      onQuantityChange={handleQuantityChange}
                      onRemove={handleRemoveItem}
                      onToggleFavorite={handleToggleFavorite}
                      onEdit={() => handleStartEdit(item.cartId)}
                      onCancelEdit={handleCancelEdit}
                      onSaveEdit={handleSaveEditedItem}
                    />
                  ))}
                </div>
              )}

              {/* CART SUBTOTAL */}

              {items.length > 0 && cartReady && (
                <div className="border-t border-base-300/70 bg-base-200/40 px-4 py-3 sm:px-6">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-muted">পণ্যের মোট মূল্য</span>

                    <span className="font-bold text-primary">
                      {formatPrice(safeSubtotal)}
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-muted">
                    নির্বাচিত Premium Box-এর চার্জ পণ্যমূল্যের মধ্যেই
                    অন্তর্ভুক্ত।
                  </p>
                </div>
              )}
            </div>

            {/* UNAVAILABLE ITEMS */}

            {hasUnavailableItems && (
              <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <AlertTriangle size={20} className="shrink-0 text-amber-700" />

                <div>
                  <h3 className="text-sm font-bold text-amber-900">
                    কিছু পণ্য বর্তমানে অনুপলব্ধ
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-amber-800">
                    চেকআউটের আগে অনুপলব্ধ পণ্যগুলো সরিয়ে ফেলুন অথবা Product
                    Details পেজ থেকে আবার নির্বাচন করুন।
                  </p>
                </div>
              </div>
            )}

            {/* GIFT MESSAGE ONLY */}

            {items.length > 0 && cartReady && (
              <section className="section-card p-4 sm:p-6">
                <div className="flex items-start gap-3">
                  <div className="icon-box">
                    <Gift size={20} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="font-bold text-primary">
                      উপহারের শুভেচ্ছা বার্তা
                    </h2>

                    <p className="mt-1 text-xs leading-5 text-muted sm:text-sm">
                      উপহারটিকে আরও বিশেষ করতে একটি সুন্দর শুভেচ্ছা বার্তা যোগ
                      করুন।
                    </p>
                  </div>
                </div>

                {/* GIFT MESSAGE */}

                <label
                  htmlFor="gift-message"
                  className="mb-2 mt-5 block text-sm font-semibold text-primary"
                >
                  আপনার শুভেচ্ছা বার্তা
                  <span className="ml-1 font-normal text-muted">(ঐচ্ছিক)</span>
                </label>

                <textarea
                  id="gift-message"
                  value={giftMessage}
                  onChange={(event) =>
                    setGiftOptions((current) => ({
                      ...current,
                      message: event.target.value.slice(0, 250),
                    }))
                  }
                  maxLength={250}
                  rows={4}
                  placeholder="যেমন: আপনার প্রতিটি দিন আনন্দে ভরে উঠুক..."
                  className="textarea textarea-bordered w-full resize-y rounded-xl border-base-300 bg-base-200/50 text-sm leading-6 text-primary placeholder:text-muted/70 focus:border-secondary focus:outline-none"
                />

                <p className="mt-2 text-right text-xs text-muted">
                  {giftMessage.length}/250 অক্ষর
                </p>
              </section>
            )}

            {/* COUPON — DISABLED */}

            {items.length > 0 && cartReady && (
              <section className="section-card p-4 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="icon-box">
                    <Tag size={19} />
                  </div>

                  <div>
                    <h2 className="font-bold text-primary">কুপন কোড</h2>

                    <p className="mt-1 text-xs text-muted">
                      কুপন সুবিধা শীঘ্রই চালু হবে।
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-dashed border-base-300 bg-base-200/50 px-4 py-3 text-xs leading-5 text-muted">
                  বর্তমানে কোনো কুপন অ্যাক্টিভ নেই। অর্ডারের মূল্যে কোনো Demo
                  Discount যোগ করা হচ্ছে না।
                </div>
              </section>
            )}
          </section>

          {/* ===================================
              RIGHT SIDE: ORDER SUMMARY
          =================================== */}

          <aside className="min-w-0 space-y-4 lg:sticky lg:top-25 lg:col-span-4">
            <section className="section-card overflow-hidden">
              <div className="border-b border-base-300/70 bg-base-200/70 px-5 py-4">
                <h2 className="text-lg font-bold text-primary">
                  অর্ডার সামারি
                </h2>

                <p className="mt-1 text-xs text-muted">
                  অর্ডারের সম্ভাব্য মোট খরচ এক নজরে।
                </p>
              </div>

              <div className="space-y-4 p-5">
                {/* PRODUCT SUBTOTAL */}

                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted">পণ্যের মূল্য</span>

                  <span className="font-semibold text-primary">
                    {formatPrice(safeSubtotal)}
                  </span>
                </div>

                {/* DELIVERY */}

                <div className="flex items-start justify-between gap-3 text-sm">
                  <span className="text-muted">ডেলিভারি চার্জ</span>

                  <span className="text-right font-semibold text-primary">
                    {items.length > 0
                      ? `${formatPrice(DELIVERY_NARSINGDI)} – ${formatPrice(
                          DELIVERY_OUTSIDE,
                        )}`
                      : "—"}
                  </span>
                </div>

                {/* DELIVERY POLICY */}

                {items.length > 0 && (
                  <div className="rounded-xl bg-secondary/5 p-3">
                    <div className="flex items-start gap-2 text-xs text-secondary">
                      <Truck size={17} className="mt-0.5 shrink-0" />

                      <div>
                        <p className="font-bold">ডেলিভারি চার্জ</p>

                        <p className="mt-1 leading-5">
                          নরসিংদী জেলার মধ্যে {formatPrice(DELIVERY_NARSINGDI)}।
                          অন্য জেলায় {formatPrice(DELIVERY_OUTSIDE)}।
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* ESTIMATED TOTAL */}

                <div className="border-t border-dashed border-base-300 pt-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-primary">সম্ভাব্য সর্বমোট</p>

                      <p className="mt-1 text-xs text-muted">
                        {totalQuantity} টি পণ্য
                      </p>
                    </div>

                    <p className="text-right text-lg font-bold text-primary sm:text-xl">
                      {items.length > 0
                        ? `${formatPrice(estimatedMinTotal)} – ${formatPrice(
                            estimatedMaxTotal,
                          )}`
                        : formatPrice(0)}
                    </p>
                  </div>

                  <p className="mt-3 text-xs leading-5 text-muted">
                    ডেলিভারি জেলা নির্বাচন এবং সার্ভার থেকে বর্তমান পণ্যমূল্য
                    যাচাই করার পরে চূড়ান্ত মোট মূল্য চেকআউটে দেখানো হবে।
                  </p>
                </div>

                {/* PAYMENT POLICY */}

                {items.length > 0 && (
                  <div className="rounded-xl border border-gold-soft/70 bg-gold-soft/15 p-3">
                    <div className="flex items-start gap-2">
                      <PhoneCall
                        size={17}
                        className="mt-0.5 shrink-0 text-secondary"
                      />

                      <div>
                        <p className="text-xs font-bold text-primary">
                          পেমেন্ট ও অর্ডার নিশ্চিতকরণ
                        </p>

                        <p className="mt-1 text-[11px] leading-5 text-muted">
                          বিকাশ, নগদ বা রকেটে কম, বেশি বা সমান টাকা পাঠালেও
                          অর্ডার করতে পারবেন। বাকি টাকা ডেলিভারিতে পরিশোধ করতে
                          হবে। অতিরিক্ত টাকা ফেরত বা সমমূল্যের পণ্য দেওয়ার
                          ব্যবস্থা করা হবে। Admin ফোনে নিশ্চিত করবেন।
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* EDITING WARNING */}

                {isEditing && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-800">
                    প্রোডাক্ট এডিট চলছে। চেকআউটের আগে পরিবর্তন Save অথবা Cancel
                    করুন।
                  </div>
                )}

                {/* CHECKOUT BUTTON */}

                <button
                  type="button"
                  disabled={!canCheckout}
                  onClick={handleCheckout}
                  className="btn-gold w-full rounded-full py-3.5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {cartLoading || cartBusy ? (
                    <Loader2 size={17} className="animate-spin" />
                  ) : (
                    <ShoppingBag size={17} />
                  )}
                  চেকআউট ও পেমেন্ট
                  <ArrowRight size={17} />
                </button>

                <div className="flex items-center justify-center gap-2 text-xs text-muted">
                  <LockKeyhole size={14} />
                  নিরাপদ চেকআউট
                </div>

                {isGuest && items.length > 0 && (
                  <p className="text-center text-xs leading-5 text-muted">
                    Guest হিসেবেও Checkout করা যাবে।
                  </p>
                )}
              </div>
            </section>

            {/* SUPPORT */}

            <div className="rounded-2xl border border-secondary/10 bg-secondary/5 p-4">
              <div className="flex items-start gap-3">
                <div className="icon-box !h-10 !w-10">
                  <MessageCircle size={18} />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-primary">
                    অর্ডার নিয়ে সাহায্য লাগবে?
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-muted">
                    গিফট কাস্টমাইজেশন বা ডেলিভারি নিয়ে আমাদের সাথে যোগাযোগ
                    করুন।
                  </p>

                  <Link
                    to="/help#contact"
                    className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-secondary hover:underline"
                  >
                    যোগাযোগ করুন
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* ====================================
            RECOMMENDED PRODUCTS
        ==================================== */}

        {(recommendationsLoading || recommendedProducts.length > 0) && (
          <section className="mt-12 sm:mt-16">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-secondary">
                  JUST FOR YOU
                </span>

                <h2 className="mt-1 text-xl font-bold text-primary sm:text-2xl">
                  আপনার উপহারের সাথে আরও কিছু
                </h2>

                <p className="mt-2 text-sm text-muted">
                  পছন্দের উপহারের সাথে মানানসই কিছু আইটেম।
                </p>
              </div>

              <Link
                to="/shop"
                className="hidden items-center gap-1 text-sm font-semibold text-secondary transition hover:text-primary sm:flex"
              >
                সব দেখুন
                <ArrowRight size={16} />
              </Link>
            </div>

            {recommendationsLoading ? (
              <div className="flex min-h-40 items-center justify-center">
                <Loader2 size={26} className="animate-spin text-secondary" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
                {recommendedProducts.map((product) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    showWishlist={true}
                  />
                ))}
              </div>
            )}

            <div className="mt-5 sm:hidden">
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
