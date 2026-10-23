
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
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
} from "lucide-react";

const MAX_IMAGES = 10;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const products = [
  {
    id: "royal-wooden-frame",
    name: "রয়্যাল উডেন পার্সোনালাইজড ফটো ফ্রেম",
    category: "photo-frame",
    price: 1200,
    oldPrice: 1500,
    rating: 4.9,
    reviews: 128,
    image:
      "https://images.unsplash.com/photo-1511988617509-a57c8a288659?auto=format&fit=crop&w=1200&q=90",
    gallery: [
      "https://images.unsplash.com/photo-1511988617509-a57c8a288659?auto=format&fit=crop&w=1200&q=90",
      "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1200&q=90",
      "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1200&q=90",
      "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?auto=format&fit=crop&w=1200&q=90",
    ],
    description: "কাঠের ফ্রেমে প্রিয় স্মৃতি, নাম ও বিশেষ তারিখ",
    badges: [
      { label: "বেস্ট সেলার", type: "popular" },
      { label: "২০% ছাড়", type: "discount" },
    ],
  },
  {
    id: "memory-photo-frame",
    name: "মেমোরি ক্লাসিক ফটো ফ্রেম",
    category: "photo-frame",
    price: 850,
    oldPrice: 1000,
    rating: 4.8,
    reviews: 86,
    image:
      "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1200&q=90",
    gallery: [
      "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1200&q=90",
      "https://images.unsplash.com/photo-1511988617509-a57c8a288659?auto=format&fit=crop&w=1200&q=90",
    ],
    description: "প্রিয় মুহূর্ত সাজিয়ে রাখুন সুন্দরভাবে",
    badges: [{ label: "জনপ্রিয়", type: "popular" }],
  },
  {
    id: "couple-memory-frame",
    name: "কাপল মেমোরি ফ্রেম",
    category: "photo-frame",
    price: 990,
    oldPrice: 1200,
    rating: 4.9,
    reviews: 74,
    image:
      "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1200&q=90",
    gallery: [
      "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1200&q=90",
      "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1200&q=90",
    ],
    description: "কাপল, অ্যানিভার্সারি ও বিশেষ দিনের উপহার",
    badges: [{ label: "কাস্টমাইজযোগ্য", type: "popular" }],
  },
  {
    id: "minimal-photo-frame",
    name: "মিনিমাল এলিগ্যান্ট ফটো ফ্রেম",
    category: "photo-frame",
    price: 750,
    oldPrice: 900,
    rating: 4.7,
    reviews: 52,
    image:
      "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?auto=format&fit=crop&w=1200&q=90",
    gallery: [
      "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?auto=format&fit=crop&w=1200&q=90",
      "https://images.unsplash.com/photo-1511988617509-a57c8a288659?auto=format&fit=crop&w=1200&q=90",
    ],
    description: "সিম্পল ডিজাইন, অসাধারণ স্মৃতির জন্য",
    badges: [{ label: "নতুন", type: "popular" }],
  },
  {
    id: "premium-wood-frame",
    name: "প্রিমিয়াম উডেন মেমোরি ফ্রেম",
    category: "photo-frame",
    price: 1450,
    oldPrice: 1750,
    rating: 4.9,
    reviews: 91,
    image:
      "https://images.unsplash.com/photo-1511988617509-a57c8a288659?auto=format&fit=crop&w=1200&q=90",
    gallery: [
      "https://images.unsplash.com/photo-1511988617509-a57c8a288659?auto=format&fit=crop&w=1200&q=90",
      "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?auto=format&fit=crop&w=1200&q=90",
    ],
    description: "বিশেষ মানুষটির জন্য প্রিমিয়াম স্মৃতির উপহার",
    badges: [{ label: "প্রিমিয়াম", type: "popular" }],
  },
];

const sizes = [
  { id: "small", name: "ছোট", dimension: "৬ × ৮ ইঞ্চি", extra: 0 },
  { id: "medium", name: "মাঝারি", dimension: "৮ × ১০ ইঞ্চি", extra: 300 },
  { id: "large", name: "বড়", dimension: "১২ × ১৬ ইঞ্চি", extra: 700 },
];

