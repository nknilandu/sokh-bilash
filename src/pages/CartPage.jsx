
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
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
} from "lucide-react";

const initialItems = [
  {
    id: 1,
    name: "রয়্যাল গোল্ডেন লাক্সারি গিফট বক্স",
    description: "প্রিমিয়াম গিফট বক্স • গোল্ডেন এডিশন",
    price: 1970,
    oldPrice: 2200,
    quantity: 1,
    image:
      "https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=500&q=80",
  },
  {
    id: 2,
    name: "হাতে তৈরি সুগন্ধি মোমবাতি ও চা সেট",
    description: "হ্যান্ডমেড কালেকশন • প্রিমিয়াম প্যাকেজিং",
    price: 850,
    oldPrice: 0,
    quantity: 1,
    image:
      "https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=500&q=80",
  },
  {
    id: 3,
    name: "পার্সোনালাইজড চকোলেট গিফট বক্স",
    description: "কাস্টম মেসেজ • গিফট র‍্যাপিং",
    price: 650,
    oldPrice: 750,
    quantity: 1,
    image:
      "https://images.unsplash.com/photo-1548907040-4d42faa2e5f2?auto=format&fit=crop&w=500&q=80",
  },
];

const recommendations = [
  {
    id: 101,
    name: "পার্সোনালাইজড চকোলেট বার",
    price: 450,
    image:
      "https://images.unsplash.com/photo-1548907040-4d42faa2e5f2?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: 102,
    name: "মিনি ফুলের তোড়া",
    price: 650,
    image:
      "https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: 103,
    name: "প্রিমিয়াম গিফট কার্ড",
    price: 280,
    image:
      "https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=400&q=80",
  },
];

const formatPrice = (price) =>
  `৳${new Intl.NumberFormat("en-IN").format(price)}`;

