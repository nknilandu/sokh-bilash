import { useState } from "react";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";

import {
  Heart,
  ShoppingBag,
  ImageOff,
  Sparkles,
  Gift,
  Layers,
  Package,
  LoaderCircle,
} from "lucide-react";

import { useWishlist } from "../../providers/WishlistProvider";

// =====================================
// HELPERS
// =====================================

const formatPrice = (value) => `৳${Number(value || 0).toLocaleString("en-US")}`;

const toPositivePrice = (value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const price = Number(value);

  return Number.isFinite(price) && price > 0 ? price : null;
};

// =====================================
// PRODUCT IMAGE URL
// =====================================

const getProductImage = (product) => {
  const image = product.images?.[0];

  return typeof image === "string"
    ? image
    : image?.url || product.imageUrl || product.image || "";
};

// =====================================
// PRODUCT PRICE CALCULATION
// =====================================

const getProductPricing = (product) => {
  // REGULAR PRICE

  const regularPrice = toPositivePrice(product.regularPrice) || 0;

  // SALE PRICE

  const salePrice = toPositivePrice(product.salePrice);

  const hasSale =
    salePrice !== null && regularPrice > 0 && salePrice < regularPrice;

  // BASE PRICE

  const basePrice = hasSale ? salePrice : regularPrice;

  // VARIANT PRICES

  const variantsEnabled = product.variantsEnabled === true;

  const variantPrices =
    variantsEnabled && Array.isArray(product.variants)
      ? product.variants
          .filter((variant) => variant.available !== false)
          .map((variant) => toPositivePrice(variant.price))
          .filter((price) => price !== null)
      : [];

  // API PRICES

  const apiLowestPrice = toPositivePrice(product.price);

  const apiHighestPrice = toPositivePrice(product.maxPrice);

  // LOWEST / HIGHEST

  let lowestPrice = basePrice;
  let highestPrice = basePrice;

  if (variantsEnabled) {
    if (apiLowestPrice !== null) {
      lowestPrice = apiLowestPrice;

      highestPrice =
        apiHighestPrice ??
        (variantPrices.length ? Math.max(...variantPrices) : apiLowestPrice);
    } else if (variantPrices.length) {
      lowestPrice = Math.min(...variantPrices);
      highestPrice = Math.max(...variantPrices);
    }
  } else {
    lowestPrice = apiLowestPrice ?? basePrice;
    highestPrice = lowestPrice;
  }

  highestPrice = Math.max(highestPrice, lowestPrice);

  // PRICE RANGE

  const hasDifferentPrices =
    variantsEnabled && highestPrice > lowestPrice + 0.009;

  const highestWithinRegularPrice =
    regularPrice > 0 && highestPrice <= regularPrice;

  const showPriceRange = hasDifferentPrices && highestWithinRegularPrice;

  // DISCOUNT CALCULATION
  // Based on regularPrice and salePrice,
  // NOT on the lowest variant price.

  const discount = hasSale
    ? Math.round(((regularPrice - salePrice) / regularPrice) * 100)
    : 0;

  const showDiscountBadge = hasSale && discount > 0;

  return {
    lowestPrice,
    highestPrice,
    showPriceRange,

    regularPrice,
    salePrice,
    hasSale,

    discount,
    showDiscountBadge,
  };
};

// =====================================
// PRODUCT IMAGE COMPONENT
// =====================================

function ProductImage({ image, name }) {
  const [imageError, setImageError] = useState(false);

  if (!image || imageError) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-base-200 text-muted">
        <ImageOff size={28} />
      </div>
    );
  }

  return (
    <img
      src={image}
      alt={name}
      loading="lazy"
      onError={() => setImageError(true)}
      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
    />
  );
}

// =====================================
// PRODUCT FEATURES
// =====================================

function ProductFeatures({ product }) {
  const customizable = product.customizable === true;

  const surpriseBox = product.surpriseBox === true;

  const variants = product.variantsEnabled === true;

  const hasFeatures = customizable || surpriseBox || variants;

  return (
    <div className="flex min-h-6 flex-wrap items-center gap-1.5">
      {/* CUSTOMIZABLE */}

      {customizable && (
        <span className="inline-flex items-center gap-1 rounded-md bg-secondary/10 px-2 py-1 text-[10px] font-semibold text-secondary sm:text-xs">
          <Sparkles size={12} />
          কাস্টমাইজেবল
        </span>
      )}

      {/* SURPRISE BOX */}

      {surpriseBox && (
        <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700 sm:text-xs">
          <Gift size={12} />
          সারপ্রাইজ অপশন
        </span>
      )}

      {/* VARIANT */}

      {variants && (
        <span className="inline-flex items-center gap-1 rounded-md bg-base-200 px-2 py-1 text-[10px] font-semibold text-primary sm:text-xs">
          <Layers size={12} />
          ভ্যারিয়েন্ট
        </span>
      )}

      {/* NORMAL PRODUCT */}

      {!hasFeatures && (
        <span className="inline-flex items-center gap-1 rounded-md bg-base-200 px-2 py-1 text-[10px] font-medium text-muted sm:text-xs">
          <Package size={12} />
          সাধারণ গিফট
        </span>
      )}
    </div>
  );
}

// =====================================
// MAIN REUSABLE PRODUCT CARD
// =====================================

