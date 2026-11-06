const env = import.meta.env;

// ========================================
// SOKHBILASH CENTRAL CONFIGURATION
// ========================================

const normalizePhone = (value) =>
  String(value || "")
    .trim()
    .replace(/[^\d+]/g, "");

const normalizeWhatsApp = (value) => String(value || "").replace(/\D/g, "");

// ========================================
// BACKEND CONFIG
// ========================================

export const API_URL = env.VITE_API_URL.replace(/\/+$/, "");

// ========================================
// BUSINESS CONTACT CONFIG
// ========================================

export const CONTACT = {
  phone: normalizePhone(env.VITE_CONTACT_PHONE),

  whatsapp: normalizeWhatsApp(env.VITE_WHATSAPP_NUMBER),

  email: String(env.VITE_CONTACT_EMAIL || "").trim(),

  // Optional
  businessName: "শখবিলাস",
};

// ========================================
// CONTACT URLS
// ========================================

export const CONTACT_URLS = {
  phone: CONTACT.phone ? `tel:${CONTACT.phone}` : "",

  whatsapp: CONTACT.whatsapp ? `https://wa.me/${CONTACT.whatsapp}` : "",

  email: CONTACT.email ? `mailto:${CONTACT.email}` : "",
};

// ========================================
// WHATSAPP WITH CUSTOM MESSAGE
// ========================================

export const getWhatsAppUrl = (message = "") => {
  if (!CONTACT.whatsapp) return "";

  const baseUrl = CONTACT_URLS.whatsapp;

  return message ? `${baseUrl}?text=${encodeURIComponent(message)}` : baseUrl;
};
