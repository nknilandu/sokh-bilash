import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getAuth, onAuthStateChanged } from "firebase/auth";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clipboard,
  Gift,
  ImageOff,
  Loader2,
  LockKeyhole,
  Phone,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
  UserRound,
  Wallet,
  AlertTriangle,
  Package,
  ChevronDown,
  Database,
  HardDrive,
  X,
  Zap,
  Info,
} from "lucide-react";

import useCart from "../../hooks/useCart";
import { money, orderRequest, saveGuestOrderToken } from "../../utils/orderApi";
import { app } from "../../../firebase/firebase.config";
import { AuthContext } from "../../providers/AuthProvider";
import { DIVISIONS } from "../../utils/bangladeshRegions";

const auth = getAuth(app);

// ==========================================
// CONFIGURATION
// ==========================================

const GUEST_PROFILE_KEY = "sokhbilash-guest-shipping-v1";
const GIFT_OPTIONS_KEY = "sokhbilash-checkout-gift-options";
const BUY_NOW_KEY = "sokhbilash-buy-now-v1";
const BUY_NOW_MAX_AGE = 60 * 60 * 1000;

const EMPTY_FORM = {
  name: "",
  phone: "",
  division: "",
  district: "",
  address: "",
  note: "",
  senderPhone: "",
  trxId: "",
  amount: "",
  paymentNote: "",
};

const SHIPPING_KEYS = ["name", "phone", "division", "district", "address"];

const PAYMENT_ACCOUNTS = {
  bkash: {
    label: "বিকাশ",
    number: import.meta.env.VITE_BKASH_PERSONAL_NUMBER || "",
    color: "text-pink-700",
  },
  nagad: {
    label: "নগদ",
    number: import.meta.env.VITE_NAGAD_PERSONAL_NUMBER || "",
    color: "text-orange-600",
  },
  rocket: {
    label: "রকেট",
    number: import.meta.env.VITE_ROCKET_PERSONAL_NUMBER || "",
    color: "text-violet-700",
  },
};

const inputClass =
  "mt-1.5 w-full min-w-0 rounded-xl border border-base-300 bg-base-200/60 px-3.5 py-3 text-sm text-primary outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/10 disabled:opacity-50";

const validPhone = (value) => /^01[3-9]\d{8}$/.test(String(value || "").trim());

const configuredNumber = validPhone;

const amount = (value) => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
};

const roundMoney = (value) => Math.round((Number(value) || 0) * 100) / 100;

// ==========================================
// BUY NOW HELPERS
// ==========================================

function validBuyNowItem(item) {
  return Boolean(
    item &&
    typeof item === "object" &&
    !Array.isArray(item) &&
    String(item.productId || item.id || "").trim() &&
    Number.isInteger(Number(item.quantity)) &&
    Number(item.quantity) >= 1 &&
    Number(item.quantity) <= 10,
  );
}

function readBuyNowItem(location) {
  const stateItem = location.state?.buyNowItem;

  if (validBuyNowItem(stateItem)) {
    return stateItem;
  }

  try {
    const raw = sessionStorage.getItem(BUY_NOW_KEY);

    if (!raw) return null;

    const saved = JSON.parse(raw);

    if (
      !Number.isFinite(saved.createdAt) ||
      Date.now() - saved.createdAt > BUY_NOW_MAX_AGE ||
      saved.createdAt > Date.now() ||
      !validBuyNowItem(saved.item)
    ) {
      sessionStorage.removeItem(BUY_NOW_KEY);
      return null;
    }

    return saved.item;
  } catch {
    return null;
  }
}

function clearBuyNowItem() {
  try {
    sessionStorage.removeItem(BUY_NOW_KEY);
  } catch {
    // Storage may be disabled.
  }
}

// ==========================================
// GUEST SHIPPING PROFILE
// ==========================================

function readGuestProfile() {
  try {
    const raw = localStorage.getItem(GUEST_PROFILE_KEY);

    if (!raw) return null;

    const parsed = JSON.parse(raw);

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }

    const profile = Object.fromEntries(
      SHIPPING_KEYS.map((key) => [
        key,
        typeof parsed[key] === "string"
          ? parsed[key].trim().slice(0, key === "address" ? 500 : 150)
          : "",
      ]),
    );

    if (
      !profile.name ||
      !validPhone(profile.phone) ||
      !profile.address ||
      !DIVISIONS[profile.division]?.includes(profile.district)
    ) {
      return null;
    }

    return profile;
  } catch {
    return null;
  }
}

function storeGuestProfile(form) {
  try {
    const profile = Object.fromEntries(
      SHIPPING_KEYS.map((key) => [key, String(form[key] || "").trim()]),
    );

    localStorage.setItem(GUEST_PROFILE_KEY, JSON.stringify(profile));

    return true;
  } catch {
    return false;
  }
}

function forgetGuestProfile() {
  try {
    localStorage.removeItem(GUEST_PROFILE_KEY);
  } catch {
    // Storage disabled.
  }
}

// ==========================================
// GIFT MESSAGE ONLY
// ==========================================

function readGiftOptions() {
  try {
    const data = JSON.parse(sessionStorage.getItem(GIFT_OPTIONS_KEY) || "{}");

    return {
      message:
        typeof data.message === "string" ? data.message.slice(0, 250) : "",
    };
  } catch {
    return { message: "" };
  }
}

// ==========================================
// CHECKOUT ID
// ==========================================

function createCheckoutId() {
  if (
    typeof crypto === "undefined" ||
    typeof crypto.randomUUID !== "function"
  ) {
    throw new Error(
      "Secure checkout requires HTTPS and crypto.randomUUID support",
    );
  }

  return crypto.randomUUID();
}

// ==========================================
// CART LINE FOR BACKEND
// ==========================================

const cartLine = (item) => ({
  cartId: item.cartId,
  productId: String(item.productId || item.id || ""),
  quantity: Number(item.quantity) || 1,
  variantKey: item.variantKey || "",
  packaging: item.packaging || "regular",
  customization: item.customization || {
    mode: "none",
  },
});

// ==========================================
// CHECKOUT ITEM
// ==========================================