export default function ProductCard({ product, showWishlist = true }) {
  const productId = String(product?._id || product?.id || "");

  const image = getProductImage(product);

  // =====================================
  // WISHLIST - GUEST + CUSTOMER
  // =====================================

  const {
    isFavorite,
    toggleWishlist,
    ready: wishlistReady,
    canWishlist,
    savingId,
  } = useWishlist();

  // Check saved wishlist from provider.
  // Guest => localStorage
  // Customer => MongoDB

  const favorite = isFavorite(productId);

  const wishlistSaving = savingId === productId;

  const wishlistBusy = Boolean(savingId);

  // =====================================
  // TOGGLE WISHLIST
  // =====================================

  const handleWishlist = async () => {
    if (!productId || !wishlistReady || !canWishlist || wishlistBusy) {
      return;
    }

    try {
      // Provider automatically decides:
      // Guest => localStorage
      // Customer => MongoDB

      const added = await toggleWishlist(productId);

      if (typeof added !== "boolean") {
        return;
      }

      Swal.fire({
        title: added
          ? "পছন্দের তালিকায় যোগ হয়েছে"
          : "পছন্দের তালিকা থেকে সরানো হয়েছে",
        icon: "success",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 1500,
        timerProgressBar: true,
      });
    } catch (error) {
      console.error("Wishlist Update Error:", error);

      Swal.fire({
        title: "Wishlist আপডেট করা যায়নি",
        text: error?.message || "আবার চেষ্টা করুন।",
        icon: "error",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2500,
      });
    }
  };

  // =====================================
  // PRICE AND DISCOUNT
  // =====================================

  const {
    lowestPrice,
    highestPrice,
    showPriceRange,

    regularPrice,
    hasSale,

    discount,
    showDiscountBadge,
  } = getProductPricing(product);

  const productLink = `/shop/${productId}`;

  // =====================================
  // JSX
  // =====================================

  return (
    <article className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-base-300/80 bg-base-100 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
      {/* ========================= */}
      {/* PRODUCT IMAGE           */}
      {/* ========================= */}

      <div className="relative aspect-square overflow-hidden bg-base-200">
        <Link
          to={productLink}
          aria-label={`${product.name} দেখুন`}
          className="block h-full w-full"
        >
          <ProductImage
            key={image || "no-image"}
            image={image}
            name={product.name}
          />
        </Link>

        {/* ========================= */}
        {/* IMAGE BADGES            */}
        {/* ========================= */}

        <div className="absolute left-2 top-2 flex max-w-[78%] flex-wrap gap-1">
          {/* DISCOUNT */}

          {showDiscountBadge && (
            <span className="badge-gold px-2 py-1 text-[9px] shadow-sm sm:text-[10px]">
              {discount}% ছাড়
            </span>
          )}

          {/* FEATURED */}

          {product.featured && (
            <span className="badge-soft bg-secondary px-2 py-1 text-[9px] text-white shadow-sm sm:text-[10px]">
              ফিচার্ড
            </span>
          )}

          {/* UNAVAILABLE */}

          {product.available === false && (
            <span className="badge-soft bg-base-300 px-2 py-1 text-[9px] text-primary shadow-sm sm:text-[10px]">
              অনুপলব্ধ
            </span>
          )}
        </div>

        {/* ========================= */}
        {/* WISHLIST HEART BUTTON   */}
        {/* ========================= */}

        {showWishlist && canWishlist && (
          <button
            type="button"
            onClick={handleWishlist}
            disabled={!wishlistReady || wishlistBusy}
            aria-label={
              favorite ? "পছন্দের তালিকা থেকে সরান" : "পছন্দের তালিকায় যোগ করুন"
            }
            aria-pressed={favorite}
            title={favorite ? "Wishlist থেকে সরান" : "Wishlist-এ যোগ করুন"}
            className={`absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-white/95 shadow-sm transition hover:scale-110 disabled:cursor-not-allowed disabled:opacity-60 ${
              favorite ? "text-rose-500" : "text-primary"
            }`}
          >
            {wishlistSaving ? (
              <LoaderCircle size={16} className="animate-spin text-secondary" />
            ) : (
              <Heart
                size={16}
                className={favorite ? "fill-rose-500 text-rose-500" : ""}
              />
            )}
          </button>
        )}
      </div>

      {/* ========================= */}
      {/* PRODUCT DETAILS         */}
      {/* ========================= */}

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        {/* FEATURES */}

        <ProductFeatures product={product} />

        {/* PRODUCT NAME */}

        <Link
          to={productLink}
          className="mt-2 line-clamp-2 text-sm font-bold leading-5 text-primary transition hover:text-secondary sm:text-base"
        >
          {product.name}
        </Link>

        {/* DESCRIPTION */}

        <p className="mt-1 line-clamp-2 text-xs text-muted">
          {product.description}
        </p>

        {/* ========================= */}
        {/* PRICE DISPLAY            */}
        {/* ========================= */}

        <div className="mt-1">
          <div className="flex flex-wrap items-baseline gap-x-1.5">
            {/* LOWEST PRICE */}

            <span className="text-base font-bold text-primary sm:text-xl">
              {formatPrice(lowestPrice)}
            </span>

            {/* HIGHEST PRICE */}

            {showPriceRange && (
              <>
                <span className="text-sm font-semibold text-muted">–</span>

                <span className="text-base font-bold text-primary sm:text-xl">
                  {formatPrice(highestPrice)}
                </span>
              </>
            )}

            {/* REGULAR PRICE */}

            {hasSale && (
              <span className="mt-1 text-sm text-muted line-through">
                {formatPrice(regularPrice)}
              </span>
            )}
          </div>
        </div>

        {/* ========================= */}
        {/* DETAILS BUTTON          */}
        {/* ========================= */}

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
