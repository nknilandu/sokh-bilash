
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowLeft,
  Search,
  Gift,
  Heart,
  ShoppingBag,
  Check,
  Plus,
  Minus,
  X,
  Package,
  MessageCircle,
  ShieldCheck,
  Plane,
  Sparkles,
  Trash2,
  CheckCircle2,
  CalendarHeart,
} from "lucide-react";

const occasions = [
  "বিবাহবার্ষিকী (Anniversary Celebration)",
  "জন্মদিন (Birthday)",
  "ভালোবাসা দিবস (Valentine's Day)",
  "বিবাহ / বিয়ে (Wedding)",
  "জন্মদিনের শুভেচ্ছা",
  "বন্ধুত্ব দিবস (Friendship Day)",
  "ধন্যবাদ জানাতে (Thank You)",
  "অন্যান্য উপলক্ষ",
];

const categories = [
  "সব সামগ্রী",
  "চকলেট ও কনফেকশনারি",
  "জুয়েলারি ও রিং",
  "ফটো ফ্রেম",
  "সুগন্ধি ও স্কিনকেয়ার",
  "মগ ও অ্যাক্সেসরিজ",
];

const giftProducts = [
  {
    id: "royal-frame",
    name: "রয়্যাল ভেলভেট ফটো ফ্রেম",
    category: "ফটো ফ্রেম",
    price: 1200,
    description: "সোনালি নকশাযুক্ত ভেলভেট ম্যাট বর্ডার, সঙ্গে প্রিয় স্মৃতি।",
    image:
      "https://images.unsplash.com/photo-1511988617509-a57c8a288659?auto=format&fit=crop&w=700&q=85",
    badge: "নির্বাচিত",
  },
  {
    id: "chocolate-box",
    name: "লাক্সারি বেলজিয়ান চকোলেট",
    category: "চকলেট ও কনফেকশনারি",
    price: 850,
    description: "৮ পিস বিভিন্ন স্বাদের প্রিমিয়াম চকোলেট।",
    image:
      "https://images.unsplash.com/photo-1548907040-4d42f5f2c7b4?auto=format&fit=crop&w=700&q=85",
    badge: "বেস্ট সেলার",
  },
  {
    id: "gold-pen",
    name: "গোল্ডেন ফাউন্টেন পেন",
    category: "মগ ও অ্যাক্সেসরিজ",
    price: 650,
    description: "বিশেষ দিনের জন্য মার্জিত ও স্মরণীয় উপহার।",
    image:
      "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=700&q=85",
    badge: "জনপ্রিয়",
  },
  {
    id: "perfume",
    name: "সুগন্ধিত অ্যারোমা পারফিউম",
    category: "সুগন্ধি ও স্কিনকেয়ার",
    price: 650,
    description: "মিষ্টি সুবাসের আকর্ষণীয় গিফট আইটেম।",
    image:
      "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=700&q=85",
    badge: "নতুন",
  },
  {
    id: "couple-ring",
    name: "খোদাই করা কাপল রিং",
    category: "জুয়েলারি ও রিং",
    price: 850,
    description: "নাম বা বিশেষ তারিখ দিয়ে ব্যক্তিগতকরণের সুযোগ।",
    image:
      "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=700&q=85",
    badge: "কাস্টমাইজযোগ্য",
  },
  {
    id: "scented-candle",
    name: "সুগন্ধি মিনি অ্যারোমা ক্যান্ডেল",
    category: "সুগন্ধি ও স্কিনকেয়ার",
    price: 320,
    description: "উপহারের সঙ্গে উষ্ণ ও সুন্দর পরিবেশের ছোঁয়া।",
    image:
      "https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=700&q=85",
    badge: "জনপ্রিয়",
  },
  {
    id: "memory-mug",
    name: "পার্সোনালাইজড মেমোরি মগ",
    category: "মগ ও অ্যাক্সেসরিজ",
    price: 450,
    description: "নিজের ছবি বা বার্তা দিয়ে সাজানো মগ।",
    image:
      "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=700&q=85",
    badge: "কাস্টমাইজযোগ্য",
  },
  {
    id: "photo-album",
    name: "প্রিমিয়াম মেমোরি অ্যালবাম",
    category: "ফটো ফ্রেম",
    price: 550,
    description: "প্রিয় মুহূর্তগুলো একসঙ্গে সাজিয়ে রাখুন।",
    image:
      "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=700&q=85",
    badge: "জনপ্রিয়",
  },
];