export default function CartPage() {
  const [items, setItems] = useState(initialItems);
  const [coupon, setCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(false);
  const [couponMessage, setCouponMessage] = useState("");
  const [giftMessage, setGiftMessage] = useState("");
  const [giftWrap, setGiftWrap] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [notice, setNotice] = useState("");

  const subtotal = useMemo(
    () =>
      items.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      ),
    [items]
  );

  const discount = appliedCoupon ? Math.round(subtotal * 0.1) : 0;
  const delivery = subtotal === 0 || subtotal >= 2000 ? 0 : 80;
  const wrappingCost = giftWrap && items.length > 0 ? 50 : 0;
  const total = subtotal - discount + delivery + wrappingCost;
  const totalQuantity = items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const updateQuantity = (id, amount) => {
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity: Math.max(1, item.quantity + amount),
            }
          : item
      )
    );
  };

  const removeItem = (id) => {
    setItems((current) => current.filter((item) => item.id !== id));
    setNotice("পণ্যটি কার্ট থেকে সরানো হয়েছে।");
  };

  const applyCoupon = () => {
    if (coupon.trim().toUpperCase() === "GIFT10" && subtotal > 0) {
      setAppliedCoupon(true);
      setCouponMessage("কুপন সফলভাবে প্রয়োগ হয়েছে! ১০% ছাড় পেয়েছো।");
    } else {
      setAppliedCoupon(false);
      setCouponMessage("কুপনটি সঠিক নয়। GIFT10 ব্যবহার করে দেখো।");
    }
  };

  const toggleFavorite = (id) => {
    setFavorites((current) =>
      current.includes(id)
        ? current.filter((itemId) => itemId !== id)
        : [...current, id]
    );
  };

  const addRecommendation = (product) => {
    setItems((current) => {
      const existing = current.find((item) => item.id === product.id);

      if (existing) {
        return current.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [
        ...current,
        {
          ...product,
          description: "অতিরিক্ত গিফট আইটেম",
          oldPrice: 0,
          quantity: 1,
        },
      ];
    });

    setNotice(`${product.name} কার্টে যোগ হয়েছে।`);
  };

  return (
    <main className="page-bg min-h-screen">
      {/* Page heading */}
      <div className="page-container pb-10 pt-7 sm:pt-10">
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
          <span className="font-semibold text-primary">
            আপনার শপিং কার্ট
          </span>
        </nav>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="badge-soft mb-3">
              <ShoppingBag size={13} />
              GIFT COLLECTION
            </span>

            <h1 className="text-2xl font-extrabold text-primary sm:text-3xl lg:text-4xl">
              আপনার শপিং কার্ট
            </h1>

            <p className="mt-2 text-sm text-muted sm:text-base">
              তোমার প্রিয় উপহারগুলো এক জায়গায় সাজানো।
            </p>
          </div>

          <Link
            to="/shop"
            className="btn-outline-brand rounded-xl px-4 py-2.5 text-sm"
          >
            <ArrowLeft size={16} />
            শপিং চালিয়ে যাও
          </Link>
        </div>

        {/* Secure checkout notice */}
        <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-secondary/10 bg-secondary/5 p-4">
          <div className="icon-box !h-10 !w-10">
            <ShieldCheck size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-primary">
              নিশ্চিন্তে উপহার অর্ডার করো
            </p>
            <p className="mt-1 text-xs leading-5 text-muted">
              নিরাপদ চেকআউট, সুন্দর প্যাকেজিং এবং নির্ভরযোগ্য ডেলিভারি।
            </p>
          </div>
          <LockKeyhole size={17} className="text-secondary" />
        </div>

        {notice && (
          <div
            role="status"
            className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-secondary/20 bg-secondary/5 p-3 text-sm text-secondary"
          >
            <span>{notice}</span>
            <button
              type="button"
              onClick={() => setNotice("")}
              aria-label="নোটিশ বন্ধ করুন"
            >
              ✕
            </button>
          </div>
        )}

        {/* Main cart layout */}
        <div className="mt-7 grid grid-cols-1 items-start gap-6 lg:grid-cols-12 lg:gap-8">
          {/* Left: cart items */}
          <section className="min-w-0 space-y-5 lg:col-span-8">
            <div className="section-card overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-base-300/70 bg-base-200/70 px-4 py-4 sm:px-6">
                <div>
                  <h2 className="font-bold text-primary">
                    কার্টের পণ্যসমূহ
                  </h2>
                  <p className="mt-1 text-xs text-muted">
                    {totalQuantity} টি পণ্য
                  </p>
                </div>

                <Link
                  to="/shop"
                  className="text-xs font-semibold text-secondary hover:underline"
                >
                  আরও উপহার দেখুন
                </Link>
              </div>

              {items.length === 0 ? (
                <div className="px-5 py-14 text-center">
                  <div className="icon-box mx-auto mb-4 !h-16 !w-16">
                    <ShoppingBag size={27} />
                  </div>
                  <h3 className="text-lg font-bold text-primary">
                    তোমার কার্ট এখন খালি!
                  </h3>
                  <p className="mt-2 text-sm text-muted">
                    পছন্দের কাউকে উপহার দিতে শপ থেকে কিছু বেছে নাও।
                  </p>
                  <Link to="/shop" className="btn-brand mt-5">
                    উপহার খুঁজে দেখো <ArrowRight size={16} />
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-base-300/70">
                  {items.map((item) => (
                    <article
                      key={item.id}
                      className="flex min-w-0 gap-3 p-4 sm:gap-5 sm:p-6"
                    >
                      <Link
                        to={`/shop/${item.id}`}
                        aria-label={`${item.name} দেখুন`}
                        className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-base-200 sm:h-32 sm:w-32"
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          loading="lazy"
                          className="h-full w-full object-cover transition duration-300 hover:scale-105"
                        />
                      </Link>

                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <Link
                              to={`/shop/${item.id}`}
                              className="line-clamp-2 text-sm font-bold leading-5 text-primary transition hover:text-secondary sm:text-base sm:leading-6"
                            >
                              {item.name}
                            </Link>
                            <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted sm:text-sm">
                              {item.description}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => toggleFavorite(item.id)}
                            aria-label="পছন্দের তালিকায় যোগ করুন"
                            aria-pressed={favorites.includes(item.id)}
                            className="shrink-0 rounded-full p-1.5 text-primary transition hover:bg-secondary/10"
                          >
                            <Heart
                              size={17}
                              className={
                                favorites.includes(item.id)
                                  ? "fill-rose-500 text-rose-500"
                                  : ""
                              }
                            />
                          </button>
                        </div>

                        <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-3">
                          <div className="inline-flex items-center rounded-xl border border-base-300 bg-base-100 p-1">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, -1)}
                              disabled={item.quantity <= 1}
                              aria-label="পরিমাণ কমান"
                              className="flex size-7 items-center justify-center rounded-lg text-primary transition hover:bg-secondary/10 disabled:cursor-not-allowed disabled:opacity-30"
                            >
                              <Minus size={14} />
                            </button>

                            <span className="min-w-8 text-center text-sm font-bold text-primary">
                              {item.quantity}
                            </span>

                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, 1)}
                              aria-label="পরিমাণ বাড়ান"
                              className="flex size-7 items-center justify-center rounded-lg text-primary transition hover:bg-secondary/10"
                            >
                              <Plus size={14} />
                            </button>
                          </div>

                          <div className="text-right">
                            {item.oldPrice > item.price && (
                              <p className="text-xs text-muted line-through">
                                {formatPrice(item.oldPrice * item.quantity)}
                              </p>
                            )}
                            <p className="text-base font-extrabold text-primary sm:text-lg">
                              {formatPrice(item.price * item.quantity)}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="mt-3 flex w-fit items-center gap-1.5 text-xs font-medium text-muted transition hover:text-rose-600"
                        >
                          <Trash2 size={13} />
                          কার্ট থেকে সরাও
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {items.length > 0 && (
                <div className="border-t border-base-300/70 bg-base-200/40 px-4 py-3 sm:px-6">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-muted">পণ্যের মোট মূল্য</span>
                    <span className="font-bold text-primary">
                      {formatPrice(subtotal)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Gift options */}
            {items.length > 0 && (
              <>
                <section className="section-card p-4 sm:p-6">
                  <div className="flex items-start gap-3">
                    <div className="icon-box">
                      <Gift size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="font-bold text-primary">
                        গিফট র‍্যাপিং ও শুভেচ্ছা
                      </h2>
                      <p className="mt-1 text-xs leading-5 text-muted sm:text-sm">
                        তোমার উপহারটিকে আরও বিশেষ করে তুলতে একটি মেসেজ যোগ করো।
                      </p>
                    </div>
                  </div>

                  <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-base-300/70 p-3 transition hover:border-secondary/40">
                    <input
                      type="checkbox"
                      checked={giftWrap}
                      onChange={(event) => setGiftWrap(event.target.checked)}
                      className="checkbox checkbox-secondary mt-0.5"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-primary">
                        প্রিমিয়াম গিফট র‍্যাপিং
                      </span>
                      <span className="mt-1 block text-xs text-muted">
                        সুন্দর প্যাকেজিং ও রিবন দিয়ে সাজানো হবে।
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-bold text-secondary">
                      +৳৫০
                    </span>
                  </label>

                  <label
                    htmlFor="gift-message"
                    className="mb-2 mt-5 block text-sm font-semibold text-primary"
                  >
                    তোমার শুভেচ্ছা বার্তা
                    <span className="ml-1 font-normal text-muted">
                      (ঐচ্ছিক)
                    </span>
                  </label>

                  <textarea
                    id="gift-message"
                    value={giftMessage}
                    onChange={(event) =>
                      setGiftMessage(event.target.value.slice(0, 250))
                    }
                    maxLength={250}
                    rows={4}
                    placeholder="যেমন: তোমার প্রতিটি দিন আনন্দে ভরে উঠুক..."
                    className="textarea textarea-bordered w-full resize-y rounded-xl border-base-300 bg-base-200/50 text-sm leading-6 text-primary placeholder:text-muted/70 focus:border-secondary focus:outline-none"
                  />

                  <p className="mt-2 text-right text-xs text-muted">
                    {giftMessage.length}/250 অক্ষর
                  </p>
                </section>

                {/* Coupon */}
                <section className="section-card p-4 sm:p-6">
                  <div className="flex items-center gap-3">
                    <div className="icon-box">
                      <Tag size={19} />
                    </div>
                    <div>
                      <h2 className="font-bold text-primary">
                        কুপন কোড
                      </h2>
                      <p className="mt-1 text-xs text-muted">
                        প্রোমো কোড ব্যবহার করে ছাড় নাও।
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <input
                      value={coupon}
                      onChange={(event) => setCoupon(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") applyCoupon();
                      }}
                      placeholder="কুপন কোড লিখো"
                      aria-label="কুপন কোড"
                      className="input input-bordered min-w-0 flex-1 rounded-xl border-base-300 bg-base-200/50 text-sm uppercase text-primary placeholder:normal-case placeholder:text-muted focus:border-secondary focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={applyCoupon}
                      className="btn-brand rounded-xl px-5 py-3 text-sm"
                    >
                      কুপন প্রয়োগ
                    </button>
                  </div>

                  {couponMessage && (
                    <p
                      role="status"
                      className={`mt-3 text-xs ${
                        appliedCoupon ? "text-success" : "text-rose-600"
                      }`}
                    >
                      {couponMessage}
                    </p>
                  )}

                  <p className="mt-3 text-xs text-muted">
                    Demo coupon: <strong>GIFT10</strong> — ১০% ছাড়।
                  </p>
                </section>
              </>
            )}
          </section>

          {/* Right: order summary */}
          <aside className="min-w-0 space-y-4 lg:sticky lg:top-25 lg:col-span-4">
            <section className="section-card overflow-hidden">
              <div className="border-b border-base-300/70 bg-base-200/70 px-5 py-4">
                <h2 className="text-lg font-bold text-primary">
                  অর্ডার সামারি
                </h2>
                <p className="mt-1 text-xs text-muted">
                  অর্ডারের মোট খরচ এক নজরে।
                </p>
              </div>

              <div className="space-y-4 p-5">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted">পণ্যের মূল্য</span>
                  <span className="font-semibold text-primary">
                    {formatPrice(subtotal)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted">ডেলিভারি চার্জ</span>
                  <span
                    className={`font-semibold ${
                      delivery === 0 ? "text-success" : "text-primary"
                    }`}
                  >
                    {delivery === 0 ? "ফ্রি" : formatPrice(delivery)}
                  </span>
                </div>

                {giftWrap && items.length > 0 && (
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-muted">গিফট র‍্যাপিং</span>
                    <span className="font-semibold text-primary">
                      {formatPrice(wrappingCost)}
                    </span>
                  </div>
                )}

                {appliedCoupon && (
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-success">কুপন ডিসকাউন্ট</span>
                    <span className="font-semibold text-success">
                      −{formatPrice(discount)}
                    </span>
                  </div>
                )}

                <div className="rounded-xl bg-secondary/5 p-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-secondary">
                    <Truck size={16} />
                    {subtotal >= 2000
                      ? "অভিনন্দন! ডেলিভারি চার্জ ফ্রি"
                      : `আর ${formatPrice(
                          2000 - subtotal
                        )} টাকার কেনাকাটায় ফ্রি ডেলিভারি`}
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-base-300">
                    <div
                      className="h-full rounded-full bg-secondary transition-all duration-300"
                      style={{
                        width: `${Math.min((subtotal / 2000) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="border-t border-dashed border-base-300 pt-4">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="font-bold text-primary">সর্বমোট</p>
                      <p className="mt-1 text-xs text-muted">
                        {totalQuantity} টি পণ্য
                      </p>
                    </div>
                    <p className="text-2xl font-extrabold text-primary">
                      {formatPrice(total)}
                    </p>
                  </div>
                  <p className="mt-2 text-right text-xs text-muted">
                    প্রযোজ্য করসহ চূড়ান্ত মূল্য চেকআউটে নিশ্চিত হবে।
                  </p>
                </div>

                <button
                  type="button"
                  disabled={items.length === 0}
                  onClick={() => {
                    // Replace with your checkout route and cart persistence.
                    window.location.href = "/checkout";
                  }}
                  className="btn-gold w-full rounded-full py-3.5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  চেকআউট ও পেমেন্ট
                  <ArrowRight size={17} />
                </button>

                <div className="flex items-center justify-center gap-2 text-xs text-muted">
                  <LockKeyhole size={14} />
                  নিরাপদ চেকআউট
                </div>
              </div>
            </section>

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
                    গিফট কাস্টমাইজেশন বা ডেলিভারি নিয়ে আমাদের সাথে যোগাযোগ করো।
                  </p>
                  <Link
                    to="/contact"
                    className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-secondary hover:underline"
                  >
                    যোগাযোগ করো <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* Recommended products */}
        <section className="mt-12 sm:mt-16">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-secondary">
                JUST FOR YOU
              </span>
              <h2 className="mt-1 text-xl font-extrabold text-primary sm:text-2xl">
                তোমার উপহারের সাথে আরও কিছু
              </h2>
              <p className="mt-2 text-sm text-muted">
                পছন্দের উপহারের সাথে মানানসই কিছু আইটেম।
              </p>
            </div>

            <Link
              to="/shop"
              className="hidden items-center gap-1 text-sm font-semibold text-secondary hover:underline sm:flex"
            >
              সব দেখুন <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
            {recommendations.map((product) => (
              <article
                key={product.id}
                className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-base-300/80 bg-base-100 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <Link
                  to={`/shop/${product.id}`}
                  className="aspect-square overflow-hidden bg-base-200"
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </Link>

                <div className="flex flex-1 flex-col p-3 sm:p-4">
                  <Link
                    to={`/shop/${product.id}`}
                    className="line-clamp-2 text-sm font-bold leading-5 text-primary transition hover:text-secondary"
                  >
                    {product.name}
                  </Link>

                  <p className="mt-2 text-base font-extrabold text-primary">
                    {formatPrice(product.price)}
                  </p>

                  <button
                    type="button"
                    onClick={() => addRecommendation(product)}
                    className="btn-outline-brand mt-auto w-full rounded-xl px-2 py-2.5 text-xs sm:text-sm"
                  >
                    <Plus size={15} />
                    কার্টে যোগ করো
                  </button>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-5 sm:hidden">
            <Link to="/shop" className="btn-outline-brand w-full">
              সব উপহার দেখুন <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
