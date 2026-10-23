
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Heart,
  ShoppingBag,
  Sparkles,
  Star,
} from "lucide-react";

const products = [
  {
    id: "photo-frame",
    name: "কাস্টমাইজড এলইডি ফটোফ্রেম",
    description: "ছবি ও নাম খোদাইসহ কাস্টমাইজড",
    image: "/images/products/photo-frame.jpg",
    price: 1200,
    oldPrice: 1500,
    rating: 4.9,
    reviews: 48,
    badges: [{ label: "২০% ছাড়", type: "discount" }],
    category: "photo-frames",
    customizable: true,
  },
  {
    id: "nikah-mirror",
    name: "গোল্ডেন নিকাহ স্মারক",
    description: "বিয়ে ও বিশেষ মুহূর্তের স্মারক",
    image: "/images/products/nikah-mirror.jpg",
    price: 1850,
    oldPrice: 2200,
    rating: 5.0,
    reviews: 34,
    badges: [{ label: "জনপ্রিয়", type: "popular" }],
    category: "nikah-gifts",
    customizable: true,
  },
  {
    id: "gift-hamper",
    name: "লাক্সারি গিফট হ্যাম্পার",
    description: "চকলেট, পারফিউম ও প্রিমিয়াম গিফট",
    image: "/images/products/gift-hamper.jpg",
    price: 2650,
    oldPrice: 3200,
    rating: 4.8,
    reviews: 26,
    badges: [
      { label: "১৭% ছাড়", type: "discount" },
      { label: "বেস্ট সেলার", type: "popular" },
    ],
    category: "gift-hampers",
    customizable: true,
  },
  {
    id: "couple-watch",
    name: "কাপল ওয়াচ ও ওয়ালেট সেট",
    description: "প্রিয় দুজনের জন্য বিশেষ উপহার",
    image: "/images/products/couple-watch.jpg",
    price: 3000,
    oldPrice: 3600,
    rating: 4.9,
    reviews: 19,
    badges: [{ label: "১৭% ছাড়", type: "discount" }],
    category: "couple-gifts",
    customizable: false,
  },
  {
    id: "custom-mug",
    name: "পার্সোনালাইজড কাপল মগ",
    description: "নাম ও ছবি দিয়ে সাজিয়ে নিন",
    image: "/images/products/custom-mug.jpg",
    price: 650,
    oldPrice: 800,
    rating: 4.8,
    reviews: 42,
    badges: [{ label: "কাস্টমাইজযোগ্য", type: "popular" }],
    category: "mugs-cushions",
    customizable: true,
  },
  {
    id: "memory-frame",
    name: "প্রিমিয়াম মেমোরি ফ্রেম",
    description: "স্মরণীয় মুহূর্ত ধরে রাখুন",
    image: "/images/products/memory-frame.jpg",
    price: 1450,
    oldPrice: 1700,
    rating: 4.9,
    reviews: 31,
    badges: [{ label: "১০% ছাড়", type: "discount" }],
    category: "photo-frames",
    customizable: true,
  },
  {
    id: "rose-box",
    name: "রোজ ও চকলেট গিফট বক্স",
    description: "ভালোবাসার মানুষটির জন্য",
    image: "/images/products/rose-box.jpg",
    price: 1650,
    oldPrice: 1900,
    rating: 4.7,
    reviews: 23,
    badges: [{ label: "নতুন", type: "popular" }],
    category: "chocolate-flowers",
    customizable: true,
  },
  {
    id: "anniversary-box",
    name: "অ্যানিভার্সারি স্পেশাল বক্স",
    description: "বিশেষ দিনটিকে করুন স্মরণীয়",
    image: "/images/products/anniversary-box.jpg",
    price: 2250,
    oldPrice: 2700,
    rating: 5.0,
    reviews: 17,
    badges: [{ label: "১৭% ছাড়", type: "discount" }],
    category: "anniversary",
    customizable: true,
  },
];

const formatPrice = (price) =>
  `৳${price.toLocaleString("en-US")}`;

