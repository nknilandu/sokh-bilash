
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clipboard,
  Gift,
  LockKeyhole,
  Phone,
  ShieldCheck,
  Sparkles,
  Truck,
  UserRound,
  Wallet,
} from "lucide-react";

// Bangladesh divisions and districts
const divisions = {
  ঢাকা: [
    "ঢাকা",
    "গাজীপুর",
    "গোপালগঞ্জ",
    "কিশোরগঞ্জ",
    "মাদারীপুর",
    "মানিকগঞ্জ",
    "মুন্সীগঞ্জ",
    "নারায়ণগঞ্জ",
    "নরসিংদী",
    "রাজবাড়ী",
    "শরীয়তপুর",
    "টাঙ্গাইল",
    "ফরিদপুর",
  ],
  চট্টগ্রাম: [
    "চট্টগ্রাম",
    "কক্সবাজার",
    "কুমিল্লা",
    "চাঁদপুর",
    "ব্রাহ্মণবাড়িয়া",
    "ফেনী",
    "লক্ষ্মীপুর",
    "নোয়াখালী",
    "খাগড়াছড়ি",
    "রাঙ্গামাটি",
    "বান্দরবান",
  ],
  রাজশাহী: [
    "রাজশাহী",
    "বগুড়া",
    "জয়পুরহাট",
    "নওগাঁ",
    "নাটোর",
    "চাঁপাইনবাবগঞ্জ",
    "পাবনা",
    "সিরাজগঞ্জ",
  ],
  খুলনা: [
    "খুলনা",
    "বাগেরহাট",
    "চুয়াডাঙ্গা",
    "যশোর",
    "ঝিনাইদহ",
    "কুষ্টিয়া",
    "মাগুরা",
    "মেহেরপুর",
    "নড়াইল",
    "সাতক্ষীরা",
  ],
  বরিশাল: [
    "বরিশাল",
    "বরগুনা",
    "ভোলা",
    "ঝালকাঠি",
    "পটুয়াখালী",
    "পিরোজপুর",
  ],
  সিলেট: [
    "সিলেট",
    "হবিগঞ্জ",
    "মৌলভীবাজার",
    "সুনামগঞ্জ",
  ],
  রংপুর: [
    "রংপুর",
    "দিনাজপুর",
    "গাইবান্ধা",
    "কুড়িগ্রাম",
    "লালমনিরহাট",
    "নীলফামারী",
    "পঞ্চগড়",
    "ঠাকুরগাঁও",
  ],
  ময়মনসিংহ: [
    "ময়মনসিংহ",
    "জামালপুর",
    "নেত্রকোণা",
    "শেরপুর",
  ],
};

// Demo products. Replace with cart context or API data.
const demoItems = [
  {
    id: "gift-1",
    name: "কাস্টমাইজড প্রিমিয়াম গিফট বক্স",
    price: 1490,
    quantity: 1,
    image: "",
  },
  {
    id: "gift-2",
    name: "পার্সোনালাইজড ফটো ফ্রেম",
    price: 850,
    quantity: 1,
    image: "",
  },
];

// Replace placeholder numbers with real payment numbers.
const paymentAccounts = {
  bkash: {
    label: "বিকাশ",
    number: "01XXXXXXXXX",
    color: "text-pink-700",
    description: "bKash Personal · Send Money",
  },
  nagad: {
    label: "নগদ",
    number: "01XXXXXXXXX",
    color: "text-orange-600",
    description: "Nagad Personal · Send Money",
  },
  rocket: {
    label: "রকেট",
    number: "01XXXXXXXXX",
    color: "text-violet-700",
    description: "Rocket Personal · Send Money",
  },
};

const money = (n) => `৳${Number(n).toLocaleString("bn-BD")}`;

const fieldClass =
  "mt-1.5 w-full rounded-xl border border-base-300 bg-base-200/70 px-3.5 py-3 text-sm text-primary outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/10";

