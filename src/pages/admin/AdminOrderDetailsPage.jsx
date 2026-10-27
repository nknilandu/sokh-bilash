
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  BadgeCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Clock3,
  Copy,
  CreditCard,
  Download,
  ExternalLink,
  FileImage,
  FileText,
  Gift,
  History,
  ImageOff,
  Mail,
  MapPin,
  MessageCircle,
  MessageSquareText,
  Package,
  Paintbrush,
  Phone,
  Plus,
  Printer,
  RefreshCw,
  Send,
  ShieldCheck,
  ShoppingBag,
  StickyNote,
  Truck,
  UserRound,
  Wallet,
  X,
} from "lucide-react";

// ========================================
// DEMO DATA — Replace with API response
// ========================================

const demoOrder = {
  id: "SKB-98431",
  createdAt: "2026-10-25T10:40:00+06:00",
  updatedAt: "2026-10-25T11:20:00+06:00",
  source: "Web Direct",

  status: "pending",
  paymentStatus: "partially_paid",
  phoneConfirmed: false,
  customized: true,

  customer: {
    name: "তানভীর হাসান",
    phone: "01819223344",
    alternatePhone: "01711987654",
    email: "tanvir.hasan@example.com",
    previousOrders: 4,
  },

  shipping: {
    recipientName: "ফারহানা ইসলাম",
    phone: "01819223344",
    division: "ঢাকা",
    district: "ঢাকা",
    area: "উত্তরা",
    address: "বাড়ি #১২, রোড #০৭, সেক্টর #৩, উত্তরা, ঢাকা",
    note: "ডেলিভারির আগে অবশ্যই ফোন করবেন।",
  },

  products: [
    {
      id: "p1",
      sku: "SKB-WPB-104",
      name: "বিবাহবার্ষিকী স্পেশাল কাস্টম গিফট বক্স",
      variant: "Royal Purple • 12×8×4 inch",
      image:
        "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&q=85",
      quantity: 1,
      price: 4080,
      customized: true,
      customization: {
        text: "তানভীর ও ফারহানা - অনন্ত ভালোবাসায়",
        font: "Royal Calligraphy",
        color: "Golden Foil",
        instructions:
          "বক্সের ওপর সোনালী হরফে নাম খোদাই থাকবে। ভেতরে লাল ফিতা ও পার্সোনাল নোট সংযুক্ত করতে হবে।",
        referenceFiles: [
          {
            name: "anniversary-reference.png",
            url: "",
            type: "image",
          },
        ],
      },
    },
    {
      id: "p2",
      sku: "SKB-PEN-032",
      name: "লাক্সারি গোল্ড প্লেটেড কাস্টম পেন",
      variant: "Gold • Premium",
      image:
        "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=600&q=85",
      quantity: 1,
      price: 1200,
      customized: true,
      customization: {
        text: "Tanvir H.",
        instructions: "পেনে নামটি সুন্দরভাবে খোদাই করতে হবে।",
        referenceFiles: [],
      },
    },
  ],

  giftMessage: {
    message:
      "শুভ বিবাহবার্ষিকী প্রিয় ফারহানা! জীবনের প্রতিটি দিন যেন এভাবেই স্নিগ্ধ আর সুন্দর থাকে।",
    from: "তানভীর",
  },

  pricing: {
    subtotal: 5280,
    discount: 400,
    coupon: "ANNIV400",
    packagingCharge: 150,
    deliveryCharge: 100,
    total: 5130,
  },

  payment: {
    method: "bKash",
    senderPhone: "01819223344",
    transactionId: "BK892348LL",
    submittedAmount: 2565,
    verifiedAdvance: 2565,
    collectedCOD: 0,
    verifiedAt: "2026-10-25T10:48:00+06:00",
    verifiedBy: "Admin",
  },

  delivery: {
    courier: "Pathao",
    trackingId: "PTH-99482103",
    parcelWeight: "1.2 kg",
    expectedDelivery: "2026-10-28",
    dispatchedAt: null,
    deliveredAt: null,
    trackingUrl: "",
  },

  history: [
    {
      id: "h1",
      title: "অর্ডার সাবমিট সম্পন্ন",
      description: "গ্রাহক ওয়েবসাইট থেকে অর্ডার করেছেন।",
      date: "2026-10-25T10:40:00+06:00",
      type: "completed",
    },
    {
      id: "h2",
      title: "অগ্রিম পেমেন্ট ভেরিফাইড",
      description: "bKash পেমেন্ট ম্যানুয়ালি যাচাই করা হয়েছে।",
      date: "2026-10-25T10:48:00+06:00",
      type: "completed",
    },
    {
      id: "h3",
      title: "ফোন কনফার্মেশন অপেক্ষমাণ",
      description:
        "কাস্টমাইজেশন ও ডেলিভারি ঠিকানা নিশ্চিত করতে হবে।",
      date: null,
      type: "current",
    },
    {
      id: "h4",
      title: "কাস্টমাইজড প্রোডাকশন",
      description: "প্রোডাক্ট প্রস্তুত ও কোয়ালিটি চেক।",
      date: null,
      type: "pending",
    },
    {
      id: "h5",
      title: "কুরিয়ারে হস্তান্তর",
      description: "প্যাকেজ কুরিয়ার সার্ভিসে পাঠানো হবে।",
      date: null,
      type: "pending",
    },
    {
      id: "h6",
      title: "ডেলিভারি সম্পন্ন",
      description: "গ্রাহকের কাছে পণ্য পৌঁছাবে।",
      date: null,
      type: "pending",
    },
  ],

  internalNotes: [
    {
      id: "n1",
      author: "SokhBilash Admin",
      text: "গ্রাহককে ফোন করে খোদাইয়ের নাম ও ঠিকানা নিশ্চিত করতে হবে।",
      createdAt: "2026-10-25T11:20:00+06:00",
    },
  ],
};