const PopularProducts = ({ onAddToCart }) => {
  const [favorites, setFavorites] = useState([]);
  const [addingId, setAddingId] = useState(null);

  const toggleFavorite = (productId) => {
    setFavorites((current) =>
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId],
    );
  };

  const handleAddToCart = async (product) => {
    if (!onAddToCart) {
      // Connect your cart logic through the onAddToCart prop.
      return;
    }

    try {
      setAddingId(product.id);
      await onAddToCart(product);
    } finally {
      setAddingId(null);
    }
  };

  return (
    <section className="section-bg ">
      <div className="page-container">
        {/* Section heading */}
        <div className="mb-6 flex items-end justify-between gap-3 sm:mb-8">
          <div>
            <span className="badge-gold">
              <Sparkles size={13} />
              টপ চয়েস
            </span>

            <h2 className="mt-3 text-2xl font-bold leading-tight text-primary sm:text-3xl">
              জনপ্রিয় সেরা উপহার
            </h2>

            <p className="mt-2 text-sm text-muted">
              আপনার প্রিয়জনের জন্য বেছে নিন বিশেষ কিছু।
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              to="/shop"
              className="hidden text-sm font-semibold text-secondary hover:text-primary sm:inline-flex sm:items-center sm:gap-1"
            >
              সব দেখুন
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>

        {/* Product grid: mobile first */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
          {products.map((product) => (
            <article
              key={product.id}
              className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-base-300/80 bg-base-100 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              {/* Product image */}
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
                    onError={(event) => {
                      event.currentTarget.style.visibility = "hidden";
                    }}
                  />
                </Link>

                {/* At most 2 badges */}
                <div className="absolute left-2 top-2 flex max-w-[75%] flex-wrap gap-1">
                  {product.badges.slice(0, 2).map((badge) => (
                    <span
                      key={badge.label}
                      className={
                        badge.type === "discount"
                          ? "badge-gold px-2 py-1 text-[10px] shadow-sm sm:text-xs"
                          : "badge-soft bg-secondary text-white px-2 py-1 text-[10px] shadow-sm sm:text-xs"
                      }
                    >
                      {badge.label}
                    </span>
                  ))}
                </div>

                {/* Favorite */}
                <button
                  type="button"
                  onClick={() => toggleFavorite(product.id)}
                  aria-label={
                    favorites.includes(product.id)
                      ? "পছন্দের তালিকা থেকে সরান"
                      : "পছন্দের তালিকায় যোগ করুন"
                  }
                  aria-pressed={favorites.includes(product.id)}
                  className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-white/95 text-primary shadow-sm transition hover:scale-110"
                >
                  <Heart
                    size={16}
                    className={
                      favorites.includes(product.id)
                        ? "fill-rose-500 text-rose-500"
                        : ""
                    }
                  />
                </button>
              </div>

              {/* Product information */}
              <div className="flex flex-1 flex-col p-3 sm:p-4">
                <div className="flex items-center gap-1 text-xs">
                  <Star
                    size={13}
                    className="fill-amber-400 text-amber-500"
                  />
                  <span className="font-semibold text-primary">
                    {product.rating.toFixed(1)}
                  </span>
                  <span className="truncate text-muted">
                    ({product.reviews} রিভিউ)
                  </span>
                </div>

                <Link
                  to={`/shop/${product.id}`}
                  className="mt-2 line-clamp-2 min-h-0 text-sm font-bold leading-5 text-primary transition hover:text-secondary sm:text-base"
                >
                  {product.name}
                </Link>

                <p className="mt-1 line-clamp-1 text-xs text-muted">
                  {product.description}
                </p>

                {/* Price */}
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

                {/* Actions */}
                <div className="mt-auto flex flex-col gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => handleAddToCart(product)}
                    disabled={addingId === product.id}
                    className="btn-brand w-full rounded-xl px-2 py-2.5 text-xs sm:text-sm"
                  >
                    <ShoppingBag size={15} />
                    {addingId === product.id
                      ? "যোগ হচ্ছে..."
                      : "কার্টে যোগ করুন"}
                  </button>

                  {product.customizable && (
                    <Link
                      to={`/gift-box?product=${product.id}`}
                      className="btn-outline-brand w-full rounded-xl px-2 py-2 text-xs sm:text-sm"
                    >
                      <Sparkles size={14} />
                      কাস্টমাইজ অর্ডার
                    </Link>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Mobile: view all */}
        <div className="mt-6 text-center sm:hidden">
          <Link to="/shop" className="btn-outline-brand w-full">
            সব উপহার দেখুন
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default PopularProducts;
