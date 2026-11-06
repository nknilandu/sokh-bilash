import { getAuth } from "firebase/auth";
import { app } from "../../firebase/firebase.config";
import { API_URL } from "./siteConfig";

const auth = getAuth(app);
const GUEST_TOKEN_PREFIX = "sokhbilash-guest-order-token:";

export const money = (value) => {
  const parsed = Number(value);
  const amount = Number.isFinite(parsed) ? parsed : 0;

  return `৳${new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(amount)}`;
};

// Use the same UUID when retrying a failed order request.
export function createCheckoutId() {
  if (
    typeof crypto === "undefined" ||
    typeof crypto.randomUUID !== "function"
  ) {
    throw new Error("Secure checkout requires a supported browser and HTTPS");
  }

  return crypto.randomUUID();
}

const safeKey = (identifier) => {
  if (typeof identifier !== "string" || identifier.length > 128) {
    return "";
  }

  return identifier.trim();
};

export function saveGuestOrderToken(orderId, orderNumber, token) {
  const id = safeKey(orderId);

  if (!id || typeof token !== "string" || !/^[a-f0-9]{64}$/i.test(token)) {
    return false;
  }

  try {
    sessionStorage.setItem(`${GUEST_TOKEN_PREFIX}${id}`, token);

    const number = safeKey(orderNumber);

    if (number) {
      sessionStorage.setItem(
        `${GUEST_TOKEN_PREFIX}${number.toUpperCase()}`,
        token,
      );
    }

    sessionStorage.setItem("sokhbilash-recent-guest-order", id);

    return true;
  } catch {
    return false;
  }
}

export function getGuestOrderToken(identifier) {
  const id = safeKey(identifier);

  if (!id) return "";

  try {
    return (
      sessionStorage.getItem(`${GUEST_TOKEN_PREFIX}${id}`) ||
      sessionStorage.getItem(`${GUEST_TOKEN_PREFIX}${id.toUpperCase()}`) ||
      ""
    );
  } catch {
    return "";
  }
}

export function removeGuestOrderToken(orderId, orderNumber) {
  try {
    const id = safeKey(orderId);
    const number = safeKey(orderNumber);

    if (id) {
      sessionStorage.removeItem(`${GUEST_TOKEN_PREFIX}${id}`);
    }

    if (number) {
      sessionStorage.removeItem(`${GUEST_TOKEN_PREFIX}${number.toUpperCase()}`);
    }
  } catch {
    // Browser storage may be unavailable.
  }
}

export async function orderRequest(
  path,
  { method = "GET", body, signal, orderId, accessToken } = {},
) {
  if (
    typeof path !== "string" ||
    !path.startsWith("/") ||
    path.startsWith("//")
  ) {
    throw new Error("Invalid API path");
  }

  // Wait until Firebase restores the auth session.
  if (typeof auth.authStateReady === "function") {
    await auth.authStateReady();
  }

  const headers = {
    Accept: "application/json",
  };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const user = auth.currentUser;

  if (user) {
    headers.Authorization = `Bearer ${await user.getIdToken()}`;
  }

  const token = accessToken || (orderId ? getGuestOrderToken(orderId) : "");

  if (token) {
    headers["X-Order-Access-Token"] = token;
  }

  let response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
      cache: "no-store",
      credentials: "omit",
    });
  } catch (cause) {
    if (cause?.name === "AbortError") {
      throw cause;
    }

    const error = new Error("Network error. Please check your connection.");
    error.cause = cause;
    throw error;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data?.success !== true) {
    const error = new Error(
      typeof data?.message === "string"
        ? data.message
        : `Request failed (${response.status})`,
    );

    error.status = response.status;
    error.code = data?.code;

    throw error;
  }

  return data;
}

export function getOrderView(order) {
  if (
    ["rejected", "cancelled", "payment_rejected"].includes(order?.status) ||
    order?.payment?.status === "rejected"
  ) {
    return "rejected";
  }

  if (
    ["verified", "processing", "packing", "shipped", "delivered"].includes(
      order?.status,
    )
  ) {
    return "verified";
  }

  return "confirmation";
}

export function getOrderPath(order) {
  const identifier = order?._id || order?.orderId || order?.orderNumber;

  if (typeof identifier !== "string" || !identifier.trim()) {
    throw new Error("Order identifier is missing");
  }

  return `/order-${getOrderView(order)}/${encodeURIComponent(identifier)}`;
}

export const PAYMENT_NAMES = {
  bkash: "bKash Send Money",
  nagad: "Nagad Send Money",
  rocket: "Rocket Send Money",
  cod: "Cash on Delivery",
};

export function getRecentGuestOrderId() {
  try {
    const orderId =
      sessionStorage.getItem("sokhbilash-recent-guest-order") || "";

    if (!/^[a-f0-9]{24}$/i.test(orderId) || !getGuestOrderToken(orderId)) {
      return "";
    }

    return orderId;
  } catch {
    return "";
  }
}