const finishes = [
  { id: "walnut", name: "ওয়ালনাট", color: "#553728" },
  { id: "oak", name: "ন্যাচারাল ওক", color: "#b58a63" },
  { id: "black", name: "ম্যাট ব্ল্যাক", color: "#343034" },
];

const formatPrice = (price) => `৳${price.toLocaleString("en-US")}`;

function ProductCard({ product }) {
  const [favorite, setFavorite] = useState(false);

  return (
    <article className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-base-300/80 bg-base-100 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="relative aspect-square overflow-hidden bg-base-200">
        <Link
          to={`/shop/${product.id}`}
          aria-label={`${product.name} দেখুন`}
          className="block h-full w-full"
        >
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </Link>

        <div className="absolute left-2 top-2 flex max-w-[75%] flex-wrap gap-1">
          {product.badges.slice(0, 2).map((badge) => (
            <span
              key={badge.label}
              className={
                badge.type === "discount"
                  ? "badge-gold px-2 py-1 text-[10px] shadow-sm sm:text-xs"
                  : "badge-soft bg-secondary px-2 py-1 text-[10px] text-white shadow-sm sm:text-xs"
              }
            >
              {badge.label}
            </span>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setFavorite(!favorite)}
          aria-label={favorite ? "পছন্দের তালিকা থেকে সরান" : "পছন্দের তালিকায় যোগ করুন"}
          aria-pressed={favorite}
          className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-white/95 text-primary shadow-sm transition hover:scale-110"
        >
          <Heart
            size={16}
            className={favorite ? "fill-rose-500 text-rose-500" : ""}
          />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <div className="flex items-center gap-1 text-xs">
          <Star size={13} className="fill-amber-400 text-amber-500" />
          <span className="font-semibold text-primary">
            {product.rating.toFixed(1)}
          </span>
          <span className="truncate text-muted">
            ({product.reviews} রিভিউ)
          </span>
        </div>

        <Link
          to={`/shop/${product.id}`}
          className="mt-2 line-clamp-2 text-sm font-bold leading-5 text-primary transition hover:text-secondary sm:text-base"
        >
          {product.name}
        </Link>

        <p className="mt-1 line-clamp-2 text-xs text-muted">
          {product.description}
        </p>

        <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-base font-bold text-primary sm:text-lg">
            {formatPrice(product.price)}
          </span>
          {product.oldPrice > product.price && (
            <span className="text-xs text-muted line-through">
              {formatPrice(product.oldPrice)}
            </span>
          )}
        </div>

        <div className="mt-auto pt-4">
          <Link
            to={`/shop/${product.id}`}
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

export default function ProductDetails({ onAddToCart }) {
  const { id } = useParams();

  const product = products.find((item) => item.id === id) || products[0];

  const [selectedImage, setSelectedImage] = useState(product.gallery[0]);
  const [frameSize, setFrameSize] = useState("medium");
  const [finish, setFinish] = useState("walnut");
  const [quantity, setQuantity] = useState(1);
  const [favorite, setFavorite] = useState(false);
  const [customText, setCustomText] = useState("");
  const [customDate, setCustomDate] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [photos, setPhotos] = useState([]);
  const [fileError, setFileError] = useState("");
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState("");
  const [zoom, setZoom] = useState(false);
  const [zoomPosition, setZoomPosition] = useState("50% 50%");

  const selectedSize = sizes.find((item) => item.id === frameSize);
  const price = product.price + selectedSize.extra;
  const total = price * quantity;

  const relatedProducts = products
    .filter(
      (item) =>
        item.category === product.category && item.id !== product.id
    )
    .slice(0, 4);

  const handleFileChange = (event) => {
    const incoming = Array.from(event.target.files || []);
    event.target.value = "";
    setFileError("");

    if (!incoming.length) return;

    const remaining = MAX_IMAGES - photos.length;

    if (remaining <= 0) {
      setFileError("সর্বোচ্চ ১০টি ছবি আপলোড করা যাবে।");
      return;
    }

    const accepted = [];
    const errors = [];

    for (const file of incoming) {
      if (!file.type.startsWith("image/")) {
        errors.push(`${file.name}: এটি ছবি ফাইল নয়।`);
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: ছবির সাইজ ১০ MB-এর বেশি।`);
        continue;
      }

      if (photos.some((item) => item.name === file.name && item.size === file.size)) {
        errors.push(`${file.name}: ছবিটি আগে নির্বাচন করা হয়েছে।`);
        continue;
      }

      if (accepted.length >= remaining) {
        errors.push("সর্বোচ্চ ১০টি ছবি নির্বাচন করা যাবে।");
        break;
      }

      accepted.push({
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
        file,
        name: file.name,
        size: file.size,
        preview: URL.createObjectURL(file),
      });
    }

    if (accepted.length) {
      setPhotos((current) => [...current, ...accepted]);
    }

    if (errors.length) {
      setFileError(errors.join(" "));
    }
  };

  const removePhoto = (photoId) => {
    setPhotos((current) => {
      const photoToRemove = current.find((item) => item.id === photoId);
      if (photoToRemove) URL.revokeObjectURL(photoToRemove.preview);
      return current.filter((item) => item.id !== photoId);
    });
    setFileError("");
  };

  const handleAddToCart = async () => {
    setAdding(true);
    setMessage("");

    try {
      const item = {
        id: product.id,
        name: product.name,
        image: product.image,
        price,
        quantity,
        frameSize,
        finish,
        customText,
        customDate,
        customMessage,
        photos: photos.map(({ file, name, size }) => ({
          file,
          name,
          size,
        })),
      };

      if (onAddToCart) {
        await onAddToCart(item);
      } else {
        const savedItem = {
          ...item,
          photos: photos.map(({ name, size }) => ({ name, size })),
        };

        const existing = JSON.parse(
          localStorage.getItem("sokhbilash-cart") || "[]"
        );

        localStorage.setItem(
          "sokhbilash-cart",
          JSON.stringify([...existing, savedItem])
        );
      }

      setMessage("পণ্যটি কার্টে যোগ হয়েছে!");
    } catch {
      setMessage("কার্টে যোগ করা যায়নি। আবার চেষ্টা করো।");
    } finally {
      setAdding(false);
    }
  };

  const handleWhatsApp = () => {
    const text = [
      "আসসালামু আলাইকুম, Sokhbilash সাপোর্ট।",
      "",
      `প্রোডাক্ট: ${product.name}`,
      `সাইজ: ${selectedSize.name} (${selectedSize.dimension})`,
      `ফিনিশ: ${finishes.find((item) => item.id === finish)?.name}`,
      `পরিমাণ: ${quantity}`,
      `মোট পণ্যমূল্য: ${formatPrice(total)}`,
      "",
      "আমার এই প্রোডাক্ট সম্পর্কে সাহায্য দরকার।",
    ].join("\n");

    window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <main className="page-bg min-h-screen pb-12">
      <div className="page-container">
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-2 py-4 text-xs text-muted sm:py-5 sm:text-sm"
        >
          <Link to="/" className="hover:text-secondary">হোম</Link>
          <span>/</span>
          <Link to="/shop" className="hover:text-secondary">শপ</Link>
          <span>/</span>
          <span className="font-medium text-primary">{product.name}</span>
        </nav>

        <section className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2 lg:gap-10">
          {/* Product gallery */}
          <div className="min-w-0">
            <div className="section-card overflow-hidden">
              <div
                className={`relative aspect-[4/5] overflow-hidden bg-base-200 sm:aspect-[5/4] lg:aspect-[4/5] ${
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
                <img
                  src={selectedImage}
                  alt={product.name}
                  className="h-full w-full object-cover transition-transform duration-200 ease-out"
                  style={{
                    transform: zoom ? "scale(1.8)" : "scale(1)",
                    transformOrigin: zoomPosition,
                  }}
                />

                <span className="badge-gold absolute left-3 top-3 shadow-sm sm:left-5 sm:top-5">
                  <Sparkles size={13} />
                  পার্সোনালাইজড গিফট
                </span>

                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setFavorite(!favorite);
                  }}
                  aria-label="পছন্দের তালিকায় যোগ করুন"
                  aria-pressed={favorite}
                  className="absolute right-3 top-3 flex size-10 items-center justify-center rounded-full bg-white text-primary shadow-md transition hover:scale-105 sm:right-5 sm:top-5"
                >
                  <Heart
                    size={19}
                    className={favorite ? "fill-rose-500 text-rose-500" : ""}
                  />
                </button>

                <span className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-white/95 px-3 py-2 text-xs text-primary shadow-sm">
                  <ZoomIn size={14} />
                  জুম করতে ক্লিক করুন
                </span>
              </div>
            </div>

            {/* Small product thumbnails */}
            <div className="mt-3 grid grid-cols-4 gap-2 sm:gap-3">
              {product.gallery.map((image, index) => (
                <button
                  type="button"
                  key={`${product.id}-${image}-${index}`}
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

            <div className="section-card mt-5 grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <div className="icon-box"><Gift size={20} /></div>
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
                <div className="icon-box"><ShieldCheck size={20} /></div>
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

          {/* Product details */}
          <div className="min-w-0">
            <div className="flex flex-wrap gap-2">
              <span className="badge-gold">
                <Sparkles size={12} />
                কাস্টমাইজ করা যাবে
              </span>
              <span className="badge-soft">বেস্ট সেলার</span>
            </div>

            <h1 className="mt-4 text-2xl font-extrabold leading-snug text-primary sm:text-3xl lg:text-4xl">
              {product.name}
            </h1>

            <p className="mt-3 text-sm leading-6 text-muted">
              {product.description}। জন্মদিন, বিবাহবার্ষিকী কিংবা
              প্রিয়জনকে সারপ্রাইজ দেওয়ার জন্য বিশেষ একটি উপহার।
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
              <div className="flex items-center gap-1">
                <Star size={16} className="fill-amber-400 text-amber-500" />
                <span className="font-bold text-primary">{product.rating}</span>
              </div>
              <span className="text-muted">({product.reviews} রিভিউ)</span>
              <span className="h-4 border-l border-base-300" />
              <span className="font-medium text-secondary">
                কাস্টমাইজ অর্ডার
              </span>
            </div>

            {/* Price */}
            <div className="mt-6 rounded-2xl border border-base-300 bg-base-200 p-4 sm:p-5">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-3xl font-extrabold text-primary sm:text-4xl">
                  {formatPrice(price)}
                </span>
                {product.oldPrice > price && (
                  <span className="text-sm text-muted line-through">
                    {formatPrice(product.oldPrice)}
                  </span>
                )}
                {product.oldPrice > price && (
                  <span className="badge-gold">
                    {Math.round(
                      ((product.oldPrice - price) / product.oldPrice) * 100
                    )}% ছাড়
                  </span>
                )}
              </div>
              <p className="mt-2 text-xs text-muted">
                নির্বাচিত সাইজ অনুযায়ী মূল্য পরিবর্তন হবে।
              </p>
            </div>

            {/* Size */}
            <div className="mt-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-bold text-primary sm:text-base">
                  ১. ফ্রেমের সাইজ বেছে নাও
                </h2>
                <span className="text-xs text-muted">Size</span>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-3">
                {sizes.map((size) => (
                  <button
                    type="button"
                    key={size.id}
                    onClick={() => setFrameSize(size.id)}
                    aria-pressed={frameSize === size.id}
                    className={`relative rounded-xl border p-3 text-left transition sm:p-4 ${
                      frameSize === size.id
                        ? "border-secondary bg-secondary/5 ring-1 ring-secondary"
                        : "border-base-300 hover:border-secondary/50"
                    }`}
                  >
                    {frameSize === size.id && (
                      <Check
                        size={15}
                        className="absolute right-2 top-2 text-secondary"
                      />
                    )}
                    <span className="block text-sm font-bold text-primary">
                      {size.name}
                    </span>
                    <span className="mt-1 block text-[11px] leading-4 text-muted sm:text-xs">
                      {size.dimension}
                    </span>
                    <span className="mt-3 block text-xs font-bold text-secondary">
                      {size.extra ? `+${formatPrice(size.extra)}` : "বেস প্রাইস"}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Finish */}
            <div className="mt-6">
              <h2 className="text-sm font-bold text-primary sm:text-base">
                ২. ফ্রেমের ফিনিশ বেছে নাও
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {finishes.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => setFinish(item.id)}
                    aria-pressed={finish === item.id}
                    className={`flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium transition sm:px-4 sm:text-sm ${
                      finish === item.id
                        ? "border-secondary bg-secondary/5 text-primary"
                        : "border-base-300 text-muted hover:border-secondary/50"
                    }`}
                  >
                    <span
                      className="size-4 rounded-full border border-black/10"
                      style={{ backgroundColor: item.color }}
                    />
                    {item.name}
                    {finish === item.id && (
                      <Check size={13} className="text-secondary" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Multiple image upload */}
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
                  {photos.length}/{MAX_IMAGES} ছবি
                </span>
              </div>

              <label
                className={`mt-3 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed p-3 transition sm:p-4 ${
                  photos.length >= MAX_IMAGES
                    ? "cursor-not-allowed border-base-300 opacity-60"
                    : "border-base-300 bg-base-200/60 hover:border-secondary"
                }`}
              >
                <span className="icon-box">
                  <ImagePlus size={20} />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-primary">
                    {photos.length >= MAX_IMAGES
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
                  disabled={photos.length >= MAX_IMAGES}
                  onChange={handleFileChange}
                  className="sr-only"
                />
              </label>

              <p className="mt-2 text-xs text-muted">
                ছবি আপলোড ঐচ্ছিক। ছবি না দিলেও অর্ডারের ফর্ম পূরণ করা যাবে।
              </p>

              {fileError && (
                <p role="alert" className="mt-2 rounded-lg bg-red-50 p-3 text-xs leading-5 text-red-700">
                  {fileError}
                </p>
              )}

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
                          src={photo.preview}
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

            {/* Engraved details */}
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

            {/* Custom message / note */}
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
                placeholder="যেমন: আমাদের ছোট্ট গল্পটা চিরদিন এমনই সুন্দর থাকুক। ভালোবাসা রইল..."
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

            {/* Quantity */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-base-300 p-4">
              <div>
                <h2 className="text-sm font-bold text-primary">
                  পরিমাণ (Quantity)
                </h2>
                <p className="mt-1 text-xs text-muted">
                  সর্বোচ্চ ১০টি
                </p>
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
                  onClick={() => setQuantity((value) => Math.min(10, value + 1))}
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

            {/* Action buttons */}
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-[1.4fr_1fr_auto]">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={adding}
                className="btn-gold min-h-12 w-full rounded-xl px-4 text-sm"
              >
                <ShoppingBag size={18} />
                {adding ? "যোগ হচ্ছে..." : "কার্টে যোগ করুন"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMessage(
                    "আপনার কাস্টমাইজেশন প্রস্তুত। অর্ডার সম্পন্ন করতে কার্টে যোগ করুন।"
                  );
                }}
                className="btn-brand min-h-12 w-full rounded-xl px-4 text-sm"
              >
                <Sparkles size={17} />
                কাস্টমাইজ অর্ডার
              </button>

              <button
                type="button"
                onClick={() => setFavorite(!favorite)}
                aria-label="পছন্দের তালিকায় যোগ করুন"
                aria-pressed={favorite}
                className="hidden min-h-12 items-center justify-center rounded-xl border border-base-300 px-4 text-primary transition hover:border-secondary sm:flex"
              >
                <Heart
                  size={19}
                  className={favorite ? "fill-rose-500 text-rose-500" : ""}
                />
              </button>
            </div>

            {message && (
              <p
                role="status"
                className="mt-3 rounded-xl bg-secondary/10 p-3 text-sm text-primary"
              >
                {message}
              </p>
            )}

            {/* WhatsApp help */}
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
                  প্রোডাক্ট বা কাস্টমাইজেশন নিয়ে সাহায্যের জন্য WhatsApp-এ যোগাযোগ করুন।
                </span>
              </span>
              <ArrowRight size={18} className="shrink-0 text-secondary" />
            </button>

            {/* Delivery info */}
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

        {/* Related products */}
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
              সব দেখুন <ArrowRight size={17} />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
            {relatedProducts.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>

          <div className="mt-6 sm:hidden">
            <Link to="/shop" className="btn-outline-brand w-full">
              সব উপহার দেখুন <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