export default function CheckoutPage() {
  const [items] = useState(demoItems);
  const [method, setMethod] = useState("bkash");
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    division: "",
    district: "",
    note: "",
    senderPhone: "",
    trxId: "",
  });

  const update = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Calculate subtotal
  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      ),
    [items]
  );

  // Delivery charge based on district
  const delivery = form.district === "নরসিংদী" ? 80 : 130;

  const total = subtotal + delivery;
  const isCod = method === "cod";

  // Submit order
  const submitOrder = async (e) => {
    e.preventDefault();
    setError("");

    const cleanPhone = form.phone.replace(/\s/g, "");

    if (
      !form.name.trim() ||
      !/^01\d{9}$/.test(cleanPhone) ||
      !form.address.trim() ||
      !form.division ||
      !form.district ||
      !divisions[form.division]?.includes(form.district)
    ) {
      setError(
        "নাম, সঠিক ১১ সংখ্যার মোবাইল নম্বর, বিভাগ, জেলা এবং সম্পূর্ণ ঠিকানা দিন।"
      );
      return;
    }

    if (
      !isCod &&
      (!/^01\d{9}$/.test(
        form.senderPhone.replace(/\s/g, "")
      ) ||
        !form.trxId.trim())
    ) {
      setError(
        "পেমেন্টের Sender Number এবং Transaction ID সঠিকভাবে দিন।"
      );
      return;
    }

    const orderPayload = {
      customer: {
        name: form.name.trim(),
        phone: cleanPhone,
        address: form.address.trim(),
        division: form.division,
        district: form.district,
        note: form.note.trim(),
      },

      items: items.map(({ id, quantity }) => ({
        productId: id,
        quantity,
      })),

      payment: {
        method,
        ...(isCod
          ? {}
          : {
              senderPhone: form.senderPhone.trim(),
              trxId: form.trxId.trim(),
            }),
      },
    };

    setSubmitting(true);

    try {
      // TODO: Replace with backend API call.
      // Backend must independently calculate prices and delivery.
      console.log("Demo checkout payload:", orderPayload);

      setError(
        "ডেমো মোড: অর্ডার API এখনো সংযুক্ত নয়। Backend যুক্ত করলে অর্ডার জমা হবে।"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-base-200/60 text-base-content">
      <div className="page-container py-6 sm:py-10">

        {/* Page Heading */}
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-secondary">
              <ShieldCheck size={14} />
              নিরাপদ অর্ডার • সহজ পেমেন্ট
            </p>

            <h1 className="text-2xl font-extrabold text-primary sm:text-3xl">
              অর্ডার সম্পন্ন করুন
            </h1>

            <p className="mt-1 text-xs text-muted sm:text-sm">
              ঠিকানা, পেমেন্ট ও অর্ডার তথ্য যাচাই করে অর্ডার নিশ্চিত করুন।
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted">
            <span className="font-semibold text-secondary">
              ১. ঠিকানা
            </span>
            <span>›</span>
            <span className="font-semibold text-secondary">
              ২. পেমেন্ট
            </span>
            <span>›</span>
            <span>৩. নিশ্চিতকরণ</span>
          </div>
        </div>

        <form
          onSubmit={submitOrder}
          className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.85fr)]"
        >
          {/* LEFT COLUMN */}
          <div className="min-w-0 space-y-5">

             <div className="section-card relative p-4 sm:p-5">
      <div className="flex items-start gap-3 sm:gap-4">
        {/* Icon */}
        <div className="icon-box bg-secondary/10">
          <Sparkles size={22} />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold text-primary sm:text-lg">
              আরও সহজে অর্ডার করতে চান?
            </h3>

            <span className="badge-soft bg-pink-100 text-secondary">
              গেস্ট একাউন্ট সক্রিয়
            </span>
          </div>

          <p className="mt-1 text-xs leading-5 text-muted sm:text-sm">
            লগইন করলে আপনার ঠিকানা ও প্রয়োজনীয় অর্ডার তথ্য সংরক্ষিত
            থাকবে। পরবর্তী প্রতিটি কেনাকাটা আরও দ্রুত সম্পন্ন করতে পারবেন।
          </p>

          {/* Actions */}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Link
              to="/login"
              className="btn-outline-brand rounded-lg px-4 py-2 text-xs sm:text-sm"
            >
              লগইন করুন
              <ArrowRight size={14} />
            </Link>

            <span className="text-xs text-muted sm:text-sm">
              অথবা গেস্ট হিসেবে চেকআউট সম্পন্ন করছেন
            </span>
          </div>
        </div>
      </div>
    </div>

            {/* Customer Information */}
            <section className="section-card p-4 sm:p-6">
              <div className="mb-5 flex items-center gap-3">
                <span className="icon-box">
                  <UserRound size={19} />
                </span>

                <div>
                  <h2 className="font-bold text-primary">
                    ১. গ্রাহকের তথ্য
                  </h2>
                  <p className="text-xs text-muted">
                    Customer & Shipping Information
                  </p>
                </div>

                <span className="badge-soft ml-auto hidden sm:inline-flex">
                  প্রয়োজনীয় তথ্য
                </span>
              </div>

              <div className="space-y-4">

                {/* Name */}
                <label className="block text-sm font-semibold text-primary">
                  পূর্ণ নাম <span className="text-red-500">*</span>

                  <input
                    required
                    value={form.name}
                    onChange={(e) =>
                      update("name", e.target.value)
                    }
                    placeholder="আপনার পুরো নাম"
                    className={fieldClass}
                  />
                </label>

                {/* Phone */}
                <label className="block text-sm font-semibold text-primary">
                  মোবাইল নম্বর <span className="text-red-500">*</span>

                  <input
                    required
                    type="tel"
                    inputMode="numeric"
                    value={form.phone}
                    onChange={(e) =>
                      update(
                        "phone",
                        e.target.value.replace(/\D/g, "")
                      )
                    }
                    placeholder="01712345678"
                    className={fieldClass}
                  />

                  <span className="mt-1 block text-xs font-normal text-muted">
                    ডেলিভারি নিশ্চিত করতে এই নম্বরে যোগাযোগ করা হবে।
                  </span>
                </label>

                {/* Division and District */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                  {/* Division */}
                  <label className="block text-sm font-semibold text-primary">
                    বিভাগ (Division){" "}
                    <span className="text-red-500">*</span>

                    <select
                      required
                      value={form.division}
                      onChange={(e) => {
                        setForm((prev) => ({
                          ...prev,
                          division: e.target.value,
                          district: "",
                        }));
                      }}
                      className={fieldClass}
                    >
                      <option value="">
                        বিভাগ নির্বাচন করুন
                      </option>

                      {Object.keys(divisions).map((division) => (
                        <option
                          key={division}
                          value={division}
                        >
                          {division}
                        </option>
                      ))}
                    </select>
                  </label>

                  {/* District */}
                  <label className="block text-sm font-semibold text-primary">
                    জেলা (District){" "}
                    <span className="text-red-500">*</span>

                    <select
                      required
                      value={form.district}
                      disabled={!form.division}
                      onChange={(e) =>
                        update("district", e.target.value)
                      }
                      className={`${fieldClass} disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                      <option value="">
                        জেলা নির্বাচন করুন
                      </option>

                      {(divisions[form.division] || []).map(
                        (district) => (
                          <option
                            key={district}
                            value={district}
                          >
                            {district}
                          </option>
                        )
                      )}
                    </select>
                  </label>
                </div>

                {/* Address */}
                <label className="block text-sm font-semibold text-primary">
                  সম্পূর্ণ ডেলিভারি ঠিকানা{" "}
                  <span className="text-red-500">*</span>

                  <textarea
                    required
                    rows={3}
                    value={form.address}
                    onChange={(e) =>
                      update("address", e.target.value)
                    }
                    placeholder="বাড়ি, রোড, থানা, এলাকা ও বিস্তারিত ঠিকানা"
                    className={`${fieldClass} resize-y`}
                  />
                </label>

                {/* Optional Note */}
                <label className="block text-sm font-semibold text-primary">
                  বিশেষ নির্দেশনা{" "}
                  <span className="text-xs font-normal text-muted">
                    (ঐচ্ছিক)
                  </span>

                  <input
                    value={form.note}
                    onChange={(e) =>
                      update("note", e.target.value)
                    }
                    placeholder="ডেলিভারির সময় বা অন্যান্য নির্দেশনা"
                    className={fieldClass}
                  />
                </label>
              </div>
            </section>

            {/* Payment Method */}
            <section className="section-card p-4 sm:p-6">
              <div className="mb-5 flex items-center gap-3">
                <span className="icon-box">
                  <Wallet size={19} />
                </span>

                <div>
                  <h2 className="font-bold text-primary">
                    ২. পেমেন্ট পদ্ধতি ও ভেরিফিকেশন
                  </h2>

                  <p className="text-xs text-muted">
                    Payment Method & Verification
                  </p>
                </div>
              </div>

              {/* Payment Options */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  ...Object.entries(paymentAccounts).map(
                    ([id, info]) => ({
                      id,
                      ...info,
                    })
                  ),
                  {
                    id: "cod",
                    label: "ক্যাশ অন ডেলিভারি",
                    color: "text-secondary",
                  },
                ].map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      setMethod(option.id);
                      setCopied(false);
                    }}
                    aria-pressed={method === option.id}
                    className={`relative flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl border-2 p-2 text-center transition ${
                      method === option.id
                        ? "border-secondary bg-secondary/10"
                        : "border-base-300/70 bg-base-200/60 hover:border-secondary/40"
                    }`}
                  >
                    {method === option.id && (
                      <Check
                        size={14}
                        className="absolute right-2 top-2 text-secondary"
                      />
                    )}

                    {option.id === "cod" ? (
                      <Truck
                        size={22}
                        className="text-secondary"
                      />
                    ) : (
                      <Wallet
                        size={22}
                        className={option.color}
                      />
                    )}

                    <span className="text-xs font-bold text-primary">
                      {option.label}
                    </span>
                  </button>
                ))}
              </div>

              {/* COD Information */}
              {isCod ? (
                <div className="mt-4 rounded-xl border border-secondary/15 bg-secondary/5 p-4">
                  <p className="flex items-center gap-2 text-sm font-bold text-primary">
                    <Phone size={17} />
                    Cash on Delivery
                  </p>

                  <p className="mt-2 text-sm leading-6 text-muted">
                    অর্ডার জমা দেওয়ার পর আমাদের টিম ফোন করে
                    আপনার অর্ডার ও ঠিকানা নিশ্চিত করবে।
                    নিশ্চিত হওয়ার পর ডেলিভারি প্রক্রিয়া শুরু হবে।
                  </p>

                  <p className="mt-2 text-xs font-semibold text-secondary">
                    অগ্রিম পেমেন্টের প্রয়োজন নেই।
                  </p>
                </div>
              ) : (
                <div className="mt-4 space-y-4 rounded-xl bg-base-200/70 p-3 sm:p-4">

                  {/* Payment Account */}
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-3">
                    <div>
                      <p className="text-xs text-muted">
                        {paymentAccounts[method].description}
                      </p>

                      <p className="mt-1 text-lg font-extrabold tracking-wide text-primary">
                        {paymentAccounts[method].number}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(
                            paymentAccounts[method].number
                          );
                          setCopied(true);
                        } catch {
                          setCopied(false);
                        }
                      }}
                      className="badge-soft px-3 py-2"
                    >
                      <Clipboard size={14} />
                      {copied
                        ? "কপি হয়েছে"
                        : "নম্বর কপি করুন"}
                    </button>
                  </div>

                  {/* Payment Instructions */}
                  <div className="grid gap-2 sm:grid-cols-2">
                    <p className="rounded-lg bg-white p-3 text-xs leading-5 text-muted">
                      <span className="font-bold text-secondary">
                        ১.
                      </span>{" "}
                      উপরের Personal নম্বরে{" "}
                      <strong>Send Money</strong> করুন।
                    </p>

                    <p className="rounded-lg bg-white p-3 text-xs leading-5 text-muted">
                      <span className="font-bold text-secondary">
                        ২.
                      </span>{" "}
                      নিচে Sender Number ও TrxID লিখুন।
                    </p>
                  </div>

                  {/* Verification Fields */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block text-xs font-semibold text-primary">
                      যে নম্বর থেকে টাকা পাঠিয়েছেন{" "}
                      <span className="text-red-500">*</span>

                      <input
                        required={!isCod}
                        type="tel"
                        inputMode="numeric"
                        value={form.senderPhone}
                        onChange={(e) =>
                          update(
                            "senderPhone",
                            e.target.value.replace(/\D/g, "")
                          )
                        }
                        placeholder="01XXXXXXXXX"
                        className={fieldClass}
                      />
                    </label>

                    <label className="block text-xs font-semibold text-primary">
                      Transaction ID (TrxID){" "}
                      <span className="text-red-500">*</span>

                      <input
                        required={!isCod}
                        value={form.trxId}
                        onChange={(e) =>
                          update("trxId", e.target.value)
                        }
                        placeholder="যেমন: TXN987ABC"
                        className={fieldClass}
                      />
                    </label>
                  </div>

                  {/* Payment Warning */}
                  <div className="rounded-xl border border-gold-soft bg-gold-soft/20 p-3 text-xs leading-5 text-primary">
                    প্রদেয় টাকা:{" "}
                    <strong>{money(total)}</strong>।
                    TrxID জমা দিলেই পেমেন্ট নিশ্চিত হয় না;
                    অ্যাডমিন যাচাই করার পর স্ট্যাটাস আপডেট হবে।
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* RIGHT COLUMN */}
          <aside className="min-w-0 space-y-4 lg:sticky lg:top-24">

            {/* Order Summary */}
            <section className="section-card p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-2">
                <h2 className="text-base font-extrabold text-primary">
                  অর্ডারের সারসংক্ষেপ
                </h2>

                <span className="badge-soft">
                  {items.length}টি পণ্য
                </span>
              </div>

              {/* Cart Items */}
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-3 rounded-xl bg-base-200/70 p-3"
                  >
                    <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="size-full rounded-lg object-cover"
                        />
                      ) : (
                        <Gift size={24} />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-bold text-primary">
                        {item.name}
                      </p>

                      <p className="mt-1 text-xs text-muted">
                        পরিমাণ: {item.quantity}
                      </p>
                    </div>

                    <span className="whitespace-nowrap text-sm font-bold text-primary">
                      {money(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Price Summary */}
              <div className="mt-5 space-y-3 border-t border-base-300 pt-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">
                    উপহারের মূল্য (Subtotal)
                  </span>

                  <strong className="text-primary">
                    {money(subtotal)}
                  </strong>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted">
                    ডেলিভারি চার্জ
                  </span>

                  <strong className="text-primary">
                    {money(delivery)}
                  </strong>
                </div>

                <div className="flex justify-between rounded-xl bg-secondary/10 p-3 text-base font-extrabold text-primary">
                  <span>সর্বমোট মূল্য</span>
                  <span>{money(total)}</span>
                </div>
              </div>

              {/* Delivery Information */}
              <div className="mt-4 rounded-xl bg-gold-soft/30 p-3 text-xs leading-5 text-primary">
                <Truck
                  size={15}
                  className="mr-1 inline"
                />

                {form.district === "নরসিংদী"
                  ? "নরসিংদী জেলার ভিতরে ডেলিভারি চার্জ ৳৮০।"
                  : "নরসিংদী জেলার বাইরে ডেলিভারি চার্জ ৳১৩০।"}
              </div>

              {/* Error */}
              {error && (
                <p
                  role="alert"
                  className="mt-4 rounded-lg bg-red-50 p-3 text-xs text-red-700"
                >
                  {error}
                </p>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || items.length === 0}
                className="btn-brand mt-4 w-full rounded-xl py-3.5 disabled:opacity-60"
              >
                {submitting
                  ? "অপেক্ষা করুন..."
                  : "অর্ডার নিশ্চিত করুন"}

                <ArrowRight size={17} />
              </button>

              <p className="mt-3 text-center text-xs leading-5 text-muted">
                <LockKeyhole
                  size={12}
                  className="mr-1 inline"
                />
                অনলাইন পেমেন্ট ম্যানুয়ালি যাচাই করা হবে।
                COD অর্ডার ফোনে নিশ্চিত করা হবে।
              </p>
            </section>

            {/* Delivery Trust Card */}
            <div className="section-card flex items-center gap-3 p-4">
              <span className="icon-box">
                <Truck size={20} />
              </span>

              <div>
                <p className="text-sm font-bold text-primary">
                  দ্রুত ও যত্নশীল ডেলিভারি
                </p>

                <p className="mt-1 text-xs text-muted">
                  অর্ডার নিশ্চিত হলে ডেলিভারি আপডেট পাবেন।
                </p>
              </div>
            </div>

            {/* Back to Shop */}
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 text-sm font-semibold text-secondary hover:underline"
            >
              <ArrowLeft size={15} />
              কেনাকাটায় ফিরে যান
            </Link>
          </aside>
        </form>
      </div>
    </main>
  );
}