function CheckoutItem({ item }) {
  const custom = item.customization || {};
  const photos = Array.isArray(custom.photos) ? custom.photos : [];

  const details = [
    ["নাম", custom.name],
    ["তারিখ", custom.date || custom.dob],
    ["বার্তা", custom.message || custom.engraving],
    ["নোট", custom.note || custom.customNote],
  ].filter(([, value]) => Boolean(value));

  const quantity = Number(item.quantity) || 1;
  const unitPrice = Number(item.unitPrice ?? item.price ?? 0);

  return (
    <article className="min-w-0 rounded-xl border border-dashed border-secondary/25 bg-base-100 p-3">
      <div className="flex min-w-0 gap-2.5">
        <div className="size-14 shrink-0 overflow-hidden rounded-lg bg-base-200">
          {item.image ? (
            <img
              src={item.image}
              alt={item.name}
              className="size-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-muted">
              <ImageOff size={19} />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-xs font-bold leading-5 text-primary">
            {item.name}
          </p>

          {item.sku && (
            <p className="mt-1 truncate text-[10px] text-muted">
              SKU: {item.sku}
            </p>
          )}

          <div className="mt-1.5 flex flex-wrap gap-1">
            {Object.entries(item.selectedOptions || {})
              .filter(([, value]) => Boolean(value))
              .map(([key, value]) => (
                <span
                  key={key}
                  className="rounded bg-base-200 px-1.5 py-0.5 text-[10px] text-primary"
                >
                  {key}: {String(value)}
                </span>
              ))}

            <span className="inline-flex items-center gap-1 rounded bg-secondary/5 px-1.5 py-0.5 text-[10px] text-secondary">
              <Package size={10} />
              {item.packaging === "premium"
                ? "গিফট র‍্যাপিং বক্স"
                : "সাধারণ প্যাকেজিং"}
            </span>
          </div>

          <p className="mt-1.5 text-[11px] text-muted">
            {quantity} × {money(unitPrice)}
          </p>
        </div>

        <strong className="shrink-0 whitespace-nowrap text-xs text-primary">
          {money(quantity * unitPrice)}
        </strong>
      </div>

      {(details.length > 0 || photos.length > 0) && (
        <details className="group mt-3 rounded-lg bg-secondary/5">
          <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2 text-xs font-semibold text-secondary [&::-webkit-details-marker]:hidden">
            <span className="flex items-center gap-1.5">
              <Gift size={13} />
              কাস্টমাইজেশন
            </span>

            <ChevronDown
              size={15}
              className="transition group-open:rotate-180"
            />
          </summary>

          <div className="space-y-2 border-t border-secondary/10 p-3">
            {details.map(([label, value]) => (
              <p
                key={label}
                className="whitespace-pre-wrap break-words text-xs text-primary"
              >
                <strong>{label}:</strong> {value}
              </p>
            ))}

            {photos.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {photos.map((photo, index) => (
                  <a
                    key={photo.id || index}
                    href={photo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="aspect-square overflow-hidden rounded-lg bg-base-200"
                  >
                    <img
                      src={photo.url}
                      alt={`Customer photo ${index + 1}`}
                      className="size-full object-cover"
                      loading="lazy"
                    />
                  </a>
                ))}
              </div>
            )}
          </div>
        </details>
      )}
    </article>
  );
}

// ==========================================
// PAYMENT DIFFERENCE SUMMARY
// ==========================================

function PaymentDifferenceSummary({
  total,
  paidAmount,
  amountEntered,
  quoteReady,
}) {
  const due = Math.max(0, roundMoney(total - paidAmount));
  const excess = Math.max(0, roundMoney(paidAmount - total));

  const isUnderpaid = amountEntered && paidAmount < total;
  const isOverpaid = amountEntered && paidAmount > total;
  const isExact = amountEntered && roundMoney(paidAmount) === roundMoney(total);

  return (
    <div className="space-y-3 rounded-xl border border-gold-soft bg-gold-soft/20 p-3 sm:p-4">
      <div className="flex items-center gap-2">
        <Wallet size={17} className="text-secondary" />
        <h3 className="text-sm font-bold text-primary">পেমেন্টের সারসংক্ষেপ</h3>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted">মোট অর্ডার মূল্য</span>
          <strong className="text-primary">
            {quoteReady ? money(total) : "যাচাই হচ্ছে..."}
          </strong>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-muted">পাঠানো টাকার পরিমাণ</span>
          <strong className="text-secondary">{money(paidAmount)}</strong>
        </div>
      </div>

      {!quoteReady && (
        <p className="border-t border-primary/10 pt-2 text-[11px] leading-5 text-muted">
          সঠিক পেমেন্টের পার্থক্য দেখতে বিভাগ ও জেলা নির্বাচন করে অর্ডারের মূল্য
          যাচাই করুন।
        </p>
      )}

      {quoteReady && !amountEntered && (
        <p className="border-t border-primary/10 pt-2 text-[11px] leading-5 text-muted">
          আপনি কত টাকা Send Money করেছেন, উপরের Amount ঘরে লিখুন।
        </p>
      )}

      {quoteReady && isUnderpaid && (
        <div className="space-y-2 border-t border-primary/10 pt-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-bold text-amber-800">বাকি টাকা</span>
            <strong className="text-sm text-amber-800">{money(due)}</strong>
          </div>

          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <AlertTriangle
              size={17}
              className="mt-0.5 shrink-0 text-amber-600"
            />

            <div>
              <p className="text-xs font-bold text-amber-900">আংশিক পেমেন্ট</p>
              <p className="mt-1 text-[11px] leading-5 text-amber-900">
                বাকি {money(due)} পণ্য হাতে পাওয়ার পর পরিশোধ করতে হবে। অর্ডার
                প্রক্রিয়াকরণের আগে আমাদের টিম ফোনে যোগাযোগ করে বিষয়টি নিশ্চিত
                করবে।
              </p>
            </div>
          </div>
        </div>
      )}

      {quoteReady && isOverpaid && (
        <div className="space-y-2 border-t border-primary/10 pt-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-bold text-emerald-800">
              অতিরিক্ত পাঠানো টাকা
            </span>
            <strong className="text-sm text-emerald-700">
              +{money(excess)}
            </strong>
          </div>

          <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
            <ShieldCheck
              size={17}
              className="mt-0.5 shrink-0 text-emerald-700"
            />

            <div>
              <p className="text-xs font-bold text-emerald-900">
                অতিরিক্ত পেমেন্ট
              </p>
              <p className="mt-1 text-[11px] leading-5 text-emerald-900">
                অতিরিক্ত {money(excess)} পাঠানো হয়েছে। পেমেন্ট যাচাই করে আমাদের
                টিম ফোনে যোগাযোগ করবে। আপনার সম্মতিতে অতিরিক্ত টাকা ফেরত দেওয়া
                হবে অথবা সমমূল্যের অতিরিক্ত পণ্য দেওয়া হবে।
              </p>
            </div>
          </div>
        </div>
      )}

      {quoteReady && isExact && (
        <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
          <CheckCircle2
            size={17}
            className="mt-0.5 shrink-0 text-emerald-700"
          />

          <div>
            <p className="text-xs font-bold text-emerald-900">
              পেমেন্টের পরিমাণ মিলেছে
            </p>
            <p className="mt-1 text-[11px] leading-5 text-emerald-800">
              আপনার দেওয়া টাকার পরিমাণ অর্ডারের মোট মূল্যের সঙ্গে মিলেছে। Admin
              যাচাই করার পর পেমেন্ট নিশ্চিত হবে।
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// MAIN CHECKOUT PAGE
// ==========================================

export default function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const buyNowMode =
    new URLSearchParams(location.search).get("mode") === "buy-now";

  const buyNowItem = useMemo(
    () => (buyNowMode ? readBuyNowItem(location) : null),
    [buyNowMode, location],
  );

  const { user, loading, role, roleLoading, accountStatus } =
    useContext(AuthContext);

  const checkingRole = loading || (Boolean(user) && roleLoading);

  const canShop =
    !checkingRole &&
    (!user || (role === "customer" && accountStatus === "active"));

  const {
    cartItems,
    cartLoading,
    cartReady,
    cartError,
    clearCart,
    refreshCart,
    retrySync,
  } = useCart();

  const items = useMemo(() => {
    if (buyNowMode) {
      return buyNowItem ? [buyNowItem] : [];
    }

    return Array.isArray(cartItems) ? cartItems : [];
  }, [buyNowMode, buyNowItem, cartItems]);

  const checkoutItems = useMemo(() => items.map(cartLine), [items]);

  // ========================================
  // FORM STATE
  // ========================================

  const [authState, setAuthState] = useState({
    ready: false,
    user: null,
  });

  const [form, setForm] = useState(EMPTY_FORM);
  const [method, setMethod] = useState("cod");
  const [rememberGuest, setRememberGuest] = useState(true);

  const [guestSaved, setGuestSaved] = useState(() =>
    Boolean(readGuestProfile()),
  );

  const [giftOptions] = useState(() => {
    const saved = readGiftOptions();
    const incoming = location.state?.giftOptions || {};

    return {
      message:
        typeof incoming.message === "string"
          ? incoming.message.slice(0, 250)
          : saved.message,
    };
  });

  const [confirmedPayment, setConfirmedPayment] = useState(false);

  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const checkoutIdRef = useRef(null);
  const submittingRef = useRef(false);
  const restoredIdentityRef = useRef("");

  // ========================================
  // AUTH INITIALIZATION
  // ========================================

  useEffect(() => {
    return onAuthStateChanged(auth, (firebaseUser) => {
      setAuthState({
        ready: true,
        user: firebaseUser,
      });
    });
  }, []);

  // ========================================
  // SAVE GIFT MESSAGE
  // ========================================

  useEffect(() => {
    try {
      sessionStorage.setItem(GIFT_OPTIONS_KEY, JSON.stringify(giftOptions));
    } catch {
      // Storage disabled.
    }
  }, [giftOptions]);

  // ========================================
  // SHIPPING PROFILE QUERY
  // ========================================

  const profileQuery = useQuery({
    queryKey: ["checkout-shipping-profile", authState.user?.uid],

    enabled: canShop && authState.ready && Boolean(authState.user?.uid),

    queryFn: async ({ signal }) => {
      const guest = readGuestProfile();

      if (guest) {
        const merged = await orderRequest("/checkout/profile/merge-guest", {
          method: "POST",
          body: { profile: guest },
          signal,
        });

        forgetGuestProfile();
        return merged.profile;
      }

      const response = await orderRequest("/checkout/profile", { signal });

      return response.profile;
    },

    staleTime: 0,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // ========================================
  // RESTORE SHIPPING DETAILS
  // ========================================

  useEffect(() => {
    if (!authState.ready) return;

    const identity = authState.user?.uid
      ? `user:${authState.user.uid}`
      : "guest";

    if (restoredIdentityRef.current === identity) {
      return;
    }

    if (authState.user && !profileQuery.isSuccess) {
      return;
    }

    const profile = authState.user ? profileQuery.data : readGuestProfile();

    if (!authState.user) {
      setGuestSaved(Boolean(profile));
    }

    setForm({
      ...EMPTY_FORM,

      ...Object.fromEntries(
        SHIPPING_KEYS.map((key) => [key, profile?.[key] || ""]),
      ),

      name: profile?.name || authState.user?.displayName || "",

      phone: profile?.phone || authState.user?.phoneNumber || "",
    });

    restoredIdentityRef.current = identity;
    checkoutIdRef.current = null;
    setError("");
  }, [
    authState.ready,
    authState.user,
    profileQuery.data,
    profileQuery.isSuccess,
  ]);

  // ========================================
  // FORM UPDATE
  // ========================================

  const update = (key, value) => {
    checkoutIdRef.current = null;

    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));

    if (["senderPhone", "trxId", "amount"].includes(key)) {
      setConfirmedPayment(false);
    }

    setError("");
  };

  // ========================================
  // SHIPPING + CART STATUS
  // ========================================

  const districtValid = Boolean(
    form.district && DIVISIONS[form.division]?.includes(form.district),
  );

  const invalidItems = items.some((item) => item.unavailable === true);

  const profileReady = !authState.user || profileQuery.isSuccess;

  const cartIsReady = buyNowMode || Boolean(cartReady);

  const cartIsLoading = !buyNowMode && cartLoading;

  const localSubtotal = items.reduce(
    (sum, item) =>
      sum +
      (Number(item.unitPrice ?? item.price) || 0) *
        (Number(item.quantity) || 1),
    0,
  );

  const deliveryPreview = districtValid
    ? form.district === "নরসিংদী"
      ? 80
      : 130
    : 0;

  // ========================================
  // SERVER-SIDE QUOTE
  // ========================================

  const quoteKey = JSON.stringify({
    items: checkoutItems,
    division: form.division,
    district: form.district,
    message: giftOptions.message,
    uid: authState.user?.uid || "guest",
    mode: buyNowMode ? "buy-now" : "cart",
  });

  const quoteQuery = useQuery({
    queryKey: ["checkout-quote", quoteKey],

    enabled:
      canShop &&
      authState.ready &&
      profileReady &&
      cartIsReady &&
      !cartIsLoading &&
      items.length > 0 &&
      districtValid &&
      !invalidItems,

    queryFn: async ({ signal }) => {
      const response = await orderRequest("/checkout/quote", {
        method: "POST",
        signal,

        body: {
          items: checkoutItems,

          customer: {
            division: form.division,
            district: form.district,
          },

          giftOptions: {
            message: giftOptions.message.trim(),
          },

          couponCode: "",
        },
      });

      const required = ["subtotal", "deliveryCharge", "total"];

      if (
        required.some(
          (field) =>
            response[field] == null ||
            !Number.isFinite(Number(response[field])),
        )
      ) {
        throw new Error("Server থেকে সঠিক অর্ডার মূল্য পাওয়া যায়নি।");
      }

      if (
        response.giftWrapCharge != null &&
        Number(response.giftWrapCharge) !== 0
      ) {
        throw new Error(
          "Server-এ পুরোনো Gift Wrapping Charge আছে। Backend আপডেট করুন।",
        );
      }

      return {
        subtotal: Number(response.subtotal),
        deliveryCharge: Number(response.deliveryCharge),
        total: Number(response.total),
      };
    },

    staleTime: 10000,
    refetchOnWindowFocus: true,
    retry: 1,
  });

  const quoteReady =
    districtValid && quoteQuery.isSuccess && !quoteQuery.isFetching;

  const quote = quoteReady ? quoteQuery.data : null;

  const subtotal = quote?.subtotal ?? localSubtotal;

  const delivery = quote?.deliveryCharge ?? deliveryPreview;

  const total = quote?.total ?? subtotal + delivery;

  // ========================================
  // PAYMENT CALCULATION
  // ========================================

  const isCod = method === "cod";

  const paymentAccount = isCod ? null : PAYMENT_ACCOUNTS[method];

  const paymentConfigured = isCod || configuredNumber(paymentAccount?.number);

  const amountEntered =
    !isCod &&
    /^\d+(?:\.\d{1,2})?$/.test(String(form.amount).trim()) &&
    amount(form.amount) > 0;

  const paidAmount = isCod ? 0 : amount(form.amount);

  const due = Math.max(0, roundMoney(total - paidAmount));

  const excess = Math.max(0, roundMoney(paidAmount - total));

  // ========================================
  // FORM VALIDATION
  // ========================================

  const validate = () => {
    if (!canShop) {
      return "এই অ্যাকাউন্ট দিয়ে অর্ডার করা যাবে না।";
    }

    if (!cartIsReady || cartIsLoading || !authState.ready || !profileReady) {
      return "Checkout এখনো প্রস্তুত হয়নি।";
    }

    if (!items.length) {
      return buyNowMode
        ? "Buy Now পণ্য পাওয়া যায়নি। আবার নির্বাচন করুন।"
        : "কার্ট খালি।";
    }

    if (invalidItems) {
      return "কার্টে অনুপলব্ধ পণ্য আছে।";
    }

    if (form.name.trim().length < 2) {
      return "সঠিক নাম লিখুন।";
    }

    if (!validPhone(form.phone)) {
      return "সঠিক ১১ সংখ্যার মোবাইল নম্বর লিখুন।";
    }

    if (!districtValid) {
      return "সঠিক বিভাগ ও জেলা নির্বাচন করুন।";
    }

    if (form.address.trim().length < 5) {
      return "সম্পূর্ণ ডেলিভারি ঠিকানা লিখুন।";
    }

    if (!quoteReady || !quote) {
      return "Server থেকে অর্ডারের মোট মূল্য যাচাই হয়নি।";
    }

    if (!isCod) {
      if (!paymentConfigured) {
        return "এই পেমেন্ট পদ্ধতির নম্বর পাওয়া যাচ্ছে না।";
      }

      if (!validPhone(form.senderPhone)) {
        return "সঠিক Sender Number লিখুন।";
      }

      if (!/^[A-Za-z0-9_-]{5,60}$/.test(form.trxId.trim())) {
        return "সঠিক Transaction ID লিখুন।";
      }

      if (!amountEntered) {
        return "পাঠানো টাকার সঠিক পরিমাণ লিখুন।";
      }

      if (!confirmedPayment) {
        return "পেমেন্ট তথ্য সঠিক বলে নিশ্চিত করুন।";
      }
    }

    return "";
  };

  // ========================================
  // SUBMIT ORDER
  // ========================================

  const submitOrder = async (event) => {
    event.preventDefault();

    if (!canShop) {
      setError("Admin বা নিষ্ক্রিয় অ্যাকাউন্ট দিয়ে অর্ডার করা যাবে না।");
      return;
    }

    if (submittingRef.current) return;

    const validationError = validate();

    if (validationError) {
      setError(validationError);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setError("");

    try {
      if (!checkoutIdRef.current) {
        checkoutIdRef.current = createCheckoutId();
      }

      const payload = {
        checkoutId: checkoutIdRef.current,

        customer: {
          name: form.name.trim(),
          phone: form.phone.trim(),
          division: form.division,
          district: form.district,
          address: form.address.trim(),
          note: form.note.trim(),
          email: authState.user?.email || "",
        },

        items: checkoutItems,

        giftOptions: {
          message: giftOptions.message.trim(),
        },

        couponCode: "",

        payment: isCod
          ? {
              method: "cod",
            }
          : {
              method,
              senderPhone: form.senderPhone.trim(),
              trxId: form.trxId.trim().toUpperCase(),
              amount: paidAmount,
              note: form.paymentNote.trim(),
            },
      };

      const response = await orderRequest("/orders", {
        method: "POST",
        body: payload,
      });

      if (!response.orderId) {
        throw new Error("Order ID পাওয়া যায়নি—সাপোর্টে যোগাযোগ করুন।");
      }

      if (response.accessToken) {
        saveGuestOrderToken(
          response.orderId,
          response.orderNumber,
          response.accessToken,
        );
      }

      // Guest shipping details
      if (!authState.user) {
        if (rememberGuest) {
          setGuestSaved(storeGuestProfile(form));
        } else {
          forgetGuestProfile();
          setGuestSaved(false);
        }
      }

      // Buy Now must not clear the existing cart.
      if (buyNowMode) {
        clearBuyNowItem();
      } else {
        try {
          if (!authState.user && typeof clearCart === "function") {
            await clearCart();
          } else if (typeof refreshCart === "function") {
            await refreshCart();
          }
        } catch (cleanupError) {
          console.warn("Order created; cart cleanup failed:", cleanupError);
        }
      }

      navigate(`/order-confirmation/${encodeURIComponent(response.orderId)}`, {
        replace: true,

        state: {
          orderId: response.orderId,
          orderNumber: response.orderNumber,
          guestAccessToken: response.accessToken || "",
          orderSubmitted: true,
        },
      });
    } catch (requestError) {
      setError(requestError?.message || "অর্ডার জমা দেওয়া যায়নি।");

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  // ========================================
  // ROLE RESTRICTION
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

  if (!canShop) {
    return (
      <main className="page-bg flex min-h-[65vh] items-center justify-center px-4">
        <div className="section-card w-full max-w-md p-7 text-center">
          <LockKeyhole size={32} className="mx-auto text-secondary" />

          <h1 className="mt-4 text-xl font-bold text-primary">
            Checkout অনুমোদিত নয়
          </h1>

          <p className="mt-3 text-sm leading-6 text-muted">
            শুধু Guest অথবা Active Customer অর্ডার করতে পারবেন। Admin অ্যাকাউন্ট
            দিয়ে Checkout করা যাবে না।
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
  // LOADING STATE
  // ========================================

  if (
    !authState.ready ||
    cartIsLoading ||
    (authState.user && profileQuery.isLoading)
  ) {
    return (
      <main className="page-bg flex min-h-[65vh] items-center justify-center">
        <div className="text-center">
          <Loader2 size={29} className="mx-auto animate-spin text-secondary" />

          <p className="mt-3 text-sm text-muted">
            Checkout ও Saved Address লোড হচ্ছে...
          </p>
        </div>
      </main>
    );
  }

  // ========================================
  // ERROR STATE
  // ========================================

  if (!cartIsReady || (authState.user && profileQuery.isError)) {
    return (
      <main className="page-bg flex min-h-[65vh] items-center justify-center px-4">
        <section className="section-card w-full max-w-md p-6 text-center">
          <AlertTriangle size={28} className="mx-auto text-amber-600" />

          <h2 className="mt-3 font-bold text-primary">
            Checkout তথ্য লোড হয়নি
          </h2>

          <p className="mt-2 text-xs leading-6 text-muted">
            {profileQuery.error?.message || cartError || "আবার চেষ্টা করুন।"}
          </p>

          <button
            type="button"
            onClick={() =>
              authState.user && profileQuery.isError
                ? profileQuery.refetch()
                : retrySync()
            }
            className="btn-brand mt-4"
          >
            <RefreshCw size={15} />
            আবার চেষ্টা করুন
          </button>
        </section>
      </main>
    );
  }

  // ========================================
  // EMPTY CHECKOUT
  // ========================================

  if (!items.length) {
    return (
      <main className="page-bg flex min-h-[65vh] items-center justify-center px-4">
        <section className="section-card max-w-md p-7 text-center">
          <ShoppingBag size={32} className="mx-auto text-secondary" />

          <h2 className="mt-3 font-bold text-primary">
            {buyNowMode ? "Buy Now পণ্য পাওয়া যায়নি" : "আপনার কার্ট খালি"}
          </h2>

          <p className="mt-2 text-sm text-muted">
            {buyNowMode
              ? "প্রোডাক্ট পেজ থেকে আবার এখনই কিনুন নির্বাচন করুন।"
              : "Checkout করার আগে পণ্য যোগ করুন।"}
          </p>

          <Link to="/shop" className="btn-brand mt-5">
            উপহার দেখুন
            <ArrowRight size={16} />
          </Link>
        </section>
      </main>
    );
  }

  // ========================================
  // CHECKOUT UI
  // ========================================

  return (
    <main className="page-bg min-h-screen">
      <div className="page-container py-7 sm:py-10">
        {/* PAGE HEADING */}

        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-secondary">
              <ShieldCheck size={15} />
              SECURE CHECKOUT
            </p>

            <h1 className="text-2xl font-bold text-primary sm:text-3xl">
              অর্ডার সম্পন্ন করুন
            </h1>

            <p className="mt-2 text-xs leading-5 text-muted sm:text-sm">
              ডেলিভারি ও পেমেন্ট তথ্য যাচাই করে অর্ডার নিশ্চিত করুন।
            </p>

            {buyNowMode && (
              <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-gold-soft/40 px-3 py-1.5 text-xs font-bold text-primary">
                <Zap size={14} />
                Buy Now · শুধু নির্বাচিত পণ্য
              </span>
            )}
          </div>

          <Link
            to={
              buyNowMode && buyNowItem
                ? `/shop/${buyNowItem.productId}`
                : "/cart"
            }
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-secondary hover:underline"
          >
            <ArrowLeft size={15} />
            {buyNowMode ? "প্রোডাক্টে ফিরে যান" : "কার্টে ফিরে যান"}
          </Link>
        </div>

        {/* ERROR */}

        {error && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4"
          >
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-red-600" />

            <p className="text-sm leading-6 text-red-700">{error}</p>
          </div>
        )}

        <form
          onSubmit={submitOrder}
          noValidate
          className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.85fr)]"
        >
          {/* ==================================
              LEFT COLUMN
          ================================== */}

          <div className="min-w-0 space-y-5">
            {/* GUEST CHECKOUT */}

            {!authState.user && (
              <section className="section-card flex items-start gap-3 p-4 sm:p-5">
                <span className="icon-box shrink-0">
                  <Sparkles size={19} />
                </span>

                <div>
                  <p className="text-sm font-bold text-primary">
                    Guest Checkout
                  </p>

                  <p className="mt-1 text-xs leading-5 text-muted">
                    অ্যাকাউন্ট ছাড়াই অর্ডার করতে পারবেন।
                  </p>

                  <Link
                    to="/login"
                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-secondary hover:underline"
                  >
                    লগইন করুন
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </section>
            )}

            {/* ==================================
                CUSTOMER & DELIVERY
            ================================== */}

            <section className="section-card p-4 sm:p-6">
              <div className="mb-5 flex items-center gap-3">
                <span className="icon-box">
                  <UserRound size={19} />
                </span>

                <div>
                  <h2 className="font-bold text-primary">
                    ১. গ্রাহক ও ডেলিভারি তথ্য
                  </h2>

                  <p className="text-xs text-muted">
                    Customer & Shipping Information
                  </p>
                </div>
              </div>

              {/* SAVED PROFILE NOTICE */}

              <div className="mb-4 flex items-start gap-2 rounded-xl bg-secondary/5 p-3">
                {authState.user ? (
                  <Database
                    size={16}
                    className="mt-0.5 shrink-0 text-secondary"
                  />
                ) : (
                  <HardDrive
                    size={16}
                    className="mt-0.5 shrink-0 text-secondary"
                  />
                )}

                <p className="text-xs leading-5 text-muted">
                  {authState.user
                    ? "আপনার অ্যাকাউন্টের Saved Delivery Details MongoDB থেকে দেখানো হয়েছে। অর্ডার সফল হলে নতুন ঠিকানাটি ভবিষ্যতের জন্য Save হবে।"
                    : guestSaved
                      ? "এই ডিভাইসে আগে সংরক্ষিত Delivery Details দেখানো হয়েছে।"
                      : "প্রথম অর্ডার সফল হলে এই ডিভাইসে ডেলিভারি তথ্য সংরক্ষণ করতে পারবেন।"}
                </p>
              </div>

              <div className="space-y-4">
                {/* NAME */}

                <label className="block text-xs font-semibold text-primary sm:text-sm">
                  পূর্ণ নাম <span className="text-red-500">*</span>
                  <input
                    value={form.name}
                    onChange={(event) => update("name", event.target.value)}
                    maxLength={150}
                    autoComplete="name"
                    placeholder="আপনার পুরো নাম"
                    className={inputClass}
                    disabled={submitting}
                  />
                </label>

                {/* PHONE */}

                <label className="block text-xs font-semibold text-primary sm:text-sm">
                  মোবাইল নম্বর <span className="text-red-500">*</span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={form.phone}
                    onChange={(event) =>
                      update(
                        "phone",
                        event.target.value.replace(/\D/g, "").slice(0, 11),
                      )
                    }
                    maxLength={11}
                    autoComplete="tel"
                    placeholder="01712345678"
                    className={inputClass}
                    disabled={submitting}
                  />
                </label>

                {/* DIVISION + DISTRICT */}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="block text-xs font-semibold text-primary">
                    বিভাগ <span className="text-red-500">*</span>
                    <select
                      value={form.division}
                      onChange={(event) => {
                        checkoutIdRef.current = null;

                        setForm((previous) => ({
                          ...previous,
                          division: event.target.value,
                          district: "",
                        }));

                        setError("");
                      }}
                      className={inputClass}
                      disabled={submitting}
                    >
                      <option value="">বিভাগ নির্বাচন করুন</option>

                      {Object.keys(DIVISIONS).map((division) => (
                        <option key={division} value={division}>
                          {division}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block text-xs font-semibold text-primary">
                    জেলা <span className="text-red-500">*</span>
                    <select
                      value={form.district}
                      onChange={(event) =>
                        update("district", event.target.value)
                      }
                      className={inputClass}
                      disabled={!form.division || submitting}
                    >
                      <option value="">জেলা নির্বাচন করুন</option>

                      {(DIVISIONS[form.division] || []).map((district) => (
                        <option key={district} value={district}>
                          {district}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {/* ADDRESS */}

                <label className="block text-xs font-semibold text-primary sm:text-sm">
                  সম্পূর্ণ ডেলিভারি ঠিকানা{" "}
                  <span className="text-red-500">*</span>
                  <textarea
                    rows={3}
                    value={form.address}
                    onChange={(event) => update("address", event.target.value)}
                    maxLength={500}
                    placeholder="বাড়ি, রোড, থানা, এলাকা ও বিস্তারিত ঠিকানা"
                    className={`${inputClass} resize-y`}
                    disabled={submitting}
                  />
                </label>

                {/* DELIVERY NOTE */}

                <label className="block text-xs font-semibold text-primary sm:text-sm">
                  বিশেষ নির্দেশনা{" "}
                  <span className="font-normal text-muted">(ঐচ্ছিক)</span>
                  <textarea
                    rows={2}
                    value={form.note}
                    onChange={(event) => update("note", event.target.value)}
                    maxLength={500}
                    placeholder="যেমন: ডেলিভারির আগে ফোন করবেন..."
                    className={`${inputClass} resize-y`}
                    disabled={submitting}
                  />
                </label>
              </div>

              {/* GUEST PROFILE SAVE */}

              {!authState.user && (
                <div className="mt-5 rounded-xl border border-secondary/15 bg-secondary/5 p-3">
                  <label className="flex cursor-pointer items-start gap-2.5">
                    <input
                      type="checkbox"
                      checked={rememberGuest}
                      onChange={(event) =>
                        setRememberGuest(event.target.checked)
                      }
                      className="checkbox checkbox-secondary checkbox-xs mt-0.5"
                      disabled={submitting}
                    />

                    <span className="text-xs leading-5 text-primary">
                      পরবর্তী Checkout-এর জন্য এই ডিভাইসে নাম, ফোন ও ঠিকানা Save
                      রাখুন। লগইন করলে অ্যাকাউন্টের খালি Shipping Fields-এ Sync
                      হবে।
                    </span>
                  </label>

                  {guestSaved && (
                    <button
                      type="button"
                      onClick={() => {
                        forgetGuestProfile();
                        setGuestSaved(false);
                      }}
                      className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:underline"
                    >
                      <X size={12} />
                      Saved details মুছে ফেলুন
                    </button>
                  )}

                  <p className="mt-2 text-[11px] leading-5 text-muted">
                    শেয়ার করা ডিভাইসে Save বন্ধ রাখুন। TrxID বা Payment Amount
                    সংরক্ষণ করা হবে না।
                  </p>
                </div>
              )}
            </section>

            {/* ==================================
                PAYMENT SECTION
            ================================== */}

            <section className="section-card p-4 sm:p-6">
              <div className="mb-5 flex items-center gap-3">
                <span className="icon-box">
                  <Wallet size={19} />
                </span>

                <div>
                  <h2 className="font-bold text-primary">২. পেমেন্ট পদ্ধতি</h2>

                  <p className="text-xs text-muted">
                    Payment Method & Verification
                  </p>
                </div>
              </div>

              {/* PAYMENT METHODS */}

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  ...Object.entries(PAYMENT_ACCOUNTS).map(([id, account]) => ({
                    id,
                    ...account,
                  })),

                  {
                    id: "cod",
                    label: "ক্যাশ অন ডেলিভারি",
                    color: "text-secondary",
                  },
                ].map((option) => {
                  const enabled =
                    option.id === "cod" || configuredNumber(option.number);

                  return (
                    <button
                      type="button"
                      key={option.id}
                      disabled={submitting || !enabled}
                      aria-pressed={method === option.id}
                      onClick={() => {
                        setMethod(option.id);
                        setConfirmedPayment(false);
                        setCopied(false);
                        checkoutIdRef.current = null;
                        setError("");
                      }}
                      className={`relative flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-xl border-2 p-2 text-center transition disabled:opacity-40 ${
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
                        <Truck size={21} className="text-secondary" />
                      ) : (
                        <Wallet size={21} className={option.color} />
                      )}

                      <span className="text-[11px] font-bold leading-4 text-primary">
                        {option.label}
                      </span>

                      {!enabled && (
                        <span className="text-[10px] text-muted">অনুপলব্ধ</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* CASH ON DELIVERY */}

              {isCod ? (
                <div className="mt-4 rounded-xl border border-secondary/15 bg-secondary/5 p-4">
                  <p className="flex items-center gap-2 text-sm font-bold text-primary">
                    <Phone size={17} />
                    Cash on Delivery
                  </p>

                  <p className="mt-2 text-xs leading-6 text-muted">
                    আমাদের টিম ফোনে নিশ্চিত করার পরে অর্ডার প্রস্তুত করবে। এখন
                    অগ্রিম পেমেন্ট প্রয়োজন নেই।
                  </p>
                </div>
              ) : (
                <div className="mt-4 space-y-4 rounded-xl bg-base-200/60 p-3 sm:p-4">
                  {/* RECEIVING ACCOUNT */}

                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-base-100 p-3">
                    <div>
                      <p className="text-xs text-muted">
                        {paymentAccount?.label} Personal · Send Money
                      </p>

                      <p className="mt-1 break-all text-lg font-bold text-primary">
                        {paymentAccount?.number}
                      </p>
                    </div>

                    <button
                      type="button"
                      className="badge-soft px-3 py-2"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(
                            paymentAccount.number,
                          );

                          setCopied(true);
                        } catch {
                          setError("নম্বর কপি করা যায়নি।");
                        }
                      }}
                    >
                      <Clipboard size={14} />
                      {copied ? "কপি হয়েছে" : "নম্বর কপি"}
                    </button>
                  </div>

                  {/* PAYMENT INSTRUCTIONS */}

                  <div className="flex items-start gap-2 rounded-lg bg-base-100 p-3">
                    <Info
                      size={16}
                      className="mt-0.5 shrink-0 text-secondary"
                    />

                    <p className="text-xs leading-6 text-muted">
                      উপরের Personal Number-এ{" "}
                      <strong className="text-primary">Send Money</strong> করুন।
                      এরপর আপনার Sender Number, Transaction ID এবং প্রকৃত পাঠানো
                      টাকার পরিমাণ লিখুন।
                    </p>
                  </div>

                  {/* PAYMENT FIELDS */}

                  <div className="grid gap-3 sm:grid-cols-2">
                    {/* SENDER PHONE */}

                    <label className="block text-xs font-semibold text-primary">
                      Sender Number *
                      <input
                        type="tel"
                        inputMode="numeric"
                        value={form.senderPhone}
                        maxLength={11}
                        onChange={(event) =>
                          update(
                            "senderPhone",
                            event.target.value.replace(/\D/g, "").slice(0, 11),
                          )
                        }
                        placeholder="01XXXXXXXXX"
                        className={inputClass}
                        disabled={submitting}
                      />
                    </label>

                    {/* TRANSACTION ID */}

                    <label className="block text-xs font-semibold text-primary">
                      Transaction ID *
                      <input
                        value={form.trxId}
                        maxLength={60}
                        onChange={(event) =>
                          update(
                            "trxId",
                            event.target.value.replace(/\s/g, "").slice(0, 60),
                          )
                        }
                        placeholder="TrxID"
                        className={inputClass}
                        disabled={submitting}
                      />
                    </label>

                    {/* AMOUNT */}

                    <label className="block text-xs font-semibold text-primary sm:col-span-2">
                      পাঠানো টাকার পরিমাণ (৳) *
                      <input
                        type="number"
                        inputMode="decimal"
                        min="0.01"
                        step="0.01"
                        value={form.amount}
                        onChange={(event) =>
                          update("amount", event.target.value)
                        }
                        placeholder="যেমন: 500"
                        className={inputClass}
                        disabled={submitting}
                      />
                      <span className="mt-1.5 block text-[11px] font-normal leading-5 text-muted">
                        মোবাইল ব্যাংকিংয়ে যত টাকা পাঠিয়েছেন, ঠিক সেই পরিমাণ
                        লিখুন—কম বা বেশি হলেও।
                      </span>
                    </label>
                  </div>

                  {/* PAYMENT NOTE */}

                  <label className="block text-xs font-semibold text-primary">
                    পেমেন্ট নোট (ঐচ্ছিক)
                    <input
                      value={form.paymentNote}
                      maxLength={200}
                      onChange={(event) =>
                        update("paymentNote", event.target.value)
                      }
                      placeholder="পেমেন্ট সম্পর্কে অতিরিক্ত তথ্য..."
                      className={inputClass}
                      disabled={submitting}
                    />
                  </label>

                  {/* PAYMENT DIFFERENCE */}

                  <PaymentDifferenceSummary
                    total={total}
                    paidAmount={paidAmount}
                    amountEntered={amountEntered}
                    quoteReady={quoteReady}
                  />

                  {/* VERIFICATION INFO */}

                  <div className="flex items-start gap-2 rounded-xl border border-secondary/15 bg-secondary/5 p-3">
                    <Phone
                      size={17}
                      className="mt-0.5 shrink-0 text-secondary"
                    />

                    <div>
                      <p className="text-xs font-bold text-primary">
                        পেমেন্ট যাচাই ও নিশ্চিতকরণ
                      </p>

                      <p className="mt-1 text-[11px] leading-5 text-muted">
                        সকল মোবাইল ব্যাংকিং পেমেন্ট Admin যাচাই করবেন। টাকা কম
                        বা বেশি পাঠানো হলে ফোনে আলোচনা করে পরবর্তী ব্যবস্থা
                        নিশ্চিত করা হবে।
                      </p>
                    </div>
                  </div>

                  {/* PAYMENT CONFIRMATION */}

                  <label className="flex cursor-pointer items-start gap-2.5">
                    <input
                      type="checkbox"
                      checked={confirmedPayment}
                      onChange={(event) =>
                        setConfirmedPayment(event.target.checked)
                      }
                      className="checkbox checkbox-secondary checkbox-xs mt-0.5"
                      disabled={submitting}
                    />

                    <span className="text-xs leading-5 text-primary">
                      আমি নিশ্চিত করছি, পাঠানো টাকার পরিমাণ ও Transaction ID
                      সঠিকভাবে দিয়েছি। প্রয়োজনে ফোনে পেমেন্টের বিস্তারিত নিশ্চিত
                      করব।
                    </span>
                  </label>
                </div>
              )}
            </section>
          </div>

          {/* ==================================
              RIGHT COLUMN — ORDER SUMMARY
          ================================== */}

          <aside className="min-w-0 space-y-4 lg:sticky lg:top-24">
            <section className="section-card p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-2">
                <h2 className="font-bold text-primary">অর্ডারের সারসংক্ষেপ</h2>

                <span className="badge-soft">{items.length}টি আইটেম</span>
              </div>

              {/* BUY NOW NOTICE */}

              {buyNowMode && (
                <p className="mb-4 flex items-start gap-2 rounded-lg bg-gold-soft/25 p-3 text-xs leading-5 text-primary">
                  <Zap size={15} className="shrink-0 text-secondary" />
                  Buy Now-তে শুধু নির্বাচিত পণ্যটির অর্ডার হবে। আপনার আগের
                  কার্টের পণ্যগুলো অপরিবর্তিত থাকবে।
                </p>
              )}

              {/* PRODUCT LIST */}

              <div className="max-h-96 space-y-3 overflow-y-auto pr-1">
                {items.map((item, index) => (
                  <CheckoutItem
                    key={item.cartId || `${item.productId}-${index}`}
                    item={item}
                  />
                ))}
              </div>

              {/* OPTIONAL GIFT MESSAGE */}

              {giftOptions.message && (
                <div className="mt-4 rounded-xl border border-secondary/10 bg-secondary/5 p-3">
                  <div className="flex items-start gap-2">
                    <Gift
                      size={16}
                      className="mt-0.5 shrink-0 text-secondary"
                    />

                    <div className="min-w-0">
                      <p className="text-xs font-bold text-primary">
                        আপনার শুভেচ্ছা বার্তা
                      </p>

                      <p className="mt-1 whitespace-pre-wrap break-words text-xs leading-6 text-muted">
                        {giftOptions.message}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* PRICE BREAKDOWN */}

              <div className="mt-5 space-y-3 border-t border-base-300 pt-4 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-muted">পণ্যের মূল্য</span>

                  <strong className="text-primary">{money(subtotal)}</strong>
                </div>

                <div className="flex justify-between gap-3">
                  <span className="text-muted">ডেলিভারি চার্জ</span>

                  <strong className="text-primary">
                    {districtValid ? money(delivery) : "জেলা নির্বাচন করুন"}
                  </strong>
                </div>

                <div className="rounded-xl bg-secondary/10 p-3">
                  <div className="flex justify-between gap-3">
                    <span className="font-bold text-primary">সর্বমোট</span>

                    <strong className="text-lg text-primary">
                      {money(total)}
                    </strong>
                  </div>

                  <p className="mt-1 text-[11px] text-muted">
                    {quoteReady
                      ? "Server-verified Order Total"
                      : "আনুমানিক মূল্য"}
                  </p>
                </div>

                {/* PAYMENT DIFFERENCE PREVIEW */}

                {!isCod && amountEntered && quoteReady && (
                  <div className="space-y-2 rounded-xl border border-base-300 p-3 text-xs">
                    <div className="flex justify-between gap-3">
                      <span className="text-muted">দাবিকৃত পাঠানো টাকা</span>

                      <strong className="text-primary">
                        {money(paidAmount)}
                      </strong>
                    </div>

                    {due > 0 && (
                      <div className="flex justify-between gap-3">
                        <span className="font-semibold text-amber-800">
                          বাকি টাকা
                        </span>

                        <strong className="text-amber-800">{money(due)}</strong>
                      </div>
                    )}

                    {excess > 0 && (
                      <div className="flex justify-between gap-3">
                        <span className="font-semibold text-emerald-800">
                          অতিরিক্ত টাকা
                        </span>

                        <strong className="text-emerald-700">
                          +{money(excess)}
                        </strong>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* QUOTE STATUS */}

              {quoteQuery.isFetching && (
                <p className="mt-3 flex items-center gap-2 text-xs text-secondary">
                  <Loader2 size={14} className="animate-spin" />
                  মূল্য যাচাই হচ্ছে...
                </p>
              )}

              {quoteQuery.isError && (
                <div className="mt-3 rounded-xl bg-red-50 p-3">
                  <p className="text-xs text-red-700">
                    {quoteQuery.error?.message}
                  </p>

                  <button
                    type="button"
                    onClick={() => quoteQuery.refetch()}
                    className="mt-2 inline-flex items-center gap-1 text-xs text-red-700"
                  >
                    <RefreshCw size={13} />
                    আবার যাচাই করুন
                  </button>
                </div>
              )}

              {invalidItems && (
                <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
                  অনুপলব্ধ পণ্য কার্ট থেকে সরান।
                </p>
              )}

              {/* DELIVERY CHARGES */}

              <div className="mt-4 rounded-xl bg-gold-soft/20 p-3 text-xs text-primary">
                <Truck size={15} className="mr-1 inline" />
                নরসিংদী: ৳৮০ · অন্যান্য জেলা: ৳১৩০
              </div>

              {/* ORDER SUBMISSION */}

              <button
                type="submit"
                disabled={
                  submitting ||
                  !quoteReady ||
                  invalidItems ||
                  !paymentConfigured
                }
                className="btn-brand mt-5 w-full rounded-xl py-3.5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    অর্ডার জমা হচ্ছে...
                  </>
                ) : (
                  <>
                    <LockKeyhole size={16} />
                    অর্ডার নিশ্চিত করুন
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              <p className="mt-3 text-center text-[11px] leading-5 text-muted">
                মোবাইল ব্যাংকিং পেমেন্ট Admin যাচাই করবেন। COD ও পেমেন্টের
                পার্থক্য ফোনে নিশ্চিত করা হবে।
              </p>
            </section>

            {/* DELIVERY INFORMATION */}

            <div className="section-card flex items-start gap-3 p-4">
              <span className="icon-box shrink-0">
                <Truck size={20} />
              </span>

              <div>
                <p className="text-sm font-bold text-primary">
                  যত্নশীল ডেলিভারি
                </p>

                <p className="mt-1 text-xs leading-5 text-muted">
                  অর্ডার নিশ্চিত হলে আপডেট পাবেন।
                </p>
              </div>
            </div>
          </aside>
        </form>
      </div>
    </main>
  );
}