// ========================================
// HELPERS
// ========================================

const ORDER_STATUSES = [
  { value: "pending", label: "পেন্ডিং" },
  { value: "confirmed", label: "কনফার্মড" },
  { value: "processing", label: "প্রসেসিং" },
  { value: "ready_to_ship", label: "প্যাকিং সম্পন্ন" },
  { value: "shipped", label: "শিপড" },
  { value: "delivered", label: "ডেলিভার্ড" },
  { value: "cancelled", label: "বাতিল" },
];

const statusStyles = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-blue-100 text-blue-800",
  processing: "bg-purple-100 text-purple-800",
  ready_to_ship: "bg-fuchsia-100 text-fuchsia-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const money = (value) =>
  `৳${Number(value || 0).toLocaleString("bn-BD")}`;

const formatDate = (value) => {
  if (!value) return "—";

  return new Date(value).toLocaleString("bn-BD", {
    timeZone: "Asia/Dhaka",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

function normalizeBDPhone(phone) {
  const cleaned = String(phone || "").replace(/\D/g, "");

  if (/^01[3-9]\d{8}$/.test(cleaned)) {
    return `88${cleaned}`;
  }

  if (/^8801[3-9]\d{8}$/.test(cleaned)) {
    return cleaned;
  }

  return null;
}

function getWhatsAppUrl(phone, order) {
  const number = normalizeBDPhone(phone);
  if (!number) return null;

  const message = [
    `আসসালামু আলাইকুম ${order.customer.name},`,
    "",
    "SokhBilash (শখবিলাস) থেকে যোগাযোগ করছি।",
    `আপনার অর্ডার #${order.id} সম্পর্কে কিছু তথ্য নিশ্চিত করতে চাই।`,
    "",
    "ধন্যবাদ,",
    "SokhBilash Team",
  ].join("\n");

  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

function Section({ title, subtitle, icon: Icon, right, children }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-base-300/70 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-base-300/70 px-4 py-4 sm:px-5">
        <div className="flex items-center gap-2.5">
          <Icon size={19} className="text-secondary" />
          <div>
            <h2 className="text-sm font-extrabold text-primary sm:text-base">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-0.5 text-[11px] text-muted">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {right}
      </div>

      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

function InfoRow({ label, value, strong = false }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2 text-xs">
      <span className="text-muted">{label}</span>
      <span
        className={`max-w-[60%] break-words text-right ${
          strong
            ? "text-sm font-extrabold text-primary"
            : "font-semibold text-primary"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function StatusBadge({ status }) {
  const item = ORDER_STATUSES.find(
    (entry) => entry.value === status
  );

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1.5 text-[11px] font-bold ${
        statusStyles[status] || "bg-base-200 text-muted"
      }`}
    >
      {item?.label || status}
    </span>
  );
}

function ProductImage({ src, alt }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-base-300 bg-base-200 sm:size-24">
      {src && !failed ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <ImageOff size={22} className="text-muted" />
      )}
    </div>
  );
}

// ========================================
// MAIN COMPONENT
// ========================================

export default function AdminOrderDetailsPage() {
  const { orderId } = useParams();

  // DEMO: replace with TanStack Query
  // GET /admin/orders/:orderId
  const [order, setOrder] = useState(demoOrder);

  const [notes, setNotes] = useState(demoOrder.internalNotes);
  const [noteText, setNoteText] = useState("");
  const [statusOpen, setStatusOpen] = useState(false);
  const [copied, setCopied] = useState("");
  const [followUp, setFollowUp] = useState(false);

  const totalQuantity = order.products.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const verifiedAdvance = order.payment.verifiedAdvance || 0;
  const collectedCOD = order.payment.collectedCOD || 0;

  const remainingBalance = Math.max(
    0,
    order.pricing.total - verifiedAdvance - collectedCOD
  );

  const whatsappUrl = useMemo(
    () => getWhatsAppUrl(order.customer.phone, order),
    [order]
  );

  const callUrl = normalizeBDPhone(order.customer.phone)
    ? `tel:${order.customer.phone}`
    : null;

  const copyText = async (text, key) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
    } catch {
      setCopied("");
    }
  };

  // Demo-only state updates.
  // Production: persist via protected backend APIs.
  const updateStatus = (status) => {
    setOrder((prev) => ({
      ...prev,
      status,
      updatedAt: new Date().toISOString(),
    }));
    setStatusOpen(false);
  };

  const confirmPhone = () => {
    setOrder((prev) => ({
      ...prev,
      phoneConfirmed: !prev.phoneConfirmed,
      updatedAt: new Date().toISOString(),
    }));
  };

  const addNote = () => {
    if (!noteText.trim()) return;

    setNotes((prev) => [
      ...prev,
      {
        id: `local-${Date.now()}`,
        author: "SokhBilash Admin",
        text: noteText.trim(),
        createdAt: new Date().toISOString(),
      },
    ]);

    setNoteText("");
  };

  const printInvoice = () => {
    window.print();
  };

  const printCourierSlip = () => {
    window.print();
  };

  return (
    <div className="mx-auto max-w-[1550px] space-y-5 pb-10 text-primary">

      {/* BREADCRUMB */}
      <nav className="flex flex-wrap items-center gap-2 text-xs text-muted">
        <Link to="/admin" className="hover:text-secondary">
          ড্যাশবোর্ড
        </Link>
        <span>/</span>
        <Link
          to="/admin/orders"
          className="hover:text-secondary"
        >
          অর্ডারসমূহ
        </Link>
        <span>/</span>
        <span className="font-bold text-primary">
          #{orderId || order.id}
        </span>
      </nav>

      {/* HEADER */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/admin/orders"
              className="mr-1 flex size-9 items-center justify-center rounded-xl border border-base-300 bg-white hover:bg-base-200"
            >
              <ArrowLeft size={18} />
            </Link>

            <h1 className="text-xl font-extrabold sm:text-2xl">
              অর্ডার #{order.id}
            </h1>

            <button
              type="button"
              onClick={() => copyText(order.id, "order")}
              className="rounded-lg p-1.5 text-muted hover:bg-white"
              title="Copy Order ID"
            >
              {copied === "order" ? (
                <Check size={16} />
              ) : (
                <Copy size={16} />
              )}
            </button>

            <StatusBadge status={order.status} />

            {order.paymentStatus === "partially_paid" && (
              <span className="rounded-full bg-[#ffe16d] px-3 py-1.5 text-[11px] font-bold text-primary">
                Partially Paid
              </span>
            )}

            {order.customized && (
              <span className="flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-[11px] font-bold text-white">
                <Paintbrush size={12} />
                Customized
              </span>
            )}
          </div>

          <p className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
            <CalendarDays size={14} />
            {formatDate(order.createdAt)}
            <span>•</span>
            Channel: {order.source}
          </p>
        </div>

        {/* HEADER ACTIONS */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={printInvoice}
            className="inline-flex items-center gap-2 rounded-xl border border-base-300 bg-white px-3 py-2.5 text-xs font-bold text-secondary shadow-sm hover:bg-base-200"
          >
            <Download size={15} />
            ইনভয়েস / প্রিন্ট
          </button>

          <button
            type="button"
            onClick={printCourierSlip}
            className="inline-flex items-center gap-2 rounded-xl border border-base-300 bg-white px-3 py-2.5 text-xs font-bold text-secondary shadow-sm hover:bg-base-200"
          >
            <Printer size={15} />
            কুরিয়ার চালান
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setStatusOpen((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-sm"
            >
              <RefreshCw size={15} className="text-[#ffe16d]" />
              স্ট্যাটাস আপডেট
              <ChevronDown size={14} />
            </button>

            {statusOpen && (
              <div className="absolute right-0 top-full z-30 mt-2 w-52 overflow-hidden rounded-xl border border-base-300 bg-white p-1.5 shadow-xl">
                {ORDER_STATUSES.map((status) => (
                  <button
                    key={status.value}
                    type="button"
                    onClick={() => updateStatus(status.value)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-xs font-semibold hover:bg-base-200 ${
                      order.status === status.value
                        ? "bg-secondary/10 text-secondary"
                        : "text-primary"
                    }`}
                  >
                    {status.label}
                    {order.status === status.value && (
                      <Check size={14} />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* URGENT ACTION BANNER */}
      {!order.phoneConfirmed &&
        !["cancelled", "delivered"].includes(order.status) && (
          <div className="relative overflow-hidden rounded-2xl border border-amber-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="absolute bottom-0 left-0 top-0 w-1.5 bg-[#ffd700]" />

            <div className="flex flex-col justify-between gap-4 pl-2 xl:flex-row xl:items-center">
              <div className="flex items-start gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#ffe16d]/50 text-primary">
                  <AlertTriangle size={22} />
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-sm font-extrabold sm:text-base">
                      ফোন কনফার্মেশন প্রয়োজন
                    </h2>
                    <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                      জরুরি
                    </span>
                  </div>

                  <p className="mt-1 max-w-3xl text-xs leading-6 text-muted">
                    কাস্টমাইজড অর্ডার প্রোডাকশনে পাঠানোর আগে
                    গ্রাহকের সাথে নাম, ডিজাইন, ডেলিভারি ঠিকানা
                    এবং বকেয়া পেমেন্ট নিশ্চিত করুন।
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 xl:shrink-0">
                {callUrl && (
                  <a
                    href={callUrl}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-secondary px-3 py-2.5 text-xs font-bold text-white"
                  >
                    <Phone size={15} />
                    কল করুন
                  </a>
                )}

                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-3 py-2.5 text-xs font-bold text-white"
                  >
                    <MessageCircle size={16} />
                    WhatsApp
                  </a>
                )}

                <button
                  type="button"
                  onClick={confirmPhone}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#ffe16d] px-3 py-2.5 text-xs font-bold text-primary"
                >
                  <CheckCircle2 size={15} />
                  কনফার্মড
                </button>

                <button
                  type="button"
                  onClick={() => setFollowUp((prev) => !prev)}
                  className={`rounded-xl px-3 py-2.5 text-xs font-bold ${
                    followUp
                      ? "bg-amber-100 text-amber-800"
                      : "bg-base-200 text-muted"
                  }`}
                >
                  <Clock3 size={15} className="mr-1 inline" />
                  {followUp ? "Follow-up Marked" : "পরে যোগাযোগ"}
                </button>
              </div>
            </div>
          </div>
        )}

      {/* MAIN 8 / 4 GRID */}
      <div className="grid items-start gap-5 xl:grid-cols-12">

        {/* LEFT COLUMN */}
        <div className="space-y-5 xl:col-span-8">

          {/* ORDERED PRODUCTS */}
          <Section
            title="অর্ডারকৃত আইটেম ও কাস্টমাইজেশন বিবরণী"
            subtitle="Ordered Products & Bespoke Specifications"
            icon={Package}
            right={
              <span className="rounded-full bg-primary px-3 py-1 text-[11px] font-bold text-white">
                {totalQuantity.toLocaleString("bn-BD")} টি আইটেম
              </span>
            }
          >
            <div className="space-y-4">
              {order.products.map((product) => (
                <div
                  key={product.id}
                  className="rounded-xl bg-base-200/70 p-3 sm:p-4 border-2 border-dashed border-secondary/40"
                >
                  {/* PRODUCT HEADER */}
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div className="flex min-w-0 items-start gap-3">
                      <ProductImage
                        src={product.image}
                        alt={product.name}
                      />

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          {product.customized && (
                            <span className="rounded-md bg-[#ffe16d] px-2 py-1 text-[10px] font-bold text-primary">
                              Custom Gift
                            </span>
                          )}

                          <span className="text-[10px] font-semibold text-muted">
                            SKU: {product.sku}
                          </span>
                        </div>

                        <h3 className="mt-2 text-sm font-extrabold leading-6 text-primary sm:text-base">
                          {product.name}
                        </h3>

                        <p className="mt-1 text-xs text-muted">
                          {product.variant}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 text-left sm:text-right">
                      <p className="text-lg font-extrabold text-primary">
                        {money(product.price * product.quantity)}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        পরিমাণ: {product.quantity} টি
                      </p>
                      <p className="mt-1 text-[11px] text-muted">
                        Unit: {money(product.price)}
                      </p>
                    </div>
                  </div>

                  {/* CUSTOMIZATION DEEP DIVE */}
                  {product.customized && product.customization && (
                    <div className="mt-4 space-y-3 rounded-xl border border-base-300 bg-white p-3 sm:p-4">
                      <h4 className="flex items-center gap-2 text-xs font-extrabold text-secondary">
                        <Paintbrush size={16} />
                        কাস্টমাইজেশন স্পেসিফিকেশন
                      </h4>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-lg bg-base-200 p-3">
                          <p className="text-[11px] text-muted">
                            কাস্টম টেক্সট / নাম
                          </p>
                          <p className="mt-2 text-sm font-extrabold leading-6 text-secondary">
                            {product.customization.text || "—"}
                          </p>
                        </div>

                        <div className="rounded-lg bg-base-200 p-3">
                          <p className="text-[11px] text-muted">
                            ডিজাইন স্পেসিফিকেশন
                          </p>
                          <p className="mt-2 text-xs font-semibold text-primary">
                            Font: {product.customization.font || "Default"}
                          </p>
                          <p className="mt-1 text-xs text-muted">
                            Color: {product.customization.color || "Default"}
                          </p>
                        </div>
                      </div>

                      {product.customization.instructions && (
                        <div>
                          <p className="mb-2 text-xs font-bold text-primary">
                            গ্রাহকের বিশেষ নির্দেশনা
                          </p>
                          <div className="rounded-lg bg-[#ffe16d]/25 p-3 text-xs leading-6 text-primary">
                            {product.customization.instructions}
                          </div>
                        </div>
                      )}

                      {product.customization.referenceFiles?.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-bold text-primary">
                            Uploaded Reference Files
                          </p>

                          {product.customization.referenceFiles.map(
                            (file, index) => (
                              <div
                                key={index}
                                className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-base-200 p-3"
                              >
                                <div className="flex min-w-0 items-center gap-2">
                                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                                    <FileImage size={18} />
                                  </div>

                                  <p className="break-all text-xs font-semibold text-primary">
                                    {file.name}
                                  </p>
                                </div>

                                {file.url ? (
                                  <a
                                    href={file.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-2 text-xs font-bold text-secondary"
                                  >
                                    <ExternalLink size={14} />
                                    View File
                                  </a>
                                ) : (
                                  <span className="text-[11px] text-muted">
                                    Demo attachment
                                  </span>
                                )}
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* GIFT MESSAGE */}
              {order.giftMessage?.message && (
                <div className="rounded-xl bg-gradient-to-br from-[#f8f5fa] to-[#eee2f3] p-4">
                  <h4 className="mb-3 flex items-center gap-2 text-xs font-extrabold text-secondary">
                    <Gift size={17} />
                    উপহারের বিশেষ চিরকুট
                  </h4>

                  <blockquote className="rounded-lg border-l-4 border-secondary bg-white p-4 text-sm italic leading-7 text-primary">
                    “{order.giftMessage.message}”
                    <p className="mt-2 text-right text-xs font-bold not-italic">
                      — {order.giftMessage.from}
                    </p>
                  </blockquote>
                </div>
              )}
            </div>
          </Section>

          {/* ORDER TIMELINE */}
          <Section
            title="অর্ডার প্রসেসিং ও ডেলিভারি টাইমলাইন"
            subtitle="Order Activity & Fulfillment History"
            icon={History}
          >
            <div className="relative space-y-0 pl-6">
              <div className="absolute bottom-3 left-[7px] top-3 w-0.5 bg-base-300" />

              {order.history.map((event) => (
                <div
                  key={event.id}
                  className={`relative pb-6 last:pb-0 ${
                    event.type === "pending" ? "opacity-55" : ""
                  }`}
                >
                  <div
                    className={`absolute -left-6 top-1 size-4 rounded-full border-[3px] border-white ${
                      event.type === "completed"
                        ? "bg-secondary"
                        : event.type === "current"
                          ? "bg-[#ffd700]"
                          : "bg-base-300"
                    }`}
                  />

                  <div
                    className={
                      event.type === "current"
                        ? "rounded-xl bg-base-200 p-3"
                        : ""
                    }
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-extrabold text-primary sm:text-sm">
                        {event.title}
                      </p>

                      {event.type === "current" && (
                        <span className="rounded-full bg-[#ffe16d] px-2 py-1 text-[10px] font-bold text-primary">
                          চলমান
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-xs leading-5 text-muted">
                      {event.description}
                    </p>

                    {event.date && (
                      <p className="mt-2 text-[10px] font-semibold text-secondary">
                        {formatDate(event.date)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* INTERNAL ADMIN NOTES */}
          <Section
            title="ইন্টারনাল অ্যাডমিন ও কারিগর নোট"
            subtitle="Only visible to authorized staff"
            icon={MessageSquareText}
          >
            <div className="space-y-3">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="flex items-start gap-3 rounded-xl bg-base-200 p-3"
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                    AD
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-extrabold text-primary">
                        {note.author}
                      </p>
                      <span className="text-[10px] text-muted">
                        {formatDate(note.createdAt)}
                      </span>
                    </div>
                    <p className="mt-2 text-xs leading-6 text-muted">
                      {note.text}
                    </p>
                  </div>
                </div>
              ))}

              <div className="pt-2">
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={3}
                  placeholder="নতুন ইন্টারনাল নোট বা ওয়ার্কশপ নির্দেশনা লিখুন..."
                  className="w-full resize-y rounded-xl border border-base-300 bg-base-200 p-3 text-xs text-primary outline-none focus:border-secondary"
                />

                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={addNote}
                    disabled={!noteText.trim()}
                    className="inline-flex items-center gap-2 rounded-xl bg-secondary px-4 py-2.5 text-xs font-bold text-white disabled:opacity-40"
                  >
                    <Plus size={16} />
                    নোট যোগ করুন
                  </button>
                </div>
              </div>
            </div>
          </Section>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-5 xl:col-span-4">

          {/* CUSTOMER PROFILE */}
          <Section
            title="গ্রাহক প্রোফাইল"
            subtitle="Customer & Contact Information"
            icon={UserRound}
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-secondary/15 text-lg font-extrabold text-secondary">
                {order.customer.name.slice(0, 1)}
              </div>

              <div>
                <h3 className="text-sm font-extrabold text-primary">
                  {order.customer.name}
                </h3>
                <p className="mt-1 text-[11px] text-muted">
                  পূর্ববর্তী অর্ডার: {order.customer.previousOrders} টি
                </p>
              </div>
            </div>

            {/* PHONE */}
            <div className="flex items-center justify-between gap-2 rounded-xl bg-base-200 p-3">
              <div className="flex min-w-0 items-center gap-2">
                <Phone size={15} className="shrink-0 text-secondary" />
                <span className="truncate text-xs font-bold">
                  {order.customer.phone}
                </span>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                {callUrl && (
                  <a
                    href={callUrl}
                    title="Call"
                    className="rounded-lg p-1.5 text-secondary hover:bg-white"
                  >
                    <Phone size={15} />
                  </a>
                )}

                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="WhatsApp"
                    className="rounded-lg p-1.5 text-green-600 hover:bg-white"
                  >
                    <MessageCircle size={16} />
                  </a>
                )}

                <button
                  type="button"
                  onClick={() =>
                    copyText(order.customer.phone, "phone")
                  }
                  className="rounded-lg p-1.5 text-muted hover:bg-white"
                  title="Copy Phone"
                >
                  {copied === "phone" ? (
                    <Check size={15} />
                  ) : (
                    <Copy size={15} />
                  )}
                </button>
              </div>
            </div>

            {order.customer.alternatePhone && (
              <div className="mt-2 flex items-center gap-2 rounded-xl bg-base-200 p-3">
                <Phone size={15} className="text-muted" />
                <span className="text-xs text-muted">
                  {order.customer.alternatePhone}
                </span>
              </div>
            )}

            {order.customer.email && (
              <div className="mt-2 flex items-center gap-2 rounded-xl bg-base-200 p-3">
                <Mail size={15} className="shrink-0 text-muted" />
                <span className="min-w-0 break-all text-xs text-muted">
                  {order.customer.email}
                </span>
              </div>
            )}

            <div className="mt-4 border-t border-base-300 pt-4">
              <p className="mb-2 flex items-center gap-2 text-xs font-extrabold">
                <MapPin size={15} className="text-secondary" />
                ডেলিভারি ঠিকানা
              </p>

              <div className="rounded-xl bg-base-200 p-3">
                <p className="text-xs font-bold">
                  {order.shipping.recipientName}
                </p>
                <p className="mt-1 text-xs leading-6 text-muted">
                  {order.shipping.address}
                </p>
                <p className="mt-1 text-[11px] text-muted">
                  {order.shipping.district},{" "}
                  {order.shipping.division}
                </p>
              </div>

              {order.shipping.note && (
                <p className="mt-2 rounded-lg bg-[#ffe16d]/25 p-3 text-xs leading-5 text-primary">
                  {order.shipping.note}
                </p>
              )}
            </div>
          </Section>

          {/* PAYMENT BREAKDOWN */}
          <Section
            title="পেমেন্ট বিবরণী"
            subtitle="Financial Reconciliation"
            icon={Wallet}
            right={
              <span className="rounded-full bg-[#ffe16d] px-2.5 py-1 text-[10px] font-bold text-primary">
                Partial Payment
              </span>
            }
          >
            <InfoRow
              label="পণ্যের মূল্য"
              value={money(order.pricing.subtotal)}
            />

            <InfoRow
              label={
                order.pricing.coupon
                  ? `Discount (${order.pricing.coupon})`
                  : "Discount"
              }
              value={
                <span className="text-red-600">
                  −{money(order.pricing.discount)}
                </span>
              }
            />

            <InfoRow
              label="Gift Packaging"
              value={money(order.pricing.packagingCharge)}
            />

            <InfoRow
              label="Delivery Charge"
              value={money(order.pricing.deliveryCharge)}
            />

            <div className="my-3 border-t border-base-300" />

            <InfoRow
              label="Grand Total"
              value={money(order.pricing.total)}
              strong
            />

            {/* VERIFIED ADVANCE */}
            <div className="mt-3 rounded-xl bg-green-50 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="flex items-center gap-1.5 text-xs font-bold text-green-800">
                  <CheckCircle2 size={15} />
                  Verified Advance
                </p>
                <p className="text-sm font-extrabold text-green-800">
                  {money(verifiedAdvance)}
                </p>
              </div>

              {order.payment.verifiedAt && (
                <p className="mt-2 text-[10px] text-green-700">
                  Verified: {formatDate(order.payment.verifiedAt)}
                </p>
              )}
            </div>

            {/* REMAINING BALANCE */}
            <div className="mt-3 rounded-xl bg-gradient-to-r from-[#ffe16d]/35 to-[#ffe16d]/65 p-4">
              <p className="text-[11px] font-bold text-primary">
                অবশিষ্ট প্রদেয় ব্যালেন্স
              </p>

              <p className="mt-2 text-2xl font-extrabold text-primary">
                {money(remainingBalance)}
              </p>

              <p className="mt-1 text-[11px] text-primary/70">
                এখনো সংগ্রহ করা হয়নি
              </p>
            </div>

            <div className="mt-4 border-t border-base-300 pt-3">
              <InfoRow
                label="Payment Method"
                value={order.payment.method}
              />

              <InfoRow
                label="Sender Phone"
                value={order.payment.senderPhone}
              />

              <InfoRow
                label="Submitted Amount"
                value={money(order.payment.submittedAmount)}
              />

              <InfoRow
                label="Transaction ID"
                value={
                  <span className="break-all font-mono text-[11px]">
                    {order.payment.transactionId}
                  </span>
                }
              />
            </div>

            <Link
              to={`/admin/payments?order=${order.id}`}
              className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-secondary/20 bg-secondary/10 px-4 py-3 text-xs font-bold text-secondary hover:bg-secondary hover:text-white"
            >
              <ShieldCheck size={16} />
              Payment Details
              <ArrowRight size={14} />
            </Link>
          </Section>

          {/* COURIER & LOGISTICS */}
          <Section
            title="লজিস্টিকস ও কুরিয়ার"
            subtitle="Delivery Fulfillment"
            icon={Truck}
          >
            <InfoRow
              label="Courier"
              value={order.delivery.courier || "Not Assigned"}
            />

            <InfoRow
              label="Tracking ID"
              value={
                <span className="font-mono text-secondary">
                  {order.delivery.trackingId || "Pending"}
                </span>
              }
            />

            <InfoRow
              label="Parcel Weight"
              value={order.delivery.parcelWeight || "—"}
            />

            <InfoRow
              label="Expected Delivery"
              value={
                order.delivery.expectedDelivery
                  ? new Date(
                      `${order.delivery.expectedDelivery}T12:00:00+06:00`
                    ).toLocaleDateString("bn-BD", {
                      timeZone: "Asia/Dhaka",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "—"
              }
            />

            <div className="mt-4 space-y-2">
              {order.delivery.trackingUrl && (
                <a
                  href={order.delivery.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl bg-secondary/10 px-4 py-3 text-xs font-bold text-secondary"
                >
                  <ExternalLink size={15} />
                  Track Courier
                </a>
              )}

              <Link
                to={`/admin/delivery?order=${order.id}`}
                className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-bold text-white"
              >
                <Truck size={16} />
                Manage Delivery
                <ArrowRight size={14} />
              </Link>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