const packagingOptions = [
  {
    id: "standard",
    name: "স্ট্যান্ডার্ড গিফট বক্স",
    description: "ক্লাসিক ম্যাট পেপার বক্স, সঙ্গে সুন্দর রিবন ও স্টিকার।",
    price: 0,
    label: "ফ্রি",
  },
  {
    id: "velvet",
    name: "ভেলভেটিন গিফট বক্স",
    description: "রয়্যাল ভেলভেট ফিনিশ, প্রিমিয়াম লুক ও সুন্দর রিবন।",
    price: 450,
    label: "+ ৳৪৫০",
    popular: true,
  },
  {
    id: "engraved",
    name: "কাস্টম খোদাই বক্স",
    description: "ব্যক্তিগত মেসেজ ও নামের খোদাইসহ বিশেষ উপহার বক্স।",
    price: 650,
    label: "+ ৳৬৫০",
  },
];

const formatPrice = (price) => `৳${price.toLocaleString("en-US")}`;

export default function GiftBoxBuilder() {
  const [occasion, setOccasion] = useState(occasions[0]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("সব সামগ্রী");
  const [selectedItems, setSelectedItems] = useState([]);
  const [packaging, setPackaging] = useState("velvet");
  const [recipient, setRecipient] = useState("");
  const [greeting, setGreeting] = useState(
    "বিবাহবার্ষিকীর এই শুভ মুহূর্তে তোমাদের পথচলা আরও সুন্দর হোক। শুভকামনা নিরন্তর।"
  );
  const [sender, setSender] = useState("");
  const [printCard, setPrintCard] = useState(true);
  const [adding, setAdding] = useState(false);
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState("success");

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return giftProducts.filter((product) => {
      const matchesCategory =
        activeCategory === "সব সামগ্রী" ||
        product.category === activeCategory;

      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [search, activeCategory]);

  const selectedProductDetails = selectedItems
    .map((selected) => {
      const product = giftProducts.find((item) => item.id === selected.id);
      return product ? { ...product, quantity: selected.quantity } : null;
    })
    .filter(Boolean);

  const itemCount = selectedItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const itemsTotal = selectedProductDetails.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const selectedPackaging = packagingOptions.find(
    (item) => item.id === packaging
  );

  const packagingPrice = selectedPackaging?.price || 0;
  const cardPrice = printCard ? 30 : 0;
  const total = itemsTotal + packagingPrice + cardPrice;

  const toggleItem = (product) => {
    setNotice("");

    setSelectedItems((current) => {
      const existing = current.find((item) => item.id === product.id);

      if (existing) {
        return current.filter((item) => item.id !== product.id);
      }

      return [...current, { id: product.id, quantity: 1 }];
    });
  };

  const updateQuantity = (productId, change) => {
    setSelectedItems((current) =>
      current.map((item) =>
        item.id === productId
          ? {
              ...item,
              quantity: Math.min(20, Math.max(1, item.quantity + change)),
            }
          : item
      )
    );
    setNotice("");
  };

  const removeItem = (productId) => {
    setSelectedItems((current) =>
      current.filter((item) => item.id !== productId)
    );
    setNotice("");
  };

  const handleAddToCart = async () => {
    if (selectedItems.length === 0) {
      setNoticeType("error");
      setNotice("প্রথমে অন্তত একটি গিফট আইটেম নির্বাচন করো।");
      return;
    }

    setAdding(true);
    setNotice("");

    try {
      const giftBox = {
        id: `gift-box-${Date.now()}`,
        type: "custom-gift-box",
        name: "কাস্টম গিফট বক্স",
        occasion,
        items: selectedProductDetails.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
        })),
        packaging: {
          id: packaging,
          name: selectedPackaging.name,
          price: packagingPrice,
        },
        recipient,
        greeting,
        sender,
        printCard,
        cardPrice,
        total,
        quantity: 1,
      };

      const existing = JSON.parse(
        localStorage.getItem("sokhbilash-cart") || "[]"
      );

      localStorage.setItem(
        "sokhbilash-cart",
        JSON.stringify([...existing, giftBox])
      );

      setNoticeType("success");
      setNotice("তোমার কাস্টম গিফট বক্স কার্টে যোগ হয়েছে!");
    } catch {
      setNoticeType("error");
      setNotice("কার্টে যোগ করা যায়নি। আবার চেষ্টা করো।");
    } finally {
      setAdding(false);
    }
  };

  return (
    <main className="page-bg min-h-screen pb-12">
      {/* Hero */}
      <section className="relative overflow-hidden bg-primary text-white">
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary/80 to-[#ffe16d]/20" />

        <div className="page-container relative py-8 sm:py-10 lg:py-12">
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 text-xs text-white/80 transition hover:text-gold-soft sm:text-sm"
          >
            <ArrowLeft size={16} />
            শপে ফিরে যাও
          </Link>

          <div className="mt-5 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <span className="badge-gold">
                <Sparkles size={13} />
                নিজের মতো করে সাজাও
              </span>

              <h1 className="mt-4 text-3xl font-extrabold leading-tight sm:text-4xl lg:text-5xl">
                একটি গিফট বক্স,
                <span className="block text-gold-soft">
                  হাজারো অনুভূতি
                </span>
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-white/80 sm:text-base">
                প্রিয় মানুষের জন্য পছন্দের উপহার বেছে নাও। তোমার পছন্দের
                আইটেম, প্যাকেজিং ও ভালোবাসার বার্তা দিয়ে তৈরি করো
                একদম নিজের মতো গিফট বক্স।
              </p>
            </div>

            <div className="flex w-fit items-center gap-3 rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
              <span className="flex size-11 items-center justify-center rounded-xl bg-gold-soft text-primary">
                <ShieldCheck size={23} />
              </span>
              <div>
                <p className="text-sm font-bold">প্রিমিয়াম গিফটিং</p>
                <p className="mt-1 text-xs text-white/75">
                  তোমার পছন্দ, তোমার ডিজাইন
                </p>
              </div>
            </div>
          </div>

          {/* Steps */}
          <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {[
              "উপলক্ষ নির্বাচন",
              "পছন্দের গিফট",
              "প্যাকেজিং ও বক্স",
              "পার্সোনালাইজেশন",
              "রিভিউ ও বাজেট",
            ].map((step, index) => (
              <div
                key={step}
                className={`flex min-w-0 items-center gap-2 rounded-xl border p-3 ${
                  index === 1
                    ? "border-gold-soft bg-primary text-white"
                    : "border-white/15 bg-white/10 text-white/85"
                }`}
              >
                <span
                  className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    index === 1
                      ? "bg-gold-soft text-primary"
                      : "bg-white/15 text-white"
                  }`}
                >
                  {index + 1}
                </span>
                <span className="text-xs font-semibold sm:text-sm">
                  {step}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="page-container mt-6 sm:mt-8">
        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_350px] xl:gap-6">
          {/* Main builder */}
          <div className="min-w-0 space-y-5">
            {/* Occasion */}
            <section className="section-card p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="icon-box bg-gold-soft/30 text-primary">
                    <CalendarHeart size={21} />
                  </span>
                  <div>
                    <h2 className="text-base font-extrabold text-primary sm:text-lg">
                      ১. উপলক্ষ নির্বাচন করো
                    </h2>
                    <p className="mt-1 text-xs text-muted">
                      কোন উপলক্ষে উপহার দিচ্ছ?
                    </p>
                  </div>
                </div>
                <span className="badge-soft">Step 1</span>
              </div>

              <label className="mt-4 block">
                <span className="mb-2 block text-xs font-semibold text-primary">
                  উপহারের উপলক্ষ
                </span>
                <select
                  value={occasion}
                  onChange={(event) => setOccasion(event.target.value)}
                  className="select select-bordered w-full bg-base-100 text-sm"
                >
                  {occasions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
            </section>

            {/* Product selection */}
            <section className="section-card p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="icon-box">
                    <Gift size={21} />
                  </span>
                  <div>
                    <h2 className="text-base font-extrabold text-primary sm:text-lg">
                      ২. পছন্দের গিফট সামগ্রী বেছে নাও
                    </h2>
                    <p className="mt-1 text-xs text-muted">
                      এক বা একাধিক আইটেম নির্বাচন করতে পারো।
                    </p>
                  </div>
                </div>

                <span className="badge-soft">
                  {itemCount}টি নির্বাচিত
                </span>
              </div>

              {/* Search */}
              <div className="relative mt-5">
                <Search
                  size={19}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="গিফট খুঁজুন... যেমন: চকোলেট, ফ্রেম, পারফিউম"
                  className="input input-bordered w-full bg-base-100 pl-10 pr-10 text-sm"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    aria-label="সার্চ মুছুন"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary"
                  >
                    <X size={17} />
                  </button>
                )}
              </div>

              {/* Category filters */}
              <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                {categories.map((category) => (
                  <button
                    type="button"
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`shrink-0 rounded-full border px-3 py-2 text-xs font-semibold transition ${
                      activeCategory === category
                        ? "border-primary bg-primary text-white"
                        : "border-base-300 bg-base-200 text-muted hover:border-secondary hover:text-primary"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>

              {/* Product grid */}
              {filteredProducts.length ? (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
                  {filteredProducts.map((product) => {
                    const selected = selectedItems.find(
                      (item) => item.id === product.id
                    );

                    return (
                      <article
                        key={product.id}
                        className={`group flex min-w-0 flex-col overflow-hidden rounded-2xl border bg-base-100 transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                          selected
                            ? "border-secondary ring-1 ring-secondary"
                            : "border-base-300/80"
                        }`}
                      >
                        <div className="relative aspect-square overflow-hidden bg-base-200">
                          <img
                            src={product.image}
                            alt={product.name}
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />

                          <span className="absolute left-2 top-2 max-w-[85%] truncate rounded-full bg-white/95 px-2 py-1 text-[10px] font-semibold text-primary shadow-sm">
                            {product.badge}
                          </span>

                          {selected && (
                            <span className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-secondary text-white shadow">
                              <Check size={15} />
                            </span>
                          )}
                        </div>

                        <div className="flex flex-1 flex-col p-3">
                          <span className="text-[10px] text-secondary">
                            {product.category}
                          </span>

                          <h3 className="mt-1 line-clamp-2 text-sm font-bold leading-5 text-primary">
                            {product.name}
                          </h3>

                          <p className="mt-1 line-clamp-2 text-xs leading-4 text-muted">
                            {product.description}
                          </p>

                          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                            <span className="text-base font-extrabold text-primary">
                              {formatPrice(product.price)}
                            </span>

                            {!selected ? (
                              <button
                                type="button"
                                onClick={() => toggleItem(product)}
                                aria-label={`${product.name} যোগ করুন`}
                                className="flex size-8 items-center justify-center rounded-lg bg-gold-soft text-primary transition hover:bg-accent"
                              >
                                <Plus size={17} />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => toggleItem(product)}
                                aria-label={`${product.name} সরান`}
                                className="flex size-8 items-center justify-center rounded-lg bg-secondary/10 text-secondary transition hover:bg-secondary hover:text-white"
                              >
                                <Check size={17} />
                              </button>
                            )}
                          </div>

                          {selected && (
                            <div className="mt-3 flex items-center justify-between rounded-lg bg-base-200 p-1">
                              <button
                                type="button"
                                onClick={() =>
                                  updateQuantity(product.id, -1)
                                }
                                disabled={selected.quantity <= 1}
                                aria-label="পরিমাণ কমান"
                                className="flex size-7 items-center justify-center rounded-md text-primary hover:bg-base-300 disabled:opacity-30"
                              >
                                <Minus size={14} />
                              </button>

                              <span className="text-xs font-bold text-primary">
                                {selected.quantity}টি
                              </span>

                              <button
                                type="button"
                                onClick={() =>
                                  updateQuantity(product.id, 1)
                                }
                                disabled={selected.quantity >= 20}
                                aria-label="পরিমাণ বাড়ান"
                                className="flex size-7 items-center justify-center rounded-md text-primary hover:bg-base-300 disabled:opacity-30"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-5 rounded-xl border border-dashed border-base-300 p-8 text-center">
                  <Search size={28} className="mx-auto text-muted" />
                  <p className="mt-3 text-sm font-bold text-primary">
                    কোনো গিফট পাওয়া যায়নি
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    অন্য নামে সার্চ করো অথবা অন্য ক্যাটাগরি নির্বাচন করো।
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setActiveCategory("সব সামগ্রী");
                    }}
                    className="btn-outline-brand mt-4 rounded-xl px-4 py-2 text-xs"
                  >
                    সব সামগ্রী দেখুন
                  </button>
                </div>
              )}
            </section>

            {/* Packaging */}
            <section className="section-card p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="icon-box">
                    <Package size={21} />
                  </span>
                  <div>
                    <h2 className="text-base font-extrabold text-primary sm:text-lg">
                      ৩. বক্সের ধরন ও প্রিমিয়াম প্যাকেজিং
                    </h2>
                    <p className="mt-1 text-xs text-muted">
                      তোমার উপহারের সঙ্গে মানানসই বক্স বেছে নাও।
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {packagingOptions.map((option) => {
                  const active = packaging === option.id;

                  return (
                    <button
                      type="button"
                      key={option.id}
                      onClick={() => setPackaging(option.id)}
                      aria-pressed={active}
                      className={`relative flex min-w-0 flex-col rounded-xl border p-4 text-left transition ${
                        active
                          ? "border-secondary bg-secondary/5 ring-1 ring-secondary"
                          : "border-base-300 hover:border-secondary/50"
                      }`}
                    >
                      {option.popular && (
                        <span className="badge-gold mb-2 w-fit text-[10px]">
                          সর্বাধিক জনপ্রিয়
                        </span>
                      )}

                      <span className="flex items-start justify-between gap-2">
                        <span className="text-sm font-bold leading-5 text-primary">
                          {option.name}
                        </span>

                        <span
                          className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${
                            active
                              ? "border-secondary bg-secondary text-white"
                              : "border-base-300"
                          }`}
                        >
                          {active && <Check size={12} />}
                        </span>
                      </span>

                      <span className="mt-2 flex-1 text-xs leading-5 text-muted">
                        {option.description}
                      </span>

                      <span className="mt-4 text-sm font-extrabold text-secondary">
                        {option.price === 0
                          ? "ফ্রি"
                          : `+ ${formatPrice(option.price)}`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Personalization */}
            <section className="section-card p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="icon-box">
                    <Heart size={21} />
                  </span>
                  <div>
                    <h2 className="text-base font-extrabold text-primary sm:text-lg">
                      ৪. বার্তা ও পার্সোনালাইজেশন
                    </h2>
                    <p className="mt-1 text-xs text-muted">
                      উপহারটিকে আরও ব্যক্তিগত করে তোলো।
                    </p>
                  </div>
                </div>
                <span className="badge-soft">ঐচ্ছিক</span>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="min-w-0 space-y-4">
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold text-primary">
                      উপহার প্রাপকের নাম (Recipient Name)
                    </span>
                    <input
                      type="text"
                      maxLength={80}
                      value={recipient}
                      onChange={(event) => setRecipient(event.target.value)}
                      placeholder="যেমন: আরিফ ও সুমাইয়া"
                      className="input input-bordered w-full bg-base-200 text-sm"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 flex items-center justify-between gap-2 text-xs font-semibold text-primary">
                      <span>উপহারের বার্তা (Greeting Message Card)</span>
                      <span className="shrink-0 text-muted">
                        {greeting.length}/300
                      </span>
                    </span>
                    <textarea
                      rows={5}
                      maxLength={300}
                      value={greeting}
                      onChange={(event) => setGreeting(event.target.value)}
                      placeholder="তোমার মনের কথা এখানে লিখো..."
                      className="textarea textarea-bordered min-h-32 w-full resize-y bg-base-200 text-sm leading-6"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold text-primary">
                      কার পক্ষ থেকে? (Sender)
                    </span>
                    <input
                      type="text"
                      maxLength={80}
                      value={sender}
                      onChange={(event) => setSender(event.target.value)}
                      placeholder="যেমন: আন্তরিক ভালোবাসায় তোমার পরিবার"
                      className="input input-bordered w-full bg-base-200 text-sm"
                    />
                  </label>

                  <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-base-200 p-3">
                    <input
                      type="checkbox"
                      checked={printCard}
                      onChange={(event) => setPrintCard(event.target.checked)}
                      className="checkbox checkbox-secondary checkbox-sm"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold text-primary">
                        প্রিন্টেড গিফট কার্ড যুক্ত করব?
                      </span>
                      <span className="mt-1 block text-xs text-muted">
                        সুন্দরভাবে সাজানো বার্তা কার্ড (+ ৳৩০)
                      </span>
                    </span>
                  </label>
                </div>

                {/* Live greeting card preview */}
                <div className="min-w-0">
                  <div className="relative flex min-h-64 flex-col overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-[#581267] to-secondary p-5 text-white shadow-md sm:min-h-80 sm:p-6">
                    <div className="absolute -right-10 -top-10 size-36 rounded-full border border-white/10" />
                    <div className="absolute -bottom-16 -left-10 size-48 rounded-full border border-white/10" />

                    <div className="relative flex items-center justify-between gap-3 border-b border-white/20 pb-3">
                      <span className="flex items-center gap-2 text-xs font-bold text-gold-soft">
                        <Gift size={15} />
                        বিশেষ গিফট কার্ড
                      </span>
                      <span className="rounded-full bg-gold-soft px-2 py-1 text-[10px] font-bold text-primary">
                        LIVE PREVIEW
                      </span>
                    </div>

                    <div className="relative flex flex-1 flex-col justify-center py-5">
                      <p className="text-sm font-bold text-gold-soft sm:text-base">
                        {recipient.trim() || "প্রিয় মানুষ"}
                      </p>

                      <p className="mt-4 whitespace-pre-wrap break-words text-sm italic leading-7 text-white/95 sm:text-base">
                        {greeting.trim() ||
                          "তোমার মনের কথাগুলো এখানে দেখা যাবে..."}
                      </p>

                      <p className="mt-5 break-words text-right text-sm font-bold text-gold-soft">
                        {sender.trim() || "— আন্তরিক ভালোবাসায়"}
                      </p>
                    </div>

                    <div className="relative flex items-center justify-between gap-3 border-t border-white/20 pt-3 text-[10px] text-white/70">
                      <span>Sokhbilash · বিশেষ স্মৃতি</span>
                      <Heart size={15} className="text-gold-soft" />
                    </div>
                  </div>

                  <p className="mt-3 text-xs leading-5 text-muted">
                    এটি একটি ডিজিটাল প্রিভিউ। প্রকৃত কার্ডের প্রিন্টিং
                    ডিজাইনে সামান্য পার্থক্য থাকতে পারে।
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* Sticky summary */}
          <aside className="min-w-0 lg:sticky lg:top-25">
            <div className="overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-md">
              <div className="bg-primary p-5 text-white">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-xs font-semibold text-gold-soft">
                    <ShoppingBag size={15} />
                    তোমার গিফট বক্স
                  </span>
                  <span className="badge-gold text-[10px]">
                    {itemCount}টি আইটেম
                  </span>
                </div>

                <h2 className="mt-3 text-xl font-extrabold">
                  তোমার কাস্টম গিফট বক্স
                </h2>
                <p className="mt-2 text-xs text-white/70">
                  {occasion}
                </p>
              </div>

              <div className="p-4 sm:p-5">
                <div className="flex items-center justify-between gap-2 border-b border-base-300 pb-3">
                  <span className="text-xs font-semibold text-primary">
                    নির্বাচিত সামগ্রী
                  </span>
                  <span className="text-xs text-muted">
                    {itemCount}টি আইটেম
                  </span>
                </div>

                {selectedProductDetails.length ? (
                  <div className="mt-3 space-y-2">
                    {selectedProductDetails.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 rounded-xl bg-base-200 p-2"
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className="size-12 shrink-0 rounded-lg border border-base-300 object-cover"
                        />

                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-xs font-bold leading-4 text-primary">
                            {item.name}
                          </p>
                          <p className="mt-1 text-[10px] text-muted">
                            {item.quantity} × {formatPrice(item.price)}
                          </p>
                          <p className="mt-1 text-xs font-bold text-secondary">
                            {formatPrice(item.quantity * item.price)}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          aria-label={`${item.name} সরান`}
                          className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted transition hover:bg-white hover:text-red-600"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-3 rounded-xl border border-dashed border-base-300 p-5 text-center">
                    <ShoppingBag
                      size={26}
                      className="mx-auto text-secondary/60"
                    />
                    <p className="mt-2 text-sm font-bold text-primary">
                      এখনো কোনো আইটেম নেই
                    </p>
                    <p className="mt-1 text-xs leading-5 text-muted">
                      পছন্দের গিফটের পাশে + বাটনে ক্লিক করে যোগ করো।
                    </p>
                  </div>
                )}

                <div className="mt-4 border-t border-base-300 pt-4">
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="text-muted">প্যাকেজিং</span>
                    <span className="text-right font-semibold text-primary">
                      {selectedPackaging.name}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-muted">প্যাকেজিং চার্জ</span>
                    <span className="font-bold text-primary">
                      {packagingPrice ? formatPrice(packagingPrice) : "ফ্রি"}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-muted">প্রিন্টেড কার্ড</span>
                    <span className="font-bold text-primary">
                      {printCard ? formatPrice(cardPrice) : "নেই"}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-base-300 pt-4">
                    <span className="text-sm font-bold text-primary">
                      সর্বমোট প্রাইস
                    </span>
                    <span className="text-2xl font-extrabold text-secondary">
                      {formatPrice(total)}
                    </span>
                  </div>

                  <p className="mt-2 text-right text-[10px] text-muted">
                    ডেলিভারি চার্জ চেকআউটে যোগ হবে।
                  </p>
                </div>

                {notice && (
                  <div
                    role="status"
                    className={`mt-4 rounded-xl p-3 text-xs leading-5 ${
                      noticeType === "error"
                        ? "bg-red-50 text-red-700"
                        : "bg-secondary/10 text-primary"
                    }`}
                  >
                    {notice}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={adding}
                  className="btn-gold mt-5 min-h-12 w-full rounded-xl px-3 text-sm"
                >
                  <ShoppingBag size={18} />
                  {adding ? "যোগ হচ্ছে..." : "কার্টে গিফট বক্স যোগ করুন"}
                </button>

                <Link
                  to="/shop"
                  className="btn-outline-brand mt-3 w-full rounded-xl px-3 py-3 text-sm"
                >
                  আরও উপহার দেখুন
                  <ArrowRight size={16} />
                </Link>

                <div className="mt-4 flex items-start gap-2 rounded-xl bg-base-200 p-3">
                  <CheckCircle2
                    size={17}
                    className="mt-0.5 shrink-0 text-secondary"
                  />
                  <p className="text-xs leading-5 text-muted">
                    বক্সে যোগ করা সব আইটেম, প্যাকেজিং ও শুভেচ্ছাবার্তা
                    একসঙ্গে কার্টে সংরক্ষিত হবে।
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-base-300 bg-base-100 p-4">
              <span className="icon-box">
                <Plane size={20} />
              </span>
              <div>
                <p className="text-sm font-bold text-primary">
                  প্রবাসী গ্রাহকদের জন্য
                </p>
                <p className="mt-1 text-xs leading-5 text-muted">
                  বিদেশ থেকে প্রিয়জনের জন্য উপহার পাঠানোর বিস্তারিত
                  জানতে আমাদের সঙ্গে যোগাযোগ করো।
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const text = encodeURIComponent(
                      "আসসালামু আলাইকুম, আমি প্রবাস থেকে Sokhbilash গিফট বক্স অর্ডার সম্পর্কে জানতে চাই।"
                    );
                    window.open(
                      `https://wa.me/?text=${text}`,
                      "_blank",
                      "noopener,noreferrer"
                    );
                  }}
                  className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-secondary hover:text-primary"
                >
                  <MessageCircle size={15} />
                  WhatsApp-এ যোগাযোগ
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
